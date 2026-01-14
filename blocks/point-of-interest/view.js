/**
 * Frontend JavaScript for Point of Interest Block
 *
 * Provides interactive hotspot functionality with popups, zoom controls, and responsive behavior
 */

(function() {
    'use strict';

    /**
     * Initialize point of interest functionality
     * @param {HTMLElement} element - The POI block element
     */
    function initPointOfInterest(element) {
        if (!element) return;

        const poiData = JSON.parse(element.dataset.poi || '{}');
        const container = element.querySelector('.poi-container');
        const imageContainer = element.querySelector('.poi-image-container');
        const backgroundImage = element.querySelector('.poi-background-image');
        const hotspots = element.querySelectorAll('.poi-hotspot');
        const popups = element.querySelectorAll('.poi-popup');
        const zoomInButton = element.querySelector('.zoom-in');
        const zoomOutButton = element.querySelector('.zoom-out');
        const zoomResetButton = element.querySelector('.zoom-reset');
        const legendItems = element.querySelectorAll('.legend-item');

        if (!container || !imageContainer || !backgroundImage) return;

        let currentZoom = 1;
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let imageOffset = { x: 0, y: 0 };
        let activePopup = null;

        /**
         * Show popup for a specific hotspot
         * @param {number} hotspotIndex - Index of the hotspot
         * @param {HTMLElement} hotspotElement - The hotspot element
         */
        function showPopup(hotspotIndex, hotspotElement) {
            // Hide any active popup first
            hideAllPopups();

            const popup = element.querySelector(`[data-hotspot="${hotspotIndex}"].poi-popup`);
            if (!popup) return;

            // Position and show popup
            positionPopup(popup, hotspotElement);
            popup.style.display = 'block';
            popup.classList.add('active');
            activePopup = popup;

            // Focus management
            setTimeout(() => {
                const closeButton = popup.querySelector('.popup-close');
                if (closeButton) {
                    closeButton.focus();
                }
            }, 100);

            // Auto-close if enabled
            if (poiData.autoClose && poiData.popupStyle === 'tooltip') {
                setTimeout(() => {
                    if (activePopup === popup) {
                        hidePopup(popup);
                    }
                }, 5000);
            }
        }

        /**
         * Position popup relative to hotspot
         * @param {HTMLElement} popup - The popup element
         * @param {HTMLElement} hotspot - The hotspot element
         */
        function positionPopup(popup, hotspot) {
            const hotspotRect = hotspot.getBoundingClientRect();
            const containerRect = imageContainer.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();

            let left, top;
            const popupPosition = poiData.popupPosition || 'auto';
            const offset = 15;

            // Calculate position based on settings
            switch (popupPosition) {
                case 'top':
                    left = hotspotRect.left - containerRect.left;
                    top = hotspotRect.top - containerRect.top - popupRect.height - offset;
                    break;
                case 'bottom':
                    left = hotspotRect.left - containerRect.left;
                    top = hotspotRect.bottom - containerRect.top + offset;
                    break;
                case 'left':
                    left = hotspotRect.left - containerRect.left - popupRect.width - offset;
                    top = hotspotRect.top - containerRect.top;
                    break;
                case 'right':
                    left = hotspotRect.right - containerRect.left + offset;
                    top = hotspotRect.top - containerRect.top;
                    break;
                default: // 'auto'
                    // Try to position smartly based on available space
                    const spaceRight = containerRect.width - (hotspotRect.right - containerRect.left);
                    const spaceLeft = hotspotRect.left - containerRect.left;
                    const spaceTop = hotspotRect.top - containerRect.top;
                    const spaceBottom = containerRect.height - (hotspotRect.bottom - containerRect.top);

                    if (spaceRight >= popupRect.width + offset) {
                        left = hotspotRect.right - containerRect.left + offset;
                        top = hotspotRect.top - containerRect.top;
                    } else if (spaceLeft >= popupRect.width + offset) {
                        left = hotspotRect.left - containerRect.left - popupRect.width - offset;
                        top = hotspotRect.top - containerRect.top;
                    } else if (spaceBottom >= popupRect.height + offset) {
                        left = hotspotRect.left - containerRect.left;
                        top = hotspotRect.bottom - containerRect.top + offset;
                    } else {
                        left = hotspotRect.left - containerRect.left;
                        top = hotspotRect.top - containerRect.top - popupRect.height - offset;
                    }
                    break;
            }

            // Ensure popup stays within container bounds
            left = Math.max(10, Math.min(left, containerRect.width - popupRect.width - 10));
            top = Math.max(10, Math.min(top, containerRect.height - popupRect.height - 10));

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
        }

        /**
         * Hide a specific popup
         * @param {HTMLElement} popup - The popup to hide
         */
        function hidePopup(popup) {
            if (!popup) return;

            popup.style.display = 'none';
            popup.classList.remove('active');

            if (activePopup === popup) {
                activePopup = null;
            }
        }

        /**
         * Hide all popups
         */
        function hideAllPopups() {
            popups.forEach(popup => {
                hidePopup(popup);
            });
        }

        /**
         * Handle hotspot click/touch
         * @param {Event} event - The event
         * @param {HTMLElement} hotspot - The hotspot element
         */
        function handleHotspotActivation(event, hotspot) {
            event.preventDefault();
            event.stopPropagation();

            const hotspotIndex = parseInt(hotspot.dataset.hotspot);
            const trigger = hotspot.dataset.trigger || 'click';

            if (trigger === 'click' || event.type === 'click') {
                // Check if popup is already active
                const popup = element.querySelector(`[data-hotspot="${hotspotIndex}"].poi-popup`);
                if (popup && popup.classList.contains('active')) {
                    hidePopup(popup);
                } else {
                    showPopup(hotspotIndex, hotspot);
                }
            }
        }

        /**
         * Handle zoom functionality
         * @param {number} zoomDelta - Zoom change amount
         */
        function handleZoom(zoomDelta) {
            if (!poiData.enableZoom) return;

            const newZoom = Math.max(1, Math.min(3, currentZoom + zoomDelta));

            if (newZoom !== currentZoom) {
                currentZoom = newZoom;
                updateImageTransform();
                updateZoomButtons();
            }
        }

        /**
         * Update image transform with zoom and pan
         */
        function updateImageTransform() {
            const transform = `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${currentZoom})`;
            backgroundImage.style.transform = transform;

            // Update hotspot positions proportionally
            hotspots.forEach(hotspot => {
                const x = parseFloat(hotspot.style.left);
                const y = parseFloat(hotspot.style.top);
                // Hotspots are positioned with percentages, so they scale automatically
            });
        }

        /**
         * Update zoom button states
         */
        function updateZoomButtons() {
            if (zoomInButton) {
                zoomInButton.disabled = currentZoom >= 3;
            }
            if (zoomOutButton) {
                zoomOutButton.disabled = currentZoom <= 1;
            }
            if (zoomResetButton) {
                zoomResetButton.disabled = currentZoom === 1 && imageOffset.x === 0 && imageOffset.y === 0;
            }
        }

        /**
         * Reset zoom and pan
         */
        function resetZoom() {
            currentZoom = 1;
            imageOffset = { x: 0, y: 0 };
            updateImageTransform();
            updateZoomButtons();
        }

        /**
         * Handle keyboard navigation
         * @param {KeyboardEvent} event - Keyboard event
         */
        function handleKeyDown(event) {
            const activeElement = document.activeElement;

            // Handle hotspot navigation
            if (activeElement && activeElement.classList.contains('poi-hotspot')) {
                const currentIndex = Array.from(hotspots).indexOf(activeElement);
                let newIndex = currentIndex;

                switch (event.key) {
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        newIndex = currentIndex > 0 ? currentIndex - 1 : hotspots.length - 1;
                        break;
                    case 'ArrowDown':
                    case 'ArrowRight':
                        newIndex = currentIndex < hotspots.length - 1 ? currentIndex + 1 : 0;
                        break;
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        handleHotspotActivation(event, activeElement);
                        return;
                    case 'Escape':
                        hideAllPopups();
                        return;
                    default:
                        return;
                }

                event.preventDefault();
                if (hotspots[newIndex]) {
                    hotspots[newIndex].focus();
                }
            }

            // Handle popup navigation
            if (activePopup) {
                if (event.key === 'Escape') {
                    hideAllPopups();
                    return;
                }
            }
        }

        /**
         * Handle mouse/touch dragging for zoom mode
         */
        function initializeDragBehavior() {
            if (!poiData.enableZoom) return;

            imageContainer.addEventListener('mousedown', startDrag);
            imageContainer.addEventListener('touchstart', startDrag, { passive: false });

            function startDrag(event) {
                if (currentZoom <= 1) return;

                isDragging = true;
                const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                const clientY = event.touches ? event.touches[0].clientY : event.clientY;

                dragStart.x = clientX - imageOffset.x;
                dragStart.y = clientY - imageOffset.y;

                imageContainer.style.cursor = 'grabbing';

                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', endDrag);
                document.addEventListener('touchmove', drag, { passive: false });
                document.addEventListener('touchend', endDrag);

                event.preventDefault();
            }

            function drag(event) {
                if (!isDragging) return;

                const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                const clientY = event.touches ? event.touches[0].clientY : event.clientY;

                imageOffset.x = clientX - dragStart.x;
                imageOffset.y = clientY - dragStart.y;

                // Constrain dragging to reasonable bounds
                const maxOffset = 100 * (currentZoom - 1);
                imageOffset.x = Math.max(-maxOffset, Math.min(maxOffset, imageOffset.x));
                imageOffset.y = Math.max(-maxOffset, Math.min(maxOffset, imageOffset.y));

                updateImageTransform();
                event.preventDefault();
            }

            function endDrag() {
                isDragging = false;
                imageContainer.style.cursor = currentZoom > 1 ? 'grab' : '';

                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', endDrag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('touchend', endDrag);
            }
        }

        // Event listeners
        hotspots.forEach((hotspot, index) => {
            const trigger = hotspot.dataset.trigger || 'click';

            // Click events - only for click trigger
            if (trigger === 'click') {
                hotspot.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const hotspotIndex = parseInt(hotspot.dataset.hotspot);
                    const popup = element.querySelector(`[data-hotspot="${hotspotIndex}"].poi-popup`);
                    if (popup && popup.classList.contains('active')) {
                        hidePopup(popup);
                    } else {
                        showPopup(hotspotIndex, hotspot);
                    }
                });
            }

            // Hover events - only for hover trigger
            if (trigger === 'hover') {
                hotspot.addEventListener('mouseenter', () => {
                    showPopup(index, hotspot);
                });

                hotspot.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        const popup = element.querySelector(`[data-hotspot="${index}"].poi-popup`);
                        if (popup && !popup.matches(':hover')) {
                            hidePopup(popup);
                        }
                    }, 200);
                });

                // Also close when leaving popup
                const popup = element.querySelector(`[data-hotspot="${index}"].poi-popup`);
                if (popup) {
                    popup.addEventListener('mouseleave', () => {
                        setTimeout(() => {
                            if (!hotspot.matches(':hover')) {
                                hidePopup(popup);
                            }
                        }, 200);
                    });
                }
            }

            hotspot.addEventListener('keydown', handleKeyDown);
        });

        // Popup close buttons
        popups.forEach(popup => {
            const closeButton = popup.querySelector('.popup-close');
            if (closeButton) {
                closeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    hidePopup(popup);
                });
            }
        });

        // Zoom controls
        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => handleZoom(0.5));
        }

        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => handleZoom(-0.5));
        }

        if (zoomResetButton) {
            zoomResetButton.addEventListener('click', resetZoom);
        }

        // Legend interactions
        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                const hotspotIndex = parseInt(item.dataset.hotspot);
                const hotspot = element.querySelector(`[data-hotspot="${hotspotIndex}"].poi-hotspot`);
                if (hotspot) {
                    showPopup(hotspotIndex, hotspot);
                    hotspot.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // Outside click to close popups
        if (poiData.closeOnOutsideClick) {
            document.addEventListener('click', (event) => {
                if (!element.contains(event.target)) {
                    hideAllPopups();
                }
            });
        }

        // Keyboard support
        document.addEventListener('keydown', handleKeyDown);

        // Initialize drag behavior
        initializeDragBehavior();

        // Initialize zoom button states
        updateZoomButtons();

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (activePopup) {
                    const hotspotIndex = parseInt(activePopup.dataset.hotspot);
                    const hotspot = element.querySelector(`[data-hotspot="${hotspotIndex}"].poi-hotspot`);
                    if (hotspot) {
                        positionPopup(activePopup, hotspot);
                    }
                }
            }, 100);
        });
    }

    /**
     * Initialize all point of interest blocks on the page
     */
    function initAllPointOfInterest() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-point-of-interest');
        blocks.forEach(initPointOfInterest);
    }

    // Make function globally available for dynamic content
    window.initPointOfInterest = initPointOfInterest;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllPointOfInterest);
    } else {
        initAllPointOfInterest();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllPointOfInterest);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a POI block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-point-of-interest')) {
                                initPointOfInterest(node);
                            }
                            // Check if the added node contains POI blocks
                            const poiBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-point-of-interest');
                            if (poiBlocks) {
                                poiBlocks.forEach(initPointOfInterest);
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