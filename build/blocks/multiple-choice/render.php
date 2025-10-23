<?php
/**
 * Multiple Choice Quiz Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$question = isset($block_attributes['question']) ? $block_attributes['question'] : '';
$question_image = isset($block_attributes['questionImage']) ? $block_attributes['questionImage'] : array('url' => '', 'alt' => '', 'id' => null);
$answers = isset($block_attributes['answers']) ? $block_attributes['answers'] : array();

// Optionen
$multiple_correct = isset($block_attributes['multipleCorrect']) ? $block_attributes['multipleCorrect'] : false;
$randomize_answers = isset($block_attributes['randomizeAnswers']) ? $block_attributes['randomizeAnswers'] : false;
$show_feedback = isset($block_attributes['showFeedback']) ? $block_attributes['showFeedback'] : true;
$show_tips = isset($block_attributes['showTips']) ? $block_attributes['showTips'] : true;
$show_retry = isset($block_attributes['showRetry']) ? $block_attributes['showRetry'] : true;
$show_solution = isset($block_attributes['showSolution']) ? $block_attributes['showSolution'] : true;
$confirm_check = isset($block_attributes['confirmCheck']) ? $block_attributes['confirmCheck'] : false;
$confirm_retry = isset($block_attributes['confirmRetry']) ? $block_attributes['confirmRetry'] : false;
$pass_percentage = isset($block_attributes['passPercentage']) ? intval($block_attributes['passPercentage']) : 100;

// Texte
$score_text = isset($block_attributes['scoreText']) ? esc_html($block_attributes['scoreText']) : 'Sie haben @score von @total Punkten erreicht.';
$success_text = isset($block_attributes['successText']) ? esc_html($block_attributes['successText']) : 'Hervorragend! Sie haben alle Fragen richtig beantwortet.';
$fail_text = isset($block_attributes['failText']) ? esc_html($block_attributes['failText']) : 'Leider nicht bestanden. Versuchen Sie es nochmal.';

// Randomize answers wenn aktiviert
$display_answers = $answers;
if ($randomize_answers && !empty($display_answers)) {
	shuffle($display_answers);
}

// Konfiguration für JavaScript
$config = array(
	'multipleCorrect' => $multiple_correct,
	'randomizeAnswers' => $randomize_answers,
	'showFeedback' => $show_feedback,
	'showTips' => $show_tips,
	'showRetry' => $show_retry,
	'showSolution' => $show_solution,
	'confirmCheck' => $confirm_check,
	'confirmRetry' => $confirm_retry,
	'passPercentage' => $pass_percentage,
	'scoreText' => $score_text,
	'successText' => $success_text,
	'failText' => $fail_text,
	'answers' => array_map(function($answer) {
		return array(
			'text' => $answer['text'],
			'isCorrect' => $answer['isCorrect'],
			'feedback' => isset($answer['feedback']) ? $answer['feedback'] : '',
			'tip' => isset($answer['tip']) ? $answer['tip'] : '',
		);
	}, $answers),
);

$block_id = wp_unique_id('multiple-choice-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-multiple-choice" data-quiz-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="multiple-choice-container">
		<div class="question-section">
			<?php if (!empty($question_image['url'])): ?>
				<div class="question-image">
					<img src="<?php echo esc_url($question_image['url']); ?>" alt="<?php echo esc_attr($question_image['alt']); ?>">
				</div>
			<?php endif; ?>
			<div class="question-text"><?php echo wp_kses_post($question); ?></div>
		</div>

		<div class="answers-section">
			<?php foreach ($display_answers as $index => $answer): ?>
				<div class="answer-option" data-answer-index="<?php echo esc_attr($index); ?>">
					<input
						type="<?php echo $multiple_correct ? 'checkbox' : 'radio'; ?>"
						name="quiz-answer"
						id="<?php echo esc_attr($block_id . '-answer-' . $index); ?>"
						class="answer-input"
						data-is-correct="<?php echo esc_attr($answer['isCorrect'] ? 'true' : 'false'); ?>"
						data-feedback="<?php echo esc_attr(isset($answer['feedback']) ? $answer['feedback'] : ''); ?>"
					/>
					<label
						for="<?php echo esc_attr($block_id . '-answer-' . $index); ?>"
						class="answer-label"
						<?php if ($show_tips && !empty($answer['tip'])): ?>
							title="<?php echo esc_attr($answer['tip']); ?>"
						<?php endif; ?>
					>
						<span class="answer-text"><?php echo wp_kses_post($answer['text']); ?></span>
					</label>
				</div>
			<?php endforeach; ?>
		</div>

		<div class="quiz-controls">
			<button type="button" class="quiz-button quiz-check">
				<?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
			</button>
			<?php if ($show_retry): ?>
				<button type="button" class="quiz-button quiz-retry" style="display: none;">
					<?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
			<?php if ($show_solution): ?>
				<button type="button" class="quiz-button quiz-solution" style="display: none;">
					<?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
		</div>

		<div class="quiz-results" style="display: none;">
			<div class="result-message"></div>
			<div class="score-display"></div>
			<div class="feedback-container"></div>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initMultipleChoice === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initMultipleChoice(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initMultipleChoice === 'function') {
				window.initMultipleChoice(element);
			}
		});
	}
})();
</script>
