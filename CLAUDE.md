# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Modulare Blöcke Plugin** - A modular WordPress plugin that dynamically registers and manages Gutenberg blocks from folders. Each block is self-contained in its own directory without dependencies.

- **WordPress Version**: 6.0+
- **PHP Version**: 8.0+
- **Node.js**: 16+
- **Text Domain**: `modular-blocks-plugin`

## Development Commands

**CRITICAL: Always run syntax check before creating ZIPs!**

```bash
# Install dependencies
npm install

# Development with watch mode
npm start
# or
npm run dev

# Production build
npm run build

# Linting
npm run lint:js
npm run lint:css

# Testing
npm run test:unit
npm run test:e2e

# Create individual block ZIPs for distribution (RECOMMENDED)
# IMPORTANT: Always run syntax check first!
for file in *.php includes/*.php; do php -l "$file" || exit 1; done && npm run build && npm run block-zips

# ChemViz: Download vendor libraries (3Dmol.js, Plotly.js)
npm run download-libs
# or individually
npm run download-3dmol
npm run download-plotly
```

### Syntax Check (MANDATORY before ZIP creation)

**Always run before creating block ZIPs:**

```bash
# Check all PHP files for syntax errors
for file in *.php includes/*.php; do echo "Checking $file..."; php -l "$file" || exit 1; done
```

**Complete workflow (recommended):**

```bash
# 1. Syntax check all PHP files
for file in *.php includes/*.php; do php -l "$file" || exit 1; done

# 2. If no errors: Build and create block ZIPs
npm run build
npm run block-zips

# 3. Commit and push
git add .
git commit -m "Your commit message"
git push origin main
```

**Why this matters:**
- Prevents distributing broken PHP code
- Catches syntax errors in plugin main file and includes
- Ensures WordPress won't show fatal errors
- Required before every ZIP creation

**What gets checked:**
- Plugin main file: `modular-blocks-plugin.php`
- All files in `includes/` directory
- Syntax validation via `php -l`
- Exit immediately on first error (`|| exit 1`)

**If syntax error found:**
- Fix the error
- Re-run syntax check
- Only then create ZIPs

## Plugin Distribution Strategy

**IMPORTANT:** This plugin uses a **modular distribution approach**:

1. **Empty Plugin Base** (`modular-blocks-plugin-empty-1.0.6.zip`)
   - Minimal plugin shell installed once on WordPress
   - Contains only core files: plugin main file, Block Manager, Admin Manager
   - Never needs to be updated unless core functionality changes

2. **Individual Block ZIPs** (uploaded separately)
   - Each block is packaged as a standalone ZIP file
   - Upload via WordPress Admin → Einstellungen → Modulare Blöcke → Block hochladen
   - Only updated blocks need to be re-uploaded
   - Allows granular control over which blocks are installed

**After making changes to a block:**
```bash
npm run build           # Build JavaScript
npm run block-zips      # Create individual block ZIPs
# Upload only the changed block ZIP(s) to WordPress
```

**DO NOT use `npm run plugin-zip`** - Full plugin ZIPs are no longer used for distribution.

## Architecture

### Core Plugin Structure

The plugin uses a singleton pattern with a main class `ModularBlocksPlugin` in `modular-blocks-plugin.php`. It automatically loads two manager classes:

1. **ModularBlocks_Block_Manager** (`includes/class-block-manager.php`)
   - Dynamically scans `/blocks/` directory for subdirectories containing `block.json`
   - Registers blocks automatically via `register_block_type()`
   - Handles server-side rendering by looking for `render.php` in each block directory
   - Manages enabled/disabled state via WordPress options (`modular_blocks_enabled_blocks`)
   - If no blocks are explicitly enabled, all blocks are enabled by default

