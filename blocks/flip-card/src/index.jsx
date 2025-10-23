import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/flip-card', {
	edit: ({ attributes, setAttributes }) => {
		const {
			frontImage,
			backImage,
			frontLabel,
			backLabel,
			flipDirection,
			flipTrigger,
			autoFlip,
			showLabels,
			height,
		} = attributes;

		const blockProps = useBlockProps();

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Bilder', 'modular-blocks-plugin')}>
						<div style={{ marginBottom: '15px' }}>
							<strong>{__('Vorderseiten-Bild', 'modular-blocks-plugin')}</strong>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={(media) => {
										setAttributes({
											frontImage: {
												url: media.url,
												alt: media.alt,
												id: media.id,
											},
										});
									}}
									allowedTypes={['image']}
									value={frontImage.id}
									render={({ open }) => (
										<Button onClick={open} variant="secondary" style={{ marginTop: '5px' }}>
											{frontImage.url
												? __('Bild ändern', 'modular-blocks-plugin')
												: __('Bild auswählen', 'modular-blocks-plugin')}
										</Button>
									)}
								/>
							</MediaUploadCheck>
							{frontImage.url && (
								<>
									<img src={frontImage.url} alt={frontImage.alt} style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
									<Button
										onClick={() => {
											setAttributes({ frontImage: { url: '', alt: '', id: null } });
										}}
										variant="tertiary"
										isDestructive
										style={{ marginTop: '5px' }}
									>
										{__('Entfernen', 'modular-blocks-plugin')}
									</Button>
								</>
							)}
						</div>

						<div style={{ marginBottom: '15px' }}>
							<strong>{__('Rückseiten-Bild', 'modular-blocks-plugin')}</strong>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={(media) => {
										setAttributes({
											backImage: {
												url: media.url,
												alt: media.alt,
												id: media.id,
											},
										});
									}}
									allowedTypes={['image']}
									value={backImage.id}
									render={({ open }) => (
										<Button onClick={open} variant="secondary" style={{ marginTop: '5px' }}>
											{backImage.url
												? __('Bild ändern', 'modular-blocks-plugin')
												: __('Bild auswählen', 'modular-blocks-plugin')}
										</Button>
									)}
								/>
							</MediaUploadCheck>
							{backImage.url && (
								<>
									<img src={backImage.url} alt={backImage.alt} style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
									<Button
										onClick={() => {
											setAttributes({ backImage: { url: '', alt: '', id: null } });
										}}
										variant="tertiary"
										isDestructive
										style={{ marginTop: '5px' }}
									>
										{__('Entfernen', 'modular-blocks-plugin')}
									</Button>
								</>
							)}
						</div>
					</PanelBody>

					<PanelBody title={__('Flip-Einstellungen', 'modular-blocks-plugin')}>
						<SelectControl
							label={__('Flip-Richtung', 'modular-blocks-plugin')}
							value={flipDirection}
							options={[
								{ label: __('Horizontal (links-rechts)', 'modular-blocks-plugin'), value: 'horizontal' },
								{ label: __('Vertikal (oben-unten)', 'modular-blocks-plugin'), value: 'vertical' },
							]}
							onChange={(value) => setAttributes({ flipDirection: value })}
						/>
						<SelectControl
							label={__('Auslöser', 'modular-blocks-plugin')}
							value={flipTrigger}
							options={[
								{ label: __('Klick', 'modular-blocks-plugin'), value: 'click' },
								{ label: __('Hover', 'modular-blocks-plugin'), value: 'hover' },
							]}
							onChange={(value) => setAttributes({ flipTrigger: value })}
						/>
						<ToggleControl
							label={__('Automatisch zurückdrehen', 'modular-blocks-plugin')}
							help={__('Karte dreht sich automatisch zurück nach dem Umdrehen', 'modular-blocks-plugin')}
							checked={autoFlip}
							onChange={(value) => setAttributes({ autoFlip: value })}
						/>
					</PanelBody>

					<PanelBody title={__('Darstellung', 'modular-blocks-plugin')}>
						<TextControl
							label={__('Vorderseiten-Label', 'modular-blocks-plugin')}
							value={frontLabel}
							onChange={(value) => setAttributes({ frontLabel: value })}
						/>
						<TextControl
							label={__('Rückseiten-Label', 'modular-blocks-plugin')}
							value={backLabel}
							onChange={(value) => setAttributes({ backLabel: value })}
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
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="flip-card-preview" style={{ height: `${height}px`, position: 'relative', border: '1px solid #ddd', borderRadius: '4px' }}>
						{frontImage.url && backImage.url ? (
							<>
								<div style={{ position: 'relative', width: '100%', height: '100%' }}>
									<img
										src={frontImage.url}
										alt={frontImage.alt}
										style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
									/>
									{showLabels && (
										<div
											style={{
												position: 'absolute',
												top: '10px',
												left: '10px',
												padding: '5px 10px',
												backgroundColor: 'rgba(0,0,0,0.7)',
												color: 'white',
												borderRadius: '4px',
												fontSize: '12px',
											}}
										>
											{frontLabel}
										</div>
									)}
									<div
										style={{
											position: 'absolute',
											bottom: '10px',
											right: '10px',
											padding: '5px 10px',
											backgroundColor: 'rgba(0,115,170,0.9)',
											color: 'white',
											borderRadius: '4px',
											fontSize: '11px',
										}}
									>
										{__('Klick/Hover für Rückseite', 'modular-blocks-plugin')}
									</div>
								</div>
							</>
						) : (
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>
								{__('Bitte wählen Sie ein Vorderseiten- und ein Rückseiten-Bild', 'modular-blocks-plugin')}
							</div>
						)}
					</div>
				</div>
			</>
		);
	},

	// Dynamic block - rendering is handled by render.php
	save: () => {
		return null;
	},
});
