<?php
/**
 * Demo Card Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Demo Titel';
$content = $block_attributes['content'] ?? 'Dies ist ein Demo-Text für die Karte.';
$button_text = $block_attributes['buttonText'] ?? 'Mehr erfahren';
$button_url = $block_attributes['buttonUrl'] ?? '#';
$background_color = $block_attributes['backgroundColor'] ?? '#ffffff';
$text_color = $block_attributes['textColor'] ?? '#333333';

// Sanitize attributes
$title = esc_html($title);
$content = wp_kses_post($content);
$button_text = esc_html($button_text);
$button_url = esc_url($button_url);
$background_color = sanitize_hex_color($background_color);
$text_color = sanitize_hex_color($text_color);

// Generate unique ID for this block instance
$block_id = 'demo-card-' . wp_unique_id();

// Build CSS custom properties for styling
$css_vars = '';
if ($background_color) {
    $css_vars .= '--demo-card-bg-color: ' . $background_color . ';';
}
if ($text_color) {
    $css_vars .= '--demo-card-text-color: ' . $text_color . ';';
}
?>

<div id="<?php echo $block_id; ?>" class="wp-block-modular-blocks-demo-card" style="<?php echo $css_vars; ?>">
    <div class="demo-card-container">
        <?php if (!empty($title)): ?>
            <h3 class="demo-card-title"><?php echo $title; ?></h3>
        <?php endif; ?>

        <?php if (!empty($content)): ?>
            <div class="demo-card-content">
                <?php echo wpautop($content); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($button_text) && !empty($button_url)): ?>
            <div class="demo-card-actions">
                <a href="<?php echo $button_url; ?>" class="demo-card-button">
                    <?php echo $button_text; ?>
                </a>
            </div>
        <?php endif; ?>
    </div>
</div>