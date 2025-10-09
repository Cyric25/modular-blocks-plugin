import { registerBlockType } from '@wordpress/blocks';
import { RichText, InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, TextControl, RangeControl, Button, Card, CardHeader, CardBody, Icon, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

registerBlockType('modular-blocks/multiple-choice', {
	edit: ({ attributes, setAttributes }) => {
		const {
			question,
			questionImage,
			answers,
			multipleCorrect,
			randomizeAnswers,
			showFeedback,
			showTips,
			showRetry,
			showSolution,
			confirmCheck,
			confirmRetry,
			passPercentage,
			scoreText,
			successText,
			failText,
		} = attributes;

		const blockProps = useBlockProps();

		const updateAnswer = (index, field, value) => {
			const newAnswers = [...answers];
			newAnswers[index] = { ...newAnswers[index], [field]: value };
			setAttributes({ answers: newAnswers });
		};

		const toggleCorrect = (index) => {
			const newAnswers = [...answers];
			if (multipleCorrect) {
				newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
			} else {
				newAnswers.forEach((answer, i) => {
					newAnswers[i].isCorrect = i === index;
				});
			}
			setAttributes({ answers: newAnswers });
		};

		const removeAnswer = (index) => {
			if (answers.length <= 2) return;
			const newAnswers = answers.filter((_, i) => i !== index);
			setAttributes({ answers: newAnswers });
		};

		const addAnswer = () => {
			const newAnswers = [
				...answers,
				{
					text: `Antwort ${String.fromCharCode(65 + answers.length)}`,
					isCorrect: false,
					feedback: '',
					tip: '',
				},
			];
			setAttributes({ answers: newAnswers });
		};

		const correctCount = answers.filter((a) => a.isCorrect).length;
		const hasCorrectAnswer = correctCount > 0;

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Frage-Einstellungen', 'modular-blocks-plugin')}>
						<div style={{ marginBottom: '15px' }}>
							<strong>{__('Bild zur Frage (optional)', 'modular-blocks-plugin')}</strong>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
								<MediaUploadCheck>
									<MediaUpload
										onSelect={(media) => {
											setAttributes({
												questionImage: {
													url: media.url,
													alt: media.alt,
													id: media.id,
												},
											});
										}}
										allowedTypes={['image']}
										value={questionImage.id}
										render={({ open }) => (
											<Button onClick={open} variant="secondary" size="small">
												{questionImage.url
													? __('Bild ändern', 'modular-blocks-plugin')
													: __('Bild auswählen', 'modular-blocks-plugin')}
											</Button>
										)}
									/>
								</MediaUploadCheck>
								{questionImage.url && (
									<Button
										onClick={() => {
											setAttributes({ questionImage: { url: '', alt: '', id: null } });
										}}
										variant="tertiary"
										size="small"
										isDestructive
									>
										{__('Entfernen', 'modular-blocks-plugin')}
									</Button>
								)}
							</div>
							{questionImage.url && (
								<img
									src={questionImage.url}
									alt={questionImage.alt}
									style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '4px' }}
								/>
							)}
						</div>
						<ToggleControl
							label={__('Mehrere richtige Antworten erlauben', 'modular-blocks-plugin')}
							checked={multipleCorrect}
							onChange={(value) => {
								setAttributes({ multipleCorrect: value });
								if (!value && correctCount > 1) {
									const newAnswers = [...answers];
									let foundCorrect = false;
									newAnswers.forEach((answer, i) => {
										if (answer.isCorrect && foundCorrect) {
											newAnswers[i].isCorrect = false;
										} else if (answer.isCorrect && !foundCorrect) {
											foundCorrect = true;
										}
									});
									setAttributes({ answers: newAnswers });
								}
							}}
						/>
						<ToggleControl
							label={__('Antworten zufällig anordnen', 'modular-blocks-plugin')}
							checked={randomizeAnswers}
							onChange={(value) => setAttributes({ randomizeAnswers: value })}
						/>
					</PanelBody>
					<PanelBody title={__('Feedback & Verhalten', 'modular-blocks-plugin')}>
						<ToggleControl
							label={__('Feedback anzeigen', 'modular-blocks-plugin')}
							checked={showFeedback}
							onChange={(value) => setAttributes({ showFeedback: value })}
						/>
						<ToggleControl
							label={__('Tipps anzeigen', 'modular-blocks-plugin')}
							checked={showTips}
							onChange={(value) => setAttributes({ showTips: value })}
						/>
						<ToggleControl
							label={__('Wiederholen-Button anzeigen', 'modular-blocks-plugin')}
							checked={showRetry}
							onChange={(value) => setAttributes({ showRetry: value })}
						/>
						<ToggleControl
							label={__('Lösung-Button anzeigen', 'modular-blocks-plugin')}
							checked={showSolution}
							onChange={(value) => setAttributes({ showSolution: value })}
						/>
						<ToggleControl
							label={__('Bestätigung vor Prüfung', 'modular-blocks-plugin')}
							checked={confirmCheck}
							onChange={(value) => setAttributes({ confirmCheck: value })}
						/>
						<ToggleControl
							label={__('Bestätigung vor Wiederholung', 'modular-blocks-plugin')}
							checked={confirmRetry}
							onChange={(value) => setAttributes({ confirmRetry: value })}
						/>
						<RangeControl
							label={__('Bestehen-Schwelle (%)', 'modular-blocks-plugin')}
							value={passPercentage}
							onChange={(value) => setAttributes({ passPercentage: value })}
							min={0}
							max={100}
							step={5}
						/>
					</PanelBody>
					<PanelBody title={__('Texte anpassen', 'modular-blocks-plugin')}>
						<TextControl
							label={__('Punkte-Text', 'modular-blocks-plugin')}
							value={scoreText}
							onChange={(value) => setAttributes({ scoreText: value })}
							help={__('Verwenden Sie @score und @total als Platzhalter.', 'modular-blocks-plugin')}
						/>
						<TextControl
							label={__('Erfolg-Text', 'modular-blocks-plugin')}
							value={successText}
							onChange={(value) => setAttributes({ successText: value })}
						/>
						<TextControl
							label={__('Fehlschlag-Text', 'modular-blocks-plugin')}
							value={failText}
							onChange={(value) => setAttributes({ failText: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps} className="editor-view">
					<div className="multiple-choice-container">
						<div className="question-section">
							{questionImage.url && (
								<div className="question-image">
									<img src={questionImage.url} alt={questionImage.alt} />
								</div>
							)}
							<RichText
								tagName="div"
								className="question-text"
								value={question}
								onChange={(value) => setAttributes({ question: value })}
								placeholder={__('Geben Sie Ihre Frage ein...', 'modular-blocks-plugin')}
								allowedFormats={['core/bold', 'core/italic', 'core/link']}
							/>
						</div>

						<div className="answers-section">
							{answers.map((answer, index) => (
								<Card key={index} className="answer-card">
									<CardHeader>
										<div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
											<label
												style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
											>
												<input
													type={multipleCorrect ? 'checkbox' : 'radio'}
													checked={answer.isCorrect}
													onChange={() => toggleCorrect(index)}
													style={{ margin: 0 }}
												/>
												<span
													style={{
														fontWeight: answer.isCorrect ? 'bold' : 'normal',
														color: answer.isCorrect ? '#00a32a' : '#1e1e1e',
													}}
												>
													{multipleCorrect || answer.isCorrect
														? __('Richtig', 'modular-blocks-plugin')
														: __('Falsch', 'modular-blocks-plugin')}
												</span>
											</label>
											{answers.length > 2 && (
												<Button
													onClick={() => removeAnswer(index)}
													icon={trash}
													variant="tertiary"
													size="small"
													isDestructive
													label={__('Antwort entfernen', 'modular-blocks-plugin')}
												/>
											)}
										</div>
									</CardHeader>
									<CardBody>
										<RichText
											tagName="div"
											className="answer-text-input"
											value={answer.text}
											onChange={(value) => updateAnswer(index, 'text', value)}
											placeholder={__('Antworttext eingeben...', 'modular-blocks-plugin')}
											allowedFormats={['core/bold', 'core/italic']}
										/>
										{showFeedback && (
											<TextareaControl
												label={__('Feedback', 'modular-blocks-plugin')}
												value={answer.feedback}
												onChange={(value) => updateAnswer(index, 'feedback', value)}
												placeholder={__('Feedback für diese Antwort...', 'modular-blocks-plugin')}
												rows={2}
											/>
										)}
										{showTips && (
											<TextControl
												label={__('Tipp (wird beim Hover angezeigt)', 'modular-blocks-plugin')}
												value={answer.tip}
												onChange={(value) => updateAnswer(index, 'tip', value)}
												placeholder={__('Hilfreicher Tipp...', 'modular-blocks-plugin')}
											/>
										)}
									</CardBody>
								</Card>
							))}
						</div>

						<div className="add-answer-section" style={{ margin: '20px 0' }}>
							<Button onClick={addAnswer} icon={plus} variant="secondary" disabled={answers.length >= 8}>
								{__('Antwort hinzufügen', 'modular-blocks-plugin')}
							</Button>
						</div>

						<div
							className="quiz-status"
							style={{
								padding: '15px',
								backgroundColor: hasCorrectAnswer ? '#d7eddb' : '#fcf2cd',
								border: '1px solid ' + (hasCorrectAnswer ? '#00a32a' : '#dba617'),
								borderRadius: '4px',
								marginTop: '20px',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<Icon icon={hasCorrectAnswer ? 'yes-alt' : 'warning'} style={{ color: hasCorrectAnswer ? '#00a32a' : '#dba617' }} />
								<strong>
									{hasCorrectAnswer
										? __('Quiz bereit!', 'modular-blocks-plugin')
										: __('Markieren Sie mindestens eine richtige Antwort', 'modular-blocks-plugin')}
								</strong>
							</div>
							<div style={{ fontSize: '13px', color: '#646970', marginTop: '5px' }}>
								{multipleCorrect
									? __(`${correctCount} richtige Antworten von ${answers.length}`, 'modular-blocks-plugin')
									: __(`${correctCount} richtige Antwort von ${answers.length}`, 'modular-blocks-plugin')}
							</div>
						</div>

						<div
							className="editor-notice"
							style={{
								marginTop: '15px',
								padding: '10px',
								backgroundColor: '#f0f6fc',
								borderLeft: '4px solid #0073aa',
								fontSize: '12px',
								color: '#646970',
							}}
						>
							{__('Vorschau: Das interaktive Quiz funktioniert im Frontend. Im Editor können Sie die Inhalte bearbeiten.', 'modular-blocks-plugin')}
						</div>
					</div>
				</div>
			</>
		);
	},

	save: ({ attributes }) => {
		const {
			question,
			questionImage,
			answers,
			multipleCorrect,
			randomizeAnswers,
			showFeedback,
			showTips,
			showRetry,
			showSolution,
			confirmCheck,
			confirmRetry,
			passPercentage,
			scoreText,
			successText,
			failText,
		} = attributes;

		const blockProps = useBlockProps.save();

		// Prepare display answers (will be randomized by view.js if needed)
		const displayAnswers = randomizeAnswers ? [...answers] : answers;

		const quizData = {
			multipleCorrect,
			randomizeAnswers,
			showFeedback,
			showTips,
			showRetry,
			showSolution,
			confirmCheck,
			confirmRetry,
			passPercentage,
			scoreText,
			successText,
			failText,
			answers: answers.map((a) => ({
				text: a.text,
				isCorrect: a.isCorrect,
				feedback: a.feedback,
				tip: a.tip,
			})),
		};

		return (
			<div {...blockProps} data-quiz-config={JSON.stringify(quizData)}>
				<div className="multiple-choice-container">
					<div className="question-section">
						{questionImage.url && (
							<div className="question-image">
								<img src={questionImage.url} alt={questionImage.alt} />
							</div>
						)}
						<RichText.Content tagName="div" className="question-text" value={question} />
					</div>

					<div className="answers-section">
						{displayAnswers.map((answer, index) => (
							<div key={index} className="answer-option" data-answer-index={index}>
								<input
									type={multipleCorrect ? 'checkbox' : 'radio'}
									name="quiz-answer"
									id={`answer-${index}`}
									className="answer-input"
								/>
								<label htmlFor={`answer-${index}`} className="answer-label" title={showTips && answer.tip ? answer.tip : ''}>
									<RichText.Content tagName="span" className="answer-text" value={answer.text} />
								</label>
							</div>
						))}
					</div>

					<div className="quiz-controls">
						<button type="button" className="quiz-button quiz-check">
							{__('Prüfen', 'modular-blocks-plugin')}
						</button>
						{showRetry && (
							<button type="button" className="quiz-button quiz-retry" style={{ display: 'none' }}>
								{__('Wiederholen', 'modular-blocks-plugin')}
							</button>
						)}
						{showSolution && (
							<button type="button" className="quiz-button quiz-solution" style={{ display: 'none' }}>
								{__('Lösung anzeigen', 'modular-blocks-plugin')}
							</button>
						)}
					</div>

					<div className="quiz-results" style={{ display: 'none' }}>
						<div className="result-message"></div>
						<div className="score-display"></div>
					</div>
				</div>
			</div>
		);
	},
});
