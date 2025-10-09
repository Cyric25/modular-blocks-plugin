/**
 * Point of Interest Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initPointOfInterest = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-poi-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const hotspots = blockElement.querySelectorAll('.hotspot');
		const imageContainer = blockElement.querySelector('.poi-image-container');

		let activePopup = null;

		// Setup each hotspot
		hotspots.forEach((hotspot, index) => {
			const popup = hotspot.querySelector('.hotspot-popup');
			const closeButton = popup.querySelector('.popup-close');
			const trigger = config.hotspots[index]?.trigger || 'click';

			// Setup trigger event
			if (trigger === 'click') {
				hotspot.addEventListener('click', (e) => {
					e.stopPropagation();
					togglePopup(hotspot, popup);
				});
			} else if (trigger === 'hover') {
				hotspot.addEventListener('mouseenter', () => {
					showPopup(hotspot, popup);
				});
				hotspot.addEventListener('mouseleave', () => {
					if (config.autoClose) {
						hidePopup(popup);
					}
				});
			}

			// Close button
			if (closeButton) {
				closeButton.addEventListener('click', (e) => {
					e.stopPropagation();
					hidePopup(popup);
				});
			}
		});

		// Close on outside click
		if (config.closeOnOutsideClick) {
			document.addEventListener('click', (e) => {
				if (!e.target.closest('.hotspot') && activePopup) {
					hidePopup(activePopup);
				}
			});
		}

		// Zoom functionality
		if (config.enableZoom) {
			const image = imageContainer.querySelector('.poi-background');
			if (image) {
				let isZoomed = false;

				image.addEventListener('click', () => {
					isZoomed = !isZoomed;
					if (isZoomed) {
						image.style.transform = `scale(${config.zoomLevel / 100})`;
						image.style.cursor = 'zoom-out';
					} else {
						image.style.transform = 'scale(1)';
						image.style.cursor = 'zoom-in';
					}
				});

				image.style.cursor = 'zoom-in';
				image.style.transition = 'transform 0.3s ease';
			}
		}

		function togglePopup(hotspot, popup) {
			const isVisible = popup.style.display !== 'none';

			if (isVisible) {
				hidePopup(popup);
			} else {
				// Close other popups if autoClose is enabled
				if (config.autoClose && activePopup && activePopup !== popup) {
					hidePopup(activePopup);
				}
				showPopup(hotspot, popup);
			}
		}

		function showPopup(hotspot, popup) {
			popup.style.display = 'block';
			activePopup = popup;

			// Position popup
			positionPopup(hotspot, popup);
		}

		function hidePopup(popup) {
			popup.style.display = 'none';
			if (activePopup === popup) {
				activePopup = null;
			}
		}

		function positionPopup(hotspot, popup) {
			const hotspotRect = hotspot.getBoundingClientRect();
			const containerRect = imageContainer.getBoundingClientRect();
			const popupRect = popup.getBoundingClientRect();

			const position = config.popupPosition;

			// Auto positioning - find best position
			if (position === 'auto') {
				const spaceRight = containerRect.right - hotspotRect.right;
				const spaceLeft = hotspotRect.left - containerRect.left;
				const spaceBottom = containerRect.bottom - hotspotRect.bottom;
				const spaceTop = hotspotRect.top - containerRect.top;

				if (spaceRight >= popupRect.width) {
					popup.style.left = '100%';
					popup.style.right = 'auto';
					popup.style.top = '50%';
					popup.style.transform = 'translateY(-50%)';
				} else if (spaceLeft >= popupRect.width) {
					popup.style.right = '100%';
					popup.style.left = 'auto';
					popup.style.top = '50%';
					popup.style.transform = 'translateY(-50%)';
				} else if (spaceBottom >= popupRect.height) {
					popup.style.top = '100%';
					popup.style.left = '50%';
					popup.style.transform = 'translateX(-50%)';
				} else {
					popup.style.bottom = '100%';
					popup.style.left = '50%';
					popup.style.transform = 'translateX(-50%)';
				}
			}
		}
	};

	// Initialize all point-of-interest blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-point-of-interest');
		blocks.forEach(block => {
			window.initPointOfInterest(block);
		});
	});
})();
