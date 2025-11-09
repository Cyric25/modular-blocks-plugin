(function(window, document) {
    'use strict';

    const ChemVizChartCreator = {
        charts: new Map(),

        init: function() {
            if (typeof window.Plotly === 'undefined') {
                console.error('ChemViz: Plotly.js library not loaded');
                return;
            }

            const chartElements = document.querySelectorAll('[data-chemviz-chart]');

            if (chartElements.length === 0) {
                return;
            }

            chartElements.forEach(element => {
                this.loadChart(element);
            });

            this.setupResizeHandler();
        },

        loadChart: function(element) {
            const config = this.parseConfig(element);
            const canvas = element.querySelector('.chemviz-chart__canvas');

            if (!canvas) {
                this.showError(element, 'Canvas element not found');
                return;
            }

            try {
                let data, layout, plotConfig;

                // Check if template is specified
                if (config.template && window.ChemVizChartTemplates && window.ChemVizChartTemplates[config.template]) {
                    const template = window.ChemVizChartTemplates[config.template];
                    data = template.data;
                    layout = { ...template.layout };
                    plotConfig = template.config;

                    // Override with custom labels if provided
                    if (config.title) {
                        layout.title = config.title;
                    }
                    if (config.xAxisLabel) {
                        layout.xaxis.title = config.xAxisLabel;
                    }
                    if (config.yAxisLabel) {
                        layout.yaxis.title = config.yAxisLabel;
                    }
                } else if (config.data) {
                    // Custom data from user
                    try {
                        data = JSON.parse(config.data);
                    } catch (e) {
                        this.showError(element, 'Invalid JSON data: ' + e.message);
                        return;
                    }

                    layout = {
                        title: config.title || 'Diagramm',
                        xaxis: {
                            title: config.xAxisLabel || 'X-Achse',
                            showgrid: true
                        },
                        yaxis: {
                            title: config.yAxisLabel || 'Y-Achse',
                            showgrid: true
                        },
                        showlegend: config.showLegend
                    };

                    plotConfig = {
                        responsive: true,
                        displayModeBar: true
                    };
                } else {
                    // No data provided, show placeholder
                    this.showError(element, 'Keine Daten oder Vorlage angegeben');
                    return;
                }

                // Apply common layout settings
                layout.autosize = true;
                layout.margin = { l: 60, r: 40, t: 60, b: 60 };
                layout.font = { family: 'Arial, sans-serif' };

                // Create plot
                window.Plotly.newPlot(canvas, data, layout, plotConfig);

                // Hide loading indicator
                const loadingEl = element.querySelector('.chemviz-chart__loading');
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                }

                element.querySelector('.chemviz-chart__container').classList.add('loaded');
                this.charts.set(canvas.id, { element: canvas, data, layout, config: plotConfig });

            } catch (error) {
                console.error('ChemViz Chart Error:', error);
                this.showError(element, error.message);
            }
        },

        parseConfig: function(element) {
            return {
                type: element.dataset.chartType || 'scatter',
                template: element.dataset.chartTemplate || '',
                data: element.dataset.chartData || '',
                title: element.dataset.chartTitle || '',
                xAxisLabel: element.dataset.xAxisLabel || '',
                yAxisLabel: element.dataset.yAxisLabel || '',
                showLegend: element.dataset.showLegend === 'true',
                width: parseInt(element.dataset.width) || 800,
                height: parseInt(element.dataset.height) || 600
            };
        },

        setupResizeHandler: function() {
            let resizeTimeout;
            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.charts.forEach((chart) => {
                        if (chart.element && window.Plotly) {
                            window.Plotly.Plots.resize(chart.element);
                        }
                    });
                }, 250);
            };

            window.addEventListener('resize', debouncedResize);
        },

        showError: function(element, message) {
            const container = element.querySelector('.chemviz-chart__container');
            if (container) {
                container.innerHTML = `
                    <div class="chemviz-chart__error">
                        <strong>Fehler beim Laden des Diagramms</strong>
                        <p>${message}</p>
                    </div>
                `;
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ChemVizChartCreator.init());
    } else {
        ChemVizChartCreator.init();
    }

    // Export for debugging
    window.ChemVizChartCreator = ChemVizChartCreator;

})(window, document);
