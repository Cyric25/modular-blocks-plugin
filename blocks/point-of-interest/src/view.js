/**
 * Point of Interest Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initPointOfInterest = function(blockElement) {
		if (!blockElement) return;

		const hotspots = blockElement.querySelectorAll('.hotspot');
		const infoBox = blockElement.querySelector('.poi-info-box');
		const infoTitle = blockElement.querySelector('.poi-info-title');
		const infoContent = blockElement.querySelector('.poi-info-content');
		const closeButton = blockElement.querySelector('.poi-info-close');

		let activeHotspot = null;

		// Setup each hotspot
		hotspots.forEach((hotspot) => {
			hotspot.addEventListener('click', (e) => {
				e.stopPropagation();
				showInfo(hotspot);
			});
		});

		// Close button
		if (closeButton) {
			closeButton.addEventListener('click', () => {
				hideInfo();
			});
		}

		// Close on outside click
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.hotspot') && !e.target.closest('.poi-info-box')) {
				hideInfo();
			}
		});

		function showInfo(hotspot) {
			const title = hotspot.getAttribute('data-hotspot-title');
			const content = hotspot.getAttribute('data-hotspot-content');

			// Mark active hotspot
			if (activeHotspot) {
				activeHotspot.classList.remove('active');
			}
			hotspot.classList.add('active');
			activeHotspot = hotspot;

			// Update info box
			if (infoTitle) infoTitle.textContent = title;
			if (infoContent) infoContent.innerHTML = content;

			// Show info box
			if (infoBox) {
				infoBox.style.display = 'block';
			}
		}

		function hideInfo() {
			if (infoBox) {
				infoBox.style.display = 'none';
			}
			if (activeHotspot) {
				activeHotspot.classList.remove('active');
				activeHotspot = null;
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
