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
        // Register blocks immediately since we're already in the init hook
        $this->register_blocks();
        add_action('enqueue_block_assets', [$this, 'enqueue_block_assets']);
    }

    /**
     * Dynamically discover and register blocks from the blocks directory
     */
    public function register_blocks() {
        $block_directories = $this->scan_block_directories();

        foreach ($block_directories as $block_dir) {
            $block_name = basename($block_dir);

            // Check if block is enabled in admin settings
            if (!$this->is_block_enabled($block_name)) {
                continue;
            }

            $this->register_single_block($block_dir, $block_name);
        }
    }

    /**
     * Scan the blocks directory for available blocks
     */
    private function scan_block_directories() {
        if (!is_dir($this->blocks_path)) {
            return [];
        }

        $directories = [];
        $items = scandir($this->blocks_path);

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $full_path = $this->blocks_path . $item;

            if (is_dir($full_path) && $this->is_valid_block_directory($full_path)) {
                $directories[] = $full_path;
            }
        }

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

        if (!file_exists($block_json_path)) {
            error_log("Modular Blocks Plugin: block.json not found for {$block_name}");
            return;
        }

        try {
            // Check if we have a build directory - use it instead of block directory
            $build_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'build/blocks/' . $block_name;
            $registration_dir = is_dir($build_dir) ? $build_dir : $block_dir;

            // Register the block without render callback - client-side only
            $result = register_block_type($registration_dir);

            if (!$result) {
                error_log("Modular Blocks: Failed to register block: {$block_name}");
            }

        } catch (Exception $e) {
            error_log("Modular Blocks Plugin: Error registering block {$block_name}: " . $e->getMessage());
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
        // If no blocks are specifically enabled, enable all by default
        if (empty($this->enabled_blocks)) {
            return true;
        }

        return in_array($block_name, $this->enabled_blocks);
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