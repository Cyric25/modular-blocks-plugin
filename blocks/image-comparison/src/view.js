/**
 * Image Comparison Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initImageComparison = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-comparison-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const transitionMode = config.transitionMode || 'slide';

		// Juxtaposition mode: replace HTML with img-comparison-slider Web Component
		if (transitionMode === 'juxtaposition') {
			console.log('Juxtaposition mode: Converting to img-comparison-slider Web Component');
			initJuxtaposition(blockElement, config);
			return;
		}

		const wrapper = blockElement.querySelector('.comparison-wrapper');
		const slider = blockElement.querySelector('.comparison-slider');
		const beforeImage = blockElement.querySelector('.before-image');
		const afterImage = blockElement.querySelector('.after-image');
		const afterContainer = blockElement.querySelector('.after-image-container');
		const sliderHandle = blockElement.querySelector('.slider-handle');

		if (!wrapper || !slider || !beforeImage || !afterImage || !afterContainer) {
			console.error('Missing required elements');
			return;
		}

		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let startPosition = config.startingPosition;
		const isHorizontal = config.orientation === 'horizontal';

		// Initialize
		updatePosition(config.startingPosition);

		// Mouse events - entire wrapper is draggable
		wrapper.addEventListener('mousedown', startDrag);
		document.addEventListener('mousemove', onDrag);
		document.addEventListener('mouseup', stopDrag);

		// Touch events for mobile - entire wrapper is touchable
		wrapper.addEventListener('touchstart', startDrag);
		document.addEventListener('touchmove', onDrag);
		document.addEventListener('touchend', stopDrag);

		// Keyboard support
		slider.setAttribute('tabindex', '0');
		slider.addEventListener('keydown', handleKeyboard);

		// Hover animation
		if (config.hoverAnimation && sliderHandle) {
			sliderHandle.classList.add('hover-animation');
		}

		function startDrag(e) {
			isDragging = true;
			slider.classList.add('dragging');

			// Remember start position
			if (e.type.startsWith('touch')) {
				const touch = e.touches[0];
				startX = touch.clientX;
				startY = touch.clientY;
			} else {
				startX = e.clientX;
				startY = e.clientY;
			}

			// Get current slider position
			startPosition = parseFloat(slider.style[isHorizontal ? 'left' : 'top']) || config.startingPosition;

			e.preventDefault();
		}

		function stopDrag() {
			isDragging = false;
			slider.classList.remove('dragging');
		}

		function onDrag(e) {
			if (!isDragging) return;

			const rect = wrapper.getBoundingClientRect();
			let currentX, currentY;

			if (e.type.startsWith('touch')) {
				const touch = e.touches[0];
				currentX = touch.clientX;
				currentY = touch.clientY;
			} else {
				currentX = e.clientX;
				currentY = e.clientY;
			}

			// Calculate delta from start position
			let delta;
			if (isHorizontal) {
				delta = ((currentX - startX) / rect.width) * 100;
			} else {
				delta = ((currentY - startY) / rect.height) * 100;
			}

			// New position = start position + delta
			let position = startPosition + delta;

			// Clamp position between 0 and 100
			position = Math.max(0, Math.min(100, position));
			updatePosition(position);
		}

		function handleKeyboard(e) {
			let currentPosition = parseFloat(slider.style[isHorizontal ? 'left' : 'top']);
			let newPosition = currentPosition;

			switch(e.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
					newPosition = currentPosition - 1;
					e.preventDefault();
					break;
				case 'ArrowRight':
				case 'ArrowDown':
					newPosition = currentPosition + 1;
					e.preventDefault();
					break;
				case 'Home':
					newPosition = 0;
					e.preventDefault();
					break;
				case 'End':
					newPosition = 100;
					e.preventDefault();
					break;
			}

			newPosition = Math.max(0, Math.min(100, newPosition));
			updatePosition(newPosition);
		}

		function updatePosition(position) {
			if (!afterImage || !afterContainer) return;

			if (transitionMode === 'fade') {
				// Fade mode: image is always at position 0, only opacity changes
				// Update progress bar using CSS variable
				slider.style.setProperty('--progress', position + '%');
				afterImage.style.left = '0%';
				afterImage.style.top = '0%';
				afterImage.style.opacity = position / 100;
			} else {
				// Slide mode: image slides in from left/top
				if (isHorizontal) {
					slider.style.left = position + '%';
					// Move after-image from left: -100% (fully hidden) to 0% (fully visible)
					// When position is 0%, image is at left: -100% (hidden)
					// When position is 100%, image is at left: 0% (fully visible)
					const imagePosition = position - 100;
					afterImage.style.left = imagePosition + '%';
					afterImage.style.opacity = 1;
				} else {
					slider.style.top = position + '%';
					// Move after-image from top: -100% (fully hidden) to 0% (fully visible)
					const imagePosition = position - 100;
					afterImage.style.top = imagePosition + '%';
					afterImage.style.opacity = 1;
				}
			}
		}
	};

	function initJuxtaposition(blockElement, config) {
		// Load img-comparison-slider library if not already loaded
		if (!window.customElements || !window.customElements.get('img-comparison-slider')) {
			// Load CSS
			if (!document.querySelector('link[href*="img-comparison-slider"]')) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = 'https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/styles.css';
				document.head.appendChild(link);
			}

			// Load JS
			if (!document.querySelector('script[src*="img-comparison-slider"]')) {
				const script = document.createElement('script');
				script.defer = true;
				script.src = 'https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/index.js';
				document.head.appendChild(script);

				// Wait for script to load
				script.onload = function() {
					replaceWithWebComponent(blockElement, config);
				};
				return;
			}
		}

		// Library already loaded
		replaceWithWebComponent(blockElement, config);
	}

	function replaceWithWebComponent(blockElement, config) {
		const container = blockElement.querySelector('.image-comparison-container');
		if (!container) return;

		const beforeImage = blockElement.querySelector('.before-image');
		const afterImage = blockElement.querySelector('.after-image');

		if (!beforeImage || !afterImage) return;

		// Create img-comparison-slider element
		const slider = document.createElement('img-comparison-slider');
		slider.setAttribute('value', config.startingPosition);
		if (config.orientation === 'vertical') {
			slider.setAttribute('direction', 'vertical');
		}

		// Create images with slots
		const firstImg = document.createElement('img');
		firstImg.slot = 'first';
		firstImg.src = afterImage.src;
		firstImg.alt = afterImage.alt;
		firstImg.style.width = '100%';
		firstImg.style.display = 'block';

		const secondImg = document.createElement('img');
		secondImg.slot = 'second';
		secondImg.src = beforeImage.src;
		secondImg.alt = beforeImage.alt;
		secondImg.style.width = '100%';
		secondImg.style.display = 'block';

		slider.appendChild(firstImg);
		slider.appendChild(secondImg);

		// Add labels if enabled
		if (config.showLabels) {
			const firstLabel = document.createElement('div');
			firstLabel.slot = 'first-overlay-end';
			firstLabel.className = 'jux-label';
			firstLabel.textContent = config.afterLabel;

			const secondLabel = document.createElement('div');
			secondLabel.slot = 'second-overlay-end';
			secondLabel.className = 'jux-label';
			secondLabel.textContent = config.beforeLabel;

			slider.appendChild(firstLabel);
			slider.appendChild(secondLabel);
		}

		// Replace container content
		container.innerHTML = '';
		container.appendChild(slider);

		console.log('Juxtaposition mode: Web Component initialized');
	}

	// Initialize all image-comparison blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-comparison');
		blocks.forEach(block => {
			window.initImageComparison(block);
		});
	});
})();
