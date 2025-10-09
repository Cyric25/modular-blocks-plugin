import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, TextareaControl, SelectControl, ToggleControl, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/molecule-viewer', {
	edit: ({ attributes, setAttributes }) => {
		const {
			sourceType,
			pdbId,
			structureUrl,
			structureData,
			displayStyle,
			colorScheme,
			backgroundColor,
			width,
			height,
			showControls,
			enableSpin,
			ariaLabel,
			description,
		} = attributes;

		const blockProps = useBlockProps();

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Struktur-Quelle', 'modular-blocks-plugin')}>
						<SelectControl
							label={__('Quelle', 'modular-blocks-plugin')}
							value={sourceType}
							options={[
								{ label: __('PDB-ID', 'modular-blocks-plugin'), value: 'pdb' },
								{ label: __('URL', 'modular-blocks-plugin'), value: 'url' },
								{ label: __('Direkteingabe', 'modular-blocks-plugin'), value: 'upload' },
							]}
							onChange={(value) => setAttributes({ sourceType: value })}
						/>

						{sourceType === 'pdb' && (
							<TextControl
								label={__('PDB-ID', 'modular-blocks-plugin')}
								value={pdbId}
								onChange={(value) => setAttributes({ pdbId: value })}
								help={__('z.B. 1YCR', 'modular-blocks-plugin')}
							/>
						)}

						{sourceType === 'url' && (
							<TextControl
								label={__('Struktur-URL', 'modular-blocks-plugin')}
								value={structureUrl}
								onChange={(value) => setAttributes({ structureUrl: value })}
								help={__('URL zu einer PDB/MOL/SDF-Datei', 'modular-blocks-plugin')}
							/>
						)}

						{sourceType === 'upload' && (
							<TextareaControl
								label={__('Struktur-Daten', 'modular-blocks-plugin')}
								value={structureData}
								onChange={(value) => setAttributes({ structureData: value })}
								help={__('PDB/MOL-Format', 'modular-blocks-plugin')}
								rows={8}
							/>
						)}
					</PanelBody>

					<PanelBody title={__('Darstellung', 'modular-blocks-plugin')}>
						<SelectControl
							label={__('Darstellungsstil', 'modular-blocks-plugin')}
							value={displayStyle}
							options={[
								{ label: __('Stick', 'modular-blocks-plugin'), value: 'stick' },
								{ label: __('Kugel', 'modular-blocks-plugin'), value: 'sphere' },
								{ label: __('Cartoon', 'modular-blocks-plugin'), value: 'cartoon' },
								{ label: __('Linie', 'modular-blocks-plugin'), value: 'line' },
								{ label: __('Oberfläche', 'modular-blocks-plugin'), value: 'surface' },
							]}
							onChange={(value) => setAttributes({ displayStyle: value })}
						/>
						<SelectControl
							label={__('Farbschema', 'modular-blocks-plugin')}
							value={colorScheme}
							options={[
								{ label: __('Standard', 'modular-blocks-plugin'), value: 'default' },
								{ label: __('Kohlenstoff', 'modular-blocks-plugin'), value: 'carbon' },
								{ label: __('Spektrum', 'modular-blocks-plugin'), value: 'spectrum' },
								{ label: __('Kette', 'modular-blocks-plugin'), value: 'chain' },
								{ label: __('Sekundärstruktur', 'modular-blocks-plugin'), value: 'ss' },
							]}
							onChange={(value) => setAttributes({ colorScheme: value })}
						/>
						<TextControl
							label={__('Hintergrundfarbe', 'modular-blocks-plugin')}
							value={backgroundColor}
							onChange={(value) => setAttributes({ backgroundColor: value })}
							type="color"
						/>
					</PanelBody>

					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
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
						<ToggleControl
							label={__('Steuerung anzeigen', 'modular-blocks-plugin')}
							checked={showControls}
							onChange={(value) => setAttributes({ showControls: value })}
						/>
						<ToggleControl
							label={__('Auto-Rotation', 'modular-blocks-plugin')}
							checked={enableSpin}
							onChange={(value) => setAttributes({ enableSpin: value })}
						/>
						<TextControl
							label={__('Beschreibung', 'modular-blocks-plugin')}
							value={description}
							onChange={(value) => setAttributes({ description: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="molecule-viewer-container">
						<div
							className="molecule-preview"
							style={{
								width: `${width}px`,
								height: `${height}px`,
								backgroundColor: backgroundColor,
								border: '1px solid #ddd',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div style={{ textAlign: 'center', color: '#fff' }}>
								<p><strong>{__('3D Molekül-Viewer', 'modular-blocks-plugin')}</strong></p>
								<p style={{ fontSize: '12px', marginTop: '10px' }}>
									{sourceType === 'pdb' && __('PDB: ' + pdbId, 'modular-blocks-plugin')}
									{sourceType === 'url' && __('URL: ' + structureUrl, 'modular-blocks-plugin')}
									{sourceType === 'upload' && __('Benutzerdefinierte Struktur', 'modular-blocks-plugin')}
								</p>
								<p style={{ fontSize: '12px', marginTop: '5px' }}>
									{__('Stil: ' + displayStyle + ' | Farbe: ' + colorScheme, 'modular-blocks-plugin')}
								</p>
								<p style={{ fontSize: '11px', marginTop: '10px', color: '#ccc' }}>
									{__('Der 3D-Viewer wird im Frontend mit 3Dmol.js gerendert', 'modular-blocks-plugin')}
								</p>
							</div>
						</div>
						{description && (
							<p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>{description}</p>
						)}
					</div>
				</div>
			</>
		);
	},

	save: ({ attributes }) => {
		const {
			sourceType,
			pdbId,
			structureUrl,
			structureData,
			displayStyle,
			colorScheme,
			backgroundColor,
			width,
			height,
			showControls,
			enableSpin,
			ariaLabel,
			description,
		} = attributes;

		const blockProps = useBlockProps.save();

		const viewerConfig = {
			sourceType,
			pdbId,
			structureUrl,
			structureData,
			displayStyle,
			colorScheme,
			backgroundColor,
			width,
			height,
			showControls,
			enableSpin,
		};

		return (
			<div {...blockProps} data-molecule-config={JSON.stringify(viewerConfig)}>
				<div className="molecule-viewer-container">
					<div
						className="molecule-viewer"
						style={{
							width: `${width}px`,
							height: `${height}px`,
							backgroundColor: backgroundColor,
						}}
						aria-label={ariaLabel}
					>
						{/* 3Dmol.js will render here via view.js */}
					</div>
					{description && <p className="molecule-description">{description}</p>}
				</div>
			</div>
		);
	},
});
