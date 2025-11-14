import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	TextareaControl,
	SelectControl,
	ToggleControl,
	RangeControl,
	Notice,
	TabPanel,
	Placeholder,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { code as icon } from '@wordpress/icons';

// Import styles
import './editor.css';
import './style.css';

registerBlockType('modular-blocks/html-sandbox-debug', {
	edit: ({ attributes, setAttributes }) => {
		const {
			htmlCode,
			cssCode,
			jsCode,
			externalScripts,
			isolationMode,
			sandboxFlags,
			autoHeight,
			minHeight,
			maxHeight,
		} = attributes;

		const iframeRef = useRef(null);
		const blockProps = useBlockProps({
			className: 'html-sandbox-editor',
		});

		// DEBUG VERSION: Log capabilities and always allow
		const canEdit = useSelect((select) => {
			try {
				const currentUser = select('core')?.getCurrentUser?.();
				if (!currentUser) return null; // Still loading

				// DEBUG: Log all user info
				console.log('HTML Sandbox DEBUG:', {
					user: currentUser.name,
					username: currentUser.username,
					roles: currentUser.roles,
					edit_posts: currentUser.capabilities?.edit_posts,
					unfiltered_html: currentUser.capabilities?.unfiltered_html,
					manage_options: currentUser.capabilities?.manage_options,
					allCapabilities: currentUser.capabilities
				});

				// DEBUG: Always return true (no capability check)
				return true;
			} catch (error) {
				console.error('HTML Sandbox: Error checking user capabilities', error);
				return true; // Allow on error to prevent blocking
			}
		}, []);

		// Show warning if user doesn't have permission
		// Only show error if explicitly false, not while loading (null)
		if (canEdit === false) {
			return (
				<div {...blockProps}>
					<Placeholder
						icon={icon}
						label={__('HTML Sandbox', 'modular-blocks-plugin')}
					>
						<Notice status="error" isDismissible={false}>
							<strong>{__('Zugriff verweigert', 'modular-blocks-plugin')}</strong>
							<p>
								{__(
									'Dieser Block erfordert die Berechtigung "edit_posts" (Redakteure, Autoren, Administratoren). Bitte kontaktieren Sie Ihren Administrator.',
									'modular-blocks-plugin'
								)}
							</p>
						</Notice>
					</Placeholder>
				</div>
			);
		}

		// Show loading placeholder while checking permissions
		if (canEdit === null) {
			return (
				<div {...blockProps}>
					<Placeholder
						icon={icon}
						label={__('HTML Sandbox', 'modular-blocks-plugin')}
						isColumnLayout={true}
					>
						<p>{__('Überprüfe Berechtigungen...', 'modular-blocks-plugin')}</p>
					</Placeholder>
				</div>
			);
		}

		// Update iframe content when code changes
		useEffect(() => {
			if (isolationMode === 'iframe' && iframeRef.current) {
				updateIframeContent();
			}
		}, [htmlCode, cssCode, jsCode, externalScripts, isolationMode]);

		const updateIframeContent = () => {
			if (!iframeRef.current) return;

			const iframe = iframeRef.current;

			try {
				const doc = iframe.contentDocument || iframe.contentWindow.document;

				// Build external scripts HTML
				const externalScriptsArray = externalScripts
					.split('\n')
					.filter((url) => url.trim())
					.map((url) => `<script src="${url.trim()}"></script>`)
					.join('\n');

				const fullHTML = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>${cssCode}</style>
</head>
<body>
	${htmlCode}
	${externalScriptsArray}
	<script>${jsCode}</script>
</body>
</html>
				`;

				doc.open();
				doc.write(fullHTML);
				doc.close();

				// Auto-height adjustment
				if (autoHeight) {
					setTimeout(() => {
						try {
							const height = doc.body.scrollHeight;
							iframe.style.height = Math.min(Math.max(height, minHeight), maxHeight) + 'px';
						} catch (e) {
							console.error('Could not adjust iframe height:', e);
						}
					}, 100);
				}
			} catch (error) {
				console.error('HTML Sandbox: Cannot access iframe content. This is a security restriction.', error);
				// Fallback: Set a default height if we can't access the iframe
				if (iframe && autoHeight) {
					iframe.style.height = minHeight + 'px';
				}
			}
		};

		const buildSandboxAttribute = () => {
			const flags = [];
			if (sandboxFlags.allowScripts) flags.push('allow-scripts');
			if (sandboxFlags.allowForms) flags.push('allow-forms');
			if (sandboxFlags.allowModals) flags.push('allow-modals');
			if (sandboxFlags.allowPointerLock) flags.push('allow-pointer-lock');
			if (sandboxFlags.allowPopups) flags.push('allow-popups');
			if (sandboxFlags.allowSameOrigin) flags.push('allow-same-origin');

			// IMPORTANT: In editor, we ALWAYS need allow-same-origin to access iframe content
			// Otherwise React can't read/write to the iframe document
			if (!flags.includes('allow-same-origin')) {
				flags.push('allow-same-origin');
			}

			return flags.join(' ');
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('⚠️ Sicherheitshinweis', 'modular-blocks-plugin')} initialOpen={true}>
						<Notice status="warning" isDismissible={false}>
							{__(
								'Dieser Block führt benutzerdefinierten Code aus. Verwenden Sie ihn nur, wenn Sie dem Code vertrauen. Ungeprüfter Code kann Sicherheitsrisiken darstellen.',
								'modular-blocks-plugin'
							)}
						</Notice>
					</PanelBody>

					<PanelBody title={__('Isolierungsmodus', 'modular-blocks-plugin')} initialOpen={false}>
						<SelectControl
							label={__('Methode', 'modular-blocks-plugin')}
							value={isolationMode}
							options={[
								{ label: 'iframe (volle Isolierung)', value: 'iframe' },
								{ label: 'Shadow DOM (moderne Methode)', value: 'shadow-dom' },
							]}
							onChange={(value) => setAttributes({ isolationMode: value })}
							help={
								isolationMode === 'iframe'
									? __('Vollständige Isolierung mit iframe. CSS und JS beeinflussen die Hauptseite nicht.', 'modular-blocks-plugin')
									: __('Moderne Web Component Technologie. CSS isoliert, JS im gleichen Context.', 'modular-blocks-plugin')
							}
						/>
					</PanelBody>

					{isolationMode === 'iframe' && (
						<PanelBody title={__('Sandbox-Sicherheit', 'modular-blocks-plugin')}>
							<Notice status="warning" isDismissible={false}>
								{__('Sandbox-Einstellungen kontrollieren, was der Code tun darf.', 'modular-blocks-plugin')}
							</Notice>
							<ToggleControl
								label={__('JavaScript erlauben', 'modular-blocks-plugin')}
								checked={sandboxFlags.allowScripts}
								onChange={(value) =>
									setAttributes({
										sandboxFlags: { ...sandboxFlags, allowScripts: value },
									})
								}
							/>
							<ToggleControl
								label={__('Formulare erlauben', 'modular-blocks-plugin')}
								checked={sandboxFlags.allowForms}
								onChange={(value) =>
									setAttributes({
										sandboxFlags: { ...sandboxFlags, allowForms: value },
									})
								}
							/>
							<ToggleControl
								label={__('Modals erlauben', 'modular-blocks-plugin')}
								checked={sandboxFlags.allowModals}
								onChange={(value) =>
									setAttributes({
										sandboxFlags: { ...sandboxFlags, allowModals: value },
									})
								}
							/>
							<ToggleControl
								label={__('Popups erlauben', 'modular-blocks-plugin')}
								checked={sandboxFlags.allowPopups}
								onChange={(value) =>
									setAttributes({
										sandboxFlags: { ...sandboxFlags, allowPopups: value },
									})
								}
							/>
							<ToggleControl
								label={__('Same-Origin erlauben', 'modular-blocks-plugin')}
								checked={sandboxFlags.allowSameOrigin}
								onChange={(value) =>
									setAttributes({
										sandboxFlags: { ...sandboxFlags, allowSameOrigin: value },
									})
								}
								help={__('ACHTUNG: Ermöglicht Zugriff auf die Hauptseite!', 'modular-blocks-plugin')}
							/>
						</PanelBody>
					)}

					<PanelBody title={__('Größeneinstellungen', 'modular-blocks-plugin')}>
						<ToggleControl
							label={__('Automatische Höhenanpassung', 'modular-blocks-plugin')}
							checked={autoHeight}
							onChange={(value) => setAttributes({ autoHeight: value })}
						/>
						<RangeControl
							label={__('Minimale Höhe (px)', 'modular-blocks-plugin')}
							value={minHeight}
							onChange={(value) => setAttributes({ minHeight: value })}
							min={100}
							max={1000}
							step={50}
						/>
						<RangeControl
							label={__('Maximale Höhe (px)', 'modular-blocks-plugin')}
							value={maxHeight}
							onChange={(value) => setAttributes({ maxHeight: value })}
							min={200}
							max={2000}
							step={50}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="html-sandbox-controls">
						<TabPanel
							className="html-sandbox-tabs"
							activeClass="is-active"
							tabs={[
								{
									name: 'html',
									title: 'HTML',
									className: 'tab-html',
								},
								{
									name: 'css',
									title: 'CSS',
									className: 'tab-css',
								},
								{
									name: 'js',
									title: 'JavaScript',
									className: 'tab-js',
								},
								{
									name: 'external',
									title: 'Externe Scripts',
									className: 'tab-external',
								},
							]}
						>
							{(tab) => (
								<div className="html-sandbox-tab-content">
									{tab.name === 'html' && (
										<TextareaControl
											label={__('HTML-Code', 'modular-blocks-plugin')}
											value={htmlCode}
											onChange={(value) => setAttributes({ htmlCode: value })}
											rows={10}
											className="code-editor"
										/>
									)}
									{tab.name === 'css' && (
										<TextareaControl
											label={__('CSS-Code', 'modular-blocks-plugin')}
											value={cssCode}
											onChange={(value) => setAttributes({ cssCode: value })}
											rows={10}
											className="code-editor"
										/>
									)}
									{tab.name === 'js' && (
										<TextareaControl
											label={__('JavaScript-Code', 'modular-blocks-plugin')}
											value={jsCode}
											onChange={(value) => setAttributes({ jsCode: value })}
											rows={10}
											className="code-editor"
										/>
									)}
									{tab.name === 'external' && (
										<TextareaControl
											label={__('Externe Script-URLs', 'modular-blocks-plugin')}
											value={externalScripts}
											onChange={(value) => setAttributes({ externalScripts: value })}
											rows={5}
											help={__(
												'Eine URL pro Zeile (z.B. https://cdn.jsdelivr.net/npm/chart.js)',
												'modular-blocks-plugin'
											)}
											className="code-editor"
										/>
									)}
								</div>
							)}
						</TabPanel>
					</div>

					<div className="html-sandbox-preview">
						<div className="preview-label">
							{__('Vorschau', 'modular-blocks-plugin')} ({isolationMode})
						</div>
						{isolationMode === 'iframe' ? (
							<iframe
								ref={iframeRef}
								sandbox={buildSandboxAttribute()}
								style={{
									width: '100%',
									minHeight: `${minHeight}px`,
									height: autoHeight ? 'auto' : `${minHeight}px`,
									border: '1px solid #ddd',
									borderRadius: '4px',
								}}
								title={__('HTML Sandbox Vorschau', 'modular-blocks-plugin')}
							/>
						) : (
							<div className="shadow-dom-preview-note">
								<Notice status="info" isDismissible={false}>
									{__(
										'Shadow DOM Vorschau ist im Editor nicht verfügbar. Bitte auf der Frontend-Seite ansehen.',
										'modular-blocks-plugin'
									)}
								</Notice>
							</div>
						)}
					</div>
				</div>
			</>
		);
	},

	save: () => {
		// Dynamic block - rendered by view.js
		return null;
	},
});
