<?php
/**
 * Statement Connector Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$left_column = isset($block_attributes['leftColumn']) ? $block_attributes['leftColumn'] : array('title' => '', 'items' => array());
$right_column = isset($block_attributes['rightColumn']) ? $block_attributes['rightColumn'] : array('title' => '', 'items' => array());
$connections = isset($block_attributes['connections']) ? $block_attributes['connections'] : array();
$show_feedback = isset($block_attributes['showFeedback']) ? $block_attributes['showFeedback'] : true;
$show_retry = isset($block_attributes['showRetry']) ? $block_attributes['showRetry'] : true;
$show_solution = isset($block_attributes['showSolution']) ? $block_attributes['showSolution'] : true;
$allow_multiple = isset($block_attributes['allowMultipleConnections']) ? $block_attributes['allowMultipleConnections'] : false;
$connection_style = isset($block_attributes['connectionStyle']) ? esc_attr($block_attributes['connectionStyle']) : 'line';
$line_width = isset($block_attributes['lineWidth']) ? intval($block_attributes['lineWidth']) : 3;
$animate_connections = isset($block_attributes['animateConnections']) ? $block_attributes['animateConnections'] : true;
$instant_feedback = isset($block_attributes['instantFeedback']) ? $block_attributes['instantFeedback'] : false;
$success_text = isset($block_attributes['successText']) ? esc_html($block_attributes['successText']) : 'Ausgezeichnet! Alle Verbindungen sind korrekt.';
$partial_success_text = isset($block_attributes['partialSuccessText']) ? esc_html($block_attributes['partialSuccessText']) : 'Gut gemacht! Einige Verbindungen sind richtig.';
$fail_text = isset($block_attributes['failText']) ? esc_html($block_attributes['failText']) : 'Versuchen Sie es noch einmal. Überprüfen Sie Ihre Verbindungen.';

// Konfiguration für JavaScript
$config = array(
	'leftColumn' => $left_column,
	'rightColumn' => $right_column,
	'connections' => $connections,
	'showFeedback' => $show_feedback,
	'showRetry' => $show_retry,
	'showSolution' => $show_solution,
	'allowMultipleConnections' => $allow_multiple,
	'connectionStyle' => $connection_style,
	'lineWidth' => $line_width,
	'animateConnections' => $animate_connections,
	'instantFeedback' => $instant_feedback,
	'successText' => $success_text,
	'partialSuccessText' => $partial_success_text,
	'failText' => $fail_text,
);

$block_id = wp_unique_id('statement-connector-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-statement-connector" data-connector-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="connector-container">
		<?php if ($title): ?>
			<h3 class="connector-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="connector-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="connector-activity">
			<div class="connector-columns">
				<div class="connector-column left-column">
					<?php if (!empty($left_column['title'])): ?>
						<h4 class="column-title"><?php echo esc_html($left_column['title']); ?></h4>
					<?php endif; ?>
					<div class="column-items">
						<?php if (!empty($left_column['items'])): ?>
							<?php foreach ($left_column['items'] as $item): ?>
								<div class="connector-item left-item" data-item-id="<?php echo esc_attr($item['id']); ?>">
									<div class="item-content"><?php echo esc_html($item['text']); ?></div>
									<div class="connection-point"></div>
								</div>
							<?php endforeach; ?>
						<?php endif; ?>
					</div>
				</div>

				<div class="connector-canvas-wrapper">
					<svg class="connector-canvas"></svg>
				</div>

				<div class="connector-column right-column">
					<?php if (!empty($right_column['title'])): ?>
						<h4 class="column-title"><?php echo esc_html($right_column['title']); ?></h4>
					<?php endif; ?>
					<div class="column-items">
						<?php if (!empty($right_column['items'])): ?>
							<?php foreach ($right_column['items'] as $item): ?>
								<div class="connector-item right-item" data-item-id="<?php echo esc_attr($item['id']); ?>" data-correct-connection="<?php echo esc_attr($item['correctConnection']); ?>">
									<div class="connection-point"></div>
									<div class="item-content"><?php echo esc_html($item['text']); ?></div>
								</div>
							<?php endforeach; ?>
						<?php endif; ?>
					</div>
				</div>
			</div>
		</div>

		<div class="connector-controls">
			<button type="button" class="connector-button connector-check">
				<?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
			</button>
			<?php if ($show_retry): ?>
				<button type="button" class="connector-button connector-retry" style="display: none;">
					<?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
			<?php if ($show_solution): ?>
				<button type="button" class="connector-button connector-solution" style="display: none;">
					<?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
		</div>

		<div class="connector-results" style="display: none;">
			<div class="result-message"></div>
			<div class="score-display"></div>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initStatementConnector === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initStatementConnector(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initStatementConnector === 'function') {
				window.initStatementConnector(element);
			}
		});
	}
})();
</script>
