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

        // Wiederverwendbare Blöcke (core/block) sind für has_block() unsichtbar
        // — bei deren Vorkommen konservativ laden (gleiches Muster wie CDB).
        $has_reusable = strpos($post->post_content, '<!-- wp:block ') !== false;

        $has_molecule_viewer = has_block('modular-blocks/molecule-viewer', $post);
        $has_interactive_data_chart = has_block('modular-blocks/interactive-data-chart', $post);

        // Enqueue 3Dmol.js for molecule viewer
        if ($has_molecule_viewer || $has_reusable) {
            self::enqueue_3dmol();
        }

        // Enqueue Plotly.js for chart blocks
        if ($has_interactive_data_chart || $has_reusable) {
            self::enqueue_plotly();
        }
    }

    /**
     * Enqueue 3Dmol.js library
     *
     * public static (AP35): wird auch von den Shortcodes genutzt —
     * vorher existierte die Lokal/CDN-Fallback-Logik dreifach.
     */
    public static function enqueue_3dmol() {
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
     *
     * public static (AP35): wird auch von den Shortcodes genutzt.
     */
    public static function enqueue_plotly() {
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
            // Nur laden, wenn der Beitrag die Blöcke tatsächlich enthält.
            // Wiederverwendbare Blöcke (core/block) sind für has_block() unsichtbar,
            // daher bei deren Vorkommen konservativ laden.
            // Hinweis: Beim ERSTEN Einfügen eines ChemViz-Blocks ist die Library
            // erst nach dem Speichern/Neuladen des Editors verfügbar.
            $content = $post->post_content ?? '';
            $has_reusable = strpos($content, '<!-- wp:block ') !== false;

            if (has_block('modular-blocks/molecule-viewer', $post) || $has_reusable) {
                self::enqueue_3dmol();
            }

            if (has_block('modular-blocks/interactive-data-chart', $post) || $has_reusable) {
                self::enqueue_plotly();
            }
        }
    }

    /**
     * Check if ChemViz blocks are registered
     */
    public function has_chemviz_blocks() {
        $registered_blocks = \WP_Block_Type_Registry::get_instance()->get_all_registered();

        $chemviz_blocks = [
            'modular-blocks/molecule-viewer',
            'modular-blocks/interactive-data-chart'
        ];

        foreach ($chemviz_blocks as $block_name) {
            if (isset($registered_blocks[$block_name])) {
                return true;
            }
        }

        return false;
    }
}
