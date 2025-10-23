import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.css';
import './style.css';

registerBlockType('modular-blocks/drag-the-words', {
	edit: ({ attributes, setAttributes }) => {
		const {
			title,
			description,
			textWithBlanks,
			additionalWords,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableWordReuse,
			showScore,
			randomizeWords,
			highlightCorrectOnDrop,
			caseSensitive,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps();

		// Extract blanks from text
		const extractBlanks = () => {
			const blankPattern = /\*([^*]+)\*/g;
			const matches = textWithBlanks.match(blankPattern);
			return matches ? matches.map(m => m.replace(/\*/g, '')) : [];
		};

		const blanks = extractBlanks();

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
						<ToggleControl
							label={__('Feedback anzeigen', 'modular-blocks-plugin')}
							checked={showFeedback}
							onChange={(value) => setAttributes({ showFeedback: value })}
						/>
						<ToggleControl
							label={__('Wiederholen erlauben', 'modular-blocks-plugin')}
							checked={showRetry}
							onChange={(value) => setAttributes({ showRetry: value })}
						/>
						<ToggleControl
							label={__('Lösung anzeigen', 'modular-blocks-plugin')}
							checked={showSolution}
							onChange={(value) => setAttributes({ showSolution: value })}
						/>
						<ToggleControl
							label={__('Sofortiges Feedback', 'modular-blocks-plugin')}
							checked={instantFeedback}
							onChange={(value) => setAttributes({ instantFeedback: value })}
						/>
						<ToggleControl
							label={__('Wörter wiederverwenden', 'modular-blocks-plugin')}
							checked={enableWordReuse}
							onChange={(value) => setAttributes({ enableWordReuse: value })}
						/>
						<ToggleControl
							label={__('Punktzahl anzeigen', 'modular-blocks-plugin')}
							checked={showScore}
							onChange={(value) => setAttributes({ showScore: value })}
						/>
						<ToggleControl
							label={__('Wörter zufällig anordnen', 'modular-blocks-plugin')}
							checked={randomizeWords}
							onChange={(value) => setAttributes({ randomizeWords: value })}
						/>
						<ToggleControl
							label={__('Korrekte markieren beim Ablegen', 'modular-blocks-plugin')}
							checked={highlightCorrectOnDrop}
							onChange={(value) => setAttributes({ highlightCorrectOnDrop: value })}
						/>
						<ToggleControl
							label={__('Groß-/Kleinschreibung beachten', 'modular-blocks-plugin')}
							checked={caseSensitive}
							onChange={(value) => setAttributes({ caseSensitive: value })}
						/>
					</PanelBody>

					<PanelBody title={__('Texte', 'modular-blocks-plugin')} initialOpen={false}>
						<TextControl
							label={__('Erfolgs-Text', 'modular-blocks-plugin')}
							value={successText}
							onChange={(value) => setAttributes({ successText: value })}
						/>
						<TextControl
							label={__('Teil-Erfolg Text', 'modular-blocks-plugin')}
							value={partialSuccessText}
							onChange={(value) => setAttributes({ partialSuccessText: value })}
						/>
						<TextControl
							label={__('Fehlschlag-Text', 'modular-blocks-plugin')}
							value={failText}
							onChange={(value) => setAttributes({ failText: value })}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					<div className="drag-the-words-container">
						<TextControl
							label={__('Titel', 'modular-blocks-plugin')}
							value={title}
							onChange={(value) => setAttributes({ title: value })}
						/>
						<TextControl
							label={__('Beschreibung', 'modular-blocks-plugin')}
							value={description}
							onChange={(value) => setAttributes({ description: value })}
						/>

						<div style={{ marginTop: '15px' }}>
							<TextareaControl
								label={__('Text mit Lücken', 'modular-blocks-plugin')}
								value={textWithBlanks}
								onChange={(value) => setAttributes({ textWithBlanks: value })}
								help={__('Verwenden Sie *Wort* um Lücken zu markieren. Beispiel: Die *Sonne* scheint hell.', 'modular-blocks-plugin')}
								rows={5}
							/>
						</div>

						{blanks.length > 0 && (
							<div style={{ padding: '10px', background: '#f0f6fc', borderRadius: '4px', marginTop: '10px' }}>
								<strong>{__('Gefundene Lücken:', 'modular-blocks-plugin')}</strong>
								<div style={{ marginTop: '5px' }}>
									{blanks.map((blank, index) => (
										<span
											key={index}
											style={{
												display: 'inline-block',
												margin: '2px',
												padding: '2px 6px',
												background: '#0073aa',
												color: 'white',
												borderRadius: '3px',
												fontSize: '12px',
											}}
										>
											{blank}
										</span>
									))}
								</div>
							</div>
						)}

						<div style={{ marginTop: '15px' }}>
							<TextareaControl
								label={__('Zusatzwörter (optional)', 'modular-blocks-plugin')}
								value={additionalWords}
								onChange={(value) => setAttributes({ additionalWords: value })}
								help={__('Geben Sie zusätzliche falsche Wörter ein (ein Wort pro Zeile), die als Distraktoren dienen.', 'modular-blocks-plugin')}
								rows={4}
							/>
						</div>

						<div
							style={{
								marginTop: '15px',
								padding: '10px',
								backgroundColor: '#f0f6fc',
								borderLeft: '4px solid #0073aa',
								fontSize: '12px',
							}}
						>
							{__('Vorschau: Die Drag-the-Words Aktivität funktioniert im Frontend.', 'modular-blocks-plugin')}
						</div>
					</div>
				</div>
			</>
		);
	},

	save: ({ attributes }) => {
		const {
			title,
			description,
			textWithBlanks,
			additionalWords,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableWordReuse,
			showScore,
			randomizeWords,
			highlightCorrectOnDrop,
			caseSensitive,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps.save();

		// Extract blanks (correct words)
		const blankPattern = /\*([^*]+)\*/g;
		const blanks = [];
		let match;
		while ((match = blankPattern.exec(textWithBlanks)) !== null) {
			blanks.push(match[1]);
		}

		// Process text and create blanks
		let blankIndex = 0;
		const processedText = textWithBlanks.replace(/\*([^*]+)\*/g, () => {
			const html = `<span class="word-blank" data-blank="${blankIndex}" data-correct-word="${blanks[blankIndex]}"></span>`;
			blankIndex++;
			return html;
		});

		// Parse additional words (one per line)
		const additionalWordsList = additionalWords
			? additionalWords.split('\n').map(w => w.trim()).filter(w => w.length > 0)
			: [];

		// Combine correct words and additional words
		const allWords = [...blanks, ...additionalWordsList];

		const dragWordsData = {
			textWithBlanks,
			blanks,
			additionalWords: additionalWordsList,
			showFeedback,
			showRetry,
			showSolution,
			instantFeedback,
			enableWordReuse,
			showScore,
			randomizeWords,
			highlightCorrectOnDrop,
			caseSensitive,
			scoreText,
			successText,
			partialSuccessText,
			failText,
		};

		return (
			<div {...blockProps} data-drag-words-config={JSON.stringify(dragWordsData)}>
				<div className="drag-the-words-container">
					{title && <h3 className="drag-words-title">{title}</h3>}
					{description && <p className="drag-words-description">{description}</p>}

					<div className="text-area">
						<div className="text-content" dangerouslySetInnerHTML={{ __html: processedText }} />
					</div>

					<div className="word-bank">
						<h4>{__('Wortbank', 'modular-blocks-plugin')}</h4>
						<div className="word-bank-items">
							{allWords.map((word, index) => (
								<div
									key={index}
									className="draggable-word"
									data-word={word}
									draggable="true"
								>
									{word}
								</div>
							))}
						</div>
					</div>

					<div className="drag-words-controls">
						<button type="button" className="drag-words-button drag-words-check">
							{__('Prüfen', 'modular-blocks-plugin')}
						</button>
						{showRetry && (
							<button type="button" className="drag-words-button drag-words-retry" style={{ display: 'none' }}>
								{__('Wiederholen', 'modular-blocks-plugin')}
							</button>
						)}
						{showSolution && (
							<button type="button" className="drag-words-button drag-words-solution" style={{ display: 'none' }}>
								{__('Lösung anzeigen', 'modular-blocks-plugin')}
							</button>
						)}
					</div>

					{showScore && (
						<div className="drag-words-results" style={{ display: 'none' }}>
							<div className="result-message"></div>
							<div className="score-display"></div>
						</div>
					)}
				</div>
			</div>
		);
	},
});
