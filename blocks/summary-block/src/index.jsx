import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, Button, Card, CardHeader, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

registerBlockType('modular-blocks/summary-block', {
	edit: ({ attributes, setAttributes }) => {
		const {
			title,
			description,
			statements,
			requiredSelections,
			showFeedback,
			showRetry,
			showSolution,
			allowReordering,
			scoreForSelection,
			scoreForOrder,
			passPercentage,
			instructionText,
			orderText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps();

		const updateStatement = (index, field, value) => {
			const newStatements = [...statements];
			newStatements[index] = { ...newStatements[index], [field]: value };
			setAttributes({ statements: newStatements });
		};

		const addStatement = () => {
			const newStatements = [
				...statements,
				{
					text: `Neue Aussage ${statements.length + 1}`,
					isCorrect: false,
					correctPosition: 0,
					feedback: '',
				},
			];
			setAttributes({ statements: newStatements });
		};

		const removeStatement = (index) => {
			if (statements.length <= 2) return;
			const newStatements = statements.filter((_, i) => i !== index);
			setAttributes({ statements: newStatements });
		};

		const correctStatements = statements.filter((s) => s.isCorrect);

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
						<RangeControl
							label={__('Anzahl auszuwählender Aussagen', 'modular-blocks-plugin')}
							value={requiredSelections}
							onChange={(value) => setAttributes({ requiredSelections: value })}
							min={1}
							max={10}
						/>
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
							label={__('Neuordnung erlauben', 'modular-blocks-plugin')}
							checked={allowReordering}
							onChange={(value) => setAttributes({ allowReordering: value })}
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
					<div className="summary-block-container">
						<div className="summary-header">
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
						</div>

						<div className="statements-section">
							<h4>{__('Aussagen', 'modular-blocks-plugin')}</h4>
							{statements.map((statement, index) => (
								<Card key={index} style={{ marginBottom: '10px' }}>
									<CardHeader>
										<div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
											<input
												type="checkbox"
												checked={statement.isCorrect}
												onChange={() => updateStatement(index, 'isCorrect', !statement.isCorrect)}
											/>
											<span style={{ fontWeight: statement.isCorrect ? 'bold' : 'normal', flex: 1 }}>
												{statement.isCorrect
													? __('Richtig', 'modular-blocks-plugin')
													: __('Falsch/Distraktor', 'modular-blocks-plugin')}
											</span>
											{statements.length > 2 && (
												<Button
													onClick={() => removeStatement(index)}
													icon={trash}
													variant="tertiary"
													size="small"
													isDestructive
												/>
											)}
										</div>
									</CardHeader>
									<CardBody>
										<TextControl
											label={__('Text', 'modular-blocks-plugin')}
											value={statement.text}
											onChange={(value) => updateStatement(index, 'text', value)}
										/>
										{statement.isCorrect && (
											<RangeControl
												label={__('Korrekte Position', 'modular-blocks-plugin')}
												value={statement.correctPosition}
												onChange={(value) => updateStatement(index, 'correctPosition', value)}
												min={1}
												max={requiredSelections}
											/>
										)}
										{showFeedback && (
											<TextControl
												label={__('Feedback', 'modular-blocks-plugin')}
												value={statement.feedback}
												onChange={(value) => updateStatement(index, 'feedback', value)}
											/>
										)}
									</CardBody>
								</Card>
							))}
							<Button onClick={addStatement} icon={plus} variant="secondary">
								{__('Aussage hinzufügen', 'modular-blocks-plugin')}
							</Button>
						</div>

						<div
							className="summary-status"
							style={{
								padding: '15px',
								backgroundColor: correctStatements.length >= requiredSelections ? '#d7eddb' : '#fcf2cd',
								border: '1px solid ' + (correctStatements.length >= requiredSelections ? '#00a32a' : '#dba617'),
								borderRadius: '4px',
								marginTop: '20px',
							}}
						>
							<strong>
								{correctStatements.length >= requiredSelections
									? __('Bereit!', 'modular-blocks-plugin')
									: __('Markieren Sie mindestens ' + requiredSelections + ' richtige Aussagen', 'modular-blocks-plugin')}
							</strong>
							<div style={{ fontSize: '13px', marginTop: '5px' }}>
								{__(`${correctStatements.length} richtige Aussagen von ${statements.length}`, 'modular-blocks-plugin')}
							</div>
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
			statements,
			requiredSelections,
			showFeedback,
			showRetry,
			showSolution,
			allowReordering,
			scoreForSelection,
			scoreForOrder,
			passPercentage,
			instructionText,
			orderText,
			successText,
			partialSuccessText,
			failText,
		} = attributes;

		const blockProps = useBlockProps.save();

		const summaryData = {
			statements,
			requiredSelections,
			showFeedback,
			showRetry,
			showSolution,
			allowReordering,
			scoreForSelection,
			scoreForOrder,
			passPercentage,
			instructionText,
			orderText,
			successText,
			partialSuccessText,
			failText,
		};

		return (
			<div {...blockProps} data-summary-config={JSON.stringify(summaryData)}>
				<div className="summary-block-container">
					{title && <h3 className="summary-title">{title}</h3>}
					{description && <p className="summary-description">{description}</p>}

					<div className="instruction-text">
						<p>{instructionText.replace('@count', requiredSelections)}</p>
					</div>

					<div className="statements-list">
						{statements.map((statement, index) => (
							<div key={index} className="statement-item" data-statement-index={index}>
								<button type="button" className="statement-button">
									{statement.text}
								</button>
							</div>
						))}
					</div>

					<div className="selected-area" style={{ display: 'none' }}>
						<h4>{orderText}</h4>
						<div className="selected-statements"></div>
					</div>

					<div className="summary-controls">
						<button type="button" className="summary-button summary-check" disabled>
							{__('Prüfen', 'modular-blocks-plugin')}
						</button>
						{showRetry && (
							<button type="button" className="summary-button summary-retry" style={{ display: 'none' }}>
								{__('Wiederholen', 'modular-blocks-plugin')}
							</button>
						)}
						{showSolution && (
							<button type="button" className="summary-button summary-solution" style={{ display: 'none' }}>
								{__('Lösung anzeigen', 'modular-blocks-plugin')}
							</button>
						)}
					</div>

					<div className="summary-results" style={{ display: 'none' }}>
						<div className="result-message"></div>
					</div>
				</div>
			</div>
		);
	},
});
