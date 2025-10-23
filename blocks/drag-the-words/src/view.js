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
		let touchElement = null;
		let touchClone = null;

		// Initialize blank states
		const blanks = blockElement.querySelectorAll('.word-blank');
		blanks.forEach((blank, index) => {
			const correctWord = blank.getAttribute('data-correct-word');
			blankStates[index] = {
				word: null,
				element: null,
				correctWord: correctWord
			};
		});

		// Setup draggable words
		const draggableWords = blockElement.querySelectorAll('.draggable-word');
		draggableWords.forEach(word => {
			word.addEventListener('dragstart', handleDragStart);
			word.addEventListener('dragend', handleDragEnd);
			// Touch support
			word.addEventListener('touchstart', handleTouchStart, { passive: false });
			word.addEventListener('touchmove', handleTouchMove, { passive: false });
			word.addEventListener('touchend', handleTouchEnd, { passive: false });
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
			const sourceElement = draggedElement;

			// Check if blank already has a word
			if (blankStates[blankIndex].element) {
				// Return existing word to word bank
				const existingWord = blankStates[blankIndex].element;
				returnWordToBank(existingWord);
			}

			// Create new word element in blank
			const wordElement = createWordInBlank(word);
			blank.appendChild(wordElement);

			// Update state
			blankStates[blankIndex] = {
				word: word,
				element: wordElement,
				correctWord: blankStates[blankIndex].correctWord
			};

			// Remove original word from bank immediately (not reusable)
			if (!config.enableWordReuse && sourceElement.parentNode === wordBankItems) {
				sourceElement.remove();
			}

			draggedElement = null;
			return false;
		}

		// Touch event handlers for mobile devices
		function handleTouchStart(e) {
			if (isChecked) return;

			touchElement = e.target;
			draggedElement = e.target;

			const touch = e.touches[0];
			const clone = touchElement.cloneNode(true);
			clone.style.position = 'fixed';
			clone.style.left = touch.pageX - 25 + 'px';
			clone.style.top = touch.pageY - 15 + 'px';
			clone.style.opacity = '0.7';
			clone.style.pointerEvents = 'none';
			clone.style.zIndex = '10000';
			document.body.appendChild(clone);
			touchClone = clone;

			touchElement.style.opacity = '0.3';
		}

		function handleTouchMove(e) {
			if (!touchElement || !touchClone) return;
			e.preventDefault();

			const touch = e.touches[0];
			touchClone.style.left = touch.pageX - 25 + 'px';
			touchClone.style.top = touch.pageY - 15 + 'px';
		}

		function handleTouchEnd(e) {
			if (!touchElement) return;

			const touch = e.changedTouches[0];
			const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
			const blank = targetElement ? targetElement.closest('.word-blank') : null;

			if (blank) {
				// Simulate drop
				const blankIndex = parseInt(blank.getAttribute('data-blank'));
				const word = touchElement.getAttribute('data-word');

				if (blankStates[blankIndex].element) {
					returnWordToBank(blankStates[blankIndex].element);
				}

				if (!config.enableWordReuse && touchElement.parentNode === wordBankItems) {
					touchElement.remove();
				}

				const wordElement = createWordInBlank(word);
				blank.appendChild(wordElement);

				blankStates[blankIndex] = {
					word: word,
					element: wordElement,
					correctWord: blankStates[blankIndex].correctWord
				};
			} else {
				touchElement.style.opacity = '1';
			}

			if (touchClone && touchClone.parentNode) {
				touchClone.remove();
			}

			touchElement = null;
			touchClone = null;
			draggedElement = null;
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
				blankStates[blankIndex] = {
					word: null,
					element: null,
					correctWord: wordData.correctWord
				};
			}
		}

		function createWordInBlank(word) {
			const wordElement = document.createElement('span');
			wordElement.className = 'word-in-blank';
			wordElement.textContent = word;
			wordElement.setAttribute('data-word', word);
			wordElement.style.cssText = 'display: inline-block; padding: 6px 12px; background: #ffffff; border: 2px solid #cccccc; border-radius: 4px; color: #1e1e1e; font-weight: 500; cursor: pointer;';
			return wordElement;
		}

		function returnWordToBank(wordElement) {
			if (!config.enableWordReuse) {
				const word = wordElement.getAttribute('data-word');

				const newWordElement = document.createElement('div');
				newWordElement.className = 'draggable-word';
				newWordElement.textContent = word;
				newWordElement.setAttribute('data-word', word);
				newWordElement.setAttribute('draggable', 'true');
				newWordElement.style.cssText = 'display: inline-block; padding: 8px 16px; background: #e8e8e8; border: 2px solid #cccccc; border-radius: 4px; color: #1e1e1e; font-weight: 500; cursor: move;';
				newWordElement.addEventListener('dragstart', handleDragStart);
				newWordElement.addEventListener('dragend', handleDragEnd);
				newWordElement.addEventListener('touchstart', handleTouchStart, { passive: false });
				newWordElement.addEventListener('touchmove', handleTouchMove, { passive: false });
				newWordElement.addEventListener('touchend', handleTouchEnd, { passive: false });

				wordBankItems.appendChild(newWordElement);
			}

			if (wordElement && wordElement.parentNode) {
				wordElement.remove();
			}
		}

		function checkSingleBlank(blankIndex, wordElement) {
			const word = wordElement.getAttribute('data-word');
			const correctWord = blankStates[blankIndex].correctWord;

			if (!correctWord) return;

			const isCorrect = config.caseSensitive
				? word === correctWord
				: word.toLowerCase() === correctWord.toLowerCase();

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
				const correctWord = wordData.correctWord;

				if (wordData.element && correctWord) {
					const word = wordData.word;

					const isCorrect = config.caseSensitive
						? word === correctWord
						: word.toLowerCase() === correctWord.toLowerCase();

					wordData.element.classList.remove('correct', 'incorrect');
					wordData.element.classList.add(isCorrect ? 'correct' : 'incorrect');

					if (isCorrect) {
						score++;
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
			// Clear all blanks and place correct words
			blanks.forEach((blank, index) => {
				const wordData = blankStates[index];
				if (wordData.element) {
					wordData.element.remove();
				}

				const correctWord = blank.getAttribute('data-correct-word');
				if (correctWord) {
					const wordElement = document.createElement('span');
					wordElement.className = 'word-in-blank solution correct';
					wordElement.textContent = correctWord;
					wordElement.setAttribute('data-word', correctWord);
					blank.appendChild(wordElement);

					blankStates[index] = {
						word: correctWord,
						element: wordElement,
						correctWord: correctWord
					};
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
