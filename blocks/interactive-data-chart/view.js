/**
 * Interactive Data Chart Block - Frontend functionality
 */

(function() {
    'use strict';

    // Store initialized charts
    const chartInstances = new Map();

    /**
     * Calculate linear regression
     * @param {array} xValues - X coordinates
     * @param {array} yValues - Y coordinates
     * @returns {object} - Regression parameters {slope, intercept, rSquared}
     */
    function calculateLinearRegression(xValues, yValues) {
        const n = xValues.length;

        if (n === 0) {
            return { slope: 0, intercept: 0, rSquared: 0 };
        }

        // Calculate means
        const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
        const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

        // Calculate slope and intercept
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
            denominator += Math.pow(xValues[i] - xMean, 2);
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - slope * xMean;

        // Calculate R² (coefficient of determination)
        let ssTotal = 0;
        let ssResidual = 0;

        for (let i = 0; i < n; i++) {
            const yPredicted = slope * xValues[i] + intercept;
            ssTotal += Math.pow(yValues[i] - yMean, 2);
            ssResidual += Math.pow(yValues[i] - yPredicted, 2);
        }

        const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

        return {
            slope: slope,
            intercept: intercept,
            rSquared: rSquared
        };
    }

    /**
     * Format regression equation
     * @param {number} slope - Slope value
     * @param {number} intercept - Intercept value
     * @returns {string} - Formatted equation
     */
    function formatRegressionEquation(slope, intercept) {
        const slopeStr = slope.toFixed(4);
        const interceptStr = Math.abs(intercept).toFixed(4);
        const sign = intercept >= 0 ? '+' : '-';

        return `y = ${slopeStr}x ${sign} ${interceptStr}`;
    }

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
        const showRegression = blockElement.dataset.showRegression === '1';
        const showRegressionEquation = blockElement.dataset.showRegressionEquation === '1';

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
            yAxisLabel,
            showRegression,
            showRegressionEquation
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
         * @returns {object} - Extracted data with x and y arrays
         */
        function extractTableData() {
            const rows = dataTable.querySelectorAll('tbody tr');
            const data = {
                x: [],
                y: []
            };

            rows.forEach(row => {
                const cells = row.querySelectorAll('.data-cell');
                if (cells.length < 2) return;

                const firstValue = cells[0].value.trim();
                const secondValue = cells[1].value.trim();

                // Skip empty rows
                if (!firstValue && !secondValue) return;

                // For scatter charts, both values must be numeric
                if (chartType === 'scatter') {
                    const xNum = parseFloat(firstValue);
                    const yNum = parseFloat(secondValue);

                    if (isNaN(xNum) || isNaN(yNum)) {
                        return; // Skip non-numeric values
                    }

                    data.x.push(xNum);
                    data.y.push(yNum);
                } else {
                    // For other chart types (bar, line, pie)
                    const label = firstValue || 'Eintrag ' + (data.x.length + 1);
                    const value = parseFloat(secondValue);

                    if (isNaN(value)) {
                        return; // Skip non-numeric values
                    }

                    data.x.push(label);
                    data.y.push(value);
                }
            });

            return data;
        }

        /**
         * Validate table data
         * @param {object} data - Extracted data
         * @returns {boolean} - Whether data is valid
         */
        function validateData(data) {
            if (data.x.length === 0 || data.y.length === 0) {
                showMessage('Bitte geben Sie mindestens einen Datensatz ein.', 'error');
                return false;
            }

            if (data.x.length !== data.y.length) {
                showMessage('Anzahl der X- und Y-Werte stimmt nicht überein.', 'error');
                return false;
            }

            // For scatter with regression, need at least 2 points
            if (chartType === 'scatter' && showRegression && data.x.length < 2) {
                showMessage('Für eine Regressionsgerade werden mindestens 2 Datenpunkte benötigt.', 'error');
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

            let regressionInfo = null;

            switch (chartType) {
                case 'bar':
                    plotlyData = [{
                        x: data.x,
                        y: data.y,
                        type: 'bar',
                        marker: {
                            color: '#0073aa'
                        },
                        name: 'Daten'
                    }];
                    break;

                case 'line':
                    plotlyData = [{
                        x: data.x,
                        y: data.y,
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: {
                            color: '#0073aa',
                            width: 3
                        },
                        marker: {
                            size: 8,
                            color: '#0073aa'
                        },
                        name: 'Daten'
                    }];
                    break;

                case 'scatter':
                    plotlyData = [{
                        x: data.x,
                        y: data.y,
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            size: 10,
                            color: '#0073aa'
                        },
                        name: 'Datenpunkte'
                    }];

                    // Add regression line if enabled
                    if (showRegression && data.x.length >= 2) {
                        const regression = calculateLinearRegression(data.x, data.y);

                        // Calculate regression line points
                        const xMin = Math.min(...data.x);
                        const xMax = Math.max(...data.x);
                        const xRange = [xMin, xMax];
                        const yRange = xRange.map(x => regression.slope * x + regression.intercept);

                        // Add regression line to plot
                        plotlyData.push({
                            x: xRange,
                            y: yRange,
                            type: 'scatter',
                            mode: 'lines',
                            line: {
                                color: '#e74c3c',
                                width: 2,
                                dash: 'dash'
                            },
                            name: 'Regressionsgerade'
                        });

                        // Store regression info for display
                        regressionInfo = {
                            equation: formatRegressionEquation(regression.slope, regression.intercept),
                            rSquared: regression.rSquared,
                            slope: regression.slope,
                            intercept: regression.intercept
                        };
                    }
                    break;

                case 'pie':
                    plotlyData = [{
                        labels: data.x,
                        values: data.y,
                        type: 'pie',
                        marker: {
                            colors: ['#0073aa', '#00a0d2', '#33b3db', '#66c6e4', '#99d9ed', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#34495e']
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
                // Debug: Log plotlyData to verify regression line is included
                console.log('Creating chart with data:', {
                    chartType: chartType,
                    showRegression: showRegression,
                    tracesCount: plotlyData.length,
                    traces: plotlyData.map(t => ({ type: t.type, mode: t.mode, name: t.name }))
                });

                // Use Plotly.react instead of newPlot for better updating
                Plotly.react(chartDisplay, plotlyData, layout, config);
                chartDisplay.style.display = 'block';
                chartDisplay.classList.add('active');
                clearBtn.style.display = 'inline-flex';

                // Display regression info if available
                if (regressionInfo && showRegressionEquation) {
                    const rSquaredPercent = (regressionInfo.rSquared * 100).toFixed(2);
                    const infoMessage = `Regressionsgleichung: ${regressionInfo.equation} | R² = ${regressionInfo.rSquared.toFixed(4)} (${rSquaredPercent}%)`;
                    showMessage(infoMessage, 'success');
                    console.log('Regression info:', regressionInfo);
                } else {
                    showMessage('Diagramm erfolgreich erstellt!', 'success');
                }
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
