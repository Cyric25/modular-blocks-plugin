/**
 * Summary Block - Editor (H5P-Style)
 *
 * Supports CSV import with format:
 * Aussage,Richtig
 * Text der Aussage,true
 * Falsche Aussage,false
 *
 * (empty line separates groups)
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    Button,
    ToggleControl,
    TextareaControl,
    Notice,
    RangeControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';

/**
 * Parse CSV content into statement groups
 * Format: Aussage,Richtig (with empty lines separating groups)
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const groups = [];
    let currentGroup = [];
    let groupIndex = 0;
    let statementIndex = 0;

    // Skip header if present
    let startIndex = 0;
    if (lines.length > 0) {
        const firstLine = lines[0].toLowerCase().trim();
        if (firstLine.includes('aussage') || firstLine.includes('richtig') || firstLine.includes('statement') || firstLine.includes('correct')) {
            startIndex = 1;
        }
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();

        // Empty line = new group
        if (line === '') {
            if (currentGroup.length > 0) {
                groups.push({
                    id: `group${groupIndex}`,
                    statements: currentGroup
                });
                currentGroup = [];
                groupIndex++;
            }
            continue;
        }

        // Parse CSV line (handle quoted strings)
        const parts = parseCSVLine(line);
        if (parts.length >= 2) {
            const text = parts[0].trim();
            const isCorrectStr = parts[1].trim().toLowerCase();
            const isCorrect = isCorrectStr === 'true' || isCorrectStr === '1' || isCorrectStr === 'ja' || isCorrectStr === 'yes' || isCorrectStr === 'wahr';

            if (text) {
                currentGroup.push({
                    id: `s${statementIndex}`,
                    text: text,
                    isCorrect: isCorrect
                });
                statementIndex++;
            }
        }
    }

    // Add last group if not empty
    if (currentGroup.length > 0) {
        groups.push({
            id: `group${groupIndex}`,
            statements: currentGroup
        });
    }

    return groups;
}

/**
 * Parse a single CSV line, handling quoted strings
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Generate CSV from statement groups
 */
function generateCSV(groups) {
    let csv = 'Aussage,Richtig\n';

    groups.forEach((group, groupIndex) => {
        group.statements.forEach(statement => {
            // Escape quotes in text
            const text = statement.text.includes(',') || statement.text.includes('"')
                ? `"${statement.text.replace(/"/g, '""')}"`
                : statement.text;
            csv += `${text},${statement.isCorrect ? 'true' : 'false'}\n`;
        });

        // Add empty line between groups (except after last)
        if (groupIndex < groups.length - 1) {
            csv += '\n';
        }
    });

    return csv;
}

