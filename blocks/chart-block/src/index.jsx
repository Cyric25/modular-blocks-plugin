import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, TextareaControl, SelectControl, ToggleControl, RangeControl, Button, TabPanel, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { upload } from '@wordpress/icons';

// Helper function to parse CSV
function parseCSV(csv) {
	const lines = csv.trim().split('\n');
	if (lines.length < 2) return [];

	const headers = lines[0].split(',').map(h => h.trim());
	const xValues = [];
	const datasets = [];

	// Initialize datasets for each column except the first (X values)
	for (let i = 1; i < headers.length; i++) {
		datasets.push({
			x: [],
			y: [],
			name: headers[i],
			type: 'scatter'
		});
	}

	// Parse data rows
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map(v => v.trim());
		const x = parseFloat(values[0]);

		if (!isNaN(x)) {
			for (let j = 1; j < values.length && j - 1 < datasets.length; j++) {
				const y = parseFloat(values[j]);
				if (!isNaN(y)) {
					datasets[j - 1].x.push(x);
					datasets[j - 1].y.push(y);
				}
			}
		}
	}

	return datasets;
}

// Data Input Tabs Component
function DataInputTabs({ chartType, chartData, setAttributes }) {
	const [manualX, setManualX] = useState('1, 2, 3, 4, 5');
	const [manualY, setManualY] = useState('10, 15, 13, 17, 20');
	const [datasetName, setDatasetName] = useState('Datensatz 1');

	return (
		<TabPanel
			className="chart-data-tabs"
			tabs={[
				{
					name: 'json',
					title: __('JSON', 'modular-blocks-plugin'),
				},
				{
					name: 'csv',
					title: __('CSV Import', 'modular-blocks-plugin'),
				},
				{
					name: 'manual',
					title: __('Manuelle Eingabe', 'modular-blocks-plugin'),
				},
			]}
		>
			{(tab) => {
				if (tab.name === 'json') {
					return (
						<div>
							<Notice status="info" isDismissible={false}>
								<p><strong>{__('JSON Format-Beispiel:', 'modular-blocks-plugin')}</strong></p>
								<pre style={{ fontSize: '11px', background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`[{
  "x": [1, 2, 3, 4, 5],
  "y": [10, 15, 13, 17, 20],
  "type": "scatter",
  "name": "Datensatz 1"
}]`}
								</pre>
							</Notice>
							<TextareaControl
								label={__('Chart-Daten (JSON)', 'modular-blocks-plugin')}
								value={chartData}
								onChange={(value) => setAttributes({ chartData: value })}
								help={__('Geben Sie Plotly.js-kompatible Daten als JSON ein', 'modular-blocks-plugin')}
								rows={12}
							/>
						</div>
					);
				} else if (tab.name === 'csv') {
					return (
						<div>
							<p>{__('CSV-Datei importieren:', 'modular-blocks-plugin')}</p>
							<input
								type="file"
								accept=".csv"
								onChange={(e) => {
									const file = e.target.files[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = (event) => {
											const csv = event.target.result;
											const parsedData = parseCSV(csv);
											setAttributes({ chartData: JSON.stringify(parsedData, null, 2) });
										};
										reader.readAsText(file);
									}
								}}
								style={{ width: '100%', padding: '8px', marginTop: '8px' }}
							/>
							<Notice status="info" isDismissible={false} style={{ marginTop: '12px' }}>
								<p><strong>{__('CSV Format:', 'modular-blocks-plugin')}</strong></p>
								<p style={{ fontSize: '11px', marginTop: '6px' }}>
									{__('Erste Zeile = Spaltennamen', 'modular-blocks-plugin')}<br/>
									{__('Erste Spalte = X-Werte', 'modular-blocks-plugin')}<br/>
									{__('Weitere Spalten = Y-Werte (eine Spalte pro Datensatz)', 'modular-blocks-plugin')}
								</p>
								<pre style={{ fontSize: '11px', background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
{`X,Datensatz 1,Datensatz 2
1,10,8
2,15,12
3,13,14
4,17,16
5,20,18`}
								</pre>
							</Notice>
						</div>
					);
				} else if (tab.name === 'manual') {
					return (
						<div>
							<TextControl
								label={__('Name des Datensatzes', 'modular-blocks-plugin')}
								value={datasetName}
								onChange={(value) => setDatasetName(value)}
							/>
							<TextareaControl
								label={__('X-Werte (kommagetrennt)', 'modular-blocks-plugin')}
								value={manualX}
								onChange={(value) => setManualX(value)}
								help={__('Beispiel: 1, 2, 3, 4, 5', 'modular-blocks-plugin')}
								rows={2}
							/>
							<TextareaControl
								label={__('Y-Werte (kommagetrennt)', 'modular-blocks-plugin')}
								value={manualY}
								onChange={(value) => setManualY(value)}
								help={__('Beispiel: 10, 15, 13, 17, 20', 'modular-blocks-plugin')}
								rows={2}
							/>
							<Button
								variant="primary"
								onClick={() => {
									const xValues = manualX.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
									const yValues = manualY.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
									const data = [{
										x: xValues,
										y: yValues,
										type: chartType === '3d' ? 'scatter3d' : chartType,
										name: datasetName
									}];
									setAttributes({ chartData: JSON.stringify(data, null, 2) });
								}}
							>
								{__('Daten übernehmen', 'modular-blocks-plugin')}
							</Button>
						</div>
					);
				}
			}}
		</TabPanel>
	);
}

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
			height,
		} = attributes;

		const blockProps = useBlockProps();

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Diagramm-Typ', 'modular-blocks-plugin')}>
						<SelectControl
							label={__('Diagramm-Typ', 'modular-blocks-plugin')}
							value={chartType}
							options={[
								{ label: __('Streudiagramm', 'modular-blocks-plugin'), value: 'scatter' },
								{ label: __('Balkendiagramm', 'modular-blocks-plugin'), value: 'bar' },
								{ label: __('Liniendiagramm', 'modular-blocks-plugin'), value: 'line' },
								{ label: __('Heatmap', 'modular-blocks-plugin'), value: 'heatmap' },
								{ label: __('3D', 'modular-blocks-plugin'), value: '3d' },
							]}
							onChange={(value) => setAttributes({ chartType: value })}
						/>
						<SelectControl
							label={__('Chemie-Vorlage', 'modular-blocks-plugin')}
							value={chartTemplate}
							options={[
								{ label: __('Keine Vorlage', 'modular-blocks-plugin'), value: '' },
								{ label: __('Titration', 'modular-blocks-plugin'), value: 'titration' },
								{ label: __('Kinetik', 'modular-blocks-plugin'), value: 'kinetics' },
								{ label: __('Phasendiagramm', 'modular-blocks-plugin'), value: 'phase' },
								{ label: __('Lineweaver-Burk', 'modular-blocks-plugin'), value: 'lineweaver' },
								{ label: __('IR-Spektroskopie', 'modular-blocks-plugin'), value: 'ir' },
							]}
							onChange={(value) => setAttributes({ chartTemplate: value })}
							help={__('Wählen Sie eine Vorlage für häufige Chemie-Diagramme', 'modular-blocks-plugin')}
						/>
					</PanelBody>

					<PanelBody title={__('Beschriftungen', 'modular-blocks-plugin')}>
						<TextControl
							label={__('Diagramm-Titel', 'modular-blocks-plugin')}
							value={chartTitle}
							onChange={(value) => setAttributes({ chartTitle: value })}
						/>
						<TextControl
							label={__('X-Achsen-Beschriftung', 'modular-blocks-plugin')}
							value={xAxisLabel}
							onChange={(value) => setAttributes({ xAxisLabel: value })}
						/>
						<TextControl
							label={__('Y-Achsen-Beschriftung', 'modular-blocks-plugin')}
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
							min={400}
							max={1200}
						/>
						<RangeControl
							label={__('Höhe (px)', 'modular-blocks-plugin')}
							value={height}
							onChange={(value) => setAttributes({ height: value })}
							min={300}
							max={800}
						/>
					</PanelBody>

					<PanelBody title={__('Daten', 'modular-blocks-plugin')} initialOpen={false}>
						<DataInputTabs chartType={chartType} chartData={chartData} setAttributes={setAttributes} />
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="chart-block-container">
						<div className="chart-preview" style={{ width: `${width}px`, height: `${height}px`, border: '1px solid #ddd', padding: '20px' }}>
							<h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{chartTitle}</h3>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 40px)', background: '#f5f5f5' }}>
								<div style={{ textAlign: 'center' }}>
									<p><strong>{__('Diagramm-Vorschau', 'modular-blocks-plugin')}</strong></p>
									<p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
										{chartTemplate
											? __('Vorlage: ' + chartTemplate, 'modular-blocks-plugin')
											: __('Typ: ' + chartType, 'modular-blocks-plugin')}
									</p>
									<p style={{ fontSize: '12px', color: '#666' }}>
										{__('Das interaktive Diagramm wird im Frontend mit Plotly.js gerendert', 'modular-blocks-plugin')}
									</p>
								</div>
							</div>
						</div>
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
			height,
		} = attributes;

		const blockProps = useBlockProps.save();

		const chartConfig = {
			chartType,
			chartData,
			chartTemplate,
			chartTitle,
			xAxisLabel,
			yAxisLabel,
			showLegend,
			width,
			height,
		};

		return (
			<div {...blockProps} data-chart-config={JSON.stringify(chartConfig)}>
				<div className="chart-block-container">
					<div
						className="chart-viewer"
						style={{ width: `${width}px`, height: `${height}px` }}
						aria-label={chartTitle}
					>
						{/* Plotly.js will render here via view.js */}
					</div>
				</div>
			</div>
		);
	},
});