2. **ModularBlocks_Admin_Manager** (`includes/class-admin-manager.php`)
   - Provides admin UI at **Settings → Modulare Blöcke**
   - AJAX-based toggle system for enabling/disabling individual blocks
   - Uses WordPress nonces for security (`modular_blocks_admin`)
   - Displays block metadata from `block.json` (title, description, category)

### Block Structure

Each block must follow this directory structure:

```
blocks/my-block/
├── block.json          # Required - Block metadata (apiVersion, name, title, attributes)
├── index.js            # Optional - Editor JavaScript
├── render.php          # Optional - Server-side rendering
├── style.css           # Optional - Frontend styles
├── editor.css          # Optional - Editor-only styles
└── view.js             # Optional - Frontend interactivity
```

**Key conventions:**
- Block names use namespace `modular-blocks/*`
- All blocks use apiVersion 3
- `render.php` receives three variables: `$block_attributes`, `$block_content`, `$block_object`
- Frontend JavaScript files (view.js) handle client-side interactivity after page load
- Editor JavaScript (index.js) uses WordPress `@wordpress/blocks` API

### Existing Blocks

The plugin includes several interactive educational blocks:

**General Education Blocks:**
- **demo-card**: Simple card with title, text, button, and color customization
- **image-comparison**: Interactive before/after image slider
- **multiple-choice**: Quiz-style multiple choice questions with feedback
- **summary-block**: Expandable/collapsible content sections
- **image-overlay**: Images with clickable hotspots and info popups
- **point-of-interest**: Interactive points on images with tooltips
- **statement-connector**: Drag-and-drop matching exercise connecting statements
- **drag-the-words**: Fill-in-the-blank with draggable words
- **drag-and-drop**: General drag-and-drop sorting/categorization

**ChemViz Chemistry Blocks:**
- **molecule-viewer**: Interactive 3D molecular visualization using 3Dmol.js
  - Loads structures from PDB database, URLs, or uploaded files
  - Supports multiple display styles (stick, sphere, cartoon, line, surface)
  - Color schemes (default, carbon, spectrum, chain, secondary structure)
  - Interactive controls (rotate, zoom, spin, fullscreen)
  - Keyboard navigation support
- **chart-block**: Scientific charts and diagrams using Plotly.js
  - Predefined chemistry templates (titration curves, kinetics, phase diagrams, IR spectra, Lineweaver-Burk)
  - Custom data support via JSON
  - Interactive and responsive charts
  - Export capabilities

Most blocks have both `index.js` (editor) and `view.js` (frontend interactivity).

## Creating New Blocks

To add a new block:

1. Create a directory in `/blocks/` with a unique name
2. Add `block.json` with required metadata:
   ```json
   {
     "apiVersion": 3,
     "name": "modular-blocks/my-block",
     "title": "My Block",
     "category": "design",
     "icon": "star-filled",
     "description": "Block description",
     "attributes": {}
   }
   ```
3. The block is automatically discovered on next page load
4. Enable it in Settings → Modulare Blöcke if it doesn't auto-enable

### Dynamic Blocks with PHP

For server-rendered blocks, create `render.php`:

```php
<?php
// Available variables:
// $block_attributes - Array of block attributes
// $block_content    - Block inner content
// $block_object     - Full WP_Block object

$title = $block_attributes['title'] ?? '';
?>
<div class="wp-block-modular-blocks-my-block">
    <?php echo esc_html($title); ?>
</div>
```

### JavaScript Blocks

Use WordPress scripts with `@wordpress/scripts`:

```javascript
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('modular-blocks/my-block', {
    edit: () => <div>Editor view</div>,
    save: () => <div>Frontend view</div>
});
```

## Important Patterns

### Block Registration Flow

1. `ModularBlocksPlugin::init()` runs on WordPress `init` hook
2. `ModularBlocks_Block_Manager::register_blocks()` scans `/blocks/` directory
3. Each valid directory (contains `block.json`) is checked against enabled blocks list
4. Enabled blocks are registered via `register_block_type($block_dir, $block_data)`
5. If `render.php` exists, a render callback is automatically attached

