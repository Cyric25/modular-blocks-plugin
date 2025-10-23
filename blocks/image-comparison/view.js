/**
 * Frontend script for Image Comparison Block
 */

window.initImageComparison = function(element) {
	if (!element) return;

	const config = JSON.parse(element.dataset.comparisonConfig || '{}');
	const transitionMode = element.dataset.transitionMode || config.transitionMode || 'slide';

	// Handle Slide/Fade/Juxtaposition modes
	if (transitionMode === 'slide' || transitionMode === 'fade' || transitionMode === 'juxtaposition') {
		const wrapper = element.querySelector('.comparison-wrapper');
		const slider = element.querySelector('.comparison-slider');
		const afterImage = element.querySelector('.after-image');
		const beforeContainer = element.querySelector('.before-image-container');

		if (!wrapper || !slider) return;

		const orientation = config.orientation || 'horizontal';
		let isDragging = false;

		function updatePosition(position) {
			// Clamp position between 0 and 100
			position = Math.max(0, Math.min(100, position));

			if (orientation === 'horizontal') {
				slider.style.left = position + '%';

				if (transitionMode === 'slide') {
					// Slide mode: move image from left
					if (afterImage) {
						afterImage.style.left = (position - 100) + '%';
						afterImage.style.opacity = '1';
					}
				} else if (transitionMode === 'fade') {
					// Fade mode: change opacity
					if (afterImage) {
						afterImage.style.left = '0';
						afterImage.style.opacity = (position / 100);
					}
				} else if (transitionMode === 'juxtaposition') {
					// Juxtaposition mode: clip the before image
					if (beforeContainer) {
						beforeContainer.style.clipPath = 'inset(0 ' + (100 - position) + '% 0 0)';
						beforeContainer.style.webkitClipPath = 'inset(0 ' + (100 - position) + '% 0 0)';
					}
				}
			} else {
				slider.style.top = position + '%';

				if (transitionMode === 'slide') {
					if (afterImage) {
						afterImage.style.top = (position - 100) + '%';
						afterImage.style.opacity = '1';
					}
				} else if (transitionMode === 'fade') {
					if (afterImage) {
						afterImage.style.top = '0';
						afterImage.style.opacity = (position / 100);
					}
				} else if (transitionMode === 'juxtaposition') {
					if (beforeContainer) {
						beforeContainer.style.clipPath = 'inset(0 0 ' + (100 - position) + '% 0)';
						beforeContainer.style.webkitClipPath = 'inset(0 0 ' + (100 - position) + '% 0)';
					}
				}
			}
		}

		function getPositionFromEvent(e) {
			const rect = wrapper.getBoundingClientRect();
			let position;

			if (orientation === 'horizontal') {
				const x = (e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - rect.left;
				position = (x / rect.width) * 100;
			} else {
				const y = (e.type.includes('touch') ? e.touches[0].clientY : e.clientY) - rect.top;
				position = (y / rect.height) * 100;
			}

			return position;
		}

		function onStart(e) {
			isDragging = true;
			updatePosition(getPositionFromEvent(e));
			e.preventDefault();
		}

		function onMove(e) {
			if (!isDragging) return;
			updatePosition(getPositionFromEvent(e));
			e.preventDefault();
		}

		function onEnd() {
			isDragging = false;
		}

		// Mouse events
		slider.addEventListener('mousedown', onStart);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onEnd);

		// Touch events
		slider.addEventListener('touchstart', onStart, { passive: false });
		document.addEventListener('touchmove', onMove, { passive: false });
		document.addEventListener('touchend', onEnd);

		// Cleanup on element removal
		element._cleanupImageComparison = function() {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onEnd);
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onEnd);
		};
	}
};

// Initialize all blocks on page load
document.addEventListener('DOMContentLoaded', function() {
	const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-comparison');
	blocks.forEach(block => {
		window.initImageComparison(block);
	});
});
