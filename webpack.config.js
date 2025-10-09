const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const glob = require('glob');

// Find all src/index.jsx files in blocks
const entries = {};
const blocks = glob.sync('./blocks/*/src/index.jsx');

blocks.forEach((blockPath) => {
	const blockName = blockPath.match(/blocks\/([^/]+)\//)[1];
	entries[`${blockName}/index`] = path.resolve(__dirname, blockPath);
});

module.exports = {
	...defaultConfig,
	entry: entries,
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build/blocks'),
		filename: '[name].js',
	},
};
