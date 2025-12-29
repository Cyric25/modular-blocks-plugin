/**
 * Frontend JavaScript for Statement Summary Block
 *
 * Provides interactive functionality for selecting statements and building a summary
 */

(function() {
    'use strict';

    /**
     * Initialize statement summary functionality
     * @param {HTMLElement} element - The block element
     */
    function initStatementSummary(element) {
        if (!element) return;

        const config = JSON.parse(element.dataset.blockConfig || '{}');
        const statementsContainer = element.querySelector('.summary-statements');
        const checkButton = element.querySelector('.summary-check');
        const retryButton = element.querySelector('.summary-retry');
        const solutionButton = element.querySelector('.summary-solution');
        const resultSection = element.querySelector('.summary-result');
        const resultText = element.querySelector('.result-text');
        const resultFeedback = element.querySelector('.result-feedback');
        const feedbackSection = element.querySelector('.summary-feedback');

        if (!statementsContainer || !checkButton) return;

        let statements = JSON.parse(statementsContainer.dataset.statements || '[]');
        let isCompleted = false;
        let showingSolution = false;

        // Randomize statements if configured
        if (config.randomizeStatements) {
            randomizeStatements();
        }

        /**
         * Randomize the order of statements
         */
        function randomizeStatements() {
            const options = Array.from(statementsContainer.querySelectorAll('.statement-option'));
            const shuffled = shuffleArray(options);

            statementsContainer.innerHTML = '';
            shuffled.forEach(option => statementsContainer.appendChild(option));
        }

        /**
         * Shuffle array using Fisher-Yates algorithm
         */
        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        /**
         * Get selected statement indices
         */
        function getSelectedStatements() {
            const checkboxes = statementsContainer.querySelectorAll('.statement-checkbox:checked');
            return Array.from(checkboxes).map(cb => parseInt(cb.value));
        }

        /**
         * Get correct statement indices
         */
        function getCorrectStatements() {
            return statements
                .map((s, idx) => ({ ...s, index: idx }))
                .filter(s => s.isCorrect)
                .sort((a, b) => a.order - b.order);
        }

        /**
         * Validate user selection
         */
        function validateSelection() {
            const selected = getSelectedStatements();
            const correct = getCorrectStatements();
            const correctIndices = correct.map(s => s.index);

            // Check if all correct statements are selected
            const allCorrectSelected = correctIndices.every(idx => selected.includes(idx));

            // Check if only correct statements are selected
            const noIncorrectSelected = selected.every(idx => correctIndices.includes(idx));

            if (allCorrectSelected && noIncorrectSelected) {
                return { success: true };
            } else {
                // Count how many correct statements were selected
                const correctCount = selected.filter(idx => correctIndices.includes(idx)).length;
                return {
                    success: false,
                    correctCount: correctCount,
                    totalCorrect: correctIndices.length
                };
            }
        }

        /**
         * Update check button state
         */
        function updateCheckButton() {
            if (isCompleted) return;
            const selected = getSelectedStatements();
            checkButton.disabled = selected.length === 0;
        }

        /**
         * Handle check button click
         */
        function handleCheck() {
            if (isCompleted) return;

            const selected = getSelectedStatements();
            if (selected.length === 0) {
                showFeedback('error', 'Bitte wählen Sie mindestens eine Aussage aus.');
                return;
            }

            const validation = validateSelection();

            if (validation.success) {
                handleSuccess();
            } else {
                handleError(validation);
            }
        }

        /**
         * Handle successful selection
         */
        function handleSuccess() {
            isCompleted = true;

            // Hide checkboxes and fade out incorrect statements
            animateToSummary();

            // Build and show summary
            setTimeout(() => {
                buildSummary();
                showResult('success', config.successText);
            }, 800);

            // Hide check button, show retry/solution buttons
            checkButton.style.display = 'none';
            if (retryButton && config.showRetry) {
                retryButton.style.display = 'inline-block';
            }
            if (solutionButton && config.showSolution) {
                solutionButton.style.display = 'inline-block';
            }
        }

        /**
         * Handle error in selection
         */
        function handleError(validation) {
            let message = config.errorText;

            // Use partial text if some correct answers were found
            if (validation.correctCount > 0) {
                message = config.partialText
                    .replace('@correct', validation.correctCount)
                    .replace('@total', validation.totalCorrect);
            }

            showFeedback('error', message);

            // Add visual feedback to incorrect selections
            const checkboxes = statementsContainer.querySelectorAll('.statement-checkbox');
            checkboxes.forEach(cb => {
                const option = cb.closest('.statement-option');
                const isSelected = cb.checked;
                const isCorrect = cb.dataset.correct === 'true';

                option.classList.remove('is-correct', 'is-incorrect');

                if (isSelected && !isCorrect) {
                    option.classList.add('is-incorrect');
                    setTimeout(() => option.classList.remove('is-incorrect'), 2000);
                }
            });
        }

        /**
         * Show feedback message
         */
        function showFeedback(type, message) {
            if (!feedbackSection) return;

            feedbackSection.className = 'summary-feedback ' + type;
            feedbackSection.textContent = message;
            feedbackSection.style.display = 'block';

            // Scroll to feedback
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Show result in result section
         */
        function showResult(type, message) {
            if (!resultFeedback) return;

            resultFeedback.className = 'result-feedback ' + type;
            resultFeedback.textContent = message;
            resultSection.style.display = 'block';

            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Animate statements to summary area
         */
        function animateToSummary() {
            const options = statementsContainer.querySelectorAll('.statement-option');

            options.forEach((option, index) => {
                const checkbox = option.querySelector('.statement-checkbox');
                const isSelected = checkbox.checked;
                const isCorrect = checkbox.dataset.correct === 'true';

                // Hide checkbox
                checkbox.style.display = 'none';

                if (!isCorrect || !isSelected) {
                    // Fade out incorrect and unselected statements
                    setTimeout(() => {
                        option.classList.add('fade-out');
                    }, index * 50);
                } else {
                    // Mark correct statements
                    option.classList.add('is-correct');
                }
            });
        }

        /**
         * Build summary from correct statements
         */
        function buildSummary() {
            if (!resultText) return;

            const correct = getCorrectStatements();

            // Clear result text
            resultText.innerHTML = '';

            // Add each correct statement in order
            correct.forEach((statement, index) => {
                const p = document.createElement('p');
                p.className = 'summary-statement';
                p.dataset.order = statement.order;
                p.textContent = statement.text;

                // Add fade-in animation with delay
                p.style.opacity = '0';
                p.style.transform = 'translateY(20px)';
                resultText.appendChild(p);

                setTimeout(() => {
                    p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    p.style.opacity = '1';
                    p.style.transform = 'translateY(0)';
                }, index * 200);
            });

            // Hide statements container after animation
            setTimeout(() => {
                statementsContainer.style.display = 'none';
            }, 600);
        }

        /**
         * Handle retry button click
         */
        function handleRetry() {
            // Reset state
            isCompleted = false;
            showingSolution = false;

            // Show statements container
            statementsContainer.style.display = 'block';

            // Reset all checkboxes and options
            const checkboxes = statementsContainer.querySelectorAll('.statement-checkbox');
            const options = statementsContainer.querySelectorAll('.statement-option');

            checkboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = false;
                cb.style.display = '';
            });

            options.forEach(option => {
                option.classList.remove('is-correct', 'is-incorrect', 'fade-out', 'is-solution');
                option.style.opacity = '';
                option.style.transform = '';
            });

            // Randomize again if configured
            if (config.randomizeStatements) {
                randomizeStatements();
            }

            // Show check button, hide others
            checkButton.style.display = 'inline-block';
            checkButton.disabled = true;
            if (retryButton) retryButton.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'none';

            // Hide result and feedback
            if (resultSection) resultSection.style.display = 'none';
            if (feedbackSection) feedbackSection.style.display = 'none';
            if (resultText) resultText.innerHTML = '';
        }

        /**
         * Handle solution button click
         */
        function handleSolution() {
            showingSolution = true;

            const checkboxes = statementsContainer.querySelectorAll('.statement-checkbox');
            const correct = getCorrectStatements();
            const correctIndices = correct.map(s => s.index);

            checkboxes.forEach(cb => {
                const option = cb.closest('.statement-option');
                const index = parseInt(cb.value);
                const isCorrect = correctIndices.includes(index);

                if (isCorrect) {
                    option.classList.add('is-solution');
                    cb.checked = true;
                    cb.disabled = true;
                }
            });

            // Build and show summary
            if (!isCompleted) {
                isCompleted = true;
                checkButton.style.display = 'none';

                setTimeout(() => {
                    animateToSummary();
                    setTimeout(() => {
                        buildSummary();
                        showResult('info', 'Lösung angezeigt');
                    }, 800);
                }, 100);
            }
        }

        /**
         * Handle checkbox change
         */
        function handleCheckboxChange() {
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

        // Checkbox listeners
        const checkboxes = statementsContainer.querySelectorAll('.statement-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', handleCheckboxChange);
        });

        // Initialize button state
        updateCheckButton();
    }

    /**
     * Initialize all statement summary blocks on the page
     */
    function initAllStatementSummary() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-statement-summary');
        blocks.forEach(initStatementSummary);
    }

    // Make function globally available for dynamic content
    window.initStatementSummary = initStatementSummary;

    // Auto-initialize on DOM ready and window load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllStatementSummary);
    } else {
        initAllStatementSummary();
    }

    // Also initialize on window load for safety
    window.addEventListener('load', initAllStatementSummary);

    // Handle dynamically added blocks (for AJAX content)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a statement summary block
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-statement-summary')) {
                                initStatementSummary(node);
                            }
                            // Check if the added node contains statement summary blocks
                            const blocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-statement-summary');
                            if (blocks) {
                                blocks.forEach(initStatementSummary);
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
