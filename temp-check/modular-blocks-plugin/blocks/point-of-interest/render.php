<?php
/**
 * Point of Interest Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$background_image = $block_attributes['backgroundImage'] ?? ['url' => '', 'alt' => '', 'id' => null];
$title = $block_attributes['title'] ?? '';
$description = $block_attributes['description'] ?? '';
$hotspots = $block_attributes['hotspots'] ?? [];
$hotspot_style = $block_attributes['hotspotStyle'] ?? 'circle';
$popup_style = $block_attributes['popupStyle'] ?? 'tooltip';
$popup_position = $block_attributes['popupPosition'] ?? 'auto';
$show_numbers = $block_attributes['showNumbers'] ?? false;
$auto_close = $block_attributes['autoClose'] ?? true;
$close_on_outside_click = $block_attributes['closeOnOutsideClick'] ?? true;
$height = $block_attributes['height'] ?? 400;
$enable_zoom = $block_attributes['enableZoom'] ?? false;
$zoom_level = $block_attributes['zoomLevel'] ?? 150;

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$height = max(200, min(800, intval($height)));
$zoom_level = max(100, min(300, intval($zoom_level)));
$hotspot_style = sanitize_text_field($hotspot_style);
$popup_style = sanitize_text_field($popup_style);
$popup_position = sanitize_text_field($popup_position);

// Check if background image is available
if (empty($background_image['url'])) {
    return '<div class="poi-error"><p>' . __('Bitte laden Sie ein Hintergrundbild hoch.', 'modular-blocks-plugin') . '</p></div>';
}

// Validate hotspots
if (empty($hotspots) || !is_array($hotspots)) {
    $hotspots = [];
}

// Generate unique ID for this block instance
$block_id = 'point-of-interest-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-point-of-interest',
    'hotspot-style-' . $hotspot_style,
    'popup-style-' . $popup_style,
    'popup-position-' . $popup_position,
    $show_numbers ? 'show-numbers' : '',
    $enable_zoom ? 'zoom-enabled' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Build inline styles
$inline_styles = [
    '--poi-height: ' . $height . 'px;',
    '--zoom-level: ' . ($zoom_level / 100) . ';'
];
$inline_style = implode(' ', $inline_styles);

// Prepare data for JavaScript
$poi_data = [
    'hotspots' => $hotspots,
    'autoClose' => $auto_close,
    'closeOnOutsideClick' => $close_on_outside_click,
    'popupStyle' => $popup_style,
    'popupPosition' => $popup_position,
    'enableZoom' => $enable_zoom,
    'zoomLevel' => $zoom_level,
    'strings' => [
        'close' => __('Schließen', 'modular-blocks-plugin'),
        'zoomIn' => __('Hineinzoomen', 'modular-blocks-plugin'),
        'zoomOut' => __('Herauszoomen', 'modular-blocks-plugin'),
        'resetZoom' => __('Zoom zurücksetzen', 'modular-blocks-plugin'),
        'hotspot' => __('Hotspot', 'modular-blocks-plugin'),
        'moreInfo' => __('Mehr Informationen', 'modular-blocks-plugin')
    ]
];

// Icon mapping for different hotspot icons
$icon_map = [
    'info' => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    'star' => '<svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
    'building' => '<svg viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18H6z"/><path d="M6 12h12"/><path d="M6 7h12"/><path d="M6 17h12"/></svg>',
    'nature' => '<svg viewBox="0 0 24 24"><path d="M7 20h10"/><path d="M12 20v-8"/><path d="M17 10a5 5 0 00-10 0"/><path d="M12 10V4a1 1 0 011-1h3a1 1 0 011 1v6"/></svg>',
    'store' => '<svg viewBox="0 0 24 24"><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/><path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2"/></svg>',
    'location' => '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'warning' => '<svg viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/></svg>',
    'plus' => '<svg viewBox="0 0 24 24"><path d="M12 6v12"/><path d="M6 12h12"/></svg>'
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>" data-poi="<?php echo esc_attr(json_encode($poi_data)); ?>">
    <div class="poi-container">

        <!-- Header -->
        <?php if (!empty($title) || !empty($description)): ?>
            <div class="poi-header">
                <?php if (!empty($title)): ?>
                    <h3 class="poi-title"><?php echo $title; ?></h3>
                <?php endif; ?>

                <?php if (!empty($description)): ?>
                    <div class="poi-description"><?php echo $description; ?></div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <!-- Interactive Image Area -->
        <div class="poi-interactive-area">
            <!-- Zoom Controls -->
            <?php if ($enable_zoom): ?>
                <div class="zoom-controls">
                    <button type="button" class="zoom-button zoom-in" title="<?php _e('Hineinzoomen', 'modular-blocks-plugin'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                            <line x1="11" y1="8" x2="11" y2="14"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button type="button" class="zoom-button zoom-out" title="<?php _e('Herauszoomen', 'modular-blocks-plugin'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <button type="button" class="zoom-button zoom-reset" title="<?php _e('Zoom zurücksetzen', 'modular-blocks-plugin'); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 4v6h6"/>
                            <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                        </svg>
                    </button>
                </div>
            <?php endif; ?>

            <!-- Image Container -->
            <div class="poi-image-container">
                <img
                    src="<?php echo esc_url($background_image['url']); ?>"
                    alt="<?php echo esc_attr($background_image['alt']); ?>"
                    class="poi-background-image"
                    draggable="false"
                />

                <!-- Hotspots -->
                <div class="poi-hotspots">
                    <?php foreach ($hotspots as $index => $hotspot): ?>
                        <?php
                        $hotspot_title = esc_html($hotspot['title'] ?? 'Hotspot ' . ($index + 1));
                        $hotspot_content = wp_kses_post($hotspot['content'] ?? '');
                        $hotspot_x = max(0, min(100, floatval($hotspot['x'] ?? 0)));
                        $hotspot_y = max(0, min(100, floatval($hotspot['y'] ?? 0)));
                        $hotspot_color = sanitize_hex_color($hotspot['color'] ?? '#0073aa');
                        $hotspot_icon = sanitize_text_field($hotspot['icon'] ?? 'info');
                        $hotspot_size = sanitize_text_field($hotspot['size'] ?? 'medium');
                        $hotspot_animation = sanitize_text_field($hotspot['animation'] ?? 'pulse');
                        $hotspot_trigger = sanitize_text_field($hotspot['trigger'] ?? 'click');
                        $hotspot_id = $block_id . '-hotspot-' . $index;
                        ?>
                        <div
                            class="poi-hotspot hotspot-<?php echo esc_attr($hotspot_size); ?> animation-<?php echo esc_attr($hotspot_animation); ?>"
                            data-hotspot="<?php echo esc_attr($index); ?>"
                            data-trigger="<?php echo esc_attr($hotspot_trigger); ?>"
                            style="
                                left: <?php echo $hotspot_x; ?>%;
                                top: <?php echo $hotspot_y; ?>%;
                                --hotspot-color: <?php echo $hotspot_color; ?>;
                            "
                            tabindex="0"
                            role="button"
                            aria-label="<?php echo esc_attr($hotspot_title); ?>"
                            aria-describedby="<?php echo esc_attr($hotspot_id); ?>-popup"
                        >
                            <div class="hotspot-marker">
                                <div class="hotspot-icon">
                                    <?php echo $icon_map[$hotspot_icon] ?? $icon_map['info']; ?>
                                </div>
                                <?php if ($show_numbers): ?>
                                    <span class="hotspot-number"><?php echo $index + 1; ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="hotspot-ripple"></div>
                        </div>

                        <!-- Popup Content -->
                        <div
                            id="<?php echo esc_attr($hotspot_id); ?>-popup"
                            class="poi-popup"
                            data-hotspot="<?php echo esc_attr($index); ?>"
                            style="display: none;"
                        >
                            <div class="popup-content">
                                <?php if (!empty($hotspot_title)): ?>
                                    <div class="popup-header">
                                        <h4 class="popup-title"><?php echo $hotspot_title; ?></h4>
                                        <button type="button" class="popup-close" aria-label="<?php _e('Schließen', 'modular-blocks-plugin'); ?>">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    </div>
                                <?php endif; ?>

                                <?php if (!empty($hotspot_content)): ?>
                                    <div class="popup-body">
                                        <?php echo $hotspot_content; ?>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <!-- Tooltip arrow for tooltip style -->
                            <?php if ($popup_style === 'tooltip'): ?>
                                <div class="popup-arrow"></div>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Hotspot Legend (optional) -->
        <?php if (count($hotspots) > 3): ?>
            <div class="poi-legend">
                <h4 class="legend-title"><?php _e('Hotspots', 'modular-blocks-plugin'); ?></h4>
                <div class="legend-items">
                    <?php foreach ($hotspots as $index => $hotspot): ?>
                        <div class="legend-item" data-hotspot="<?php echo esc_attr($index); ?>">
                            <div class="legend-marker" style="--hotspot-color: <?php echo sanitize_hex_color($hotspot['color'] ?? '#0073aa'); ?>;">
                                <?php if ($show_numbers): ?>
                                    <span><?php echo $index + 1; ?></span>
                                <?php else: ?>
                                    <div class="legend-icon"><?php echo $icon_map[$hotspot['icon'] ?? 'info'] ?? $icon_map['info']; ?></div>
                                <?php endif; ?>
                            </div>
                            <span class="legend-label"><?php echo esc_html($hotspot['title'] ?? 'Hotspot ' . ($index + 1)); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

    </div>
</div>

<script>
// Initialize point of interest functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const poiBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (poiBlock && typeof window.initPointOfInterest === 'function') {
        window.initPointOfInterest(poiBlock);
    }
});
</script>