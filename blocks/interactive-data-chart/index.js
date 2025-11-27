/**
 * Interactive Data Chart Block - Editor
 */

import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    TextControl,
    RangeControl,
    ToggleControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.css';

registerBlockType('modular-blocks/interactive-data-chart', {
    edit: ({ attributes, setAttributes }) => {
        const {
            chartType,
            chartTitle,
            xAxisLabel,
            yAxisLabel,
            tableRows,
            tableColumns,
            showTable,
            columnHeaders
        } = attributes;

        const blockProps = useBlockProps({
            className: 'wp-block-modular-blocks-interactive-data-chart-editor'
        });

        // Update column headers when columns change
        const updateColumnHeaders = (newColumns) => {
            const newHeaders = [...(columnHeaders || ['Kategorie', 'Wert'])];
            while (newHeaders.length < newColumns) {
                newHeaders.push(`Spalte ${newHeaders.length + 1}`);
            }
            setAttributes({
                tableColumns: newColumns,
                columnHeaders: newHeaders.slice(0, newColumns)
            });
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody
                        title={__('Diagramm-Einstellungen', 'modular-blocks-plugin')}
                        initialOpen={true}
                    >
                        <SelectControl
                            label={__('Diagramm-Typ', 'modular-blocks-plugin')}
                            value={chartType}
                            options={[
                                { label: __('Balkendiagramm', 'modular-blocks-plugin'), value: 'bar' },
                                { label: __('Liniendiagramm', 'modular-blocks-plugin'), value: 'line' },
                                { label: __('Streudiagramm', 'modular-blocks-plugin'), value: 'scatter' },
                                { label: __('Kreisdiagramm', 'modular-blocks-plugin'), value: 'pie' }
                            ]}
                            onChange={(value) => setAttributes({ chartType: value })}
                            help={__('Wählen Sie den Typ des Diagramms', 'modular-blocks-plugin')}
                        />

                        <TextControl
                            label={__('Diagramm-Titel', 'modular-blocks-plugin')}
                            value={chartTitle}
                            onChange={(value) => setAttributes({ chartTitle: value })}
                            placeholder={__('Mein Diagramm', 'modular-blocks-plugin')}
                        />

                        {chartType !== 'pie' && (
                            <>
                                <TextControl
                                    label={__('X-Achsen-Beschriftung', 'modular-blocks-plugin')}
                                    value={xAxisLabel}
                                    onChange={(value) => setAttributes({ xAxisLabel: value })}
                                    placeholder={__('X-Achse', 'modular-blocks-plugin')}
                                />

                                <TextControl
                                    label={__('Y-Achsen-Beschriftung', 'modular-blocks-plugin')}
                                    value={yAxisLabel}
                                    onChange={(value) => setAttributes({ yAxisLabel: value })}
                                    placeholder={__('Y-Achse', 'modular-blocks-plugin')}
                                />
                            </>
                        )}
                    </PanelBody>

                    <PanelBody
                        title={__('Tabellen-Einstellungen', 'modular-blocks-plugin')}
                        initialOpen={true}
                    >
                        <ToggleControl
                            label={__('Tabelle anzeigen', 'modular-blocks-plugin')}
                            checked={showTable}
                            onChange={(value) => setAttributes({ showTable: value })}
                            help={__('Tabelle für Dateneingabe im Frontend anzeigen', 'modular-blocks-plugin')}
                        />

                        <RangeControl
                            label={__('Anzahl Zeilen', 'modular-blocks-plugin')}
                            value={tableRows}
                            onChange={(value) => setAttributes({ tableRows: value })}
                            min={2}
                            max={20}
                            help={__('Wie viele Datenzeilen sollen eingegeben werden können?', 'modular-blocks-plugin')}
                        />

                        <RangeControl
                            label={__('Anzahl Spalten', 'modular-blocks-plugin')}
                            value={tableColumns}
                            onChange={updateColumnHeaders}
                            min={2}
                            max={10}
                            help={__('Wie viele Spalten soll die Tabelle haben?', 'modular-blocks-plugin')}
                        />

                        {columnHeaders && columnHeaders.map((header, index) => (
                            <TextControl
                                key={index}
                                label={__(`Spalten-Überschrift ${index + 1}`, 'modular-blocks-plugin')}
                                value={header}
                                onChange={(value) => {
                                    const newHeaders = [...columnHeaders];
                                    newHeaders[index] = value;
                                    setAttributes({ columnHeaders: newHeaders });
                                }}
                                placeholder={__(`Spalte ${index + 1}`, 'modular-blocks-plugin')}
                            />
                        ))}
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="chart-editor-preview">
                        <div className="preview-header">
                            <span className="dashicons dashicons-chart-bar"></span>
                            <h3>{chartTitle || __('Interaktive Datentabelle & Diagramm', 'modular-blocks-plugin')}</h3>
                        </div>

                        <div className="preview-info">
                            <div className="info-item">
                                <strong>{__('Diagramm-Typ:', 'modular-blocks-plugin')}</strong>
                                <span>
                                    {chartType === 'bar' && __('Balkendiagramm', 'modular-blocks-plugin')}
                                    {chartType === 'line' && __('Liniendiagramm', 'modular-blocks-plugin')}
                                    {chartType === 'scatter' && __('Streudiagramm', 'modular-blocks-plugin')}
                                    {chartType === 'pie' && __('Kreisdiagramm', 'modular-blocks-plugin')}
                                </span>
                            </div>

                            <div className="info-item">
                                <strong>{__('Tabelle:', 'modular-blocks-plugin')}</strong>
                                <span>{tableRows} {__('Zeilen', 'modular-blocks-plugin')} × {tableColumns} {__('Spalten', 'modular-blocks-plugin')}</span>
                            </div>

                            {chartType !== 'pie' && (
                                <>
                                    <div className="info-item">
                                        <strong>{__('X-Achse:', 'modular-blocks-plugin')}</strong>
                                        <span>{xAxisLabel}</span>
                                    </div>

                                    <div className="info-item">
                                        <strong>{__('Y-Achse:', 'modular-blocks-plugin')}</strong>
                                        <span>{yAxisLabel}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="preview-notice">
                            <span className="dashicons dashicons-info"></span>
                            <p>
                                {__('Im Frontend können Benutzer Daten in die Tabelle eingeben und ein interaktives Diagramm generieren.', 'modular-blocks-plugin')}
                            </p>
                        </div>

                        {showTable && (
                            <div className="preview-table">
                                <table>
                                    <thead>
                                        <tr>
                                            {columnHeaders && columnHeaders.map((header, index) => (
                                                <th key={index}>{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(Math.min(3, tableRows))].map((_, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {[...Array(tableColumns)].map((_, colIndex) => (
                                                    <td key={colIndex}>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            placeholder={colIndex === 0 ? __('Beschriftung', 'modular-blocks-plugin') : __('Wert', 'modular-blocks-plugin')}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {tableRows > 3 && (
                                    <p className="preview-more">
                                        {__('... und', 'modular-blocks-plugin')} {tableRows - 3} {__('weitere Zeilen', 'modular-blocks-plugin')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    },

    save: () => {
        // Server-side rendering via render.php
        return null;
    }
});
