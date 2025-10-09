<?php
/**
 * Drag and Drop Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$background_image = isset($block_attributes['backgroundImage']) ? $block_attributes['backgroundImage'] : array('url' => '', 'alt' => '');
$draggables = isset($block_attributes['draggables']) ? $block_attributes['draggables'] : array();
$drop_zones = isset($block_attributes['dropZones']) ? $block_attributes['dropZones'] : array();
$background_height = isset($block_attributes['backgroundHeight']) ? intval($block_attributes['backgroundHeight']) : 400;

// Optionen für Feedback und Verhalten
$show_feedback = isset($block_attributes['showFeedback']) ? $block_attributes['showFeedback'] : true;
$show_retry = isset($block_attributes['showRetry']) ? $block_attributes['showRetry'] : true;
$show_solution = isset($block_attributes['showSolution']) ? $block_attributes['showSolution'] : true;
$instant_feedback = isset($block_attributes['instantFeedback']) ? $block_attributes['instantFeedback'] : false;
$enable_snap = isset($block_attributes['enableSnap']) ? $block_attributes['enableSnap'] : true;
$show_score = isset($block_attributes['showScore']) ? $block_attributes['showScore'] : true;
$randomize_draggables = isset($block_attributes['randomizeDraggables']) ? $block_attributes['randomizeDraggables'] : false;
$allow_partial_score = isset($block_attributes['allowPartialScore']) ? $block_attributes['allowPartialScore'] : true;

// Texte
$score_text = isset($block_attributes['scoreText']) ? esc_html($block_attributes['scoreText']) : 'Sie haben @score von @total Punkten erreicht.';
$success_text = isset($block_attributes['successText']) ? esc_html($block_attributes['successText']) : 'Hervorragend! Alle Elemente wurden korrekt platziert.';
$partial_success_text = isset($block_attributes['partialSuccessText']) ? esc_html($block_attributes['partialSuccessText']) : 'Gut gemacht! Einige Elemente sind richtig platziert.';
$fail_text = isset($block_attributes['failText']) ? esc_html($block_attributes['failText']) : 'Versuchen Sie es noch einmal. Überprüfen Sie die Platzierungen.';

// Randomize draggables wenn aktiviert
if ($randomize_draggables && !empty($draggables)) {
	shuffle($draggables);
}

// Konfiguration für JavaScript
$config = array(
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
);

$block_id = wp_unique_id('drag-and-drop-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-drag-and-drop" data-drag-drop-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="drag-and-drop-container">
		<?php if ($title): ?>
			<h3 class="drag-drop-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="drag-drop-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="activity-area">
			<div class="draggables-area">
				<h4><?php esc_html_e('Elemente', 'modular-blocks-plugin'); ?></h4>
				<div class="draggables-container">
					<?php foreach ($draggables as $index => $draggable): ?>
						<div
							class="draggable-element draggable-<?php echo esc_attr($draggable['type']); ?>"
							data-draggable-id="<?php echo esc_attr($draggable['id']); ?>"
							data-correct-zones="<?php echo esc_attr(wp_json_encode($draggable['correctZones'])); ?>"
							style="<?php echo isset($draggable['color']) ? 'background-color: ' . esc_attr($draggable['color']) . ';' : ''; ?>"
							draggable="true"
						>
							<?php if ($draggable['type'] === 'text'): ?>
								<span><?php echo esc_html($draggable['content']); ?></span>
							<?php elseif ($draggable['type'] === 'image' && !empty($draggable['image']['url'])): ?>
								<img src="<?php echo esc_url($draggable['image']['url']); ?>" alt="<?php echo esc_attr($draggable['image']['alt']); ?>">
							<?php endif; ?>
						</div>
					<?php endforeach; ?>
				</div>
			</div>

			<div class="drop-area" style="height: <?php echo esc_attr($background_height); ?>px;">
				<h4><?php esc_html_e('Drop-Bereich', 'modular-blocks-plugin'); ?></h4>
				<div class="drop-area-container">
					<?php if (!empty($background_image['url'])): ?>
						<img src="<?php echo esc_url($background_image['url']); ?>" alt="<?php echo esc_attr($background_image['alt']); ?>" class="background-image">
					<?php endif; ?>
					<div class="drop-zones">
						<?php foreach ($drop_zones as $index => $zone): ?>
							<div
								class="drop-zone"
								data-zone-id="<?php echo esc_attr($zone['id']); ?>"
								data-accept-multiple="<?php echo esc_attr($zone['acceptMultiple'] ? 'true' : 'false'); ?>"
								style="
									left: <?php echo esc_attr($zone['x']); ?>%;
									top: <?php echo esc_attr($zone['y']); ?>%;
									width: <?php echo esc_attr($zone['width']); ?>px;
									height: <?php echo esc_attr($zone['height']); ?>px;
									background-color: <?php echo esc_attr($zone['backgroundColor']); ?>;
									border-color: <?php echo esc_attr($zone['borderColor']); ?>;
								"
							>
								<div class="zone-label"><?php echo esc_html($zone['label']); ?></div>
							</div>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
		</div>

		<div class="drag-drop-controls">
			<button type="button" class="drag-drop-button drag-drop-check">
				<?php esc_html_e('Prüfen', 'modular-blocks-plugin'); ?>
			</button>
			<?php if ($show_retry): ?>
				<button type="button" class="drag-drop-button drag-drop-retry" style="display: none;">
					<?php esc_html_e('Wiederholen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
			<?php if ($show_solution): ?>
				<button type="button" class="drag-drop-button drag-drop-solution" style="display: none;">
					<?php esc_html_e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
				</button>
			<?php endif; ?>
		</div>

		<?php if ($show_score): ?>
			<div class="drag-drop-results" style="display: none;">
				<div class="result-message"></div>
				<div class="score-display"></div>
			</div>
		<?php endif; ?>
	</div>
</div>

<script>
(function() {
	if (typeof window.initDragAndDrop === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initDragAndDrop(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initDragAndDrop === 'function') {
				window.initDragAndDrop(element);
			}
		});
	}
})();
</script>
