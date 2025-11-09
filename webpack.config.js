const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const fs = require('fs');

// Find all blocks with index.js
const blocksDir = path.resolve(process.cwd(), 'blocks');
const blocks = fs.readdirSync(blocksDir).filter(block => {
    const blockPath = path.join(blocksDir, block);
    return fs.statSync(blockPath).isDirectory() &&
           fs.existsSync(path.join(blockPath, 'index.js'));
});

// Create entry points for all blocks
const entries = {};
blocks.forEach(block => {
    entries[`blocks/${block}/index`] = path.resolve(blocksDir, block, 'index.js');

    // Add view.js if it exists
    const viewPath = path.join(blocksDir, block, 'view.js');
    if (fs.existsSync(viewPath)) {
        entries[`blocks/${block}/view`] = viewPath;
    }
});

// Also add chart-templates if it exists
const chartTemplatesPath = path.resolve(process.cwd(), 'assets/js/chart-templates.js');
if (fs.existsSync(chartTemplatesPath)) {
    entries['assets/js/chart-templates'] = chartTemplatesPath;
}

module.exports = {
    ...defaultConfig,
    entry: entries,
    output: {
        ...defaultConfig.output,
        path: path.resolve(process.cwd(), 'build')
    }
};
