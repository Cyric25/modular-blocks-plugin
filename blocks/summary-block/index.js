/**
 * Summary Block - Editor (H5P-Style)
 *
 * Supports MD import with format:
 * Aussage $$ Richtig
 * Falsche Aussage $$ Falsch
 *
 * (empty line separates groups)
 */
import './style.css';
import './editor.css';

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
 * Parse MD content into statement groups
 * Format: Aussage $$ Richtig (with empty lines separating groups)
 */
function parseMD(content) {
    const lines = content.split('\n');
    const groups = [];
    let currentGroup = [];
    let groupIndex = 0;
    let statementIndex = 0;

    for (let i = 0; i < lines.length; i++) {
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

        // Parse line with $$ delimiter
        const separatorIndex = line.indexOf('$$');
        if (separatorIndex === -1) continue;

        const text = line.substring(0, separatorIndex).trim();
        const valueStr = line.substring(separatorIndex + 2).trim().toLowerCase();
        const isCorrect = valueStr === 'richtig' || valueStr === 'true' || valueStr === 'wahr' || valueStr === 'ja';

        if (text) {
            currentGroup.push({
                id: `s${statementIndex}`,
                text: text,
                isCorrect: isCorrect
            });
            statementIndex++;
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
 * Generate MD content from statement groups
 */
function generateMD(groups) {
    let md = '';

    groups.forEach((group, groupIndex) => {
        group.statements.forEach(statement => {
            md += `${statement.text} $$ ${statement.isCorrect ? 'Richtig' : 'Falsch'}\n`;
        });

        // Add empty line between groups (except after last)
        if (groupIndex < groups.length - 1) {
            md += '\n';
        }
    });

    return md;
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
            deferredFeedback,
            enablePdfDownload,
            penaltyPerWrongAnswer,
            successText,
            partialSuccessText,
            failText,
            summaryTitle
        } = attributes;

        const [mdInput, setMdInput] = useState('');
        const [importError, setImportError] = useState('');
        const [importSuccess, setImportSuccess] = useState('');
        const [editingStatement, setEditingStatement] = useState(null); // {groupIndex, statementIndex}
        const fileInputRef = useRef(null);

        // Handle MD import
        const handleMdImport = () => {
            setImportError('');
            setImportSuccess('');

            if (!mdInput.trim()) {
                setImportError(__('Bitte fügen Sie MD-Daten ein.', 'modular-blocks-plugin'));
                return;
            }

            const groups = parseMD(mdInput);

            if (groups.length === 0) {
                setImportError(__('Keine gültigen Aussagen gefunden. Format: Aussage $$ Richtig', 'modular-blocks-plugin'));
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
            setMdInput('');
        };

        // Handle file upload
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setImportError('');
            setImportSuccess('');

            // Validate file type
            const validTypes = ['text/markdown', 'text/plain', 'text/x-markdown'];
            const isValidType = validTypes.includes(file.type) ||
                               file.name.endsWith('.md') ||
                               file.name.endsWith('.txt');

            if (!isValidType) {
                setImportError(__('Bitte wählen Sie eine MD- oder TXT-Datei.', 'modular-blocks-plugin'));
                event.target.value = ''; // Reset file input
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                setMdInput(content);
                setImportSuccess(__('Datei geladen. Klicken Sie auf "MD importieren" um fortzufahren.', 'modular-blocks-plugin'));
            };

            reader.onerror = () => {
                setImportError(__('Fehler beim Laden der Datei.', 'modular-blocks-plugin'));
            };

            reader.readAsText(file, 'UTF-8');

            // Reset file input for re-upload of same file
            event.target.value = '';
        };

        // Handle MD export
        const handleMdExport = () => {
            const md = generateMD(statementGroups);
            const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'summary-statements.md';
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

        // MD Import Component (reusable)
        const MdImportSection = ({ inBlock = false }) => (
            <div style={{
                marginTop: inBlock ? '20px' : '0',
                padding: inBlock ? '15px' : '0',
                backgroundColor: inBlock ? '#f0f0f0' : 'transparent',
                borderRadius: inBlock ? '4px' : '0'
            }}>
                {inBlock && <h4 style={{ marginTop: 0 }}>{__('MD Import', 'modular-blocks-plugin')}</h4>}

                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="file"
                        accept=".md,.txt,text/markdown,text/plain,text/x-markdown"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        style={{ marginRight: '10px' }}
                    >
                        {__('MD-Datei wählen', 'modular-blocks-plugin')}
                    </Button>
                    <Button
                        onClick={handleMdExport}
                        variant="secondary"
                    >
                        {__('Als MD exportieren', 'modular-blocks-plugin')}
                    </Button>
                </div>

                <TextareaControl
                    label={__('MD-Daten einfügen', 'modular-blocks-plugin')}
                    help={__('Format: Aussage $$ Richtig/Falsch. Leerzeilen trennen Gruppen.', 'modular-blocks-plugin')}
                    value={mdInput}
                    onChange={setMdInput}
                    rows={inBlock ? 8 : 6}
                />

                <Button
                    onClick={handleMdImport}
                    variant="primary"
                    disabled={!mdInput.trim()}
                >
                    {__('MD importieren', 'modular-blocks-plugin')}
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
                    {/* MD Import Panel */}
                    <PanelBody title={__('MD Import/Export', 'modular-blocks-plugin')} initialOpen={true}>
                        <MdImportSection inBlock={false} />
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
                        <ToggleControl
                            label={__('Verzögertes Feedback', 'modular-blocks-plugin')}
                            help={__('Aussagen werden immer hinzugefügt, Feedback erst am Ende', 'modular-blocks-plugin')}
                            checked={deferredFeedback}
                            onChange={(value) => setAttributes({ deferredFeedback: value })}
                        />
                        <ToggleControl
                            label={__('PDF-Download aktivieren', 'modular-blocks-plugin')}
                            help={__('Ermöglicht PDF-Download bei 100% Erfolg', 'modular-blocks-plugin')}
                            checked={enablePdfDownload}
                            onChange={(value) => setAttributes({ enablePdfDownload: value })}
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

                    {/* MD Import in Block */}
                    <MdImportSection inBlock={true} />

                    {/* Groups Preview */}
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0 }}>{__('Vorschau der Gruppen:', 'modular-blocks-plugin')}</h4>
                            <Button
                                onClick={addGroup}
                                variant="secondary"
                                isSmall
                            >
                                {__('+ Neue Gruppe', 'modular-blocks-plugin')}
                            </Button>
                        </div>
                        {statementGroups.map((group, groupIndex) => (
                            <div key={group.id} style={{
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '4px',
                                borderLeft: '4px solid #007cba'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong style={{ color: '#007cba' }}>
                                        {__('Gruppe', 'modular-blocks-plugin')} {groupIndex + 1}
                                    </strong>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            onClick={() => addStatement(groupIndex)}
                                            variant="secondary"
                                            isSmall
                                        >
                                            {__('+ Aussage', 'modular-blocks-plugin')}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm(__('Möchten Sie diese Gruppe wirklich löschen?', 'modular-blocks-plugin'))) {
                                                    removeGroup(groupIndex);
                                                }
                                            }}
                                            variant="secondary"
                                            isSmall
                                            isDestructive
                                        >
                                            {__('Löschen', 'modular-blocks-plugin')}
                                        </Button>
                                    </div>
                                </div>
                                {group.statements.map((statement, sIndex) => {
                                    const isEditing = editingStatement?.groupIndex === groupIndex && editingStatement?.statementIndex === sIndex;

                                    return (
                                        <div key={statement.id} style={{
                                            marginTop: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: statement.isCorrect ? '#d4edda' : '#fff',
                                            border: '1px solid ' + (statement.isCorrect ? '#28a745' : '#ddd'),
                                            borderRadius: '4px'
                                        }}>
                                            {isEditing ? (
                                                // Edit Mode
                                                <div>
                                                    <TextareaControl
                                                        value={statement.text}
                                                        onChange={(value) => updateStatement(groupIndex, sIndex, 'text', value)}
                                                        rows={2}
                                                        style={{ marginBottom: '8px' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <ToggleControl
                                                            label={__('Richtig', 'modular-blocks-plugin')}
                                                            checked={statement.isCorrect}
                                                            onChange={(value) => updateStatement(groupIndex, sIndex, 'isCorrect', value)}
                                                        />
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <Button
                                                                onClick={() => setEditingStatement(null)}
                                                                variant="primary"
                                                                isSmall
                                                            >
                                                                {__('Fertig', 'modular-blocks-plugin')}
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    if (confirm(__('Möchten Sie diese Aussage wirklich löschen?', 'modular-blocks-plugin'))) {
                                                                        removeStatement(groupIndex, sIndex);
                                                                        setEditingStatement(null);
                                                                    }
                                                                }}
                                                                variant="secondary"
                                                                isSmall
                                                                isDestructive
                                                            >
                                                                {__('Löschen', 'modular-blocks-plugin')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        fontSize: '16px',
                                                        color: statement.isCorrect ? '#28a745' : '#dc3545',
                                                        flexShrink: 0
                                                    }}>
                                                        {statement.isCorrect ? '✓' : '✗'}
                                                    </span>
                                                    <span style={{ flex: 1 }}>{statement.text}</span>
                                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                        <Button
                                                            onClick={() => setEditingStatement({ groupIndex, statementIndex: sIndex })}
                                                            variant="secondary"
                                                            isSmall
                                                        >
                                                            {__('Bearbeiten', 'modular-blocks-plugin')}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                if (confirm(__('Möchten Sie diese Aussage wirklich löschen?', 'modular-blocks-plugin'))) {
                                                                    removeStatement(groupIndex, sIndex);
                                                                }
                                                            }}
                                                            variant="secondary"
                                                            isSmall
                                                            isDestructive
                                                        >
                                                            {__('×', 'modular-blocks-plugin')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
