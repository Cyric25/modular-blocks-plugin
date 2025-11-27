/**
 * Interactive Data Chart Block - Frontend functionality
 */

(function() {
    'use strict';

    // Store initialized charts
    const chartInstances = new Map();

    /**
     * Initialize interactive data chart block
     * @param {HTMLElement} blockElement - The block container element
     */
    window.initInteractiveDataChart = function(blockElement) {
        if (!blockElement) return;

        const blockId = blockElement.id;
        if (chartInstances.has(blockId)) {
            return; // Already initialized
        }

        // Get block configuration
        const chartType = blockElement.dataset.chartType || 'bar';
        const chartTitle = blockElement.dataset.chartTitle || 'Mein Diagramm';
        const xAxisLabel = blockElement.dataset.xAxisLabel || 'X-Achse';
        const yAxisLabel = blockElement.dataset.yAxisLabel || 'Y-Achse';

        // Get DOM elements
        const dataTable = blockElement.querySelector('.data-input-table');
        const generateBtn = blockElement.querySelector('.generate-chart-btn');
        const clearBtn = blockElement.querySelector('.clear-chart-btn');
        const chartDisplay = blockElement.querySelector('.chart-display');
        const messageBox = blockElement.querySelector('.chart-message');

        if (!dataTable || !generateBtn || !chartDisplay) {
            console.error('Required elements not found for chart block', blockId);
            return;
        }

        // Store instance
        chartInstances.set(blockId, {
            blockElement,
            chartDisplay,
            chartType,
            chartTitle,
            xAxisLabel,
            yAxisLabel
        });

        /**
         * Show message to user
         * @param {string} message - Message text
         * @param {string} type - Message type (error, success, info)
         */
        function showMessage(message, type = 'info') {
            if (!messageBox) return;

            messageBox.textContent = message;
            messageBox.className = 'chart-message ' + type;
            messageBox.style.display = 'block';

            // Auto-hide after 5 seconds for success/info
            if (type !== 'error') {
                setTimeout(() => {
                    messageBox.style.display = 'none';
                }, 5000);
            }
        }

        /**
         * Extract data from table
         * @returns {object} - Extracted data with labels and values
         */
        function extractTableData() {
            const rows = dataTable.querySelectorAll('tbody tr');
            const data = {
                labels: [],
                values: []
            };

            rows.forEach(row => {
                const cells = row.querySelectorAll('.data-cell');
                if (cells.length < 2) return;

                const label = cells[0].value.trim();
                const value = cells[1].value.trim();

                // Skip empty rows
                if (!label && !value) return;

                // Parse value as number
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    return; // Skip non-numeric values
                }

                data.labels.push(label || 'Eintrag ' + (data.labels.length + 1));
                data.values.push(numValue);
            });

            return data;
        }

        /**
         * Validate table data
         * @param {object} data - Extracted data
         * @returns {boolean} - Whether data is valid
         */
        function validateData(data) {
            if (data.labels.length === 0 || data.values.length === 0) {
                showMessage('Bitte geben Sie mindestens einen Datensatz ein.', 'error');
                return false;
            }

            if (data.labels.length !== data.values.length) {
                showMessage('Anzahl der Beschriftungen und Werte stimmt nicht überein.', 'error');
                return false;
            }

            return true;
        }

        /**
         * Generate Plotly chart
         * @param {object} data - Chart data
         */
        function generateChart(data) {
            // Check if Plotly is available
            if (typeof Plotly === 'undefined') {
                showMessage('Plotly.js konnte nicht geladen werden. Bitte laden Sie die Seite neu.', 'error');
                return;
            }

            // Prepare chart data based on type
            let plotlyData = [];
            let layout = {
                title: chartTitle,
                xaxis: {
                    title: xAxisLabel
                },
                yaxis: {
                    title: yAxisLabel
                },
                responsive: true,
                autosize: true
            };

            switch (chartType) {
                case 'bar':
                    plotlyData = [{
                        x: data.labels,
                        y: data.values,
                        type: 'bar',
                        marker: {
                            color: '#0073aa'
                        }
                    }];
                    break;

                case 'line':
                    plotlyData = [{
                        x: data.labels,
                        y: data.values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: {
                            color: '#0073aa',
                            width: 3
                        },
                        marker: {
                            size: 8,
                            color: '#0073aa'
                        }
                    }];
                    break;

                case 'scatter':
                    plotlyData = [{
                        x: data.labels,
                        y: data.values,
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            size: 12,
                            color: '#0073aa'
                        }
                    }];
                    break;

                case 'pie':
                    plotlyData = [{
                        labels: data.labels,
                        values: data.values,
                        type: 'pie',
                        marker: {
                            colors: ['#0073aa', '#00a0d2', '#33b3db', '#66c6e4', '#99d9ed']
                        }
                    }];
                    // Pie charts don't need axis labels
                    layout = {
                        title: chartTitle,
                        responsive: true,
                        autosize: true
                    };
                    break;

                default:
                    showMessage('Unbekannter Chart-Typ: ' + chartType, 'error');
                    return;
            }

            // Configure Plotly options
            const config = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
            };

            // Create chart
            try {
                Plotly.newPlot(chartDisplay, plotlyData, layout, config);
                chartDisplay.style.display = 'block';
                chartDisplay.classList.add('active');
                clearBtn.style.display = 'inline-flex';
                showMessage('Diagramm erfolgreich erstellt!', 'success');
            } catch (error) {
                console.error('Error creating chart:', error);
                showMessage('Fehler beim Erstellen des Diagramms: ' + error.message, 'error');
            }
        }

        /**
         * Clear chart and reset inputs
         */
        function clearChart() {
            if (typeof Plotly !== 'undefined') {
                Plotly.purge(chartDisplay);
            }
            chartDisplay.style.display = 'none';
            chartDisplay.classList.remove('active');
            clearBtn.style.display = 'none';

            // Clear table inputs
            const cells = dataTable.querySelectorAll('.data-cell');
            cells.forEach(cell => {
                cell.value = '';
            });

            if (messageBox) {
                messageBox.style.display = 'none';
            }

            showMessage('Tabelle und Diagramm wurden zurückgesetzt.', 'info');
        }

        /**
         * Handle generate button click
         */
        generateBtn.addEventListener('click', function() {
            const data = extractTableData();

            if (!validateData(data)) {
                return;
            }

            generateChart(data);
        });

        /**
         * Handle clear button click
         */
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('Möchten Sie die Tabelle wirklich zurücksetzen?')) {
                    clearChart();
                }
            });
        }

        /**
         * Handle Enter key in table cells
         */
        const tableCells = dataTable.querySelectorAll('.data-cell');
        tableCells.forEach((cell, index) => {
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();

                    // Move to next cell
                    if (index < tableCells.length - 1) {
                        tableCells[index + 1].focus();
                    } else {
                        // Last cell - trigger chart generation
                        generateBtn.click();
                    }
                }
            });
        });
    };

    /**
     * Initialize all chart blocks on page
     */
    function initAllCharts() {
        const chartBlocks = document.querySelectorAll('.wp-block-modular-blocks-interactive-data-chart');
        chartBlocks.forEach(block => {
            window.initInteractiveDataChart(block);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllCharts);
    } else {
        initAllCharts();
    }

    // Handle window resize for responsive charts
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (typeof Plotly !== 'undefined') {
                chartInstances.forEach(instance => {
                    if (instance.chartDisplay.classList.contains('active')) {
                        Plotly.Plots.resize(instance.chartDisplay);
                    }
                });
            }
        }, 250);
    });

})();
