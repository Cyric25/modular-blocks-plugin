/**
 * ChemViz Chart Templates
 * Predefined chemistry-specific chart templates for Plotly.js
 */

(function(window) {
    'use strict';

    const ChartTemplates = {
        titration: {
            name: 'Säure-Base-Titration',
            data: [{
                x: [0, 5, 10, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 35, 40],
                y: [3.0, 4.0, 4.5, 4.9, 5.3, 5.5, 5.8, 6.2, 6.8, 7.0, 8.2, 9.5, 10.2, 10.8, 11.5, 11.9],
                type: 'scatter',
                mode: 'lines+markers',
                name: 'pH-Wert',
                line: {
                    color: '#0073aa',
                    width: 3
                },
                marker: {
                    size: 8,
                    color: '#0073aa'
                }
            }],
            layout: {
                title: 'Säure-Base-Titration',
                xaxis: {
                    title: 'Volumen Base (mL)',
                    showgrid: true,
                    zeroline: false
                },
                yaxis: {
                    title: 'pH-Wert',
                    showgrid: true,
                    range: [0, 14]
                },
                hovermode: 'closest'
            },
            config: {
                responsive: true,
                displayModeBar: true
            }
        },

        kinetics: {
            name: 'Reaktionskinetik (1. Ordnung)',
            data: [{
                x: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                y: [1.0, 0.82, 0.67, 0.55, 0.45, 0.37, 0.30, 0.25, 0.20, 0.17, 0.14],
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Konzentration',
                line: {
                    color: '#d32f2f',
                    width: 3
                },
                marker: {
                    size: 8,
                    color: '#d32f2f'
                }
            }],
            layout: {
                title: 'Reaktionskinetik 1. Ordnung',
                xaxis: {
                    title: 'Zeit (min)',
                    showgrid: true
                },
                yaxis: {
                    title: 'Konzentration (mol/L)',
                    showgrid: true
                }
            },
            config: {
                responsive: true,
                displayModeBar: true
            }
        },

        phase: {
            name: 'Phasendiagramm',
            data: [
                {
                    x: [273, 300, 350, 373],
                    y: [611, 3500, 41600, 101325],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Fest-Flüssig',
                    line: { color: '#1976d2', width: 3 }
                },
                {
                    x: [273, 300, 350, 373, 400, 450],
                    y: [611, 3500, 41600, 101325, 245750, 932000],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Flüssig-Gas',
                    line: { color: '#388e3c', width: 3 }
                },
                {
                    x: [200, 250, 273],
                    y: [1, 50, 611],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Fest-Gas',
                    line: { color: '#7b1fa2', width: 3 }
                }
            ],
            layout: {
                title: 'Phasendiagramm Wasser',
                xaxis: {
                    title: 'Temperatur (K)',
                    showgrid: true
                },
                yaxis: {
                    title: 'Druck (Pa)',
                    type: 'log',
                    showgrid: true
                }
            },
            config: {
                responsive: true,
                displayModeBar: true
            }
        },

        lineweaver: {
            name: 'Lineweaver-Burk-Diagramm',
            data: [{
                x: [-0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5],
                y: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Ohne Inhibitor',
                line: {
                    color: '#0073aa',
                    width: 3
                },
                marker: {
                    size: 8
                }
            }],
            layout: {
                title: 'Lineweaver-Burk-Diagramm',
                xaxis: {
                    title: '1/[S] (L/mol)',
                    showgrid: true,
                    zeroline: true
                },
                yaxis: {
                    title: '1/v (min/µmol)',
                    showgrid: true,
                    zeroline: true
                }
            },
            config: {
                responsive: true,
                displayModeBar: true
            }
        },

        ir: {
            name: 'IR-Spektrum',
            data: [{
                x: [4000, 3500, 3000, 2500, 2000, 1700, 1500, 1000, 500],
                y: [95, 30, 85, 90, 88, 20, 75, 60, 92],
                type: 'scatter',
                mode: 'lines',
                name: 'Transmission',
                fill: 'tozeroy',
                line: {
                    color: '#f57c00',
                    width: 2
                }
            }],
            layout: {
                title: 'IR-Spektrum',
                xaxis: {
                    title: 'Wellenzahl (cm⁻¹)',
                    showgrid: true,
                    autorange: 'reversed'
                },
                yaxis: {
                    title: 'Transmission (%)',
                    showgrid: true,
                    range: [0, 100]
                }
            },
            config: {
                responsive: true,
                displayModeBar: true
            }
        }
    };

    // Export for global access
    window.ChemVizChartTemplates = ChartTemplates;

})(window);