### Admin Toggle System

The admin interface uses AJAX (`wp_ajax_modular_blocks_toggle_block`) to enable/disable blocks:
- Updates `modular_blocks_enabled_blocks` option (array of enabled block names)
- Changes take effect immediately without page reload
- Blocks are identified by directory name (e.g., "demo-card")

### Asset Enqueuing

- Global block styles can be added to `assets/css/blocks.css`
- Individual block assets are defined in `block.json` using `editorScript`, `editorStyle`, `style`, `viewScript`
- The Block Manager automatically enqueues these when `register_block_type()` is called

### Buttons mit Theme-Farben (WICHTIG!)

**Problem:** CSS-Variablen (`var(--color-ui-surface)`) in externen Stylesheets oder sogar in Inline-Styles werden oft von WordPress-Core-Styles oder anderen Plugins überschrieben. Selbst mit `!important` funktionieren CSS-Variablen nicht zuverlässig.

**Lösung:** Theme-Farben direkt in PHP mit `get_theme_mod()` holen und als Inline-Styles mit hardcoded Hex-Werten ausgeben.

```php
// In render.php - Theme-Farben aus WordPress Customizer holen
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');
$color_ui_surface_light = get_theme_mod('color_ui_surface_light', '#f5ede9');

// Button-Styles mit PHP-Variablen (NICHT CSS-Variablen!)
$button_style = 'display: inline-flex !important; align-items: center !important; ' .
                'padding: 8px 16px !important; border: none !important; border-radius: 4px !important; ' .
                'background: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'background-color: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'color: #fff !important; cursor: pointer !important; text-decoration: none !important;';

// HTML mit Inline-Styles ausgeben
echo '<button style="' . esc_attr($button_style) . '">Button Text</button>';
```

**Warum das funktioniert:**
1. `get_theme_mod()` liest die tatsächlichen Customizer-Werte aus der Datenbank
2. Inline-Styles mit hardcoded Hex-Werten haben höchste Spezifität
3. Keine Abhängigkeit von CSS-Variable-Unterstützung oder -Überschreibung
4. Fallback-Werte garantieren Funktion auch ohne Theme-Customization

**NICHT verwenden:**
```css
/* CSS-Variablen werden oft überschrieben - VERMEIDEN */
background: var(--color-ui-surface, #e24614) !important;
```

**Auch für andere Elemente anwenden:**
- Toolbar-Hintergründe: `$color_ui_surface_light`
- Hover-States: `$color_ui_surface_dark`
- Icons innerhalb von Buttons: explizit `color: #fff !important; background: transparent !important;`
- Text-Spans innerhalb von Buttons: explizit stylen, nicht vererben lassen

### Iframe Sandbox-Attribut (WICHTIG!)

**Problem:** Das `sandbox`-Attribut auf iframes blockiert viele Funktionen wie PDF-Export, Downloads, und andere JavaScript-Features - selbst mit vielen `allow-*` Werten.

**Lösung für whitelisted/vertrauenswürdige URLs:** Kein `sandbox`-Attribut verwenden!

```php
// NICHT verwenden für vertrauenswürdige URLs:
// $sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads';
// 'sandbox' => $sandbox,

// Stattdessen: Kein sandbox-Attribut
$iframe_attrs = [
    'src' => esc_url($url),
    'class' => 'iframe-whitelist-frame',
    'loading' => 'lazy',
    // KEIN 'sandbox' => ...
];
```

**Begründung:**
- URLs sind bereits durch Whitelist geprüft = vertrauenswürdig
- `sandbox` mit allen `allow-*` Werten funktioniert trotzdem nicht zuverlässig
- PDF-Export, Downloads, komplexe JavaScript-Apps brauchen volle Berechtigungen
- Sicherheit wird durch die Whitelist gewährleistet, nicht durch sandbox

## Security Considerations

