<?php
/**
 * ChemViz Asset Enqueue Manager
 *
 * Handles conditional loading of ChemViz vendor libraries
 *
 * @package ModularBlocksPlugin
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_ChemViz_Enqueue {

    /**
     * Initialize the enqueue manager
     */
    public function init() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_chemviz_assets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    /**
     * Enqueue ChemViz assets on frontend
     */
    public function enqueue_chemviz_assets() {
        global $post;

        if (!$post) {
            return;
        }

        $has_molecule_viewer = has_block('modular-blocks/molecule-viewer', $post);
        $has_chart_block = has_block('modular-blocks/chart-block', $post);

        // Enqueue 3Dmol.js for molecule viewer
        if ($has_molecule_viewer) {
            $this->enqueue_3dmol();
        }

        // Enqueue Plotly.js for chart block
        if ($has_chart_block) {
            $this->enqueue_plotly();
        }
    }

    /**
     * Enqueue 3Dmol.js library
     */
    private function enqueue_3dmol() {
        $use_cdn = apply_filters('modular_blocks_use_cdn', false);

        if ($use_cdn) {
            wp_enqueue_script(
                'chemviz-3dmol',
                'https://3dmol.csb.pitt.edu/build/3Dmol-min.js',
                array('jquery'),
                '2.0.3',
                true
            );
        } else {
            $local_path = MODULAR_BLOCKS_PLUGIN_PATH . 'assets/js/vendor/3Dmol-min.js';

            if (file_exists($local_path)) {
                wp_enqueue_script(
                    'chemviz-3dmol',
                    MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/3Dmol-min.js',
                    array('jquery'),
                    '2.0.3',
                    true
                );
            } else {
                // Fallback to CDN if local file doesn't exist
                error_log('ModularBlocks: 3Dmol.js not found locally, falling back to CDN');
                wp_enqueue_script(
                    'chemviz-3dmol',
                    'https://3dmol.csb.pitt.edu/build/3Dmol-min.js',
                    array('jquery'),
                    '2.0.3',
                    true
                );
            }
        }
    }

    /**
     * Enqueue Plotly.js library
     */
    private function enqueue_plotly() {
        $use_cdn = apply_filters('modular_blocks_use_cdn', false);

        if ($use_cdn) {
            wp_enqueue_script(
                'chemviz-plotly',
                'https://cdn.plot.ly/plotly-2.27.1.min.js',
                array(),
                '2.27.1',
                true
            );
        } else {
            $local_path = MODULAR_BLOCKS_PLUGIN_PATH . 'assets/js/vendor/plotly-2.27.1.min.js';

            if (file_exists($local_path)) {
                wp_enqueue_script(
                    'chemviz-plotly',
                    MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/plotly-2.27.1.min.js',
                    array(),
                    '2.27.1',
                    true
                );
            } else {
                // Fallback to CDN if local file doesn't exist
                error_log('ModularBlocks: Plotly.js not found locally, falling back to CDN');
                wp_enqueue_script(
                    'chemviz-plotly',
                    'https://cdn.plot.ly/plotly-2.27.1.min.js',
                    array(),
                    '2.27.1',
                    true
                );
            }
        }

        // Always enqueue chart templates after Plotly
        wp_enqueue_script(
            'chemviz-chart-templates',
            MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/chart-templates.js',
            array('chemviz-plotly'),
            MODULAR_BLOCKS_PLUGIN_VERSION,
            true
        );
    }

    /**
     * Enqueue assets for admin/editor
     */
    public function enqueue_admin_assets($hook) {
        // Only load on post editor pages
        if (!in_array($hook, ['post.php', 'post-new.php'])) {
            return;
        }

        // Check if Gutenberg is active
        if (!function_exists('use_block_editor_for_post_type')) {
            return;
        }

        global $post;
        if ($post && use_block_editor_for_post_type($post->post_type)) {
            // Enqueue libraries for block preview in editor
            $this->enqueue_3dmol();
            $this->enqueue_plotly();
        }
    }

    /**
     * Check if ChemViz blocks are registered
     */
    public function has_chemviz_blocks() {
        $registered_blocks = \WP_Block_Type_Registry::get_instance()->get_all_registered();

        $chemviz_blocks = [
            'modular-blocks/molecule-viewer',
            'modular-blocks/chart-block'
        ];

        foreach ($chemviz_blocks as $block_name) {
            if (isset($registered_blocks[$block_name])) {
                return true;
            }
        }

        return false;
    }
}
