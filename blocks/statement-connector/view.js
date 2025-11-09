/**
 * Frontend JavaScript for Statement Connector Block
 *
 * Provides interactive drag & drop connection functionality with visual feedback
 */

(function() {
    'use strict';

    /**
     * Initialize statement connector functionality
     * @param {HTMLElement} element - The connector block element
     */
    function initStatementConnector(element) {
        if (!element) return;

        const connectorData = JSON.parse(element.dataset.connector || '{}');
        const container = element.querySelector('.connector-container');
        const canvas = element.querySelector('.connection-canvas');
        const svg = element.querySelector('.connection-svg');
        const dragLineSvg = element.querySelector('.drag-line-svg');
        const dragLine = element.querySelector('.drag-line');
        const leftItems = element.querySelectorAll('.left-item');
        const rightItems = element.querySelectorAll('.right-item');
        const connectionPoints = element.querySelectorAll('.connection-point');
        const checkButton = element.querySelector('.connector-check');
        const retryButton = element.querySelector('.connector-retry');
        const solutionButton = element.querySelector('.connector-solution');
        const resultsSection = element.querySelector('.connector-results');
        const scoreDisplay = element.querySelector('.score-display');
        const resultMessage = element.querySelector('.result-message');
        const connectionFeedback = element.querySelector('.connection-feedback');

        if (!container || !svg || !checkButton) return;

        let isDragging = false;
        let dragStartPoint = null;
        let currentConnections = [];
        let isCompleted = false;
        let dragStartPos = { x: 0, y: 0 };

        /**
         * Get connection point position relative to canvas
         * @param {HTMLElement} point - Connection point element
         */
        function getConnectionPointPosition(point) {
            const pointRect = point.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();

            return {
                x: pointRect.left + pointRect.width / 2 - canvasRect.left,
                y: pointRect.top + pointRect.height / 2 - canvasRect.top
            };
        }

        /**
         * Create SVG connection line
         * @param {Object} connection - Connection object with from/to item IDs
         * @param {string} className - CSS class for styling
         */
        function createConnectionLine(connection, className = 'user-connection') {
            const fromPoint = element.querySelector(`[data-item="${connection.from}"]`);
            const toPoint = element.querySelector(`[data-item="${connection.to}"]`);

            if (!fromPoint || !toPoint) return null;

            const fromPos = getConnectionPointPosition(fromPoint);
            const toPos = getConnectionPointPosition(toPoint);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromPos.x);
            line.setAttribute('y1', fromPos.y);
            line.setAttribute('x2', toPos.x);
            line.setAttribute('y2', toPos.y);
            line.setAttribute('class', className);
            line.setAttribute('data-connection', `${connection.from}-${connection.to}`);

            // Style based on connection data
            const fromItem = connectorData.leftItems?.find(item => item.id === connection.from);
            const color = fromItem?.color || '#0073aa';

            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', connectorData.lineWidth || 3);

            if (connectorData.connectionStyle === 'arrow') {
                line.setAttribute('marker-end', `url(#arrowhead-${element.id.split('-').pop()})`);
            }

            if (connectorData.animateConnections && className === 'user-connection') {
                line.setAttribute('stroke-dasharray', '5,5');
                line.innerHTML = '<animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite"/>';
            }

            return line;
        }

        /**
         * Add connection between two items
         * @param {string} fromId - ID of source item
         * @param {string} toId - ID of target item
         */
        function addConnection(fromId, toId) {
            // Check if connection already exists
            const existingIndex = currentConnections.findIndex(conn =>
                conn.from === fromId || (!connectorData.allowMultipleConnections && conn.to === toId)
            );

            // Remove existing connection if not allowing multiple
            if (existingIndex >= 0) {
                removeConnection(existingIndex);
            }

            // Add new connection
            const connection = { from: fromId, to: toId };
            currentConnections.push(connection);

            // Create visual connection
            const line = createConnectionLine(connection);
            if (line) {
                svg.appendChild(line);
            }

            // Update connection points visual state
            updateConnectionPointStates();

            // Update check button state
            updateCheckButton();

            // Instant feedback if enabled
            if (connectorData.instantFeedback) {
                showInstantFeedback(connection);
            }
        }

        /**
         * Remove connection by index
         * @param {number} index - Index of connection to remove
         */
        function removeConnection(index) {
            if (index < 0 || index >= currentConnections.length) return;

            const connection = currentConnections[index];
            const lineElement = svg.querySelector(`[data-connection="${connection.from}-${connection.to}"]`);

            if (lineElement) {
                lineElement.remove();
            }

            currentConnections.splice(index, 1);
            updateConnectionPointStates();
            updateCheckButton();
        }

        /**
         * Remove all user connections
         */
        function removeAllConnections() {
            currentConnections = [];
            const userLines = svg.querySelectorAll('.user-connection');
            userLines.forEach(line => line.remove());
            updateConnectionPointStates();
            updateCheckButton();
        }

        /**
         * Update visual states of connection points
         */
        function updateConnectionPointStates() {
            connectionPoints.forEach(point => {
                const itemId = point.dataset.item;
                const isConnected = currentConnections.some(conn =>
                    conn.from === itemId || conn.to === itemId
                );

                point.classList.toggle('connected', isConnected);
                point.parentElement.classList.toggle('connected', isConnected);
            });
        }

        /**
         * Update check button state
         */
        function updateCheckButton() {
            if (isCompleted) return;

            const hasConnections = currentConnections.length > 0;
            checkButton.disabled = !hasConnections;
        }

        /**
         * Show instant feedback for a connection
         * @param {Object} connection - Connection object
         */
        function showInstantFeedback(connection) {
            const correctConnections = connectorData.connections || [];
            const isCorrect = correctConnections.some(correct =>
                correct.from === connection.from && correct.to === connection.to
            );

            const fromPoint = element.querySelector(`[data-item="${connection.from}"]`);
            const toPoint = element.querySelector(`[data-item="${connection.to}"]`);

            if (fromPoint) {
                showFeedbackOnItem(fromPoint.parentElement, isCorrect);
            }
            if (toPoint) {
                showFeedbackOnItem(toPoint.parentElement, isCorrect);
            }
        }

        /**
         * Show feedback on item
         * @param {HTMLElement} item - Item element
         * @param {boolean} isCorrect - Whether feedback is positive
         */
        function showFeedbackOnItem(item, isCorrect) {
            item.classList.remove('feedback-correct', 'feedback-incorrect');
            item.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');

            setTimeout(() => {
                item.classList.remove('feedback-correct', 'feedback-incorrect');
            }, 2000);
        }

        /**
         * Handle drag start
         * @param {Event} event - Mouse or touch event
         * @param {HTMLElement} point - Connection point element
         */
        function startDrag(event, point) {
            if (isCompleted) return;

            event.preventDefault();
            isDragging = true;
            dragStartPoint = point;

            const pos = getConnectionPointPosition(point);
            dragStartPos = pos;

            // Show drag line
            dragLineSvg.style.display = 'block';
            dragLine.setAttribute('x1', pos.x);
            dragLine.setAttribute('y1', pos.y);
            dragLine.setAttribute('x2', pos.x);
            dragLine.setAttribute('y2', pos.y);

            // Visual feedback
            point.classList.add('dragging');
            container.classList.add('is-dragging');

            // Add global event listeners
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
        }

        /**
         * Handle drag move
         * @param {Event} event - Mouse or touch event
         */
        function handleDragMove(event) {
            if (!isDragging || !dragStartPoint) return;

            event.preventDefault();

            const canvasRect = canvas.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;

            const currentPos = {
                x: clientX - canvasRect.left,
                y: clientY - canvasRect.top
            };

            // Update drag line
            dragLine.setAttribute('x2', currentPos.x);
            dragLine.setAttribute('y2', currentPos.y);

            // Highlight potential drop targets
            const elementBelow = document.elementFromPoint(clientX, clientY);
            const dropTarget = elementBelow?.closest('.connection-point');

            // Remove previous highlights
            connectionPoints.forEach(point => point.classList.remove('drop-target'));

            if (dropTarget && canValidateConnection(dragStartPoint, dropTarget)) {
                dropTarget.classList.add('drop-target');
            }
        }

        /**
         * Handle drag end
         * @param {Event} event - Mouse or touch event
         */
        function handleDragEnd(event) {
            if (!isDragging || !dragStartPoint) return;

            const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
            const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

            const elementBelow = document.elementFromPoint(clientX, clientY);
            const dropTarget = elementBelow?.closest('.connection-point');

            // Clean up
            isDragging = false;
            dragLineSvg.style.display = 'none';
            dragStartPoint.classList.remove('dragging');
            container.classList.remove('is-dragging');

            connectionPoints.forEach(point => point.classList.remove('drop-target'));

            // Create connection if valid drop
            if (dropTarget && canValidateConnection(dragStartPoint, dropTarget)) {
                const fromId = dragStartPoint.dataset.item;
                const toId = dropTarget.dataset.item;
                addConnection(fromId, toId);
            }

            dragStartPoint = null;

            // Remove global event listeners
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        }

        /**
         * Validate if connection is allowed
         * @param {HTMLElement} fromPoint - Source connection point
         * @param {HTMLElement} toPoint - Target connection point
         */
        function canValidateConnection(fromPoint, toPoint) {
            if (!fromPoint || !toPoint || fromPoint === toPoint) return false;

            const fromColumn = fromPoint.closest('.connection-item').dataset.column;
            const toColumn = toPoint.closest('.connection-item').dataset.column;

            // Must connect between different columns
            return fromColumn !== toColumn;
        }

        /**
         * Check user connections and show results
         */
        function checkConnections() {
            if (isCompleted || currentConnections.length === 0) return;

            isCompleted = true;

            const correctConnections = connectorData.connections || [];
            let correctCount = 0;
            let totalExpected = correctConnections.length;

            // Check each user connection
            const feedback = currentConnections.map(userConn => {
                const isCorrect = correctConnections.some(correctConn =>
                    correctConn.from === userConn.from && correctConn.to === userConn.to
                );

                if (isCorrect) correctCount++;

                return {
                    connection: userConn,
                    correct: isCorrect
                };
            });

            // Calculate score
            const percentage = totalExpected > 0 ? Math.round((correctCount / totalExpected) * 100) : 0;
            const passed = percentage >= 80; // Could be configurable

            // Show visual feedback on connections
            showConnectionFeedback(feedback);

            // Show results
            showResults(correctCount, totalExpected, percentage, passed);

            // Update controls
            checkButton.style.display = 'none';
            if (retryButton && connectorData.showRetry) {
                retryButton.style.display = 'inline-block';
            }
            if (solutionButton && connectorData.showSolution) {
                solutionButton.style.display = 'inline-block';
            }
        }

        /**
         * Show visual feedback on connections
         * @param {Array} feedback - Array of feedback objects
         */
        function showConnectionFeedback(feedback) {
            feedback.forEach(({ connection, correct }) => {
                const line = svg.querySelector(`[data-connection="${connection.from}-${connection.to}"]`);
                if (line) {
                    line.classList.add(correct ? 'correct-connection' : 'incorrect-connection');
                    line.setAttribute('stroke', correct ? '#00a32a' : '#d63638');
                }

                // Update item feedback
                const fromItem = element.querySelector(`[data-item-id="${connection.from}"]`);
                const toItem = element.querySelector(`[data-item-id="${connection.to}"]`);

                if (fromItem) showItemFeedback(fromItem, correct);
                if (toItem) showItemFeedback(toItem, correct);
            });
        }

        /**
         * Show feedback on item
         * @param {HTMLElement} item - Item element
         * @param {boolean} correct - Whether connection is correct
         */
        function showItemFeedback(item, correct) {
            const feedbackElement = item.querySelector('.item-feedback');
            if (feedbackElement) {
                feedbackElement.style.display = 'block';
                feedbackElement.textContent = correct ?
                    connectorData.strings.correct :
                    connectorData.strings.incorrect;
                feedbackElement.className = `item-feedback ${correct ? 'correct' : 'incorrect'}`;
            }

            item.classList.add(correct ? 'feedback-correct' : 'feedback-incorrect');
        }

        /**
         * Show results section
         * @param {number} correct - Number of correct connections
         * @param {number} total - Total expected connections
         * @param {number} percentage - Score percentage
         * @param {boolean} passed - Whether user passed
         */
        function showResults(correct, total, percentage, passed) {
            if (!resultsSection) return;

            // Show results section
            resultsSection.style.display = 'block';

            // Update score display
            if (scoreDisplay) {
                scoreDisplay.textContent = `${correct}/${total} (${percentage}%)`;
            }

            // Update result message
            if (resultMessage) {
                let message;
                if (percentage === 100) {
                    message = connectorData.successText;
                } else if (percentage >= 50) {
                    message = connectorData.partialSuccessText;
                } else {
                    message = connectorData.failText;
                }

                resultMessage.textContent = message;
                resultMessage.className = `result-message ${passed ? 'success' : 'fail'}`;
            }

            // Show connection feedback
            if (connectionFeedback && connectorData.showFeedback) {
                const feedbackItems = currentConnections.map(conn => {
                    const fromItem = connectorData.leftItems?.find(item => item.id === conn.from);
                    const toItem = connectorData.rightItems?.find(item => item.id === conn.to);
                    const isCorrect = connectorData.connections?.some(correct =>
                        correct.from === conn.from && correct.to === conn.to
                    );

                    return `<div class="connection-feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <span class="connection-status">${isCorrect ? '✓' : '✗'}</span>
                        <span class="connection-text">${fromItem?.text} → ${toItem?.text}</span>
                    </div>`;
                }).join('');

                connectionFeedback.innerHTML = feedbackItems;
            }

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Reset to initial state
         */
        function resetConnector() {
            isCompleted = false;
            removeAllConnections();

            // Clear feedback
            element.querySelectorAll('.connection-item').forEach(item => {
                item.classList.remove('feedback-correct', 'feedback-incorrect');
                const feedback = item.querySelector('.item-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }
            });

            // Clear connection visual feedback
            svg.querySelectorAll('line').forEach(line => {
                line.classList.remove('correct-connection', 'incorrect-connection');
            });

            // Update controls
            checkButton.style.display = 'inline-block';
            checkButton.disabled = true;

            if (retryButton) retryButton.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'none';
        }

        /**
         * Show solution connections
         */
        function showSolution() {
            removeAllConnections();

            const correctConnections = connectorData.connections || [];
            correctConnections.forEach(connection => {
                const line = createConnectionLine(connection, 'solution-connection');
                if (line) {
                    line.classList.add('solution-connection');
                    line.setAttribute('stroke', '#00a32a');
                    line.setAttribute('stroke-width', (connectorData.lineWidth || 3) + 1);
                    svg.appendChild(line);
                }
            });

            // Update states
            updateConnectionPointStates();
        }

        // Event listeners for connection points
        connectionPoints.forEach(point => {
            point.addEventListener('mousedown', (event) => {
                startDrag(event, point);
            });

            point.addEventListener('touchstart', (event) => {
                startDrag(event, point);
            }, { passive: false });

            // Make focusable for keyboard navigation
            point.setAttribute('tabindex', '0');
            point.setAttribute('role', 'button');
        });

        // Control buttons
        if (checkButton) {
            checkButton.addEventListener('click', checkConnections);
        }

        if (retryButton) {
            retryButton.addEventListener('click', resetConnector);
        }

        if (solutionButton) {
            solutionButton.addEventListener('click', showSolution);
        }

        // Initialize
        updateCheckButton();

        // Handle window resize to update connection positions
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Redraw all connections
                const lines = svg.querySelectorAll('line');
                lines.forEach(line => {
                    const connectionId = line.dataset.connection;
                    if (connectionId) {
                        const [fromId, toId] = connectionId.split('-');
                        const fromPoint = element.querySelector(`[data-item="${fromId}"]`);
                        const toPoint = element.querySelector(`[data-item="${toId}"]`);

                        if (fromPoint && toPoint) {
                            const fromPos = getConnectionPointPosition(fromPoint);
                            const toPos = getConnectionPointPosition(toPoint);

                            line.setAttribute('x1', fromPos.x);
                            line.setAttribute('y1', fromPos.y);
                            line.setAttribute('x2', toPos.x);
                            line.setAttribute('y2', toPos.y);
                        }
                    }
                });
            }, 100);
        });
    }

    /**
     * Initialize all statement connector blocks on the page
     */
    function initAllStatementConnectors() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-statement-connector');
        blocks.forEach(initStatementConnector);
    }

    // Make function globally available for dynamic content
    window.initStatementConnector = initStatementConnector;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllStatementConnectors);
    } else {
        initAllStatementConnectors();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllStatementConnectors);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a connector block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-statement-connector')) {
                                initStatementConnector(node);
                            }
                            // Check if the added node contains connector blocks
                            const connectorBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-statement-connector');
                            if (connectorBlocks) {
                                connectorBlocks.forEach(initStatementConnector);
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