import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, TextareaControl, RangeControl, ToggleControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.css';

registerBlockType('modular-blocks/chart-block', {
    edit: ({ attributes, setAttributes }) => {
        const {
            chartType,
            chartData,
            chartTemplate,
            chartTitle,
            xAxisLabel,
            yAxisLabel,
            showLegend,
            width,
            height
        } = attributes;

        const blockProps = useBlockProps({
            className: 'chart-block-editor'
        });

        const loadTemplate = () => {
            // This will be handled by the frontend script
            // For now, just set the template attribute
            if (chartTemplate) {
                setAttributes({
                    chartTitle: getTemplateName(chartTemplate),
                    xAxisLabel: getTemplateXLabel(chartTemplate),
                    yAxisLabel: getTemplateYLabel(chartTemplate)
                });
            }
        };

        const getTemplateName = (template) => {
            const names = {
                'titration': 'Säure-Base-Titration',
                'kinetics': 'Reaktionskinetik (1. Ordnung)',
                'phase': 'Phasendiagramm',
                'lineweaver': 'Lineweaver-Burk-Diagramm',
                'ir': 'IR-Spektrum'
            };
            return names[template] || chartTitle;
        };

        const getTemplateXLabel = (template) => {
            const labels = {
                'titration': 'Volumen Base (mL)',
                'kinetics': 'Zeit (min)',
                'phase': 'Temperatur (K)',
                'lineweaver': '1/[S]',
                'ir': 'Wellenzahl (cm⁻¹)'
            };
            return labels[template] || xAxisLabel;
        };

        const getTemplateYLabel = (template) => {
            const labels = {
                'titration': 'pH-Wert',
                'kinetics': 'Konzentration (mol/L)',
                'phase': 'Druck (Pa)',
                'lineweaver': '1/v',
                'ir': 'Transmission (%)'
            };
            return labels[template] || yAxisLabel;
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Diagramm-Typ', 'modular-blocks-plugin')} initialOpen={true}>
                        <SelectControl
                            label={__('Typ', 'modular-blocks-plugin')}
                            value={chartType}
                            options={[
                                { label: 'Scatter', value: 'scatter' },
                                { label: 'Bar', value: 'bar' },
                                { label: 'Line', value: 'line' },
                                { label: 'Heatmap', value: 'heatmap' },
                                { label: '3D', value: '3d' }
                            ]}
                            onChange={(value) => setAttributes({ chartType: value })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Chemie-Vorlagen', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Vorlage', 'modular-blocks-plugin')}
                            value={chartTemplate}
                            options={[
                                { label: 'Keine Vorlage', value: '' },
                                { label: 'Titrationskurve', value: 'titration' },
                                { label: 'Reaktionskinetik', value: 'kinetics' },
                                { label: 'Phasendiagramm', value: 'phase' },
                                { label: 'Lineweaver-Burk', value: 'lineweaver' },
                                { label: 'IR-Spektrum', value: 'ir' }
                            ]}
                            onChange={(value) => setAttributes({ chartTemplate: value })}
                            help={__('Vordefinierte Diagramme für häufige Chemie-Anwendungen', 'modular-blocks-plugin')}
                        />

                        {chartTemplate && (
                            <Button
                                variant="secondary"
                                onClick={loadTemplate}
                                style={{ marginTop: '12px' }}
                            >
                                {__('Vorlage laden', 'modular-blocks-plugin')}
                            </Button>
                        )}
                    </PanelBody>

                    <PanelBody title={__('Daten', 'modular-blocks-plugin')}>
                        <TextareaControl
                            label={__('Chart-Daten (JSON)', 'modular-blocks-plugin')}
                            value={chartData}
                            onChange={(value) => setAttributes({ chartData: value })}
                            help={__('Plotly.js Datenformat', 'modular-blocks-plugin')}
                            rows={8}
                        />
                    </PanelBody>

                    <PanelBody title={__('Beschriftung', 'modular-blocks-plugin')}>
                        <TextControl
                            label={__('Titel', 'modular-blocks-plugin')}
                            value={chartTitle}
                            onChange={(value) => setAttributes({ chartTitle: value })}
                        />

                        <TextControl
                            label={__('X-Achse', 'modular-blocks-plugin')}
                            value={xAxisLabel}
                            onChange={(value) => setAttributes({ xAxisLabel: value })}
                        />

                        <TextControl
                            label={__('Y-Achse', 'modular-blocks-plugin')}
                            value={yAxisLabel}
                            onChange={(value) => setAttributes({ yAxisLabel: value })}
                        />

                        <ToggleControl
                            label={__('Legende anzeigen', 'modular-blocks-plugin')}
                            checked={showLegend}
                            onChange={(value) => setAttributes({ showLegend: value })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Größe', 'modular-blocks-plugin')}>
                        <RangeControl
                            label={__('Breite (px)', 'modular-blocks-plugin')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                            min={300}
                            max={1200}
                        />

                        <RangeControl
                            label={__('Höhe (px)', 'modular-blocks-plugin')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            min={300}
                            max={1200}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="chart-block-placeholder">
                        <span className="dashicons dashicons-chart-line" style={{ fontSize: '48px', marginBottom: '16px' }}></span>
                        <h3>{chartTitle || __('Chemie-Diagramm', 'modular-blocks-plugin')}</h3>
                        <p style={{ opacity: 0.8 }}>
                            {__('Typ:', 'modular-blocks-plugin')} {chartType}
                            {chartTemplate && ` | ${__('Vorlage:', 'modular-blocks-plugin')} ${chartTemplate}`}
                        </p>
                        <p style={{ opacity: 0.6, fontSize: '14px' }}>
                            {xAxisLabel} / {yAxisLabel}
                        </p>
                    </div>
                </div>
            </>
        );
    },

    save: ({ attributes }) => {
        const {
            chartType,
            chartData,
            chartTemplate,
            chartTitle,
            xAxisLabel,
            yAxisLabel,
            showLegend,
            width,
            height
        } = attributes;

        const blockProps = useBlockProps.save({
            className: 'chemviz-chart',
            'data-chemviz-chart': 'true',
            'data-chart-type': chartType,
            'data-chart-template': chartTemplate,
            'data-chart-data': chartData,
            'data-chart-title': chartTitle,
            'data-x-axis-label': xAxisLabel,
            'data-y-axis-label': yAxisLabel,
            'data-show-legend': showLegend,
            'data-width': width,
            'data-height': height
        });

        return (
            <div {...blockProps}>
                <div className="chemviz-chart__container" style={{ maxWidth: `${width}px` }}>
                    <div className="chemviz-chart__canvas" id={`chemviz-chart-${Math.random().toString(36).substr(2, 9)}`}></div>
                    <div className="chemviz-chart__loading">
                        {__('Diagramm wird geladen...', 'modular-blocks-plugin')}
                    </div>
                </div>
            </div>
        );
    }
});
