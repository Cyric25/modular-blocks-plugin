/**
 * Statement Connector Block - Editor
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('modular-blocks/statement-connector', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();
        const { title, description, leftColumn, rightColumn } = attributes;

        const addLeftItem = () => {
            const newItems = [...leftColumn.items, {
                id: `item${Date.now()}`,
                text: 'Neuer Begriff',
                color: '#0073aa'
            }];
            setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
        };

        const addRightItem = () => {
            const newItems = [...rightColumn.items, {
                id: `item${Date.now()}`,
                text: 'Neue Definition',
                correctMatch: ''
            }];
            setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
        };

        const updateLeftItem = (index, field, value) => {
            const newItems = [...leftColumn.items];
            newItems[index][field] = value;
            setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
        };

        const updateRightItem = (index, field, value) => {
            const newItems = [...rightColumn.items];
            newItems[index][field] = value;
            setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
        };

        const removeLeftItem = (index) => {
            const newItems = leftColumn.items.filter((_, i) => i !== index);
            setAttributes({ leftColumn: { ...leftColumn, items: newItems } });
        };

        const removeRightItem = (index) => {
            const newItems = rightColumn.items.filter((_, i) => i !== index);
            setAttributes({ rightColumn: { ...rightColumn, items: newItems } });
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
                        <TextControl
                            label={__('Beschreibung', 'modular-blocks-plugin')}
                            value={description}
                            onChange={(value) => setAttributes({ description: value })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Linke Spalte', 'modular-blocks-plugin')}>
                        <TextControl
                            label={__('Spaltentitel', 'modular-blocks-plugin')}
                            value={leftColumn.title}
                            onChange={(value) => setAttributes({ leftColumn: { ...leftColumn, title: value } })}
                        />
                        <Button onClick={addLeftItem} variant="primary">
                            {__('Begriff hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                        {leftColumn.items.map((item, index) => (
                            <div key={index} style={{ marginTop: '15px', padding: '10px', border: '1px solid #ddd' }}>
                                <TextControl
                                    label={__('Text', 'modular-blocks-plugin')}
                                    value={item.text}
                                    onChange={(value) => updateLeftItem(index, 'text', value)}
                                />
                                <Button onClick={() => removeLeftItem(index)} variant="secondary" isDestructive>
                                    {__('Entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        ))}
                    </PanelBody>

                    <PanelBody title={__('Rechte Spalte', 'modular-blocks-plugin')}>
                        <TextControl
                            label={__('Spaltentitel', 'modular-blocks-plugin')}
                            value={rightColumn.title}
                            onChange={(value) => setAttributes({ rightColumn: { ...rightColumn, title: value } })}
                        />
                        <Button onClick={addRightItem} variant="primary">
                            {__('Definition hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                        {rightColumn.items.map((item, index) => (
                            <div key={index} style={{ marginTop: '15px', padding: '10px', border: '1px solid #ddd' }}>
                                <TextControl
                                    label={__('Text', 'modular-blocks-plugin')}
                                    value={item.text}
                                    onChange={(value) => updateRightItem(index, 'text', value)}
                                />
                                <TextControl
                                    label={__('Korrekte Zuordnung (ID)', 'modular-blocks-plugin')}
                                    value={item.correctMatch}
                                    onChange={(value) => updateRightItem(index, 'correctMatch', value)}
                                />
                                <Button onClick={() => removeRightItem(index)} variant="secondary" isDestructive>
                                    {__('Entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        ))}
                    </PanelBody>
                </InspectorControls>

                <div className="statement-connector-editor" style={{ padding: '20px', border: '1px solid #ddd' }}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div>
                            <h4>{leftColumn.title}</h4>
                            {leftColumn.items.map((item, index) => (
                                <div key={index} style={{ padding: '10px', margin: '5px 0', backgroundColor: item.color, color: 'white', borderRadius: '4px' }}>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4>{rightColumn.title}</h4>
                            {rightColumn.items.map((item, index) => (
                                <div key={index} style={{ padding: '10px', margin: '5px 0', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                        {__('Vorschau: Interaktive Verbindungen sind nur im Frontend aktiv', 'modular-blocks-plugin')}
                    </p>
                </div>
            </div>
        );
    },

    save: () => null, // Dynamic block
});
