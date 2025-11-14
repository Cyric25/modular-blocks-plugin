/**
 * HTML Sandbox Block - Frontend Script
 * Handles both iframe and Shadow DOM rendering
 */

(function () {
	'use strict';

	/**
	 * Initialize all HTML Sandbox blocks on the page
	 */
	function initHtmlSandbox() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-html-sandbox');

		blocks.forEach((block) => {
			const container = block.querySelector('.html-sandbox-container');
			if (!container) return;

			// Check if already initialized
			if (container.dataset.initialized) return;
			container.dataset.initialized = 'true';

			const mode = block.dataset.mode || 'iframe';

			if (mode === 'iframe') {
				initIframeMode(block);
			} else if (mode === 'shadow-dom') {
				initShadowDomMode(block);
			}
		});
	}

	/**
	 * Initialize iframe-based sandbox
	 */
	function initIframeMode(block) {
		const container = block.querySelector('.html-sandbox-container');
		if (!container) return;

		const htmlCode = container.dataset.html || '';
		const cssCode = container.dataset.css || '';
		const jsCode = container.dataset.js || '';
		const externalScripts = container.dataset.externalScripts || '';
		const sandboxAttr = container.dataset.sandbox || '';
		const autoHeight = container.dataset.autoHeight === 'true';
		const minHeight = parseInt(container.dataset.minHeight) || 200;
		const maxHeight = parseInt(container.dataset.maxHeight) || 800;

		// Create iframe element
		const iframe = document.createElement('iframe');
		iframe.setAttribute('sandbox', sandboxAttr);
		iframe.style.width = '100%';
		iframe.style.border = 'none';
		iframe.style.display = 'block';
		iframe.style.minHeight = minHeight + 'px';

		if (!autoHeight) {
			iframe.style.height = minHeight + 'px';
		}

		container.appendChild(iframe);

		// Build external scripts HTML
		const externalScriptsArray = externalScripts
			.split('\n')
			.filter((url) => url.trim())
			.map((url) => `<script src="${escapeHtml(url.trim())}"></script>`)
			.join('\n');

		// Build complete HTML document
		const fullHTML = `
<!DOCTYPE html>
<html lang="de">
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

		// Try to write content to iframe
		// This may fail if sandbox doesn't have allow-same-origin
		try {
			const doc = iframe.contentDocument || iframe.contentWindow.document;
			doc.open();
			doc.write(fullHTML);
			doc.close();

			// Auto-height adjustment (only works with allow-same-origin)
			if (autoHeight) {
				const adjustHeight = () => {
					try {
						const body = iframe.contentDocument.body;
						const html = iframe.contentDocument.documentElement;
						const height = Math.max(
							body.scrollHeight,
							body.offsetHeight,
							html.clientHeight,
							html.scrollHeight,
							html.offsetHeight
						);
						const adjustedHeight = Math.min(Math.max(height, minHeight), maxHeight);
						iframe.style.height = adjustedHeight + 'px';
					} catch (e) {
						// Can't access iframe content - use min height
						iframe.style.height = minHeight + 'px';
					}
				};

				// Adjust height after load
				iframe.addEventListener('load', () => {
					setTimeout(adjustHeight, 100);
					setTimeout(adjustHeight, 500); // Retry for slow-loading content
				});

				// Watch for content changes
				try {
					const observer = new MutationObserver(adjustHeight);
					iframe.contentDocument.addEventListener('DOMContentLoaded', () => {
						observer.observe(iframe.contentDocument.body, {
							childList: true,
							subtree: true,
							attributes: true,
						});
					});
				} catch (e) {
					// Cross-origin restrictions prevent observation
				}
			}
		} catch (error) {
			// If we can't access contentDocument, use srcdoc instead
			console.warn('HTML Sandbox: Cannot access iframe content. Using srcdoc fallback.', error);
			iframe.setAttribute('srcdoc', fullHTML);
			// Set static height since we can't measure content
			iframe.style.height = (autoHeight ? maxHeight : minHeight) + 'px';
		}
	}

	/**
	 * Initialize Shadow DOM-based sandbox
	 */
	function initShadowDomMode(block) {
		const container = block.querySelector('.html-sandbox-container');
		if (!container) return;

		const htmlCode = container.dataset.html || '';
		const cssCode = container.dataset.css || '';
		const jsCode = container.dataset.js || '';
		const externalScripts = container.dataset.externalScripts || '';

		// Create shadow root
		const shadowHost = document.createElement('div');
		shadowHost.className = 'shadow-host';
		container.appendChild(shadowHost);

		const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

		// Create style element
		const style = document.createElement('style');
		style.textContent = cssCode;
		shadowRoot.appendChild(style);

		// Create content container
		const contentDiv = document.createElement('div');
		contentDiv.innerHTML = htmlCode;
		shadowRoot.appendChild(contentDiv);

		// Load external scripts
		const externalScriptsArray = externalScripts.split('\n').filter((url) => url.trim());

		const loadScriptsSequentially = async () => {
			for (const url of externalScriptsArray) {
				await loadScript(url.trim());
			}
			// Execute inline JavaScript after external scripts are loaded
			executeInlineScript(jsCode, shadowRoot);
		};

		if (externalScriptsArray.length > 0) {
			loadScriptsSequentially();
		} else {
			executeInlineScript(jsCode, shadowRoot);
		}
	}

	/**
	 * Load external script
	 */
	function loadScript(url) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = url;
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	/**
	 * Execute inline JavaScript in Shadow DOM context
	 */
	function executeInlineScript(code, shadowRoot) {
		if (!code.trim()) return;

		try {
			// Create a function to execute the code with shadowRoot context
			const func = new Function('shadowRoot', code);
			func(shadowRoot);
		} catch (e) {
			console.error('HTML Sandbox: Error executing inline script', e);
		}
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	// Initialize on DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initHtmlSandbox);
	} else {
		initHtmlSandbox();
	}

	// Re-initialize on dynamic content load (for AJAX-loaded content)
	if (typeof MutationObserver !== 'undefined') {
		const observer = new MutationObserver((mutations) => {
			let shouldInit = false;
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (
						node.nodeType === 1 &&
						(node.classList?.contains('wp-block-modular-blocks-html-sandbox') ||
							node.querySelector?.('.wp-block-modular-blocks-html-sandbox'))
					) {
						shouldInit = true;
					}
				});
			});
			if (shouldInit) {
				initHtmlSandbox();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}
})();
