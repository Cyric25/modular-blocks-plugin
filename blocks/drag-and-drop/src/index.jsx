import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, Button, Card, CardHeader, CardBody, SelectControl, ColorPicker, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus, moveTo } from '@wordpress/icons';
import { useState, useRef } from '@wordpress/element';

registerBlockType('modular-blocks/drag-and-drop', {
	edit: ({ attributes, setAttributes }) => {
		const {
			title,
			description,
			backgroundImage,
			draggables,
			dropZones,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableSnap,
			showScore,
			randomizeDraggables,
			allowPartialScore,
			backgroundHeight,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps();
		const [activeZoneIndex, setActiveZoneIndex] = useState(null);
		const dropAreaRef = useRef(null);

		const updateDraggable = (index, field, value) => {
			const newDraggables = [...draggables];
			newDraggables[index] = { ...newDraggables[index], [field]: value };
			setAttributes({ draggables: newDraggables });
		};

		const updateDropZone = (index, field, value) => {
			const newZones = [...dropZones];
			newZones[index] = { ...newZones[index], [field]: value };
			setAttributes({ dropZones: newZones });
		};

		const addDraggable = () => {
			const newDraggables = [
				...draggables,
				{
					id: `drag${Date.now()}`,
					type: 'text',
					content: `Element ${draggables.length + 1}`,
					image: { url: '', alt: '', id: null },
					correctZones: [],
					color: '#0073aa',
					size: 'medium',
				},
			];
			setAttributes({ draggables: newDraggables });
		};

		const addDropZone = () => {
			const newZones = [
				...dropZones,
				{
					id: `zone${Date.now()}`,
					label: `Zone ${dropZones.length + 1}`,
					x: 20 + dropZones.length * 10,
					y: 20 + dropZones.length * 10,
					width: 150,
					height: 100,
					acceptMultiple: false,
					backgroundColor: 'rgba(0, 115, 170, 0.1)',
					borderColor: '#0073aa',
				},
			];
			setAttributes({ dropZones: newZones });
		};

		const removeDraggable = (index) => {
			if (draggables.length <= 1) return;
			const newDraggables = draggables.filter((_, i) => i !== index);
			setAttributes({ draggables: newDraggables });
		};

		const removeDropZone = (index) => {
			if (dropZones.length <= 1) return;
			const newZones = dropZones.filter((_, i) => i !== index);
			setAttributes({ dropZones: newZones });
		};

		const handleDropAreaClick = (e) => {
			if (activeZoneIndex === null || !dropAreaRef.current) return;

			const rect = dropAreaRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;

			updateDropZone(activeZoneIndex, 'x', Math.max(0, Math.min(100, x)));
			updateDropZone(activeZoneIndex, 'y', Math.max(0, Math.min(100, y)));

			setActiveZoneIndex(null);
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Hintergrundbild', 'modular-blocks-plugin')}>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={(media) => {
									setAttributes({
										backgroundImage: {
											url: media.url,
											alt: media.alt,
											id: media.id,
										},
									});
								}}
								allowedTypes={['image']}
								value={backgroundImage.id}
								render={({ open }) => (
									<Button onClick={open} variant="secondary">
										{backgroundImage.url
											? __('Bild ändern', 'modular-blocks-plugin')
											: __('Bild auswählen', 'modular-blocks-plugin')}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						{backgroundImage.url && (
							<Button
								onClick={() => {
									setAttributes({ backgroundImage: { url: '', alt: '', id: null } });
								}}
								variant="tertiary"
								isDestructive
								style={{ marginTop: '10px' }}
							>
								{__('Bild entfernen', 'modular-blocks-plugin')}
							</Button>
						)}
						<RangeControl
							label={__('Hintergrund-Höhe (px)', 'modular-blocks-plugin')}
							value={backgroundHeight}
							onChange={(value) => setAttributes({ backgroundHeight: value })}
							min={200}
							max={800}
						/>
					</PanelBody>

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
							label={__('Sofortiges Feedback', 'modular-blocks-plugin')}
							checked={instantFeedback}
							onChange={(value) => setAttributes({ instantFeedback: value })}
						/>
						<ToggleControl
							label={__('Snap aktivieren', 'modular-blocks-plugin')}
							checked={enableSnap}
							onChange={(value) => setAttributes({ enableSnap: value })}
						/>
						<ToggleControl
							label={__('Punktzahl anzeigen', 'modular-blocks-plugin')}
							checked={showScore}
							onChange={(value) => setAttributes({ showScore: value })}
						/>
						<ToggleControl
							label={__('Elemente zufällig anordnen', 'modular-blocks-plugin')}
							checked={randomizeDraggables}
							onChange={(value) => setAttributes({ randomizeDraggables: value })}
						/>
						<ToggleControl
							label={__('Teilpunkte erlauben', 'modular-blocks-plugin')}
							checked={allowPartialScore}
							onChange={(value) => setAttributes({ allowPartialScore: value })}
						/>
					</PanelBody>

					<PanelBody title={__('Ziehbare Elemente', 'modular-blocks-plugin')} initialOpen={false}>
						{draggables.map((draggable, index) => (
							<Card key={index} style={{ marginBottom: '10px' }}>
								<CardHeader>
									<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
										<strong>{draggable.content || `Element ${index + 1}`}</strong>
										<Button
											onClick={() => removeDraggable(index)}
											icon={trash}
											variant="tertiary"
											size="small"
											isDestructive
										/>
									</div>
								</CardHeader>
								<CardBody>
									<SelectControl
										label={__('Typ', 'modular-blocks-plugin')}
										value={draggable.type}
										options={[
											{ label: __('Text', 'modular-blocks-plugin'), value: 'text' },
											{ label: __('Bild', 'modular-blocks-plugin'), value: 'image' },
										]}
										onChange={(value) => updateDraggable(index, 'type', value)}
									/>
									<TextControl
										label={__('Inhalt', 'modular-blocks-plugin')}
										value={draggable.content}
										onChange={(value) => updateDraggable(index, 'content', value)}
									/>
									<TextControl
										label={__('Korrekte Zonen (Komma-getrennt)', 'modular-blocks-plugin')}
										value={draggable.correctZones.join(', ')}
										onChange={(value) => updateDraggable(index, 'correctZones', value.split(',').map(v => v.trim()))}
										help={__('IDs der Drop-Zonen', 'modular-blocks-plugin')}
									/>
									<div style={{ marginTop: '10px' }}>
										<label>{__('Farbe', 'modular-blocks-plugin')}</label>
										<ColorPicker
											color={draggable.color}
											onChangeComplete={(color) => updateDraggable(index, 'color', color.hex)}
										/>
									</div>
								</CardBody>
							</Card>
						))}
						<Button onClick={addDraggable} icon={plus} variant="secondary">
							{__('Element hinzufügen', 'modular-blocks-plugin')}
						</Button>
					</PanelBody>

					<PanelBody title={__('Drop-Zonen', 'modular-blocks-plugin')} initialOpen={false}>
						{activeZoneIndex !== null && (
							<Notice status="info" isDismissible={false}>
								{__('Klicken Sie auf das Bild unten, um die Position der Zone "' + dropZones[activeZoneIndex]?.label + '" zu setzen.', 'modular-blocks-plugin')}
							</Notice>
						)}
						{dropZones.map((zone, index) => (
							<Card key={index} style={{ marginBottom: '10px', backgroundColor: activeZoneIndex === index ? '#e7f5ff' : 'transparent' }}>
								<CardHeader>
									<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
										<strong>{zone.label}</strong>
										<div style={{ display: 'flex', gap: '5px' }}>
											<Button
												onClick={() => setActiveZoneIndex(activeZoneIndex === index ? null : index)}
												icon={moveTo}
												variant={activeZoneIndex === index ? 'primary' : 'secondary'}
												size="small"
												label={__('Position im Bild setzen', 'modular-blocks-plugin')}
											/>
											<Button
												onClick={() => removeDropZone(index)}
												icon={trash}
												variant="tertiary"
												size="small"
												isDestructive
											/>
										</div>
									</div>
								</CardHeader>
								<CardBody>
									<TextControl
										label={__('ID', 'modular-blocks-plugin')}
										value={zone.id}
										onChange={(value) => updateDropZone(index, 'id', value)}
									/>
									<TextControl
										label={__('Label', 'modular-blocks-plugin')}
										value={zone.label}
										onChange={(value) => updateDropZone(index, 'label', value)}
									/>
									<RangeControl
										label={__('X Position (%)', 'modular-blocks-plugin')}
										value={zone.x}
										onChange={(value) => updateDropZone(index, 'x', value)}
										min={0}
										max={100}
									/>
									<RangeControl
										label={__('Y Position (%)', 'modular-blocks-plugin')}
										value={zone.y}
										onChange={(value) => updateDropZone(index, 'y', value)}
										min={0}
										max={100}
									/>
									<RangeControl
										label={__('Breite (px)', 'modular-blocks-plugin')}
										value={zone.width}
										onChange={(value) => updateDropZone(index, 'width', value)}
										min={50}
										max={300}
									/>
									<RangeControl
										label={__('Höhe (px)', 'modular-blocks-plugin')}
										value={zone.height}
										onChange={(value) => updateDropZone(index, 'height', value)}
										min={50}
										max={300}
									/>
									<ToggleControl
										label={__('Mehrere Elemente erlauben', 'modular-blocks-plugin')}
										checked={zone.acceptMultiple}
										onChange={(value) => updateDropZone(index, 'acceptMultiple', value)}
									/>
								</CardBody>
							</Card>
						))}
						<Button onClick={addDropZone} icon={plus} variant="secondary">
							{__('Drop-Zone hinzufügen', 'modular-blocks-plugin')}
						</Button>
					</PanelBody>

					<PanelBody title={__('Feedback-Texte', 'modular-blocks-plugin')} initialOpen={false}>
						<TextControl
							label={__('Punktzahl-Text', 'modular-blocks-plugin')}
							value={scoreText}
							onChange={(value) => setAttributes({ scoreText: value })}
							help={__('@score und @total werden ersetzt', 'modular-blocks-plugin')}
						/>
						<TextControl
							label={__('Erfolg-Text', 'modular-blocks-plugin')}
							value={successText}
							onChange={(value) => setAttributes({ successText: value })}
						/>
						<TextControl
							label={__('Teil-Erfolg-Text', 'modular-blocks-plugin')}
							value={partialSuccessText}
							onChange={(value) => setAttributes({ partialSuccessText: value })}
						/>
						<TextControl
							label={__('Fehler-Text', 'modular-blocks-plugin')}
							value={failText}
							onChange={(value) => setAttributes({ failText: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="drag-and-drop-container">
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

						{backgroundImage.url && (
							<div
								ref={dropAreaRef}
								onClick={handleDropAreaClick}
								style={{
									position: 'relative',
									marginTop: '20px',
									height: `${backgroundHeight}px`,
									border: activeZoneIndex !== null ? '3px solid #0073aa' : '1px solid #ddd',
									cursor: activeZoneIndex !== null ? 'crosshair' : 'default',
									overflow: 'hidden'
								}}
							>
								<img
									src={backgroundImage.url}
									alt={backgroundImage.alt}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'contain',
										pointerEvents: 'none'
									}}
								/>
								{dropZones.map((zone, index) => (
									<div
										key={index}
										style={{
											position: 'absolute',
											left: `${zone.x}%`,
											top: `${zone.y}%`,
											width: `${zone.width}px`,
											height: `${zone.height}px`,
											backgroundColor: zone.backgroundColor,
											border: `2px solid ${zone.borderColor}`,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '12px',
											fontWeight: 'bold',
											color: zone.borderColor,
											pointerEvents: activeZoneIndex !== null ? 'none' : 'auto',
											opacity: activeZoneIndex === index ? 0.8 : 0.6,
											transform: 'translate(-50%, -50%)'
										}}
									>
										{zone.label}
									</div>
								))}
							</div>
						)}

						<div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f0f0f0' }}>
							<p><strong>{__('Vorschau:', 'modular-blocks-plugin')}</strong></p>
							<p>{__('Drag & Drop Aktivität mit ' + draggables.length + ' Elementen und ' + dropZones.length + ' Zonen', 'modular-blocks-plugin')}</p>
							<p style={{ fontSize: '12px', color: '#666' }}>
								{__('Die interaktive Funktionalität ist im Frontend verfügbar.', 'modular-blocks-plugin')}
							</p>
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
			backgroundImage,
			draggables,
			dropZones,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableSnap,
			showScore,
			randomizeDraggables,
			allowPartialScore,
			backgroundHeight,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps.save();

		const dragDropData = {
			draggables,
			dropZones,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableSnap,
			showScore,
			randomizeDraggables,
			allowPartialScore,
			backgroundHeight,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		};

		return (
			<div {...blockProps} data-drag-drop-config={JSON.stringify(dragDropData)}>
				<div className="drag-and-drop-container">
					{title && <h3 className="drag-drop-title">{title}</h3>}
					{description && <p className="drag-drop-description">{description}</p>}

					<div className="activity-area">
						<div className="draggables-area">
							<h4>{__('Elemente', 'modular-blocks-plugin')}</h4>
							<div className="draggables-container">
								{draggables.map((draggable, index) => (
									<div
										key={index}
										className={`draggable-element draggable-${draggable.type}`}
										data-draggable-id={draggable.id}
										draggable="true"
									>
										{draggable.type === 'text' && <span>{draggable.content}</span>}
										{draggable.type === 'image' && draggable.image.url && (
											<img src={draggable.image.url} alt={draggable.image.alt} />
										)}
									</div>
								))}
							</div>
						</div>

						<div className="drop-area" style={{ height: `${backgroundHeight}px` }}>
							<h4>{__('Drop-Bereich', 'modular-blocks-plugin')}</h4>
							<div className="drop-area-container">
								{backgroundImage.url && <img src={backgroundImage.url} alt={backgroundImage.alt} className="background-image" />}
								<div className="drop-zones">
									{dropZones.map((zone, index) => (
										<div
											key={index}
											className="drop-zone"
											data-zone-id={zone.id}
											style={{
												left: `${zone.x}%`,
												top: `${zone.y}%`,
												width: `${zone.width}px`,
												height: `${zone.height}px`,
											}}
										>
											<div className="zone-label">{zone.label}</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="drag-drop-controls">
						<button type="button" className="drag-drop-button drag-drop-check">
							{__('Prüfen', 'modular-blocks-plugin')}
						</button>
						{showRetry && (
							<button type="button" className="drag-drop-button drag-drop-retry" style={{ display: 'none' }}>
								{__('Wiederholen', 'modular-blocks-plugin')}
							</button>
						)}
						{showSolution && (
							<button type="button" className="drag-drop-button drag-drop-solution" style={{ display: 'none' }}>
								{__('Lösung anzeigen', 'modular-blocks-plugin')}
							</button>
						)}
					</div>

					{showScore && (
						<div className="drag-drop-results" style={{ display: 'none' }}>
							<div className="result-message"></div>
							<div className="score-display"></div>
						</div>
					)}
				</div>
			</div>
		);
	},
});
