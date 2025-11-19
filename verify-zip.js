const fs = require('fs');
const AdmZip = require('adm-zip');

const ZIP_NAME = 'modular-blocks-plugin-1.0.0.zip';

console.log(`Verifying ZIP: ${ZIP_NAME}\n`);

try {
    // Try using adm-zip if available
    const zip = new AdmZip(ZIP_NAME);
    const entries = zip.getEntries();

    const htmlSandboxFiles = entries
        .filter(entry => entry.entryName.includes('html-sandbox'))
        .map(entry => entry.entryName);

    console.log(`Found ${htmlSandboxFiles.length} html-sandbox files:\n`);
    htmlSandboxFiles.forEach(file => console.log(`  - ${file}`));

    // Check for critical files
    const criticalFiles = [
        'modular-blocks-plugin/blocks/html-sandbox/block.json',
        'modular-blocks-plugin/blocks/html-sandbox/render.php',
        'modular-blocks-plugin/blocks/html-sandbox/index.js',
        'modular-blocks-plugin/blocks/html-sandbox/view.js',
        'modular-blocks-plugin/blocks/html-sandbox/index.css',
        'modular-blocks-plugin/blocks/html-sandbox/style-index.css'
    ];

    console.log('\nCritical files check:');
    criticalFiles.forEach(file => {
        const found = entries.some(entry => entry.entryName === file);
        console.log(`  ${found ? '✓' : '✗'} ${file}`);
    });

} catch (e) {
    console.log('adm-zip not available, trying archiver...');
    console.log('\nZIP file exists and has size:', fs.statSync(ZIP_NAME).size, 'bytes');
    console.log('You can manually extract and verify the contents.');
}
