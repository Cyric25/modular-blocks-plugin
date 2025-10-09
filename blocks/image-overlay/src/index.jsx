import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, RangeControl, Button, Card, CardHeader, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

registerBlockType('modular-blocks/image-overlay', {
	edit: ({ attributes, setAttributes }) => {
		const {
			baseImage,
			layers,
			title,
			description,
			height,
			showLabels,
			showDescriptions,
			allowMultipleVisible,
			transitionDuration,
			buttonStyle,
			buttonPosition,
		} = attributes;

		const blockProps = useBlockProps();

		const updateLayer = (index, field, value) => {
			const newLayers = [...layers];
			newLayers[index] = { ...newLayers[index], [field]: value };
			setAttributes({ layers: newLayers });
		};

		const updateLayerImage = (index, media) => {
			const newLayers = [...layers];
			newLayers[index] = {
				...newLayers[index],
				image: {
					url: media.url,
					alt: media.alt,
					id: media.id,
				},
			};
			setAttributes({ layers: newLayers });
		};

		const addLayer = () => {
			const newLayers = [
				...layers,
				{
					image: { url: '', alt: '', id: null },
					label: `Ebene ${layers.length + 1}`,
					description: '',
					opacity: 100,
					visible: false,
					color: '#0073aa',
				},
			];
			setAttributes({ layers: newLayers });
		};

		const removeLayer = (index) => {
			if (layers.length <= 1) return;
			const newLayers = layers.filter((_, i) => i !== index);
			setAttributes({ layers: newLayers });
		};

		const toggleLayerVisibility = (index) => {
			const newLayers = [...layers];
			if (!allowMultipleVisible) {
				newLayers.forEach((layer, i) => {
					if (i === index) {
						newLayers[i].visible = !newLayers[i].visible;
					} else {
						newLayers[i].visible = false;
					}
				});
			} else {
				newLayers[index].visible = !newLayers[index].visible;
			}
			setAttributes({ layers: newLayers });
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Basis-Bild', 'modular-blocks-plugin')}>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={(media) => {
									setAttributes({
										baseImage: {
											url: media.url,
											alt: media.alt,
											id: media.id,
										},
									});
								}}
								allowedTypes={['image']}
								value={baseImage.id}
								render={({ open }) => (
									<Button onClick={open} variant="secondary">
										{baseImage.url
											? __('Bild ändern', 'modular-blocks-plugin')
											: __('Bild auswählen', 'modular-blocks-plugin')}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						{baseImage.url && (
							<>
								<img src={baseImage.url} alt={baseImage.alt} style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
								<Button
									onClick={() => {
										setAttributes({ baseImage: { url: '', alt: '', id: null } });
									}}
									variant="tertiary"
									isDestructive
									style={{ marginTop: '5px' }}
								>
									{__('Entfernen', 'modular-blocks-plugin')}
								</Button>
							</>
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
						<ToggleControl
							label={__('Labels anzeigen', 'modular-blocks-plugin')}
							checked={showLabels}
							onChange={(value) => setAttributes({ showLabels: value })}
						/>
						<ToggleControl
							label={__('Beschreibungen anzeigen', 'modular-blocks-plugin')}
							checked={showDescriptions}
							onChange={(value) => setAttributes({ showDescriptions: value })}
						/>
						<ToggleControl
							label={__('Mehrere Ebenen gleichzeitig sichtbar', 'modular-blocks-plugin')}
							checked={allowMultipleVisible}
							onChange={(value) => setAttributes({ allowMultipleVisible: value })}
						/>
						<RangeControl
							label={__('Übergangs-Dauer (ms)', 'modular-blocks-plugin')}
							value={transitionDuration}
							onChange={(value) => setAttributes({ transitionDuration: value })}
							min={0}
							max={1000}
							step={50}
						/>
						<SelectControl
							label={__('Button-Stil', 'modular-blocks-plugin')}
							value={buttonStyle}
							options={[
								{ label: __('Tabs', 'modular-blocks-plugin'), value: 'tabs' },
								{ label: __('Buttons', 'modular-blocks-plugin'), value: 'buttons' },
								{ label: __('Checkboxen', 'modular-blocks-plugin'), value: 'checkboxes' },
							]}
							onChange={(value) => setAttributes({ buttonStyle: value })}
						/>
						<SelectControl
							label={__('Button-Position', 'modular-blocks-plugin')}
							value={buttonPosition}
							options={[
								{ label: __('Oben', 'modular-blocks-plugin'), value: 'top' },
								{ label: __('Unten', 'modular-blocks-plugin'), value: 'bottom' },
								{ label: __('Links', 'modular-blocks-plugin'), value: 'left' },
								{ label: __('Rechts', 'modular-blocks-plugin'), value: 'right' },
							]}
							onChange={(value) => setAttributes({ buttonPosition: value })}
						/>
					</PanelBody>

					<PanelBody title={__('Ebenen', 'modular-blocks-plugin')} initialOpen={false}>
						{layers.map((layer, index) => (
							<Card key={index} style={{ marginBottom: '10px' }}>
								<CardHeader>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<input
												type="checkbox"
												checked={layer.visible}
												onChange={() => toggleLayerVisibility(index)}
											/>
											<strong>{layer.label}</strong>
										</div>
										<Button
											onClick={() => removeLayer(index)}
											icon={trash}
											variant="tertiary"
											size="small"
											isDestructive
										/>
									</div>
								</CardHeader>
								<CardBody>
									<TextControl
										label={__('Label', 'modular-blocks-plugin')}
										value={layer.label}
										onChange={(value) => updateLayer(index, 'label', value)}
									/>
									<TextControl
										label={__('Beschreibung', 'modular-blocks-plugin')}
										value={layer.description}
										onChange={(value) => updateLayer(index, 'description', value)}
									/>
									<MediaUploadCheck>
										<MediaUpload
											onSelect={(media) => updateLayerImage(index, media)}
											allowedTypes={['image']}
											value={layer.image.id}
											render={({ open }) => (
												<Button onClick={open} variant="secondary" size="small">
													{layer.image.url
														? __('Bild ändern', 'modular-blocks-plugin')
														: __('Bild auswählen', 'modular-blocks-plugin')}
												</Button>
											)}
										/>
									</MediaUploadCheck>
									{layer.image.url && (
										<img src={layer.image.url} alt={layer.image.alt} style={{ maxWidth: '100%', marginTop: '10px' }} />
									)}
									<RangeControl
										label={__('Deckkraft (%)', 'modular-blocks-plugin')}
										value={layer.opacity}
										onChange={(value) => updateLayer(index, 'opacity', value)}
										min={0}
										max={100}
									/>
								</CardBody>
							</Card>
						))}
						<Button onClick={addLayer} icon={plus} variant="secondary">
							{__('Ebene hinzufügen', 'modular-blocks-plugin')}
						</Button>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="image-overlay-container">
						{title && <h3>{title}</h3>}
						{description && <p>{description}</p>}

						<div className="layer-controls" style={{ marginBottom: '10px' }}>
							{layers.map((layer, index) => (
								<Button
									key={index}
									onClick={() => toggleLayerVisibility(index)}
									variant={layer.visible ? 'primary' : 'secondary'}
									size="small"
									style={{ marginRight: '5px' }}
								>
									{layer.label}
								</Button>
							))}
						</div>

						<div className="overlay-preview" style={{ height: `${height}px`, position: 'relative', border: '1px solid #ddd' }}>
							{baseImage.url ? (
								<>
									<img
										src={baseImage.url}
										alt={baseImage.alt}
										style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
									/>
									{layers.map((layer, index) => (
										layer.visible && layer.image.url && (
											<img
												key={index}
												src={layer.image.url}
												alt={layer.image.alt}
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													position: 'absolute',
													top: 0,
													left: 0,
													opacity: layer.opacity / 100,
													transition: `opacity ${transitionDuration}ms`,
												}}
											/>
										)
									))}
								</>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>
									{__('Bitte wählen Sie ein Basis-Bild', 'modular-blocks-plugin')}
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
			baseImage,
			layers,
			title,
			description,
			height,
			showLabels,
			showDescriptions,
			allowMultipleVisible,
			transitionDuration,
			buttonStyle,
			buttonPosition,
		} = attributes;

		const blockProps = useBlockProps.save();

		const overlayData = {
			layers,
			showLabels,
			showDescriptions,
			allowMultipleVisible,
			transitionDuration,
			buttonStyle,
			buttonPosition,
		};

		return (
			<div {...blockProps} data-overlay-config={JSON.stringify(overlayData)}>
				<div className={`image-overlay-container button-position-${buttonPosition}`}>
					{title && <h3 className="overlay-title">{title}</h3>}
					{description && <p className="overlay-description">{description}</p>}

					<div className={`layer-controls button-style-${buttonStyle}`}>
						{layers.map((layer, index) => (
							<button
								key={index}
								type="button"
								className={`layer-toggle ${layer.visible ? 'active' : ''}`}
								data-layer-index={index}
								style={{ borderColor: layer.color }}
							>
								{showLabels && <span className="layer-label">{layer.label}</span>}
								{showDescriptions && layer.description && <span className="layer-description">{layer.description}</span>}
							</button>
						))}
					</div>

					<div className="overlay-image-container" style={{ height: `${height}px` }}>
						{baseImage.url && <img src={baseImage.url} alt={baseImage.alt} className="base-image" />}
						{layers.map((layer, index) => (
							layer.image.url && (
								<img
									key={index}
									src={layer.image.url}
									alt={layer.image.alt}
									className={`overlay-layer layer-${index} ${layer.visible ? 'visible' : ''}`}
									data-layer-index={index}
									style={{ opacity: layer.opacity / 100 }}
								/>
							)
						))}
					</div>
				</div>
			</div>
		);
	},
});
