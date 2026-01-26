/**
 * Drag and Drop Block Frontend JavaScript
 * H5P-inspired drag and drop functionality for WordPress
 * Version 2.0.0 - Full H5P Feature Parity
 */

(function() {
    'use strict';

    /**
     * DragAndDrop Class - H5P-style implementation
     */
    class DragAndDrop {
        constructor(blockElement) {
            this.block = blockElement;
            this.data = JSON.parse(blockElement.dataset.dragDrop);
            this.uniqueId = blockElement.id;

            // State management
            this.state = {
                placements: {},
                isChecked: false,
                score: 0,
                totalPoints: this.data.draggables.length,
                isDragging: false,
                isFullscreen: false,
                scaleFactor: 1,
                cloneCounter: 0
            };

            // DOM element references
            this.elements = {};

            // Drag state
            this.draggedElement = null;
            this.touchData = null;
            this.selectedElement = null;

            this.init();
        }

        init() {
            this.cacheElements();
            this.enforceVerticalLayout(); // Force vertical layout immediately
            this.setupDraggableElements();
            this.setupDropZones();
            this.setupControls();
            this.setupHighlightMode();
            this.setupFullscreen();
            this.setupAutoScale();
            this.updateCheckButtonState();

            if (this.data.randomizeDraggables) {
                this.randomizeDraggableOrder();
            }
        }

        // Force vertical layout (drop area on top, draggables below)
        enforceVerticalLayout() {
            const activityArea = this.block.querySelector('.activity-area');
            const dropArea = this.block.querySelector('.drop-area');
            const draggablesArea = this.block.querySelector('.draggables-area');

            if (activityArea) {
                activityArea.style.display = 'flex';
                activityArea.style.flexDirection = 'column';
                activityArea.style.gridTemplateColumns = 'none';
            }

            if (dropArea) {
                dropArea.style.order = '1';
                dropArea.style.width = '100%';
            }

            if (draggablesArea) {
                draggablesArea.style.order = '2';
                draggablesArea.style.width = '100%';
            }
        }

        cacheElements() {
            this.elements = {
                container: this.block.querySelector('.drag-drop-container'),
                draggablesContainer: this.block.querySelector('.draggables-container'),
                dropArea: this.block.querySelector('.drop-area-container'),
                dropZones: this.block.querySelectorAll('.drop-zone'),
                draggableElements: this.block.querySelectorAll('.draggable-element'),
                checkButton: this.block.querySelector('.drag-drop-check'),
                retryButton: this.block.querySelector('.drag-drop-retry'),
                solutionButton: this.block.querySelector('.drag-drop-solution'),
                fullscreenButton: this.block.querySelector('.drag-drop-fullscreen'),
                results: this.block.querySelector('.drag-drop-results')
            };
        }

        // ==========================================
        // DRAGGABLE ELEMENTS SETUP
        // ==========================================

        setupDraggableElements() {
            this.elements.draggableElements.forEach(element => {
                const draggableId = element.dataset.draggableId;
                const isInfinite = element.dataset.infinite === 'true';

                // Mouse events
                element.addEventListener('mousedown', e => this.handleMouseDown(e, element));
                element.addEventListener('dragstart', e => this.handleDragStart(e, element));
                element.addEventListener('dragend', e => this.handleDragEnd(e, element));

                // Touch events for mobile
                element.addEventListener('touchstart', e => this.handleTouchStart(e, element), { passive: false });
                element.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
                element.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });

                // Keyboard events
                element.addEventListener('keydown', e => this.handleKeyDown(e, element));

                // Click for tip display
                if (element.dataset.tip) {
                    element.addEventListener('dblclick', e => this.showTip(element, element.dataset.tip));
                }

                // Set initial state
                element.setAttribute('aria-grabbed', 'false');
                this.state.placements[draggableId] = null;
            });
        }

        // ==========================================
        // MOUSE DRAG HANDLING
        // ==========================================

        handleMouseDown(event, element) {
            if (this.state.isChecked) return;

            const isInfinite = element.dataset.infinite === 'true';

            if (isInfinite && !element.dataset.isClone) {
                // Clone the element for infinite draggables
                this.draggedElement = this.cloneInfiniteDraggable(element);
            }
        }

        handleDragStart(event, element) {
            if (this.state.isChecked) {
                event.preventDefault();
                return;
            }

            const isInfinite = element.dataset.infinite === 'true';

            // Use clone if it exists, otherwise the element itself
            const dragElement = this.draggedElement || element;
            this.draggedElement = dragElement;
            this.state.isDragging = true;

            dragElement.setAttribute('aria-grabbed', 'true');
            dragElement.classList.add('dragging');

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', dragElement.dataset.draggableId);

            // Add visual feedback to drop zones
            this.highlightDropZones(true);
        }

        handleDragEnd(event, element) {
            const dragElement = this.draggedElement || element;

            dragElement.setAttribute('aria-grabbed', 'false');
            dragElement.classList.remove('dragging');

            this.draggedElement = null;
            this.state.isDragging = false;

            // Remove visual feedback
            this.highlightDropZones(false);
        }

        // ==========================================
        // TOUCH HANDLING
        // ==========================================

        handleTouchStart(event, element) {
            if (this.state.isChecked) return;

            const touch = event.touches[0];
            const isInfinite = element.dataset.infinite === 'true';

            let dragElement = element;
            if (isInfinite && !element.dataset.isClone) {
                dragElement = this.cloneInfiniteDraggable(element);
            }

            this.touchData = {
                element: dragElement,
                startX: touch.clientX,
                startY: touch.clientY,
                elementRect: dragElement.getBoundingClientRect()
            };

            dragElement.classList.add('dragging');
            this.state.isDragging = true;

            this.createTouchClone(dragElement, touch);
            this.highlightDropZones(true);
        }

        handleTouchMove(event) {
            if (!this.touchData) return;

            event.preventDefault();

            const touch = event.touches[0];

            if (this.touchData.clone) {
                this.touchData.clone.style.left = (touch.clientX - this.touchData.clone.offsetWidth / 2) + 'px';
                this.touchData.clone.style.top = (touch.clientY - this.touchData.clone.offsetHeight / 2) + 'px';
            }

            const dropZone = this.getDropZoneAtPosition(touch.clientX, touch.clientY);
            this.highlightCurrentDropZone(dropZone);
        }

        handleTouchEnd(event) {
            if (!this.touchData) return;

            const touch = event.changedTouches[0];
            const dropZone = this.getDropZoneAtPosition(touch.clientX, touch.clientY);

            if (dropZone && this.touchData.element) {
                this.dropElementInZone(this.touchData.element, dropZone);
            } else if (this.touchData.element.dataset.isClone === 'true') {
                // Remove unused clone
                this.touchData.element.remove();
            }

            this.cleanupTouch();
        }

        createTouchClone(element, touch) {
            const clone = element.cloneNode(true);
            clone.classList.add('touch-clone');
            clone.style.position = 'fixed';
            clone.style.pointerEvents = 'none';
            clone.style.zIndex = '9999';
            clone.style.opacity = '0.9';
            clone.style.left = (touch.clientX - element.offsetWidth / 2) + 'px';
            clone.style.top = (touch.clientY - element.offsetHeight / 2) + 'px';
            clone.style.transform = 'scale(1.05) rotate(2deg)';

            document.body.appendChild(clone);
            this.touchData.clone = clone;
        }

        cleanupTouch() {
            if (this.touchData?.clone) {
                document.body.removeChild(this.touchData.clone);
            }

            if (this.touchData?.element) {
                this.touchData.element.classList.remove('dragging');
            }

            this.elements.dropZones.forEach(zone => {
                zone.classList.remove('drag-over', 'drag-active');
            });

            this.touchData = null;
            this.state.isDragging = false;
        }

        // ==========================================
        // DROP ZONE HANDLING
        // ==========================================

        setupDropZones() {
            this.elements.dropZones.forEach(zone => {
                zone.addEventListener('dragover', e => this.handleDragOver(e));
                zone.addEventListener('drop', e => this.handleDrop(e, zone));
                zone.addEventListener('dragenter', e => this.handleDragEnter(e, zone));
                zone.addEventListener('dragleave', e => this.handleDragLeave(e, zone));
                zone.addEventListener('keydown', e => this.handleZoneKeyDown(e, zone));
                zone.addEventListener('click', e => this.handleZoneClick(e, zone));

                zone.setAttribute('aria-dropeffect', 'move');
            });
        }

        handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        }

        handleDragEnter(event, zone) {
            event.preventDefault();
            zone.classList.add('drag-over');
        }

        handleDragLeave(event, zone) {
            if (zone && !zone.contains(event.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        }

        handleDrop(event, zone) {
            event.preventDefault();
            const draggableId = event.dataTransfer.getData('text/plain');
            let draggableElement = this.block.querySelector(`[data-draggable-id="${draggableId}"]:not(.touch-clone)`);

            // Use the dragged element if it's a clone
            if (this.draggedElement && this.draggedElement.dataset.isClone === 'true') {
                draggableElement = this.draggedElement;
            }

            if (zone && draggableElement) {
                this.dropElementInZone(draggableElement, zone);
            }

            zone.classList.remove('drag-over');
        }

        // ==========================================
        // INFINITE DRAGGABLES (CLONING)
        // ==========================================

        cloneInfiniteDraggable(element) {
            this.state.cloneCounter++;
            const clone = element.cloneNode(true);
            const originalId = element.dataset.draggableId;
            const cloneId = `${originalId}-clone-${this.state.cloneCounter}`;

            clone.dataset.draggableId = cloneId;
            clone.dataset.originalId = originalId;
            clone.dataset.isClone = 'true';

            // Copy correct zones from original
            clone.dataset.correctZones = element.dataset.correctZones;

            // Add to draggables container
            this.elements.draggablesContainer.appendChild(clone);

            // Setup events for clone
            clone.addEventListener('dragstart', e => this.handleDragStart(e, clone));
            clone.addEventListener('dragend', e => this.handleDragEnd(e, clone));
            clone.addEventListener('touchstart', e => this.handleTouchStart(e, clone), { passive: false });
            clone.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
            clone.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: false });
            clone.addEventListener('keydown', e => this.handleKeyDown(e, clone));

            // Track in state
            this.state.placements[cloneId] = null;

            return clone;
        }

        // ==========================================
        // CORE DROP LOGIC
        // ==========================================

        dropElementInZone(element, zone) {
            const draggableId = element.dataset.draggableId;
            const zoneId = zone.dataset.zoneId;
            const acceptMultiple = zone.dataset.acceptMultiple === 'true';
            const autoAlign = zone.dataset.autoAlign !== 'false';
            const zoneContent = zone.querySelector('.zone-content');

            // Check if zone accepts multiple elements
            if (!acceptMultiple && zoneContent.children.length > 0) {
                const existingElement = zoneContent.firstElementChild;
                this.returnElementToSource(existingElement);
            }

            // Remove element from current position
            if (this.state.placements[draggableId]) {
                const currentZoneId = this.state.placements[draggableId];
                const currentZone = this.block.querySelector(`[data-zone-id="${currentZoneId}"]`);
                if (currentZone) {
                    const currentZoneContent = currentZone.querySelector('.zone-content');
                    if (currentZoneContent.contains(element)) {
                        currentZoneContent.removeChild(element);
                        this.autoAlignZone(currentZone);
                    }
                }
            } else if (this.elements.draggablesContainer.contains(element)) {
                this.elements.draggablesContainer.removeChild(element);
            }

            // Add to new zone
            zoneContent.appendChild(element);
            this.state.placements[draggableId] = zoneId;

            // Apply auto-alignment
            if (autoAlign) {
                this.autoAlignZone(zone);
            }

            // Update ARIA states
            element.setAttribute('aria-describedby', zone.id || `zone-${zoneId}`);
            zone.setAttribute('aria-expanded', 'true');

            // Instant feedback
            if (this.data.instantFeedback) {
                this.provideFeedbackForElement(element, zone);
            }

            this.updateCheckButtonState();
            this.announceToScreenReader(this.data.strings.dragToZone);
        }

        returnElementToSource(element) {
            const draggableId = element.dataset.draggableId;
            const isClone = element.dataset.isClone === 'true';

            // Get the zone it was in for re-alignment
            const currentZoneId = this.state.placements[draggableId];
            const currentZone = currentZoneId ? this.block.querySelector(`[data-zone-id="${currentZoneId}"]`) : null;

            // Remove from current zone
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }

            // If it's a clone, just remove it entirely
            if (isClone) {
                delete this.state.placements[draggableId];
            } else {
                // Return to draggables container
                this.elements.draggablesContainer.appendChild(element);
                this.state.placements[draggableId] = null;
            }

            // Reset styles
            element.style.position = '';
            element.style.transform = '';
            element.setAttribute('aria-describedby', '');
            element.classList.remove('result-correct', 'result-incorrect', 'feedback-correct', 'feedback-incorrect');

            // Re-align the zone that lost the element
            if (currentZone) {
                this.autoAlignZone(currentZone);
            }

            this.updateCheckButtonState();
        }

        // ==========================================
        // AUTO-ALIGNMENT (H5P STYLE)
        // ==========================================

        autoAlignZone(zone) {
            const zoneContent = zone.querySelector('.zone-content');
            const spacing = parseInt(zone.dataset.alignSpacing) || 8;
            const elements = Array.from(zoneContent.children);

            if (elements.length === 0) return;

            const zoneWidth = zoneContent.offsetWidth;
            const zoneHeight = zoneContent.offsetHeight;

            // Reset positions
            elements.forEach(el => {
                el.style.position = 'relative';
                el.style.left = '';
                el.style.top = '';
                el.style.transform = '';
            });

            // Let CSS flexbox handle the layout
            zoneContent.style.display = 'flex';
            zoneContent.style.flexWrap = 'wrap';
            zoneContent.style.gap = spacing + 'px';
            zoneContent.style.alignContent = 'flex-start';
            zoneContent.style.justifyContent = 'center';

            // Trigger reflow and animate
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.8)';

                setTimeout(() => {
                    el.style.transition = 'all 0.3s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                }, index * 50);
            });

            // Dispatch alignment event
            zone.dispatchEvent(new CustomEvent('elementaligned', { bubbles: true }));
        }

        // ==========================================
        // HIGHLIGHT MODES
        // ==========================================

        setupHighlightMode() {
            if (this.data.highlightDropZones === 'always') {
                this.elements.dropZones.forEach(zone => {
                    zone.classList.add('highlight-always');
                });
            } else if (this.data.highlightDropZones === 'never') {
                this.elements.dropZones.forEach(zone => {
                    zone.classList.add('highlight-never');
                });
            }
        }

        highlightDropZones(active) {
            if (this.data.highlightDropZones === 'never') return;

            this.elements.dropZones.forEach(zone => {
                if (active) {
                    zone.classList.add('drag-active');
                } else {
                    zone.classList.remove('drag-active', 'drag-over');
                }
            });
        }

        highlightCurrentDropZone(zone) {
            this.elements.dropZones.forEach(z => z.classList.remove('drag-over'));
            if (zone) {
                zone.classList.add('drag-over');
            }
        }

        getDropZoneAtPosition(x, y) {
            const elementAtPoint = document.elementFromPoint(x, y);
            return elementAtPoint ? elementAtPoint.closest('.drop-zone') : null;
        }

        // ==========================================
        // FULLSCREEN MODE
        // ==========================================

        setupFullscreen() {
            if (!this.data.enableFullscreen) return;

            const fullscreenBtn = this.elements.fullscreenButton;
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
            }

            // Listen for fullscreen changes
            document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
            document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        }

        toggleFullscreen() {
            if (this.state.isFullscreen) {
                this.exitFullscreen();
            } else {
                this.enterFullscreen();
            }
        }

        enterFullscreen() {
            const container = this.elements.container;

            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }

            this.state.isFullscreen = true;
            this.block.classList.add('is-fullscreen');
        }

        exitFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }

            this.state.isFullscreen = false;
            this.block.classList.remove('is-fullscreen');
        }

        onFullscreenChange() {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
            this.state.isFullscreen = isFullscreen;

            if (isFullscreen) {
                this.block.classList.add('is-fullscreen');
            } else {
                this.block.classList.remove('is-fullscreen');
            }

            // Recalculate scale
            if (this.data.enableAutoScale) {
                setTimeout(() => this.calculateScale(), 100);
            }
        }

        // ==========================================
        // AUTO-SCALING (H5P STYLE)
        // ==========================================

        setupAutoScale() {
            if (!this.data.enableAutoScale) return;

            this.calculateScale();

            // Debounced resize handler
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.calculateScale(), 100);
            });
        }

        calculateScale() {
            // Disable auto-scaling transform - let CSS handle responsive layout
            // The image now uses width: 100% and scales naturally
            this.state.scaleFactor = 1;

            // Re-enforce vertical layout after any resize
            this.enforceVerticalLayout();
        }

        // ==========================================
        // KEYBOARD HANDLING
        // ==========================================

        handleKeyDown(event, element) {
            if (this.state.isChecked) return;

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (this.selectedElement === element) {
                        this.unselectAll();
                        this.announceToScreenReader(this.data.strings.returnToStart);
                    } else {
                        this.selectElement(element);
                    }
                    break;
                case 'Escape':
                    if (this.selectedElement) {
                        this.unselectAll();
                        this.announceToScreenReader(this.data.strings.returnToStart);
                    }
                    break;
                case 'h':
                case 'H':
                    // Show tip on H key
                    if (element.dataset.tip) {
                        event.preventDefault();
                        this.showTip(element, element.dataset.tip);
                    }
                    break;
            }
        }

        handleZoneKeyDown(event, zone) {
            if (this.state.isChecked) return;

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (this.selectedElement) {
                        this.dropElementInZone(this.selectedElement, zone);
                        this.unselectAll();
                    }
                    break;
                case 'Escape':
                    this.unselectAll();
                    break;
            }
        }

        handleZoneClick(event, zone) {
            if (this.state.isChecked) return;

            if (!this.state.isDragging && this.selectedElement) {
                this.dropElementInZone(this.selectedElement, zone);
                this.unselectAll();
            }
        }

        selectElement(element) {
            this.unselectAll();
            this.selectedElement = element;
            element.classList.add('selected');
            element.setAttribute('aria-selected', 'true');
            this.announceToScreenReader(this.data.strings.dragToZone);

            this.elements.dropZones.forEach(zone => {
                zone.classList.add('available');
            });
        }

        unselectAll() {
            if (this.selectedElement) {
                this.selectedElement.classList.remove('selected');
                this.selectedElement.setAttribute('aria-selected', 'false');
            }

            this.elements.dropZones.forEach(zone => {
                zone.classList.remove('available', 'selected');
            });

            this.selectedElement = null;
        }

        // ==========================================
        // TIPS / HINTS
        // ==========================================

        showTip(element, tipText) {
            // Remove existing tip
            const existingTip = this.block.querySelector('.element-tip');
            if (existingTip) existingTip.remove();

            // Create tip element
            const tip = document.createElement('div');
            tip.className = 'element-tip';
            tip.innerHTML = `
                <div class="tip-content">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">${tipText}</span>
                </div>
                <button class="tip-close" aria-label="Schließen">&times;</button>
            `;

            // Position near element
            const rect = element.getBoundingClientRect();
            const blockRect = this.block.getBoundingClientRect();

            tip.style.position = 'absolute';
            tip.style.left = (rect.left - blockRect.left) + 'px';
            tip.style.top = (rect.bottom - blockRect.top + 10) + 'px';
            tip.style.zIndex = '1000';

            this.block.appendChild(tip);

            // Close button handler
            tip.querySelector('.tip-close').addEventListener('click', () => tip.remove());

            // Auto-close after 5 seconds
            setTimeout(() => tip.remove(), 5000);
        }

        // ==========================================
        // FEEDBACK
        // ==========================================

        provideFeedbackForElement(element, zone) {
            const draggableId = element.dataset.draggableId;
            const originalId = element.dataset.originalId || draggableId;
            const zoneId = zone.dataset.zoneId;
            const correctZones = JSON.parse(element.dataset.correctZones || '[]');
            const isCorrect = correctZones.includes(zoneId);

            // Get zone-specific feedback
            const tipCorrect = zone.dataset.tipCorrect;
            const tipIncorrect = zone.dataset.tipIncorrect;

            const feedback = element.querySelector('.draggable-feedback');
            if (feedback) {
                feedback.textContent = isCorrect
                    ? (tipCorrect || this.data.strings.correct)
                    : (tipIncorrect || this.data.strings.incorrect);
                feedback.className = `draggable-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                feedback.style.display = 'block';

                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 3000);
            }

            // Visual feedback
            element.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
            setTimeout(() => {
                element.classList.remove('feedback-correct', 'feedback-incorrect');
            }, 1000);
        }

        // ==========================================
        // CONTROLS
        // ==========================================

        setupControls() {
            this.elements.checkButton?.addEventListener('click', () => this.checkAnswers());
            this.elements.retryButton?.addEventListener('click', () => this.resetActivity());
            this.elements.solutionButton?.addEventListener('click', () => this.showSolutions());
        }

        updateCheckButtonState() {
            const hasAnyPlacement = Object.values(this.state.placements).some(p => p !== null);
            if (this.elements.checkButton) {
                this.elements.checkButton.disabled = !hasAnyPlacement;
            }
        }

        // ==========================================
        // ANSWER CHECKING
        // ==========================================

        checkAnswers() {
            if (this.state.isChecked) return;

            this.state.isChecked = true;
            this.state.score = 0;
            let wrongCount = 0;

            const results = [];

            // Check original draggables
            this.data.draggables.forEach(draggable => {
                const draggableId = draggable.id;
                const correctZones = draggable.correctZones || [];

                // Find all placed elements (including clones)
                const placedElements = this.findPlacedElements(draggableId);

                if (placedElements.length === 0) {
                    // Not placed - count as wrong
                    wrongCount++;
                    results.push({
                        draggable,
                        placedZone: null,
                        isCorrect: false
                    });
                } else {
                    placedElements.forEach(({ element, zoneId }) => {
                        const isCorrect = correctZones.includes(zoneId);

                        if (isCorrect) {
                            this.state.score++;
                        } else {
                            wrongCount++;
                        }

                        results.push({
                            element,
                            draggable,
                            placedZone: zoneId,
                            correctZones,
                            isCorrect
                        });

                        // Visual feedback
                        if (element) {
                            element.classList.add(isCorrect ? 'result-correct' : 'result-incorrect');

                            // Show zone-specific feedback
                            if (this.data.showFeedback) {
                                const zone = this.block.querySelector(`[data-zone-id="${zoneId}"]`);
                                const tipText = isCorrect
                                    ? (zone?.dataset.tipCorrect || this.data.strings.correct)
                                    : (zone?.dataset.tipIncorrect || this.data.strings.incorrect);

                                const feedback = element.querySelector('.draggable-feedback');
                                if (feedback) {
                                    feedback.textContent = tipText;
                                    feedback.className = `draggable-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                                    feedback.style.display = 'block';
                                }
                            }
                        }
                    });
                }
            });

            // Apply penalty if enabled
            if (this.data.applyPenalty && wrongCount > 0) {
                const penalty = wrongCount * (this.data.penaltyPerWrong || 1);
                this.state.score = Math.max(0, this.state.score - penalty);
            }

            // Show results
            this.displayResults();
            this.updateControls();
            this.disableInteractions();
        }

        findPlacedElements(draggableId) {
            const results = [];

            // Check direct placement
            if (this.state.placements[draggableId]) {
                const element = this.block.querySelector(`[data-draggable-id="${draggableId}"]`);
                results.push({ element, zoneId: this.state.placements[draggableId] });
            }

            // Check clones
            Object.keys(this.state.placements).forEach(key => {
                if (key.startsWith(draggableId + '-clone-') && this.state.placements[key]) {
                    const element = this.block.querySelector(`[data-draggable-id="${key}"]`);
                    results.push({ element, zoneId: this.state.placements[key] });
                }
            });

            return results;
        }

        displayResults() {
            if (!this.elements.results || !this.data.showScore) return;

            const scoreDisplay = this.elements.results.querySelector('.score-display');
            const messageDisplay = this.elements.results.querySelector('.result-message');
            const feedbackDisplay = this.elements.results.querySelector('.placement-feedback');

            // Score display
            if (scoreDisplay) {
                const scoreMessage = this.data.scoreText
                    .replace('@score', this.state.score)
                    .replace('@total', this.state.totalPoints);
                scoreDisplay.textContent = scoreMessage;
            }

            // Result message
            if (messageDisplay) {
                const percentage = (this.state.score / this.state.totalPoints) * 100;
                let message = '';
                let messageClass = '';

                // Use feedback ranges if available
                if (this.data.feedbackRanges && this.data.feedbackRanges.length > 0) {
                    for (const range of this.data.feedbackRanges) {
                        if (percentage >= range.from && percentage <= range.to) {
                            message = range.feedback;
                            break;
                        }
                    }
                }

                // Fallback to default messages
                if (!message) {
                    if (percentage === 100) {
                        message = this.data.successText;
                        messageClass = 'success';
                    } else if (percentage > 50 && this.data.allowPartialScore) {
                        message = this.data.partialSuccessText;
                        messageClass = 'partial';
                    } else {
                        message = this.data.failText;
                        messageClass = 'fail';
                    }
                }

                messageDisplay.textContent = message;
                messageDisplay.className = `result-message ${messageClass}`;
            }

            // Detailed feedback
            if (feedbackDisplay && this.data.showFeedback) {
                const feedbackItems = this.data.draggables.map(draggable => {
                    const placedElements = this.findPlacedElements(draggable.id);

                    if (placedElements.length === 0) {
                        return `<div class="feedback-item incorrect">
                            <span class="feedback-element">${draggable.content}</span>
                            <span class="feedback-status">${this.data.strings.incorrect}</span>
                        </div>`;
                    }

                    return placedElements.map(({ zoneId }) => {
                        const isCorrect = (draggable.correctZones || []).includes(zoneId);
                        return `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                            <span class="feedback-element">${draggable.content}</span>
                            <span class="feedback-status">${isCorrect ? this.data.strings.correct : this.data.strings.incorrect}</span>
                        </div>`;
                    }).join('');
                }).join('');

                feedbackDisplay.innerHTML = feedbackItems;
            }

            this.elements.results.style.display = 'block';

            // Announce results to screen readers
            this.announceToScreenReader(
                `${this.data.strings.check} ${this.state.score} ${this.data.strings.correct}`
            );
        }

        updateControls() {
            if (this.elements.checkButton) {
                this.elements.checkButton.style.display = 'none';
            }

            if (this.elements.retryButton && this.data.showRetry) {
                this.elements.retryButton.style.display = 'inline-flex';
            }

            if (this.elements.solutionButton && this.data.showSolution) {
                this.elements.solutionButton.style.display = 'inline-flex';
            }
        }

        disableInteractions() {
            const allDraggables = this.block.querySelectorAll('.draggable-element');
            allDraggables.forEach(element => {
                element.setAttribute('draggable', 'false');
                element.setAttribute('tabindex', '-1');
                element.style.pointerEvents = 'none';
            });

            this.elements.dropZones.forEach(zone => {
                zone.setAttribute('tabindex', '-1');
                zone.style.pointerEvents = 'none';
            });
        }

        enableInteractions() {
            const allDraggables = this.block.querySelectorAll('.draggable-element');
            allDraggables.forEach(element => {
                element.setAttribute('draggable', 'true');
                element.setAttribute('tabindex', '0');
                element.style.pointerEvents = '';
            });

            this.elements.dropZones.forEach(zone => {
                zone.setAttribute('tabindex', '0');
                zone.style.pointerEvents = '';
            });
        }

        // ==========================================
        // RESET
        // ==========================================

        resetActivity() {
            // Reset state
            this.state = {
                placements: {},
                isChecked: false,
                score: 0,
                totalPoints: this.data.draggables.length,
                isDragging: false,
                isFullscreen: this.state.isFullscreen,
                scaleFactor: this.state.scaleFactor,
                cloneCounter: 0
            };

            // Remove all clones
            const clones = this.block.querySelectorAll('[data-is-clone="true"]');
            clones.forEach(clone => clone.remove());

            // Return all original elements to source
            this.elements.draggableElements.forEach(element => {
                if (element.parentElement !== this.elements.draggablesContainer) {
                    this.elements.draggablesContainer.appendChild(element);
                }
                element.classList.remove('result-correct', 'result-incorrect', 'feedback-correct', 'feedback-incorrect', 'solution-placed');

                const feedback = element.querySelector('.draggable-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }

                this.state.placements[element.dataset.draggableId] = null;
            });

            // Clear zones
            this.elements.dropZones.forEach(zone => {
                const zoneContent = zone.querySelector('.zone-content');
                zoneContent.innerHTML = '';
                zone.classList.remove('has-correct', 'has-incorrect');
            });

            // Reset controls
            if (this.elements.checkButton) {
                this.elements.checkButton.style.display = 'inline-flex';
                this.elements.checkButton.disabled = true;
            }

            if (this.elements.retryButton) {
                this.elements.retryButton.style.display = 'none';
            }

            if (this.elements.solutionButton) {
                this.elements.solutionButton.style.display = 'none';
            }

            // Hide results
            if (this.elements.results) {
                this.elements.results.style.display = 'none';
            }

            // Re-enable interactions
            this.enableInteractions();

            // Randomize again if enabled
            if (this.data.randomizeDraggables) {
                this.randomizeDraggableOrder();
            }

            this.announceToScreenReader(this.data.strings.retry);
        }

        // ==========================================
        // SHOW SOLUTION
        // ==========================================

        showSolutions() {
            // Place each draggable in its first correct zone
            this.data.draggables.forEach(draggable => {
                const element = this.block.querySelector(`[data-draggable-id="${draggable.id}"]:not([data-is-clone="true"])`);
                const correctZones = draggable.correctZones || [];

                if (element && correctZones.length > 0) {
                    const targetZoneId = correctZones[0];
                    const targetZone = this.block.querySelector(`[data-zone-id="${targetZoneId}"]`);

                    if (targetZone) {
                        this.dropElementInZone(element, targetZone);
                        element.classList.add('solution-placed');
                    }
                }
            });

            // Update state
            this.state.score = this.state.totalPoints;
            this.state.isChecked = true;

            this.displayResults();
            this.disableInteractions();

            // Hide solution button
            if (this.elements.solutionButton) {
                this.elements.solutionButton.style.display = 'none';
            }

            this.announceToScreenReader(this.data.strings.showSolution);
        }

        // ==========================================
        // UTILITIES
        // ==========================================

        randomizeDraggableOrder() {
            const elements = Array.from(this.block.querySelectorAll('.draggable-element:not([data-is-clone="true"])'));
            const shuffled = elements.sort(() => Math.random() - 0.5);

            shuffled.forEach(element => {
                this.elements.draggablesContainer.appendChild(element);
            });
        }

        announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;

            this.block.appendChild(announcement);

            setTimeout(() => announcement.remove(), 1000);
        }

        // Public API
        getPublicAPI() {
            return {
                reset: () => this.resetActivity(),
                check: () => this.checkAnswers(),
                showSolution: () => this.showSolutions(),
                getState: () => ({ ...this.state }),
                getScore: () => this.state.score,
                getMaxScore: () => this.state.totalPoints
            };
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    window.initDragAndDrop = function(blockElement) {
        const instance = new DragAndDrop(blockElement);
        return instance.getPublicAPI();
    };

    // Auto-initialize all blocks on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.wp-block-modular-blocks-drag-and-drop').forEach(block => {
            if (!block.dataset.initialized) {
                block.dataset.initialized = 'true';
                window.initDragAndDrop(block);
            }
        });
    });

})();
