<?php
/**
 * Point of Interest Block Template
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block instance
 */

// Extrahiere Attribute
$background_image = isset($block_attributes['backgroundImage']) ? $block_attributes['backgroundImage'] : array('url' => '', 'alt' => '', 'id' => null);
$title = isset($block_attributes['title']) ? esc_html($block_attributes['title']) : '';
$description = isset($block_attributes['description']) ? esc_html($block_attributes['description']) : '';
$hotspots = isset($block_attributes['hotspots']) ? $block_attributes['hotspots'] : array();
$hotspot_style = isset($block_attributes['hotspotStyle']) ? esc_attr($block_attributes['hotspotStyle']) : 'circle';
$popup_style = isset($block_attributes['popupStyle']) ? esc_attr($block_attributes['popupStyle']) : 'tooltip';
$popup_position = isset($block_attributes['popupPosition']) ? esc_attr($block_attributes['popupPosition']) : 'auto';
$show_numbers = isset($block_attributes['showNumbers']) ? $block_attributes['showNumbers'] : false;
$auto_close = isset($block_attributes['autoClose']) ? $block_attributes['autoClose'] : true;
$close_on_outside_click = isset($block_attributes['closeOnOutsideClick']) ? $block_attributes['closeOnOutsideClick'] : true;
$height = isset($block_attributes['height']) ? intval($block_attributes['height']) : 400;
$enable_zoom = isset($block_attributes['enableZoom']) ? $block_attributes['enableZoom'] : false;
$zoom_level = isset($block_attributes['zoomLevel']) ? intval($block_attributes['zoomLevel']) : 150;

// Konfiguration für JavaScript
$config = array(
	'hotspots' => $hotspots,
	'hotspotStyle' => $hotspot_style,
	'popupStyle' => $popup_style,
	'popupPosition' => $popup_position,
	'showNumbers' => $show_numbers,
	'autoClose' => $auto_close,
	'closeOnOutsideClick' => $close_on_outside_click,
	'enableZoom' => $enable_zoom,
	'zoomLevel' => $zoom_level,
);

$block_id = wp_unique_id('point-of-interest-');
?>

<div id="<?php echo esc_attr($block_id); ?>" class="wp-block-modular-blocks-point-of-interest" data-poi-config="<?php echo esc_attr(wp_json_encode($config)); ?>">
	<div class="poi-container">
		<?php if ($title): ?>
			<h3 class="poi-title"><?php echo $title; ?></h3>
		<?php endif; ?>

		<?php if ($description): ?>
			<p class="poi-description"><?php echo $description; ?></p>
		<?php endif; ?>

		<div class="poi-image-container" style="height: <?php echo esc_attr($height); ?>px;">
			<?php if (!empty($background_image['url'])): ?>
				<img src="<?php echo esc_url($background_image['url']); ?>" alt="<?php echo esc_attr($background_image['alt']); ?>" class="poi-background">
			<?php endif; ?>

			<div class="hotspots-layer">
				<?php foreach ($hotspots as $index => $hotspot): ?>
					<div
						class="hotspot hotspot-style-<?php echo $hotspot_style; ?> animation-<?php echo esc_attr($hotspot['animation']); ?>"
						data-hotspot-index="<?php echo esc_attr($index); ?>"
						data-hotspot-title="<?php echo esc_attr($hotspot['title']); ?>"
						data-hotspot-content="<?php echo esc_attr($hotspot['content']); ?>"
						style="
							left: <?php echo esc_attr($hotspot['x']); ?>%;
							top: <?php echo esc_attr($hotspot['y']); ?>%;
							background-color: <?php echo esc_attr($hotspot['color']); ?>;
						"
					>
						<span class="hotspot-icon"><?php echo $show_numbers ? ($index + 1) : ''; ?></span>
					</div>
				<?php endforeach; ?>
			</div>
		</div>

		<!-- Info Box unter dem Bild -->
		<div class="poi-info-box" style="display: none;">
			<div class="poi-info-header">
				<h4 class="poi-info-title"></h4>
				<button type="button" class="poi-info-close">&times;</button>
			</div>
			<div class="poi-info-content"></div>
		</div>
	</div>
</div>

<script>
(function() {
	if (typeof window.initPointOfInterest === 'function') {
		const element = document.getElementById('<?php echo esc_js($block_id); ?>');
		if (element) {
			window.initPointOfInterest(element);
		}
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			const element = document.getElementById('<?php echo esc_js($block_id); ?>');
			if (element && typeof window.initPointOfInterest === 'function') {
				window.initPointOfInterest(element);
			}
		});
	}
})();
</script>
