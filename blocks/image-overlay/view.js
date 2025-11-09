/**
 * Frontend JavaScript for Image Overlay Block
 *
 * Provides simple interactive layer switching functionality
 * Click buttons to toggle overlay layers on/off - perfect for educational content
 */

(function() {
    'use strict';

    /**
     * Initialize image overlay functionality
     * @param {HTMLElement} element - The overlay block element
     */
    function initImageOverlay(element) {
        if (!element) return;

        const overlayData = JSON.parse(element.dataset.overlay || '{}');
        const container = element.querySelector('.image-overlay-container');
        const layerButtons = element.querySelectorAll('.layer-button');
        const overlayLayers = element.querySelectorAll('.overlay-layer');
        const showAllButton = element.querySelector('.show-all');
        const hideAllButton = element.querySelector('.hide-all');
        const layerInfo = element.querySelector('.layer-info');
        const infoTitle = element.querySelector('.info-title');
        const infoDescription = element.querySelector('.info-description');

        if (!container || layerButtons.length === 0) return;

        const layers = overlayData.layers || [];
        const allowMultiple = overlayData.allowMultipleVisible !== false;
        const transitionDuration = overlayData.transitionDuration || 300;

        /**
         * Update layer visibility based on current state
         * @param {number} layerIndex - Index of the layer to toggle
         * @param {boolean} forceState - Optional forced visibility state
         */
        function toggleLayer(layerIndex, forceState) {
            if (layerIndex < 0 || layerIndex >= layers.length) return;

            const button = layerButtons[layerIndex];
            const layer = overlayLayers[layerIndex];
            const layerData = layers[layerIndex];

            if (!button || !layer || !layerData) return;

            const isCurrentlyVisible = button.classList.contains('active');
            const shouldBeVisible = forceState !== undefined ? forceState : !isCurrentlyVisible;

            // Handle single visibility mode
            if (!allowMultiple && shouldBeVisible) {
                // Hide all other layers first
                layerButtons.forEach((btn, index) => {
                    if (index !== layerIndex) {
                        hideLayer(index);
                    }
                });
            }

            // Update the target layer
            if (shouldBeVisible) {
                showLayer(layerIndex);
            } else {
                hideLayer(layerIndex);
            }

            // Update info panel if descriptions are enabled
            updateInfoPanel(shouldBeVisible ? layerIndex : -1);
        }

        /**
         * Show a specific layer
         * @param {number} layerIndex - Index of layer to show
         */
        function showLayer(layerIndex) {
            const button = layerButtons[layerIndex];
            const layer = overlayLayers[layerIndex];
            const layerData = layers[layerIndex];

            if (!button || !layer || !layerData) return;

            // Update button state
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            button.title = overlayData.strings.hideLayer + ': ' + layerData.label;

            // Update layer visibility with opacity
            layer.classList.remove('hidden');
            layer.classList.add('visible');

            const targetOpacity = (layerData.opacity || 100) / 100;
            layer.style.opacity = targetOpacity;

            // Add visual feedback
            button.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                if (button.classList.contains('active')) {
                    button.style.transform = '';
                }
            }, 150);
        }

        /**
         * Hide a specific layer
         * @param {number} layerIndex - Index of layer to hide
         */
        function hideLayer(layerIndex) {
            const button = layerButtons[layerIndex];
            const layer = overlayLayers[layerIndex];
            const layerData = layers[layerIndex];

            if (!button || !layer || !layerData) return;

            // Update button state
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
            button.title = overlayData.strings.showLayer + ': ' + layerData.label;

            // Update layer visibility
            layer.classList.remove('visible');
            layer.classList.add('hidden');
            layer.style.opacity = '0';
        }

        /**
         * Show all layers
         */
        function showAllLayers() {
            layerButtons.forEach((button, index) => {
                showLayer(index);
            });
        }

        /**
         * Hide all layers
         */
        function hideAllLayers() {
            layerButtons.forEach((button, index) => {
                hideLayer(index);
            });
            updateInfoPanel(-1);
        }

        /**
         * Update info panel with layer information
         * @param {number} layerIndex - Index of active layer, -1 to hide
         */
        function updateInfoPanel(layerIndex) {
            if (!layerInfo || !overlayData.showDescriptions) return;

            if (layerIndex >= 0 && layerIndex < layers.length) {
                const layerData = layers[layerIndex];
                if (infoTitle) infoTitle.textContent = layerData.label || '';
                if (infoDescription) infoDescription.textContent = layerData.description || '';

                layerInfo.style.display = 'block';
                layerInfo.classList.add('active');
            } else {
                layerInfo.style.display = 'none';
                layerInfo.classList.remove('active');
            }
        }

        /**
         * Handle keyboard navigation
         * @param {KeyboardEvent} event - Keyboard event
         */
        function handleKeyDown(event) {
            const activeElement = document.activeElement;
            const currentIndex = Array.from(layerButtons).indexOf(activeElement);

            if (currentIndex === -1) return;

            let newIndex = currentIndex;

            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    newIndex = currentIndex > 0 ? currentIndex - 1 : layerButtons.length - 1;
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    newIndex = currentIndex < layerButtons.length - 1 ? currentIndex + 1 : 0;
                    break;
                case 'Home':
                    newIndex = 0;
                    break;
                case 'End':
                    newIndex = layerButtons.length - 1;
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    toggleLayer(currentIndex);
                    return;
                default:
                    return; // Don't prevent default for other keys
            }

            event.preventDefault();
            if (layerButtons[newIndex]) {
                layerButtons[newIndex].focus();
            }
        }

        /**
         * Handle button click to update info panel
         * @param {number} layerIndex - Index of clicked layer
         */
        function handleButtonClick(layerIndex) {
            if (!overlayData.showDescriptions || !layerInfo) return;

            // Update info panel to show clicked layer's info
            const layerData = layers[layerIndex];
            const button = layerButtons[layerIndex];

            if (button && button.classList.contains('active')) {
                if (infoTitle) infoTitle.textContent = layerData.label || '';
                if (infoDescription) infoDescription.textContent = layerData.description || '';
                layerInfo.style.display = 'block';
                layerInfo.classList.add('active');
            }
        }

        /**
         * Initialize layer states from attributes
         */
        function initializeLayerStates() {
            layers.forEach((layerData, index) => {
                if (layerData.visible) {
                    showLayer(index);
                } else {
                    hideLayer(index);
                }

                // Set custom color if defined
                if (layerData.color && layerButtons[index]) {
                    layerButtons[index].style.setProperty('--layer-color', layerData.color);
                }
            });
        }

        // Event listeners
        layerButtons.forEach((button, index) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                toggleLayer(index);
                handleButtonClick(index);
            });

            button.addEventListener('keydown', handleKeyDown);

            // Make buttons focusable
            button.setAttribute('tabindex', '0');
            button.setAttribute('role', 'switch');
        });

        // Global control buttons
        if (showAllButton) {
            showAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                showAllLayers();
            });
        }

        if (hideAllButton) {
            hideAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                hideAllLayers();
            });
        }

        // Initialize
        initializeLayerStates();

        // Set initial info panel state
        const initialActiveIndex = Array.from(layerButtons).findIndex(btn => btn.classList.contains('active'));
        if (initialActiveIndex >= 0) {
            updateInfoPanel(initialActiveIndex);
        }
    }

    /**
     * Initialize all image overlay blocks on the page
     */
    function initAllImageOverlays() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-overlay');
        blocks.forEach(initImageOverlay);
    }

    // Make function globally available for dynamic content
    window.initImageOverlay = initImageOverlay;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllImageOverlays);
    } else {
        initAllImageOverlays();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllImageOverlays);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is an overlay block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-image-overlay')) {
                                initImageOverlay(node);
                            }
                            // Check if the added node contains overlay blocks
                            const overlayBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-image-overlay');
                            if (overlayBlocks) {
                                overlayBlocks.forEach(initImageOverlay);
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