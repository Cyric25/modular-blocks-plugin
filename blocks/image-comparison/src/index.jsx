import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, RangeControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/image-comparison', {
	edit: ({ attributes, setAttributes }) => {
		const {
			beforeImage,
			afterImage,
			beforeLabel,
			afterLabel,
			orientation,
			startingPosition,
			showLabels,
			hoverAnimation,
			height,
		} = attributes;

		const blockProps = useBlockProps();

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Bilder', 'modular-blocks-plugin')}>
						<div style={{ marginBottom: '15px' }}>
							<strong>{__('Vorher-Bild', 'modular-blocks-plugin')}</strong>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={(media) => {
										setAttributes({
											beforeImage: {
												url: media.url,
												alt: media.alt,
												id: media.id,
											},
										});
									}}
									allowedTypes={['image']}
									value={beforeImage.id}
									render={({ open }) => (
										<Button onClick={open} variant="secondary" style={{ marginTop: '5px' }}>
											{beforeImage.url
												? __('Bild ändern', 'modular-blocks-plugin')
												: __('Bild auswählen', 'modular-blocks-plugin')}
										</Button>
									)}
								/>
							</MediaUploadCheck>
							{beforeImage.url && (
								<>
									<img src={beforeImage.url} alt={beforeImage.alt} style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
									<Button
										onClick={() => {
											setAttributes({ beforeImage: { url: '', alt: '', id: null } });
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
							<strong>{__('Nachher-Bild', 'modular-blocks-plugin')}</strong>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={(media) => {
										setAttributes({
											afterImage: {
												url: media.url,
												alt: media.alt,
												id: media.id,
											},
										});
									}}
									allowedTypes={['image']}
									value={afterImage.id}
									render={({ open }) => (
										<Button onClick={open} variant="secondary" style={{ marginTop: '5px' }}>
											{afterImage.url
												? __('Bild ändern', 'modular-blocks-plugin')
												: __('Bild auswählen', 'modular-blocks-plugin')}
										</Button>
									)}
								/>
							</MediaUploadCheck>
							{afterImage.url && (
								<>
									<img src={afterImage.url} alt={afterImage.alt} style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }} />
									<Button
										onClick={() => {
											setAttributes({ afterImage: { url: '', alt: '', id: null } });
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

					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
						<TextControl
							label={__('Vorher-Label', 'modular-blocks-plugin')}
							value={beforeLabel}
							onChange={(value) => setAttributes({ beforeLabel: value })}
						/>
						<TextControl
							label={__('Nachher-Label', 'modular-blocks-plugin')}
							value={afterLabel}
							onChange={(value) => setAttributes({ afterLabel: value })}
						/>
						<SelectControl
							label={__('Orientierung', 'modular-blocks-plugin')}
							value={orientation}
							options={[
								{ label: __('Horizontal', 'modular-blocks-plugin'), value: 'horizontal' },
								{ label: __('Vertikal', 'modular-blocks-plugin'), value: 'vertical' },
							]}
							onChange={(value) => setAttributes({ orientation: value })}
						/>
						<RangeControl
							label={__('Start-Position (%)', 'modular-blocks-plugin')}
							value={startingPosition}
							onChange={(value) => setAttributes({ startingPosition: value })}
							min={0}
							max={100}
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
							label={__('Hover-Animation', 'modular-blocks-plugin')}
							checked={hoverAnimation}
							onChange={(value) => setAttributes({ hoverAnimation: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="image-comparison-container">
						<div className="comparison-preview" style={{ height: `${height}px`, position: 'relative', border: '1px solid #ddd' }}>
							{beforeImage.url && afterImage.url ? (
								<>
									<div style={{ position: 'relative', width: '100%', height: '100%' }}>
										<img
											src={afterImage.url}
											alt={afterImage.alt}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
										<div
											style={{
												position: 'absolute',
												top: 0,
												left: 0,
												width: `${startingPosition}%`,
												height: '100%',
												overflow: 'hidden',
											}}
										>
											<img
												src={beforeImage.url}
												alt={beforeImage.alt}
												style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											/>
										</div>
										<div
											style={{
												position: 'absolute',
												left: `${startingPosition}%`,
												top: 0,
												bottom: 0,
												width: '4px',
												backgroundColor: 'white',
												cursor: 'ew-resize',
												transform: 'translateX(-50%)',
											}}
										>
											<div
												style={{
													position: 'absolute',
													top: '50%',
													left: '50%',
													transform: 'translate(-50%, -50%)',
													width: '40px',
													height: '40px',
													borderRadius: '50%',
													backgroundColor: 'white',
													border: '2px solid #0073aa',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												⇄
											</div>
										</div>
										{showLabels && (
											<>
												<div
													style={{
														position: 'absolute',
														top: '10px',
														left: '10px',
														padding: '5px 10px',
														backgroundColor: 'rgba(0,0,0,0.7)',
														color: 'white',
														borderRadius: '4px',
													}}
												>
													{beforeLabel}
												</div>
												<div
													style={{
														position: 'absolute',
														top: '10px',
														right: '10px',
														padding: '5px 10px',
														backgroundColor: 'rgba(0,0,0,0.7)',
														color: 'white',
														borderRadius: '4px',
													}}
												>
													{afterLabel}
												</div>
											</>
										)}
									</div>
								</>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>
									{__('Bitte wählen Sie ein Vorher- und ein Nachher-Bild', 'modular-blocks-plugin')}
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
			beforeImage,
			afterImage,
			beforeLabel,
			afterLabel,
			orientation,
			startingPosition,
			showLabels,
			hoverAnimation,
			height,
		} = attributes;

		const blockProps = useBlockProps.save();

		const comparisonData = {
			orientation,
			startingPosition,
			showLabels,
			hoverAnimation,
			beforeLabel,
			afterLabel,
		};

		return (
			<div {...blockProps} data-comparison-config={JSON.stringify(comparisonData)}>
				<div className={`image-comparison-container orientation-${orientation}`}>
					<div className="comparison-wrapper" style={{ height: `${height}px` }}>
						<div className="before-image-container">
							{beforeImage.url && <img src={beforeImage.url} alt={beforeImage.alt} className="before-image" />}
							{showLabels && <div className="image-label before-label">{beforeLabel}</div>}
						</div>
						<div className="after-image-container">
							{afterImage.url && <img src={afterImage.url} alt={afterImage.alt} className="after-image" />}
							{showLabels && <div className="image-label after-label">{afterLabel}</div>}
						</div>
						<div className="comparison-slider" style={{ [orientation === 'horizontal' ? 'left' : 'top']: `${startingPosition}%` }}>
							<div className="slider-handle">
								<span className="slider-icon">{orientation === 'horizontal' ? '⇄' : '⇅'}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
});
