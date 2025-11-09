<?php
/**
 * Drag and Drop Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Ziehen Sie die Elemente an die richtige Stelle';
$description = $block_attributes['description'] ?? 'Ziehen Sie die Elemente von links auf die passenden Drop-Zonen rechts.';
$background_image = $block_attributes['backgroundImage'] ?? ['url' => '', 'alt' => '', 'id' => null];
$draggables = $block_attributes['draggables'] ?? [];
$drop_zones = $block_attributes['dropZones'] ?? [];
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$instant_feedback = $block_attributes['instantFeedback'] ?? false;
$enable_snap = $block_attributes['enableSnap'] ?? true;
$show_score = $block_attributes['showScore'] ?? true;
$randomize_draggables = $block_attributes['randomizeDraggables'] ?? false;
$allow_partial_score = $block_attributes['allowPartialScore'] ?? true;
$background_height = $block_attributes['backgroundHeight'] ?? 400;
$score_text = $block_attributes['scoreText'] ?? 'Sie haben @score von @total Punkten erreicht.';
$success_text = $block_attributes['successText'] ?? 'Hervorragend! Alle Elemente wurden korrekt platziert.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Einige Elemente sind richtig platziert.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal. Überprüfen Sie die Platzierungen.';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$background_height = max(200, min(800, intval($background_height)));

// Validate required data
if (empty($draggables) || empty($drop_zones)) {
    return '<div class="drag-drop-error"><p>' . __('Bitte konfigurieren Sie sowohl ziehbare Elemente als auch Drop-Zones.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'drag-and-drop-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-drag-and-drop',
    $instant_feedback ? 'instant-feedback' : '',
    $enable_snap ? 'snap-enabled' : '',
    !empty($background_image['url']) ? 'has-background-image' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Build inline styles
$inline_styles = [
    '--background-height: ' . $background_height . 'px;'
];
$inline_style = implode(' ', $inline_styles);

// Randomize draggables if enabled
$display_draggables = $draggables;
if ($randomize_draggables) {
    shuffle($display_draggables);
}

// Prepare data for JavaScript
$drag_drop_data = [
    'draggables' => $draggables,
    'dropZones' => $drop_zones,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'instantFeedback' => $instant_feedback,
    'enableSnap' => $enable_snap,
    'showScore' => $show_score,
    'randomizeDraggables' => $randomize_draggables,
    'allowPartialScore' => $allow_partial_score,
    'backgroundHeight' => $background_height,
    'scoreText' => $score_text,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'strings' => [
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'dragToZone' => __('In Drop-Zone ziehen', 'modular-blocks-plugin'),
        'returnToStart' => __('Zurück zum Start', 'modular-blocks-plugin'),
        'correct' => __('Richtig platziert', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch platziert', 'modular-blocks-plugin'),
        'empty' => __('Leer', 'modular-blocks-plugin'),
        'occupied' => __('Belegt', 'modular-blocks-plugin'),
        'dropZone' => __('Drop-Zone', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>" data-drag-drop="<?php echo esc_attr(json_encode($drag_drop_data)); ?>">
    <div class="drag-drop-container">

        <!-- Header -->
        <div class="drag-drop-header">
            <?php if (!empty($title)): ?>
                <h3 class="drag-drop-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="drag-drop-description"><?php echo $description; ?></div>
            <?php endif; ?>
        </div>

        <!-- Main Activity Area -->
        <div class="activity-area">
            <!-- Draggable Elements Area -->
            <div class="draggables-area">
                <h4 class="section-title"><?php _e('Elemente', 'modular-blocks-plugin'); ?></h4>
                <div class="draggables-container">
                    <?php foreach ($display_draggables as $index => $draggable): ?>
                        <?php
                        $drag_id = sanitize_text_field($draggable['id'] ?? 'drag-' . $index);
                        $drag_type = sanitize_text_field($draggable['type'] ?? 'text');
                        $drag_content = wp_kses_post($draggable['content'] ?? '');
                        $drag_image = $draggable['image'] ?? ['url' => '', 'alt' => '', 'id' => null];
                        $drag_color = sanitize_hex_color($draggable['color'] ?? '#0073aa');
                        $drag_size = sanitize_text_field($draggable['size'] ?? 'medium');
                        $correct_zones = $draggable['correctZones'] ?? [];
                        ?>
                        <div
                            class="draggable-element draggable-<?php echo esc_attr($drag_size); ?> draggable-<?php echo esc_attr($drag_type); ?>"
                            data-draggable-id="<?php echo esc_attr($drag_id); ?>"
                            data-correct-zones="<?php echo esc_attr(json_encode($correct_zones)); ?>"
                            style="--element-color: <?php echo $drag_color; ?>;"
                            draggable="true"
                            tabindex="0"
                            role="button"
                            aria-label="<?php echo esc_attr($drag_content); ?>"
                        >
                            <div class="draggable-content">
                                <?php if ($drag_type === 'image' && !empty($drag_image['url'])): ?>
                                    <img
                                        src="<?php echo esc_url($drag_image['url']); ?>"
                                        alt="<?php echo esc_attr($drag_image['alt']); ?>"
                                        class="draggable-image"
                                        draggable="false"
                                    />
                                <?php endif; ?>

                                <?php if ($drag_type === 'text' || !empty($drag_content)): ?>
                                    <span class="draggable-text"><?php echo $drag_content; ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="draggable-feedback" style="display: none;"></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Drop Area -->
            <div class="drop-area">
                <h4 class="section-title"><?php _e('Drop-Bereich', 'modular-blocks-plugin'); ?></h4>
                <div class="drop-area-container">
                    <?php if (!empty($background_image['url'])): ?>
                        <img
                            src="<?php echo esc_url($background_image['url']); ?>"
                            alt="<?php echo esc_attr($background_image['alt']); ?>"
                            class="background-image"
                            draggable="false"
                        />
                    <?php endif; ?>

                    <!-- Drop Zones -->
                    <div class="drop-zones">
                        <?php foreach ($drop_zones as $index => $zone): ?>
                            <?php
                            $zone_id = sanitize_text_field($zone['id'] ?? 'zone-' . $index);
                            $zone_label = esc_html($zone['label'] ?? 'Drop Zone ' . ($index + 1));
                            $zone_x = max(0, min(100, floatval($zone['x'] ?? 0)));
                            $zone_y = max(0, min(100, floatval($zone['y'] ?? 0)));
                            $zone_width = max(50, min(300, floatval($zone['width'] ?? 150)));
                            $zone_height = max(50, min(300, floatval($zone['height'] ?? 100)));
                            $zone_bg = $zone['backgroundColor'] ?? 'rgba(0, 115, 170, 0.1)';
                            $zone_border = sanitize_hex_color($zone['borderColor'] ?? '#0073aa');
                            $accept_multiple = $zone['acceptMultiple'] ?? false;
                            ?>
                            <div
                                class="drop-zone <?php echo $accept_multiple ? 'multiple-allowed' : 'single-only'; ?>"
                                data-zone-id="<?php echo esc_attr($zone_id); ?>"
                                data-accept-multiple="<?php echo $accept_multiple ? 'true' : 'false'; ?>"
                                style="
                                    left: <?php echo $zone_x; ?>%;
                                    top: <?php echo $zone_y; ?>%;
                                    width: <?php echo $zone_width; ?>px;
                                    height: <?php echo $zone_height; ?>px;
                                    background-color: <?php echo esc_attr($zone_bg); ?>;
                                    border-color: <?php echo $zone_border; ?>;
                                "
                                role="region"
                                aria-label="<?php echo esc_attr($zone_label); ?>"
                                tabindex="0"
                            >
                                <div class="zone-label"><?php echo $zone_label; ?></div>
                                <div class="zone-content">
                                    <!-- Dropped elements will appear here -->
                                </div>
                                <div class="zone-feedback" style="display: none;"></div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="drag-drop-controls">
            <button type="button" class="drag-drop-button drag-drop-check" disabled>
                <?php _e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="drag-drop-button drag-drop-retry" style="display: none;">
                    <?php _e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="drag-drop-button drag-drop-solution" style="display: none;">
                    <?php _e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <?php if ($show_score): ?>
            <div class="drag-drop-results" style="display: none;">
                <div class="results-content">
                    <div class="score-display"></div>
                    <div class="result-message"></div>
                    <div class="placement-feedback"></div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Instructions -->
        <div class="drag-drop-instructions">
            <p class="instruction-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <?php _e('Ziehen Sie die Elemente von links in die passenden Drop-Zonen rechts.', 'modular-blocks-plugin'); ?>
            </p>
        </div>

    </div>
</div>

<script>
// Initialize drag and drop functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dragDropBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (dragDropBlock && typeof window.initDragAndDrop === 'function') {
        window.initDragAndDrop(dragDropBlock);
    }
});
</script>