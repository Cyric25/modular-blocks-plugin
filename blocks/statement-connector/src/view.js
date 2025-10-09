/**
 * Statement Connector Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initStatementConnector = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-connector-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const canvas = blockElement.querySelector('.connector-canvas');
		const leftItems = blockElement.querySelectorAll('.left-item');
		const rightItems = blockElement.querySelectorAll('.right-item');
		const checkButton = blockElement.querySelector('.connector-check');
		const retryButton = blockElement.querySelector('.connector-retry');
		const solutionButton = blockElement.querySelector('.connector-solution');
		const resultsContainer = blockElement.querySelector('.connector-results');
		const resultMessage = blockElement.querySelector('.result-message');
		const scoreDisplay = blockElement.querySelector('.score-display');

		let connections = [];
		let isDrawing = false;
		let currentLine = null;
		let startItem = null;
		let isChecked = false;

		// Setup SVG canvas
		setupCanvas();

		// Setup connection points
		setupConnectionPoints();

		// Setup buttons
		if (checkButton) {
			checkButton.addEventListener('click', checkAnswers);
		}
		if (retryButton) {
			retryButton.addEventListener('click', retry);
		}
		if (solutionButton) {
			solutionButton.addEventListener('click', showSolution);
		}

		function setupCanvas() {
			const wrapper = canvas.parentElement;
			const rect = wrapper.getBoundingClientRect();
			canvas.setAttribute('width', rect.width);
			canvas.setAttribute('height', rect.height);

			// Redraw on window resize
			window.addEventListener('resize', () => {
				const newRect = wrapper.getBoundingClientRect();
				canvas.setAttribute('width', newRect.width);
				canvas.setAttribute('height', newRect.height);
				redrawConnections();
			});
		}

		function setupConnectionPoints() {
			leftItems.forEach(item => {
				const point = item.querySelector('.connection-point');
				point.addEventListener('mousedown', (e) => startConnection(e, item, 'left'));
				point.addEventListener('touchstart', (e) => startConnection(e, item, 'left'));
			});

			rightItems.forEach(item => {
				const point = item.querySelector('.connection-point');
				point.addEventListener('mousedown', (e) => startConnection(e, item, 'right'));
				point.addEventListener('touchstart', (e) => startConnection(e, item, 'right'));
			});

			document.addEventListener('mousemove', dragConnection);
			document.addEventListener('touchmove', dragConnection);
			document.addEventListener('mouseup', endConnection);
			document.addEventListener('touchend', endConnection);
		}

		function startConnection(e, item, side) {
			if (isChecked) return;

			e.preventDefault();
			isDrawing = true;
			startItem = { element: item, side: side };

			// Create temporary line
			currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			const point = item.querySelector('.connection-point');
			const coords = getPointCoordinates(point);

			currentLine.setAttribute('x1', coords.x);
			currentLine.setAttribute('y1', coords.y);
			currentLine.setAttribute('x2', coords.x);
			currentLine.setAttribute('y2', coords.y);
			currentLine.setAttribute('stroke', '#0073aa');
			currentLine.setAttribute('stroke-width', config.lineWidth);
			currentLine.classList.add('temp-line');

			canvas.appendChild(currentLine);
		}

		function dragConnection(e) {
			if (!isDrawing || !currentLine) return;

			const canvasRect = canvas.getBoundingClientRect();
			let clientX, clientY;

			if (e.type.startsWith('touch')) {
				const touch = e.touches[0];
				clientX = touch.clientX;
				clientY = touch.clientY;
			} else {
				clientX = e.clientX;
				clientY = e.clientY;
			}

			const x = clientX - canvasRect.left;
			const y = clientY - canvasRect.top;

			currentLine.setAttribute('x2', x);
			currentLine.setAttribute('y2', y);
		}

		function endConnection(e) {
			if (!isDrawing) return;

			isDrawing = false;

			// Check if we ended on a valid connection point
			const target = document.elementFromPoint(
				e.clientX || e.changedTouches[0].clientX,
				e.clientY || e.changedTouches[0].clientY
			);

			const endPoint = target?.closest('.connection-point');
			const endItem = endPoint?.closest('.connector-item');

			if (endItem && endItem !== startItem.element) {
				const endSide = endItem.classList.contains('left-item') ? 'left' : 'right';

				// Only allow connections between left and right
				if (startItem.side !== endSide) {
					createConnection(startItem.element, endItem);
				}
			}

			// Remove temporary line
			if (currentLine) {
				currentLine.remove();
				currentLine = null;
			}

			startItem = null;
		}

		function createConnection(fromItem, toItem) {
			const fromId = fromItem.getAttribute('data-item-id');
			const toId = toItem.getAttribute('data-item-id');

			// Check if connection already exists
			const existingIndex = connections.findIndex(c =>
				(c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
			);

			if (existingIndex > -1 && !config.allowMultipleConnections) {
				// Remove existing connection
				connections.splice(existingIndex, 1);
			}

			// Ensure correct order (left -> right)
			const leftId = fromItem.classList.contains('left-item') ? fromId : toId;
			const rightId = fromItem.classList.contains('left-item') ? toId : fromId;

			// Remove any previous connection from the same left item if not allowing multiple
			if (!config.allowMultipleConnections) {
				connections = connections.filter(c => c.from !== leftId);
			}

			// Add new connection
			connections.push({ from: leftId, to: rightId });

			redrawConnections();

			// Instant feedback if enabled
			if (config.instantFeedback) {
				checkSingleConnection(leftId, rightId);
			}
		}

		function redrawConnections() {
			// Clear all non-temp lines
			const lines = canvas.querySelectorAll('line:not(.temp-line)');
			lines.forEach(line => line.remove());

			// Draw each connection
			connections.forEach((connection, index) => {
				const fromItem = blockElement.querySelector(`[data-item-id="${connection.from}"]`);
				const toItem = blockElement.querySelector(`[data-item-id="${connection.to}"]`);

				if (fromItem && toItem) {
					drawLine(fromItem, toItem, connection);
				}
			});
		}

		function drawLine(fromItem, toItem, connection) {
			const fromPoint = fromItem.querySelector('.connection-point');
			const toPoint = toItem.querySelector('.connection-point');

			const from = getPointCoordinates(fromPoint);
			const to = getPointCoordinates(toPoint);

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', from.x);
			line.setAttribute('y1', from.y);
			line.setAttribute('x2', to.x);
			line.setAttribute('y2', to.y);
			line.setAttribute('stroke', fromItem.querySelector('.connection-point').style.backgroundColor || '#0073aa');
			line.setAttribute('stroke-width', config.lineWidth);
			line.setAttribute('data-from', connection.from);
			line.setAttribute('data-to', connection.to);

			if (config.animateConnections) {
				line.classList.add('animated');
			}

			canvas.appendChild(line);
		}

		function getPointCoordinates(point) {
			const canvasRect = canvas.getBoundingClientRect();
			const pointRect = point.getBoundingClientRect();

			return {
				x: pointRect.left + pointRect.width / 2 - canvasRect.left,
				y: pointRect.top + pointRect.height / 2 - canvasRect.top
			};
		}

		function checkSingleConnection(fromId, toId) {
			const rightItem = blockElement.querySelector(`[data-item-id="${toId}"]`);
			const correctConnection = rightItem?.getAttribute('data-correct-connection');

			const line = canvas.querySelector(`[data-from="${fromId}"][data-to="${toId}"]`);
			if (line) {
				const isCorrect = correctConnection === fromId;
				line.setAttribute('stroke', isCorrect ? '#00a32a' : '#d63638');
				line.classList.add(isCorrect ? 'correct' : 'incorrect');
			}
		}

		function checkAnswers() {
			isChecked = true;
			let score = 0;
			let totalConnections = config.rightColumn.items.length;

			// Check each connection
			connections.forEach(connection => {
				const rightItem = blockElement.querySelector(`[data-item-id="${connection.to}"]`);
				const correctConnection = rightItem?.getAttribute('data-correct-connection');

				const isCorrect = correctConnection === connection.from;
				const line = canvas.querySelector(`[data-from="${connection.from}"][data-to="${connection.to}"]`);

				if (line) {
					line.setAttribute('stroke', isCorrect ? '#00a32a' : '#d63638');
					line.classList.add(isCorrect ? 'correct' : 'incorrect');
				}

				if (isCorrect) {
					score++;
				}
			});

			// Display results
			displayResults(score, totalConnections);

			// Show retry/solution buttons
			checkButton.style.display = 'none';
			if (retryButton) retryButton.style.display = 'inline-block';
			if (solutionButton) solutionButton.style.display = 'inline-block';
		}

		function displayResults(score, total) {
			if (!resultsContainer) return;

			resultsContainer.style.display = 'block';

			const percentage = total > 0 ? (score / total) * 100 : 0;
			let message = '';

			if (percentage === 100) {
				message = config.successText;
			} else if (percentage >= 50) {
				message = config.partialSuccessText;
			} else {
				message = config.failText;
			}

			if (resultMessage) {
				resultMessage.textContent = message;
			}

			if (scoreDisplay) {
				scoreDisplay.textContent = `${score} von ${total} richtig`;
			}
		}

		function retry() {
			isChecked = false;
			connections = [];
			redrawConnections();

			// Hide results
			if (resultsContainer) {
				resultsContainer.style.display = 'none';
			}

			// Show check button, hide retry/solution
			checkButton.style.display = 'inline-block';
			if (retryButton) retryButton.style.display = 'none';
			if (solutionButton) solutionButton.style.display = 'none';
		}

		function showSolution() {
			connections = [];

			// Create correct connections
			config.rightColumn.items.forEach(rightItem => {
				if (rightItem.correctConnection) {
					connections.push({
						from: rightItem.correctConnection,
						to: rightItem.id
					});
				}
			});

			redrawConnections();

			// Mark all as correct
			const lines = canvas.querySelectorAll('line');
			lines.forEach(line => {
				line.setAttribute('stroke', '#00a32a');
				line.classList.add('correct', 'solution');
			});

			// Update results
			if (resultsContainer) {
				resultsContainer.style.display = 'block';
				if (resultMessage) {
					resultMessage.textContent = 'Lösung wird angezeigt.';
				}
				if (scoreDisplay) {
					scoreDisplay.textContent = '';
				}
			}

			// Hide solution button
			if (solutionButton) {
				solutionButton.style.display = 'none';
			}
		}
	};

	// Initialize all statement-connector blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-statement-connector');
		blocks.forEach(block => {
			window.initStatementConnector(block);
		});
	});
})();
