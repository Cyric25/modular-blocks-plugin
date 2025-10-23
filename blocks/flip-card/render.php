<?php
/**
 * Flip Card Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$front_image = isset($block_attributes['frontImage']) ? $block_attributes['frontImage'] : array('url' => '', 'alt' => '', 'id' => null);
$back_image = isset($block_attributes['backImage']) ? $block_attributes['backImage'] : array('url' => '', 'alt' => '', 'id' => null);
$front_label = isset($block_attributes['frontLabel']) ? esc_html($block_attributes['frontLabel']) : 'Vorderseite';
$back_label = isset($block_attributes['backLabel']) ? esc_html($block_attributes['backLabel']) : 'Rückseite';
$flip_direction = isset($block_attributes['flipDirection']) ? esc_attr($block_attributes['flipDirection']) : 'horizontal';
$flip_trigger = isset($block_attributes['flipTrigger']) ? esc_attr($block_attributes['flipTrigger']) : 'click';
$auto_flip = isset($block_attributes['autoFlip']) ? $block_attributes['autoFlip'] : false;
$show_labels = isset($block_attributes['showLabels']) ? $block_attributes['showLabels'] : true;
$height = isset($block_attributes['height']) ? intval($block_attributes['height']) : 400;

// Konfiguration für JavaScript
$config = array(
	'flipDirection' => $flip_direction,
	'flipTrigger' => $flip_trigger,
	'autoFlip' => $auto_flip,
);

$block_id = wp_unique_id('flip-card-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-flip-card" data-flip-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="flip-card-container flip-direction-<?php echo esc_attr($flip_direction); ?> flip-trigger-<?php echo esc_attr($flip_trigger); ?>" style="height: <?php echo esc_attr($height); ?>px;">
		<div class="flip-card-inner">
			<!-- Front side -->
			<div class="flip-card-face flip-card-front">
				<?php if (!empty($front_image['url'])): ?>
					<img src="<?php echo esc_url($front_image['url']); ?>" alt="<?php echo esc_attr($front_image['alt']); ?>" class="flip-card-image">
				<?php endif; ?>
				<?php if ($show_labels): ?>
					<div class="flip-card-label"><?php echo $front_label; ?></div>
				<?php endif; ?>
			</div>

			<!-- Back side -->
			<div class="flip-card-face flip-card-back">
				<?php if (!empty($back_image['url'])): ?>
					<img src="<?php echo esc_url($back_image['url']); ?>" alt="<?php echo esc_attr($back_image['alt']); ?>" class="flip-card-image">
				<?php endif; ?>
				<?php if ($show_labels): ?>
					<div class="flip-card-label"><?php echo $back_label; ?></div>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initFlipCard === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initFlipCard(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initFlipCard === 'function') {
				window.initFlipCard(element);
			}
		});
	}
})();
</script>
