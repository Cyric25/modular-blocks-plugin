import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, RangeControl, Button, Card, CardHeader, CardBody, ColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

registerBlockType('modular-blocks/statement-connector', {
	edit: ({ attributes, setAttributes }) => {
		const {
			title,
			description,
			leftColumn,
			rightColumn,
			connections,
			showFeedback,
			showRetry,
			showSolution,
			allowMultipleConnections,
			connectionStyle,
			lineWidth,
			animateConnections,
			instantFeedback,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps();

		const updateLeftItem = (index, field, value) => {
			const newItems = [...leftColumn.items];
			newItems[index] = { ...newItems[index], [field]: value };
			setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
		};

		const updateRightItem = (index, field, value) => {
			const newItems = [...rightColumn.items];
			newItems[index] = { ...newItems[index], [field]: value };
			setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
		};

		const addLeftItem = () => {
			const newItems = [
				...leftColumn.items,
				{
					id: `item${Date.now()}`,
					text: `Begriff ${leftColumn.items.length + 1}`,
					color: '#0073aa',
				},
			];
			setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
		};

		const addRightItem = () => {
			const newItems = [
				...rightColumn.items,
				{
					id: `def${Date.now()}`,
					text: `Definition ${rightColumn.items.length + 1}`,
					color: '#0073aa',
					correctConnection: '',
				},
			];
			setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
		};

		const removeLeftItem = (index) => {
			if (leftColumn.items.length <= 1) return;
			const newItems = leftColumn.items.filter((_, i) => i !== index);
			setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
		};

		const removeRightItem = (index) => {
			if (rightColumn.items.length <= 1) return;
			const newItems = rightColumn.items.filter((_, i) => i !== index);
			setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
						<ToggleControl
							label={__('Feedback anzeigen', 'modular-blocks-plugin')}
							checked={showFeedback}
							onChange={(value) => setAttributes({ showFeedback: value })}
						/>
						<ToggleControl
							label={__('Wiederholen erlauben', 'modular-blocks-plugin')}
							checked={showRetry}
							onChange={(value) => setAttributes({ showRetry: value })}
						/>
						<ToggleControl
							label={__('Lösung anzeigen', 'modular-blocks-plugin')}
							checked={showSolution}
							onChange={(value) => setAttributes({ showSolution: value })}
						/>
						<ToggleControl
							label={__('Mehrfachverbindungen erlauben', 'modular-blocks-plugin')}
							checked={allowMultipleConnections}
							onChange={(value) => setAttributes({ allowMultipleConnections: value })}
						/>
						<ToggleControl
							label={__('Sofortiges Feedback', 'modular-blocks-plugin')}
							checked={instantFeedback}
							onChange={(value) => setAttributes({ instantFeedback: value })}
						/>
						<ToggleControl
							label={__('Verbindungen animieren', 'modular-blocks-plugin')}
							checked={animateConnections}
							onChange={(value) => setAttributes({ animateConnections: value })}
						/>
						<SelectControl
							label={__('Verbindungs-Stil', 'modular-blocks-plugin')}
							value={connectionStyle}
							options={[
								{ label: __('Linie', 'modular-blocks-plugin'), value: 'line' },
								{ label: __('Pfeil', 'modular-blocks-plugin'), value: 'arrow' },
								{ label: __('Kurve', 'modular-blocks-plugin'), value: 'curve' },
							]}
							onChange={(value) => setAttributes({ connectionStyle: value })}
						/>
						<RangeControl
							label={__('Linienbreite', 'modular-blocks-plugin')}
							value={lineWidth}
							onChange={(value) => setAttributes({ lineWidth: value })}
							min={1}
							max={10}
						/>
					</PanelBody>

					<PanelBody title={__('Texte', 'modular-blocks-plugin')} initialOpen={false}>
						<TextControl
							label={__('Erfolgs-Text', 'modular-blocks-plugin')}
							value={successText}
							onChange={(value) => setAttributes({ successText: value })}
						/>
						<TextControl
							label={__('Teil-Erfolg Text', 'modular-blocks-plugin')}
							value={partialSuccessText}
							onChange={(value) => setAttributes({ partialSuccessText: value })}
						/>
						<TextControl
							label={__('Fehlschlag-Text', 'modular-blocks-plugin')}
							value={failText}
							onChange={(value) => setAttributes({ failText: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="statement-connector-container">
						<div className="connector-header">
							<TextControl
								label={__('Titel', 'modular-blocks-plugin')}
								value={title}
								onChange={(value) => setAttributes({ title: value })}
							/>
							<TextControl
								label={__('Beschreibung', 'modular-blocks-plugin')}
								value={description}
								onChange={(value) => setAttributes({ description: value })}
							/>
						</div>

						<div className="columns-editor" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
							{/* Left Column */}
							<div>
								<TextControl
									label={__('Titel linke Spalte', 'modular-blocks-plugin')}
									value={leftColumn.title}
									onChange={(value) => setAttributes({ leftColumn: { ...leftColumn, title: value } })}
								/>
								{leftColumn.items.map((item, index) => (
									<Card key={index} style={{ marginBottom: '10px' }}>
										<CardHeader>
											<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
												<strong>{item.text || `Item ${index + 1}`}</strong>
												<Button
													onClick={() => removeLeftItem(index)}
													icon={trash}
													variant="tertiary"
													size="small"
													isDestructive
												/>
											</div>
										</CardHeader>
										<CardBody>
											<TextControl
												label={__('Text', 'modular-blocks-plugin')}
												value={item.text}
												onChange={(value) => updateLeftItem(index, 'text', value)}
											/>
											<div>
												<label>{__('Farbe', 'modular-blocks-plugin')}</label>
												<ColorPicker
													color={item.color}
													onChangeComplete={(color) => updateLeftItem(index, 'color', color.hex)}
												/>
											</div>
										</CardBody>
									</Card>
								))}
								<Button onClick={addLeftItem} icon={plus} variant="secondary" size="small">
									{__('Item hinzufügen', 'modular-blocks-plugin')}
								</Button>
							</div>

							{/* Right Column */}
							<div>
								<TextControl
									label={__('Titel rechte Spalte', 'modular-blocks-plugin')}
									value={rightColumn.title}
									onChange={(value) => setAttributes({ rightColumn: { ...rightColumn, title: value } })}
								/>
								{rightColumn.items.map((item, index) => (
									<Card key={index} style={{ marginBottom: '10px' }}>
										<CardHeader>
											<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
												<strong>{item.text || `Item ${index + 1}`}</strong>
												<Button
													onClick={() => removeRightItem(index)}
													icon={trash}
													variant="tertiary"
													size="small"
													isDestructive
												/>
											</div>
										</CardHeader>
										<CardBody>
											<TextControl
												label={__('Text', 'modular-blocks-plugin')}
												value={item.text}
												onChange={(value) => updateRightItem(index, 'text', value)}
											/>
											<SelectControl
												label={__('Korrekte Verbindung', 'modular-blocks-plugin')}
												value={item.correctConnection}
												options={[
													{ label: __('-- Auswählen --', 'modular-blocks-plugin'), value: '' },
													...leftColumn.items.map((leftItem) => ({
														label: leftItem.text,
														value: leftItem.id,
													})),
												]}
												onChange={(value) => updateRightItem(index, 'correctConnection', value)}
											/>
											<div>
												<label>{__('Farbe', 'modular-blocks-plugin')}</label>
												<ColorPicker
													color={item.color}
													onChangeComplete={(color) => updateRightItem(index, 'color', color.hex)}
												/>
											</div>
										</CardBody>
									</Card>
								))}
								<Button onClick={addRightItem} icon={plus} variant="secondary" size="small">
									{__('Item hinzufügen', 'modular-blocks-plugin')}
								</Button>
							</div>
						</div>

						<div
							style={{
								marginTop: '15px',
								padding: '10px',
								backgroundColor: '#f0f6fc',
								borderLeft: '4px solid #0073aa',
								fontSize: '12px',
							}}
						>
							{__('Vorschau: Verbindungen funktionieren im Frontend. Konfigurieren Sie die korrekten Zuordnungen oben.', 'modular-blocks-plugin')}
						</div>
					</div>
				</div>
			</>
		);
	},

	save: ({ attributes }) => {
		const {
			title,
			description,
			leftColumn,
			rightColumn,
			connections,
			showFeedback,
			showRetry,
			showSolution,
			allowMultipleConnections,
			connectionStyle,
			lineWidth,
			animateConnections,
			instantFeedback,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps.save();

		const connectorData = {
			leftColumn,
			rightColumn,
			connections,
			showFeedback,
			showRetry,
			showSolution,
			allowMultipleConnections,
			connectionStyle,
			lineWidth,
			animateConnections,
			instantFeedback,
			successText,
			partialSuccessText,
			failText,
		};

		return (
			<div {...blockProps} data-connector-config={JSON.stringify(connectorData)}>
				<div className="statement-connector-container">
					{title && <h3 className="connector-title">{title}</h3>}
					{description && <p className="connector-description">{description}</p>}

					<div className="connector-area">
						<div className="left-column">
							<h4>{leftColumn.title}</h4>
							<div className="items-list">
								{leftColumn.items.map((item, index) => (
									<div key={item.id} className="connector-item left-item" data-item-id={item.id} style={{ borderColor: item.color }}>
										<span className="item-text">{item.text}</span>
										<div className="connector-point" style={{ backgroundColor: item.color }}></div>
									</div>
								))}
							</div>
						</div>

						<svg className="connections-canvas" style={{ width: '100%', height: '100%', position: 'absolute', pointerEvents: 'none' }}></svg>

						<div className="right-column">
							<h4>{rightColumn.title}</h4>
							<div className="items-list">
								{rightColumn.items.map((item, index) => (
									<div key={item.id} className="connector-item right-item" data-item-id={item.id} style={{ borderColor: item.color }}>
										<div className="connector-point" style={{ backgroundColor: item.color }}></div>
										<span className="item-text">{item.text}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="connector-controls">
						<button type="button" className="connector-button connector-check">
							{__('Prüfen', 'modular-blocks-plugin')}
						</button>
						{showRetry && (
							<button type="button" className="connector-button connector-retry" style={{ display: 'none' }}>
								{__('Wiederholen', 'modular-blocks-plugin')}
							</button>
						)}
						{showSolution && (
							<button type="button" className="connector-button connector-solution" style={{ display: 'none' }}>
								{__('Lösung anzeigen', 'modular-blocks-plugin')}
							</button>
						)}
					</div>

					<div className="connector-results" style={{ display: 'none' }}>
						<div className="result-message"></div>
					</div>
				</div>
			</div>
		);
	},
});
