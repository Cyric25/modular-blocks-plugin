<?php
/**
 * Drag the Words Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Vervollständigen Sie den Text';
$description = $block_attributes['description'] ?? 'Ziehen Sie die Wörter unten in die passenden Lücken im Text.';
$text_with_blanks = $block_attributes['textWithBlanks'] ?? '';
$word_bank = $block_attributes['wordBank'] ?? [];
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$instant_feedback = $block_attributes['instantFeedback'] ?? false;
$enable_word_reuse = $block_attributes['enableWordReuse'] ?? false;
$show_score = $block_attributes['showScore'] ?? true;
$randomize_words = $block_attributes['randomizeWords'] ?? true;
$highlight_correct_on_drop = $block_attributes['highlightCorrectOnDrop'] ?? true;
$case_sensitive = $block_attributes['caseSensitive'] ?? false;
$score_text = $block_attributes['scoreText'] ?? 'Sie haben @score von @total Punkten erreicht.';
$success_text = $block_attributes['successText'] ?? 'Perfekt! Sie haben alle Lücken korrekt ausgefüllt.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Einige Antworten sind richtig.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal. Überprüfen Sie Ihre Antworten.';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$text_with_blanks = wp_kses_post($text_with_blanks);

// Validate text and word bank
if (empty($text_with_blanks)) {
    return '<div class="drag-words-error"><p>' . __('Bitte geben Sie einen Text mit Lücken ein.', 'modular-blocks-plugin') . '</p></div>';
}

if (empty($word_bank) || !is_array($word_bank)) {
    return '<div class="drag-words-error"><p>' . __('Bitte konfigurieren Sie die Wortbank.', 'modular-blocks-plugin') . '</p></div>';
}

// Parse text and create blanks
$blank_pattern = '/\*([^*]+)\*/';
$blanks = [];
$blank_index = 0;

// Extract blanks from text
preg_match_all($blank_pattern, $text_with_blanks, $matches, PREG_OFFSET_CAPTURE);
foreach ($matches[1] as $match) {
    $blanks[] = [
        'index' => $blank_index,
        'correct_word' => trim($match[0]),
        'filled' => false
    ];
    $blank_index++;
}

// Replace blanks with placeholders
$processed_text = preg_replace_callback($blank_pattern, function($matches) use (&$blank_index_counter) {
    static $counter = 0;
    $blank_id = 'blank-' . $counter;
    $counter++;
    return '<span class="word-blank" data-blank="' . ($counter - 1) . '" data-blank-id="' . $blank_id . '"><span class="blank-placeholder">___________</span></span>';
}, $text_with_blanks);

// Generate unique ID for this block instance
$block_id = 'drag-the-words-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-drag-the-words',
    $instant_feedback ? 'instant-feedback' : '',
    $highlight_correct_on_drop ? 'highlight-on-drop' : '',
    $case_sensitive ? 'case-sensitive' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Prepare word bank for display
$display_words = $word_bank;
if ($randomize_words) {
    shuffle($display_words);
}

// Prepare data for JavaScript
$drag_words_data = [
    'blanks' => $blanks,
    'wordBank' => $word_bank,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'instantFeedback' => $instant_feedback,
    'enableWordReuse' => $enable_word_reuse,
    'showScore' => $show_score,
    'randomizeWords' => $randomize_words,
    'highlightCorrectOnDrop' => $highlight_correct_on_drop,
    'caseSensitive' => $case_sensitive,
    'scoreText' => $score_text,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'strings' => [
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'dragToBlank' => __('In Lücke ziehen', 'modular-blocks-plugin'),
        'returnToBank' => __('Zurück zur Wortbank', 'modular-blocks-plugin'),
        'correct' => __('Richtig', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch', 'modular-blocks-plugin'),
        'empty' => __('Leer', 'modular-blocks-plugin'),
        'filled' => __('Ausgefüllt', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" data-drag-words="<?php echo esc_attr(json_encode($drag_words_data)); ?>">
    <div class="drag-words-container">

        <!-- Header -->
        <div class="drag-words-header">
            <?php if (!empty($title)): ?>
                <h3 class="drag-words-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="drag-words-description"><?php echo $description; ?></div>
            <?php endif; ?>
        </div>

        <!-- Text with Blanks -->
        <div class="text-area">
            <div class="text-content">
                <?php echo $processed_text; ?>
            </div>
        </div>

        <!-- Word Bank -->
        <div class="word-bank">
            <h4 class="word-bank-title"><?php _e('Wortbank', 'modular-blocks-plugin'); ?></h4>
            <div class="word-bank-items">
                <?php foreach ($display_words as $index => $word_data): ?>
                    <?php
                    $word = esc_html($word_data['word'] ?? '');
                    $is_correct = $word_data['isCorrect'] ?? false;
                    $word_id = $block_id . '-word-' . $index;
                    ?>
                    <div
                        class="draggable-word <?php echo $is_correct ? 'correct-word' : 'distractor-word'; ?>"
                        data-word="<?php echo esc_attr($word); ?>"
                        data-word-index="<?php echo esc_attr($index); ?>"
                        data-is-correct="<?php echo $is_correct ? 'true' : 'false'; ?>"
                        data-correct-blanks="<?php echo esc_attr(json_encode($word_data['blanks'] ?? [])); ?>"
                        draggable="true"
                        tabindex="0"
                        role="button"
                        aria-label="<?php echo sprintf(__('Wort: %s', 'modular-blocks-plugin'), $word); ?>"
                        id="<?php echo esc_attr($word_id); ?>"
                    >
                        <span class="word-text"><?php echo $word; ?></span>
                        <div class="word-feedback" style="display: none;"></div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Controls -->
        <div class="drag-words-controls">
            <button type="button" class="drag-words-button drag-words-check" disabled>
                <?php _e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="drag-words-button drag-words-retry" style="display: none;">
                    <?php _e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="drag-words-button drag-words-solution" style="display: none;">
                    <?php _e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <?php if ($show_score): ?>
            <div class="drag-words-results" style="display: none;">
                <div class="results-content">
                    <div class="score-display"></div>
                    <div class="result-message"></div>
                    <div class="blank-feedback"></div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Instructions -->
        <div class="drag-words-instructions">
            <p class="instruction-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                </svg>
                <?php _e('Ziehen Sie die Wörter aus der Wortbank in die passenden Lücken im Text.', 'modular-blocks-plugin'); ?>
            </p>
        </div>

    </div>
</div>

<script>
// Initialize drag the words functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dragWordsBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (dragWordsBlock && typeof window.initDragTheWords === 'function') {
        window.initDragTheWords(dragWordsBlock);
    }
});
</script>