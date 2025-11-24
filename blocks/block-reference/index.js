import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl, Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

registerBlockType('modular-blocks/block-reference', {
	edit: ({ attributes, setAttributes }) => {
		const { targetBlockId, targetPostId, targetBlockTitle, targetPostTitle, linkText, showIcon } = attributes;
		const [cbdBlocks, setCbdBlocks] = useState([]);
		const [loading, setLoading] = useState(true);

		const blockProps = useBlockProps({
			className: 'block-reference-editor'
		});

		// Fetch all CBD blocks from all posts/pages
		useEffect(() => {
			setLoading(true);
			apiFetch({ path: '/modular-blocks/v1/cbd-blocks' })
				.then((blocks) => {
					setCbdBlocks(blocks);
					setLoading(false);
				})
				.catch((error) => {
					console.error('Error fetching CBD blocks:', error);
					setLoading(false);
				});
		}, []);

		// Create options for SelectControl
		const blockOptions = [
			{ label: __('-- Block auswählen --', 'modular-blocks'), value: '' },
			...cbdBlocks.map((block) => ({
				label: `${block.postTitle} → ${block.blockTitle}`,
				value: JSON.stringify({
					blockId: block.blockId,
					postId: block.postId,
					blockTitle: block.blockTitle,
					postTitle: block.postTitle
				})
			}))
		];

		const handleBlockSelection = (value) => {
			if (!value) {
				setAttributes({
					targetBlockId: '',
					targetPostId: 0,
					targetBlockTitle: '',
					targetPostTitle: '',
					linkText: ''
				});
				return;
			}

			const data = JSON.parse(value);
			setAttributes({
				targetBlockId: data.blockId,
				targetPostId: data.postId,
				targetBlockTitle: data.blockTitle,
				targetPostTitle: data.postTitle,
				linkText: linkText || `Gehe zu: ${data.blockTitle}`
			});
		};

		// Get current selected value
		const selectedValue = targetBlockId ? JSON.stringify({
			blockId: targetBlockId,
			postId: targetPostId,
			blockTitle: targetBlockTitle,
			postTitle: targetPostTitle
		}) : '';

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Block-Referenz Einstellungen', 'modular-blocks')}>
						<SelectControl
							label={__('Ziel-Block', 'modular-blocks')}
							value={selectedValue}
							options={blockOptions}
							onChange={handleBlockSelection}
							help={__('Wähle einen Container-Block als Ziel aus', 'modular-blocks')}
						/>

						{targetBlockId && (
							<>
								<TextControl
									label={__('Link-Text', 'modular-blocks')}
									value={linkText}
									onChange={(value) => setAttributes({ linkText: value })}
									help={__('Optionaler Text für den Link', 'modular-blocks')}
								/>

								<ToggleControl
									label={__('Icon anzeigen', 'modular-blocks')}
									checked={showIcon}
									onChange={(value) => setAttributes({ showIcon: value })}
								/>
							</>
						)}
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					{loading ? (
						<Placeholder
							icon="admin-links"
							label={__('Block-Referenz', 'modular-blocks')}
						>
							<Spinner />
							<p>{__('Lade Container-Blöcke...', 'modular-blocks')}</p>
						</Placeholder>
					) : !targetBlockId ? (
						<Placeholder
							icon="admin-links"
							label={__('Block-Referenz', 'modular-blocks')}
							instructions={__('Wähle einen Container-Block in den Einstellungen rechts aus.', 'modular-blocks')}
						>
							<p style={{ fontSize: '14px', color: '#666' }}>
								{cbdBlocks.length > 0
									? __(`${cbdBlocks.length} Container-Blöcke verfügbar`, 'modular-blocks')
									: __('Keine Container-Blöcke gefunden', 'modular-blocks')}
							</p>
						</Placeholder>
					) : (
						<div className="block-reference-preview">
							<div className="block-reference-preview-header">
								<span className="dashicons dashicons-admin-links"></span>
								<strong>{__('Block-Referenz:', 'modular-blocks')}</strong>
							</div>
							<div className="block-reference-preview-content">
								<p className="block-reference-preview-post">
									<strong>{__('Seite:', 'modular-blocks')}</strong> {targetPostTitle}
								</p>
								<p className="block-reference-preview-block">
									<strong>{__('Block:', 'modular-blocks')}</strong> {targetBlockTitle}
								</p>
								{linkText && (
									<div className="block-reference-preview-link">
										{showIcon && <span className="dashicons dashicons-arrow-right-alt2"></span>}
										<span>{linkText}</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</>
		);
	},

	save: () => {
		// Server-side rendering
		return null;
	}
});