registerBlockType('modular-blocks/summary-block', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const {
            title,
            description,
            statementGroups,
            progressiveReveal,
            showFeedback,
            showRetry,
            showSolution,
            shuffleStatements,
            shuffleGroups,
            penaltyPerWrongAnswer,
            successText,
            partialSuccessText,
            failText,
            summaryTitle
        } = attributes;

        const [csvInput, setCsvInput] = useState('');
        const [importError, setImportError] = useState('');
        const [importSuccess, setImportSuccess] = useState('');
        const fileInputRef = useRef(null);

        // Handle CSV import
        const handleCsvImport = () => {
            setImportError('');
            setImportSuccess('');

            if (!csvInput.trim()) {
                setImportError(__('Bitte fügen Sie CSV-Daten ein.', 'modular-blocks-plugin'));
                return;
            }

            const groups = parseCSV(csvInput);

            if (groups.length === 0) {
                setImportError(__('Keine gültigen Aussagen gefunden. Format: Aussage,Richtig', 'modular-blocks-plugin'));
                return;
            }

            // Count statements
            const totalStatements = groups.reduce((sum, g) => sum + g.statements.length, 0);
            const correctStatements = groups.reduce((sum, g) =>
                sum + g.statements.filter(s => s.isCorrect).length, 0);

            setAttributes({ statementGroups: groups });
            setImportSuccess(
                `${groups.length} ${__('Gruppen', 'modular-blocks-plugin')} ` +
                `${__('mit', 'modular-blocks-plugin')} ${totalStatements} ${__('Aussagen importiert', 'modular-blocks-plugin')} ` +
                `(${correctStatements} ${__('richtig', 'modular-blocks-plugin')}, ${totalStatements - correctStatements} ${__('falsch', 'modular-blocks-plugin')}).`
            );
            setCsvInput('');
        };

        // Handle file upload
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setImportError('');
            setImportSuccess('');

            // Validate file type
            const validTypes = ['text/csv', 'text/plain', 'application/csv', 'text/comma-separated-values'];
            const isValidType = validTypes.includes(file.type) ||
                               file.name.endsWith('.csv') ||
                               file.name.endsWith('.txt');

            if (!isValidType) {
                setImportError(__('Bitte wählen Sie eine CSV- oder TXT-Datei.', 'modular-blocks-plugin'));
                event.target.value = ''; // Reset file input
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                setCsvInput(content);
                setImportSuccess(__('Datei geladen. Klicken Sie auf "CSV importieren" um fortzufahren.', 'modular-blocks-plugin'));
            };

            reader.onerror = () => {
                setImportError(__('Fehler beim Laden der Datei.', 'modular-blocks-plugin'));
            };

            reader.readAsText(file, 'UTF-8');

            // Reset file input for re-upload of same file
            event.target.value = '';
        };

        // Handle CSV export
        const handleCsvExport = () => {
            const csv = generateCSV(statementGroups);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'summary-statements.csv';
            link.click();
        };

        // Add new group
        const addGroup = () => {
            const newGroups = [...statementGroups, {
                id: `group${Date.now()}`,
                statements: [
                    { id: `s${Date.now()}a`, text: 'Richtige Aussage', isCorrect: true },
                    { id: `s${Date.now()}b`, text: 'Falsche Aussage', isCorrect: false }
                ]
            }];
            setAttributes({ statementGroups: newGroups });
        };

        // Remove group
        const removeGroup = (groupIndex) => {
            const newGroups = statementGroups.filter((_, i) => i !== groupIndex);
            setAttributes({ statementGroups: newGroups });
        };

        // Add statement to group
        const addStatement = (groupIndex) => {
            const newGroups = [...statementGroups];
            newGroups[groupIndex].statements.push({
                id: `s${Date.now()}`,
                text: 'Neue Aussage',
                isCorrect: false
            });
            setAttributes({ statementGroups: newGroups });
        };

        // Update statement
        const updateStatement = (groupIndex, statementIndex, field, value) => {
            const newGroups = [...statementGroups];
            newGroups[groupIndex].statements[statementIndex][field] = value;
            setAttributes({ statementGroups: newGroups });
        };

        // Remove statement
        const removeStatement = (groupIndex, statementIndex) => {
            const newGroups = [...statementGroups];
            newGroups[groupIndex].statements = newGroups[groupIndex].statements.filter((_, i) => i !== statementIndex);
            setAttributes({ statementGroups: newGroups });
        };

        // Count statistics
        const totalGroups = statementGroups.length;
        const totalStatements = statementGroups.reduce((sum, g) => sum + g.statements.length, 0);
        const correctStatements = statementGroups.reduce((sum, g) =>
            sum + g.statements.filter(s => s.isCorrect).length, 0);

        // CSV Import Component (reusable)
        const CsvImportSection = ({ inBlock = false }) => (
            <div style={{
                marginTop: inBlock ? '20px' : '0',
                padding: inBlock ? '15px' : '0',
                backgroundColor: inBlock ? '#f0f0f0' : 'transparent',
                borderRadius: inBlock ? '4px' : '0'
            }}>
                {inBlock && <h4 style={{ marginTop: 0 }}>{__('CSV Import', 'modular-blocks-plugin')}</h4>}

                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain,application/csv,text/comma-separated-values"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        style={{ marginRight: '10px' }}
                    >
                        {__('CSV-Datei wählen', 'modular-blocks-plugin')}
                    </Button>
                    <Button
                        onClick={handleCsvExport}
                        variant="secondary"
                    >
                        {__('Als CSV exportieren', 'modular-blocks-plugin')}
                    </Button>
                </div>

                <TextareaControl
                    label={__('CSV-Daten einfügen', 'modular-blocks-plugin')}
                    help={__('Format: Aussage,Richtig (true/false). Leerzeilen trennen Gruppen.', 'modular-blocks-plugin')}
                    value={csvInput}
                    onChange={setCsvInput}
                    rows={inBlock ? 8 : 6}
                />

                <Button
                    onClick={handleCsvImport}
                    variant="primary"
                    disabled={!csvInput.trim()}
                >
                    {__('CSV importieren', 'modular-blocks-plugin')}
                </Button>

                {importError && (
                    <Notice status="error" isDismissible={false} style={{ marginTop: '10px' }}>
                        {importError}
                    </Notice>
                )}

                {importSuccess && (
                    <Notice status="success" isDismissible={false} style={{ marginTop: '10px' }}>
                        {importSuccess}
                    </Notice>
                )}
            </div>
        );

        return (
            <div {...blockProps}>
                <InspectorControls>
                    {/* CSV Import Panel */}
                    <PanelBody title={__('CSV Import/Export', 'modular-blocks-plugin')} initialOpen={true}>
                        <CsvImportSection inBlock={false} />
                    </PanelBody>

                    {/* General Settings */}
                    <PanelBody title={__('Einstellungen', 'modular-blocks-plugin')} initialOpen={false}>
                        <TextControl
                            label={__('Titel', 'modular-blocks-plugin')}
                            value={title}
                            onChange={(value) => setAttributes({ title: value })}
                        />
                        <TextareaControl
                            label={__('Beschreibung', 'modular-blocks-plugin')}
                            value={description}
                            onChange={(value) => setAttributes({ description: value })}
                        />
                        <TextControl
                            label={__('Zusammenfassungs-Titel', 'modular-blocks-plugin')}
                            value={summaryTitle}
                            onChange={(value) => setAttributes({ summaryTitle: value })}
                        />
                    </PanelBody>

                    {/* Behavior Options */}
                    <PanelBody title={__('Verhalten', 'modular-blocks-plugin')} initialOpen={false}>
                        <ToggleControl
                            label={__('Progressive Anzeige', 'modular-blocks-plugin')}
                            help={__('Zeige Gruppen nacheinander an', 'modular-blocks-plugin')}
                            checked={progressiveReveal}
                            onChange={(value) => setAttributes({ progressiveReveal: value })}
                        />
                        <ToggleControl
                            label={__('Aussagen mischen', 'modular-blocks-plugin')}
                            checked={shuffleStatements}
                            onChange={(value) => setAttributes({ shuffleStatements: value })}
                        />
                        <ToggleControl
                            label={__('Gruppen mischen', 'modular-blocks-plugin')}
                            checked={shuffleGroups}
                            onChange={(value) => setAttributes({ shuffleGroups: value })}
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
                        <RangeControl
                            label={__('Punktabzug pro Fehler', 'modular-blocks-plugin')}
                            value={penaltyPerWrongAnswer}
                            onChange={(value) => setAttributes({ penaltyPerWrongAnswer: value })}
                            min={0}
                            max={5}
                        />
                    </PanelBody>

                    {/* Feedback Texts */}
                    <PanelBody title={__('Feedback-Texte', 'modular-blocks-plugin')} initialOpen={false}>
                        <TextareaControl
                            label={__('Erfolgstext', 'modular-blocks-plugin')}
                            value={successText}
                            onChange={(value) => setAttributes({ successText: value })}
                        />
                        <TextareaControl
                            label={__('Teilerfolg-Text', 'modular-blocks-plugin')}
                            value={partialSuccessText}
                            onChange={(value) => setAttributes({ partialSuccessText: value })}
                        />
                        <TextareaControl
                            label={__('Fehler-Text', 'modular-blocks-plugin')}
                            value={failText}
                            onChange={(value) => setAttributes({ failText: value })}
                        />
                    </PanelBody>

                    {/* Manual Statement Editing */}
                    <PanelBody title={__('Aussagen bearbeiten', 'modular-blocks-plugin')} initialOpen={false}>
                        <Button onClick={addGroup} variant="primary" style={{ marginBottom: '15px' }}>
                            {__('Neue Gruppe hinzufügen', 'modular-blocks-plugin')}
                        </Button>

                        {statementGroups.map((group, groupIndex) => (
                            <div key={group.id} style={{
                                marginBottom: '20px',
                                padding: '10px',
                                border: '1px solid #007cba',
                                borderRadius: '4px',
                                backgroundColor: '#f0f7fc'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong>{__('Gruppe', 'modular-blocks-plugin')} {groupIndex + 1}</strong>
                                    <Button
                                        onClick={() => removeGroup(groupIndex)}
                                        variant="secondary"
                                        isSmall
                                        isDestructive
                                    >
                                        {__('Gruppe löschen', 'modular-blocks-plugin')}
                                    </Button>
                                </div>

                                {group.statements.map((statement, statementIndex) => (
                                    <div key={statement.id} style={{
                                        marginBottom: '10px',
                                        padding: '8px',
                                        backgroundColor: statement.isCorrect ? '#d4edda' : '#fff',
                                        border: '1px solid ' + (statement.isCorrect ? '#28a745' : '#ddd'),
                                        borderRadius: '4px'
                                    }}>
                                        <TextareaControl
                                            value={statement.text}
                                            onChange={(value) => updateStatement(groupIndex, statementIndex, 'text', value)}
                                            rows={2}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <ToggleControl
                                                label={__('Richtig', 'modular-blocks-plugin')}
                                                checked={statement.isCorrect}
                                                onChange={(value) => updateStatement(groupIndex, statementIndex, 'isCorrect', value)}
                                            />
                                            <Button
                                                onClick={() => removeStatement(groupIndex, statementIndex)}
                                                variant="secondary"
                                                isSmall
                                                isDestructive
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    onClick={() => addStatement(groupIndex)}
                                    variant="secondary"
                                    isSmall
                                >
                                    {__('Aussage hinzufügen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        ))}
                    </PanelBody>
                </InspectorControls>

                {/* Block Editor Preview */}
                <div className="summary-block-editor" style={{
                    padding: '20px',
                    border: '2px solid #007cba',
                    borderRadius: '8px',
                    backgroundColor: '#fff'
                }}>
                    <h3 style={{ marginTop: 0 }}>{title}</h3>
                    <p style={{ color: '#666' }}>{description}</p>

                    {/* Statistics */}
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        padding: '10px 15px',
                        backgroundColor: '#f0f7fc',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <span><strong>{totalGroups}</strong> {__('Gruppen', 'modular-blocks-plugin')}</span>
                        <span><strong>{totalStatements}</strong> {__('Aussagen', 'modular-blocks-plugin')}</span>
                        <span style={{ color: '#28a745' }}><strong>{correctStatements}</strong> {__('richtig', 'modular-blocks-plugin')}</span>
                        <span style={{ color: '#dc3545' }}><strong>{totalStatements - correctStatements}</strong> {__('falsch', 'modular-blocks-plugin')}</span>
                    </div>

                    {/* CSV Import in Block */}
                    <CsvImportSection inBlock={true} />

                    {/* Groups Preview */}
                    <div style={{ marginTop: '20px' }}>
                        <h4>{__('Vorschau der Gruppen:', 'modular-blocks-plugin')}</h4>
                        {statementGroups.map((group, groupIndex) => (
                            <div key={group.id} style={{
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '4px',
                                borderLeft: '4px solid #007cba'
                            }}>
                                <strong style={{ color: '#007cba' }}>
                                    {__('Gruppe', 'modular-blocks-plugin')} {groupIndex + 1}
                                </strong>
                                {group.statements.map((statement, sIndex) => (
                                    <div key={statement.id} style={{
                                        marginTop: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: statement.isCorrect ? '#d4edda' : '#fff',
                                        border: '1px solid ' + (statement.isCorrect ? '#28a745' : '#ddd'),
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{
                                            fontSize: '16px',
                                            color: statement.isCorrect ? '#28a745' : '#dc3545'
                                        }}>
                                            {statement.isCorrect ? '✓' : '✗'}
                                        </span>
                                        <span>{statement.text}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <p style={{ marginTop: '20px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        {__('Vorschau: Interaktive Funktionen sind nur im Frontend aktiv.', 'modular-blocks-plugin')}
                    </p>
                </div>
            </div>
        );
    },

    save: () => null, // Dynamic block - rendered via PHP
});
