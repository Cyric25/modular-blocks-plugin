<?php
/**
 * Interactive Data Chart Block Render Template
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$chart_type = $block_attributes['chartType'] ?? 'bar';
$chart_title = $block_attributes['chartTitle'] ?? 'Mein Diagramm';
$x_axis_label = $block_attributes['xAxisLabel'] ?? 'X-Achse';
$y_axis_label = $block_attributes['yAxisLabel'] ?? 'Y-Achse';
$table_rows = $block_attributes['tableRows'] ?? 5;
$table_columns = $block_attributes['tableColumns'] ?? 2;
$show_table = $block_attributes['showTable'] ?? true;
$column_headers = $block_attributes['columnHeaders'] ?? ['Kategorie', 'Wert'];
$show_regression = $block_attributes['showRegression'] ?? false;
$show_regression_equation = $block_attributes['showRegressionEquation'] ?? true;

// Sanitize attributes
$chart_type = in_array($chart_type, ['bar', 'line', 'scatter', 'pie']) ? $chart_type : 'bar';
$chart_title = esc_html($chart_title);
$x_axis_label = esc_html($x_axis_label);
$y_axis_label = esc_html($y_axis_label);
$table_rows = max(2, min(20, intval($table_rows)));
$table_columns = max(2, min(10, intval($table_columns)));

// Adjust column headers based on chart type
if ($chart_type === 'scatter') {
    $column_headers = [$x_axis_label ?: 'X-Wert', $y_axis_label ?: 'Y-Wert'];
    $table_columns = 2; // Force 2 columns for scatter
} elseif ($chart_type === 'pie') {
    $column_headers = ['Kategorie', 'Wert'];
    $table_columns = 2; // Force 2 columns for pie
} else {
    // bar, line
    $column_headers = ['Beschriftung', 'Wert'];
    $table_columns = 2; // Force 2 columns
}

// Generate unique ID for this block instance
$block_id = 'interactive-data-chart-' . wp_unique_id();

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-interactive-data-chart',
    'chart-type-' . $chart_type,
    $show_table ? 'show-table' : 'hide-table'
];

$css_class = implode(' ', array_filter($css_classes));
?>

<div id="<?php echo esc_attr($block_id); ?>" class="<?php echo esc_attr($css_class); ?>"
     data-chart-type="<?php echo esc_attr($chart_type); ?>"
     data-chart-title="<?php echo esc_attr($chart_title); ?>"
     data-x-axis-label="<?php echo esc_attr($x_axis_label); ?>"
     data-y-axis-label="<?php echo esc_attr($y_axis_label); ?>"
     data-show-regression="<?php echo $show_regression ? '1' : '0'; ?>"
     data-show-regression-equation="<?php echo $show_regression_equation ? '1' : '0'; ?>">

    <div class="chart-container">
        <h3 class="chart-title"><?php echo $chart_title; ?></h3>

        <?php if ($show_table): ?>
        <div class="data-table-wrapper">
            <table class="data-input-table">
                <thead>
                    <tr>
                        <?php for ($col = 0; $col < $table_columns; $col++): ?>
                            <th>
                                <?php echo esc_html($column_headers[$col] ?? 'Spalte ' . ($col + 1)); ?>
                            </th>
                        <?php endfor; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php for ($row = 0; $row < $table_rows; $row++): ?>
                        <tr>
                            <?php for ($col = 0; $col < $table_columns; $col++):
                                // Dynamic placeholder based on chart type
                                if ($chart_type === 'scatter') {
                                    $placeholder = $col === 0 ? 'X-Wert' : 'Y-Wert';
                                } else {
                                    $placeholder = $col === 0 ? 'Beschriftung' : 'Wert';
                                }
                            ?>
                                <td>
                                    <input
                                        type="text"
                                        class="data-cell"
                                        data-row="<?php echo $row; ?>"
                                        data-col="<?php echo $col; ?>"
                                        placeholder="<?php echo esc_attr($placeholder); ?>"
                                        value=""
                                    />
                                </td>
                            <?php endfor; ?>
                        </tr>
                    <?php endfor; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>

        <div class="chart-controls">
            <button class="generate-chart-btn" type="button">
                <span class="dashicons dashicons-chart-bar"></span>
                Diagramm erstellen
            </button>
            <button class="clear-chart-btn" type="button" style="display: none;">
                <span class="dashicons dashicons-trash"></span>
                Zurücksetzen
            </button>
        </div>

        <div class="chart-display" id="<?php echo esc_attr($block_id); ?>-chart" style="display: none;">
            <!-- Plotly chart will be rendered here -->
        </div>

        <div class="chart-message" style="display: none;"></div>
    </div>
</div>

<script>
// Initialize interactive data chart functionality
document.addEventListener('DOMContentLoaded', function() {
    const chartBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (chartBlock && typeof window.initInteractiveDataChart === 'function') {
        window.initInteractiveDataChart(chartBlock);
    }
});
</script>
