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
$background_color = $attributes['backgroundColor'] ?? '#000000';
$width = absint($attributes['width'] ?? 800);
$height = absint($attributes['height'] ?? 600);
$show_controls = $attributes['showControls'] ?? true;
$enable_spin = $attributes['enableSpin'] ?? false;
$aria_label = $attributes['ariaLabel'] ?? __('3D Molekülstruktur', 'modular-blocks-plugin');
$description = $attributes['description'] ?? '';

// Calculate aspect ratio
$aspect_ratio = ($height / $width) * 100;

// Theme colors for buttons (inline styles per CLAUDE.md pattern)
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');
$button_style = 'background: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'background-color: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'color: #fff !important; border: none !important; border-radius: 4px !important; ' .
                'padding: 8px 16px !important; min-width: 44px !important; min-height: 44px !important; ' .
                'cursor: pointer !important; font-size: 14px !important; font-weight: 500 !important;';
$select_style = 'background: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'background-color: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'color: #fff !important; border: none !important; border-radius: 4px !important; ' .
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
$wrapper_attributes = get_block_wrapper_attributes([
    'class' => 'chemviz-viewer',
    'style' => 'max-width:' . $width . 'px;',
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
