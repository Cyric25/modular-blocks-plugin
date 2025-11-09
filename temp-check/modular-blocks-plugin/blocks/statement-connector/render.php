<?php
/**
 * Statement Connector Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Verbinden Sie die zugehörigen Aussagen';
$description = $block_attributes['description'] ?? 'Ziehen Sie die Punkte von der linken Spalte zu den passenden Aussagen in der rechten Spalte.';
$left_column = $block_attributes['leftColumn'] ?? ['title' => 'Begriffe', 'items' => []];
$right_column = $block_attributes['rightColumn'] ?? ['title' => 'Definitionen', 'items' => []];
$connections = $block_attributes['connections'] ?? [];
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$allow_multiple_connections = $block_attributes['allowMultipleConnections'] ?? false;
$connection_style = $block_attributes['connectionStyle'] ?? 'line';
$line_width = $block_attributes['lineWidth'] ?? 3;
$animate_connections = $block_attributes['animateConnections'] ?? true;
$instant_feedback = $block_attributes['instantFeedback'] ?? false;
$success_text = $block_attributes['successText'] ?? 'Ausgezeichnet! Alle Verbindungen sind korrekt.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Einige Verbindungen sind richtig.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal. Überprüfen Sie Ihre Verbindungen.';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$connection_style = sanitize_text_field($connection_style);
$line_width = max(1, min(10, intval($line_width)));

// Validate columns
$left_items = $left_column['items'] ?? [];
$right_items = $right_column['items'] ?? [];

if (empty($left_items) || empty($right_items)) {
    return '<div class="connector-error"><p>' . __('Bitte konfigurieren Sie beide Spalten mit Aussagen.', 'modular-blocks-plugin') . '</p></div>';
}

// Generate unique ID for this block instance
$block_id = 'statement-connector-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-statement-connector',
    'connection-style-' . $connection_style,
    $allow_multiple_connections ? 'multiple-connections' : 'single-connections',
    $animate_connections ? 'animated-connections' : '',
    $instant_feedback ? 'instant-feedback' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Build inline styles
$inline_styles = [
    '--connection-width: ' . $line_width . 'px;'
];
$inline_style = implode(' ', $inline_styles);

// Prepare data for JavaScript
$connector_data = [
    'leftItems' => $left_items,
    'rightItems' => $right_items,
    'connections' => $connections,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'allowMultipleConnections' => $allow_multiple_connections,
    'connectionStyle' => $connection_style,
    'lineWidth' => $line_width,
    'animateConnections' => $animate_connections,
    'instantFeedback' => $instant_feedback,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'strings' => [
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'dragToConnect' => __('Ziehen Sie zum Verbinden', 'modular-blocks-plugin'),
        'connected' => __('Verbunden', 'modular-blocks-plugin'),
        'notConnected' => __('Nicht verbunden', 'modular-blocks-plugin'),
        'correct' => __('Richtig', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch', 'modular-blocks-plugin'),
        'removeConnection' => __('Verbindung entfernen', 'modular-blocks-plugin')
    ]
];
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>" style="<?php echo esc_attr($inline_style); ?>" data-connector="<?php echo esc_attr(json_encode($connector_data)); ?>">
    <div class="connector-container">

        <!-- Header -->
        <div class="connector-header">
            <?php if (!empty($title)): ?>
                <h3 class="connector-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="connector-description"><?php echo $description; ?></div>
            <?php endif; ?>
        </div>

        <!-- Connection Area -->
        <div class="connection-area">
            <!-- Left Column -->
            <div class="connection-column left-column">
                <?php if (!empty($left_column['title'])): ?>
                    <h4 class="column-title"><?php echo esc_html($left_column['title']); ?></h4>
                <?php endif; ?>

                <div class="column-items">
                    <?php foreach ($left_items as $index => $item): ?>
                        <?php
                        $item_id = sanitize_text_field($item['id'] ?? 'left-' . $index);
                        $item_text = wp_kses_post($item['text'] ?? '');
                        $item_color = sanitize_hex_color($item['color'] ?? '#0073aa');
                        ?>
                        <div
                            class="connection-item left-item"
                            data-item-id="<?php echo esc_attr($item_id); ?>"
                            data-column="left"
                            style="--item-color: <?php echo $item_color; ?>;"
                            tabindex="0"
                            role="button"
                            aria-label="<?php echo esc_attr($item_text); ?>"
                        >
                            <div class="item-content">
                                <span class="item-text"><?php echo $item_text; ?></span>
                                <div class="connection-point" data-item="<?php echo esc_attr($item_id); ?>">
                                    <div class="connection-dot"></div>
                                    <div class="connection-ripple"></div>
                                </div>
                            </div>
                            <div class="item-feedback" style="display: none;"></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Connection Canvas -->
            <div class="connection-canvas">
                <svg class="connection-svg" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <marker id="arrowhead-<?php echo esc_attr($block_id); ?>" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                        </marker>

                        <!-- Gradient for animated connections -->
                        <linearGradient id="connection-gradient-<?php echo esc_attr($block_id); ?>" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:currentColor;stop-opacity:0.3">
                                <animate attributeName="stop-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                            </stop>
                            <stop offset="50%" style="stop-color:currentColor;stop-opacity:0.8">
                                <animate attributeName="stop-opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
                            </stop>
                            <stop offset="100%" style="stop-color:currentColor;stop-opacity:0.3">
                                <animate attributeName="stop-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                            </stop>
                        </linearGradient>
                    </defs>

                    <!-- Connection lines will be added here by JavaScript -->
                </svg>

                <!-- Temporary drag line -->
                <svg class="drag-line-svg" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                    <line class="drag-line" stroke="currentColor" stroke-width="<?php echo $line_width; ?>" stroke-dasharray="5,5" opacity="0.7" />
                </svg>
            </div>

            <!-- Right Column -->
            <div class="connection-column right-column">
                <?php if (!empty($right_column['title'])): ?>
                    <h4 class="column-title"><?php echo esc_html($right_column['title']); ?></h4>
                <?php endif; ?>

                <div class="column-items">
                    <?php foreach ($right_items as $index => $item): ?>
                        <?php
                        $item_id = sanitize_text_field($item['id'] ?? 'right-' . $index);
                        $item_text = wp_kses_post($item['text'] ?? '');
                        $item_color = sanitize_hex_color($item['color'] ?? '#0073aa');
                        ?>
                        <div
                            class="connection-item right-item"
                            data-item-id="<?php echo esc_attr($item_id); ?>"
                            data-column="right"
                            style="--item-color: <?php echo $item_color; ?>;"
                            tabindex="0"
                            role="button"
                            aria-label="<?php echo esc_attr($item_text); ?>"
                        >
                            <div class="item-content">
                                <div class="connection-point" data-item="<?php echo esc_attr($item_id); ?>">
                                    <div class="connection-dot"></div>
                                    <div class="connection-ripple"></div>
                                </div>
                                <span class="item-text"><?php echo $item_text; ?></span>
                            </div>
                            <div class="item-feedback" style="display: none;"></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="connector-controls">
            <button type="button" class="connector-button connector-check" disabled>
                <?php _e('Prüfen', 'modular-blocks-plugin'); ?>
            </button>

            <?php if ($show_retry): ?>
                <button type="button" class="connector-button connector-retry" style="display: none;">
                    <?php _e('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button" class="connector-button connector-solution" style="display: none;">
                    <?php _e('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>

        <!-- Results -->
        <div class="connector-results" style="display: none;">
            <div class="results-content">
                <div class="score-display"></div>
                <div class="result-message"></div>
                <div class="connection-feedback"></div>
            </div>
        </div>

        <!-- Instructions -->
        <div class="connector-instructions">
            <p class="instruction-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <?php _e('Ziehen Sie von den Verbindungspunkten der linken Spalte zu den passenden Punkten der rechten Spalte.', 'modular-blocks-plugin'); ?>
            </p>
        </div>

    </div>
</div>

<script>
// Initialize statement connector functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const connectorBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (connectorBlock && typeof window.initStatementConnector === 'function') {
        window.initStatementConnector(connectorBlock);
    }
});
</script>