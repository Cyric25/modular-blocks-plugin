<?php
/**
 * Molecule Viewer Block - Server-side rendering
 *
 * @var array    $attributes   Block attributes
 * @var string   $content      Block content
 * @var WP_Block $block        Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get attributes with defaults
$source_type = $attributes['sourceType'] ?? 'pdb';
$pdb_id = $attributes['pdbId'] ?? '';
$pubchem_query = $attributes['pubchemQuery'] ?? '';
$pubchem_type = $attributes['pubchemType'] ?? 'name';
$smiles_string = $attributes['smilesString'] ?? '';
$alphafold_id = $attributes['alphafoldId'] ?? '';
$structure_url = $attributes['structureUrl'] ?? '';
$display_style = $attributes['displayStyle'] ?? 'stick';
$color_scheme = $attributes['colorScheme'] ?? 'default';
// AP-3.3: Fallback folgt jetzt dem Theme-Customizer-Hintergrund statt einem
// festen Hex-Wert - der Standard-Hintergrund der 3D-Ansicht folgt damit dem
// Theme, sofern der Autor keinen eigenen Wert im Block-Attribut gewaehlt
// hat. Ein vom Autor explizit gesetztes Attribut hat weiterhin Vorrang
// (unveraenderte Prioritaetslogik, nur der Fallback-Wert selbst aendert
// sich). Bewusst eigener Fallback ('#000000') statt des globalen
// --color-background-Defaults ('#ffffff'), damit der bisherige optische
// Standard (schwarzer 3D-Hintergrund) ohne Customizer-Aenderung erhalten
// bleibt.
$background_color = $attributes['backgroundColor'] ?? get_theme_mod('color_background', '#000000');
$width = absint($attributes['width'] ?? 800);
$height = absint($attributes['height'] ?? 600);
$show_controls = $attributes['showControls'] ?? true;
$enable_spin = $attributes['enableSpin'] ?? false;
$aria_label = $attributes['ariaLabel'] ?? __('3D Molekülstruktur', 'modular-blocks-plugin');
$description = $attributes['description'] ?? '';

// Calculate aspect ratio
$aspect_ratio = ($height / $width) * 100;

// AP-3.3 (PLAN-CSS-Variablen-Darkmode.md), Muster wie AP-3.0 (accordion):
// PHP liest die Theme-Farben weiterhin per get_theme_mod(), gibt sie aber
// als Custom-Properties auf dem AEUSSEREN Block-Wrapper aus statt als
// hartkodierten Hex-Wert direkt im Inline-Style der Buttons/des Selects.
// style.css referenziert die Werte per var(--mv-surface, #fallback) bzw.
// var(--mv-surface-hover, #fallback). data-hover-color/data-base-color
// bleiben zusaetzlich als Rohwerte an den Steuerelementen erhalten, weil
// view.js (attachControlListeners()) sie fuer den JS-gesteuerten
// Hover-Farbwechsel direkt liest - das ist unveraendert.
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');
$button_style = 'color: #fff !important; border: none !important; border-radius: 4px !important; ' .
                'padding: 8px 16px !important; min-width: 44px !important; min-height: 44px !important; ' .
                'cursor: pointer !important; font-size: 14px !important; font-weight: 500 !important;';
$select_style = 'color: #fff !important; border: none !important; border-radius: 4px !important; ' .
                'padding: 8px 12px !important; padding-right: 28px !important; ' .
                'min-width: 44px !important; min-height: 44px !important; ' .
                'cursor: pointer !important; font-size: 14px !important; font-weight: 500 !important; ' .
                'appearance: none !important; -webkit-appearance: none !important; ' .
                'background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23fff\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") !important; ' .
                'background-repeat: no-repeat !important; background-position: right 8px center !important;';

// Build data attributes based on source type
$data_attrs = [
    'data-chemviz-viewer' => 'true',
    'data-source-type' => esc_attr($source_type),
    'data-display-style' => esc_attr($display_style),
    'data-color-scheme' => esc_attr($color_scheme),
    'data-background-color' => esc_attr($background_color),
    'data-enable-spin' => $enable_spin ? 'true' : 'false',
];

// Add source-specific data attributes
switch ($source_type) {
    case 'pdb':
        $data_attrs['data-pdb-id'] = esc_attr($pdb_id);
        break;
    case 'pubchem':
        $data_attrs['data-pubchem-query'] = esc_attr($pubchem_query);
        $data_attrs['data-pubchem-type'] = esc_attr($pubchem_type);
        break;
    case 'smiles':
        $data_attrs['data-smiles'] = esc_attr($smiles_string);
        break;
    case 'alphafold':
        $data_attrs['data-alphafold-id'] = esc_attr($alphafold_id);
        break;
    case 'url':
    case 'upload':
        $data_attrs['data-structure-url'] = esc_url($structure_url);
        break;
}

// Build data attributes string
$data_attrs_string = '';
foreach ($data_attrs as $key => $value) {
    $data_attrs_string .= ' ' . $key . '="' . $value . '"';
}

// Wrapper attributes
// AP-3.3: --mv-surface/--mv-surface-hover transportieren die Theme-Farben
// als Custom-Properties auf den Wrapper, style.css referenziert sie per
// var(--mv-surface, #fallback) (siehe Kommentar oben bei $button_style).
$wrapper_style_vars = sprintf(
    'max-width: %dpx; --mv-surface: %s; --mv-surface-hover: %s;',
    $width,
    esc_attr($color_ui_surface),
    esc_attr($color_ui_surface_dark)
);

$wrapper_attributes = get_block_wrapper_attributes([
    'class' => 'chemviz-viewer',
    'style' => $wrapper_style_vars,
    'aria-label' => esc_attr($aria_label),
]);

// Insert data attributes into wrapper
$wrapper_attributes = str_replace('class="', $data_attrs_string . ' class="', $wrapper_attributes);
?>
<div <?php echo $wrapper_attributes; ?>>
    <div class="chemviz-viewer__container" style="padding-bottom: <?php echo esc_attr($aspect_ratio); ?>%; background-color: <?php echo esc_attr($background_color); ?>;">
        <div class="chemviz-viewer__canvas"></div>
        <div class="chemviz-viewer__loading">
            <?php esc_html_e('Lade Molekül...', 'modular-blocks-plugin'); ?>
        </div>
    </div>

    <?php if ($show_controls) : ?>
    <div class="chemviz-viewer__controls">
        <select class="chemviz-viewer__style-select" data-action="change-style" style="<?php echo esc_attr($select_style); ?>" aria-label="<?php esc_attr_e('Darstellung wählen', 'modular-blocks-plugin'); ?>" data-hover-color="<?php echo esc_attr($color_ui_surface_dark); ?>" data-base-color="<?php echo esc_attr($color_ui_surface); ?>">
            <option value="stick" <?php selected($display_style, 'stick'); ?>><?php esc_html_e('Stick', 'modular-blocks-plugin'); ?></option>
            <option value="ballstick" <?php selected($display_style, 'ballstick'); ?>><?php esc_html_e('Ball & Stick', 'modular-blocks-plugin'); ?></option>
            <option value="sphere" <?php selected($display_style, 'sphere'); ?>><?php esc_html_e('Sphere', 'modular-blocks-plugin'); ?></option>
            <option value="line" <?php selected($display_style, 'line'); ?>><?php esc_html_e('Line', 'modular-blocks-plugin'); ?></option>
            <option value="cartoon" <?php selected($display_style, 'cartoon'); ?>><?php esc_html_e('Cartoon', 'modular-blocks-plugin'); ?></option>
            <option value="surface" <?php selected($display_style, 'surface'); ?>><?php esc_html_e('Surface', 'modular-blocks-plugin'); ?></option>
        </select>
        <button class="chemviz-viewer__button" data-action="reset" style="<?php echo esc_attr($button_style); ?>" data-hover-color="<?php echo esc_attr($color_ui_surface_dark); ?>" data-base-color="<?php echo esc_attr($color_ui_surface); ?>">
            <?php esc_html_e('Reset', 'modular-blocks-plugin'); ?>
        </button>
        <button class="chemviz-viewer__button" data-action="spin" style="<?php echo esc_attr($button_style); ?>" data-hover-color="<?php echo esc_attr($color_ui_surface_dark); ?>" data-base-color="<?php echo esc_attr($color_ui_surface); ?>">
            <?php echo $enable_spin ? esc_html__('Stop', 'modular-blocks-plugin') : esc_html__('Drehen', 'modular-blocks-plugin'); ?>
        </button>
        <button class="chemviz-viewer__button" data-action="toggle-bg" style="<?php echo esc_attr($button_style); ?>" data-hover-color="<?php echo esc_attr($color_ui_surface_dark); ?>" data-base-color="<?php echo esc_attr($color_ui_surface); ?>" title="<?php esc_attr_e('Hintergrundfarbe umschalten', 'modular-blocks-plugin'); ?>">
            <?php esc_html_e('Hintergrund', 'modular-blocks-plugin'); ?>
        </button>
        <button class="chemviz-viewer__button" data-action="fullscreen" style="<?php echo esc_attr($button_style); ?>" data-hover-color="<?php echo esc_attr($color_ui_surface_dark); ?>" data-base-color="<?php echo esc_attr($color_ui_surface); ?>">
            <?php esc_html_e('Vollbild', 'modular-blocks-plugin'); ?>
        </button>
    </div>
    <?php endif; ?>

    <?php if ($description) : ?>
    <p class="chemviz-sr-only"><?php echo esc_html($description); ?></p>
    <?php endif; ?>
</div>
