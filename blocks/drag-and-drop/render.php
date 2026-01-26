<?php
/**
 * Drag and Drop Block Render Template
 * Version 2.0.0 - H5P Feature Parity
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
$task_width = $block_attributes['taskWidth'] ?? 800;
$task_height = $block_attributes['taskHeight'] ?? 400;
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
$apply_penalty = $block_attributes['applyPenalty'] ?? false;
$penalty_per_wrong = $block_attributes['penaltyPerWrong'] ?? 1;
$background_height = $block_attributes['backgroundHeight'] ?? 400;
$highlight_drop_zones = $block_attributes['highlightDropZones'] ?? 'dragging';
$enable_fullscreen = $block_attributes['enableFullscreen'] ?? true;
$enable_auto_scale = $block_attributes['enableAutoScale'] ?? true;
$score_text = $block_attributes['scoreText'] ?? 'Sie haben @score von @total Punkten erreicht.';
$success_text = $block_attributes['successText'] ?? 'Hervorragend! Alle Elemente wurden korrekt platziert.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Einige Elemente sind richtig platziert.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal. Überprüfen Sie die Platzierungen.';
$feedback_ranges = $block_attributes['feedbackRanges'] ?? [];

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$background_height = max(200, min(800, intval($background_height)));
$task_width = max(400, min(1200, intval($task_width)));

// Validate required data
if (empty($draggables) || empty($drop_zones)) {
    return '<div class="drag-drop-error"><p>' . esc_html__('Bitte konfigurieren Sie sowohl ziehbare Elemente als auch Drop-Zones.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'drag-and-drop-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-drag-and-drop',
    $instant_feedback ? 'instant-feedback' : '',
    $enable_snap ? 'snap-enabled' : '',
    $enable_auto_scale ? 'auto-scale' : '',
    !empty($background_image['url']) ? 'has-background-image' : '',
    'highlight-' . $highlight_drop_zones
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Build inline styles
$inline_styles = [
    '--background-height: ' . $background_height . 'px;',
    '--task-width: ' . $task_width . 'px;'
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
    'applyPenalty' => $apply_penalty,
    'penaltyPerWrong' => $penalty_per_wrong,
    'backgroundHeight' => $background_height,
    'taskWidth' => $task_width,
    'highlightDropZones' => $highlight_drop_zones,
    'enableFullscreen' => $enable_fullscreen,
    'enableAutoScale' => $enable_auto_scale,
    'scoreText' => $score_text,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'feedbackRanges' => $feedback_ranges,
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
        'dropZone' => __('Drop-Zone', 'modular-blocks-plugin'),
        'fullscreen' => __('Vollbild', 'modular-blocks-plugin'),
        'exitFullscreen' => __('Vollbild beenden', 'modular-blocks-plugin'),
        'tip' => __('Hinweis', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>" data-drag-drop="<?php echo esc_attr(wp_json_encode($drag_drop_data)); ?>">
    <div class="drag-drop-container">

        <!-- Header -->
        <div class="drag-drop-header">
            <?php if (!empty($title)): ?>
                <h3 class="drag-drop-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="drag-drop-description"><?php echo $description; ?></div>
            <?php endif; ?>

            <?php if ($enable_fullscreen): ?>
                <button type="button" class="drag-drop-fullscreen" aria-label="<?php esc_attr_e('Vollbild', 'modular-blocks-plugin'); ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                    </svg>
                </button>
            <?php endif; ?>
        </div>

        <!-- Main Activity Area -->
        <div class="activity-area">
            <!-- Draggable Elements Area -->
            <div class="draggables-area">
                <div class="draggables-container">
                    <?php foreach ($display_draggables as $index => $draggable): ?>
                        <?php
                        $drag_id = sanitize_text_field($draggable['id'] ?? 'drag-' . $index);
                        $drag_type = sanitize_text_field($draggable['type'] ?? 'text');
                        $drag_content = wp_kses_post($draggable['content'] ?? '');
                        $drag_image = $draggable['image'] ?? ['url' => '', 'alt' => '', 'id' => null];
                        $drag_color = sanitize_hex_color($draggable['color'] ?? '#0073aa');
                        $drag_size = sanitize_text_field($draggable['size'] ?? 'medium');
                        $drag_opacity = max(20, min(100, intval($draggable['opacity'] ?? 100)));
                        $drag_infinite = !empty($draggable['infinite']);
                        $drag_tip = sanitize_text_field($draggable['tip'] ?? '');
                        $correct_zones = $draggable['correctZones'] ?? [];
                        ?>
                        <div
                            class="draggable-element draggable-<?php echo esc_attr($drag_size); ?> draggable-<?php echo esc_attr($drag_type); ?><?php echo $drag_infinite ? ' infinite-draggable' : ''; ?>"
                            data-draggable-id="<?php echo esc_attr($drag_id); ?>"
                            data-correct-zones="<?php echo esc_attr(wp_json_encode($correct_zones)); ?>"
                            data-infinite="<?php echo $drag_infinite ? 'true' : 'false'; ?>"
                            <?php if (!empty($drag_tip)): ?>data-tip="<?php echo esc_attr($drag_tip); ?>"<?php endif; ?>
                            style="--element-color: <?php echo esc_attr($drag_color); ?>; --element-opacity: <?php echo $drag_opacity / 100; ?>;"
                            draggable="true"
                            tabindex="0"
                            role="button"
                            aria-label="<?php echo esc_attr(wp_strip_all_tags($drag_content)); ?>"
                        >
                            <?php if ($drag_infinite): ?>
                                <span class="infinite-badge" title="<?php esc_attr_e('Kann mehrfach verwendet werden', 'modular-blocks-plugin'); ?>">∞</span>
                            <?php endif; ?>

                            <div class="draggable-content">
                                <?php if (($drag_type === 'image' || $drag_type === 'both') && !empty($drag_image['url'])): ?>
                                    <img
                                        src="<?php echo esc_url($drag_image['url']); ?>"
                                        alt="<?php echo esc_attr($drag_image['alt']); ?>"
                                        class="draggable-image"
                                        draggable="false"
                                    />
                                <?php endif; ?>

                                <?php if ($drag_type === 'text' || $drag_type === 'both'): ?>
                                    <span class="draggable-text"><?php echo $drag_content; ?></span>
                                <?php endif; ?>
                            </div>

                            <?php if (!empty($drag_tip)): ?>
                                <button type="button" class="tip-button" aria-label="<?php esc_attr_e('Hinweis anzeigen', 'modular-blocks-plugin'); ?>">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                                    </svg>
                                </button>
                            <?php endif; ?>

                            <div class="draggable-feedback" style="display: none;"></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Drop Area -->
            <div class="drop-area">
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
                            $zone_show_label = $zone['showLabel'] ?? true;
                            $zone_x = max(0, min(100, floatval($zone['x'] ?? 0)));
                            $zone_y = max(0, min(100, floatval($zone['y'] ?? 0)));
                            $zone_width = max(50, min(400, floatval($zone['width'] ?? 150)));
                            $zone_height = max(50, min(400, floatval($zone['height'] ?? 100)));
                            $zone_bg = $zone['backgroundColor'] ?? 'rgba(0, 115, 170, 0.1)';
                            $zone_border = sanitize_hex_color($zone['borderColor'] ?? '#0073aa');
                            $zone_opacity = max(0, min(100, intval($zone['opacity'] ?? 100)));
                            $zone_auto_align = $zone['autoAlign'] ?? true;
                            $zone_align_spacing = max(0, min(20, intval($zone['alignSpacing'] ?? 8)));
                            $accept_multiple = $zone['acceptMultiple'] ?? false;
                            $tip_correct = sanitize_text_field($zone['tipCorrect'] ?? '');
                            $tip_incorrect = sanitize_text_field($zone['tipIncorrect'] ?? '');
                            ?>
                            <div
                                class="drop-zone <?php echo $accept_multiple ? 'multiple-allowed' : 'single-only'; ?>"
                                data-zone-id="<?php echo esc_attr($zone_id); ?>"
                                data-accept-multiple="<?php echo $accept_multiple ? 'true' : 'false'; ?>"
                                data-auto-align="<?php echo $zone_auto_align ? 'true' : 'false'; ?>"
                                data-align-spacing="<?php echo esc_attr($zone_align_spacing); ?>"
                                <?php if (!empty($tip_correct)): ?>data-tip-correct="<?php echo esc_attr($tip_correct); ?>"<?php endif; ?>
                                <?php if (!empty($tip_incorrect)): ?>data-tip-incorrect="<?php echo esc_attr($tip_incorrect); ?>"<?php endif; ?>
                                style="
                                    left: <?php echo $zone_x; ?>%;
                                    top: <?php echo $zone_y; ?>%;
                                    width: <?php echo $zone_width; ?>px;
                                    height: <?php echo $zone_height; ?>px;
                                    background-color: <?php echo esc_attr($zone_bg); ?>;
                                    border-color: <?php echo $zone_border; ?>;
                                    --zone-opacity: <?php echo $zone_opacity / 100; ?>;
                                "
                                role="region"
                                aria-label="<?php echo esc_attr($zone_label); ?>"
                                tabindex="0"
                            >
                                <?php if ($zone_show_label): ?>
                                    <div class="zone-label"><?php echo $zone_label; ?></div>
                                <?php endif; ?>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                <?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="drag-drop-button drag-drop-retry" style="display: none;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 4v6h6M23 20v-6h-6"/>
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                    </svg>
                    <?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="drag-drop-button drag-drop-solution" style="display: none;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <?php if ($show_score): ?>
            <div class="drag-drop-results" style="display: none;">
                <div class="results-content">
                    <div class="score-display"></div>
                    <div class="result-message"></div>
                    <?php if ($show_feedback): ?>
                        <div class="placement-feedback"></div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>

        <!-- Instructions -->
        <div class="drag-drop-instructions">
            <p class="instruction-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <?php esc_html_e('Ziehen Sie die Elemente von links in die passenden Drop-Zonen rechts. Drücken Sie H für einen Hinweis.', 'modular-blocks-plugin'); ?>
            </p>
        </div>

    </div>
</div>
