<?php
/**
 * Summary Block Render Template (H5P-Style)
 *
 * Renders a summary quiz where users select correct statements from groups.
 * Correct statements build up a summary of the topic.
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Zusammenfassung erstellen';
$description = $block_attributes['description'] ?? 'Wählen Sie aus jeder Gruppe die richtige(n) Aussage(n) aus.';
$statement_groups = $block_attributes['statementGroups'] ?? [];
$progressive_reveal = $block_attributes['progressiveReveal'] ?? true;
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$shuffle_statements = $block_attributes['shuffleStatements'] ?? true;
$shuffle_groups = $block_attributes['shuffleGroups'] ?? false;
$deferred_feedback = $block_attributes['deferredFeedback'] ?? false;
$enable_pdf_download = $block_attributes['enablePdfDownload'] ?? true;
$penalty_per_wrong = $block_attributes['penaltyPerWrongAnswer'] ?? 1;
$success_text = $block_attributes['successText'] ?? 'Ausgezeichnet! Sie haben alle richtigen Aussagen gefunden.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Sie haben die meisten richtigen Aussagen gefunden.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal.';
$correct_feedback = $block_attributes['correctFeedback'] ?? 'Richtig! Diese Aussage wurde zur Zusammenfassung hinzugefügt.';
$incorrect_feedback = $block_attributes['incorrectFeedback'] ?? 'Falsch. Versuchen Sie eine andere Aussage.';
$summary_title = $block_attributes['summaryTitle'] ?? 'Ihre Zusammenfassung:';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$penalty_per_wrong = max(0, min(10, intval($penalty_per_wrong)));

// Validate statement groups
if (empty($statement_groups) || !is_array($statement_groups)) {
    return '<div class="summary-error"><p>' . __('Keine Aussagen-Gruppen konfiguriert.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'summary-block-' . wp_unique_id();

// Count correct statements per group and total
$total_correct = 0;
$groups_data = [];

foreach ($statement_groups as $group_index => $group) {
    $statements = $group['statements'] ?? [];
    $correct_in_group = 0;

    foreach ($statements as $statement) {
        if (!empty($statement['isCorrect'])) {
            $correct_in_group++;
            $total_correct++;
        }
    }

    $groups_data[] = [
        'id' => $group['id'] ?? 'group' . $group_index,
        'statements' => $statements,
        'correctCount' => $correct_in_group
    ];
}

// Shuffle groups if enabled
if ($shuffle_groups) {
    shuffle($groups_data);
}

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-summary-block',
    $progressive_reveal ? 'progressive-reveal' : 'show-all-groups',
    $show_feedback ? 'has-feedback' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Get theme colors for buttons
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');

// Prepare data for JavaScript
$summary_data = [
    'groups' => $groups_data,
    'totalCorrect' => $total_correct,
    'progressiveReveal' => $progressive_reveal,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'shuffleStatements' => $shuffle_statements,
    'deferredFeedback' => $deferred_feedback,
    'enablePdfDownload' => $enable_pdf_download,
    'penaltyPerWrong' => $penalty_per_wrong,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'correctFeedback' => $correct_feedback,
    'incorrectFeedback' => $incorrect_feedback,
    'summaryTitle' => $summary_title,
    'strings' => [
        'group' => __('Frage', 'modular-blocks-plugin'),
        'of' => __('von', 'modular-blocks-plugin'),
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'continue' => __('Weiter', 'modular-blocks-plugin'),
        'correct' => __('Richtig!', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch!', 'modular-blocks-plugin'),
        'score' => __('Punkte', 'modular-blocks-plugin'),
        'completed' => __('Abgeschlossen', 'modular-blocks-plugin'),
        'selectCorrect' => __('Wählen Sie die richtige(n) Aussage(n):', 'modular-blocks-plugin'),
        'downloadPdf' => __('Als PDF herunterladen', 'modular-blocks-plugin')
    ]
];

// Button styles
$button_style = 'display: inline-flex; align-items: center; justify-content: center; ' .
                'padding: 10px 20px; border: none; border-radius: 4px; ' .
                'background: ' . esc_attr($color_ui_surface) . '; ' .
                'color: #fff; cursor: pointer; font-size: 14px; font-weight: 500; ' .
                'transition: background 0.2s ease;';

$button_secondary_style = 'display: inline-flex; align-items: center; justify-content: center; ' .
                          'padding: 10px 20px; border: 2px solid ' . esc_attr($color_ui_surface) . '; ' .
                          'border-radius: 4px; background: transparent; ' .
                          'color: ' . esc_attr($color_ui_surface) . '; cursor: pointer; ' .
                          'font-size: 14px; font-weight: 500; transition: all 0.2s ease;';
?>

<div id="<?php echo esc_attr($block_id); ?>"
     class="<?php echo esc_attr($css_class); ?>"
     data-summary='<?php echo esc_attr(json_encode($summary_data)); ?>'>

    <div class="summary-container">
        <!-- Header -->
        <div class="summary-header">
            <?php if (!empty($title)): ?>
                <h3 class="summary-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="summary-description"><?php echo $description; ?></div>
            <?php endif; ?>
        </div>

        <!-- Progress indicator -->
        <div class="summary-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%;"></div>
            </div>
            <div class="progress-text">
                <span class="current-group">1</span> / <span class="total-groups"><?php echo count($groups_data); ?></span>
            </div>
        </div>

        <!-- Summary Section (grows as user selects correct answers) -->
        <div class="summary-section" style="display: none;">
            <h4 class="summary-section-title"><?php echo esc_html($summary_title); ?></h4>
            <div class="summary-statements">
                <!-- Correct statements will be added here -->
            </div>
        </div>

        <!-- Groups Container -->
        <div class="summary-groups">
            <?php foreach ($groups_data as $group_index => $group): ?>
                <?php
                $statements = $group['statements'];
                // Shuffle statements within group if enabled (for display)
                if ($shuffle_statements) {
                    shuffle($statements);
                }
                $is_first = ($group_index === 0);
                ?>
                <div class="summary-group <?php echo $is_first && $progressive_reveal ? 'active' : ''; ?>"
                     data-group-index="<?php echo esc_attr($group_index); ?>"
                     data-group-id="<?php echo esc_attr($group['id']); ?>"
                     data-correct-count="<?php echo esc_attr($group['correctCount']); ?>"
                     style="<?php echo !$is_first && $progressive_reveal ? 'display: none;' : ''; ?>">

                    <div class="group-header">
                        <span class="group-label">
                            <?php echo esc_html__('Frage', 'modular-blocks-plugin'); ?>
                            <?php echo ($group_index + 1); ?>
                            <?php echo esc_html__('von', 'modular-blocks-plugin'); ?>
                            <?php echo count($groups_data); ?>
                        </span>
                        <span class="group-instruction">
                            <?php
                            if ($group['correctCount'] > 1) {
                                printf(
                                    esc_html__('Wählen Sie %d richtige Aussagen:', 'modular-blocks-plugin'),
                                    $group['correctCount']
                                );
                            } else {
                                echo esc_html__('Wählen Sie die richtige Aussage:', 'modular-blocks-plugin');
                            }
                            ?>
                        </span>
                    </div>

                    <div class="group-statements">
                        <?php foreach ($statements as $stmt_index => $statement): ?>
                            <?php
                            $stmt_id = $statement['id'] ?? $group['id'] . '-s' . $stmt_index;
                            $stmt_text = wp_kses_post($statement['text'] ?? '');
                            $is_correct = !empty($statement['isCorrect']);
                            ?>
                            <button type="button"
                                    class="statement-option"
                                    data-statement-id="<?php echo esc_attr($stmt_id); ?>"
                                    data-correct="<?php echo $is_correct ? 'true' : 'false'; ?>">
                                <span class="statement-text"><?php echo $stmt_text; ?></span>
                                <span class="statement-icon"></span>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <!-- Group Feedback -->
                    <div class="group-feedback" style="display: none;">
                        <div class="feedback-message"></div>
                    </div>

                    <!-- Group Actions -->
                    <div class="group-actions">
                        <button type="button"
                                class="summary-button continue-button"
                                style="<?php echo esc_attr($button_style); ?> display: none;">
                            <?php echo esc_html__('Weiter', 'modular-blocks-plugin'); ?>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 8px;">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Results Section -->
        <div class="summary-results" style="display: none;">
            <div class="results-content">
                <div class="results-icon"></div>
                <div class="score-display"></div>
                <div class="result-message"></div>
            </div>
        </div>

        <!-- Final Controls -->
        <div class="summary-controls" style="display: none;">
            <?php if ($show_retry): ?>
                <button type="button"
                        class="summary-button retry-button"
                        style="<?php echo esc_attr($button_secondary_style); ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                    <?php echo esc_html__('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($enable_pdf_download): ?>
                <button type="button"
                        class="summary-button pdf-download-button"
                        style="<?php echo esc_attr($button_style); ?> display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <?php echo esc_html__('Als PDF herunterladen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button"
                        class="summary-button solution-button"
                        style="<?php echo esc_attr($button_style); ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                    <?php echo esc_html__('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const summaryBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (summaryBlock && typeof window.initSummaryBlock === 'function') {
        window.initSummaryBlock(summaryBlock);
    }
});
</script>
