<?php
/**
 * Image Overlay Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$base_image = isset($block_attributes['baseImage']) ? $block_attributes['baseImage'] : array('url' => '', 'alt' => '', 'id' => null);
$layers = isset($block_attributes['layers']) ? $block_attributes['layers'] : array();
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$height = isset($block_attributes['height']) ? intval($block_attributes['height']) : 400;
$show_labels = isset($block_attributes['showLabels']) ? $block_attributes['showLabels'] : true;
$show_descriptions = isset($block_attributes['showDescriptions']) ? $block_attributes['showDescriptions'] : true;
$allow_multiple_visible = isset($block_attributes['allowMultipleVisible']) ? $block_attributes['allowMultipleVisible'] : true;
$transition_duration = isset($block_attributes['transitionDuration']) ? intval($block_attributes['transitionDuration']) : 300;
$button_style = isset($block_attributes['buttonStyle']) ? esc_attr($block_attributes['buttonStyle']) : 'tabs';
$button_position = isset($block_attributes['buttonPosition']) ? esc_attr($block_attributes['buttonPosition']) : 'top';

// Konfiguration für JavaScript
$config = array(
	'layers' => $layers,
	'showLabels' => $show_labels,
	'showDescriptions' => $show_descriptions,
	'allowMultipleVisible' => $allow_multiple_visible,
	'transitionDuration' => $transition_duration,
	'buttonStyle' => $button_style,
	'buttonPosition' => $button_position,
);

$block_id = wp_unique_id('image-overlay-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-image-overlay" data-overlay-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="image-overlay-container button-position-<?php echo $button_position; ?>">
		<?php if ($title): ?>
			<h3 class="overlay-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="overlay-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="layer-controls button-style-<?php echo $button_style; ?>">
			<?php foreach ($layers as $index => $layer): ?>
				<button
					type="button"
					class="layer-toggle <?php echo !empty($layer['visible']) ? 'active' : ''; ?>"
					data-layer-index="<?php echo esc_attr($index); ?>"
					style="border-color: <?php echo esc_attr($layer['color']); ?>;"
				>
					<?php if ($show_labels): ?>
						<span class="layer-label"><?php echo esc_html($layer['label']); ?></span>
					<?php endif; ?>
					<?php if ($show_descriptions && !empty($layer['description'])): ?>
						<span class="layer-description"><?php echo esc_html($layer['description']); ?></span>
					<?php endif; ?>
				</button>
			<?php endforeach; ?>
		</div>

		<div class="overlay-image-container" style="height: <?php echo esc_attr($height); ?>px;">
			<?php if (!empty($base_image['url'])): ?>
				<img src="<?php echo esc_url($base_image['url']); ?>" alt="<?php echo esc_attr($base_image['alt']); ?>" class="base-image">
			<?php endif; ?>
			<?php foreach ($layers as $index => $layer): ?>
				<?php if (!empty($layer['image']['url'])): ?>
					<img
						src="<?php echo esc_url($layer['image']['url']); ?>"
						alt="<?php echo esc_attr($layer['image']['alt']); ?>"
						class="overlay-layer layer-<?php echo esc_attr($index); ?> <?php echo !empty($layer['visible']) ? 'visible' : ''; ?>"
						data-layer-index="<?php echo esc_attr($index); ?>"
						style="opacity: <?php echo esc_attr($layer['opacity'] / 100); ?>;"
					>
				<?php endif; ?>
			<?php endforeach; ?>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initImageOverlay === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initImageOverlay(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initImageOverlay === 'function') {
				window.initImageOverlay(element);
			}
		});
	}
})();
</script>
