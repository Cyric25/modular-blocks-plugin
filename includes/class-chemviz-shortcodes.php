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

        // 3Dmol.js über die zentrale Enqueue-Logik laden (AP35 — vorher
        // existierte die Lokal/CDN-Fallback-Logik hier ein drittes Mal)
        ModularBlocks_ChemViz_Enqueue::enqueue_3dmol();

        // Block view script: bevorzugt den vom Block registrierten Handle
        // wiederverwenden — sonst lädt dieselbe Datei doppelt, wenn Block
        // UND Shortcode auf einer Seite liegen (AP32)
        if (wp_script_is('modular-blocks-molecule-viewer-view-script', 'registered')) {
            wp_enqueue_script('modular-blocks-molecule-viewer-view-script');
        } else {
            wp_enqueue_script(
                'chemviz-molecule-viewer',
                MODULAR_BLOCKS_PLUGIN_URL . 'blocks/molecule-viewer/view.js',
                array('chemviz-3dmol'),
                MODULAR_BLOCKS_PLUGIN_VERSION,
                true
            );
        }

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
        // AUSSER FUNKTION (Zusatzfund AP32/AP35): Dieser Shortcode enqueued
        // bisher blocks/chart-block/view.js und style.css — den chart-block
        // gibt es nicht mehr (ersetzt durch interactive-data-chart, dessen
        // view.js ein inkompatibles Tabellen-Markup erwartet). Das erzeugte
        // Markup (data-chemviz-chart) wird von keinem Script im Projekt
        // verarbeitet; Besucher sahen nur einen ewigen Lade-Spinner plus 404s.
        //
        // Graceful Degradation statt kaputter Ausgabe: Redakteure sehen einen
        // Hinweis, Besucher nichts. Wiederbelebung: eigenes view.js für das
        // data-chemviz-chart-Markup schreiben und hier enqueuen.
        if (current_user_can('edit_posts')) {
            return '<div style="border: 2px dashed #dc3545; padding: 12px; color: #721c24; background: #fee;">'
                . esc_html__('[chemviz_chart] ist derzeit ohne Funktion — bitte den Block „Interaktives Datendiagramm" verwenden. (Hinweis nur für Redakteure sichtbar)', 'modular-blocks-plugin')
                . '</div>';
        }
        return '<!-- chemviz_chart: Shortcode derzeit ohne Funktion (siehe VERBESSERUNGSPLAN-3.md) -->';
    }

    /**
     * Ursprüngliche Chart-Shortcode-Implementierung — deaktiviert, bis ein
     * Frontend-Script für das data-chemviz-chart-Markup existiert.
     */
    private function chart_shortcode_disabled($atts) {
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

        // Plotly + Chart-Templates über die zentrale Enqueue-Logik (AP35)
        ModularBlocks_ChemViz_Enqueue::enqueue_plotly();

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