- All admin functions check `current_user_can('manage_options')`
- AJAX requests validate nonces with `check_ajax_referer()`
- User inputs are sanitized with `sanitize_text_field()`, `esc_html()`, `esc_attr()`, `esc_url()`
- Direct file access prevented with `if (!defined('ABSPATH')) exit;`
- Block attributes should define `type` and use WordPress sanitization

## WordPress Standards

- Follow WordPress PHP Coding Standards
- Use WordPress function prefixes to avoid conflicts
- Hooks are registered via the Loader pattern
- Translations ready with `__()`, `_e()`, and text domain `modular-blocks-plugin`
- Plugin constants: `MODULAR_BLOCKS_PLUGIN_VERSION`, `MODULAR_BLOCKS_PLUGIN_URL`, `MODULAR_BLOCKS_PLUGIN_PATH`

## ChemViz Integration

### External Libraries

ChemViz blocks require external JavaScript libraries for 3D visualization and charting:

**3Dmol.js** (v2.0.3+)
- License: BSD-3-Clause
- Used by: `molecule-viewer` block
- Location: `assets/js/vendor/3Dmol-min.js` or CDN
- Documentation: https://3dmol.csb.pitt.edu/doc/

**Plotly.js** (v2.27.1+)
- License: MIT
- Used by: `chart-block`
- Location: `assets/js/vendor/plotly-2.27.1.min.js` or CDN
- Documentation: https://plotly.com/javascript/

**Chart Templates** (custom)
- Location: `assets/js/chart-templates.js`
- Predefined chemistry chart configurations (titration, kinetics, phase diagrams, IR spectra, Lineweaver-Burk)

### Asset Loading Strategy

The plugin uses conditional loading via `ModularBlocks_ChemViz_Enqueue` class:
- Libraries are only loaded when their respective blocks are present on the page
- Uses `has_block()` to detect block presence
- Falls back to CDN if local files are not found
- Filter `modular_blocks_use_cdn` can force CDN usage

### ChemViz Shortcodes

Two shortcodes are available for backward compatibility and flexible content integration:

**Molecule Viewer Shortcode:**
```php
[chemviz_molecule pdb="1YCR" style="cartoon" color="spectrum" width="800" height="600"]
[chemviz_molecule url="/path/to/structure.pdb" controls="true" spin="false"]
```

**Chart Shortcode:**
```php
[chemviz_chart template="titration"]
[chemviz_chart type="scatter" data='[{"x":[1,2,3],"y":[4,5,6]}]' title="Custom Chart"]
```

Implementation in `includes/class-chemviz-shortcodes.php`.

### Example Structures

Sample molecule files are provided in `assets/structures/`:
- `water.pdb` - H₂O (simple example)
- `ethanol.pdb` - C₂H₆O (organic molecule)

Users can upload their own PDB, SDF, MOL, XYZ, or CIF files via WordPress Media Library.

### ChemViz Block Architecture

**molecule-viewer Block:**
- `view.js` handles 3D rendering with lazy loading via IntersectionObserver
- Stores viewer instances in a Map for cleanup and control
- Keyboard navigation: Arrow keys (rotate), +/- (zoom), R (reset)
- Fullscreen API support with vendor prefixes
- ARIA labels for accessibility

**chart-block:**
- `view.js` initializes Plotly charts with template or custom data
- Responsive resizing with debounced handler
- Template system loads predefined chemistry diagrams
- Plotly configuration allows interactive features (zoom, pan, export)

## Development Notes

- The plugin uses verbose error logging in `class-block-manager.php` (check `/wp-content/debug.log` if WP_DEBUG is enabled)
- Block discovery happens on every `init` hook - no caching
- Admin interface instantiates a fresh Block_Manager to get current block list
- ChemViz libraries can be downloaded via npm scripts or will fall back to CDN
- For production, download libraries locally with `npm run download-libs` to ensure GDPR compliance and offline functionality
