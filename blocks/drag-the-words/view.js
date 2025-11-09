/**
 * Frontend JavaScript for Drag the Words Block
 *
 * Provides interactive drag & drop functionality for filling text blanks with words
 */

(function() {
    'use strict';

    /**
     * Initialize drag the words functionality
     * @param {HTMLElement} element - The drag words block element
     */
    function initDragTheWords(element) {
        if (!element) return;

        const dragWordsData = JSON.parse(element.dataset.dragWords || '{}');
        const container = element.querySelector('.drag-words-container');
        const textArea = element.querySelector('.text-area');
        const wordBankItems = element.querySelector('.word-bank-items');
        const draggableWords = element.querySelectorAll('.draggable-word');
        const blanks = element.querySelectorAll('.word-blank');
        const checkButton = element.querySelector('.drag-words-check');
        const retryButton = element.querySelector('.drag-words-retry');
        const solutionButton = element.querySelector('.drag-words-solution');
        const resultsSection = element.querySelector('.drag-words-results');
        const scoreDisplay = element.querySelector('.score-display');
        const resultMessage = element.querySelector('.result-message');
        const blankFeedback = element.querySelector('.blank-feedback');

        if (!container || !wordBankItems || !checkButton) return;

        let isCompleted = false;
        let draggedElement = null;
        let currentDropTarget = null;
        let userAnswers = {};

        /**
         * Update check button state
         */
        function updateCheckButton() {
            if (isCompleted) return;

            const filledBlanks = Object.keys(userAnswers).length;
            const totalBlanks = blanks.length;
            checkButton.disabled = filledBlanks === 0;
        }

        /**
         * Create a word element
         * @param {string} word - The word text
         * @param {number} originalIndex - Original index in word bank
         * @param {boolean} isClone - Whether this is a clone
         */
        function createWordElement(word, originalIndex, isClone = false) {
            const wordElement = document.createElement('div');
            const wordData = dragWordsData.wordBank[originalIndex];

            wordElement.className = `draggable-word ${wordData?.isCorrect ? 'correct-word' : 'distractor-word'} ${isClone ? 'word-clone' : ''}`;
            wordElement.setAttribute('data-word', word);
            wordElement.setAttribute('data-word-index', originalIndex);
            wordElement.setAttribute('data-is-correct', wordData?.isCorrect ? 'true' : 'false');
            wordElement.setAttribute('data-correct-blanks', JSON.stringify(wordData?.blanks || []));
            wordElement.setAttribute('draggable', 'true');
            wordElement.setAttribute('tabindex', '0');
            wordElement.setAttribute('role', 'button');

            wordElement.innerHTML = `
                <span class="word-text">${word}</span>
                <div class="word-feedback" style="display: none;"></div>
            `;

            // Add event listeners
            addWordEventListeners(wordElement);

            return wordElement;
        }

        /**
         * Add event listeners to a word element
         * @param {HTMLElement} wordElement - Word element
         */
        function addWordEventListeners(wordElement) {
            // Drag events
            wordElement.addEventListener('dragstart', handleDragStart);
            wordElement.addEventListener('dragend', handleDragEnd);

            // Touch events for mobile
            wordElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            wordElement.addEventListener('touchmove', handleTouchMove, { passive: false });
            wordElement.addEventListener('touchend', handleTouchEnd, { passive: false });

            // Keyboard events
            wordElement.addEventListener('keydown', handleWordKeydown);

            // Click events (for mobile alternative)
            wordElement.addEventListener('click', handleWordClick);
        }

        /**
         * Handle drag start
         * @param {DragEvent} event - Drag event
         */
        function handleDragStart(event) {
            if (isCompleted) {
                event.preventDefault();
                return;
            }

            draggedElement = event.target;
            event.dataTransfer.setData('text/plain', draggedElement.dataset.word);
            event.dataTransfer.effectAllowed = 'move';

            draggedElement.classList.add('being-dragged');
            container.classList.add('drag-active');

            // Highlight valid drop targets
            blanks.forEach(blank => {
                blank.classList.add('drop-target');
            });
        }

        /**
         * Handle drag end
         * @param {DragEvent} event - Drag event
         */
        function handleDragEnd(event) {
            if (draggedElement) {
                draggedElement.classList.remove('being-dragged');
                draggedElement = null;
            }

            container.classList.remove('drag-active');

            // Remove drop target highlights
            blanks.forEach(blank => {
                blank.classList.remove('drop-target', 'drag-over');
            });
        }

        /**
         * Handle touch start for mobile
         * @param {TouchEvent} event - Touch event
         */
        function handleTouchStart(event) {
            if (isCompleted) return;

            draggedElement = event.target.closest('.draggable-word');
            if (!draggedElement) return;

            event.preventDefault();
            draggedElement.classList.add('being-dragged');
            container.classList.add('drag-active');

            // Highlight drop targets
            blanks.forEach(blank => {
                blank.classList.add('drop-target');
            });
        }

        /**
         * Handle touch move for mobile
         * @param {TouchEvent} event - Touch event
         */
        function handleTouchMove(event) {
            if (!draggedElement) return;

            event.preventDefault();
            const touch = event.touches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const blank = elementBelow?.closest('.word-blank');

            // Update drop target highlighting
            blanks.forEach(b => b.classList.remove('drag-over'));
            if (blank) {
                blank.classList.add('drag-over');
                currentDropTarget = blank;
            } else {
                currentDropTarget = null;
            }
        }

        /**
         * Handle touch end for mobile
         * @param {TouchEvent} event - Touch event
         */
        function handleTouchEnd(event) {
            if (!draggedElement) return;

            event.preventDefault();

            if (currentDropTarget) {
                dropWordOnBlank(draggedElement, currentDropTarget);
            }

            // Cleanup
            draggedElement.classList.remove('being-dragged');
            container.classList.remove('drag-active');
            blanks.forEach(blank => {
                blank.classList.remove('drop-target', 'drag-over');
            });

            draggedElement = null;
            currentDropTarget = null;
        }

        /**
         * Handle word click (for mobile alternative)
         * @param {Event} event - Click event
         */
        function handleWordClick(event) {
            if (isCompleted) return;

            const wordElement = event.target.closest('.draggable-word');
            if (!wordElement) return;

            // Simple click-to-fill for mobile users
            const firstEmptyBlank = Array.from(blanks).find(blank => !blank.dataset.filledWord);
            if (firstEmptyBlank) {
                dropWordOnBlank(wordElement, firstEmptyBlank);
            }
        }

        /**
         * Handle keyboard navigation for words
         * @param {KeyboardEvent} event - Keyboard event
         */
        function handleWordKeydown(event) {
            const wordElement = event.target;

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    handleWordClick(event);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    event.preventDefault();
                    navigateWords(wordElement, event.key);
                    break;
                case 'Escape':
                    // Return word to bank if in blank
                    if (wordElement.closest('.word-blank')) {
                        returnWordToBank(wordElement);
                    }
                    break;
            }
        }

        /**
         * Navigate between words with keyboard
         * @param {HTMLElement} currentWord - Current word element
         * @param {string} key - Arrow key pressed
         */
        function navigateWords(currentWord, key) {
            const allWords = element.querySelectorAll('.draggable-word');
            const currentIndex = Array.from(allWords).indexOf(currentWord);
            let newIndex;

            switch (key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    newIndex = currentIndex > 0 ? currentIndex - 1 : allWords.length - 1;
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    newIndex = currentIndex < allWords.length - 1 ? currentIndex + 1 : 0;
                    break;
            }

            if (allWords[newIndex]) {
                allWords[newIndex].focus();
            }
        }

        /**
         * Drop word on blank
         * @param {HTMLElement} wordElement - Word being dropped
         * @param {HTMLElement} blank - Blank receiving the word
         */
        function dropWordOnBlank(wordElement, blank) {
            const word = wordElement.dataset.word;
            const blankIndex = parseInt(blank.dataset.blank);

            // If blank already has a word, return it to bank first
            if (blank.dataset.filledWord) {
                const existingWord = blank.querySelector('.draggable-word');
                if (existingWord) {
                    returnWordToBank(existingWord);
                }
            }

            // Move word to blank
            const placeholder = blank.querySelector('.blank-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            // Clone or move the word
            let wordInBlank;
            if (dragWordsData.enableWordReuse && !wordElement.classList.contains('word-clone')) {
                // Clone the word for reuse
                wordInBlank = createWordElement(word, wordElement.dataset.wordIndex, true);
                wordInBlank.addEventListener('click', () => {
                    if (!isCompleted) {
                        returnWordToBank(wordInBlank);
                    }
                });
            } else {
                // Move the original word
                wordInBlank = wordElement;
                wordInBlank.parentElement.removeChild(wordInBlank);
            }

            // Add to blank
            blank.appendChild(wordInBlank);
            blank.dataset.filledWord = word;
            blank.classList.add('filled');
            wordInBlank.classList.add('in-blank');

            // Update user answers
            userAnswers[blankIndex] = {
                word: word,
                wordIndex: parseInt(wordElement.dataset.wordIndex),
                element: wordInBlank
            };

            // Instant feedback if enabled
            if (dragWordsData.instantFeedback) {
                checkSingleBlank(blankIndex);
            }

            updateCheckButton();
        }

        /**
         * Return word from blank to bank
         * @param {HTMLElement} wordElement - Word element to return
         */
        function returnWordToBank(wordElement) {
            const blank = wordElement.closest('.word-blank');
            if (!blank) return;

            const blankIndex = parseInt(blank.dataset.blank);

            // Remove from user answers
            delete userAnswers[blankIndex];

            // Remove from blank
            blank.removeChild(wordElement);
            blank.classList.remove('filled', 'correct', 'incorrect');
            blank.dataset.filledWord = '';

            // Show placeholder
            const placeholder = blank.querySelector('.blank-placeholder');
            if (placeholder) {
                placeholder.style.display = 'inline';
            }

            // Return to bank (if not a reusable clone)
            if (!dragWordsData.enableWordReuse || !wordElement.classList.contains('word-clone')) {
                wordElement.classList.remove('in-blank');
                wordBankItems.appendChild(wordElement);
            }

            updateCheckButton();
        }

        /**
         * Check single blank (for instant feedback)
         * @param {number} blankIndex - Index of blank to check
         */
        function checkSingleBlank(blankIndex) {
            const userAnswer = userAnswers[blankIndex];
            if (!userAnswer) return;

            const blank = blanks[blankIndex];
            const correctAnswers = dragWordsData.blanks[blankIndex]?.correct_word;
            const isCorrect = isAnswerCorrect(userAnswer.word, correctAnswers);

            blank.classList.toggle('correct', isCorrect);
            blank.classList.toggle('incorrect', !isCorrect);

            if (dragWordsData.highlightCorrectOnDrop) {
                setTimeout(() => {
                    blank.classList.remove('correct', 'incorrect');
                }, 2000);
            }
        }

        /**
         * Check if answer is correct
         * @param {string} userWord - User's word
         * @param {string} correctWord - Correct word
         */
        function isAnswerCorrect(userWord, correctWord) {
            if (dragWordsData.caseSensitive) {
                return userWord === correctWord;
            }
            return userWord.toLowerCase() === correctWord.toLowerCase();
        }

        /**
         * Check all answers and show results
         */
        function checkAnswers() {
            if (isCompleted) return;

            isCompleted = true;
            let correctCount = 0;
            const totalBlanks = dragWordsData.blanks.length;

            // Check each blank
            dragWordsData.blanks.forEach((blankData, index) => {
                const userAnswer = userAnswers[index];
                const blank = blanks[index];

                if (userAnswer) {
                    const isCorrect = isAnswerCorrect(userAnswer.word, blankData.correct_word);

                    blank.classList.remove('correct', 'incorrect');
                    blank.classList.add(isCorrect ? 'correct' : 'incorrect');

                    if (isCorrect) {
                        correctCount++;
                    }

                    // Show feedback on word
                    showWordFeedback(userAnswer.element, isCorrect);
                } else {
                    blank.classList.add('empty');
                }
            });

            // Calculate score
            const percentage = Math.round((correctCount / totalBlanks) * 100);
            const passed = percentage >= 80;

            // Show results
            showResults(correctCount, totalBlanks, percentage, passed);

            // Update controls
            checkButton.style.display = 'none';
            if (retryButton && dragWordsData.showRetry) {
                retryButton.style.display = 'inline-block';
            }
            if (solutionButton && dragWordsData.showSolution) {
                solutionButton.style.display = 'inline-block';
            }

            // Disable dragging
            draggableWords.forEach(word => {
                word.setAttribute('draggable', 'false');
                word.style.cursor = 'default';
            });
        }

        /**
         * Show feedback on word element
         * @param {HTMLElement} wordElement - Word element
         * @param {boolean} isCorrect - Whether word is correct
         */
        function showWordFeedback(wordElement, isCorrect) {
            const feedback = wordElement.querySelector('.word-feedback');
            if (!feedback || !dragWordsData.showFeedback) return;

            feedback.textContent = isCorrect ?
                dragWordsData.strings.correct :
                dragWordsData.strings.incorrect;

            feedback.className = `word-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            feedback.style.display = 'block';
        }

        /**
         * Show results section
         * @param {number} correct - Number of correct answers
         * @param {number} total - Total number of blanks
         * @param {number} percentage - Score percentage
         * @param {boolean} passed - Whether user passed
         */
        function showResults(correct, total, percentage, passed) {
            if (!resultsSection || !dragWordsData.showScore) return;

            resultsSection.style.display = 'block';

            // Update score display
            if (scoreDisplay) {
                const scoreText = dragWordsData.scoreText
                    .replace('@score', correct)
                    .replace('@total', total);
                scoreDisplay.textContent = scoreText;
            }

            // Update result message
            if (resultMessage) {
                let message;
                if (percentage === 100) {
                    message = dragWordsData.successText;
                } else if (percentage >= 50) {
                    message = dragWordsData.partialSuccessText;
                } else {
                    message = dragWordsData.failText;
                }

                resultMessage.textContent = message;
                resultMessage.className = `result-message ${passed ? 'success' : 'fail'}`;
            }

            // Show detailed blank feedback
            if (blankFeedback && dragWordsData.showFeedback) {
                const feedbackItems = dragWordsData.blanks.map((blank, index) => {
                    const userAnswer = userAnswers[index];
                    const status = userAnswer ?
                        (isAnswerCorrect(userAnswer.word, blank.correct_word) ? 'correct' : 'incorrect') :
                        'empty';

                    return `<div class="blank-feedback-item ${status}">
                        <span class="blank-number">${index + 1}:</span>
                        <span class="blank-status">${userAnswer ? userAnswer.word : '___'}</span>
                        <span class="blank-result">${
                            status === 'correct' ? '✓' :
                            status === 'incorrect' ? '✗' : '-'
                        }</span>
                    </div>`;
                }).join('');

                blankFeedback.innerHTML = feedbackItems;
            }

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Reset to initial state
         */
        function resetDragWords() {
            isCompleted = false;
            userAnswers = {};

            // Clear all blanks
            blanks.forEach(blank => {
                const wordInBlank = blank.querySelector('.draggable-word');
                if (wordInBlank) {
                    returnWordToBank(wordInBlank);
                }
                blank.classList.remove('filled', 'correct', 'incorrect', 'empty');
            });

            // Clear word feedback
            draggableWords.forEach(word => {
                const feedback = word.querySelector('.word-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }
                word.classList.remove('correct', 'incorrect');
                word.setAttribute('draggable', 'true');
                word.style.cursor = '';
            });

            // Update controls
            checkButton.style.display = 'inline-block';
            checkButton.disabled = true;

            if (retryButton) retryButton.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'none';
        }

        /**
         * Show solution
         */
        function showSolution() {
            dragWordsData.blanks.forEach((blankData, index) => {
                const blank = blanks[index];
                const correctWord = blankData.correct_word;

                // Find correct word in bank
                const correctWordElement = Array.from(draggableWords).find(word =>
                    word.dataset.word.toLowerCase() === correctWord.toLowerCase()
                );

                if (correctWordElement && !blank.dataset.filledWord) {
                    dropWordOnBlank(correctWordElement, blank);
                    blank.classList.add('solution');
                }
            });

            updateCheckButton();
        }

        // Initialize drop zones for blanks
        blanks.forEach(blank => {
            blank.addEventListener('dragover', (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                blank.classList.add('drag-over');
            });

            blank.addEventListener('dragleave', (event) => {
                blank.classList.remove('drag-over');
            });

            blank.addEventListener('drop', (event) => {
                event.preventDefault();
                blank.classList.remove('drag-over');

                if (draggedElement) {
                    dropWordOnBlank(draggedElement, blank);
                }
            });

            // Click to clear blank
            blank.addEventListener('click', () => {
                if (!isCompleted && blank.dataset.filledWord) {
                    const wordInBlank = blank.querySelector('.draggable-word');
                    if (wordInBlank) {
                        returnWordToBank(wordInBlank);
                    }
                }
            });
        });

        // Initialize word bank words
        draggableWords.forEach(word => {
            addWordEventListeners(word);
        });

        // Control buttons
        if (checkButton) {
            checkButton.addEventListener('click', checkAnswers);
        }

        if (retryButton) {
            retryButton.addEventListener('click', resetDragWords);
        }

        if (solutionButton) {
            solutionButton.addEventListener('click', showSolution);
        }

        // Initialize
        updateCheckButton();
    }

    /**
     * Initialize all drag the words blocks on the page
     */
    function initAllDragTheWords() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-drag-the-words');
        blocks.forEach(initDragTheWords);
    }

    // Make function globally available for dynamic content
    window.initDragTheWords = initDragTheWords;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllDragTheWords);
    } else {
        initAllDragTheWords();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllDragTheWords);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a drag words block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-drag-the-words')) {
                                initDragTheWords(node);
                            }
                            // Check if the added node contains drag words blocks
                            const dragWordsBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-drag-the-words');
                            if (dragWordsBlocks) {
                                dragWordsBlocks.forEach(initDragTheWords);
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