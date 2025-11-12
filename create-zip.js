const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLUGIN_NAME = 'modular-blocks-plugin';
const VERSION = '1.0.0';
const ZIP_NAME = `${PLUGIN_NAME}-${VERSION}.zip`;
const TEMP_DIR = PLUGIN_NAME;

console.log(`Creating WordPress Plugin ZIP: ${ZIP_NAME}`);
console.log('='.repeat(50));

// Remove old ZIP if exists
if (fs.existsSync(ZIP_NAME)) {
    console.log('Removing old ZIP file...');
    fs.unlinkSync(ZIP_NAME);
}

// Remove old temp directory if exists
if (fs.existsSync(TEMP_DIR)) {
    console.log('Removing old temp directory...');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

console.log('Creating temporary directory...');
fs.mkdirSync(TEMP_DIR);

console.log('Copying plugin files...');

// Copy main PHP file
fs.copyFileSync('modular-blocks-plugin.php', path.join(TEMP_DIR, 'modular-blocks-plugin.php'));

// Copy directories (excluding build/ which will be merged into blocks/)
const dirsToCopy = ['includes', 'admin', 'assets'];
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDirectory(dir, path.join(TEMP_DIR, dir));
        console.log(`  ✓ Copied ${dir}/`);
    }
});

// Copy compiled assets from build/assets/
if (fs.existsSync('build/assets')) {
    console.log('Copying compiled assets from build/...');
    const buildAssets = path.join('build', 'assets');
    const destAssets = path.join(TEMP_DIR, 'assets');

    // Merge build/assets/ into assets/
    mergeDirectory(buildAssets, destAssets);
    console.log('  ✓ Merged build/assets/ into assets/');
}

// Copy blocks directory (selective)
console.log('Copying blocks directory...');
fs.mkdirSync(path.join(TEMP_DIR, 'blocks'));

const blocksDir = 'blocks';
const blocks = fs.readdirSync(blocksDir);

blocks.forEach(blockName => {
    const blockPath = path.join(blocksDir, blockName);
    const stat = fs.statSync(blockPath);

    if (stat.isDirectory()) {
        const destPath = path.join(TEMP_DIR, 'blocks', blockName);
        fs.mkdirSync(destPath);

        // Copy block.json and render.php from source
        const sourceFiles = ['block.json', 'render.php'];
        sourceFiles.forEach(file => {
            const srcFile = path.join(blockPath, file);
            if (fs.existsSync(srcFile)) {
                fs.copyFileSync(srcFile, path.join(destPath, file));
            }
        });

        // Copy compiled files from build/blocks/
        const buildBlockPath = path.join('build', 'blocks', blockName);
        if (fs.existsSync(buildBlockPath)) {
            const buildFiles = fs.readdirSync(buildBlockPath);
            buildFiles.forEach(file => {
                const srcFile = path.join(buildBlockPath, file);
                const destFile = path.join(destPath, file);
                fs.copyFileSync(srcFile, destFile);
            });
        }

        console.log(`  ✓ Copied ${blockName}`);
    }
});

// Copy optional files
if (fs.existsSync('languages')) {
    copyDirectory('languages', path.join(TEMP_DIR, 'languages'));
}
if (fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join(TEMP_DIR, 'README.md'));
}
if (fs.existsSync('LICENSE.txt')) {
    fs.copyFileSync('LICENSE.txt', path.join(TEMP_DIR, 'LICENSE.txt'));
} else if (fs.existsSync('LICENSE')) {
    fs.copyFileSync('LICENSE', path.join(TEMP_DIR, 'LICENSE'));
}

console.log('\nFiles copied. Creating ZIP archive...');

// Try different methods to create ZIP
let zipCreated = false;

// Try using archiver (Node.js solution that works cross-platform)
try {
    const archiver = require('archiver');
    const output = fs.createWriteStream(ZIP_NAME);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function() {
        const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
        console.log('\n' + '='.repeat(50));
        console.log('✓ Plugin ZIP created successfully!');
        console.log(`  File: ${ZIP_NAME}`);
        console.log(`  Size: ${sizeMB} MB`);
        console.log('\nYou can now upload this ZIP file to WordPress:');
        console.log('  Plugins → Add New → Upload Plugin');
        console.log('='.repeat(50));
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);
    archive.directory(TEMP_DIR, PLUGIN_NAME);
    archive.finalize();
    zipCreated = true;

} catch (e) {
    console.log('Node archiver not available, trying PowerShell...');

    // Fallback to PowerShell Compress-Archive
    try {
        execSync(`powershell -Command "Compress-Archive -Path '${TEMP_DIR}' -DestinationPath '${ZIP_NAME}' -Force"`, { stdio: 'inherit' });
        zipCreated = true;
    } catch (e2) {
        console.log('PowerShell Compress-Archive failed, trying 7zip...');

        // Try 7zip
        try {
            execSync(`7z a -tzip "${ZIP_NAME}" "${TEMP_DIR}"`, { stdio: 'inherit' });
            zipCreated = true;
        } catch (e3) {
            console.error('Could not create ZIP. Please run: npm install archiver');
        }
    }
}

// Clean up temp directory after a delay (for archiver to finish reading)
setTimeout(() => {
    if (fs.existsSync(TEMP_DIR)) {
        console.log('Cleaning up...');
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    // Show success message if not using archiver (archiver shows it in the close event)
    if (zipCreated && fs.existsSync(ZIP_NAME) && !require.cache[require.resolve('archiver')]) {
        const stats = fs.statSync(ZIP_NAME);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n' + '='.repeat(50));
        console.log('✓ Plugin ZIP created successfully!');
        console.log(`  File: ${ZIP_NAME}`);
        console.log(`  Size: ${sizeMB} MB`);
        console.log('\nYou can now upload this ZIP file to WordPress:');
        console.log('  Plugins → Add New → Upload Plugin');
        console.log('='.repeat(50));
    } else if (!zipCreated) {
        console.error('\n❌ Failed to create ZIP file');
    }
}, 3000);

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper function to merge directory (overwrites existing files)
function mergeDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            mergeDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
