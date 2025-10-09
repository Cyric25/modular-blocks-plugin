/**
 * Summary Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initSummaryBlock = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-summary-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const statementsPool = blockElement.querySelector('.statements-pool');
		const orderSection = blockElement.querySelector('.summary-order-section');
		const selectedContainer = blockElement.querySelector('.selected-statements');
		const checkButton = blockElement.querySelector('.summary-check');
		const retryButton = blockElement.querySelector('.summary-retry');
		const solutionButton = blockElement.querySelector('.summary-solution');
		const resultsContainer = blockElement.querySelector('.summary-results');
		const resultMessage = blockElement.querySelector('.result-message');
		const scoreDisplay = blockElement.querySelector('.score-display');
		const feedbackContainer = blockElement.querySelector('.feedback-container');

		let selectedStatements = [];
		let isChecked = false;

		// Setup statement selection
		const statementItems = blockElement.querySelectorAll('.statement-item');
		statementItems.forEach(item => {
			item.addEventListener('click', () => handleStatementClick(item));
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

		function handleStatementClick(item) {
			if (isChecked) return;

			const index = parseInt(item.getAttribute('data-statement-index'));
			const selectedIndex = selectedStatements.indexOf(index);

			if (selectedIndex > -1) {
				// Deselect
				selectedStatements.splice(selectedIndex, 1);
				item.classList.remove('selected');
			} else {
				// Select
				if (selectedStatements.length < config.requiredSelections) {
					selectedStatements.push(index);
					item.classList.add('selected');
				}
			}

			updateSelectedView();
		}

		function updateSelectedView() {
			if (selectedStatements.length > 0) {
				orderSection.style.display = 'block';
				selectedContainer.innerHTML = '';

				selectedStatements.forEach((statementIndex, position) => {
					const originalItem = blockElement.querySelector(`[data-statement-index="${statementIndex}"]`);
					const selectedItem = document.createElement('div');
					selectedItem.className = 'selected-statement';
					selectedItem.setAttribute('data-statement-index', statementIndex);
					selectedItem.setAttribute('data-position', position + 1);
					selectedItem.innerHTML = `
						<span class="position-number">${position + 1}</span>
						<span class="statement-text">${originalItem.textContent}</span>
						<button type="button" class="remove-statement">&times;</button>
					`;

					// Remove button
					selectedItem.querySelector('.remove-statement').addEventListener('click', (e) => {
						e.stopPropagation();
						const idx = selectedStatements.indexOf(statementIndex);
						if (idx > -1) {
							selectedStatements.splice(idx, 1);
							originalItem.classList.remove('selected');
							updateSelectedView();
						}
					});

					// Drag and drop for reordering
					if (config.allowReordering) {
						selectedItem.setAttribute('draggable', 'true');
						selectedItem.addEventListener('dragstart', handleDragStart);
						selectedItem.addEventListener('dragover', handleDragOver);
						selectedItem.addEventListener('drop', handleDrop);
						selectedItem.addEventListener('dragend', handleDragEnd);
					}

					selectedContainer.appendChild(selectedItem);
				});
			} else {
				orderSection.style.display = 'none';
			}
		}

		let draggedElement = null;

		function handleDragStart(e) {
			if (isChecked) return;
			draggedElement = e.target;
			e.target.classList.add('dragging');
		}

		function handleDragEnd(e) {
			e.target.classList.remove('dragging');
		}

		function handleDragOver(e) {
			e.preventDefault();
			const afterElement = getDragAfterElement(selectedContainer, e.clientY);
			if (afterElement == null) {
				selectedContainer.appendChild(draggedElement);
			} else {
				selectedContainer.insertBefore(draggedElement, afterElement);
			}
		}

		function handleDrop(e) {
			e.preventDefault();
			// Rebuild selectedStatements array based on new order
			selectedStatements = [];
			const items = selectedContainer.querySelectorAll('.selected-statement');
			items.forEach(item => {
				const index = parseInt(item.getAttribute('data-statement-index'));
				selectedStatements.push(index);
			});
			updateSelectedView();
		}

		function getDragAfterElement(container, y) {
			const draggableElements = [...container.querySelectorAll('.selected-statement:not(.dragging)')];

			return draggableElements.reduce((closest, child) => {
				const box = child.getBoundingClientRect();
				const offset = y - box.top - box.height / 2;

				if (offset < 0 && offset > closest.offset) {
					return { offset: offset, element: child };
				} else {
					return closest;
				}
			}, { offset: Number.NEGATIVE_INFINITY }).element;
		}

		function checkAnswers() {
			if (selectedStatements.length !== config.requiredSelections) {
				alert(`Bitte wählen Sie genau ${config.requiredSelections} Aussagen aus.`);
				return;
			}

			isChecked = true;
			let selectionScore = 0;
			let orderScore = 0;
			let maxSelectionScore = config.requiredSelections * config.scoreForSelection;
			let maxOrderScore = config.requiredSelections * config.scoreForOrder;
			let feedbackHTML = '';

			// Check selections and order
			selectedStatements.forEach((statementIndex, position) => {
				const statement = config.statements[statementIndex];
				const actualPosition = position + 1;

				// Check if correct statement selected
				if (statement.isCorrect) {
					selectionScore += config.scoreForSelection;
				}

				// Check if in correct position
				if (statement.correctPosition === actualPosition) {
					orderScore += config.scoreForOrder;
				}

				// Visual feedback
				const selectedItem = selectedContainer.querySelector(`[data-statement-index="${statementIndex}"][data-position="${actualPosition}"]`);
				if (selectedItem) {
					const isCorrectSelection = statement.isCorrect;
					const isCorrectPosition = statement.correctPosition === actualPosition;

					if (isCorrectSelection && isCorrectPosition) {
						selectedItem.classList.add('correct');
					} else {
						selectedItem.classList.add('incorrect');
					}

					// Add feedback
					if (config.showFeedback && statement.feedback) {
						feedbackHTML += `<div class="statement-feedback ${isCorrectSelection && isCorrectPosition ? 'correct' : 'incorrect'}">
							<strong>${actualPosition}.</strong> ${statement.feedback}
						</div>`;
					}
				}
			});

			// Calculate total score and percentage
			const totalScore = selectionScore + orderScore;
			const maxScore = maxSelectionScore + maxOrderScore;
			const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

			// Display results
			displayResults(totalScore, maxScore, percentage, feedbackHTML);

			// Disable interactions
			statementItems.forEach(item => {
				item.style.pointerEvents = 'none';
			});

			const removeButtons = selectedContainer.querySelectorAll('.remove-statement');
			removeButtons.forEach(btn => btn.style.display = 'none');

			// Show retry/solution buttons
			checkButton.style.display = 'none';
			if (retryButton) retryButton.style.display = 'inline-block';
			if (solutionButton) solutionButton.style.display = 'inline-block';
		}

		function displayResults(score, maxScore, percentage, feedbackHTML) {
			if (!resultsContainer) return;

			resultsContainer.style.display = 'block';

			let message = '';
			if (percentage >= config.passPercentage) {
				message = config.successText;
			} else if (percentage >= 50) {
				message = config.partialSuccessText;
			} else {
				message = config.failText;
			}

			if (resultMessage) {
				resultMessage.textContent = message;
				resultMessage.className = 'result-message ' + (percentage >= config.passPercentage ? 'success' : 'fail');
			}

			if (scoreDisplay) {
				scoreDisplay.textContent = `${score} von ${maxScore} Punkten (${Math.round(percentage)}%)`;
			}

			if (feedbackContainer && feedbackHTML) {
				feedbackContainer.innerHTML = feedbackHTML;
			}
		}

		function retry() {
			isChecked = false;
			selectedStatements = [];

			// Reset all statements
			statementItems.forEach(item => {
				item.classList.remove('selected');
				item.style.pointerEvents = '';
			});

			// Clear selected view
			selectedContainer.innerHTML = '';
			orderSection.style.display = 'none';

			// Hide results
			if (resultsContainer) {
				resultsContainer.style.display = 'none';
			}

			if (feedbackContainer) {
				feedbackContainer.innerHTML = '';
			}

			// Show check button, hide retry/solution
			checkButton.style.display = 'inline-block';
			if (retryButton) retryButton.style.display = 'none';
			if (solutionButton) solutionButton.style.display = 'none';
		}

		function showSolution() {
			// Clear current selection
			selectedStatements = [];
			statementItems.forEach(item => item.classList.remove('selected'));

			// Select correct statements in correct order
			const correctStatements = config.statements
				.map((stmt, idx) => ({ ...stmt, originalIndex: idx }))
				.filter(stmt => stmt.isCorrect)
				.sort((a, b) => a.correctPosition - b.correctPosition);

			correctStatements.forEach(stmt => {
				selectedStatements.push(stmt.originalIndex);
				const item = blockElement.querySelector(`[data-statement-index="${stmt.originalIndex}"]`);
				if (item) {
					item.classList.add('selected');
				}
			});

			updateSelectedView();

			// Mark all as correct
			const selectedItems = selectedContainer.querySelectorAll('.selected-statement');
			selectedItems.forEach(item => {
				item.classList.add('correct', 'solution');
			});

			// Update results
			if (resultsContainer) {
				resultsContainer.style.display = 'block';
				if (resultMessage) {
					resultMessage.textContent = 'Lösung wird angezeigt.';
					resultMessage.className = 'result-message solution';
				}
				if (scoreDisplay) {
					const maxScore = (config.requiredSelections * config.scoreForSelection) +
						(config.requiredSelections * config.scoreForOrder);
					scoreDisplay.textContent = `${maxScore} von ${maxScore} Punkten (100%)`;
				}
			}

			if (feedbackContainer) {
				feedbackContainer.innerHTML = '';
			}

			// Hide solution button
			if (solutionButton) {
				solutionButton.style.display = 'none';
			}
		}
	};

	// Initialize all summary blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-summary-block');
		blocks.forEach(block => {
			window.initSummaryBlock(block);
		});
	});
})();
