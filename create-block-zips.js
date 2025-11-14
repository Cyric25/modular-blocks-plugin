/**
 * Create ZIP files for individual blocks
 *
 * This script creates a ZIP file for each block in the build/blocks directory.
 * Each ZIP can be uploaded individually to WordPress via the plugin's admin interface.
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const BUILD_BLOCKS_DIR = path.join(__dirname, 'build', 'blocks');
const OUTPUT_DIR = path.join(__dirname, 'plugin-zips');
const BLOCKS_DIR = path.join(__dirname, 'blocks');

console.log('\nCreating Block ZIP Files');
console.log('='.repeat(50));

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Validate build directory exists
if (!fs.existsSync(BUILD_BLOCKS_DIR)) {
    console.error('❌ Error: build/blocks directory not found!');
    console.error('   Please run "npm run build" first.');
    process.exit(1);
}

// Validate source blocks directory exists
if (!fs.existsSync(BLOCKS_DIR)) {
    console.error('❌ Error: blocks/ directory not found!');
    process.exit(1);
}

const blockDirs = fs.readdirSync(BUILD_BLOCKS_DIR).filter(file => {
    const fullPath = path.join(BUILD_BLOCKS_DIR, file);
    return fs.statSync(fullPath).isDirectory();
});

if (blockDirs.length === 0) {
    console.error('❌ No blocks found in build/blocks directory!');
    process.exit(1);
}

console.log(`Found ${blockDirs.length} blocks. Validating files...\n`);

// Validate each block has required files
let validationErrors = [];
let validationWarnings = [];

blockDirs.forEach(blockName => {
    const blockSourcePath = path.join(BLOCKS_DIR, blockName);
    const blockBuildPath = path.join(BUILD_BLOCKS_DIR, blockName);
    const blockJsonPath = path.join(blockSourcePath, 'block.json');
    const renderPhpPath = path.join(blockSourcePath, 'render.php');

    // Critical: block.json must exist
    if (!fs.existsSync(blockJsonPath)) {
        validationErrors.push(`${blockName}: Missing critical file block.json`);
    }

    // Warning: render.php is recommended for dynamic blocks
    if (!fs.existsSync(renderPhpPath)) {
        validationWarnings.push(`${blockName}: No render.php (static block)`);
    }

    // Check if build directory has any files
    if (!fs.existsSync(blockBuildPath)) {
        validationErrors.push(`${blockName}: No build files found`);
    } else {
        const buildFiles = fs.readdirSync(blockBuildPath);
        if (buildFiles.length === 0) {
            validationErrors.push(`${blockName}: Build directory is empty`);
        }
    }

    // Check for source directory existence
    if (!fs.existsSync(blockSourcePath)) {
        validationErrors.push(`${blockName}: Source directory not found in blocks/`);
    }
});

// Display validation results
if (validationWarnings.length > 0) {
    console.log('⚠️  Warnings:');
    validationWarnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
}

if (validationErrors.length > 0) {
    console.log('❌ Validation Errors:');
    validationErrors.forEach(error => console.log(`   ${error}`));
    console.log('\n' + '='.repeat(50));
    console.error('Cannot create ZIPs due to validation errors.');
    console.error('Please fix the errors above and run "npm run build" again.');
    process.exit(1);
}

console.log('✓ All blocks validated successfully!\n');

// Create ZIP for each block
let successCount = 0;
let failCount = 0;

blockDirs.forEach((blockName, index) => {
    const blockBuildPath = path.join(BUILD_BLOCKS_DIR, blockName);
    const blockSourcePath = path.join(BLOCKS_DIR, blockName);
    const zipPath = path.join(OUTPUT_DIR, `${blockName}.zip`);

    console.log(`[${index + 1}/${blockDirs.length}] Creating ${blockName}.zip...`);

    // Remove old ZIP if exists
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    // Create ZIP archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        console.log(`  ✓ Created ${blockName}.zip (${sizeKB} KB)`);
        successCount++;

        // Check if all blocks are processed
        if (successCount + failCount === blockDirs.length) {
            printSummary();
        }
    });

    archive.on('error', (err) => {
        console.error(`  ❌ Error creating ${blockName}.zip:`, err.message);
        failCount++;

        if (successCount + failCount === blockDirs.length) {
            printSummary();
        }
    });

    archive.pipe(output);

    // Add files from build/blocks/[blockname] (compiled assets)
    if (fs.existsSync(blockBuildPath)) {
        archive.directory(blockBuildPath, false);
    }

    // Add block.json and render.php from source if they exist
    const blockJsonPath = path.join(blockSourcePath, 'block.json');
    const renderPhpPath = path.join(blockSourcePath, 'render.php');

    if (fs.existsSync(blockJsonPath)) {
        archive.file(blockJsonPath, { name: 'block.json' });
    }

    if (fs.existsSync(renderPhpPath)) {
        archive.file(renderPhpPath, { name: 'render.php' });
    }

    archive.finalize();
});

function printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log(`✓ Created ${successCount} block ZIP files`);
    if (failCount > 0) {
        console.log(`❌ Failed: ${failCount} blocks`);
    }
    console.log(`\nZIP files saved to: ${OUTPUT_DIR}`);
    console.log('\nYou can now upload these ZIPs individually in WordPress:');
    console.log('  Settings → Modulare Blöcke → Block hochladen');
    console.log('='.repeat(50) + '\n');
}
