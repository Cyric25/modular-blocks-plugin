/**
 * Drag and Drop Block Frontend JavaScript
 * H5P-inspired drag and drop functionality for WordPress
 */

(function() {
    'use strict';

    window.initDragAndDrop = function(blockElement) {
        const data = JSON.parse(blockElement.dataset.dragDrop);
        const {
            draggables,
            dropZones,
            showFeedback,
            showRetry,
            showSolution,
            instantFeedback,
            enableSnap,
            showScore,
            randomizeDraggables,
            allowPartialScore,
            backgroundHeight,
            scoreText,
            successText,
            partialSuccessText,
            failText,
            strings
        } = data;

        let currentState = {
            placements: {},
            isChecked: false,
            score: 0,
            totalPoints: draggables.length,
            isDragging: false
        };

        const elements = {
            container: blockElement.querySelector('.drag-drop-container'),
            draggablesContainer: blockElement.querySelector('.draggables-container'),
            dropArea: blockElement.querySelector('.drop-area-container'),
            dropZones: blockElement.querySelectorAll('.drop-zone'),
            draggableElements: blockElement.querySelectorAll('.draggable-element'),
            checkButton: blockElement.querySelector('.drag-drop-check'),
            retryButton: blockElement.querySelector('.drag-drop-retry'),
            solutionButton: blockElement.querySelector('.drag-drop-solution'),
            results: blockElement.querySelector('.drag-drop-results')
        };

        function initializeDragAndDrop() {
            setupDraggableElements();
            setupDropZones();
            setupControls();
            updateCheckButtonState();

            if (randomizeDraggables) {
                randomizeDraggableOrder();
            }
        }

        function setupDraggableElements() {
            elements.draggableElements.forEach(element => {
                const draggableId = element.dataset.draggableId;

                // Mouse events
                element.addEventListener('dragstart', handleDragStart);
                element.addEventListener('dragend', handleDragEnd);

                // Touch events for mobile
                element.addEventListener('touchstart', handleTouchStart, { passive: false });
                element.addEventListener('touchmove', handleTouchMove, { passive: false });
                element.addEventListener('touchend', handleTouchEnd, { passive: false });

                // Keyboard events
                element.addEventListener('keydown', handleKeyDown);

                // Click events for keyboard users
                element.addEventListener('click', handleElementClick);

                // Set initial state
                element.setAttribute('aria-grabbed', 'false');
                currentState.placements[draggableId] = null;
            });
        }

        function setupDropZones() {
            elements.dropZones.forEach(zone => {
                const zoneId = zone.dataset.zoneId;

                // Drag events
                zone.addEventListener('dragover', handleDragOver);
                zone.addEventListener('drop', handleDrop);
                zone.addEventListener('dragenter', handleDragEnter);
                zone.addEventListener('dragleave', handleDragLeave);

                // Keyboard events
                zone.addEventListener('keydown', handleZoneKeyDown);
                zone.addEventListener('click', handleZoneClick);

                // Set initial state
                zone.setAttribute('aria-dropeffect', 'move');
            });
        }

        function setupControls() {
            elements.checkButton?.addEventListener('click', checkAnswers);
            elements.retryButton?.addEventListener('click', resetActivity);
            elements.solutionButton?.addEventListener('click', showSolutions);
        }

        // Drag and Drop Event Handlers
        let draggedElement = null;
        let touchData = null;

        function handleDragStart(event) {
            draggedElement = event.target;
            currentState.isDragging = true;

            event.target.setAttribute('aria-grabbed', 'true');
            event.target.classList.add('dragging');

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', event.target.dataset.draggableId);

            // Add visual feedback
            elements.dropZones.forEach(zone => {
                zone.classList.add('drag-active');
            });
        }

        function handleDragEnd(event) {
            event.target.setAttribute('aria-grabbed', 'false');
            event.target.classList.remove('dragging');

            draggedElement = null;
            currentState.isDragging = false;

            // Remove visual feedback
            elements.dropZones.forEach(zone => {
                zone.classList.remove('drag-active', 'drag-over');
            });
        }

        function handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        }

        function handleDragEnter(event) {
            event.preventDefault();
            event.target.closest('.drop-zone').classList.add('drag-over');
        }

        function handleDragLeave(event) {
            const zone = event.target.closest('.drop-zone');
            if (zone && !zone.contains(event.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        }

        function handleDrop(event) {
            event.preventDefault();
            const zone = event.target.closest('.drop-zone');
            const draggableId = event.dataTransfer.getData('text/plain');
            const draggableElement = blockElement.querySelector(`[data-draggable-id="${draggableId}"]`);

            if (zone && draggableElement) {
                dropElementInZone(draggableElement, zone);
            }

            zone.classList.remove('drag-over');
        }

        // Touch Event Handlers
        function handleTouchStart(event) {
            const element = event.target.closest('.draggable-element');
            if (!element) return;

            touchData = {
                element: element,
                startX: event.touches[0].clientX,
                startY: event.touches[0].clientY,
                elementStartX: element.offsetLeft,
                elementStartY: element.offsetTop
            };

            element.classList.add('dragging');
            currentState.isDragging = true;

            // Create touch clone for visual feedback
            createTouchClone(element, event.touches[0]);
        }

        function handleTouchMove(event) {
            if (!touchData) return;

            event.preventDefault();

            const touch = event.touches[0];
            const deltaX = touch.clientX - touchData.startX;
            const deltaY = touch.clientY - touchData.startY;

            // Move the clone
            if (touchData.clone) {
                touchData.clone.style.left = (touch.clientX - touchData.clone.offsetWidth / 2) + 'px';
                touchData.clone.style.top = (touch.clientY - touchData.clone.offsetHeight / 2) + 'px';
            }

            // Check for drop zone collision
            const dropZone = getDropZoneAtPosition(touch.clientX, touch.clientY);
            highlightDropZone(dropZone);
        }

        function handleTouchEnd(event) {
            if (!touchData) return;

            const touch = event.changedTouches[0];
            const dropZone = getDropZoneAtPosition(touch.clientX, touch.clientY);

            if (dropZone && touchData.element) {
                dropElementInZone(touchData.element, dropZone);
            }

            // Cleanup
            cleanupTouch();
        }

        function createTouchClone(element, touch) {
            const clone = element.cloneNode(true);
            clone.classList.add('touch-clone');
            clone.style.position = 'fixed';
            clone.style.pointerEvents = 'none';
            clone.style.zIndex = '9999';
            clone.style.opacity = '0.8';
            clone.style.left = (touch.clientX - element.offsetWidth / 2) + 'px';
            clone.style.top = (touch.clientY - element.offsetHeight / 2) + 'px';

            document.body.appendChild(clone);
            touchData.clone = clone;
        }

        function getDropZoneAtPosition(x, y) {
            const elementAtPoint = document.elementFromPoint(x, y);
            return elementAtPoint ? elementAtPoint.closest('.drop-zone') : null;
        }

        function highlightDropZone(zone) {
            // Remove previous highlights
            elements.dropZones.forEach(z => z.classList.remove('drag-over'));

            // Highlight current zone
            if (zone) {
                zone.classList.add('drag-over');
            }
        }

        function cleanupTouch() {
            if (touchData?.clone) {
                document.body.removeChild(touchData.clone);
            }

            if (touchData?.element) {
                touchData.element.classList.remove('dragging');
            }

            // Remove all highlights
            elements.dropZones.forEach(zone => {
                zone.classList.remove('drag-over', 'drag-active');
            });

            touchData = null;
            currentState.isDragging = false;
        }

        // Keyboard Event Handlers
        let selectedElement = null;
        let selectedZone = null;

        function handleKeyDown(event) {
            const element = event.target;

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (selectedElement === element) {
                        selectedElement = null;
                        element.classList.remove('selected');
                        announceToScreenReader(strings.returnToStart);
                    } else {
                        selectElement(element);
                    }
                    break;
                case 'Escape':
                    if (selectedElement) {
                        unselectAll();
                        announceToScreenReader(strings.returnToStart);
                    }
                    break;
            }
        }

        function handleZoneKeyDown(event) {
            const zone = event.target;

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (selectedElement) {
                        dropElementInZone(selectedElement, zone);
                        unselectAll();
                    } else {
                        selectZone(zone);
                    }
                    break;
                case 'Escape':
                    unselectAll();
                    break;
            }
        }

        function handleElementClick(event) {
            if (!currentState.isDragging) {
                const element = event.target.closest('.draggable-element');
                if (selectedElement === element) {
                    unselectAll();
                } else {
                    selectElement(element);
                }
            }
        }

        function handleZoneClick(event) {
            if (!currentState.isDragging && selectedElement) {
                const zone = event.target.closest('.drop-zone');
                if (zone) {
                    dropElementInZone(selectedElement, zone);
                    unselectAll();
                }
            }
        }

        function selectElement(element) {
            unselectAll();
            selectedElement = element;
            element.classList.add('selected');
            element.setAttribute('aria-selected', 'true');
            announceToScreenReader(strings.dragToZone);

            // Highlight available drop zones
            elements.dropZones.forEach(zone => {
                zone.classList.add('available');
            });
        }

        function selectZone(zone) {
            unselectAll();
            selectedZone = zone;
            zone.classList.add('selected');
            zone.setAttribute('aria-selected', 'true');
        }

        function unselectAll() {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement.setAttribute('aria-selected', 'false');
            }

            if (selectedZone) {
                selectedZone.classList.remove('selected');
                selectedZone.setAttribute('aria-selected', 'false');
            }

            // Remove zone highlighting
            elements.dropZones.forEach(zone => {
                zone.classList.remove('available');
            });

            selectedElement = null;
            selectedZone = null;
        }

        // Core Drop Logic
        function dropElementInZone(element, zone) {
            const draggableId = element.dataset.draggableId;
            const zoneId = zone.dataset.zoneId;
            const acceptMultiple = zone.dataset.acceptMultiple === 'true';
            const zoneContent = zone.querySelector('.zone-content');

            // Check if zone accepts multiple elements
            if (!acceptMultiple && zoneContent.children.length > 0) {
                // Return existing element to source
                const existingElement = zoneContent.firstElementChild;
                returnElementToSource(existingElement);
            }

            // Remove element from current position
            if (currentState.placements[draggableId]) {
                const currentZone = blockElement.querySelector(`[data-zone-id="${currentState.placements[draggableId]}"]`);
                if (currentZone) {
                    const currentZoneContent = currentZone.querySelector('.zone-content');
                    if (currentZoneContent.contains(element)) {
                        currentZoneContent.removeChild(element);
                    }
                }
            } else {
                // Remove from draggables container
                if (elements.draggablesContainer.contains(element)) {
                    elements.draggablesContainer.removeChild(element);
                }
            }

            // Add to new zone
            zoneContent.appendChild(element);
            currentState.placements[draggableId] = zoneId;

            // Apply snap positioning if enabled
            if (enableSnap) {
                element.style.position = 'static';
                element.style.transform = 'none';
            }

            // Update ARIA states
            element.setAttribute('aria-describedby', zone.id || `zone-${zoneId}`);
            zone.setAttribute('aria-expanded', 'true');

            // Instant feedback
            if (instantFeedback) {
                provideFeedbackForElement(element, zone);
            }

            updateCheckButtonState();
            announceToScreenReader(strings.correct);
        }

        function returnElementToSource(element) {
            const draggableId = element.dataset.draggableId;

            // Remove from current zone
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }

            // Return to draggables container
            elements.draggablesContainer.appendChild(element);
            currentState.placements[draggableId] = null;

            // Reset styles
            element.style.position = '';
            element.style.transform = '';
            element.setAttribute('aria-describedby', '');

            updateCheckButtonState();
        }

        function provideFeedbackForElement(element, zone) {
            const draggableId = element.dataset.draggableId;
            const zoneId = zone.dataset.zoneId;
            const correctZones = JSON.parse(element.dataset.correctZones || '[]');
            const isCorrect = correctZones.includes(zoneId);

            const feedback = element.querySelector('.draggable-feedback');
            if (feedback) {
                feedback.textContent = isCorrect ? strings.correct : strings.incorrect;
                feedback.className = `draggable-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                feedback.style.display = 'block';

                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 2000);
            }

            // Visual feedback
            element.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
            setTimeout(() => {
                element.classList.remove('feedback-correct', 'feedback-incorrect');
            }, 1000);
        }

        // Answer Checking
        function checkAnswers() {
            if (currentState.isChecked) return;

            currentState.isChecked = true;
            currentState.score = 0;

            const results = [];

            draggables.forEach(draggable => {
                const element = blockElement.querySelector(`[data-draggable-id="${draggable.id}"]`);
                const placedZone = currentState.placements[draggable.id];
                const correctZones = draggable.correctZones || [];
                const isCorrect = placedZone && correctZones.includes(placedZone);

                if (isCorrect) {
                    currentState.score++;
                }

                results.push({
                    element,
                    draggable,
                    placedZone,
                    correctZones,
                    isCorrect
                });

                // Visual feedback
                if (element) {
                    element.classList.add(isCorrect ? 'result-correct' : 'result-incorrect');

                    if (showFeedback) {
                        const feedback = element.querySelector('.draggable-feedback');
                        if (feedback) {
                            feedback.textContent = isCorrect ? strings.correct : strings.incorrect;
                            feedback.className = `draggable-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                            feedback.style.display = 'block';
                        }
                    }
                }
            });

            // Show results
            displayResults();
            updateControls();

            // Disable further interactions
            disableInteractions();
        }

        function displayResults() {
            if (!elements.results || !showScore) return;

            const scoreDisplay = elements.results.querySelector('.score-display');
            const messageDisplay = elements.results.querySelector('.result-message');
            const feedbackDisplay = elements.results.querySelector('.placement-feedback');

            // Score display
            if (scoreDisplay) {
                const scoreMessage = scoreText
                    .replace('@score', currentState.score)
                    .replace('@total', currentState.totalPoints);
                scoreDisplay.textContent = scoreMessage;
            }

            // Result message
            if (messageDisplay) {
                let message = '';
                const percentage = (currentState.score / currentState.totalPoints) * 100;

                if (percentage === 100) {
                    message = successText;
                } else if (percentage > 50 && allowPartialScore) {
                    message = partialSuccessText;
                } else {
                    message = failText;
                }

                messageDisplay.textContent = message;
                messageDisplay.className = `result-message ${percentage === 100 ? 'success' : percentage > 50 ? 'partial' : 'fail'}`;
            }

            // Detailed feedback
            if (feedbackDisplay && showFeedback) {
                const feedbackItems = draggables.map(draggable => {
                    const placedZone = currentState.placements[draggable.id];
                    const correctZones = draggable.correctZones || [];
                    const isCorrect = placedZone && correctZones.includes(placedZone);

                    return `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <span class="feedback-element">${draggable.content}</span>
                        <span class="feedback-status">${isCorrect ? strings.correct : strings.incorrect}</span>
                    </div>`;
                }).join('');

                feedbackDisplay.innerHTML = feedbackItems;
            }

            elements.results.style.display = 'block';

            // Announce results to screen readers
            const announcement = `${strings.check} ${currentState.score} ${strings.correct} ${strings.incorrect} ${currentState.totalPoints - currentState.score}`;
            announceToScreenReader(announcement);
        }

        function updateControls() {
            elements.checkButton.style.display = 'none';

            if (elements.retryButton && showRetry) {
                elements.retryButton.style.display = 'inline-block';
            }

            if (elements.solutionButton && showSolution) {
                elements.solutionButton.style.display = 'inline-block';
            }
        }

        function disableInteractions() {
            elements.draggableElements.forEach(element => {
                element.setAttribute('draggable', 'false');
                element.setAttribute('tabindex', '-1');
                element.style.pointerEvents = 'none';
            });

            elements.dropZones.forEach(zone => {
                zone.setAttribute('tabindex', '-1');
                zone.style.pointerEvents = 'none';
            });
        }

        function enableInteractions() {
            elements.draggableElements.forEach(element => {
                element.setAttribute('draggable', 'true');
                element.setAttribute('tabindex', '0');
                element.style.pointerEvents = '';
            });

            elements.dropZones.forEach(zone => {
                zone.setAttribute('tabindex', '0');
                zone.style.pointerEvents = '';
            });
        }

        // Reset and Solution Functions
        function resetActivity() {
            currentState = {
                placements: {},
                isChecked: false,
                score: 0,
                totalPoints: draggables.length,
                isDragging: false
            };

            // Return all elements to source
            elements.draggableElements.forEach(element => {
                returnElementToSource(element);
                element.classList.remove('result-correct', 'result-incorrect', 'feedback-correct', 'feedback-incorrect');

                const feedback = element.querySelector('.draggable-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }
            });

            // Clear zones
            elements.dropZones.forEach(zone => {
                const zoneContent = zone.querySelector('.zone-content');
                zoneContent.innerHTML = '';
                zone.classList.remove('has-correct', 'has-incorrect');
            });

            // Reset controls
            elements.checkButton.style.display = 'inline-block';
            elements.checkButton.disabled = true;

            if (elements.retryButton) {
                elements.retryButton.style.display = 'none';
            }

            if (elements.solutionButton) {
                elements.solutionButton.style.display = 'none';
            }

            // Hide results
            if (elements.results) {
                elements.results.style.display = 'none';
            }

            // Re-enable interactions
            enableInteractions();

            // Randomize again if enabled
            if (randomizeDraggables) {
                randomizeDraggableOrder();
            }

            announceToScreenReader(strings.retry);
        }

        function showSolutions() {
            // Place each draggable in its first correct zone
            draggables.forEach(draggable => {
                const element = blockElement.querySelector(`[data-draggable-id="${draggable.id}"]`);
                const correctZones = draggable.correctZones || [];

                if (element && correctZones.length > 0) {
                    const targetZoneId = correctZones[0];
                    const targetZone = blockElement.querySelector(`[data-zone-id="${targetZoneId}"]`);

                    if (targetZone) {
                        dropElementInZone(element, targetZone);
                        element.classList.add('solution-placed');
                    }
                }
            });

            // Update state to reflect solutions
            currentState.score = currentState.totalPoints;
            currentState.isChecked = true;

            displayResults();
            disableInteractions();

            // Hide solution button
            if (elements.solutionButton) {
                elements.solutionButton.style.display = 'none';
            }

            announceToScreenReader(strings.showSolution);
        }

        // Utility Functions
        function updateCheckButtonState() {
            const hasAnyPlacement = Object.values(currentState.placements).some(placement => placement !== null);
            elements.checkButton.disabled = !hasAnyPlacement;
        }

        function randomizeDraggableOrder() {
            const elementsArray = Array.from(elements.draggableElements);
            const shuffled = elementsArray.sort(() => Math.random() - 0.5);

            shuffled.forEach(element => {
                elements.draggablesContainer.appendChild(element);
            });
        }

        function announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;

            blockElement.appendChild(announcement);

            setTimeout(() => {
                blockElement.removeChild(announcement);
            }, 1000);
        }

        // Initialize the activity
        initializeDragAndDrop();

        // Return public API for external control
        return {
            reset: resetActivity,
            check: checkAnswers,
            showSolution: showSolutions,
            getState: () => ({ ...currentState })
        };
    };

})();