<?php
/**
 * Drag the Words Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$text_with_blanks = isset($block_attributes['textWithBlanks']) ? $block_attributes['textWithBlanks'] : '';
$word_bank = isset($block_attributes['wordBank']) ? $block_attributes['wordBank'] : array();

// Optionen
$show_feedback = isset($block_attributes['showFeedback']) ? $block_attributes['showFeedback'] : true;
$show_retry = isset($block_attributes['showRetry']) ? $block_attributes['showRetry'] : true;
$show_solution = isset($block_attributes['showSolution']) ? $block_attributes['showSolution'] : true;
$instant_feedback = isset($block_attributes['instantFeedback']) ? $block_attributes['instantFeedback'] : false;
$enable_word_reuse = isset($block_attributes['enableWordReuse']) ? $block_attributes['enableWordReuse'] : false;
$show_score = isset($block_attributes['showScore']) ? $block_attributes['showScore'] : true;
$randomize_words = isset($block_attributes['randomizeWords']) ? $block_attributes['randomizeWords'] : true;
$highlight_correct_on_drop = isset($block_attributes['highlightCorrectOnDrop']) ? $block_attributes['highlightCorrectOnDrop'] : true;
$case_sensitive = isset($block_attributes['caseSensitive']) ? $block_attributes['caseSensitive'] : false;

// Texte
$score_text = isset($block_attributes['scoreText']) ? esc_html($block_attributes['scoreText']) : 'Sie haben @score von @total Punkten erreicht.';
$success_text = isset($block_attributes['successText']) ? esc_html($block_attributes['successText']) : 'Perfekt! Sie haben alle Lücken korrekt ausgefüllt.';
$partial_success_text = isset($block_attributes['partialSuccessText']) ? esc_html($block_attributes['partialSuccessText']) : 'Gut gemacht! Einige Antworten sind richtig.';
$fail_text = isset($block_attributes['failText']) ? esc_html($block_attributes['failText']) : 'Versuchen Sie es noch einmal. Überprüfen Sie Ihre Antworten.';

// Randomize word bank wenn aktiviert
if ($randomize_words && !empty($word_bank)) {
	shuffle($word_bank);
}

// Text verarbeiten und Lücken erstellen
$blank_pattern = '/\*([^*]+)\*/';
$blank_index = 0;
$processed_text = preg_replace_callback($blank_pattern, function($matches) use (&$blank_index) {
	$html = '<span class="word-blank" data-blank="' . esc_attr($blank_index) . '"></span>';
	$blank_index++;
	return $html;
}, $text_with_blanks);

// Konfiguration für JavaScript
$config = array(
	'textWithBlanks' => $text_with_blanks,
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
);

$block_id = wp_unique_id('drag-the-words-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-drag-the-words" data-drag-words-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="drag-the-words-container">
		<?php if ($title): ?>
			<h3 class="drag-words-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="drag-words-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="text-area">
			<div class="text-content"><?php echo wp_kses_post($processed_text); ?></div>
		</div>

		<div class="word-bank">
			<h4><?php esc_html_e('Wortbank', 'modular-blocks-plugin'); ?></h4>
			<div class="word-bank-items">
				<?php foreach ($word_bank as $index => $word_item): ?>
					<div
						class="draggable-word"
						data-word="<?php echo esc_attr($word_item['word']); ?>"
						data-is-correct="<?php echo esc_attr($word_item['isCorrect'] ? 'true' : 'false'); ?>"
						data-correct-blanks="<?php echo esc_attr(wp_json_encode($word_item['blanks'])); ?>"
						draggable="true"
					>
						<?php echo esc_html($word_item['word']); ?>
					</div>
				<?php endforeach; ?>
			</div>
		</div>

		<div class="drag-words-controls">
			<button type="button" class="drag-words-button drag-words-check">
				<?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
			</button>
			<?php if ($show_retry): ?>
				<button type="button" class="drag-words-button drag-words-retry" style="display: none;">
					<?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
			<?php if ($show_solution): ?>
				<button type="button" class="drag-words-button drag-words-solution" style="display: none;">
					<?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
		</div>

		<?php if ($show_score): ?>
			<div class="drag-words-results" style="display: none;">
				<div class="result-message"></div>
				<div class="score-display"></div>
			</div>
		<?php endif; ?>
	</div>
</div>

<script>
(function() {
	if (typeof window.initDragTheWords === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initDragTheWords(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initDragTheWords === 'function') {
				window.initDragTheWords(element);
			}
		});
	}
})();
</script>
