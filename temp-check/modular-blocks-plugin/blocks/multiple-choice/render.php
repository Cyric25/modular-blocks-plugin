<?php
/**
 * Multiple Choice Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$question = $block_attributes['question'] ?? 'Was ist die richtige Antwort?';
$question_image = $block_attributes['questionImage'] ?? ['url' => '', 'alt' => '', 'id' => null];
$answers = $block_attributes['answers'] ?? [];
$multiple_correct = $block_attributes['multipleCorrect'] ?? false;
$randomize_answers = $block_attributes['randomizeAnswers'] ?? false;
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_tips = $block_attributes['showTips'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$confirm_check = $block_attributes['confirmCheck'] ?? false;
$confirm_retry = $block_attributes['confirmRetry'] ?? false;
$pass_percentage = $block_attributes['passPercentage'] ?? 100;
$score_text = $block_attributes['scoreText'] ?? 'Sie haben @score von @total Punkten erreicht.';
$success_text = $block_attributes['successText'] ?? 'Hervorragend! Sie haben alle Fragen richtig beantwortet.';
$fail_text = $block_attributes['failText'] ?? 'Leider nicht bestanden. Versuchen Sie es nochmal.';

// Sanitize attributes
$question = wp_kses_post($question);
$pass_percentage = max(0, min(100, intval($pass_percentage)));

// Validate answers
if (empty($answers) || !is_array($answers)) {
    return '<div class="multiple-choice-error"><p>' . __('Keine Antworten konfiguriert.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'multiple-choice-' . wp_unique_id();

// Randomize answers if enabled
if ($randomize_answers) {
    shuffle($answers);
}

// Count correct answers for scoring
$correct_answers = array_filter($answers, fn($answer) => $answer['isCorrect'] ?? false);
$total_correct = count($correct_answers);

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-multiple-choice',
    $multiple_correct ? 'multiple-answers' : 'single-answer',
    $show_tips ? 'has-tips' : '',
    $randomize_answers ? 'randomized' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Prepare data for JavaScript
$quiz_data = [
    'multipleCorrect' => $multiple_correct,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'confirmCheck' => $confirm_check,
    'confirmRetry' => $confirm_retry,
    'passPercentage' => $pass_percentage,
    'totalCorrect' => $total_correct,
    'scoreText' => $score_text,
    'successText' => $success_text,
    'failText' => $fail_text,
    'strings' => [
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'confirmCheck' => __('Sind Sie sicher, dass Sie prüfen möchten?', 'modular-blocks-plugin'),
        'confirmRetry' => __('Sind Sie sicher, dass Sie von vorne beginnen möchten?', 'modular-blocks-plugin'),
        'selectAnswer' => __('Bitte wählen Sie mindestens eine Antwort aus.', 'modular-blocks-plugin'),
        'correct' => __('Richtig', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch', 'modular-blocks-plugin'),
        'unanswered' => __('Nicht beantwortet', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" data-quiz="<?php echo esc_attr(json_encode($quiz_data)); ?>">
    <div class="multiple-choice-container">

        <!-- Question -->
        <div class="question-section">
            <?php if (!empty($question_image['url'])): ?>
                <div class="question-image">
                    <img src="<?php echo esc_url($question_image['url']); ?>" alt="<?php echo esc_attr($question_image['alt']); ?>" />
                </div>
            <?php endif; ?>

            <div class="question-text">
                <?php echo $question; ?>
            </div>
        </div>

        <!-- Answers -->
        <div class="answers-section">
            <?php foreach ($answers as $index => $answer): ?>
                <?php
                $answer_text = wp_kses_post($answer['text'] ?? '');
                $answer_feedback = wp_kses_post($answer['feedback'] ?? '');
                $answer_tip = esc_attr($answer['tip'] ?? '');
                $is_correct = $answer['isCorrect'] ?? false;
                $answer_id = $block_id . '-answer-' . $index;
                $input_type = $multiple_correct ? 'checkbox' : 'radio';
                $input_name = $multiple_correct ? $block_id . '-answers[]' : $block_id . '-answer';
                ?>
                <div class="answer-option" data-correct="<?php echo $is_correct ? 'true' : 'false'; ?>" data-feedback="<?php echo esc_attr($answer_feedback); ?>">
                    <label for="<?php echo esc_attr($answer_id); ?>" class="answer-label" <?php echo $show_tips && !empty($answer_tip) ? 'title="' . $answer_tip . '"' : ''; ?>>
                        <input
                            type="<?php echo $input_type; ?>"
                            id="<?php echo esc_attr($answer_id); ?>"
                            name="<?php echo esc_attr($input_name); ?>"
                            value="<?php echo esc_attr($index); ?>"
                            class="answer-input"
                        />
                        <span class="answer-indicator"></span>
                        <span class="answer-text"><?php echo $answer_text; ?></span>
                        <?php if ($show_tips && !empty($answer_tip)): ?>
                            <span class="answer-tip" title="<?php echo $answer_tip; ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 16v-4"/>
                                    <path d="M12 8h.01"/>
                                </svg>
                            </span>
                        <?php endif; ?>
                    </label>

                    <!-- Feedback (hidden initially) -->
                    <?php if ($show_feedback && !empty($answer_feedback)): ?>
                        <div class="answer-feedback" style="display: none;">
                            <div class="feedback-content">
                                <?php echo $answer_feedback; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Controls -->
        <div class="quiz-controls">
            <button type="button" class="quiz-button quiz-check" disabled>
                <?php _e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="quiz-button quiz-retry" style="display: none;">
                    <?php _e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="quiz-button quiz-solution" style="display: none;">
                    <?php _e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <div class="quiz-results" style="display: none;">
            <div class="results-content">
                <div class="score-display"></div>
                <div class="result-message"></div>
            </div>
        </div>

    </div>
</div>

<script>
// Initialize quiz functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const quizBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (quizBlock && typeof window.initMultipleChoice === 'function') {
        window.initMultipleChoice(quizBlock);
    }
});
</script>