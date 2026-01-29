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

// Sandbox attributes for security
$sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

// Build iframe attributes
$iframe_attrs = [
    'src' => esc_url($url),
    'class' => 'iframe-whitelist-frame',
    'sandbox' => $sandbox,
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

// Build fullscreen button
$fullscreen_button = '';
if ($allow_fullscreen) {
    $fullscreen_button = '<button type="button" class="iframe-fullscreen-button" aria-label="' . esc_attr__('Vollbild', 'modular-blocks-plugin') . '">' .
                         '<span class="dashicons dashicons-fullscreen-alt"></span>' .
                         '</button>';
}

// Wrapper attributes
$wrapper_attrs = get_block_wrapper_attributes([
    'class' => implode(' ', $wrapper_classes),
    'style' => $wrapper_style,
]);

?>
<div <?php echo $wrapper_attrs; ?>>
    <div class="iframe-whitelist-container">
        <?php echo $iframe_html; ?>
        <?php echo $fullscreen_button; ?>
    </div>
</div>
