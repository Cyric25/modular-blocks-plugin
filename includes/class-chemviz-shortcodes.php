<?php
/**
 * ChemViz Shortcodes
 *
 * Provides shortcode functionality for ChemViz blocks
 *
 * @package ModularBlocksPlugin
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_ChemViz_Shortcodes {

    /**
     * Initialize shortcodes
     */
    public function init() {
        add_shortcode('chemviz_molecule', [$this, 'molecule_viewer_shortcode']);
        add_shortcode('chemviz_chart', [$this, 'chart_shortcode']);
    }

    /**
     * Molecule viewer shortcode
     *
     * Usage:
     * [chemviz_molecule pdb="1YCR"]
     * [chemviz_molecule url="/path/to/structure.pdb" style="cartoon" color="spectrum"]
     *
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    public function molecule_viewer_shortcode($atts) {
        $atts = shortcode_atts(array(
            'pdb' => '',
            'url' => '',
            'style' => 'stick',
            'color' => 'default',
            'background' => '#000000',
            'width' => 800,
            'height' => 600,
            'controls' => 'true',
            'spin' => 'false',
            'label' => '3D Molekülstruktur'
        ), $atts, 'chemviz_molecule');

        // Enqueue 3Dmol.js if not already loaded
        if (!wp_script_is('chemviz-3dmol', 'enqueued')) {
            wp_enqueue_script('jquery');

            $use_cdn = apply_filters('modular_blocks_use_cdn', false);
            $local_path = MODULAR_BLOCKS_PLUGIN_PATH . 'assets/js/vendor/3Dmol-min.js';

            if (!$use_cdn && file_exists($local_path)) {
                wp_enqueue_script(
                    'chemviz-3dmol',
                    MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/3Dmol-min.js',
                    array('jquery'),
                    '2.0.3',
                    true
                );
            } else {
                wp_enqueue_script(
                    'chemviz-3dmol',
                    'https://3dmol.csb.pitt.edu/build/3Dmol-min.js',
                    array('jquery'),
                    '2.0.3',
                    true
                );
            }
        }

        // Enqueue block view script
        wp_enqueue_script(
            'chemviz-molecule-viewer',
            MODULAR_BLOCKS_PLUGIN_URL . 'blocks/molecule-viewer/view.js',
            array('chemviz-3dmol'),
            MODULAR_BLOCKS_PLUGIN_VERSION,
            true
        );

        // Enqueue styles
        wp_enqueue_style(
            'chemviz-molecule-viewer',
            MODULAR_BLOCKS_PLUGIN_URL . 'blocks/molecule-viewer/style.css',
            array(),
            MODULAR_BLOCKS_PLUGIN_VERSION
        );

        // Sanitize attributes
        $pdb_id = sanitize_text_field($atts['pdb']);
        $url = esc_url($atts['url']);
        $style = sanitize_text_field($atts['style']);
        $color = sanitize_text_field($atts['color']);
        $background = sanitize_hex_color($atts['background']);
        $width = absint($atts['width']);
        $height = absint($atts['height']);
        $controls = filter_var($atts['controls'], FILTER_VALIDATE_BOOLEAN);
        $spin = filter_var($atts['spin'], FILTER_VALIDATE_BOOLEAN);
        $label = sanitize_text_field($atts['label']);

        // Determine source type
        $source_type = '';
        if (!empty($pdb_id)) {
            $source_type = 'pdb';
        } elseif (!empty($url)) {
            $source_type = 'url';
        }

        if (empty($source_type)) {
            return '<p class="chemviz-error">' . __('Fehler: Bitte PDB-ID oder URL angeben.', 'modular-blocks-plugin') . '</p>';
        }

        // Generate unique ID
        $viewer_id = 'chemviz-' . uniqid();

        // Calculate aspect ratio
        $aspect_ratio = ($height / $width) * 100;

        // Build HTML
        ob_start();
        ?>
        <div class="chemviz-viewer"
             data-chemviz-viewer="true"
             data-source-type="<?php echo esc_attr($source_type); ?>"
             data-pdb-id="<?php echo esc_attr($pdb_id); ?>"
             data-structure-url="<?php echo esc_attr($url); ?>"
             data-display-style="<?php echo esc_attr($style); ?>"
             data-color-scheme="<?php echo esc_attr($color); ?>"
             data-background-color="<?php echo esc_attr($background); ?>"
             data-enable-spin="<?php echo $spin ? 'true' : 'false'; ?>"
             aria-label="<?php echo esc_attr($label); ?>">

            <div class="chemviz-viewer__container" style="padding-bottom: <?php echo esc_attr($aspect_ratio); ?>%; background-color: <?php echo esc_attr($background); ?>;">
                <div class="chemviz-viewer__canvas" id="<?php echo esc_attr($viewer_id); ?>"></div>
            </div>

            <?php if ($controls): ?>
                <div class="chemviz-viewer__controls">
                    <button class="chemviz-viewer__button" data-action="reset" type="button">
                        <?php _e('Reset', 'modular-blocks-plugin'); ?>
                    </button>
                    <button class="chemviz-viewer__button" data-action="spin" type="button">
                        <?php echo $spin ? __('Stop', 'modular-blocks-plugin') : __('Drehen', 'modular-blocks-plugin'); ?>
                    </button>
                    <button class="chemviz-viewer__button" data-action="fullscreen" type="button">
                        <?php _e('Vollbild', 'modular-blocks-plugin'); ?>
                    </button>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Chart shortcode
     *
     * Usage:
     * [chemviz_chart template="titration"]
     * [chemviz_chart type="scatter" title="Custom Chart" data='[{"x":[1,2,3],"y":[4,5,6]}]']
     *
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    public function chart_shortcode($atts) {
        $atts = shortcode_atts(array(
            'template' => '',
            'type' => 'scatter',
            'data' => '',
            'title' => 'Diagramm',
            'xlabel' => 'X-Achse',
            'ylabel' => 'Y-Achse',
            'legend' => 'true',
            'width' => 800,
            'height' => 600
        ), $atts, 'chemviz_chart');

        // Enqueue Plotly.js if not already loaded
        if (!wp_script_is('chemviz-plotly', 'enqueued')) {
            $use_cdn = apply_filters('modular_blocks_use_cdn', false);
            $local_path = MODULAR_BLOCKS_PLUGIN_PATH . 'assets/js/vendor/plotly-2.27.1.min.js';

            if (!$use_cdn && file_exists($local_path)) {
                wp_enqueue_script(
                    'chemviz-plotly',
                    MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/plotly-2.27.1.min.js',
                    array(),
                    '2.27.1',
                    true
                );
            } else {
                wp_enqueue_script(
                    'chemviz-plotly',
                    'https://cdn.plot.ly/plotly-2.27.1.min.js',
                    array(),
                    '2.27.1',
                    true
                );
            }

            // Enqueue chart templates
            wp_enqueue_script(
                'chemviz-chart-templates',
                MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/chart-templates.js',
                array('chemviz-plotly'),
                MODULAR_BLOCKS_PLUGIN_VERSION,
                true
            );
        }

        // Enqueue block view script
        wp_enqueue_script(
            'chemviz-chart-creator',
            MODULAR_BLOCKS_PLUGIN_URL . 'blocks/chart-block/view.js',
            array('chemviz-plotly', 'chemviz-chart-templates'),
            MODULAR_BLOCKS_PLUGIN_VERSION,
            true
        );

        // Enqueue styles
        wp_enqueue_style(
            'chemviz-chart',
            MODULAR_BLOCKS_PLUGIN_URL . 'blocks/chart-block/style.css',
            array(),
            MODULAR_BLOCKS_PLUGIN_VERSION
        );

        // Sanitize attributes
        $template = sanitize_text_field($atts['template']);
        $type = sanitize_text_field($atts['type']);

        // Sanitize JSON data - should be plain text, not HTML
        $data = sanitize_textarea_field($atts['data']);
        // Validate JSON
        if (!empty($data)) {
            $decoded = json_decode($data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                // Invalid JSON, clear it
                $data = '';
            }
        }

        $title = sanitize_text_field($atts['title']);
        $xlabel = sanitize_text_field($atts['xlabel']);
        $ylabel = sanitize_text_field($atts['ylabel']);
        $legend = filter_var($atts['legend'], FILTER_VALIDATE_BOOLEAN);
        $width = absint($atts['width']);
        $height = absint($atts['height']);

        // Generate unique ID with secure random value
        $chart_id = 'chemviz-chart-' . bin2hex(random_bytes(8));

        // Build HTML
        ob_start();
        ?>
        <div class="chemviz-chart"
             data-chemviz-chart="true"
             data-chart-type="<?php echo esc_attr($type); ?>"
             data-chart-template="<?php echo esc_attr($template); ?>"
             data-chart-data="<?php echo esc_attr($data); ?>"
             data-chart-title="<?php echo esc_attr($title); ?>"
             data-x-axis-label="<?php echo esc_attr($xlabel); ?>"
             data-y-axis-label="<?php echo esc_attr($ylabel); ?>"
             data-show-legend="<?php echo $legend ? 'true' : 'false'; ?>"
             data-width="<?php echo esc_attr($width); ?>"
             data-height="<?php echo esc_attr($height); ?>">

            <div class="chemviz-chart__container" style="max-width: <?php echo esc_attr($width); ?>px;">
                <div class="chemviz-chart__canvas" id="<?php echo esc_attr($chart_id); ?>"></div>
                <div class="chemviz-chart__loading">
                    <?php _e('Diagramm wird geladen...', 'modular-blocks-plugin'); ?>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
