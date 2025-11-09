<?php
/**
 * Summary Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Wählen Sie die drei wichtigsten Aussagen aus und bringen Sie sie in die richtige Reihenfolge.';
$description = $block_attributes['description'] ?? 'Klicken Sie auf drei Aussagen und ziehen Sie sie in die korrekte Reihenfolge.';
$statements = $block_attributes['statements'] ?? [];
$required_selections = $block_attributes['requiredSelections'] ?? 3;
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$allow_reordering = $block_attributes['allowReordering'] ?? true;
$score_for_selection = $block_attributes['scoreForSelection'] ?? 1;
$score_for_order = $block_attributes['scoreForOrder'] ?? 1;
$pass_percentage = $block_attributes['passPercentage'] ?? 80;
$instruction_text = $block_attributes['instructionText'] ?? 'Wählen Sie @count Aussagen aus:';
$order_text = $block_attributes['orderText'] ?? 'Bringen Sie die ausgewählten Aussagen in die richtige Reihenfolge:';
$success_text = $block_attributes['successText'] ?? 'Ausgezeichnet! Sie haben die richtigen Aussagen in der korrekten Reihenfolge gewählt.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Einige Ihrer Auswahlen und Anordnungen sind korrekt.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal. Achten Sie sowohl auf die Auswahl als auch auf die Reihenfolge.';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$required_selections = max(1, min(count($statements), intval($required_selections)));
$pass_percentage = max(0, min(100, intval($pass_percentage)));

// Validate statements
if (empty($statements) || !is_array($statements)) {
    return '<div class="summary-error"><p>' . __('Keine Aussagen konfiguriert.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'summary-block-' . wp_unique_id();

// Get correct statements and shuffle all statements
$correct_statements = array_filter($statements, fn($stmt) => $stmt['isCorrect'] ?? false);
$correct_count = count($correct_statements);

// Sort correct statements by their correct position
usort($correct_statements, function($a, $b) {
    return ($a['correctPosition'] ?? 0) - ($b['correctPosition'] ?? 0);
});

// Shuffle statements for display
$display_statements = $statements;
shuffle($display_statements);

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-summary-block',
    $allow_reordering ? 'allow-reordering' : '',
    $show_feedback ? 'has-feedback' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Prepare data for JavaScript
$summary_data = [
    'requiredSelections' => $required_selections,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'allowReordering' => $allow_reordering,
    'scoreForSelection' => $score_for_selection,
    'scoreForOrder' => $score_for_order,
    'passPercentage' => $pass_percentage,
    'correctCount' => $correct_count,
    'instructionText' => str_replace('@count', $required_selections, $instruction_text),
    'orderText' => $order_text,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'correctStatements' => $correct_statements,
    'strings' => [
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'selectRequired' => sprintf(__('Bitte wählen Sie genau %d Aussagen aus.', 'modular-blocks-plugin'), $required_selections),
        'dragToReorder' => __('Ziehen Sie die Aussagen, um sie neu zu ordnen', 'modular-blocks-plugin'),
        'position' => __('Position', 'modular-blocks-plugin'),
        'correct' => __('Richtig', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch', 'modular-blocks-plugin'),
        'wrongPosition' => __('Falsche Position', 'modular-blocks-plugin'),
        'shouldNotSelect' => __('Nicht auswählen', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" data-summary="<?php echo esc_attr(json_encode($summary_data)); ?>">
    <div class="summary-container">

        <!-- Title and Description -->
        <div class="summary-header">
            <?php if (!empty($title)): ?>
                <h3 class="summary-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="summary-description"><?php echo $description; ?></div>
            <?php endif; ?>
        </div>

        <!-- Instructions -->
        <div class="summary-instructions">
            <div class="instruction-step active" data-step="select">
                <span class="step-number">1</span>
                <span class="step-text"><?php echo str_replace('@count', $required_selections, $instruction_text); ?></span>
            </div>

            <?php if ($allow_reordering): ?>
                <div class="instruction-step" data-step="order">
                    <span class="step-number">2</span>
                    <span class="step-text"><?php echo esc_html($order_text); ?></span>
                </div>
            <?php endif; ?>
        </div>

        <!-- Available Statements -->
        <div class="statements-pool">
            <?php foreach ($display_statements as $index => $statement): ?>
                <?php
                $statement_text = wp_kses_post($statement['text'] ?? '');
                $statement_feedback = wp_kses_post($statement['feedback'] ?? '');
                $is_correct = $statement['isCorrect'] ?? false;
                $correct_position = $statement['correctPosition'] ?? 0;
                $statement_id = $block_id . '-statement-' . $index;
                ?>
                <div class="statement-item"
                     data-index="<?php echo esc_attr($index); ?>"
                     data-correct="<?php echo $is_correct ? 'true' : 'false'; ?>"
                     data-position="<?php echo esc_attr($correct_position); ?>"
                     data-feedback="<?php echo esc_attr($statement_feedback); ?>">
                    <div class="statement-content">
                        <div class="statement-text"><?php echo $statement_text; ?></div>
                        <div class="statement-controls">
                            <button type="button" class="statement-select" aria-label="<?php _e('Aussage auswählen', 'modular-blocks-plugin'); ?>">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20,6 9,17 4,12"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Feedback (hidden initially) -->
                    <?php if ($show_feedback && !empty($statement_feedback)): ?>
                        <div class="statement-feedback" style="display: none;">
                            <div class="feedback-content"><?php echo $statement_feedback; ?></div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Selected Statements (Sortable) -->
        <div class="selected-statements" style="display: none;">
            <h4 class="selected-title"><?php _e('Ausgewählte Aussagen:', 'modular-blocks-plugin'); ?></h4>
            <div class="sortable-list">
                <!-- Selected items will be added here dynamically -->
            </div>
        </div>

        <!-- Controls -->
        <div class="summary-controls">
            <button type="button" class="summary-button summary-check" disabled>
                <?php _e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="summary-button summary-retry" style="display: none;">
                    <?php _e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="summary-button summary-solution" style="display: none;">
                    <?php _e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <div class="summary-results" style="display: none;">
            <div class="results-content">
                <div class="score-display"></div>
                <div class="result-message"></div>
                <div class="score-breakdown"></div>
            </div>
        </div>

    </div>
</div>

<script>
// Initialize summary functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const summaryBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (summaryBlock && typeof window.initSummaryBlock === 'function') {
        window.initSummaryBlock(summaryBlock);
    }
});
</script>