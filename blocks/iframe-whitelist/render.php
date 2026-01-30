<?php
/**
 * Iframe Whitelist Block - Server-side rendering
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get attributes
$url = $block_attributes['url'] ?? '';
$height = absint($block_attributes['height'] ?? 600);
$aspect_ratio = $block_attributes['aspectRatio'] ?? 'custom';
$allow_fullscreen = $block_attributes['allowFullscreen'] ?? true;
$show_border = $block_attributes['showBorder'] ?? false;
$border_radius = absint($block_attributes['borderRadius'] ?? 4);
$title = $block_attributes['title'] ?? '';

// No URL provided
if (empty($url)) {
    return '<div class="wp-block-modular-blocks-iframe-whitelist iframe-whitelist-placeholder">' .
           '<p>' . esc_html__('Keine URL ausgewählt.', 'modular-blocks-plugin') . '</p>' .
           '</div>';
}

// Validate URL against whitelist
if (!class_exists('ModularBlocks_Iframe_Whitelist_Manager')) {
    require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-iframe-whitelist-manager.php';
}

$whitelist_manager = new ModularBlocks_Iframe_Whitelist_Manager();

if (!$whitelist_manager->is_url_whitelisted($url)) {
    return '<div class="wp-block-modular-blocks-iframe-whitelist iframe-whitelist-error">' .
           '<span class="dashicons dashicons-warning"></span>' .
           '<p>' . esc_html__('URL nicht autorisiert. Diese URL befindet sich nicht in der Whitelist.', 'modular-blocks-plugin') . '</p>' .
           '</div>';
}

// Build wrapper classes
$wrapper_classes = ['wp-block-modular-blocks-iframe-whitelist'];
if ($show_border) {
    $wrapper_classes[] = 'has-border';
}

// Calculate aspect ratio styles
$wrapper_style = '';
$iframe_style = '';

if ($aspect_ratio !== 'custom') {
    $wrapper_classes[] = 'has-aspect-ratio';
    $wrapper_classes[] = 'aspect-ratio-' . str_replace(':', '-', $aspect_ratio);
} else {
    $iframe_style = 'height: ' . $height . 'px;';
}

// Always ensure full width
$wrapper_style = 'display: block; width: 100%;';
if ($border_radius > 0) {
    $wrapper_style .= ' border-radius: ' . $border_radius . 'px; overflow: hidden;';
}

// No sandbox attribute - URLs are already whitelisted/trusted
// This allows full functionality (PDF export, downloads, etc.)

// Build iframe attributes
$iframe_attrs = [
    'src' => esc_url($url),
    'class' => 'iframe-whitelist-frame',
    'loading' => 'lazy',
    'width' => '100%',
    'style' => 'width: 100%; display: block;',
];

if (!empty($title)) {
    $iframe_attrs['title'] = esc_attr($title);
} else {
    $iframe_attrs['title'] = esc_attr__('Eingebetteter Inhalt', 'modular-blocks-plugin');
}

if ($allow_fullscreen) {
    $iframe_attrs['allowfullscreen'] = 'allowfullscreen';
}

if (!empty($iframe_style)) {
    $iframe_attrs['style'] .= ' ' . $iframe_style;
}

// Build iframe tag
$iframe_html = '<iframe';
foreach ($iframe_attrs as $attr => $value) {
    if ($value === true || $value === 'allowfullscreen') {
        $iframe_html .= ' ' . esc_attr($attr);
    } else {
        $iframe_html .= ' ' . esc_attr($attr) . '="' . $value . '"';
    }
}
$iframe_html .= '></iframe>';

// Get theme colors from WordPress Customizer (falls back to defaults)
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');
$color_ui_surface_light = get_theme_mod('color_ui_surface_light', '#f5ede9');

// Button inline styles - using theme colors from PHP
$button_style = 'display: inline-flex !important; align-items: center !important; gap: 6px !important; ' .
                'padding: 8px 16px !important; border: none !important; border-radius: 4px !important; ' .
                'background: ' . esc_attr($color_ui_surface) . ' !important; background-color: ' . esc_attr($color_ui_surface) . ' !important; ' .
                'color: #fff !important; font-size: 14px !important; font-weight: 500 !important; ' .
                'cursor: pointer !important; text-decoration: none !important; box-shadow: none !important;';

$icon_style = 'font-size: 18px !important; width: 18px !important; height: 18px !important; ' .
              'color: #fff !important; background: transparent !important;';

$text_style = 'color: #fff !important; background: transparent !important; display: inline !important;';

// Build toolbar with buttons
$toolbar_style = 'display: flex; align-items: center; gap: 10px; padding: 10px 12px; ' .
                 'background-color: ' . esc_attr($color_ui_surface_light) . '; ' .
                 'border: 1px solid #ddd; border-bottom: none; border-radius: 4px 4px 0 0;';
$toolbar_html = '<div class="iframe-whitelist-toolbar" style="' . esc_attr($toolbar_style) . '">';

// Open in new tab button
$toolbar_html .= '<a href="' . esc_url($url) . '" target="_blank" rel="noopener noreferrer" class="iframe-toolbar-button" style="' . esc_attr($button_style) . '">' .
                 '<span class="dashicons dashicons-external" style="' . esc_attr($icon_style) . '"></span>' .
                 '<span class="iframe-button-text" style="' . esc_attr($text_style) . '">' . esc_html__('Website öffnen', 'modular-blocks-plugin') . '</span>' .
                 '</a>';

// Fullscreen button
if ($allow_fullscreen) {
    $toolbar_html .= '<button type="button" class="iframe-toolbar-button iframe-fullscreen-button" style="' . esc_attr($button_style) . '" aria-label="' . esc_attr__('Vollbild', 'modular-blocks-plugin') . '">' .
                     '<span class="dashicons dashicons-fullscreen-alt" style="' . esc_attr($icon_style) . '"></span>' .
                     '<span class="iframe-button-text" style="' . esc_attr($text_style) . '">' . esc_html__('Vollbild', 'modular-blocks-plugin') . '</span>' .
                     '</button>';
}

$toolbar_html .= '</div>';

// Wrapper attributes
$wrapper_attrs = get_block_wrapper_attributes([
    'class' => implode(' ', $wrapper_classes),
    'style' => $wrapper_style,
]);

?>
<div <?php echo $wrapper_attrs; ?>>
    <?php echo $toolbar_html; ?>
    <div class="iframe-whitelist-container">
        <?php echo $iframe_html; ?>
    </div>
</div>
