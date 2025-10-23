/**
 * Frontend script for Flip Card Block
 */

window.initFlipCard = function(element) {
	if (!element) return;

	const config = JSON.parse(element.dataset.flipConfig || '{}');
	const flipContainer = element.querySelector('.flip-card-container');

	if (!flipContainer) return;

	const flipTrigger = config.flipTrigger || 'click';
	const autoFlip = config.autoFlip || false;
	let flipTimeout = null;

	function flipCard() {
		flipContainer.classList.add('flipped');

		// Auto-flip back after 3 seconds if enabled
		if (autoFlip) {
			if (flipTimeout) clearTimeout(flipTimeout);
			flipTimeout = setTimeout(() => {
				flipContainer.classList.remove('flipped');
			}, 3000);
		}
	}

	function unflipCard() {
		flipContainer.classList.remove('flipped');
		if (flipTimeout) clearTimeout(flipTimeout);
	}

	// Click trigger
	if (flipTrigger === 'click') {
		flipContainer.addEventListener('click', function() {
			if (flipContainer.classList.contains('flipped')) {
				unflipCard();
			} else {
				flipCard();
			}
		});
	}

	// Hover trigger
	if (flipTrigger === 'hover') {
		flipContainer.addEventListener('mouseenter', flipCard);
		flipContainer.addEventListener('mouseleave', unflipCard);
	}
};

// Initialize all blocks on page load
document.addEventListener('DOMContentLoaded', function() {
	const blocks = document.querySelectorAll('.wp-block-modular-blocks-flip-card');
	blocks.forEach(block => {
		window.initFlipCard(block);
	});
});
