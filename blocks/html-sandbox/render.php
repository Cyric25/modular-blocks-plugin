<?php
/**
 * HTML Sandbox Block - Server-side rendering
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block object
 */

if (!defined('ABSPATH')) {
	exit; // Exit if accessed directly
}

// Extract attributes with defaults
$html_code = $block_attributes['htmlCode'] ?? '';
$css_code = $block_attributes['cssCode'] ?? '';
$js_code = $block_attributes['jsCode'] ?? '';
$external_scripts = $block_attributes['externalScripts'] ?? '';
$isolation_mode = $block_attributes['isolationMode'] ?? 'iframe';
$sandbox_flags = $block_attributes['sandboxFlags'] ?? [];
$auto_height = $block_attributes['autoHeight'] ?? true;
$min_height = $block_attributes['minHeight'] ?? 200;
$max_height = $block_attributes['maxHeight'] ?? 800;

// Build sandbox attribute for iframe
$sandbox_attr_parts = [];
if (!empty($sandbox_flags['allowScripts'])) {
	$sandbox_attr_parts[] = 'allow-scripts';
}
if (!empty($sandbox_flags['allowForms'])) {
	$sandbox_attr_parts[] = 'allow-forms';
}
if (!empty($sandbox_flags['allowModals'])) {
	$sandbox_attr_parts[] = 'allow-modals';
}
if (!empty($sandbox_flags['allowPointerLock'])) {
	$sandbox_attr_parts[] = 'allow-pointer-lock';
}
if (!empty($sandbox_flags['allowPopups'])) {
	$sandbox_attr_parts[] = 'allow-popups';
}
if (!empty($sandbox_flags['allowSameOrigin'])) {
	$sandbox_attr_parts[] = 'allow-same-origin';
}
$sandbox_attr = implode(' ', $sandbox_attr_parts);

// Generate unique ID for this block instance
$block_id = 'html-sandbox-' . uniqid();

// Wrapper classes
$wrapper_classes = ['wp-block-modular-blocks-html-sandbox'];
if (!empty($block_attributes['align'])) {
	$wrapper_classes[] = 'align' . $block_attributes['align'];
}
?>

<div class="<?php echo esc_attr(implode(' ', $wrapper_classes)); ?>"
     id="<?php echo esc_attr($block_id); ?>"
     data-mode="<?php echo esc_attr($isolation_mode); ?>">

	<div class="html-sandbox-container"
	     data-html="<?php echo esc_attr($html_code); ?>"
	     data-css="<?php echo esc_attr($css_code); ?>"
	     data-js="<?php echo esc_attr($js_code); ?>"
	     data-external-scripts="<?php echo esc_attr($external_scripts); ?>"
	     data-sandbox="<?php echo esc_attr($sandbox_attr); ?>"
	     data-auto-height="<?php echo $auto_height ? 'true' : 'false'; ?>"
	     data-min-height="<?php echo esc_attr($min_height); ?>"
	     data-max-height="<?php echo esc_attr($max_height); ?>">

		<noscript>
			<div class="html-sandbox-noscript">
				<?php esc_html_e('Dieser Inhalt benötigt JavaScript.', 'modular-blocks-plugin'); ?>
			</div>
		</noscript>
	</div>

</div>
