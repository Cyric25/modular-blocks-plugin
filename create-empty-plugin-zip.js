/**
 * Create Empty Plugin ZIP (without blocks)
 *
 * This script creates a ZIP file of the plugin without any blocks.
 * Users can then upload individual block ZIPs via the admin interface.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const PLUGIN_NAME = 'modular-blocks-plugin';
const VERSION = '1.0.6';
const OUTPUT_DIR = path.join(__dirname, 'plugin-zips');
const ZIP_NAME = `${PLUGIN_NAME}-empty-${VERSION}.zip`;
const ZIP_PATH = path.join(OUTPUT_DIR, ZIP_NAME);
const TEMP_DIR = `${PLUGIN_NAME}-temp`;

console.log('\nCreating Empty Plugin ZIP (without blocks)');
console.log('='.repeat(50));

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Validate required files exist
console.log('Validating plugin files...\n');

const requiredFiles = [
    { path: 'modular-blocks-plugin.php', critical: true },
    { path: 'includes', critical: true, isDir: true },
    { path: 'admin', critical: true, isDir: true },
    { path: 'assets', critical: true, isDir: true },
];

const optionalFiles = [
    { path: 'languages', isDir: true },
    { path: 'README.md' },
    { path: 'LICENSE.txt' },
    { path: 'LICENSE' },
];

let validationErrors = [];
let validationWarnings = [];

// Check required files
requiredFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
        validationErrors.push(`Missing critical ${file.isDir ? 'directory' : 'file'}: ${file.path}`);
    } else if (file.isDir) {
        const files = fs.readdirSync(file.path);
        if (files.length === 0) {
            validationWarnings.push(`Directory ${file.path}/ is empty`);
        }
    }
});

// Check optional files (just informational)
let missingOptional = [];
optionalFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
        missingOptional.push(file.path);
    }
});

if (missingOptional.length > 0) {
    console.log('ℹ️  Optional files not found (OK):');
    missingOptional.forEach(file => console.log(`   ${file}`));
    console.log('');
}

if (validationWarnings.length > 0) {
    console.log('⚠️  Warnings:');
    validationWarnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
}

if (validationErrors.length > 0) {
    console.log('❌ Validation Errors:');
    validationErrors.forEach(error => console.log(`   ${error}`));
    console.log('\n' + '='.repeat(50));
    console.error('Cannot create empty plugin ZIP due to validation errors.');
    process.exit(1);
}

console.log('✓ All required files validated successfully!\n');

// Remove old ZIP if exists
if (fs.existsSync(ZIP_PATH)) {
    console.log('Removing old ZIP file...');
    fs.unlinkSync(ZIP_PATH);
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
console.log('  ✓ Copied modular-blocks-plugin.php');

// Copy directories (core files only)
const dirsToCopy = ['includes', 'admin', 'assets'];
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDirectory(dir, path.join(TEMP_DIR, dir));
        console.log(`  ✓ Copied ${dir}/`);
    }
});

// Merge compiled assets from build/assets/ into assets/
if (fs.existsSync('build/assets')) {
    console.log('Copying compiled assets from build/...');
    const buildAssets = path.join('build', 'assets');
    const destAssets = path.join(TEMP_DIR, 'assets');
    mergeDirectory(buildAssets, destAssets);
    console.log('  ✓ Merged build/assets/ into assets/');
}

// Create empty blocks directory
fs.mkdirSync(path.join(TEMP_DIR, 'blocks'));
console.log('  ✓ Created empty blocks/ directory');

// Copy optional files
if (fs.existsSync('languages')) {
    copyDirectory('languages', path.join(TEMP_DIR, 'languages'));
    console.log('  ✓ Copied languages/');
}
if (fs.existsSync('README.md')) {
    fs.copyFileSync('README.md', path.join(TEMP_DIR, 'README.md'));
    console.log('  ✓ Copied README.md');
}

console.log('\nFiles copied. Creating ZIP archive...');

// Create ZIP archive
const output = fs.createWriteStream(ZIP_PATH);
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

output.on('close', function() {
    const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);

    // Clean up temp directory
    console.log('Cleaning up...');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    console.log('\n' + '='.repeat(50));
    console.log('✓ Empty Plugin ZIP created successfully!');
    console.log(`  File: ${ZIP_NAME}`);
    console.log(`  Location: ${OUTPUT_DIR}`);
    console.log(`  Size: ${sizeMB} MB`);
    console.log('\nThis is a base plugin without blocks.');
    console.log('Upload individual block ZIPs via:');
    console.log('  Settings → Modulare Blöcke → Block hochladen');
    console.log('='.repeat(50) + '\n');
});

archive.on('error', function(err) {
    console.error('❌ Error creating ZIP:', err.message);
    process.exit(1);
});

archive.pipe(output);
archive.directory(TEMP_DIR, PLUGIN_NAME);
archive.finalize();

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

// Helper function to merge directories (overwrites files in dest if they exist)
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
