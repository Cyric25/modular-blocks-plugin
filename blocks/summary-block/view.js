/**
 * Summary Block - Frontend (H5P-Style)
 *
 * Interactive summary quiz where users select correct statements from groups.
 * Correct statements build up a summary of the topic.
 *
 * Features:
 * - Regular mode: Immediate feedback on correctness
 * - Deferred feedback mode: All statements added to summary, feedback only at end
 * - PDF export: Download summary as PDF (only at 100% success)
 */

(function() {
    'use strict';

    // Load jsPDF from CDN for PDF export
    let jsPDFLoaded = false;
    function loadJsPDF(callback) {
        if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
            jsPDFLoaded = true;
            callback();
            return;
        }

        if (jsPDFLoaded) {
            callback();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            jsPDFLoaded = true;
            callback();
        };
        script.onerror = function() {
            console.error('Failed to load jsPDF library');
        };
        document.head.appendChild(script);
    }

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
            deferredFeedback = false,
            enablePdfDownload = true,
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
        let correctSelections = []; // Tracks correct statement texts
        let wrongSelections = []; // Tracks wrong statement texts (for deferred mode)
        let allSelections = []; // All selected statement objects (for deferred mode)
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
        const pdfButton = block.querySelector('.pdf-download-button');

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
         * Show feedback for a statement selection (regular mode only)
         * @param {HTMLElement} statementEl - The statement element
         * @param {boolean} isCorrect - Whether the selection was correct
         */
        function showStatementFeedback(statementEl, isCorrect) {
            const groupEl = statementEl.closest('.summary-group');
            const feedbackEl = groupEl.querySelector('.group-feedback');
            const feedbackMessage = feedbackEl ? feedbackEl.querySelector('.feedback-message') : null;

            statementEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            statementEl.disabled = true;

            if (showFeedback && !deferredFeedback && feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.className = 'group-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-incorrect');
                if (feedbackMessage) {
                    feedbackMessage.textContent = isCorrect ? correctFeedback : incorrectFeedback;
                }

                // Auto-hide incorrect feedback after 2 seconds
                if (!isCorrect) {
                    setTimeout(() => {
                        feedbackEl.style.display = 'none';
                    }, 2000);
                }
            }
        }

        /**
         * Add statement to summary
         * @param {string} text - The statement text
         * @param {boolean} isCorrect - Whether statement is correct (for styling in deferred mode)
         */
        function addToSummary(text, isCorrect = true) {
            if (!summarySection || !summaryStatements) return;

            // Show summary section if hidden
            summarySection.style.display = 'block';

            // Create summary item
            const item = document.createElement('div');
            item.className = 'summary-item';

            // In deferred mode, don't show checkmark yet - mark correct/incorrect after evaluation
            if (deferredFeedback) {
                item.setAttribute('data-correct', isCorrect ? 'true' : 'false');
                item.innerHTML = `
                    <span class="summary-bullet">•</span>
                    <span class="summary-text">${text}</span>
                `;
            } else {
                item.innerHTML = `
                    <span class="summary-bullet">✓</span>
                    <span class="summary-text">${text}</span>
                `;
            }

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
         * Update summary items after deferred feedback evaluation
         */
        function updateSummaryAfterEvaluation() {
            const items = summaryStatements.querySelectorAll('.summary-item');
            items.forEach(item => {
                const isCorrect = item.getAttribute('data-correct') === 'true';
                const bullet = item.querySelector('.summary-bullet');
                const text = item.querySelector('.summary-text');

                if (isCorrect) {
                    bullet.textContent = '✓';
                    bullet.style.color = '#0f9d58';
                    text.style.color = '#333';
                } else {
                    bullet.textContent = '✗';
                    bullet.style.color = '#ea4335';
                    text.style.textDecoration = 'line-through';
                    text.style.color = '#999';
                }
            });
        }

        /**
         * Check if group is completed
         * @param {HTMLElement} groupEl - The group element
         * @returns {boolean}
         */
        function isGroupCompleted(groupEl) {
            if (deferredFeedback) {
                // In deferred mode, group is completed when at least one statement is selected
                const anySelected = groupEl.querySelectorAll('.statement-option.correct, .statement-option.incorrect').length > 0;
                return anySelected;
            } else {
                // In regular mode, need all correct statements
                const correctCount = parseInt(groupEl.dataset.correctCount || '1', 10);
                const correctSelected = groupEl.querySelectorAll('.statement-option.correct').length;
                return correctSelected >= correctCount;
            }
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
         * Calculate final score
         */
        function calculateFinalScore() {
            if (deferredFeedback) {
                // In deferred mode: check if ALL correct statements selected and NO wrong statements
                let allCorrectSelected = true;
                let noWrongSelected = true;

                groups.forEach(group => {
                    group.statements.forEach(stmt => {
                        const selected = allSelections.find(s => s.id === stmt.id);
                        if (stmt.isCorrect && !selected) {
                            allCorrectSelected = false;
                        }
                        if (!stmt.isCorrect && selected) {
                            noWrongSelected = false;
                        }
                    });
                });

                // 100% only if all correct and no wrong
                return (allCorrectSelected && noWrongSelected) ? totalCorrect : 0;
            } else {
                // Regular mode: use accumulated score
                return Math.max(0, score);
            }
        }

        /**
         * Generate PDF of summary
         */
        function generatePDF() {
            loadJsPDF(() => {
                try {
                    const { jsPDF } = window.jspdf || window;
                    if (!jsPDF) {
                        alert('PDF library not loaded. Please try again.');
                        return;
                    }

                    const doc = new jsPDF();

                    // Get block title
                    const titleEl = block.querySelector('.summary-title');
                    const title = titleEl ? titleEl.textContent : 'Zusammenfassung';

                    // Add title
                    doc.setFontSize(18);
                    doc.setFont(undefined, 'bold');
                    doc.text(title, 20, 20);

                    // Add summary title
                    const summaryTitleEl = block.querySelector('.summary-section-title');
                    const summaryTitle = summaryTitleEl ? summaryTitleEl.textContent : 'Ihre Zusammenfassung:';
                    doc.setFontSize(14);
                    doc.text(summaryTitle, 20, 35);

                    // Add statements (only correct ones)
                    const items = summaryStatements.querySelectorAll('.summary-item');
                    let yPosition = 45;
                    const pageHeight = doc.internal.pageSize.height;
                    const margin = 20;
                    const lineHeight = 8;

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');

                    items.forEach((item, index) => {
                        const isCorrect = item.getAttribute('data-correct') !== 'false';
                        if (!isCorrect && deferredFeedback) return; // Skip wrong items in deferred mode

                        const text = item.querySelector('.summary-text')?.textContent || '';

                        // Check if we need a new page
                        if (yPosition > pageHeight - margin) {
                            doc.addPage();
                            yPosition = margin;
                        }

                        // Add bullet and text
                        const bulletText = `${index + 1}. `;
                        const wrappedText = doc.splitTextToSize(text, 170);

                        doc.text(bulletText, margin, yPosition);
                        doc.text(wrappedText, margin + 10, yPosition);

                        yPosition += wrappedText.length * lineHeight;
                    });

                    // Add date
                    const today = new Date().toLocaleDateString('de-DE');
                    doc.setFontSize(9);
                    doc.setTextColor(128, 128, 128);
                    doc.text(`Erstellt am ${today}`, margin, pageHeight - 15);

                    // Save PDF
                    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
                    doc.save(filename);
                } catch (error) {
                    console.error('PDF generation error:', error);
                    alert('Fehler beim Erstellen der PDF-Datei.');
                }
            });
        }

        /**
         * Show final results
         */
        function showResults() {
            isCompleted = true;

            // Calculate final score
            const finalScore = calculateFinalScore();
            const percentage = totalCorrect > 0 ? Math.round((finalScore / totalCorrect) * 100) : 0;

            // In deferred mode, update summary with correct/incorrect marks
            if (deferredFeedback) {
                updateSummaryAfterEvaluation();
            }

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
                    iconEl.innerHTML = percentage === 100
                        ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>'
                        : percentage >= 50
                            ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                            : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>';
                }

                if (scoreEl) {
                    scoreEl.textContent = `${finalScore}/${totalCorrect} ${strings.score || 'Punkte'} (${percentage}%)`;
                }

                if (messageEl) {
                    if (percentage === 100) {
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

            // Show PDF button only if 100% and enabled
            if (pdfButton && enablePdfDownload && percentage === 100) {
                pdfButton.style.display = 'inline-flex';
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
                        addToSummary(stmt.text, true);
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

            // Update summary display
            if (deferredFeedback) {
                updateSummaryAfterEvaluation();
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
            wrongSelections = [];
            allSelections = [];
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

            // Hide results, controls, and PDF button
            if (resultsSection) resultsSection.style.display = 'none';
            if (controlsSection) controlsSection.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'inline-flex';
            if (pdfButton) pdfButton.style.display = 'none';

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
            const statementId = statementEl.dataset.statementId;
            const statementText = statementEl.querySelector('.statement-text').textContent;

            if (deferredFeedback) {
                // DEFERRED FEEDBACK MODE
                // Add ALL selected statements to summary (no immediate feedback)
                statementEl.classList.add('selected');
                statementEl.disabled = true;

                // Track selection
                allSelections.push({
                    id: statementId,
                    text: statementText,
                    isCorrect: isCorrect
                });

                if (isCorrect) {
                    correctSelections.push(statementText);
                } else {
                    wrongSelections.push(statementText);
                }

                // Add to summary (no checkmark yet)
                addToSummary(statementText, isCorrect);

                // Check if group has at least one selection
                if (isGroupCompleted(groupEl)) {
                    // Disable remaining statements
                    const remainingStatements = groupEl.querySelectorAll('.statement-option:not(.selected)');
                    remainingStatements.forEach(stmt => {
                        stmt.disabled = true;
                        stmt.classList.add('disabled');
                    });

                    // Show continue button or advance
                    if (progressiveReveal) {
                        if (currentGroupIndex < groups.length - 1) {
                            showContinueButton(groupEl);
                        } else {
                            // Last group - show results
                            setTimeout(showResults, 500);
                        }
                    }
                }
            } else {
                // REGULAR MODE (immediate feedback)
                if (isCorrect) {
                    // Correct answer
                    showStatementFeedback(statementEl, true);
                    correctSelections.push(statementText);
                    addToSummary(statementText, true);

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

        if (pdfButton) {
            pdfButton.addEventListener('click', generatePDF);
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
