/**
 * Image Overlay Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initImageOverlay = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-overlay-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const layerToggles = blockElement.querySelectorAll('.layer-toggle');
		const overlayLayers = blockElement.querySelectorAll('.overlay-layer');

		// Setup toggle buttons
		layerToggles.forEach((toggle, index) => {
			toggle.addEventListener('click', function() {
				toggleLayer(index);
			});
		});

		function toggleLayer(layerIndex) {
			const layer = overlayLayers[layerIndex];
			const toggle = layerToggles[layerIndex];

			if (!layer || !toggle) return;

			if (!config.allowMultipleVisible) {
				// Hide all other layers
				overlayLayers.forEach((otherLayer, idx) => {
					if (idx !== layerIndex) {
						otherLayer.classList.remove('visible');
						layerToggles[idx].classList.remove('active');
					}
				});
			}

			// Toggle current layer
			const isVisible = layer.classList.contains('visible');

			if (isVisible) {
				layer.classList.remove('visible');
				toggle.classList.remove('active');
			} else {
				layer.classList.add('visible');
				toggle.classList.add('active');
			}

			// Apply transition
			layer.style.transition = `opacity ${config.transitionDuration}ms`;
		}
	};

	// Initialize all image-overlay blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-overlay');
		blocks.forEach(block => {
			window.initImageOverlay(block);
		});
	});
})();
