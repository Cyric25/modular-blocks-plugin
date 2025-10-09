/**
 * Multiple Choice Quiz Block - Frontend Interactivity
 */

(function() {
	'use strict';

	window.initMultipleChoice = function(blockElement) {
		if (!blockElement) return;

		const configData = blockElement.getAttribute('data-quiz-config');
		if (!configData) return;

		const config = JSON.parse(configData);
		const answersSection = blockElement.querySelector('.answers-section');
		const checkButton = blockElement.querySelector('.quiz-check');
		const retryButton = blockElement.querySelector('.quiz-retry');
		const solutionButton = blockElement.querySelector('.quiz-solution');
		const resultsContainer = blockElement.querySelector('.quiz-results');
		const resultMessage = blockElement.querySelector('.result-message');
		const scoreDisplay = blockElement.querySelector('.score-display');
		const feedbackContainer = blockElement.querySelector('.feedback-container');

		let isChecked = false;
		let userAnswers = [];

		// Setup answer inputs
		const answerInputs = blockElement.querySelectorAll('.answer-input');

		// Randomize answers if needed
		if (config.randomizeAnswers) {
			randomizeAnswers();
		}

		// Setup buttons
		if (checkButton) {
			checkButton.addEventListener('click', handleCheck);
		}
		if (retryButton) {
			retryButton.addEventListener('click', handleRetry);
		}
		if (solutionButton) {
			solutionButton.addEventListener('click', showSolution);
		}

		// Setup radio button behavior (single choice)
		if (!config.multipleCorrect) {
			answerInputs.forEach(input => {
				input.addEventListener('change', function() {
					if (isChecked) return;
					// Ensure only one radio is selected
					answerInputs.forEach(otherInput => {
						if (otherInput !== input) {
							otherInput.checked = false;
						}
					});
				});
			});
		}

		function randomizeAnswers() {
			const answerOptions = Array.from(answersSection.querySelectorAll('.answer-option'));

			// Shuffle array
			for (let i = answerOptions.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[answerOptions[i], answerOptions[j]] = [answerOptions[j], answerOptions[i]];
			}

			// Re-append in shuffled order
			answerOptions.forEach(option => answersSection.appendChild(option));
		}

		function handleCheck() {
			if (config.confirmCheck) {
				if (!confirm('Möchten Sie Ihre Antworten wirklich überprüfen?')) {
					return;
				}
			}

			isChecked = true;
			checkAnswers();
		}

		function handleRetry() {
			if (config.confirmRetry) {
				if (!confirm('Möchten Sie wirklich von vorne beginnen?')) {
					return;
				}
			}

			retry();
		}

		function checkAnswers() {
			userAnswers = [];
			let score = 0;
			let totalCorrect = 0;
			let feedbackHTML = '';

			// Count total correct answers
			config.answers.forEach(answer => {
				if (answer.isCorrect) {
					totalCorrect++;
				}
			});

			// Get user selections
			answerInputs.forEach((input, index) => {
				const answerOption = input.closest('.answer-option');
				const isCorrect = input.getAttribute('data-is-correct') === 'true';
				const isSelected = input.checked;
				const feedback = input.getAttribute('data-feedback');

				userAnswers.push({
					index: index,
					isCorrect: isCorrect,
					isSelected: isSelected,
					feedback: feedback
				});

				// Mark answer visually
				answerOption.classList.remove('correct', 'incorrect', 'correct-not-selected');

				if (isSelected) {
					if (isCorrect) {
						answerOption.classList.add('correct');
						score++;
					} else {
						answerOption.classList.add('incorrect');
					}
				} else {
					if (isCorrect) {
						answerOption.classList.add('correct-not-selected');
					}
				}

				// Add feedback if enabled and selected
				if (config.showFeedback && isSelected && feedback) {
					feedbackHTML += `<div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
						<strong>${isCorrect ? '✓' : '✗'}</strong> ${feedback}
					</div>`;
				}

				// Disable input
				input.disabled = true;
			});

			// Display results
			displayResults(score, totalCorrect, feedbackHTML);

			// Show retry/solution buttons
			checkButton.style.display = 'none';
			if (retryButton) retryButton.style.display = 'inline-block';
			if (solutionButton) solutionButton.style.display = 'inline-block';
		}

		function displayResults(score, total, feedbackHTML) {
			if (!resultsContainer) return;

			resultsContainer.style.display = 'block';

			const percentage = total > 0 ? (score / total) * 100 : 0;
			let message = '';

			if (percentage >= config.passPercentage) {
				message = config.successText;
			} else {
				message = config.failText;
			}

			if (resultMessage) {
				resultMessage.textContent = message;
				resultMessage.className = 'result-message ' + (percentage >= config.passPercentage ? 'success' : 'fail');
			}

			if (scoreDisplay) {
				const scoreText = config.scoreText
					.replace('@score', score)
					.replace('@total', total);
				scoreDisplay.textContent = scoreText;
			}

			if (feedbackContainer && config.showFeedback && feedbackHTML) {
				feedbackContainer.innerHTML = feedbackHTML;
			}
		}

		function retry() {
			isChecked = false;
			userAnswers = [];

			// Reset all inputs
			answerInputs.forEach(input => {
				input.checked = false;
				input.disabled = false;
				const answerOption = input.closest('.answer-option');
				answerOption.classList.remove('correct', 'incorrect', 'correct-not-selected');
			});

			// Randomize again if enabled
			if (config.randomizeAnswers) {
				randomizeAnswers();
			}

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
			// Uncheck all
			answerInputs.forEach(input => {
				input.checked = false;
				const answerOption = input.closest('.answer-option');
				answerOption.classList.remove('correct', 'incorrect', 'correct-not-selected');
			});

			// Mark and check correct answers
			answerInputs.forEach((input, index) => {
				const isCorrect = input.getAttribute('data-is-correct') === 'true';
				const answerOption = input.closest('.answer-option');

				if (isCorrect) {
					input.checked = true;
					answerOption.classList.add('correct', 'solution');
				}

				input.disabled = true;
			});

			// Update results
			let totalCorrect = 0;
			config.answers.forEach(answer => {
				if (answer.isCorrect) {
					totalCorrect++;
				}
			});

			if (resultsContainer) {
				resultsContainer.style.display = 'block';
				if (resultMessage) {
					resultMessage.textContent = 'Lösung wird angezeigt.';
					resultMessage.className = 'result-message solution';
				}
				if (scoreDisplay) {
					scoreDisplay.textContent = `${totalCorrect} von ${totalCorrect} richtig`;
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

	// Initialize all multiple-choice blocks on page load
	document.addEventListener('DOMContentLoaded', function() {
		const blocks = document.querySelectorAll('.wp-block-modular-blocks-multiple-choice');
		blocks.forEach(block => {
			window.initMultipleChoice(block);
		});
	});
})();
