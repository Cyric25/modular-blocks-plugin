/**
 * Copy block.json, view.js, and style.css files from source blocks to build directory
 *
 * This script ensures that all necessary files are copied to the build directory
 * after webpack compiles the block scripts. WordPress requires these files to be
 * present in the same directory as the compiled assets for proper block registration.
 */

const fs = require('fs');
const path = require('path');

const blocksDir = path.join(__dirname, '../blocks');
const buildDir = path.join(__dirname, '../build/blocks');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
    console.log('Build directory does not exist. Skipping file copy.');
    process.exit(0);
}

// Get all block directories
const blockDirs = fs.readdirSync(blocksDir).filter(file => {
    const fullPath = path.join(blocksDir, file);
    return fs.statSync(fullPath).isDirectory();
});

let copiedCount = 0;
let errorCount = 0;

// Files to copy for each block
const filesToCopy = ['block.json', 'render.php'];
const srcFilesToCopy = ['style.css', 'editor.css'];

blockDirs.forEach(blockName => {
    const targetDir = path.join(buildDir, blockName);

    // Check if target directory exists (block was built)
    if (!fs.existsSync(targetDir)) {
        console.log(`ℹ️  Skipping ${blockName} (no build directory)`);
        return;
    }

    let blockCopied = 0;

    // Copy files from block root
    filesToCopy.forEach(fileName => {
        const sourceFile = path.join(blocksDir, blockName, fileName);
        const targetFile = path.join(targetDir, fileName);

        // Only copy if source file exists
        if (fs.existsSync(sourceFile)) {
            try {
                fs.copyFileSync(sourceFile, targetFile);
                blockCopied++;
            } catch (error) {
                console.error(`✗ Error copying ${fileName} for ${blockName}:`, error.message);
                errorCount++;
            }
        }
    });

    // Copy files from src directory
    srcFilesToCopy.forEach(fileName => {
        const sourceFile = path.join(blocksDir, blockName, 'src', fileName);
        const targetFile = path.join(targetDir, fileName);

        // Only copy if source file exists
        if (fs.existsSync(sourceFile)) {
            try {
                fs.copyFileSync(sourceFile, targetFile);
                blockCopied++;
            } catch (error) {
                console.error(`✗ Error copying ${fileName} from src for ${blockName}:`, error.message);
                errorCount++;
            }
        }
    });

    if (blockCopied > 0) {
        console.log(`✓ Copied ${blockCopied} file(s) for ${blockName}`);
        copiedCount++;
    }
});

console.log(`\n📦 Block files copy complete: ${copiedCount} blocks processed, ${errorCount} errors`);

if (errorCount > 0) {
    process.exit(1);
}
