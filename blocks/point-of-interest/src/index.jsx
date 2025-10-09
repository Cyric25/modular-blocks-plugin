import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, Button, SelectControl, Card, CardHeader, CardBody, ColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

registerBlockType('modular-blocks/point-of-interest', {
	edit: ({ attributes, setAttributes }) => {
		const {
			backgroundImage,
			title,
			description,
			hotspots,
			hotspotStyle,
			popupStyle,
			popupPosition,
			showNumbers,
			autoClose,
			closeOnOutsideClick,
			height,
			enableZoom,
			zoomLevel,
		} = attributes;

		const blockProps = useBlockProps();

		const updateHotspot = (index, field, value) => {
			const newHotspots = [...hotspots];
			newHotspots[index] = { ...newHotspots[index], [field]: value };
			setAttributes({ hotspots: newHotspots });
		};

		const addHotspot = () => {
			const newHotspots = [
				...hotspots,
				{
					x: 50,
					y: 50,
					title: `Hotspot ${hotspots.length + 1}`,
					content: 'Neuer Hotspot',
					icon: 'info',
					color: '#0073aa',
					size: 'medium',
					animation: 'pulse',
					trigger: 'click',
				},
			];
			setAttributes({ hotspots: newHotspots });
		};

		const removeHotspot = (index) => {
			const newHotspots = hotspots.filter((_, i) => i !== index);
			setAttributes({ hotspots: newHotspots });
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
					</PanelBody>

					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
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
						<RangeControl
							label={__('Höhe (px)', 'modular-blocks-plugin')}
							value={height}
							onChange={(value) => setAttributes({ height: value })}
							min={200}
							max={800}
						/>
						<SelectControl
							label={__('Hotspot-Stil', 'modular-blocks-plugin')}
							value={hotspotStyle}
							options={[
								{ label: __('Kreis', 'modular-blocks-plugin'), value: 'circle' },
								{ label: __('Quadrat', 'modular-blocks-plugin'), value: 'square' },
								{ label: __('Pin', 'modular-blocks-plugin'), value: 'pin' },
							]}
							onChange={(value) => setAttributes({ hotspotStyle: value })}
						/>
						<SelectControl
							label={__('Popup-Stil', 'modular-blocks-plugin')}
							value={popupStyle}
							options={[
								{ label: __('Tooltip', 'modular-blocks-plugin'), value: 'tooltip' },
								{ label: __('Modal', 'modular-blocks-plugin'), value: 'modal' },
								{ label: __('Inline', 'modular-blocks-plugin'), value: 'inline' },
							]}
							onChange={(value) => setAttributes({ popupStyle: value })}
						/>
						<ToggleControl
							label={__('Nummern anzeigen', 'modular-blocks-plugin')}
							checked={showNumbers}
							onChange={(value) => setAttributes({ showNumbers: value })}
						/>
						<ToggleControl
							label={__('Automatisch schließen', 'modular-blocks-plugin')}
							checked={autoClose}
							onChange={(value) => setAttributes({ autoClose: value })}
						/>
						<ToggleControl
							label={__('Zoom aktivieren', 'modular-blocks-plugin')}
							checked={enableZoom}
							onChange={(value) => setAttributes({ enableZoom: value })}
						/>
					</PanelBody>

					<PanelBody title={__('Hotspots', 'modular-blocks-plugin')} initialOpen={false}>
						{hotspots.map((hotspot, index) => (
							<Card key={index} style={{ marginBottom: '10px' }}>
								<CardHeader>
									<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
										<strong>{hotspot.title || `Hotspot ${index + 1}`}</strong>
										<Button
											onClick={() => removeHotspot(index)}
											icon={trash}
											variant="tertiary"
											size="small"
											isDestructive
										/>
									</div>
								</CardHeader>
								<CardBody>
									<TextControl
										label={__('Titel', 'modular-blocks-plugin')}
										value={hotspot.title}
										onChange={(value) => updateHotspot(index, 'title', value)}
									/>
									<TextControl
										label={__('Inhalt', 'modular-blocks-plugin')}
										value={hotspot.content}
										onChange={(value) => updateHotspot(index, 'content', value)}
									/>
									<RangeControl
										label={__('X Position (%)', 'modular-blocks-plugin')}
										value={hotspot.x}
										onChange={(value) => updateHotspot(index, 'x', value)}
										min={0}
										max={100}
									/>
									<RangeControl
										label={__('Y Position (%)', 'modular-blocks-plugin')}
										value={hotspot.y}
										onChange={(value) => updateHotspot(index, 'y', value)}
										min={0}
										max={100}
									/>
									<div>
										<label>{__('Farbe', 'modular-blocks-plugin')}</label>
										<ColorPicker
											color={hotspot.color}
											onChangeComplete={(color) => updateHotspot(index, 'color', color.hex)}
										/>
									</div>
								</CardBody>
							</Card>
						))}
						<Button onClick={addHotspot} icon={plus} variant="secondary">
							{__('Hotspot hinzufügen', 'modular-blocks-plugin')}
						</Button>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="point-of-interest-container">
						{title && <h3>{title}</h3>}
						{description && <p>{description}</p>}
						<div className="poi-preview" style={{ height: `${height}px`, position: 'relative', border: '1px solid #ddd' }}>
							{backgroundImage.url ? (
								<>
									<img src={backgroundImage.url} alt={backgroundImage.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									{hotspots.map((hotspot, index) => (
										<div
											key={index}
											className="hotspot-marker"
											style={{
												position: 'absolute',
												left: `${hotspot.x}%`,
												top: `${hotspot.y}%`,
												width: '30px',
												height: '30px',
												borderRadius: '50%',
												backgroundColor: hotspot.color,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: 'white',
												fontWeight: 'bold',
												cursor: 'pointer',
												transform: 'translate(-50%, -50%)',
											}}
										>
											{showNumbers ? index + 1 : '●'}
										</div>
									))}
								</>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>
									{__('Bitte wählen Sie ein Hintergrundbild', 'modular-blocks-plugin')}
								</div>
							)}
						</div>
					</div>
				</div>
			</>
		);
	},

	save: ({ attributes }) => {
		const {
			backgroundImage,
			title,
			description,
			hotspots,
			hotspotStyle,
			popupStyle,
			popupPosition,
			showNumbers,
			autoClose,
			closeOnOutsideClick,
			height,
			enableZoom,
			zoomLevel,
		} = attributes;

		const blockProps = useBlockProps.save();

		const poiData = {
			hotspots,
			hotspotStyle,
			popupStyle,
			popupPosition,
			showNumbers,
			autoClose,
			closeOnOutsideClick,
			enableZoom,
			zoomLevel,
		};

		return (
			<div {...blockProps} data-poi-config={JSON.stringify(poiData)}>
				<div className="point-of-interest-container">
					{title && <h3 className="poi-title">{title}</h3>}
					{description && <p className="poi-description">{description}</p>}
					<div className="poi-image-container" style={{ height: `${height}px`, position: 'relative' }}>
						{backgroundImage.url && (
							<>
								<img src={backgroundImage.url} alt={backgroundImage.alt} className="poi-background" />
								<div className="hotspots-layer">
									{hotspots.map((hotspot, index) => (
										<button
											key={index}
											className={`hotspot hotspot-${hotspotStyle}`}
											style={{
												left: `${hotspot.x}%`,
												top: `${hotspot.y}%`,
												backgroundColor: hotspot.color,
											}}
											data-hotspot-index={index}
											aria-label={hotspot.title}
										>
											{showNumbers ? index + 1 : '●'}
										</button>
									))}
								</div>
								<div className="hotspot-popups">
									{hotspots.map((hotspot, index) => (
										<div
											key={index}
											className={`hotspot-popup popup-${popupStyle}`}
											data-popup-index={index}
											style={{ display: 'none' }}
										>
											<div className="popup-header">
												<h4>{hotspot.title}</h4>
												<button className="popup-close" aria-label={__('Schließen', 'modular-blocks-plugin')}>
													×
												</button>
											</div>
											<div className="popup-content">
												<p>{hotspot.content}</p>
											</div>
										</div>
									))}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		);
	},
});
