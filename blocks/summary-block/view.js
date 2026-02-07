/**
 * Summary Block - Frontend (H5P-Style)
 *
 * Interactive summary quiz where users select correct statements from groups.
 * Correct statements build up a summary of the topic.
 */

(function() {
    'use strict';

    /**
     * Initialize a summary block
     * @param {HTMLElement} block - The summary block element
     */
    function initSummaryBlock(block) {
        if (!block || block.dataset.initialized === 'true') return;
        block.dataset.initialized = 'true';

        // Parse block data
        const data = JSON.parse(block.dataset.summary || '{}');
        const {
            groups = [],
            totalCorrect = 0,
            progressiveReveal = true,
            showFeedback = true,
            penaltyPerWrong = 1,
            successText = '',
            partialSuccessText = '',
            failText = '',
            correctFeedback = '',
            incorrectFeedback = '',
            strings = {}
        } = data;

        // State
        let currentGroupIndex = 0;
        let score = totalCorrect; // Start with max score, deduct for wrong answers
        let wrongAttempts = 0;
        let correctSelections = [];
        let isCompleted = false;

        // DOM elements
        const container = block.querySelector('.summary-container');
        const groupElements = block.querySelectorAll('.summary-group');
        const progressBar = block.querySelector('.progress-fill');
        const currentGroupSpan = block.querySelector('.current-group');
        const summarySection = block.querySelector('.summary-section');
        const summaryStatements = block.querySelector('.summary-statements');
        const resultsSection = block.querySelector('.summary-results');
        const controlsSection = block.querySelector('.summary-controls');
        const retryButton = block.querySelector('.retry-button');
        const solutionButton = block.querySelector('.solution-button');

        /**
         * Update progress bar
         */
        function updateProgress() {
            const progress = ((currentGroupIndex) / groups.length) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (currentGroupSpan) {
                currentGroupSpan.textContent = Math.min(currentGroupIndex + 1, groups.length);
            }
        }

        /**
         * Show feedback for a statement selection
         * @param {HTMLElement} statementEl - The statement element
         * @param {boolean} isCorrect - Whether the selection was correct
         */
        function showStatementFeedback(statementEl, isCorrect) {
            const groupEl = statementEl.closest('.summary-group');
            const feedbackEl = groupEl.querySelector('.group-feedback');
            const feedbackMessage = feedbackEl.querySelector('.feedback-message');

            statementEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            statementEl.disabled = true;

            if (showFeedback && feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.className = 'group-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-incorrect');
                feedbackMessage.textContent = isCorrect ? correctFeedback : incorrectFeedback;

                // Auto-hide incorrect feedback after 2 seconds
                if (!isCorrect) {
                    setTimeout(() => {
                        feedbackEl.style.display = 'none';
                    }, 2000);
                }
            }
        }

        /**
         * Add correct statement to summary
         * @param {string} text - The statement text
         */
        function addToSummary(text) {
            if (!summarySection || !summaryStatements) return;

            // Show summary section if hidden
            summarySection.style.display = 'block';

            // Create summary item
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <span class="summary-bullet">✓</span>
                <span class="summary-text">${text}</span>
            `;

            // Animate in
            item.style.opacity = '0';
            item.style.transform = 'translateY(-10px)';
            summaryStatements.appendChild(item);

            requestAnimationFrame(() => {
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });

            // Scroll to show new item
            summarySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        /**
         * Check if group is completed
         * @param {HTMLElement} groupEl - The group element
         * @returns {boolean}
         */
        function isGroupCompleted(groupEl) {
            const correctCount = parseInt(groupEl.dataset.correctCount || '1', 10);
            const correctSelected = groupEl.querySelectorAll('.statement-option.correct').length;
            return correctSelected >= correctCount;
        }

        /**
         * Show continue button for group
         * @param {HTMLElement} groupEl - The group element
         */
        function showContinueButton(groupEl) {
            const continueBtn = groupEl.querySelector('.continue-button');
            if (continueBtn) {
                continueBtn.style.display = 'inline-flex';
            }
        }

        /**
         * Move to next group
         */
        function goToNextGroup() {
            if (currentGroupIndex >= groups.length - 1) {
                showResults();
                return;
            }

            // Hide current group
            if (progressiveReveal && groupElements[currentGroupIndex]) {
                groupElements[currentGroupIndex].classList.remove('active');
                groupElements[currentGroupIndex].style.display = 'none';
            }

            // Show next group
            currentGroupIndex++;
            if (progressiveReveal && groupElements[currentGroupIndex]) {
                groupElements[currentGroupIndex].style.display = 'block';
                groupElements[currentGroupIndex].classList.add('active');

                // Scroll to new group
                groupElements[currentGroupIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            updateProgress();
        }

        /**
         * Show final results
         */
        function showResults() {
            isCompleted = true;

            // Calculate final score (ensure minimum of 0)
            const finalScore = Math.max(0, score);
            const percentage = totalCorrect > 0 ? Math.round((finalScore / totalCorrect) * 100) : 0;

            // Update progress to 100%
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            // Hide groups
            if (progressiveReveal) {
                groupElements.forEach(g => {
                    g.style.display = 'none';
                });
            }

            // Show results
            if (resultsSection) {
                resultsSection.style.display = 'block';

                const iconEl = resultsSection.querySelector('.results-icon');
                const scoreEl = resultsSection.querySelector('.score-display');
                const messageEl = resultsSection.querySelector('.result-message');

                if (iconEl) {
                    iconEl.innerHTML = percentage >= 80
                        ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>'
                        : percentage >= 50
                            ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                            : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>';
                }

                if (scoreEl) {
                    scoreEl.textContent = `${finalScore}/${totalCorrect} ${strings.score || 'Punkte'} (${percentage}%)`;
                }

                if (messageEl) {
                    if (percentage >= 80) {
                        messageEl.textContent = successText;
                        messageEl.className = 'result-message success';
                    } else if (percentage >= 50) {
                        messageEl.textContent = partialSuccessText;
                        messageEl.className = 'result-message partial';
                    } else {
                        messageEl.textContent = failText;
                        messageEl.className = 'result-message fail';
                    }
                }
            }

            // Show controls
            if (controlsSection) {
                controlsSection.style.display = 'flex';
            }
        }

        /**
         * Show solution (all correct answers)
         */
        function showSolution() {
            // Clear summary and rebuild with all correct statements
            if (summaryStatements) {
                summaryStatements.innerHTML = '';
            }

            groups.forEach(group => {
                group.statements.forEach(stmt => {
                    if (stmt.isCorrect) {
                        addToSummary(stmt.text);
                    }
                });
            });

            // Mark all correct statements in UI
            groupElements.forEach((groupEl, groupIndex) => {
                groupEl.style.display = 'block';
                groupEl.classList.add('solution-shown');

                const statements = groupEl.querySelectorAll('.statement-option');
                statements.forEach(stmtEl => {
                    const isCorrect = stmtEl.dataset.correct === 'true';
                    stmtEl.classList.remove('correct', 'incorrect');
                    stmtEl.classList.add(isCorrect ? 'solution-correct' : 'solution-incorrect');
                    stmtEl.disabled = true;
                });
            });

            // Hide solution button after showing
            if (solutionButton) {
                solutionButton.style.display = 'none';
            }
        }

        /**
         * Reset the quiz
         */
        function resetQuiz() {
            // Reset state
            currentGroupIndex = 0;
            score = totalCorrect;
            wrongAttempts = 0;
            correctSelections = [];
            isCompleted = false;

            // Reset UI
            groupElements.forEach((groupEl, index) => {
                groupEl.classList.remove('active', 'solution-shown');
                groupEl.style.display = progressiveReveal && index > 0 ? 'none' : 'block';
                if (index === 0) {
                    groupEl.classList.add('active');
                }

                // Reset statements
                const statements = groupEl.querySelectorAll('.statement-option');
                statements.forEach(stmtEl => {
                    stmtEl.classList.remove('correct', 'incorrect', 'solution-correct', 'solution-incorrect');
                    stmtEl.disabled = false;
                });

                // Hide feedback and continue button
                const feedback = groupEl.querySelector('.group-feedback');
                if (feedback) feedback.style.display = 'none';

                const continueBtn = groupEl.querySelector('.continue-button');
                if (continueBtn) continueBtn.style.display = 'none';
            });

            // Clear summary
            if (summaryStatements) {
                summaryStatements.innerHTML = '';
            }
            if (summarySection) {
                summarySection.style.display = 'none';
            }

            // Hide results and controls
            if (resultsSection) resultsSection.style.display = 'none';
            if (controlsSection) controlsSection.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'inline-flex';

            // Reset progress
            updateProgress();

            // Scroll to top
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        /**
         * Handle statement click
         * @param {Event} event - Click event
         */
        function handleStatementClick(event) {
            if (isCompleted) return;

            const statementEl = event.currentTarget;
            if (statementEl.disabled) return;

            const groupEl = statementEl.closest('.summary-group');
            const isCorrect = statementEl.dataset.correct === 'true';
            const statementText = statementEl.querySelector('.statement-text').textContent;

            if (isCorrect) {
                // Correct answer
                showStatementFeedback(statementEl, true);
                correctSelections.push(statementText);
                addToSummary(statementText);

                // Check if group is completed
                if (isGroupCompleted(groupEl)) {
                    // Disable remaining statements in this group
                    const remainingStatements = groupEl.querySelectorAll('.statement-option:not(.correct):not(.incorrect)');
                    remainingStatements.forEach(stmt => {
                        stmt.disabled = true;
                        stmt.classList.add('disabled');
                    });

                    // Show continue button (if progressive) or auto-advance
                    if (progressiveReveal) {
                        if (currentGroupIndex < groups.length - 1) {
                            showContinueButton(groupEl);
                        } else {
                            // Last group - show results after short delay
                            setTimeout(showResults, 1000);
                        }
                    }
                }
            } else {
                // Wrong answer
                showStatementFeedback(statementEl, false);
                wrongAttempts++;
                score -= penaltyPerWrong;
            }
        }

        /**
         * Handle continue button click
         * @param {Event} event - Click event
         */
        function handleContinueClick(event) {
            goToNextGroup();
        }

        // Setup event listeners
        block.querySelectorAll('.statement-option').forEach(stmt => {
            stmt.addEventListener('click', handleStatementClick);
        });

        block.querySelectorAll('.continue-button').forEach(btn => {
            btn.addEventListener('click', handleContinueClick);
        });

        if (retryButton) {
            retryButton.addEventListener('click', resetQuiz);
        }

        if (solutionButton) {
            solutionButton.addEventListener('click', showSolution);
        }

        // Initialize
        updateProgress();
    }

    // Export for external use
    window.initSummaryBlock = initSummaryBlock;

    /**
     * Initialize all summary blocks on the page
     */
    function initAllSummaryBlocks() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-summary-block');
        blocks.forEach(initSummaryBlock);
    }

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllSummaryBlocks);
    } else {
        initAllSummaryBlocks();
    }

    // Also initialize on window load
    window.addEventListener('load', initAllSummaryBlocks);

    // Handle dynamically added blocks
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-summary-block')) {
                                initSummaryBlock(node);
                            }
                            const blocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-summary-block');
                            if (blocks) {
                                blocks.forEach(initSummaryBlock);
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
