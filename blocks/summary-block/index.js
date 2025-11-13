/**
 * Summary Block - Editor
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, Button, ToggleControl, RangeControl, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/summary-block', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const {
            title,
            description,
            statements,
            requiredSelections,
            showFeedback,
            showRetry,
            showSolution,
            allowReordering
        } = attributes;

        const addStatement = () => {
            const newStatements = [...statements, {
                text: 'Neue Aussage',
                isCorrect: false,
                correctPosition: 0,
                feedback: ''
            }];
            setAttributes({ statements: newStatements });
        };

        const updateStatement = (index, field, value) => {
            const newStatements = [...statements];
            newStatements[index][field] = value;
            setAttributes({ statements: newStatements });
        };

        const removeStatement = (index) => {
            const newStatements = statements.filter((_, i) => i !== index);
            setAttributes({ statements: newStatements });
        };

        const moveStatement = (index, direction) => {
            const newStatements = [...statements];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newStatements.length) {
                [newStatements[index], newStatements[targetIndex]] = [newStatements[targetIndex], newStatements[index]];
                setAttributes({ statements: newStatements });
            }
        };

        return (
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
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
                        <RangeControl
                            label={__('Anzahl auszuwählender Aussagen', 'modular-blocks-plugin')}
                            value={requiredSelections}
                            onChange={(value) => setAttributes({ requiredSelections: value })}
                            min={1}
                            max={10}
                        />
                    </PanelBody>

                    <PanelBody title={__('Optionen', 'modular-blocks-plugin')}>
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
                    </PanelBody>

                    <PanelBody title={__('Aussagen', 'modular-blocks-plugin')}>
                        <Button onClick={addStatement} variant="primary">
                            {__('Aussage hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                        {statements.map((statement, index) => (
                            <div key={index} style={{
                                marginTop: '15px',
                                padding: '10px',
                                border: '2px solid ' + (statement.isCorrect ? '#00a32a' : '#ddd'),
                                backgroundColor: statement.isCorrect ? '#f0f8f0' : 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong>Aussage {index + 1}</strong>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <Button
                                            onClick={() => moveStatement(index, 'up')}
                                            disabled={index === 0}
                                            variant="secondary"
                                            isSmall
                                        >
                                            ↑
                                        </Button>
                                        <Button
                                            onClick={() => moveStatement(index, 'down')}
                                            disabled={index === statements.length - 1}
                                            variant="secondary"
                                            isSmall
                                        >
                                            ↓
                                        </Button>
                                    </div>
                                </div>
                                <TextareaControl
                                    label={__('Text', 'modular-blocks-plugin')}
                                    value={statement.text}
                                    onChange={(value) => updateStatement(index, 'text', value)}
                                />
                                <ToggleControl
                                    label={__('Korrekte Aussage', 'modular-blocks-plugin')}
                                    checked={statement.isCorrect}
                                    onChange={(value) => updateStatement(index, 'isCorrect', value)}
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
                                <TextareaControl
                                    label={__('Feedback', 'modular-blocks-plugin')}
                                    value={statement.feedback}
                                    onChange={(value) => updateStatement(index, 'feedback', value)}
                                />
                                <Button onClick={() => removeStatement(index)} variant="secondary" isDestructive>
                                    {__('Aussage entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        ))}
                    </PanelBody>
                </InspectorControls>

                <div className="summary-block-editor" style={{ padding: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div style={{ marginTop: '20px' }}>
                        <h4>{__('Aussagen:', 'modular-blocks-plugin')}</h4>
                        {statements.map((statement, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '12px',
                                    margin: '8px 0',
                                    backgroundColor: statement.isCorrect ? '#d4edda' : '#f8f9fa',
                                    border: '1px solid ' + (statement.isCorrect ? '#00a32a' : '#ddd'),
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{statement.text}</span>
                                {statement.isCorrect && (
                                    <span style={{
                                        fontSize: '12px',
                                        backgroundColor: '#00a32a',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px'
                                    }}>
                                        Position {statement.correctPosition}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                        {__('Vorschau: Interaktive Auswahl und Sortierung nur im Frontend aktiv', 'modular-blocks-plugin')}
                    </p>
                </div>
            </div>
        );
    },

    save: () => null, // Dynamic block
});
