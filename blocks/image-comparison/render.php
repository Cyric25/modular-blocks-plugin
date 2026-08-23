<?php
/**
 * Image Comparison Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$before_image = $block_attributes['beforeImage'] ?? ['url' => '', 'alt' => '', 'id' => null];
$after_image = $block_attributes['afterImage'] ?? ['url' => '', 'alt' => '', 'id' => null];
$before_label = $block_attributes['beforeLabel'] ?? 'Vorher';
$after_label = $block_attributes['afterLabel'] ?? 'Nachher';
$orientation = $block_attributes['orientation'] ?? 'horizontal';
$display_mode = $block_attributes['displayMode'] ?? 'slide';
$starting_position = $block_attributes['startingPosition'] ?? 50;
$show_labels = $block_attributes['showLabels'] ?? true;
$hover_animation = $block_attributes['hoverAnimation'] ?? true;
$height = $block_attributes['height'] ?? 400;
$slider_width = $block_attributes['sliderWidth'] ?? 4;
$handle_size = $block_attributes['handleSize'] ?? 48;
$animation_speed = $block_attributes['animationSpeed'] ?? 12;
$label_background = $block_attributes['labelBackground'] ?? 'rgba(0, 0, 0, 0.7)';

// AP-3.5.fix1: block.json traegt fuer sliderColor/labelColor eigene
// Defaults (#0073aa/#ffffff) ein, die WordPress VOR render.php in
// $block_attributes schreibt - $block_attributes['sliderColor'] ist damit
// bei unveraendertem Content NIE leer, der "?? get_theme_mod()"-Fallback
// griff dadurch nie (AP-3.5-Befund). Nur wenn der Autor tatsaechlich einen
// von diesem Default abweichenden Wert gewaehlt hat, wird die Custom
// Property unten inline gesetzt; sonst bleibt sie ganz weg, damit die
// Kopplung "--slider-color: var(--color-ui-surface, #0073aa)" in style.css
// ungehindert greift.
$slider_color_attr = $block_attributes['sliderColor'] ?? null;
$label_color_attr = $block_attributes['labelColor'] ?? null;
$slider_color_is_custom = $slider_color_attr !== null && strtolower($slider_color_attr) !== '#0073aa';
$label_color_is_custom = $label_color_attr !== null && strtolower($label_color_attr) !== '#ffffff';
$slider_color = $slider_color_is_custom ? (sanitize_hex_color($slider_color_attr) ?: null) : null;
$label_color = $label_color_is_custom ? (sanitize_hex_color($label_color_attr) ?: null) : null;

// Sanitize attributes
$before_label = esc_html($before_label);
$after_label = esc_html($after_label);
$orientation = sanitize_text_field($orientation);
$display_mode = in_array($display_mode, ['slide', 'fade']) ? $display_mode : 'slide';
$starting_position = max(0, min(100, intval($starting_position)));
$height = max(200, min(800, intval($height)));
$slider_width = max(1, min(10, intval($slider_width)));
$handle_size = max(24, min(72, intval($handle_size)));
$animation_speed = max(2, min(15, floatval($animation_speed)));
$label_background = sanitize_text_field($label_background);

// Check if both images are available
if (empty($before_image['url']) || empty($after_image['url'])) {
    // echo statt return: render.php laeuft in Output-Buffering, Rueckgabewerte werden verworfen (AP39)
    echo '<div class="image-comparison-placeholder"><p>' . __('Bitte laden Sie beide Bilder hoch, um den Vergleich zu sehen.', 'modular-blocks-plugin') . '</p></div>';
    return;
}

// Get image dimensions from WordPress media library
$aspect_ratio = '16 / 9'; // Default fallback
$before_image_id = $before_image['id'] ?? null;
$after_image_id = $after_image['id'] ?? null;

// Try to get dimensions from before image first
if ($before_image_id) {
    $image_meta = wp_get_attachment_metadata($before_image_id);
    if (!empty($image_meta['width']) && !empty($image_meta['height'])) {
        $width = $image_meta['width'];
        $height_img = $image_meta['height'];
        $aspect_ratio = "$width / $height_img";
    }
}
// Fallback to after image if before image has no dimensions
elseif ($after_image_id) {
    $image_meta = wp_get_attachment_metadata($after_image_id);
    if (!empty($image_meta['width']) && !empty($image_meta['height'])) {
        $width = $image_meta['width'];
        $height_img = $image_meta['height'];
        $aspect_ratio = "$width / $height_img";
    }
}

// Generate unique ID for this block instance
$block_id = 'image-comparison-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-image-comparison',
    'orientation-' . $orientation,
    'display-mode-' . $display_mode,
    $hover_animation ? 'has-hover-animation' : '',
    $show_labels ? 'has-labels' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Calculate max-width based on height and actual image aspect-ratio
// Parse aspect-ratio string "width / height" to get ratio value
$ratio_parts = explode(' / ', $aspect_ratio);
if (count($ratio_parts) === 2) {
    $ratio_value = floatval($ratio_parts[0]) / floatval($ratio_parts[1]);
} else {
    $ratio_value = 16 / 9; // Fallback
}

// Calculate max-width for different screen sizes
// Desktop: Use actual image aspect-ratio
$max_width_desktop = round($height * $ratio_value);

// Tablet: Adjust aspect-ratio slightly for portrait images (limit to 4:3 max)
$ratio_tablet = min($ratio_value, 4 / 3);
$max_width_tablet = round($height * $ratio_tablet);

// Mobile: Square aspect-ratio for better mobile experience
$max_width_mobile = $height;

// Build inline styles
$inline_styles = [
    '--starting-position: ' . $starting_position . '%;',
    '--comparison-height: ' . $height . 'px;',
    '--comparison-aspect-ratio: ' . $aspect_ratio . ';',
    '--comparison-max-width: ' . $max_width_desktop . 'px;',
    '--comparison-max-width-tablet: ' . $max_width_tablet . 'px;',
    '--comparison-max-width-mobile: ' . $max_width_mobile . 'px;',
    '--slider-width: ' . $slider_width . 'px;',
    '--slider-handle-size: ' . $handle_size . 'px;',
    '--slider-button-size: ' . round($handle_size * 0.67) . 'px;',
    '--label-bg: ' . $label_background . ';',
    '--animation-speed: ' . $animation_speed . 's;',
];
// Nur bei tatsaechlicher Autoren-Anpassung gesetzt (siehe Begruendung oben) -
// ohne Custom-Wert greift die var(--color-ui-surface, ...)-Kopplung aus style.css.
if ($slider_color) {
    $inline_styles[] = '--slider-color: ' . $slider_color . ';';
}
if ($label_color) {
    $inline_styles[] = '--label-color: ' . $label_color . ';';
}
$inline_style = implode(' ', $inline_styles);
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>">
    <div class="image-comparison-container">
        <!-- Before Image -->
        <div class="image-comparison-before">
            <img
                src="<?php echo esc_url($before_image['url']); ?>"
                alt="<?php echo esc_attr($before_image['alt']); ?>"
                draggable="false"
            />
            <?php if ($show_labels && !empty($before_label)): ?>
                <div class="image-comparison-label label-before">
                    <?php echo $before_label; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- After Image -->
        <div class="image-comparison-after">
            <img
                src="<?php echo esc_url($after_image['url']); ?>"
                alt="<?php echo esc_attr($after_image['alt']); ?>"
                draggable="false"
            />
            <?php if ($show_labels && !empty($after_label)): ?>
                <div class="image-comparison-label label-after">
                    <?php echo $after_label; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Slider Handle -->
        <div class="image-comparison-slider">
            <div class="slider-handle">
                <div class="slider-button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <div class="slider-line"></div>
        </div>
    </div>
</div>

<?php /* Inline-Bootstrap entfernt (AP20): view.js initialisiert alle Bloecke selbst (Auto-Init + MutationObserver); der doppelte Aufruf band Event-Handler zweimal. */ ?>
