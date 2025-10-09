# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a modular WordPress Gutenberg block plugin that dynamically discovers and registers blocks from the `/blocks/` directory. It features an admin interface for managing blocks and includes specialized chemistry visualization blocks (ChemViz).

**Language:** German (German text in UI, comments, and documentation)

## Architecture

### Core Components

**Main Plugin File:** `modular-blocks-plugin.php`
- Singleton pattern via `ModularBlocksPlugin::get_instance()`
- Loads two main manager classes: Block_Manager and Admin_Manager
- Conditionally loads ChemViz integration classes if they exist

**Block Manager:** `includes/class-block-manager.php`
- Scans `/blocks/` directory for subdirectories containing `block.json`
- Dynamically registers blocks using WordPress `register_block_type()`
- **Important:** Calls `register_blocks()` directly in `init()` method, not via hook (since the main plugin already hooks into WordPress `init`)
- Handles both static blocks (editor-only) and dynamic blocks (with `render.php`)
- Manages block enable/disable state via `modular_blocks_enabled_blocks` option
- If no blocks are explicitly enabled, all blocks are enabled by default
- Registers custom "Custom Blocks" category (slug: `custom-blocks`) via `block_categories_all` filter

**Admin Manager:** `includes/class-admin-manager.php`
- Provides Settings → Modulare Blöcke admin page
- Displays all available blocks in card grid with toggle switches
- AJAX handler for enabling/disabling individual blocks via `wp_ajax_modular_blocks_toggle_block`

**ChemViz Integration:** `includes/class-chemviz-enqueue.php`
- Conditionally enqueues large vendor libraries (3Dmol.js, Plotly.js) only on pages that use molecule-viewer or chart-block
- Uses CDN or local fallback based on `modular_blocks_use_cdn` filter
- Automatically loads libraries in block editor for previews

### Block Structure

Each block lives in `/blocks/<block-name>/` with:
- **Required:** `block.json` - Block metadata (apiVersion 3)
- **Optional:** `render.php` - Server-side rendering for dynamic blocks
- **Optional:** `index.js` - Block editor script (React/JSX)
- **Optional:** `view.js` - Frontend interactive script
- **Optional:** `style.css` - Frontend styles
- **Optional:** `editor.css` - Editor-only styles

Built blocks are output to `/build/blocks/<block-name>/` with webpack-generated `.asset.php` dependency files.

**IMPORTANT:** For blocks with a build directory, `block.json` must be copied to `/build/blocks/<block-name>/` for WordPress to properly register and load the block's JavaScript assets. The Block Manager automatically uses the build directory if it exists.

### Dynamic Block Rendering

When `render.php` exists, the Block Manager:
1. Sets up a render callback that includes the file
2. Provides these variables to `render.php`:
   - `$block_attributes` - Block attributes array
   - `$block_content` - Inner block content
   - `$block_object` - WP_Block instance
3. Captures output via `ob_start()` / `ob_get_clean()`

Render templates should:
- Escape all output (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`)
- Generate unique block IDs using `wp_unique_id()`
- Embed configuration in `data-*` attributes as JSON for frontend JS
- Initialize via inline script that checks for global init function

### Interactive Blocks

Complex interactive blocks (drag-and-drop, drag-the-words, multiple-choice, etc.):
- Use `view.js` for frontend interactivity
- Store configuration in `data-*` attributes on the root element
- Initialize with inline script in `render.php` that calls global init function
- Follow pattern: Check DOM ready → Find block element → Call `window.init<BlockName>(element)`

## Development Commands

Build system uses webpack to compile blocks from `/blocks/` to `/build/blocks/`.

**After building blocks, you MUST copy block.json to the build directory:**
```bash
# Copy block.json files after building
for dir in build/blocks/*/; do
  block_name=$(basename "$dir")
  cp "blocks/$block_name/block.json" "$dir/block.json"
done
```

To develop new blocks:
```bash
# Create new block with WordPress tooling
npx @wordpress/create-block <block-name> --no-plugin

# Move to blocks directory
# Build with your build tool
# Copy block.json to build directory
```

## Key Patterns

**Adding a New Block:**
1. Create `/blocks/<block-name>/` directory
2. Add `block.json` with `name: "modular-blocks/<block-name>"`
3. Optionally add `render.php` for server-side rendering
4. Block is automatically discovered and appears in admin interface
5. Enable block via Settings → Modulare Blöcke

**Block Naming Convention:**
- Namespace: `modular-blocks/`
- Examples: `modular-blocks/demo-card`, `modular-blocks/molecule-viewer`

**Data Flow for Interactive Blocks:**
1. User configures block in editor → attributes saved to post
2. Frontend render: `render.php` outputs HTML with `data-*` config
3. Inline script initializes: `window.init<Block>(element)`
4. View script reads `data-*`, attaches event handlers, manages state

**Security:**
- All attributes sanitized in `render.php`
- AJAX handlers use nonces and capability checks
- No user input directly output without escaping

## Specialized Features

**ChemViz Blocks:**
- `molecule-viewer` - 3D molecular structure viewer using 3Dmol.js
- `chart-block` - Scientific charts using Plotly.js with chemistry templates (titration, kinetics, phase diagrams, Lineweaver-Burk, IR spectra)

**Template System:**
The chart-block supports predefined templates via `chartTemplate` attribute:
- `titration` - Acid-base titration curves
- `kinetics` - Reaction kinetics
- `phase` - Phase diagrams
- `lineweaver` - Lineweaver-Burk plots
- `ir` - IR spectroscopy

Templates are defined in `assets/js/chart-templates.js`.

## WordPress Integration

**Requirements:**
- WordPress 6.0+
- PHP 8.0+

**Plugin Constants:**
- `MODULAR_BLOCKS_PLUGIN_VERSION` - Current version
- `MODULAR_BLOCKS_PLUGIN_URL` - Plugin directory URL
- `MODULAR_BLOCKS_PLUGIN_PATH` - Plugin directory path
- `MODULAR_BLOCKS_PLUGIN_BASENAME` - Plugin basename

**Options:**
- `modular_blocks_enabled_blocks` - Array of enabled block names (stored as directory names)

**Text Domain:** `modular-blocks-plugin`

## Debugging

Enable WordPress debug mode to see error logging from Block Manager:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

The plugin only logs errors:
- Missing or invalid `block.json` files
- Block registration failures
- Render callback errors

Check `/wp-content/debug.log` for errors.

**Important Hook Timing Issue:**
The Block Manager must call `register_blocks()` directly in its `init()` method, NOT register it on the `init` hook again. The main plugin already hooks into WordPress `init`, so adding another `init` hook inside would be too late (the hook would have already fired).
