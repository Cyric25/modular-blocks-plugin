/**
 * Drag and Drop Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initDragAndDrop = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-drag-drop-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const container = blockElement.querySelector('.drag-and-drop-container');
		const draggablesContainer = blockElement.querySelector('.draggables-container');
		const dropZonesContainer = blockElement.querySelector('.drop-zones');
		const checkButton = blockElement.querySelector('.drag-drop-check');
		const retryButton = blockElement.querySelector('.drag-drop-retry');
		const solutionButton = blockElement.querySelector('.drag-drop-solution');
		const resultsContainer = blockElement.querySelector('.drag-drop-results');
		const resultMessage = blockElement.querySelector('.result-message');
		const scoreDisplay = blockElement.querySelector('.score-display');

		let draggedElement = null;
		let dropZoneStates = {};
		let isChecked = false;

		// Initialize drop zones state
		config.dropZones.forEach(zone => {
			dropZoneStates[zone.id] = [];
		});

		// Setup draggable elements
		const draggables = blockElement.querySelectorAll('.draggable-element');
		draggables.forEach(draggable => {
			draggable.addEventListener('dragstart', handleDragStart);
			draggable.addEventListener('dragend', handleDragEnd);
		});

		// Setup drop zones
		const dropZones = blockElement.querySelectorAll('.drop-zone');
		dropZones.forEach(zone => {
			zone.addEventListener('dragover', handleDragOver);
			zone.addEventListener('drop', handleDrop);
			zone.addEventListener('dragleave', handleDragLeave);
		});

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

		function handleDragStart(e) {
			if (isChecked) return;

			draggedElement = e.target;
			e.target.classList.add('dragging');
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', e.target.innerHTML);
		}

		function handleDragEnd(e) {
			e.target.classList.remove('dragging');
		}

		function handleDragOver(e) {
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.dataTransfer.dropEffect = 'move';
			e.target.classList.add('drag-over');
			return false;
		}

		function handleDragLeave(e) {
			e.target.classList.remove('drag-over');
		}

		function handleDrop(e) {
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			e.preventDefault();

			const dropZone = e.target.closest('.drop-zone');
			if (!dropZone || !draggedElement) return;

			dropZone.classList.remove('drag-over');

			const zoneId = dropZone.getAttribute('data-zone-id');
			const draggableId = draggedElement.getAttribute('data-draggable-id');
			const acceptMultiple = dropZone.getAttribute('data-accept-multiple') === 'true';

			// Check if zone already has element and doesn't accept multiple
			if (!acceptMultiple && dropZoneStates[zoneId].length > 0) {
				// Return existing element to draggables area
				const existingElement = dropZone.querySelector('.draggable-element');
				if (existingElement) {
					draggablesContainer.appendChild(existingElement);
					dropZoneStates[zoneId] = [];
				}
			}

			// Remove draggable from previous zone if it was in one
			Object.keys(dropZoneStates).forEach(key => {
				const index = dropZoneStates[key].indexOf(draggableId);
				if (index > -1) {
					dropZoneStates[key].splice(index, 1);
				}
			});

			// Add to new zone
			const clonedElement = draggedElement.cloneNode(true);
			clonedElement.addEventListener('dragstart', handleDragStart);
			clonedElement.addEventListener('dragend', handleDragEnd);

			if (config.enableSnap) {
				dropZone.appendChild(clonedElement);
			} else {
				// Calculate position relative to drop zone
				const rect = dropZone.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				clonedElement.style.position = 'absolute';
				clonedElement.style.left = x + 'px';
				clonedElement.style.top = y + 'px';
				dropZone.appendChild(clonedElement);
			}

			// Remove original from draggables container
			draggedElement.remove();

			// Update state
			dropZoneStates[zoneId].push(draggableId);

			// Instant feedback if enabled
			if (config.instantFeedback) {
				checkSingleDraggable(clonedElement, draggableId, zoneId);
			}

			draggedElement = null;
			return false;
		}

		function checkSingleDraggable(element, draggableId, zoneId) {
			const draggableConfig = config.draggables.find(d => d.id === draggableId);
			if (!draggableConfig) return;

			const isCorrect = draggableConfig.correctZones.includes(zoneId);

			element.classList.remove('correct', 'incorrect');
			element.classList.add(isCorrect ? 'correct' : 'incorrect');
		}

		function checkAnswers() {
			isChecked = true;
			let score = 0;
			let total = config.draggables.length;

			// Check each draggable
			config.draggables.forEach(draggableConfig => {
				let isPlacedCorrectly = false;

				Object.keys(dropZoneStates).forEach(zoneId => {
					if (dropZoneStates[zoneId].includes(draggableConfig.id)) {
						const isCorrect = draggableConfig.correctZones.includes(zoneId);

						// Find the element in the DOM
						const dropZone = blockElement.querySelector(`[data-zone-id="${zoneId}"]`);
						const draggableElement = dropZone?.querySelector(`[data-draggable-id="${draggableConfig.id}"]`);

						if (draggableElement) {
							draggableElement.classList.remove('correct', 'incorrect');
							draggableElement.classList.add(isCorrect ? 'correct' : 'incorrect');
						}

						if (isCorrect) {
							isPlacedCorrectly = true;
						}
					}
				});

				if (isPlacedCorrectly) {
					score++;
				}
			});

			// Display results
			displayResults(score, total);

			// Disable dragging
			const allDraggables = blockElement.querySelectorAll('.draggable-element');
			allDraggables.forEach(el => {
				el.setAttribute('draggable', 'false');
				el.style.cursor = 'default';
			});

			// Show retry/solution buttons
			checkButton.style.display = 'none';
			if (retryButton) retryButton.style.display = 'inline-block';
			if (solutionButton) solutionButton.style.display = 'inline-block';
		}

		function displayResults(score, total) {
			if (!resultsContainer || !config.showScore) return;

			resultsContainer.style.display = 'block';

			const percentage = (score / total) * 100;
			let message = '';

			if (percentage === 100) {
				message = config.successText;
			} else if (percentage >= 50 && config.allowPartialScore) {
				message = config.partialSuccessText;
			} else {
				message = config.failText;
			}

			if (resultMessage) {
				resultMessage.textContent = message;
			}

			if (scoreDisplay) {
				const scoreText = config.scoreText
					.replace('@score', score)
					.replace('@total', total);
				scoreDisplay.textContent = scoreText;
			}
		}

		function retry() {
			isChecked = false;

			// Move all draggables back to draggables container
			const allDraggables = blockElement.querySelectorAll('.draggable-element');
			allDraggables.forEach(el => {
				el.classList.remove('correct', 'incorrect', 'solution');
				el.setAttribute('draggable', 'true');
				el.style.cursor = 'move';
				el.style.position = '';
				el.style.left = '';
				el.style.top = '';
				draggablesContainer.appendChild(el);
			});

			// Reset drop zone states
			Object.keys(dropZoneStates).forEach(key => {
				dropZoneStates[key] = [];
			});

			// Randomize if enabled
			if (config.randomizeDraggables) {
				const draggablesArray = Array.from(draggablesContainer.children);
				draggablesArray.sort(() => Math.random() - 0.5);
				draggablesArray.forEach(el => draggablesContainer.appendChild(el));
			}

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
			// Clear all zones
			const allZones = blockElement.querySelectorAll('.drop-zone');
			allZones.forEach(zone => {
				while (zone.firstChild && zone.firstChild.classList?.contains('draggable-element')) {
					zone.removeChild(zone.firstChild);
				}
			});

			// Place each draggable in its correct zone
			config.draggables.forEach(draggableConfig => {
				if (draggableConfig.correctZones.length > 0) {
					const correctZoneId = draggableConfig.correctZones[0]; // Use first correct zone
					const dropZone = blockElement.querySelector(`[data-zone-id="${correctZoneId}"]`);
					const draggableElement = draggablesContainer.querySelector(`[data-draggable-id="${draggableConfig.id}"]`) ||
						blockElement.querySelector(`[data-draggable-id="${draggableConfig.id}"]`);

					if (dropZone && draggableElement) {
						const clonedElement = draggableElement.cloneNode(true);
						clonedElement.classList.add('solution');
						clonedElement.classList.remove('correct', 'incorrect');
						clonedElement.setAttribute('draggable', 'false');
						clonedElement.style.cursor = 'default';
						dropZone.appendChild(clonedElement);
					}
				}
			});

			// Remove draggables from draggables container
			while (draggablesContainer.firstChild) {
				draggablesContainer.removeChild(draggablesContainer.firstChild);
			}

			// Update results
			if (resultsContainer && config.showScore) {
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

	// Initialize all drag-and-drop blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-drag-and-drop');
		blocks.forEach(block => {
			window.initDragAndDrop(block);
		});
	});
})();
