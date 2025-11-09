/**
 * Frontend JavaScript for Multiple Choice Block
 *
 * Provides interactive quiz functionality with scoring, feedback, and retry options
 */

(function() {
    'use strict';

    /**
     * Initialize multiple choice quiz functionality
     * @param {HTMLElement} element - The quiz block element
     */
    function initMultipleChoice(element) {
        if (!element) return;

        const quizData = JSON.parse(element.dataset.quiz || '{}');
        const container = element.querySelector('.multiple-choice-container');
        const answerOptions = element.querySelectorAll('.answer-option');
        const checkButton = element.querySelector('.quiz-check');
        const retryButton = element.querySelector('.quiz-retry');
        const solutionButton = element.querySelector('.quiz-solution');
        const resultsSection = element.querySelector('.quiz-results');
        const scoreDisplay = element.querySelector('.score-display');
        const resultMessage = element.querySelector('.result-message');

        if (!container || !checkButton || answerOptions.length === 0) return;

        let isCompleted = false;
        let userAnswers = [];
        let showingSolution = false;

        /**
         * Update check button state based on user selection
         */
        function updateCheckButton() {
            if (isCompleted) return;

            const selectedAnswers = element.querySelectorAll('.answer-input:checked');
            checkButton.disabled = selectedAnswers.length === 0;
        }

        /**
         * Get user's selected answers
         */
        function getUserAnswers() {
            const inputs = element.querySelectorAll('.answer-input');
            const answers = [];

            inputs.forEach((input, index) => {
                answers.push({
                    index: parseInt(input.value),
                    selected: input.checked,
                    isCorrect: input.closest('.answer-option').dataset.correct === 'true'
                });
            });

            return answers;
        }

        /**
         * Calculate score based on user answers
         */
        function calculateScore() {
            const answers = getUserAnswers();
            let correct = 0;
            let total = 0;

            if (quizData.multipleCorrect) {
                // For multiple correct answers, each answer is scored individually
                answers.forEach(answer => {
                    if (answer.selected && answer.isCorrect) {
                        correct++;
                    } else if (answer.selected && !answer.isCorrect) {
                        // Penalty for wrong selections in multiple choice
                        correct = Math.max(0, correct - 0.5);
                    }
                });
                total = quizData.totalCorrect;
            } else {
                // For single correct answer
                const correctAnswer = answers.find(answer => answer.isCorrect);
                const selectedAnswer = answers.find(answer => answer.selected);

                if (selectedAnswer && correctAnswer && selectedAnswer.index === correctAnswer.index) {
                    correct = 1;
                }
                total = 1;
            }

            const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
            const passed = percentage >= quizData.passPercentage;

            return {
                correct: Math.max(0, correct),
                total: total,
                percentage: percentage,
                passed: passed
            };
        }

        /**
         * Display feedback for answers
         */
        function showFeedback() {
            if (!quizData.showFeedback) return;

            answerOptions.forEach((option, index) => {
                const input = option.querySelector('.answer-input');
                const feedback = option.querySelector('.answer-feedback');
                const isSelected = input.checked;
                const isCorrect = option.dataset.correct === 'true';
                const feedbackText = option.dataset.feedback;

                // Add visual state classes
                option.classList.remove('is-selected', 'is-correct', 'is-incorrect', 'is-unanswered');

                if (isSelected) {
                    option.classList.add('is-selected');
                    if (isCorrect) {
                        option.classList.add('is-correct');
                    } else {
                        option.classList.add('is-incorrect');
                    }
                } else if (showingSolution && isCorrect) {
                    option.classList.add('is-unanswered');
                }

                // Show/hide feedback
                if (feedback && feedbackText && (isSelected || (showingSolution && isCorrect))) {
                    feedback.style.display = 'block';
                } else if (feedback) {
                    feedback.style.display = 'none';
                }

                // Add status indicators
                addStatusIndicator(option, isSelected, isCorrect);
            });
        }

        /**
         * Add status indicator to answer option
         */
        function addStatusIndicator(option, isSelected, isCorrect) {
            // Remove existing status
            const existingStatus = option.querySelector('.answer-status');
            if (existingStatus) {
                existingStatus.remove();
            }

            const label = option.querySelector('.answer-label');
            if (!label) return;

            const status = document.createElement('span');
            status.className = 'answer-status';

            if (isSelected && isCorrect) {
                status.className += ' correct';
                status.textContent = quizData.strings.correct;
            } else if (isSelected && !isCorrect) {
                status.className += ' incorrect';
                status.textContent = quizData.strings.incorrect;
            } else if (showingSolution && isCorrect && !isSelected) {
                status.className += ' unanswered';
                status.textContent = quizData.strings.unanswered;
            }

            if (status.textContent) {
                label.appendChild(status);
            }
        }

        /**
         * Display quiz results
         */
        function showResults(score) {
            if (!scoreDisplay || !resultMessage || !resultsSection) return;

            // Show results section
            resultsSection.style.display = 'block';

            // Display score
            let scoreText = quizData.scoreText
                .replace('@score', score.correct.toFixed(1))
                .replace('@total', score.total);
            scoreDisplay.textContent = scoreText;

            // Display result message
            if (score.passed) {
                resultMessage.textContent = quizData.successText;
                resultMessage.className = 'result-message success';
            } else {
                resultMessage.textContent = quizData.failText;
                resultMessage.className = 'result-message fail';
            }

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Handle check button click
         */
        function handleCheck() {
            if (isCompleted) return;

            // Confirm if required
            if (quizData.confirmCheck) {
                if (!confirm(quizData.strings.confirmCheck)) {
                    return;
                }
            }

            // Check if any answer is selected
            const selectedAnswers = element.querySelectorAll('.answer-input:checked');
            if (selectedAnswers.length === 0) {
                alert(quizData.strings.selectAnswer);
                return;
            }

            // Mark as completed
            isCompleted = true;

            // Disable all inputs
            const inputs = element.querySelectorAll('.answer-input');
            inputs.forEach(input => {
                input.disabled = true;
                input.closest('.answer-option').classList.add('is-checked');
            });

            // Hide check button
            checkButton.style.display = 'none';

            // Show feedback
            showFeedback();

            // Calculate and show results
            const score = calculateScore();
            showResults(score);

            // Show retry and solution buttons
            if (retryButton && quizData.showRetry) {
                retryButton.style.display = 'inline-block';
            }

            if (solutionButton && quizData.showSolution) {
                solutionButton.style.display = 'inline-block';
            }
        }

        /**
         * Handle retry button click
         */
        function handleRetry() {
            // Confirm if required
            if (quizData.confirmRetry) {
                if (!confirm(quizData.strings.confirmRetry)) {
                    return;
                }
            }

            // Reset state
            isCompleted = false;
            showingSolution = false;

            // Reset inputs
            const inputs = element.querySelectorAll('.answer-input');
            inputs.forEach(input => {
                input.disabled = false;
                input.checked = false;
                input.closest('.answer-option').classList.remove('is-checked', 'is-selected', 'is-correct', 'is-incorrect', 'is-unanswered');
            });

            // Hide feedback
            answerOptions.forEach(option => {
                const feedback = option.querySelector('.answer-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }

                // Remove status indicators
                const status = option.querySelector('.answer-status');
                if (status) {
                    status.remove();
                }
            });

            // Show check button
            checkButton.style.display = 'inline-block';
            checkButton.disabled = true;

            // Hide other buttons and results
            if (retryButton) retryButton.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'none';
        }

        /**
         * Handle solution button click
         */
        function handleSolution() {
            showingSolution = true;
            showFeedback();

            // Highlight all correct answers
            answerOptions.forEach(option => {
                const isCorrect = option.dataset.correct === 'true';
                if (isCorrect) {
                    option.classList.add('is-correct');
                }
            });
        }

        /**
         * Handle answer selection
         */
        function handleAnswerChange() {
            if (isCompleted) return;
            updateCheckButton();
        }

        // Event listeners
        if (checkButton) {
            checkButton.addEventListener('click', handleCheck);
        }

        if (retryButton) {
            retryButton.addEventListener('click', handleRetry);
        }

        if (solutionButton) {
            solutionButton.addEventListener('click', handleSolution);
        }

        // Answer input listeners
        const inputs = element.querySelectorAll('.answer-input');
        inputs.forEach(input => {
            input.addEventListener('change', handleAnswerChange);
        });

        // Initialize button state
        updateCheckButton();
    }

    /**
     * Initialize all multiple choice blocks on the page
     */
    function initAllMultipleChoice() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-multiple-choice');
        blocks.forEach(initMultipleChoice);
    }

    // Make function globally available for dynamic content
    window.initMultipleChoice = initMultipleChoice;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllMultipleChoice);
    } else {
        initAllMultipleChoice();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllMultipleChoice);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a quiz block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-multiple-choice')) {
                                initMultipleChoice(node);
                            }
                            // Check if the added node contains quiz blocks
                            const quizBlocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-multiple-choice');
                            if (quizBlocks) {
                                quizBlocks.forEach(initMultipleChoice);
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