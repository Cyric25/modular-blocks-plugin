/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    RichText,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl,
    Button,
    TextareaControl,
    RangeControl,
    Card,
    CardHeader,
    CardBody,
    Icon,
    Modal,
    Notice,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { plus, trash, chevronUp, chevronDown, upload } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Block registration
 */
registerBlockType('modular-blocks/statement-summary', {
    edit: ({ attributes, setAttributes, className }) => {
        const {
            title,
            instruction,
            statements,
            randomizeStatements,
            showRetry,
            showSolution,
            successText,
            errorText,
            partialText,
            summaryTitle,
            buttonCheckText,
            buttonRetryText,
            buttonSolutionText,
        } = attributes;

        // CSV Import State
        const [showCSVModal, setShowCSVModal] = useState(false);
        const [csvText, setCsvText] = useState('');
        const [csvError, setCsvError] = useState('');

        const updateStatement = (index, field, value) => {
            const newStatements = [...statements];
            newStatements[index] = {
                ...newStatements[index],
                [field]: value,
            };
            setAttributes({ statements: newStatements });
        };

        const addStatement = () => {
            const newStatements = [
                ...statements,
                {
                    text: `Aussage ${statements.length + 1}`,
                    isCorrect: false,
                    order: 0,
                },
            ];
            setAttributes({ statements: newStatements });
        };

        const removeStatement = (index) => {
            if (statements.length <= 2) return; // Minimum 2 statements
            const newStatements = statements.filter((_, i) => i !== index);
            setAttributes({ statements: newStatements });
        };

        const moveStatement = (index, direction) => {
            if (
                (direction === 'up' && index === 0) ||
                (direction === 'down' && index === statements.length - 1)
            ) {
                return;
            }

            const newStatements = [...statements];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newStatements[index], newStatements[targetIndex]] = [
                newStatements[targetIndex],
                newStatements[index],
            ];
            setAttributes({ statements: newStatements });
        };

        /**
         * Parse CSV text and import statements
         * Format: Aussage,Korrekt
         * Empty lines separate statement blocks
         */
        const parseCSV = (csvContent) => {
            setCsvError('');

            const lines = csvContent.trim().split('\n');
            if (lines.length === 0) {
                setCsvError('CSV ist leer');
                return;
            }

            const newStatements = [];
            let correctOrder = 1;
            let hasHeader = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines
                if (line === '') continue;

                // Check if first line is header
                if (i === 0 && (line.toLowerCase().includes('aussage') || line.toLowerCase().includes('korrekt'))) {
                    hasHeader = true;
                    continue;
                }

                // Parse CSV line (handle quotes)
                const match = line.match(/^"?([^"]*)"?\s*,\s*"?([^"]*)"?$/);
                if (!match) {
                    setCsvError(`Fehler in Zeile ${i + 1}: Ungültiges Format. Verwenden Sie: Aussage,Korrekt`);
                    return;
                }

                const text = match[1].trim();
                const correctValue = match[2].trim().toLowerCase();

                // Validate correct value
                const isCorrect = correctValue === 'ja' || correctValue === 'yes' || correctValue === 'true' || correctValue === '1';
                const isIncorrect = correctValue === 'nein' || correctValue === 'no' || correctValue === 'false' || correctValue === '0';

                if (!isCorrect && !isIncorrect) {
                    setCsvError(`Fehler in Zeile ${i + 1}: "Korrekt" muss "Ja" oder "Nein" sein`);
                    return;
                }

                // Add statement
                newStatements.push({
                    text: text,
                    isCorrect: isCorrect,
                    order: isCorrect ? correctOrder++ : 0
                });
            }

            if (newStatements.length === 0) {
                setCsvError('Keine gültigen Aussagen gefunden');
                return;
            }

            // Success - replace all statements
            setAttributes({ statements: newStatements });
            setShowCSVModal(false);
            setCsvText('');
            setCsvError('');
        };

        const handleCSVImport = () => {
            if (!csvText.trim()) {
                setCsvError('Bitte geben Sie CSV-Daten ein');
                return;
            }
            parseCSV(csvText);
        };

        // Count correct statements for order validation
        const correctCount = statements.filter(s => s.isCorrect).length;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Block-Einstellungen', 'modular-blocks-plugin')} initialOpen={true}>
                        <ToggleControl
                            label={__('Aussagen randomisieren', 'modular-blocks-plugin')}
                            help={__('Aussagen werden bei jedem Laden in zufälliger Reihenfolge angezeigt', 'modular-blocks-plugin')}
                            checked={randomizeStatements}
                            onChange={(value) => setAttributes({ randomizeStatements: value })}
                        />
                        <ToggleControl
                            label={__('Erneut-Versuchen-Button anzeigen', 'modular-blocks-plugin')}
                            checked={showRetry}
                            onChange={(value) => setAttributes({ showRetry: value })}
                        />
                        <ToggleControl
                            label={__('Lösung-Button anzeigen', 'modular-blocks-plugin')}
                            checked={showSolution}
                            onChange={(value) => setAttributes({ showSolution: value })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Texte anpassen', 'modular-blocks-plugin')} initialOpen={false}>
                        <TextControl
                            label={__('Titel der Zusammenfassung', 'modular-blocks-plugin')}
                            value={summaryTitle}
                            onChange={(value) => setAttributes({ summaryTitle: value })}
                        />
                        <TextareaControl
                            label={__('Erfolgstext', 'modular-blocks-plugin')}
                            value={successText}
                            onChange={(value) => setAttributes({ successText: value })}
                            rows={3}
                        />
                        <TextareaControl
                            label={__('Fehlertext', 'modular-blocks-plugin')}
                            value={errorText}
                            onChange={(value) => setAttributes({ errorText: value })}
                            rows={2}
                        />
                        <TextareaControl
                            label={__('Teilweise-richtig-Text', 'modular-blocks-plugin')}
                            help={__('Verwenden Sie @correct und @total als Platzhalter', 'modular-blocks-plugin')}
                            value={partialText}
                            onChange={(value) => setAttributes({ partialText: value })}
                            rows={2}
                        />
                        <TextControl
                            label={__('Überprüfen-Button', 'modular-blocks-plugin')}
                            value={buttonCheckText}
                            onChange={(value) => setAttributes({ buttonCheckText: value })}
                        />
                        <TextControl
                            label={__('Erneut-Versuchen-Button', 'modular-blocks-plugin')}
                            value={buttonRetryText}
                            onChange={(value) => setAttributes({ buttonRetryText: value })}
                        />
                        <TextControl
                            label={__('Lösung-Button', 'modular-blocks-plugin')}
                            value={buttonSolutionText}
                            onChange={(value) => setAttributes({ buttonSolutionText: value })}
                        />
                    </PanelBody>
                </InspectorControls>

                <div className={className}>
                    <div className="statement-summary-editor">
                        <RichText
                            tagName="h3"
                            value={title}
                            onChange={(value) => setAttributes({ title: value })}
                            placeholder={__('Block-Titel eingeben...', 'modular-blocks-plugin')}
                            className="statement-summary-title"
                        />
                        <RichText
                            tagName="p"
                            value={instruction}
                            onChange={(value) => setAttributes({ instruction: value })}
                            placeholder={__('Instruktion für die Lernenden...', 'modular-blocks-plugin')}
                            className="statement-summary-instruction"
                        />

                        <div className="statements-editor">
                            <h4>{__('Aussagen', 'modular-blocks-plugin')}</h4>
                            <p className="help-text">
                                {__('Fügen Sie Aussagen hinzu und markieren Sie die richtigen. Die Reihenfolge bestimmt, wie sich der finale Text aufbaut.', 'modular-blocks-plugin')}
                            </p>

                            {statements.map((statement, index) => (
                                <Card key={index} className="statement-card">
                                    <CardHeader>
                                        <div className="statement-header">
                                            <strong>{__('Aussage', 'modular-blocks-plugin')} {index + 1}</strong>
                                            <div className="statement-actions">
                                                <Button
                                                    icon={chevronUp}
                                                    onClick={() => moveStatement(index, 'up')}
                                                    disabled={index === 0}
                                                    label={__('Nach oben', 'modular-blocks-plugin')}
                                                    isSmall
                                                />
                                                <Button
                                                    icon={chevronDown}
                                                    onClick={() => moveStatement(index, 'down')}
                                                    disabled={index === statements.length - 1}
                                                    label={__('Nach unten', 'modular-blocks-plugin')}
                                                    isSmall
                                                />
                                                <Button
                                                    icon={trash}
                                                    onClick={() => removeStatement(index)}
                                                    disabled={statements.length <= 2}
                                                    label={__('Löschen', 'modular-blocks-plugin')}
                                                    isDestructive
                                                    isSmall
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <TextareaControl
                                            label={__('Aussagetext', 'modular-blocks-plugin')}
                                            value={statement.text}
                                            onChange={(value) => updateStatement(index, 'text', value)}
                                            rows={3}
                                        />
                                        <ToggleControl
                                            label={__('Richtige Aussage', 'modular-blocks-plugin')}
                                            checked={statement.isCorrect}
                                            onChange={(value) => {
                                                updateStatement(index, 'isCorrect', value);
                                                if (!value) {
                                                    updateStatement(index, 'order', 0);
                                                }
                                            }}
                                        />
                                        {statement.isCorrect && (
                                            <RangeControl
                                                label={__('Reihenfolge in der Zusammenfassung', 'modular-blocks-plugin')}
                                                help={__('Position dieser Aussage im finalen Text (1 = erste Aussage)', 'modular-blocks-plugin')}
                                                value={statement.order}
                                                onChange={(value) => updateStatement(index, 'order', value)}
                                                min={1}
                                                max={Math.max(correctCount, 1)}
                                            />
                                        )}
                                    </CardBody>
                                </Card>
                            ))}

                            <div className="statement-actions-group">
                                <Button
                                    variant="secondary"
                                    onClick={addStatement}
                                    icon={plus}
                                    className="add-statement-button"
                                >
                                    {__('Aussage hinzufügen', 'modular-blocks-plugin')}
                                </Button>
                                <Button
                                    variant="tertiary"
                                    onClick={() => setShowCSVModal(true)}
                                    icon={upload}
                                    className="csv-import-button"
                                >
                                    {__('CSV importieren', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        </div>

                        <div className="editor-preview">
                            <p className="preview-label">{__('Vorschau (Frontend):', 'modular-blocks-plugin')}</p>
                            <div className="preview-info">
                                {correctCount > 0 ? (
                                    <p>
                                        ✓ {correctCount} {__('richtige Aussage(n) definiert', 'modular-blocks-plugin')}
                                    </p>
                                ) : (
                                    <p className="warning">
                                        ⚠ {__('Keine richtigen Aussagen definiert', 'modular-blocks-plugin')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showCSVModal && (
                    <Modal
                        title={__('CSV-Daten importieren', 'modular-blocks-plugin')}
                        onRequestClose={() => {
                            setShowCSVModal(false);
                            setCsvText('');
                            setCsvError('');
                        }}
                        className="csv-import-modal"
                    >
                        <div className="csv-import-content">
                            <p>
                                {__('Fügen Sie CSV-Daten im folgenden Format ein:', 'modular-blocks-plugin')}
                            </p>
                            <pre className="csv-format-example">
{`Aussage,Korrekt
"Dies ist eine richtige Aussage",Ja
"Dies ist eine falsche Aussage",Nein
"Weitere richtige Aussage",Ja`}
                            </pre>
                            <p className="csv-help-text">
                                <strong>{__('Hinweise:', 'modular-blocks-plugin')}</strong><br />
                                • {__('Erste Zeile kann Header sein (wird automatisch erkannt)', 'modular-blocks-plugin')}<br />
                                • {__('Korrekt-Werte: "Ja", "Nein", "Yes", "No", "1", "0"', 'modular-blocks-plugin')}<br />
                                • {__('Leerzeilen werden übersprungen', 'modular-blocks-plugin')}<br />
                                • {__('Anführungszeichen bei Text mit Kommas verwenden', 'modular-blocks-plugin')}<br />
                                • {__('Reihenfolge wird automatisch vergeben', 'modular-blocks-plugin')}
                            </p>

                            <TextareaControl
                                label={__('CSV-Daten', 'modular-blocks-plugin')}
                                value={csvText}
                                onChange={setCsvText}
                                rows={12}
                                placeholder="Aussage,Korrekt&#10;Text der ersten Aussage,Ja&#10;Text der zweiten Aussage,Nein"
                            />

                            {csvError && (
                                <Notice status="error" isDismissible={false}>
                                    {csvError}
                                </Notice>
                            )}

                            <div className="csv-import-actions">
                                <Button
                                    variant="primary"
                                    onClick={handleCSVImport}
                                    disabled={!csvText.trim()}
                                >
                                    {__('Importieren', 'modular-blocks-plugin')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowCSVModal(false);
                                        setCsvText('');
                                        setCsvError('');
                                    }}
                                >
                                    {__('Abbrechen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </Fragment>
        );
    },

    save: ({ attributes }) => {
        const {
            title,
            instruction,
            statements,
            randomizeStatements,
            showRetry,
            showSolution,
            successText,
            errorText,
            partialText,
            summaryTitle,
            buttonCheckText,
            buttonRetryText,
            buttonSolutionText,
        } = attributes;

        // Prepare data for frontend
        const blockData = {
            randomizeStatements,
            showRetry,
            showSolution,
            successText,
            errorText,
            partialText,
            summaryTitle,
            buttonCheckText,
            buttonRetryText,
            buttonSolutionText,
        };

        return (
            <div
                className="statement-summary-block"
                data-block-config={JSON.stringify(blockData)}
            >
                <div className="summary-header">
                    <h3 className="summary-title">{title}</h3>
                    <p className="summary-instruction">{instruction}</p>
                </div>

                <div className="summary-statements" data-statements={JSON.stringify(statements)}>
                    {statements.map((statement, index) => (
                        <label key={index} className="statement-option" data-index={index}>
                            <input
                                type="checkbox"
                                className="statement-checkbox"
                                value={index}
                                data-correct={statement.isCorrect}
                                data-order={statement.order}
                            />
                            <span className="statement-text">{statement.text}</span>
                        </label>
                    ))}
                </div>

                <div className="summary-result" style={{ display: 'none' }}>
                    <h3 className="result-title">{summaryTitle}</h3>
                    <div className="result-text"></div>
                    <div className="result-feedback"></div>
                </div>

                <div className="summary-actions">
                    <button className="summary-check button-primary">
                        {buttonCheckText}
                    </button>
                    {showRetry && (
                        <button className="summary-retry button-secondary" style={{ display: 'none' }}>
                            {buttonRetryText}
                        </button>
                    )}
                    {showSolution && (
                        <button className="summary-solution button-tertiary" style={{ display: 'none' }}>
                            {buttonSolutionText}
                        </button>
                    )}
                </div>

                <div className="summary-feedback" style={{ display: 'none' }}></div>
            </div>
        );
    },
});
