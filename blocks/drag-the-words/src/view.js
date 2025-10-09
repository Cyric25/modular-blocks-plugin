/**
 * Drag the Words Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initDragTheWords = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-drag-words-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const textContent = blockElement.querySelector('.text-content');
		const wordBankItems = blockElement.querySelector('.word-bank-items');
		const checkButton = blockElement.querySelector('.drag-words-check');
		const retryButton = blockElement.querySelector('.drag-words-retry');
		const solutionButton = blockElement.querySelector('.drag-words-solution');
		const resultsContainer = blockElement.querySelector('.drag-words-results');
		const resultMessage = blockElement.querySelector('.result-message');
		const scoreDisplay = blockElement.querySelector('.score-display');

		let draggedElement = null;
		let isChecked = false;
		let blankStates = {};

		// Initialize blank states
		const blanks = blockElement.querySelectorAll('.word-blank');
		blanks.forEach((blank, index) => {
			blankStates[index] = { word: null, element: null };
		});

		// Setup draggable words
		const draggableWords = blockElement.querySelectorAll('.draggable-word');
		draggableWords.forEach(word => {
			word.addEventListener('dragstart', handleDragStart);
			word.addEventListener('dragend', handleDragEnd);
			// Touch support könnte hier hinzugefügt werden
		});

		// Setup drop zones (blanks)
		blanks.forEach(blank => {
			blank.addEventListener('dragover', handleDragOver);
			blank.addEventListener('drop', handleDrop);
			blank.addEventListener('dragleave', handleDragLeave);
			blank.addEventListener('click', handleBlankClick);
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

			const blank = e.target.closest('.word-blank');
			if (!blank || !draggedElement) return;

			blank.classList.remove('drag-over');

			const blankIndex = parseInt(blank.getAttribute('data-blank'));
			const word = draggedElement.getAttribute('data-word');

			// Check if blank already has a word
			if (blankStates[blankIndex].element) {
				// Return existing word to word bank
				const existingWord = blankStates[blankIndex].element;
				returnWordToBank(existingWord);
			}

			// Create new word element in blank
			const wordElement = createWordInBlank(word, draggedElement);
			blank.appendChild(wordElement);

			// Update state
			blankStates[blankIndex] = {
				word: word,
				element: wordElement
			};

			// Remove from word bank if not reusable
			if (!config.enableWordReuse) {
				draggedElement.remove();
			}

			// Instant feedback if enabled
			if (config.highlightCorrectOnDrop) {
				checkSingleBlank(blankIndex, wordElement);
			}

			draggedElement = null;
			return false;
		}

		function handleBlankClick(e) {
			if (isChecked) return;

			const blank = e.target.closest('.word-blank');
			if (!blank) return;

			const blankIndex = parseInt(blank.getAttribute('data-blank'));
			const wordData = blankStates[blankIndex];

			if (wordData.element) {
				// Return word to bank
				returnWordToBank(wordData.element);
				blankStates[blankIndex] = { word: null, element: null };
			}
		}

		function createWordInBlank(word, sourceElement) {
			const wordElement = document.createElement('span');
			wordElement.className = 'word-in-blank';
			wordElement.textContent = word;
			wordElement.setAttribute('data-word', word);
			wordElement.setAttribute('data-is-correct', sourceElement.getAttribute('data-is-correct'));
			wordElement.setAttribute('data-correct-blanks', sourceElement.getAttribute('data-correct-blanks'));
			return wordElement;
		}

		function returnWordToBank(wordElement) {
			if (!config.enableWordReuse) {
				const word = wordElement.getAttribute('data-word');
				const isCorrect = wordElement.getAttribute('data-is-correct');
				const correctBlanks = wordElement.getAttribute('data-correct-blanks');

				const newWordElement = document.createElement('div');
				newWordElement.className = 'draggable-word';
				newWordElement.textContent = word;
				newWordElement.setAttribute('data-word', word);
				newWordElement.setAttribute('data-is-correct', isCorrect);
				newWordElement.setAttribute('data-correct-blanks', correctBlanks);
				newWordElement.setAttribute('draggable', 'true');
				newWordElement.addEventListener('dragstart', handleDragStart);
				newWordElement.addEventListener('dragend', handleDragEnd);

				wordBankItems.appendChild(newWordElement);
			}

			wordElement.remove();
		}

		function checkSingleBlank(blankIndex, wordElement) {
			const word = wordElement.getAttribute('data-word');
			const correctBlanksStr = wordElement.getAttribute('data-correct-blanks');

			if (!correctBlanksStr) return;

			const correctBlanks = JSON.parse(correctBlanksStr);
			const isCorrect = correctBlanks.includes(blankIndex);

			wordElement.classList.remove('correct', 'incorrect');
			wordElement.classList.add(isCorrect ? 'correct' : 'incorrect');
		}

		function checkAnswers() {
			isChecked = true;
			let score = 0;
			let totalBlanks = blanks.length;

			// Check each blank
			blanks.forEach((blank, index) => {
				const wordData = blankStates[index];

				if (wordData.element) {
					const word = wordData.word;
					const correctBlanksStr = wordData.element.getAttribute('data-correct-blanks');

					if (correctBlanksStr) {
						const correctBlanks = JSON.parse(correctBlanksStr);
						let isCorrect = correctBlanks.includes(index);

						// Case sensitivity check
						if (!config.caseSensitive && isCorrect) {
							// Already checked by blank index
						}

						wordData.element.classList.remove('correct', 'incorrect');
						wordData.element.classList.add(isCorrect ? 'correct' : 'incorrect');

						if (isCorrect) {
							score++;
						}
					}
				}
			});

			// Display results
			displayResults(score, totalBlanks);

			// Disable dragging
			const allDraggables = blockElement.querySelectorAll('.draggable-word, .word-in-blank');
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
			} else if (percentage >= 50) {
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

			// Return all words in blanks back to word bank
			blanks.forEach((blank, index) => {
				const wordData = blankStates[index];
				if (wordData.element) {
					returnWordToBank(wordData.element);
					blankStates[index] = { word: null, element: null };
				}
			});

			// Randomize word bank if enabled
			if (config.randomizeWords) {
				const wordsArray = Array.from(wordBankItems.children);
				wordsArray.sort(() => Math.random() - 0.5);
				wordsArray.forEach(el => wordBankItems.appendChild(el));
			}

			// Re-enable dragging
			const allDraggables = blockElement.querySelectorAll('.draggable-word');
			allDraggables.forEach(el => {
				el.setAttribute('draggable', 'true');
				el.style.cursor = 'move';
				el.classList.remove('correct', 'incorrect');
			});

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
			// Clear all blanks
			blanks.forEach((blank, index) => {
				const wordData = blankStates[index];
				if (wordData.element) {
					wordData.element.remove();
				}
				blankStates[index] = { word: null, element: null };
			});

			// Place correct words in blanks
			config.wordBank.forEach(wordItem => {
				if (wordItem.isCorrect && wordItem.blanks.length > 0) {
					wordItem.blanks.forEach(blankIndex => {
						const blank = blockElement.querySelector(`[data-blank="${blankIndex}"]`);
						if (blank && !blankStates[blankIndex].element) {
							const wordElement = document.createElement('span');
							wordElement.className = 'word-in-blank solution';
							wordElement.textContent = wordItem.word;
							wordElement.setAttribute('data-word', wordItem.word);
							blank.appendChild(wordElement);

							blankStates[blankIndex] = {
								word: wordItem.word,
								element: wordElement
							};
						}
					});
				}
			});

			// Clear word bank
			wordBankItems.innerHTML = '';

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

	// Initialize all drag-the-words blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-drag-the-words');
		blocks.forEach(block => {
			window.initDragTheWords(block);
		});
	});
})();
