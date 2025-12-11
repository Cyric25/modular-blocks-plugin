<?php
/**
 * Web-App Embed Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$app_name = $block_attributes['appName'] ?? '';
$height = $block_attributes['height'] ?? 600;
$aspect_ratio = $block_attributes['aspectRatio'] ?? 'custom';
$allow_fullscreen = $block_attributes['allowFullscreen'] ?? true;
$show_border = $block_attributes['showBorder'] ?? false;
$border_radius = $block_attributes['borderRadius'] ?? 4;

// Sanitize attributes
$app_name = sanitize_file_name($app_name);
$height = max(200, min(2000, intval($height)));
$aspect_ratio = in_array($aspect_ratio, ['custom', '16:9', '4:3', '1:1']) ? $aspect_ratio : 'custom';
$border_radius = max(0, min(20, intval($border_radius)));

// Check if app name is provided
if (empty($app_name)) {
    return '<div class="web-app-embed-placeholder"><p>' . __('Bitte wählen Sie eine Web-App aus.', 'modular-blocks-plugin') . '</p></div>';
}

// Get web-app URL
require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-webapp-manager.php';
$webapp_manager = new ModularBlocks_WebApp_Manager();
$app_url = $webapp_manager->get_webapp_url($app_name);

// Check if app exists
$app_dir = $webapp_manager->get_webapps_dir() . $app_name;
if (!file_exists($app_dir)) {
    return '<div class="web-app-embed-error"><p>' . __('Web-App nicht gefunden.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'web-app-embed-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-web-app-embed',
    'aspect-ratio-' . str_replace(':', '-', $aspect_ratio),
    $show_border ? 'has-border' : '',
];

$css_class = implode(' ', array_filter($css_classes));

// Build inline styles
$inline_styles = [];

if ($aspect_ratio === 'custom') {
    $inline_styles[] = '--webapp-height: ' . $height . 'px;';
} else {
    // Calculate aspect ratio
    $ratio_map = [
        '16:9' => '56.25%',
        '4:3' => '75%',
        '1:1' => '100%'
    ];
    $inline_styles[] = '--webapp-aspect-ratio: ' . $ratio_map[$aspect_ratio] . ';';
}

if ($show_border) {
    $inline_styles[] = '--webapp-border-radius: ' . $border_radius . 'px;';
}

$inline_style = implode(' ', $inline_styles);

// Sandbox attributes for security
$sandbox_attrs = [
    'allow-scripts',
    'allow-same-origin',
    'allow-forms',
    'allow-popups',
    'allow-popups-to-escape-sandbox'
];
$sandbox = implode(' ', $sandbox_attrs);
?>

<div id="<?php echo esc_attr($block_id); ?>"
     class="<?php echo esc_attr($css_class); ?>"
     style="<?php echo esc_attr($inline_style); ?>">

    <div class="webapp-embed-container">
        <iframe
            src="<?php echo esc_url($app_url); ?>"
            class="webapp-embed-iframe"
            frameborder="0"
            sandbox="<?php echo esc_attr($sandbox); ?>"
            <?php echo $allow_fullscreen ? 'allowfullscreen' : ''; ?>
            loading="lazy"
            title="<?php echo esc_attr($app_name); ?>"
        ></iframe>
    </div>

    <?php if ($allow_fullscreen): ?>
        <button class="webapp-fullscreen-btn"
                onclick="toggleWebAppFullscreen('<?php echo esc_js($block_id); ?>')"
                aria-label="Vollbild">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H8V5H5V8H3V3Z" fill="currentColor"/>
                <path d="M17 3H12V5H15V8H17V3Z" fill="currentColor"/>
                <path d="M3 17H8V15H5V12H3V17Z" fill="currentColor"/>
                <path d="M17 17H12V15H15V12H17V17Z" fill="currentColor"/>
            </svg>
        </button>
    <?php endif; ?>
</div>

<script>
function toggleWebAppFullscreen(blockId) {
    const block = document.getElementById(blockId);
    const iframe = block.querySelector('.webapp-embed-iframe');

    if (!document.fullscreenElement) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
</script>
