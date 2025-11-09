/**
 * Drag and Drop Block - Simple Registration
 * WordPress Compatible Version
 */

(function() {
    const { registerBlockType } = wp.blocks;
    const { __ } = wp.i18n;
    const { useBlockProps, InspectorControls, RichText, MediaUpload, MediaUploadCheck } = wp.blockEditor;
    const { PanelBody, ToggleControl, TextControl, TextareaControl, Button, RangeControl, SelectControl } = wp.components;
    const { createElement: el, Fragment, useState } = wp.element;

    registerBlockType('modular-blocks/drag-and-drop', {
        apiVersion: 2,
        title: __('Drag and Drop', 'modular-blocks-plugin'),
        description: __('Erstellen Sie interaktive Drag & Drop Aufgaben mit Bildern oder Text-Elementen.', 'modular-blocks-plugin'),
        category: 'media',
        icon: 'move',
        keywords: ['drag', 'drop', 'bilder', 'zuordnung', 'interactive', 'h5p'],
        attributes: {
            title: {
                type: 'string',
                default: 'Ziehen Sie die Elemente an die richtige Stelle'
            },
            description: {
                type: 'string',
                default: 'Ziehen Sie die Elemente von links auf die passenden Drop-Zonen rechts.'
            },
            backgroundImage: {
                type: 'object',
                default: {
                    url: '',
                    alt: '',
                    id: null
                }
            },
            draggables: {
                type: 'array',
                default: [
                    {
                        id: 'drag1',
                        type: 'text',
                        content: 'Element 1',
                        image: { url: '', alt: '', id: null },
                        correctZones: ['zone1'],
                        color: '#0073aa',
                        size: 'medium'
                    },
                    {
                        id: 'drag2',
                        type: 'text',
                        content: 'Element 2',
                        image: { url: '', alt: '', id: null },
                        correctZones: ['zone2'],
                        color: '#d63638',
                        size: 'medium'
                    }
                ]
            },
            dropZones: {
                type: 'array',
                default: [
                    {
                        id: 'zone1',
                        label: 'Drop Zone 1',
                        x: 20,
                        y: 20,
                        width: 150,
                        height: 100,
                        acceptMultiple: false,
                        backgroundColor: 'rgba(0, 115, 170, 0.1)',
                        borderColor: '#0073aa'
                    },
                    {
                        id: 'zone2',
                        label: 'Drop Zone 2',
                        x: 70,
                        y: 60,
                        width: 150,
                        height: 100,
                        acceptMultiple: false,
                        backgroundColor: 'rgba(214, 54, 56, 0.1)',
                        borderColor: '#d63638'
                    }
                ]
            },
            showFeedback: {
                type: 'boolean',
                default: true
            },
            showRetry: {
                type: 'boolean',
                default: true
            },
            showSolution: {
                type: 'boolean',
                default: true
            },
            instantFeedback: {
                type: 'boolean',
                default: false
            },
            enableSnap: {
                type: 'boolean',
                default: true
            },
            showScore: {
                type: 'boolean',
                default: true
            },
            randomizeDraggables: {
                type: 'boolean',
                default: false
            },
            allowPartialScore: {
                type: 'boolean',
                default: true
            },
            backgroundHeight: {
                type: 'number',
                default: 400
            }
        },
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const {
                title,
                description,
                backgroundImage,
                draggables,
                dropZones,
                showFeedback,
                showRetry,
                showSolution,
                instantFeedback,
                enableSnap,
                showScore,
                randomizeDraggables,
                allowPartialScore,
                backgroundHeight
            } = attributes;

            const blockProps = useBlockProps({
                className: 'wp-block-modular-blocks-drag-and-drop-editor'
            });

            function updateDraggable(index, updates) {
                const newDraggables = [...draggables];
                newDraggables[index] = { ...newDraggables[index], ...updates };
                setAttributes({ draggables: newDraggables });
            }

            function addDraggable() {
                const newDraggables = [...draggables, {
                    id: 'drag' + Date.now(),
                    type: 'text',
                    content: 'Neues Element',
                    image: { url: '', alt: '', id: null },
                    correctZones: [],
                    color: '#0073aa',
                    size: 'medium'
                }];
                setAttributes({ draggables: newDraggables });
            }

            function removeDraggable(index) {
                const newDraggables = draggables.filter((_, i) => i !== index);
                setAttributes({ draggables: newDraggables });
            }

            function updateDropZone(index, updates) {
                const newDropZones = [...dropZones];
                newDropZones[index] = { ...newDropZones[index], ...updates };
                setAttributes({ dropZones: newDropZones });
            }

            function addDropZone() {
                const newDropZones = [...dropZones, {
                    id: 'zone' + Date.now(),
                    label: 'Neue Drop Zone',
                    x: 20,
                    y: 20,
                    width: 150,
                    height: 100,
                    acceptMultiple: false,
                    backgroundColor: 'rgba(0, 115, 170, 0.1)',
                    borderColor: '#0073aa'
                }];
                setAttributes({ dropZones: newDropZones });
            }

            function removeDropZone(index) {
                const newDropZones = dropZones.filter((_, i) => i !== index);
                setAttributes({ dropZones: newDropZones });
            }

            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, { title: __('Einstellungen', 'modular-blocks-plugin') },
                        el(RangeControl, {
                            label: __('Hintergrund-Höhe (px)', 'modular-blocks-plugin'),
                            value: backgroundHeight,
                            onChange: function(value) { setAttributes({ backgroundHeight: value }); },
                            min: 200,
                            max: 800,
                            step: 10
                        }),
                        el(ToggleControl, {
                            label: __('Feedback anzeigen', 'modular-blocks-plugin'),
                            checked: showFeedback,
                            onChange: function(value) { setAttributes({ showFeedback: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Wiederholen-Button', 'modular-blocks-plugin'),
                            checked: showRetry,
                            onChange: function(value) { setAttributes({ showRetry: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Lösung anzeigen', 'modular-blocks-plugin'),
                            checked: showSolution,
                            onChange: function(value) { setAttributes({ showSolution: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Sofortiges Feedback', 'modular-blocks-plugin'),
                            checked: instantFeedback,
                            onChange: function(value) { setAttributes({ instantFeedback: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Einrasten aktivieren', 'modular-blocks-plugin'),
                            checked: enableSnap,
                            onChange: function(value) { setAttributes({ enableSnap: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Punkte anzeigen', 'modular-blocks-plugin'),
                            checked: showScore,
                            onChange: function(value) { setAttributes({ showScore: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Elemente mischen', 'modular-blocks-plugin'),
                            checked: randomizeDraggables,
                            onChange: function(value) { setAttributes({ randomizeDraggables: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Teilpunkte erlauben', 'modular-blocks-plugin'),
                            checked: allowPartialScore,
                            onChange: function(value) { setAttributes({ allowPartialScore: value }); }
                        })
                    )
                ),

                // Main Editor
                el('div', blockProps,
                    el('div', { className: 'drag-drop-editor' },
                        // Title
                        el('div', { className: 'editor-section' },
                            el('label', { className: 'editor-label' }, __('Titel', 'modular-blocks-plugin')),
                            el(RichText, {
                                tagName: 'h3',
                                value: title,
                                onChange: function(value) { setAttributes({ title: value }); },
                                placeholder: __('Titel eingeben...', 'modular-blocks-plugin')
                            })
                        ),

                        // Description
                        el('div', { className: 'editor-section' },
                            el('label', { className: 'editor-label' }, __('Beschreibung', 'modular-blocks-plugin')),
                            el(RichText, {
                                tagName: 'p',
                                value: description,
                                onChange: function(value) { setAttributes({ description: value }); },
                                placeholder: __('Beschreibung eingeben...', 'modular-blocks-plugin')
                            })
                        ),

                        // Draggable Elements
                        el('div', { className: 'editor-section' },
                            el('div', { className: 'section-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
                                el('label', { className: 'editor-label' }, __('Ziehbare Elemente', 'modular-blocks-plugin')),
                                el(Button, {
                                    isSecondary: true,
                                    onClick: addDraggable
                                }, __('Element hinzufügen', 'modular-blocks-plugin'))
                            ),

                            draggables.map(function(draggable, index) {
                                return el('div', {
                                    key: index,
                                    className: 'draggable-item',
                                    style: {
                                        background: '#f8f9fa',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '6px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }
                                },
                                    el('h4', { style: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' } }, __('Element', 'modular-blocks-plugin') + ' ' + (index + 1)),
                                    el(TextControl, {
                                        label: __('ID', 'modular-blocks-plugin'),
                                        value: draggable.id,
                                        onChange: function(value) { updateDraggable(index, { id: value }); }
                                    }),
                                    el(SelectControl, {
                                        label: __('Typ', 'modular-blocks-plugin'),
                                        value: draggable.type,
                                        options: [
                                            { label: __('Text', 'modular-blocks-plugin'), value: 'text' },
                                            { label: __('Bild', 'modular-blocks-plugin'), value: 'image' }
                                        ],
                                        onChange: function(value) { updateDraggable(index, { type: value }); }
                                    }),
                                    el(TextareaControl, {
                                        label: __('Inhalt', 'modular-blocks-plugin'),
                                        value: draggable.content,
                                        onChange: function(value) { updateDraggable(index, { content: value }); }
                                    }),
                                    el(TextControl, {
                                        label: __('Farbe', 'modular-blocks-plugin'),
                                        value: draggable.color,
                                        onChange: function(value) { updateDraggable(index, { color: value }); },
                                        type: 'color'
                                    }),
                                    el(SelectControl, {
                                        label: __('Größe', 'modular-blocks-plugin'),
                                        value: draggable.size,
                                        options: [
                                            { label: __('Klein', 'modular-blocks-plugin'), value: 'small' },
                                            { label: __('Mittel', 'modular-blocks-plugin'), value: 'medium' },
                                            { label: __('Groß', 'modular-blocks-plugin'), value: 'large' }
                                        ],
                                        onChange: function(value) { updateDraggable(index, { size: value }); }
                                    }),
                                    el(TextControl, {
                                        label: __('Richtige Zonen (IDs, kommagetrennt)', 'modular-blocks-plugin'),
                                        value: draggable.correctZones.join(', '),
                                        onChange: function(value) {
                                            updateDraggable(index, {
                                                correctZones: value.split(',').map(function(id) { return id.trim(); }).filter(function(id) { return id; })
                                            });
                                        }
                                    }),
                                    el(Button, {
                                        isDestructive: true,
                                        onClick: function() { removeDraggable(index); },
                                        style: { marginTop: '8px', width: '100%' }
                                    }, __('Element entfernen', 'modular-blocks-plugin'))
                                );
                            })
                        ),

                        // Drop Zones
                        el('div', { className: 'editor-section' },
                            el('div', { className: 'section-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
                                el('label', { className: 'editor-label' }, __('Drop-Zonen', 'modular-blocks-plugin')),
                                el(Button, {
                                    isSecondary: true,
                                    onClick: addDropZone
                                }, __('Zone hinzufügen', 'modular-blocks-plugin'))
                            ),

                            dropZones.map(function(zone, index) {
                                return el('div', {
                                    key: index,
                                    className: 'dropzone-item',
                                    style: {
                                        background: '#f0f8ff',
                                        border: '1px solid #0073aa',
                                        borderRadius: '6px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }
                                },
                                    el('h4', { style: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' } }, __('Drop Zone', 'modular-blocks-plugin') + ' ' + (index + 1)),
                                    el(TextControl, {
                                        label: __('ID', 'modular-blocks-plugin'),
                                        value: zone.id,
                                        onChange: function(value) { updateDropZone(index, { id: value }); }
                                    }),
                                    el(TextControl, {
                                        label: __('Label', 'modular-blocks-plugin'),
                                        value: zone.label,
                                        onChange: function(value) { updateDropZone(index, { label: value }); }
                                    }),
                                    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' } },
                                        el(RangeControl, {
                                            label: __('X Position (%)', 'modular-blocks-plugin'),
                                            value: zone.x,
                                            onChange: function(value) { updateDropZone(index, { x: value }); },
                                            min: 0,
                                            max: 100
                                        }),
                                        el(RangeControl, {
                                            label: __('Y Position (%)', 'modular-blocks-plugin'),
                                            value: zone.y,
                                            onChange: function(value) { updateDropZone(index, { y: value }); },
                                            min: 0,
                                            max: 100
                                        }),
                                        el(RangeControl, {
                                            label: __('Breite (px)', 'modular-blocks-plugin'),
                                            value: zone.width,
                                            onChange: function(value) { updateDropZone(index, { width: value }); },
                                            min: 50,
                                            max: 300
                                        }),
                                        el(RangeControl, {
                                            label: __('Höhe (px)', 'modular-blocks-plugin'),
                                            value: zone.height,
                                            onChange: function(value) { updateDropZone(index, { height: value }); },
                                            min: 50,
                                            max: 300
                                        })
                                    ),
                                    el(ToggleControl, {
                                        label: __('Mehrere Elemente akzeptieren', 'modular-blocks-plugin'),
                                        checked: zone.acceptMultiple,
                                        onChange: function(value) { updateDropZone(index, { acceptMultiple: value }); }
                                    }),
                                    el(Button, {
                                        isDestructive: true,
                                        onClick: function() { removeDropZone(index); },
                                        style: { marginTop: '8px', width: '100%' }
                                    }, __('Zone entfernen', 'modular-blocks-plugin'))
                                );
                            })
                        )
                    )
                )
            );
        },
        save: function() {
            // Server-side rendering
            return null;
        }
    });
})();