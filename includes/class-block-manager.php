<?php
/**
 * Block Manager Class
 *
 * Handles dynamic block registration and management
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_Block_Manager {

    private $blocks_path;
    private $enabled_blocks;

    public function __construct() {
        $this->blocks_path = MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/';
        $this->enabled_blocks = get_option('modular_blocks_enabled_blocks', []);
    }

    public function init() {
        // Register blocks immediately - we're already in the init hook
        $this->register_blocks();
        add_action('enqueue_block_assets', [$this, 'enqueue_block_assets']);
    }

    /**
     * Dynamically discover and register blocks from the blocks directory
     */
    public function register_blocks() {
        error_log('Modular Blocks Plugin: Starting block registration...');

        $block_directories = $this->scan_block_directories();
        error_log('Modular Blocks Plugin: Found ' . count($block_directories) . ' block directories');

        foreach ($block_directories as $block_dir) {
            $block_name = basename($block_dir);
            error_log("Modular Blocks Plugin: Processing block: {$block_name}");

            // Check if block is enabled in admin settings
            if (!$this->is_block_enabled($block_name)) {
                error_log("Modular Blocks Plugin: Block {$block_name} is disabled, skipping");
                continue;
            }

            error_log("Modular Blocks Plugin: Registering block: {$block_name}");
            $this->register_single_block($block_dir, $block_name);
        }

        error_log('Modular Blocks Plugin: Block registration completed');
    }

    /**
     * Scan the blocks directory for available blocks
     */
    private function scan_block_directories() {
        error_log("Modular Blocks Plugin: Scanning blocks path: {$this->blocks_path}");

        if (!is_dir($this->blocks_path)) {
            error_log("Modular Blocks Plugin: Blocks path does not exist: {$this->blocks_path}");
            return [];
        }

        $directories = [];
        $items = scandir($this->blocks_path);
        error_log('Modular Blocks Plugin: Found items in blocks directory: ' . implode(', ', $items));

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $full_path = $this->blocks_path . $item;
            error_log("Modular Blocks Plugin: Checking item: {$item} at path: {$full_path}");

            if (is_dir($full_path) && $this->is_valid_block_directory($full_path)) {
                error_log("Modular Blocks Plugin: Valid block directory found: {$item}");
                $directories[] = $full_path;
            } else {
                error_log("Modular Blocks Plugin: Invalid block directory: {$item}");
            }
        }

        error_log('Modular Blocks Plugin: Valid block directories: ' . implode(', ', array_map('basename', $directories)));
        return $directories;
    }

    /**
     * Check if directory contains a valid block structure
     */
    private function is_valid_block_directory($dir) {
        $block_json = $dir . '/block.json';
        return file_exists($block_json);
    }

    /**
     * Register a single block
     */
    private function register_single_block($block_dir, $block_name) {
        $block_json_path = $block_dir . '/block.json';
        error_log("Modular Blocks Plugin: Attempting to register block from: {$block_json_path}");

        if (!file_exists($block_json_path)) {
            error_log("Modular Blocks Plugin: block.json not found for {$block_name}");
            return;
        }

        try {
            // For production (installed plugin): All compiled files are in blocks/* directory
            // For development: Check if build directory exists
            $build_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'build/blocks/' . basename($block_dir);
            $use_build_dir = is_dir($build_dir);

            if ($use_build_dir) {
                error_log("Modular Blocks Plugin: Using build directory for {$block_name}");
                // Development mode - read block.json and override with build paths
                $block_data = json_decode(file_get_contents($block_json_path), true);

                if (!$block_data) {
                    error_log("Modular Blocks Plugin: Invalid block.json in {$block_name}");
                    return;
                }

                // Set up render callback for dynamic blocks
                $render_file = $block_dir . '/render.php';
                if (file_exists($render_file)) {
                    $block_data['render_callback'] = function($attributes, $content, $block) use ($render_file, $block_name) {
                        return $this->render_dynamic_block($render_file, $attributes, $content, $block, $block_name);
                    };
                }

                // Override asset paths with build versions
                $build_url = MODULAR_BLOCKS_PLUGIN_URL . 'build/blocks/' . basename($block_dir);
                $block_slug = basename($block_dir);

                // Register scripts and styles from build directory
                $this->register_block_assets_from_build($block_data, $build_dir, $build_url, $block_slug);

                // Register with modified data
                $result = register_block_type($block_dir, $block_data);

            } else {
                error_log("Modular Blocks Plugin: Using production mode for {$block_name} (no build dir)");
                // Production mode - WordPress will automatically load assets from block directory
                // Just need to add render callback if render.php exists
                $args = [];

                $render_file = $block_dir . '/render.php';
                if (file_exists($render_file)) {
                    error_log("Modular Blocks Plugin: Setting up render callback for {$block_name}");
                    $args['render_callback'] = function($attributes, $content, $block) use ($render_file, $block_name) {
                        return $this->render_dynamic_block($render_file, $attributes, $content, $block, $block_name);
                    };
                }

                // Register block - WordPress will automatically load block.json and assets
                $result = register_block_type($block_dir, $args);
            }

            if ($result) {
                error_log("Modular Blocks Plugin: Successfully registered block: {$block_name}");
            } else {
                error_log("Modular Blocks Plugin: Failed to register block: {$block_name}");
            }

        } catch (Exception $e) {
            error_log("Modular Blocks Plugin: Error registering block {$block_name}: " . $e->getMessage());
        }
    }

    /**
     * Register block assets from build directory (development mode)
     */
    private function register_block_assets_from_build(&$block_data, $build_dir, $build_url, $block_slug) {
        // Register viewScript from build if it exists
        if (isset($block_data['viewScript']) && strpos($block_data['viewScript'], 'file:') === 0) {
            $view_file = str_replace('file:./', '', $block_data['viewScript']);
            $build_view = $build_dir . '/' . $view_file;

            if (file_exists($build_view)) {
                $handle = 'modular-blocks-' . $block_slug . '-view-script';
                $asset_file = str_replace('.js', '.asset.php', $build_view);
                $asset_data = file_exists($asset_file) ? include($asset_file) : ['dependencies' => [], 'version' => filemtime($build_view)];

                wp_register_script(
                    $handle,
                    $build_url . '/' . $view_file,
                    $asset_data['dependencies'],
                    $asset_data['version'],
                    true
                );

                $block_data['viewScript'] = $handle;
            }
        }

        // Register editorScript from build if it exists
        if (isset($block_data['editorScript']) && strpos($block_data['editorScript'], 'file:') === 0) {
            $editor_file = str_replace('file:./', '', $block_data['editorScript']);
            $build_editor = $build_dir . '/' . $editor_file;

            if (file_exists($build_editor)) {
                $handle = 'modular-blocks-' . $block_slug . '-editor-script';
                $asset_file = str_replace('.js', '.asset.php', $build_editor);
                $asset_data = file_exists($asset_file) ? include($asset_file) : ['dependencies' => [], 'version' => filemtime($build_editor)];

                wp_register_script(
                    $handle,
                    $build_url . '/' . $editor_file,
                    $asset_data['dependencies'],
                    $asset_data['version'],
                    true
                );

                $block_data['editorScript'] = $handle;
            }
        }

        // Register style from build if it exists
        if (isset($block_data['style']) && strpos($block_data['style'], 'file:') === 0) {
            // Webpack compiles style.css to style-index.css
            $build_style = $build_dir . '/style-index.css';

            if (file_exists($build_style)) {
                $handle = 'modular-blocks-' . $block_slug . '-style';

                wp_register_style(
                    $handle,
                    $build_url . '/style-index.css',
                    [],
                    filemtime($build_style)
                );

                $block_data['style'] = $handle;
            }
        }

        // Register editorStyle from build if it exists
        if (isset($block_data['editorStyle']) && strpos($block_data['editorStyle'], 'file:') === 0) {
            // Editor styles are compiled to index.css in build
            $build_editor_style = $build_dir . '/index.css';

            if (file_exists($build_editor_style)) {
                $handle = 'modular-blocks-' . $block_slug . '-editor-style';

                wp_register_style(
                    $handle,
                    $build_url . '/index.css',
                    [],
                    filemtime($build_editor_style)
                );

                $block_data['editorStyle'] = $handle;
            }
        }
    }

    /**
     * Render dynamic block using render.php
     */
    private function render_dynamic_block($render_file, $attributes, $content, $block, $block_name) {
        ob_start();

        // Make variables available to render.php
        $block_attributes = $attributes;
        $block_content = $content;
        $block_object = $block;

        try {
            include $render_file;
        } catch (Exception $e) {
            error_log("Modular Blocks Plugin: Error rendering block {$block_name}: " . $e->getMessage());
            return '';
        }

        return ob_get_clean();
    }

    /**
     * Check if a block is enabled in admin settings
     */
    private function is_block_enabled($block_name) {
        error_log("Modular Blocks Plugin: Checking if block '{$block_name}' is enabled");
        error_log("Modular Blocks Plugin: Enabled blocks array: " . print_r($this->enabled_blocks, true));

        // If no blocks are specifically enabled, enable all by default
        if (empty($this->enabled_blocks)) {
            error_log("Modular Blocks Plugin: No blocks enabled, enabling all by default");
            return true;
        }

        $is_enabled = in_array($block_name, $this->enabled_blocks);
        error_log("Modular Blocks Plugin: Block '{$block_name}' enabled status: " . ($is_enabled ? 'YES' : 'NO'));
        return $is_enabled;
    }

    /**
     * Enqueue block assets
     */
    public function enqueue_block_assets() {
        // Enqueue global block styles if they exist
        $global_css = MODULAR_BLOCKS_PLUGIN_URL . 'assets/css/blocks.css';
        $global_css_path = MODULAR_BLOCKS_PLUGIN_PATH . 'assets/css/blocks.css';

        if (file_exists($global_css_path)) {
            wp_enqueue_style(
                'modular-blocks-global',
                $global_css,
                [],
                MODULAR_BLOCKS_PLUGIN_VERSION
            );
        }
    }

    /**
     * Get all available blocks (for admin interface)
     */
    public function get_available_blocks() {
        $block_directories = $this->scan_block_directories();
        $blocks = [];

        foreach ($block_directories as $block_dir) {
            $block_name = basename($block_dir);
            $block_json_path = $block_dir . '/block.json';

            if (file_exists($block_json_path)) {
                $block_data = json_decode(file_get_contents($block_json_path), true);

                $blocks[$block_name] = [
                    'name' => $block_name,
                    'title' => $block_data['title'] ?? $block_name,
                    'description' => $block_data['description'] ?? '',
                    'category' => $block_data['category'] ?? 'common',
                    'enabled' => $this->is_block_enabled($block_name),
                    'path' => $block_dir
                ];
            }
        }

        return $blocks;
    }

    /**
     * Update enabled blocks setting
     */
    public function update_enabled_blocks($enabled_blocks) {
        $this->enabled_blocks = $enabled_blocks;
        return update_option('modular_blocks_enabled_blocks', $enabled_blocks);
    }
}