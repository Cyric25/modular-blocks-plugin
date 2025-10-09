<?php
/**
 * Image Comparison Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$before_image = isset($block_attributes['beforeImage']) ? $block_attributes['beforeImage'] : array('url' => '', 'alt' => '', 'id' => null);
$after_image = isset($block_attributes['afterImage']) ? $block_attributes['afterImage'] : array('url' => '', 'alt' => '', 'id' => null);
$before_label = isset($block_attributes['beforeLabel']) ? esc_html($block_attributes['beforeLabel']) : 'Vorher';
$after_label = isset($block_attributes['afterLabel']) ? esc_html($block_attributes['afterLabel']) : 'Nachher';
$orientation = isset($block_attributes['orientation']) ? esc_attr($block_attributes['orientation']) : 'horizontal';
$starting_position = isset($block_attributes['startingPosition']) ? intval($block_attributes['startingPosition']) : 50;
$show_labels = isset($block_attributes['showLabels']) ? $block_attributes['showLabels'] : true;
$hover_animation = isset($block_attributes['hoverAnimation']) ? $block_attributes['hoverAnimation'] : true;
$height = isset($block_attributes['height']) ? intval($block_attributes['height']) : 400;
$transition_mode = isset($block_attributes['transitionMode']) ? esc_attr($block_attributes['transitionMode']) : 'slide';

// Berechne Aspect Ratio für padding-bottom trick (responsive height based on image aspect ratio)
$aspect_ratio_padding = 0;
if (!empty($before_image['id'])) {
	$image_meta = wp_get_attachment_metadata($before_image['id']);
	if ($image_meta && isset($image_meta['width']) && isset($image_meta['height']) && $image_meta['width'] > 0) {
		$aspect_ratio_padding = ($image_meta['height'] / $image_meta['width']) * 100;
	}
}
// Fallback auf height attribute wenn keine Bilddaten verfügbar
if ($aspect_ratio_padding == 0) {
	$aspect_ratio_padding = 56.25; // 16:9 default
}

// Konfiguration für JavaScript
$config = array(
	'orientation' => $orientation,
	'startingPosition' => $starting_position,
	'showLabels' => $show_labels,
	'hoverAnimation' => $hover_animation,
	'beforeLabel' => $before_label,
	'afterLabel' => $after_label,
	'transitionMode' => $transition_mode,
);

$block_id = wp_unique_id('image-comparison-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-image-comparison" data-comparison-config="<?php echo esc_attr(wp_json_encode($config)); ?>" data-transition-mode="<?php echo esc_attr($transition_mode); ?>">
	<script>console.log('Image Comparison Block:', {blockId: '<?php echo esc_js($block_id); ?>', transitionMode: '<?php echo esc_js($transition_mode); ?>', config: <?php echo wp_json_encode($config); ?>});</script>
	<?php if ($transition_mode === 'juxtaposition'): ?>
		<!-- Juxtaposition mode using img-comparison-slider Web Component -->
		<?php
		// Ensure the library is loaded
		static $juxtaposition_loaded = false;
		if (!$juxtaposition_loaded) {
			echo '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/styles.css">';
			echo '<script defer src="https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/index.js"></script>';
			$juxtaposition_loaded = true;
		}
		?>
		<div style="width: 100%; max-width: 100%; position: relative;">
			<img-comparison-slider value="<?php echo esc_attr($starting_position); ?>"<?php if ($orientation === 'vertical'): ?> direction="vertical"<?php endif; ?>>
				<?php if (!empty($after_image['url'])): ?>
					<img slot="first" src="<?php echo esc_url($after_image['url']); ?>" alt="<?php echo esc_attr($after_image['alt']); ?>" style="width: 100%; display: block;" />
				<?php endif; ?>
				<?php if (!empty($before_image['url'])): ?>
					<img slot="second" src="<?php echo esc_url($before_image['url']); ?>" alt="<?php echo esc_attr($before_image['alt']); ?>" style="width: 100%; display: block;" />
				<?php endif; ?>
				<?php if ($show_labels): ?>
					<div slot="first-overlay-end" class="jux-label"><?php echo $after_label; ?></div>
					<div slot="second-overlay-end" class="jux-label"><?php echo $before_label; ?></div>
				<?php endif; ?>
			</img-comparison-slider>
		</div>
	<?php else: ?>
		<!-- Slide/Fade modes using custom implementation -->
		<div class="image-comparison-container orientation-<?php echo $orientation; ?>">
			<div class="comparison-wrapper" data-transition-mode="<?php echo esc_attr($transition_mode); ?>" style="padding-bottom: <?php echo esc_attr($aspect_ratio_padding); ?>%;">
				<!-- Before image (Vorher-Bild) - always visible, fills entire container -->
				<div class="before-image-container">
					<?php if (!empty($before_image['url'])): ?>
						<img src="<?php echo esc_url($before_image['url']); ?>" alt="<?php echo esc_attr($before_image['alt']); ?>" class="before-image">
					<?php endif; ?>
				</div>

				<!-- After image (Nachher-Bild) - slides in from left OR fades in depending on transition mode -->
				<div class="after-image-container">
					<?php if (!empty($after_image['url'])):
						// For slide mode: position from left, for fade mode: already at position 0
						$initial_position = ($transition_mode === 'fade') ? '0' : ($starting_position - 100);
						$initial_opacity = ($transition_mode === 'fade') ? ($starting_position / 100) : '1';
					?>
						<img src="<?php echo esc_url($after_image['url']); ?>" alt="<?php echo esc_attr($after_image['alt']); ?>" class="after-image" style="<?php echo $orientation === 'horizontal' ? 'left' : 'top'; ?>: <?php echo esc_attr($initial_position); ?>%; opacity: <?php echo esc_attr($initial_opacity); ?>;">
					<?php endif; ?>
				</div>

				<!-- Labels -->
				<?php if ($show_labels): ?>
					<div class="image-label before-label">
						<?php echo $before_label; ?>
					</div>
					<div class="image-label after-label">
						<?php echo $after_label; ?>
					</div>
				<?php endif; ?>

				<!-- Slider -->
				<div class="comparison-slider" style="<?php echo $orientation === 'horizontal' ? 'left' : 'top'; ?>: <?php echo esc_attr($starting_position); ?>%;">
					<div class="slider-handle <?php echo $hover_animation ? 'hover-animation' : ''; ?>">
						<span class="slider-icon"><?php echo $orientation === 'horizontal' ? '⇄' : '⇅'; ?></span>
					</div>
				</div>
			</div>
		</div>
	<?php endif; ?>
</div>

<script>
(function() {
	if (typeof window.initImageComparison === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initImageComparison(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initImageComparison === 'function') {
				window.initImageComparison(element);
			}
		});
	}
})();
</script>
