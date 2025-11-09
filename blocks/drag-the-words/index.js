/**
 * Drag the Words Block - Simple Registration
 * WordPress Compatible Version
 */

(function() {
    const { registerBlockType } = wp.blocks;
    const { __ } = wp.i18n;
    const { useBlockProps, InspectorControls, RichText } = wp.blockEditor;
    const { PanelBody, ToggleControl, TextControl, TextareaControl, Button } = wp.components;
    const { createElement: el, Fragment, useState } = wp.element;

    registerBlockType('modular-blocks/drag-the-words', {
        apiVersion: 2,
        title: __('Drag the Words', 'modular-blocks-plugin'),
        description: __('Erstellen Sie Lückentexte bei denen Benutzer Wörter per Drag & Drop in die richtigen Lücken ziehen müssen.', 'modular-blocks-plugin'),
        category: 'widgets',
        icon: 'text',
        keywords: ['lückentext', 'drag', 'drop', 'wörter', 'text', 'h5p', 'cloze'],
        attributes: {
            title: {
                type: 'string',
                default: 'Vervollständigen Sie den Text'
            },
            description: {
                type: 'string',
                default: 'Ziehen Sie die Wörter unten in die passenden Lücken im Text.'
            },
            textWithBlanks: {
                type: 'string',
                default: 'Die *Sonne* scheint hell am *blauen* Himmel.'
            },
            wordBank: {
                type: 'array',
                default: [
                    {
                        word: 'Sonne',
                        isCorrect: true,
                        blanks: [0]
                    },
                    {
                        word: 'blauen',
                        isCorrect: true,
                        blanks: [1]
                    },
                    {
                        word: 'Wolken',
                        isCorrect: false,
                        blanks: []
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
            enableWordReuse: {
                type: 'boolean',
                default: false
            },
            showScore: {
                type: 'boolean',
                default: true
            },
            randomizeWords: {
                type: 'boolean',
                default: true
            },
            highlightCorrectOnDrop: {
                type: 'boolean',
                default: true
            },
            caseSensitive: {
                type: 'boolean',
                default: false
            },
            scoreText: {
                type: 'string',
                default: 'Sie haben @score von @total Punkten erreicht.'
            },
            successText: {
                type: 'string',
                default: 'Perfekt! Sie haben alle Lücken korrekt ausgefüllt.'
            },
            partialSuccessText: {
                type: 'string',
                default: 'Gut gemacht! Einige Antworten sind richtig.'
            },
            failText: {
                type: 'string',
                default: 'Versuchen Sie es noch einmal. Überprüfen Sie Ihre Antworten.'
            }
        },
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const {
                title,
                description,
                textWithBlanks,
                wordBank,
                showFeedback,
                showRetry,
                showSolution,
                instantFeedback,
                enableWordReuse,
                showScore,
                randomizeWords,
                highlightCorrectOnDrop,
                caseSensitive
            } = attributes;

            const blockProps = useBlockProps({
                className: 'wp-block-modular-blocks-drag-the-words-editor'
            });

            function updateWordBankItem(index, updates) {
                const newWordBank = [...wordBank];
                newWordBank[index] = { ...newWordBank[index], ...updates };
                setAttributes({ wordBank: newWordBank });
            }

            function addWordBankItem() {
                const newWordBank = [...wordBank, {
                    word: '',
                    isCorrect: false,
                    blanks: []
                }];
                setAttributes({ wordBank: newWordBank });
            }

            function removeWordBankItem(index) {
                const newWordBank = wordBank.filter((_, i) => i !== index);
                setAttributes({ wordBank: newWordBank });
            }

            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, { title: __('Einstellungen', 'modular-blocks-plugin') },
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
                            label: __('Wörter wiederverwenden', 'modular-blocks-plugin'),
                            checked: enableWordReuse,
                            onChange: function(value) { setAttributes({ enableWordReuse: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Punkte anzeigen', 'modular-blocks-plugin'),
                            checked: showScore,
                            onChange: function(value) { setAttributes({ showScore: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Wörter mischen', 'modular-blocks-plugin'),
                            checked: randomizeWords,
                            onChange: function(value) { setAttributes({ randomizeWords: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Richtige Antworten hervorheben', 'modular-blocks-plugin'),
                            checked: highlightCorrectOnDrop,
                            onChange: function(value) { setAttributes({ highlightCorrectOnDrop: value }); }
                        }),
                        el(ToggleControl, {
                            label: __('Groß-/Kleinschreibung beachten', 'modular-blocks-plugin'),
                            checked: caseSensitive,
                            onChange: function(value) { setAttributes({ caseSensitive: value }); }
                        })
                    )
                ),

                // Main Editor
                el('div', blockProps,
                    el('div', { className: 'drag-words-editor' },
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

                        // Text with Blanks
                        el('div', { className: 'editor-section' },
                            el('label', { className: 'editor-label' },
                                __('Text mit Lücken', 'modular-blocks-plugin'),
                                el('span', { className: 'help-text' }, __('Verwende *Wort* für Lücken', 'modular-blocks-plugin'))
                            ),
                            el(TextareaControl, {
                                value: textWithBlanks,
                                onChange: function(value) { setAttributes({ textWithBlanks: value }); },
                                placeholder: __('Text eingeben... Verwende *Wort* für Lücken', 'modular-blocks-plugin'),
                                rows: 4
                            })
                        ),

                        // Word Bank
                        el('div', { className: 'editor-section' },
                            el('div', { className: 'section-header' },
                                el('label', { className: 'editor-label' }, __('Wortbank', 'modular-blocks-plugin')),
                                el(Button, {
                                    isSecondary: true,
                                    onClick: addWordBankItem
                                }, __('Wort hinzufügen', 'modular-blocks-plugin'))
                            ),

                            wordBank.map(function(wordItem, index) {
                                return el('div', {
                                    key: index,
                                    className: 'word-bank-item',
                                    style: {
                                        background: '#f8f9fa',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '6px',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }
                                },
                                    el(TextControl, {
                                        label: __('Wort', 'modular-blocks-plugin'),
                                        value: wordItem.word,
                                        onChange: function(value) { updateWordBankItem(index, { word: value }); }
                                    }),
                                    el(ToggleControl, {
                                        label: __('Richtige Antwort', 'modular-blocks-plugin'),
                                        checked: wordItem.isCorrect,
                                        onChange: function(value) { updateWordBankItem(index, { isCorrect: value }); }
                                    }),
                                    el(Button, {
                                        isDestructive: true,
                                        onClick: function() { removeWordBankItem(index); }
                                    }, __('Entfernen', 'modular-blocks-plugin'))
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