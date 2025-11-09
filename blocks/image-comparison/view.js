/**
 * Frontend JavaScript for Image Comparison Block
 *
 * Provides interactive functionality for comparing two images with a slider
 * Supports both horizontal and vertical orientations, touch events, and keyboard navigation
 */

(function() {
    'use strict';

    /**
     * Initialize image comparison functionality
     * @param {HTMLElement} element - The comparison block element
     */
    function initImageComparison(element) {
        if (!element) return;

        const container = element.querySelector('.image-comparison-container');
        const afterImage = element.querySelector('.image-comparison-after');
        const slider = element.querySelector('.image-comparison-slider');
        const sliderButton = element.querySelector('.slider-button');

        if (!container || !afterImage || !slider || !sliderButton) return;

        const isVertical = element.classList.contains('orientation-vertical');
        let isMouseDown = false;
        let startPos = 0;

        /**
         * Update slider position and image clipping
         * @param {number} position - Position percentage (0-100)
         */
        function updateSlider(position) {
            // Clamp position between 0 and 100
            position = Math.max(0, Math.min(100, position));

            // Update CSS custom property
            element.style.setProperty('--starting-position', position + '%');

            // Update slider position
            if (isVertical) {
                slider.style.top = position + '%';
                afterImage.style.clipPath = `polygon(0% ${position}%, 100% ${position}%, 100% 100%, 0% 100%)`;
            } else {
                slider.style.left = position + '%';
                afterImage.style.clipPath = `polygon(${position}% 0%, 100% 0%, 100% 100%, ${position}% 100%)`;
            }
        }

        /**
         * Get position from mouse/touch event
         * @param {Event} event - Mouse or touch event
         * @returns {number} Position percentage
         */
        function getPositionFromEvent(event) {
            const rect = container.getBoundingClientRect();
            let clientPos, containerSize, offsetPos;

            if (isVertical) {
                clientPos = event.clientY || (event.touches && event.touches[0].clientY);
                containerSize = rect.height;
                offsetPos = clientPos - rect.top;
            } else {
                clientPos = event.clientX || (event.touches && event.touches[0].clientX);
                containerSize = rect.width;
                offsetPos = clientPos - rect.left;
            }

            return (offsetPos / containerSize) * 100;
        }

        /**
         * Handle start of interaction (mouse down, touch start)
         * @param {Event} event - Event object
         */
        function handleStart(event) {
            event.preventDefault();
            isMouseDown = true;
            startPos = getPositionFromEvent(event);

            container.classList.add('is-dragging');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isVertical ? 'ns-resize' : 'ew-resize';

            // Add global listeners
            document.addEventListener('mousemove', handleMove, { passive: false });
            document.addEventListener('mouseup', handleEnd, { passive: false });
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd, { passive: false });
        }

        /**
         * Handle move during interaction
         * @param {Event} event - Event object
         */
        function handleMove(event) {
            if (!isMouseDown) return;

            event.preventDefault();
            const position = getPositionFromEvent(event);
            updateSlider(position);
        }

        /**
         * Handle end of interaction
         * @param {Event} event - Event object
         */
        function handleEnd(event) {
            if (!isMouseDown) return;

            isMouseDown = false;
            container.classList.remove('is-dragging');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';

            // Remove global listeners
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        }

        /**
         * Handle keyboard navigation
         * @param {KeyboardEvent} event - Keyboard event
         */
        function handleKeyDown(event) {
            const currentPosition = parseFloat(getComputedStyle(element).getPropertyValue('--starting-position')) || 50;
            let newPosition = currentPosition;
            const step = 2; // 2% steps

            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    newPosition = currentPosition - step;
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    newPosition = currentPosition + step;
                    break;
                case 'Home':
                    newPosition = 0;
                    break;
                case 'End':
                    newPosition = 100;
                    break;
                default:
                    return; // Don't prevent default for other keys
            }

            event.preventDefault();
            updateSlider(newPosition);
        }

        // Mouse events
        container.addEventListener('mousedown', handleStart);
        sliderButton.addEventListener('mousedown', handleStart);

        // Touch events
        container.addEventListener('touchstart', handleStart, { passive: false });
        sliderButton.addEventListener('touchstart', handleStart, { passive: false });

        // Click events (for direct positioning)
        container.addEventListener('click', function(event) {
            if (event.target === sliderButton || sliderButton.contains(event.target)) return;

            const position = getPositionFromEvent(event);
            updateSlider(position);
        });

        // Keyboard events (make slider button focusable and handle keyboard)
        sliderButton.setAttribute('tabindex', '0');
        sliderButton.setAttribute('role', 'slider');
        sliderButton.setAttribute('aria-orientation', isVertical ? 'vertical' : 'horizontal');
        sliderButton.setAttribute('aria-valuemin', '0');
        sliderButton.setAttribute('aria-valuemax', '100');

        // Update aria-valuenow when position changes
        function updateAriaValue() {
            const currentPosition = Math.round(parseFloat(getComputedStyle(element).getPropertyValue('--starting-position')) || 50);
            sliderButton.setAttribute('aria-valuenow', currentPosition);
        }

        updateAriaValue();
        sliderButton.addEventListener('keydown', handleKeyDown);

        // Disable context menu on images to prevent interference
        const images = element.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('contextmenu', event => event.preventDefault());
            img.addEventListener('dragstart', event => event.preventDefault());
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Force update to recalculate positions
                const currentPosition = parseFloat(getComputedStyle(element).getPropertyValue('--starting-position')) || 50;
                updateSlider(currentPosition);
            }, 100);
        });

        // Initialize with current position
        const initialPosition = parseFloat(getComputedStyle(element).getPropertyValue('--starting-position')) || 50;
        updateSlider(initialPosition);
    }

    /**
     * Initialize all image comparison blocks on the page
     */
    function initAllImageComparisons() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-comparison');
        blocks.forEach(initImageComparison);
    }

    // Make function globally available for dynamic content
    window.initImageComparison = initImageComparison;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllImageComparisons);
    } else {
        initAllImageComparisons();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllImageComparisons);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a comparison block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-image-comparison')) {
                                initImageComparison(node);
                            }
                            // Check if the added node contains comparison blocks
                            const comparisonBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-image-comparison');
                            if (comparisonBlocks) {
                                comparisonBlocks.forEach(initImageComparison);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

})();