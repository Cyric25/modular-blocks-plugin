<?php
/**
 * Image Overlay Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$base_image = $block_attributes['baseImage'] ?? ['url' => '', 'alt' => 'Basis-Bild', 'id' => null];
$layers = $block_attributes['layers'] ?? [];
$title = $block_attributes['title'] ?? '';
$description = $block_attributes['description'] ?? '';
$height = $block_attributes['height'] ?? 400;
$show_labels = $block_attributes['showLabels'] ?? true;
$show_descriptions = $block_attributes['showDescriptions'] ?? true;
$allow_multiple_visible = $block_attributes['allowMultipleVisible'] ?? true;
$display_mode = $block_attributes['displayMode'] ?? 'overlay';
$transition_duration = $block_attributes['transitionDuration'] ?? 300;
$button_style = $block_attributes['buttonStyle'] ?? 'tabs';
$button_position = $block_attributes['buttonPosition'] ?? 'top';
$button_size = $block_attributes['buttonSize'] ?? 'medium';
$responsive_height = $block_attributes['responsiveHeight'] ?? true;

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$height = max(200, min(800, intval($height)));
$transition_duration = max(0, min(2000, intval($transition_duration)));
$button_style = sanitize_text_field($button_style);
$button_position = sanitize_text_field($button_position);
$button_size = sanitize_text_field($button_size);
$responsive_height = filter_var($responsive_height, FILTER_VALIDATE_BOOLEAN);

// Check if base image is available
if (empty($base_image['url'])) {
    return '<div class="image-overlay-placeholder"><p>' . __('Bitte laden Sie ein Basis-Bild hoch.', 'modular-blocks-plugin') . '</p></div>';
}

// Filter out layers without images
$valid_layers = array_filter($layers, function($layer) {
    return !empty($layer['image']['url']);
});

if (empty($valid_layers)) {
    return '<div class="image-overlay-placeholder"><p>' . __('Bitte laden Sie mindestens eine Überlagerungs-Ebene hoch.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'image-overlay-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-image-overlay',
    'button-style-' . $button_style,
    'button-position-' . $button_position,
    'button-size-' . $button_size,
    'display-mode-' . $display_mode,
    $responsive_height ? 'responsive-height' : 'fixed-height',
    $show_labels ? 'has-labels' : '',
    $show_descriptions ? 'has-descriptions' : '',
    $allow_multiple_visible ? 'multiple-visible' : 'single-visible'
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Build inline styles
$inline_styles = [
    '--transition-duration: ' . $transition_duration . 'ms;'
];

// Only set fixed height if responsive height is disabled
if (!$responsive_height) {
    $inline_styles[] = '--overlay-height: ' . $height . 'px;';
}

$inline_style = implode(' ', $inline_styles);

// Prepare data for JavaScript
$overlay_data = [
    'allowMultipleVisible' => $allow_multiple_visible,
    'displayMode' => $display_mode,
    'transitionDuration' => $transition_duration,
    'layers' => array_values($valid_layers),
    'strings' => [
        'showLayer' => __('Ebene anzeigen', 'modular-blocks-plugin'),
        'hideLayer' => __('Ebene ausblenden', 'modular-blocks-plugin'),
        'showAll' => __('Alle anzeigen', 'modular-blocks-plugin'),
        'hideAll' => __('Alle ausblenden', 'modular-blocks-plugin'),
        'opacity' => __('Transparenz', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>" data-overlay="<?php echo esc_attr(json_encode($overlay_data)); ?>">
    <div class="image-overlay-container">

        <!-- Title and Description -->
        <?php if (!empty($title) || !empty($description)): ?>
            <div class="overlay-header">
                <?php if (!empty($title)): ?>
                    <h3 class="overlay-title"><?php echo $title; ?></h3>
                <?php endif; ?>

                <?php if (!empty($description)): ?>
                    <div class="overlay-description"><?php echo $description; ?></div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <!-- Layer Controls (Top/Bottom position) -->
        <?php if ($button_position === 'top' || $button_position === 'bottom'): ?>
            <div class="layer-controls controls-<?php echo esc_attr($button_position); ?>">
                <div class="control-buttons">
                    <?php foreach ($valid_layers as $index => $layer): ?>
                        <?php
                        $layer_label = esc_html($layer['label'] ?? 'Ebene ' . ($index + 1));
                        $layer_description = esc_html($layer['description'] ?? '');
                        $layer_color = sanitize_hex_color($layer['color'] ?? '#0073aa');
                        $layer_visible = $layer['visible'] ?? false;
                        $layer_opacity = max(0, min(100, intval($layer['opacity'] ?? 100)));
                        ?>
                        <button
                            type="button"
                            class="layer-button <?php echo $layer_visible ? 'active' : ''; ?>"
                            data-layer="<?php echo esc_attr($index); ?>"
                            style="--layer-color: <?php echo $layer_color; ?>;"
                            aria-pressed="<?php echo $layer_visible ? 'true' : 'false'; ?>"
                            title="<?php echo $show_descriptions && $layer_description ? $layer_description : $layer_label; ?>"
                        >
                            <span class="button-indicator"></span>
                            <?php if ($show_labels): ?>
                                <span class="button-label"><?php echo $layer_label; ?></span>
                            <?php endif; ?>
                        </button>
                    <?php endforeach; ?>
                </div>

                <!-- Global controls -->
                <div class="global-controls">
                    <button type="button" class="control-button show-all" title="<?php _e('Alle Ebenen anzeigen', 'modular-blocks-plugin'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,11 12,14 22,4"/>
                            <path d="M21,12v7a2,2 0 01-2,2H5a2,2 0 01-2-2V5a2,2 0 012-2h11"/>
                        </svg>
                    </button>
                    <button type="button" class="control-button hide-all" title="<?php _e('Alle Ebenen ausblenden', 'modular-blocks-plugin'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                        </svg>
                    </button>
                </div>
            </div>
        <?php endif; ?>

        <!-- Image Container -->
        <div class="overlay-viewport">
            <!-- Side Controls (Left/Right position) -->
            <?php if ($button_position === 'left' || $button_position === 'right'): ?>
                <div class="layer-controls controls-<?php echo esc_attr($button_position); ?>">
                    <div class="control-buttons">
                        <?php foreach ($valid_layers as $index => $layer): ?>
                            <?php
                            $layer_label = esc_html($layer['label'] ?? 'Ebene ' . ($index + 1));
                            $layer_description = esc_html($layer['description'] ?? '');
                            $layer_color = sanitize_hex_color($layer['color'] ?? '#0073aa');
                            $layer_visible = $layer['visible'] ?? false;
                            ?>
                            <button
                                type="button"
                                class="layer-button <?php echo $layer_visible ? 'active' : ''; ?>"
                                data-layer="<?php echo esc_attr($index); ?>"
                                style="--layer-color: <?php echo $layer_color; ?>;"
                                aria-pressed="<?php echo $layer_visible ? 'true' : 'false'; ?>"
                                title="<?php echo $show_descriptions && $layer_description ? $layer_description : $layer_label; ?>"
                            >
                                <span class="button-indicator"></span>
                                <?php if ($show_labels): ?>
                                    <span class="button-label"><?php echo $layer_label; ?></span>
                                <?php endif; ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <div class="image-stack">
                <!-- Base Image -->
                <div class="base-layer">
                    <img
                        src="<?php echo esc_url($base_image['url']); ?>"
                        alt="<?php echo esc_attr($base_image['alt']); ?>"
                        class="base-image"
                        draggable="false"
                    />
                </div>

                <!-- Overlay Layers -->
                <?php foreach ($valid_layers as $index => $layer): ?>
                    <?php
                    $layer_image = $layer['image'];
                    $layer_visible = $layer['visible'] ?? false;
                    $layer_opacity = max(0, min(100, intval($layer['opacity'] ?? 100)));
                    ?>
                    <div
                        class="overlay-layer <?php echo $layer_visible ? 'visible' : 'hidden'; ?>"
                        data-layer="<?php echo esc_attr($index); ?>"
                        style="opacity: <?php echo $layer_visible ? ($layer_opacity / 100) : 0; ?>;"
                    >
                        <img
                            src="<?php echo esc_url($layer_image['url']); ?>"
                            alt="<?php echo esc_attr($layer_image['alt']); ?>"
                            class="overlay-image"
                            draggable="false"
                        />
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Layer Info Panel -->
        <?php if ($show_descriptions): ?>
            <div class="layer-info" style="display: none;">
                <div class="info-content">
                    <div class="info-title"></div>
                    <div class="info-description"></div>
                </div>
            </div>
        <?php endif; ?>

    </div>
</div>