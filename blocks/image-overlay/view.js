/**
 * Frontend JavaScript for Image Overlay Block
 *
 * Provides interactive layer switching functionality with two modes:
 * - overlay: Multiple layers can be visible simultaneously (for transparencies)
 * - toggle: Only one layer visible at a time (image switcher)
 */

(function() {
    'use strict';

    /**
     * Initialize image overlay functionality
     * @param {HTMLElement} element - The overlay block element
     */
    function initImageOverlay(element) {
        if (!element) return;

        // Parse configuration data
        const overlayData = JSON.parse(element.dataset.overlay || '{}');

        // Get DOM elements
        const container = element.querySelector('.image-overlay-container');
        const layerButtons = element.querySelectorAll('.layer-button');
        const overlayLayers = element.querySelectorAll('.overlay-layer');
        const showAllButton = element.querySelector('.show-all');
        const hideAllButton = element.querySelector('.hide-all');
        const layerInfo = element.querySelector('.layer-info');
        const infoTitle = element.querySelector('.info-title');
        const infoDescription = element.querySelector('.info-description');

        // Validate required elements
        if (!container || layerButtons.length === 0 || overlayLayers.length === 0) {
            console.warn('Image Overlay: Missing required elements', {
                container: !!container,
                buttons: layerButtons.length,
                layers: overlayLayers.length
            });
            return;
        }

        // Configuration
        const layers = overlayData.layers || [];
        const displayMode = overlayData.displayMode || 'overlay';
        const transitionDuration = overlayData.transitionDuration || 300;
        const strings = overlayData.strings || {};

        console.log('Image Overlay initialized', {
            blockId: element.id,
            displayMode,
            layerCount: layers.length,
            buttonCount: layerButtons.length
        });

        /**
         * Show a specific layer
         * @param {number} layerIndex - Index of layer to show
         */
        function showLayer(layerIndex) {
            const button = layerButtons[layerIndex];
            const layer = overlayLayers[layerIndex];
            const layerData = layers[layerIndex];

            if (!button || !layer || !layerData) {
                console.warn('Show layer: Invalid index', layerIndex);
                return;
            }

            console.log('Showing layer', layerIndex, layerData.label);

            // Update button state
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            button.title = (strings.hideLayer || 'Ausblenden') + ': ' + layerData.label;

            // Update layer visibility
            layer.classList.remove('hidden');
            layer.classList.add('visible');

            const targetOpacity = (layerData.opacity || 100) / 100;
            layer.style.opacity = targetOpacity;

            // Visual feedback
            button.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                button.style.transform = '';
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

            if (!button || !layer || !layerData) {
                console.warn('Hide layer: Invalid index', layerIndex);
                return;
            }

            console.log('Hiding layer', layerIndex, layerData.label);

            // Update button state
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
            button.title = (strings.showLayer || 'Anzeigen') + ': ' + layerData.label;

            // Update layer visibility
            layer.classList.remove('visible');
            layer.classList.add('hidden');
            layer.style.opacity = '0';
        }

        /**
         * Toggle a specific layer
         * @param {number} layerIndex - Index of the layer to toggle
         */
        function toggleLayer(layerIndex) {
            if (layerIndex < 0 || layerIndex >= layers.length) {
                console.warn('Toggle layer: Index out of bounds', layerIndex);
                return;
            }

            const button = layerButtons[layerIndex];
            const isCurrentlyVisible = button.classList.contains('active');

            console.log('Toggling layer', layerIndex, 'currently visible:', isCurrentlyVisible, 'mode:', displayMode);

            // TOGGLE MODE: Only one layer visible at a time
            if (displayMode === 'toggle') {
                if (isCurrentlyVisible) {
                    // In toggle mode, clicking an active button does nothing
                    // User must click a different button to switch
                    console.log('Layer already active, ignoring click');
                    return;
                } else {
                    // Hide all layers first, then show the selected one
                    layerButtons.forEach((_, index) => hideLayer(index));
                    showLayer(layerIndex);
                    updateInfoPanel(layerIndex);
                }
            }
            // OVERLAY MODE: Multiple layers can be visible
            else {
                if (isCurrentlyVisible) {
                    hideLayer(layerIndex);
                    updateInfoPanel(-1);
                } else {
                    showLayer(layerIndex);
                    updateInfoPanel(layerIndex);
                }
            }
        }

        /**
         * Show all layers (overlay mode only)
         */
        function showAllLayers() {
            console.log('Showing all layers');
            layerButtons.forEach((_, index) => showLayer(index));
        }

        /**
         * Hide all layers
         */
        function hideAllLayers() {
            console.log('Hiding all layers');
            layerButtons.forEach((_, index) => hideLayer(index));
            updateInfoPanel(-1);
        }

        /**
         * Update info panel with layer information
         * @param {number} layerIndex - Index of active layer, -1 to hide
         */
        function updateInfoPanel(layerIndex) {
            if (!layerInfo) return;

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
                    return;
            }

            event.preventDefault();
            if (layerButtons[newIndex]) {
                layerButtons[newIndex].focus();
            }
        }

        /**
         * Initialize layer states from attributes
         */
        function initializeLayerStates() {
            console.log('Initializing layer states');

            layers.forEach((layerData, index) => {
                // Set custom color if defined
                if (layerData.color && layerButtons[index]) {
                    layerButtons[index].style.setProperty('--layer-color', layerData.color);
                }

                // Set initial visibility
                if (layerData.visible) {
                    showLayer(index);
                } else {
                    hideLayer(index);
                }
            });

            // Set initial info panel state
            const initialActiveIndex = Array.from(layerButtons).findIndex(btn => btn.classList.contains('active'));
            if (initialActiveIndex >= 0) {
                updateInfoPanel(initialActiveIndex);
            }
        }

        // Event listeners for layer buttons
        layerButtons.forEach((button, index) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('Button clicked:', index);
                toggleLayer(index);
            });

            button.addEventListener('keydown', handleKeyDown);

            // Accessibility attributes
            button.setAttribute('tabindex', '0');
            button.setAttribute('role', 'switch');
        });

        // Global control buttons
        if (showAllButton) {
            showAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                showAllLayers();
            });
        }

        if (hideAllButton) {
            hideAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                hideAllLayers();
            });
        }

        // Initialize layer states
        initializeLayerStates();
    }

    /**
     * Initialize all image overlay blocks on the page
     */
    function initAllImageOverlays() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-image-overlay');
        console.log('Found image overlay blocks:', blocks.length);
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
