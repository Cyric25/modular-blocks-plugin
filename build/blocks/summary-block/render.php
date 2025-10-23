<?php
/**
 * Summary Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$statements = isset($block_attributes['statements']) ? $block_attributes['statements'] : array();
$required_selections = isset($block_attributes['requiredSelections']) ? intval($block_attributes['requiredSelections']) : 3;
$show_feedback = isset($block_attributes['showFeedback']) ? $block_attributes['showFeedback'] : true;
$show_retry = isset($block_attributes['showRetry']) ? $block_attributes['showRetry'] : true;
$show_solution = isset($block_attributes['showSolution']) ? $block_attributes['showSolution'] : true;
$allow_reordering = isset($block_attributes['allowReordering']) ? $block_attributes['allowReordering'] : true;
$score_for_selection = isset($block_attributes['scoreForSelection']) ? intval($block_attributes['scoreForSelection']) : 1;
$score_for_order = isset($block_attributes['scoreForOrder']) ? intval($block_attributes['scoreForOrder']) : 1;
$pass_percentage = isset($block_attributes['passPercentage']) ? intval($block_attributes['passPercentage']) : 80;
$instruction_text = isset($block_attributes['instructionText']) ? esc_html($block_attributes['instructionText']) : 'Wählen Sie @count Aussagen aus:';
$order_text = isset($block_attributes['orderText']) ? esc_html($block_attributes['orderText']) : 'Bringen Sie die ausgewählten Aussagen in die richtige Reihenfolge:';
$success_text = isset($block_attributes['successText']) ? esc_html($block_attributes['successText']) : 'Ausgezeichnet! Sie haben die richtigen Aussagen in der korrekten Reihenfolge gewählt.';
$partial_success_text = isset($block_attributes['partialSuccessText']) ? esc_html($block_attributes['partialSuccessText']) : 'Gut gemacht! Einige Ihrer Auswahlen und Anordnungen sind korrekt.';
$fail_text = isset($block_attributes['failText']) ? esc_html($block_attributes['failText']) : 'Versuchen Sie es noch einmal. Achten Sie sowohl auf die Auswahl als auch auf die Reihenfolge.';

// Konfiguration für JavaScript
$config = array(
	'statements' => $statements,
	'requiredSelections' => $required_selections,
	'showFeedback' => $show_feedback,
	'showRetry' => $show_retry,
	'showSolution' => $show_solution,
	'allowReordering' => $allow_reordering,
	'scoreForSelection' => $score_for_selection,
	'scoreForOrder' => $score_for_order,
	'passPercentage' => $pass_percentage,
	'instructionText' => $instruction_text,
	'orderText' => $order_text,
	'successText' => $success_text,
	'partialSuccessText' => $partial_success_text,
	'failText' => $fail_text,
);

$block_id = wp_unique_id('summary-block-');
$instruction_display = str_replace('@count', $required_selections, $instruction_text);
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-summary-block" data-summary-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="summary-container">
		<?php if ($title): ?>
			<h3 class="summary-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="summary-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="summary-instruction"><?php echo $instruction_display; ?></div>

		<div class="statements-pool">
			<?php foreach ($statements as $index => $statement): ?>
				<div
					class="statement-item"
					data-statement-index="<?php echo esc_attr($index); ?>"
					data-is-correct="<?php echo esc_attr($statement['isCorrect'] ? 'true' : 'false'); ?>"
					data-correct-position="<?php echo esc_attr($statement['correctPosition']); ?>"
					data-feedback="<?php echo esc_attr($statement['feedback']); ?>"
				>
					<?php echo esc_html($statement['text']); ?>
				</div>
			<?php endforeach; ?>
		</div>

		<div class="summary-order-section" style="display: none;">
			<div class="order-instruction"><?php echo $order_text; ?></div>
			<div class="selected-statements"></div>
		</div>

		<div class="summary-controls">
			<button type="button" class="summary-button summary-check">
				<?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
			</button>
			<?php if ($show_retry): ?>
				<button type="button" class="summary-button summary-retry" style="display: none;">
					<?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
			<?php if ($show_solution): ?>
				<button type="button" class="summary-button summary-solution" style="display: none;">
					<?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
		</div>

		<div class="summary-results" style="display: none;">
			<div class="result-message"></div>
			<div class="score-display"></div>
			<?php if ($show_feedback): ?>
				<div class="feedback-container"></div>
			<?php endif; ?>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initSummaryBlock === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initSummaryBlock(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initSummaryBlock === 'function') {
				window.initSummaryBlock(element);
			}
		});
	}
})();
</script>
