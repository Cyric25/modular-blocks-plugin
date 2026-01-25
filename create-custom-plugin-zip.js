/**
 * Create Custom Plugin ZIP with Selected Blocks
 *
 * Usage: node create-custom-plugin-zip.js [block1] [block2] ...
 * Example: node create-custom-plugin-zip.js html-sandbox iframe-whitelist image-comparison
 *
 * If no blocks specified, creates framework-only ZIP.
 * Use --all to include all blocks.
 * Use --preserve to create an update ZIP that won't overwrite existing blocks.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const PLUGIN_DIR = __dirname;
const OUTPUT_DIR = path.join(PLUGIN_DIR, 'plugin-zips');

// Core files that are always included
const CORE_FILES = [
    'modular-blocks-plugin.php',
    'README.md'
];

const CORE_DIRS = [
    'includes',
    'admin',
    'assets',
    'languages'
];

// Parse command line arguments
const args = process.argv.slice(2);
const includeAll = args.includes('--all');
const preserveMode = args.includes('--preserve');
const blockArgs = args.filter(arg => !arg.startsWith('--'));

// Get available blocks
function getAvailableBlocks() {
    const blocksDir = path.join(PLUGIN_DIR, 'blocks');
    if (!fs.existsSync(blocksDir)) return [];

    return fs.readdirSync(blocksDir).filter(name => {
        const blockPath = path.join(blocksDir, name);
        const blockJson = path.join(blockPath, 'block.json');
        return fs.statSync(blockPath).isDirectory() && fs.existsSync(blockJson);
    });
}

// Main function
async function createCustomZip() {
    console.log('\n========================================');
    console.log('Creating Custom Plugin ZIP');
    console.log('========================================\n');

    const availableBlocks = getAvailableBlocks();

    // Determine which blocks to include
    let selectedBlocks = [];

    if (includeAll) {
        selectedBlocks = availableBlocks;
        console.log('Including ALL blocks.\n');
    } else if (blockArgs.length > 0) {
        // Validate block names
        for (const block of blockArgs) {
            if (availableBlocks.includes(block)) {
                selectedBlocks.push(block);
            } else {
                console.warn(`Warning: Block "${block}" not found. Skipping.`);
            }
        }
    }

    if (selectedBlocks.length === 0 && !includeAll && blockArgs.length === 0) {
        console.log('No blocks specified. Creating framework-only ZIP.\n');
        console.log('Available blocks:');
        availableBlocks.forEach(b => console.log(`  - ${b}`));
        console.log('\nUsage: node create-custom-plugin-zip.js [block1] [block2] ...');
        console.log('       node create-custom-plugin-zip.js --all');
        console.log('');
    }

    // Generate output filename
    let zipName;
    if (preserveMode) {
        zipName = 'modular-blocks-plugin-framework-update.zip';
    } else if (selectedBlocks.length === 0) {
        zipName = 'modular-blocks-plugin-empty-1.0.6.zip';
    } else if (selectedBlocks.length === availableBlocks.length) {
        zipName = 'modular-blocks-plugin-full.zip';
    } else {
        zipName = 'modular-blocks-plugin-custom.zip';
    }

    const outputPath = path.join(OUTPUT_DIR, zipName);

    // Remove existing file
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    // Create ZIP
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);

        console.log('\n========================================');
        console.log(`✓ ZIP created: ${zipName}`);
        console.log(`  Size: ${sizeMB} MB (${sizeKB} KB)`);
        console.log(`  Location: ${OUTPUT_DIR}`);

        if (selectedBlocks.length > 0) {
            console.log(`\n  Included blocks (${selectedBlocks.length}):`);
            selectedBlocks.forEach(b => console.log(`    - ${b}`));
        }

        if (preserveMode) {
            console.log('\n  PRESERVE MODE: blocks/ directory not included.');
            console.log('  Existing blocks on server will be kept.');
        }

        console.log('========================================\n');
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Add core files
    console.log('Adding core files...');
    for (const file of CORE_FILES) {
        const filePath = path.join(PLUGIN_DIR, file);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
            console.log(`  ✓ ${file}`);
        }
    }

    // Add core directories
    for (const dir of CORE_DIRS) {
        const dirPath = path.join(PLUGIN_DIR, dir);
        if (fs.existsSync(dirPath)) {
            archive.directory(dirPath, dir);
            console.log(`  ✓ ${dir}/`);
        }
    }

    // Add build assets
    const buildAssetsPath = path.join(PLUGIN_DIR, 'build', 'assets');
    if (fs.existsSync(buildAssetsPath)) {
        archive.directory(buildAssetsPath, 'assets', { prefix: 'assets' });
    }

    // Add blocks (unless preserve mode)
    if (!preserveMode) {
        if (selectedBlocks.length > 0) {
            console.log('\nAdding selected blocks...');
            for (const block of selectedBlocks) {
                const blockPath = path.join(PLUGIN_DIR, 'blocks', block);
                archive.directory(blockPath, `blocks/${block}`);
                console.log(`  ✓ blocks/${block}/`);
            }
        } else {
            // Create empty blocks directory
            archive.append('', { name: 'blocks/.gitkeep' });
            console.log('  ✓ blocks/ (empty)');
        }
    }

    await archive.finalize();
}

// Run
createCustomZip().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
