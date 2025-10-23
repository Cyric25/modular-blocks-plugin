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
		let selectedWord = null; // For tap-to-select mode
		let touchStartTime = 0;
		let touchMoved = false;

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
			// Click support for tap-to-select mode
			word.addEventListener('click', handleWordClick);
		});

		// Setup drop zones (blanks)
		blanks.forEach(blank => {
			blank.addEventListener('dragover', handleDragOver);
			blank.addEventListener('drop', handleDrop);
			blank.addEventListener('dragleave', handleDragLeave);
			blank.addEventListener('click', handleBlankClick);
			// Touch tap support for blanks
			blank.addEventListener('touchend', handleBlankTouchEnd, { passive: false });
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
			const sourceElement = draggedElement;

			// Use the helper function to place the word
			placeWordInBlank(sourceElement, blank, blankIndex);

			draggedElement = null;
			return false;
		}

		// Tap-to-select mode: Click on word to select it
		function handleWordClick(e) {
			if (isChecked) return;
			e.stopPropagation();

			const word = e.target;

			// Deselect previously selected word
			if (selectedWord && selectedWord !== word) {
				selectedWord.classList.remove('selected');
			}

			// Toggle selection
			if (selectedWord === word) {
				word.classList.remove('selected');
				selectedWord = null;
			} else {
				word.classList.add('selected');
				selectedWord = word;
			}
		}

		// Touch event handlers for mobile devices (drag mode)
		function handleTouchStart(e) {
			if (isChecked) return;

			touchElement = e.target;
			draggedElement = e.target;
			touchStartTime = Date.now();
			touchMoved = false;

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
			touchMoved = true;

			const touch = e.touches[0];
			touchClone.style.left = touch.pageX - 25 + 'px';
			touchClone.style.top = touch.pageY - 15 + 'px';
		}

		function handleTouchEnd(e) {
			if (!touchElement) return;

			const touchDuration = Date.now() - touchStartTime;
			const touch = e.changedTouches[0];
			const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
			const blank = targetElement ? targetElement.closest('.word-blank') : null;

			// If it was a quick tap (< 200ms) and didn't move much, treat as tap-to-select
			if (touchDuration < 200 && !touchMoved) {
				// Clean up clone
				if (touchClone && touchClone.parentNode) {
					touchClone.remove();
				}
				touchElement.style.opacity = '1';

				// Trigger click event for tap-to-select mode
				touchElement.click();

				touchElement = null;
				touchClone = null;
				draggedElement = null;
				return;
			}

			// Otherwise treat as drag
			if (blank) {
				// Simulate drop
				const blankIndex = parseInt(blank.getAttribute('data-blank'));
				placeWordInBlank(touchElement, blank, blankIndex);
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

			// Check if user clicked on a word in blank (to remove it)
			// Check if target IS a word-in-blank or contains one
			let wordInBlank = null;
			if (e.target.classList.contains('word-in-blank')) {
				wordInBlank = e.target;
			} else {
				wordInBlank = e.target.closest('.word-in-blank');
			}

			if (wordInBlank) {
				// Find the parent blank
				const blank = wordInBlank.closest('.word-blank');
				if (blank) {
					const blankIndex = parseInt(blank.getAttribute('data-blank'));
					const wordData = blankStates[blankIndex];
					if (wordData.element) {
						returnWordToBank(wordData.element, blankIndex);
					}
				}
				return;
			}

			const blank = e.target.closest('.word-blank');
			if (!blank) return;

			const blankIndex = parseInt(blank.getAttribute('data-blank'));
			const wordData = blankStates[blankIndex];

			// If a word is selected, place it in this blank
			if (selectedWord) {
				placeWordInBlank(selectedWord, blank, blankIndex);
				selectedWord.classList.remove('selected');
				selectedWord = null;
				return;
			}

			// If blank has a word, return it to bank
			if (wordData.element) {
				returnWordToBank(wordData.element, blankIndex);
			}
		}

		// Touch tap on blank (for tap-to-select mode)
		function handleBlankTouchEnd(e) {
			if (isChecked) return;

			// Only handle if we have a selected word and this is a tap (not drag)
			if (!selectedWord) return;

			e.preventDefault();
			e.stopPropagation();

			const blank = e.target.closest('.word-blank');
			if (!blank) return;

			const blankIndex = parseInt(blank.getAttribute('data-blank'));
			placeWordInBlank(selectedWord, blank, blankIndex);
			selectedWord.classList.remove('selected');
			selectedWord = null;
		}

		// Helper function to place a word in a blank
		function placeWordInBlank(sourceElement, blank, blankIndex) {
			const word = sourceElement.getAttribute('data-word');

			// If blank already has a word, return it to bank
			if (blankStates[blankIndex].element) {
				returnWordToBank(blankStates[blankIndex].element, blankIndex);
			}

			// Move the source element from bank to blank
			// Remove it from its current parent
			if (sourceElement.parentNode) {
				sourceElement.parentNode.removeChild(sourceElement);
			}

			// Change styling for word in blank
			sourceElement.className = 'word-in-blank';
			sourceElement.style.cssText = 'display: inline-block; padding: 6px 12px; background: #ffffff; border: 2px solid #cccccc; border-radius: 4px; color: #1e1e1e; font-weight: 500; cursor: pointer;';
			sourceElement.setAttribute('draggable', 'false');

			// Add click handler to return word to bank when clicked
			sourceElement.addEventListener('click', function(e) {
				if (isChecked) return;
				e.stopPropagation();
				returnWordToBank(sourceElement, blankIndex);
			});

			// Append to blank
			blank.appendChild(sourceElement);

			// Update state - store reference to the actual moved element
			blankStates[blankIndex] = {
				word: word,
				element: sourceElement,
				correctWord: blankStates[blankIndex].correctWord
			};
		}

		function returnWordToBank(wordElement, blankIndex) {
			// Remove from its parent (the blank)
			if (wordElement && wordElement.parentNode) {
				wordElement.parentNode.removeChild(wordElement);
			}

			// Change styling back to draggable word
			wordElement.className = 'draggable-word';
			wordElement.style.cssText = 'display: inline-block; padding: 8px 16px; background: #e8e8e8; border: 2px solid #cccccc; border-radius: 4px; color: #1e1e1e; font-weight: 500; cursor: move;';
			wordElement.setAttribute('draggable', 'true');
			wordElement.classList.remove('correct', 'incorrect', 'selected');

			// Append back to word bank
			wordBankItems.appendChild(wordElement);

			// Clear blank state
			if (blankIndex !== undefined) {
				blankStates[blankIndex] = {
					word: null,
					element: null,
					correctWord: blankStates[blankIndex].correctWord
				};
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

			// Clear any selected word
			if (selectedWord) {
				selectedWord.classList.remove('selected');
				selectedWord = null;
			}

			// Return all words in blanks back to word bank
			blanks.forEach((blank, index) => {
				const wordData = blankStates[index];
				if (wordData.element) {
					returnWordToBank(wordData.element, index);
				}
			});

			// Randomize word bank if enabled
			if (config.randomizeWords) {
				const wordsArray = Array.from(wordBankItems.children);
				wordsArray.sort(() => Math.random() - 0.5);
				wordsArray.forEach(el => wordBankItems.appendChild(el));
			}

			// Re-enable dragging and remove selection
			const allDraggables = blockElement.querySelectorAll('.draggable-word');
			allDraggables.forEach(el => {
				el.setAttribute('draggable', 'true');
				el.style.cursor = 'move';
				el.classList.remove('correct', 'incorrect', 'selected');
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
			// Clear word bank first
			wordBankItems.innerHTML = '';

			// Clear all blanks completely and place correct words
			blanks.forEach((blank, index) => {
				// Remove all children from blank
				while (blank.firstChild) {
					blank.removeChild(blank.firstChild);
				}

				// Reset state
				blankStates[index] = {
					word: null,
					element: null,
					correctWord: blankStates[index].correctWord
				};

				// Place correct word
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
