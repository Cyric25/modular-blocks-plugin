/**
 * Drag and Drop Block - Enhanced H5P-style Editor
 * Version 2.0.0 - Full H5P Feature Parity
 */

(function() {
    const { registerBlockType } = wp.blocks;
    const { __ } = wp.i18n;
    const { useBlockProps, InspectorControls, RichText, MediaUpload, MediaUploadCheck, ColorPalette } = wp.blockEditor;
    const { PanelBody, ToggleControl, TextControl, TextareaControl, Button, RangeControl, SelectControl, TabPanel, ColorIndicator, Tooltip, Icon } = wp.components;
    const { createElement: el, Fragment, useState, useEffect, useRef, useCallback } = wp.element;

    // Color palette for elements
    const colorPalette = [
        { name: 'Blau', color: '#0073aa' },
        { name: 'Rot', color: '#d63638' },
        { name: 'Grün', color: '#00a32a' },
        { name: 'Orange', color: '#e24614' },
        { name: 'Lila', color: '#8b5cf6' },
        { name: 'Gelb', color: '#eab308' },
        { name: 'Grau', color: '#6b7280' },
        { name: 'Schwarz', color: '#1e1e1e' }
    ];

    registerBlockType('modular-blocks/drag-and-drop', {
        apiVersion: 3,
        title: __('Drag and Drop', 'modular-blocks-plugin'),
        description: __('Erstellen Sie interaktive Drag & Drop Aufgaben mit Bildern oder Text-Elementen. H5P-kompatibel.', 'modular-blocks-plugin'),
        category: 'modular-blocks',
        icon: 'move',
        keywords: ['drag', 'drop', 'bilder', 'zuordnung', 'interactive', 'h5p'],

        edit: function(props) {
            const { attributes, setAttributes } = props;
            const {
                title,
                description,
                backgroundImage,
                taskWidth,
                taskHeight,
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
                applyPenalty,
                penaltyPerWrong,
                backgroundHeight,
                highlightDropZones,
                enableFullscreen,
                enableAutoScale,
                scoreText,
                successText,
                partialSuccessText,
                failText,
                feedbackRanges
            } = attributes;

            const [activeTab, setActiveTab] = useState('elements');
            const [selectedDraggable, setSelectedDraggable] = useState(null);
            const [selectedZone, setSelectedZone] = useState(null);
            const [isImporting, setIsImporting] = useState(false);
            const [importError, setImportError] = useState(null);

            // Visual Editor State
            const [editingZoneIndex, setEditingZoneIndex] = useState(null);
            const [isDragging, setIsDragging] = useState(false);
            const [isResizing, setIsResizing] = useState(false);
            const [resizeHandle, setResizeHandle] = useState(null);
            const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
            const [zoneStart, setZoneStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
            const visualEditorRef = useRef(null);
            const justFinishedDragRef = useRef(false); // Prevents click after drag/resize

            const blockProps = useBlockProps({
                className: 'wp-block-modular-blocks-drag-and-drop-editor'
            });

            // H5P Import Function
            function handleH5PImport(event) {
                const file = event.target.files?.[0];
                if (!file) return;

                if (!file.name.endsWith('.h5p')) {
                    setImportError(__('Bitte wählen Sie eine .h5p Datei aus.', 'modular-blocks-plugin'));
                    return;
                }

                setIsImporting(true);
                setImportError(null);

                const formData = new FormData();
                formData.append('action', 'h5p_import_drag_drop');
                formData.append('nonce', window.modularBlocksH5P?.nonce || '');
                formData.append('h5p_file', file);

                fetch(window.modularBlocksH5P?.ajaxUrl || window.ajaxurl || '/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => response.json())
                .then(result => {
                    setIsImporting(false);
                    if (result.success && result.data) {
                        // Apply imported attributes
                        setAttributes({
                            ...result.data,
                            // Preserve any attributes not in the import
                            showFeedback: result.data.showFeedback ?? showFeedback,
                            showRetry: result.data.showRetry ?? showRetry,
                            showSolution: result.data.showSolution ?? showSolution,
                            instantFeedback: result.data.instantFeedback ?? instantFeedback,
                            enableSnap: result.data.enableSnap ?? enableSnap,
                            showScore: result.data.showScore ?? showScore,
                            enableFullscreen: result.data.enableFullscreen ?? enableFullscreen,
                            enableAutoScale: result.data.enableAutoScale ?? enableAutoScale
                        });
                        setActiveTab('preview');
                    } else {
                        setImportError(result.data?.message || __('Import fehlgeschlagen.', 'modular-blocks-plugin'));
                    }
                })
                .catch(error => {
                    setIsImporting(false);
                    setImportError(__('Netzwerkfehler beim Import.', 'modular-blocks-plugin'));
                    console.error('H5P Import error:', error);
                });

                // Reset file input
                event.target.value = '';
            }

            // Draggable Management Functions
            function updateDraggable(index, updates) {
                const newDraggables = [...draggables];
                newDraggables[index] = { ...newDraggables[index], ...updates };
                setAttributes({ draggables: newDraggables });
            }

            function addDraggable() {
                const newId = 'drag' + Date.now();
                const newDraggables = [...draggables, {
                    id: newId,
                    type: 'text',
                    content: __('Neues Element', 'modular-blocks-plugin'),
                    image: { url: '', alt: '', id: null },
                    correctZones: [],
                    color: colorPalette[draggables.length % colorPalette.length].color,
                    size: 'medium',
                    opacity: 100,
                    infinite: false,
                    tip: ''
                }];
                setAttributes({ draggables: newDraggables });
                setSelectedDraggable(newDraggables.length - 1);
            }

            function removeDraggable(index) {
                const newDraggables = draggables.filter((_, i) => i !== index);
                setAttributes({ draggables: newDraggables });
                setSelectedDraggable(null);
            }

            function duplicateDraggable(index) {
                const original = draggables[index];
                const newDraggables = [...draggables];
                newDraggables.splice(index + 1, 0, {
                    ...original,
                    id: 'drag' + Date.now(),
                    content: original.content + ' (Kopie)'
                });
                setAttributes({ draggables: newDraggables });
            }

            // Drop Zone Management Functions
            function updateDropZone(index, updates) {
                const newDropZones = [...dropZones];
                newDropZones[index] = { ...newDropZones[index], ...updates };
                setAttributes({ dropZones: newDropZones });
            }

            function addDropZone() {
                const newId = 'zone' + Date.now();
                const newDropZones = [...dropZones, {
                    id: newId,
                    label: __('Neue Drop Zone', 'modular-blocks-plugin'),
                    showLabel: false,
                    x: 20 + (dropZones.length * 10) % 60,
                    y: 20 + (dropZones.length * 10) % 60,
                    width: 150,
                    height: 100,
                    acceptMultiple: false,
                    backgroundColor: 'rgba(0, 115, 170, 0.1)',
                    borderColor: colorPalette[dropZones.length % colorPalette.length].color,
                    opacity: 100,
                    autoAlign: true,
                    alignSpacing: 8,
                    tipCorrect: '',
                    tipIncorrect: ''
                }];
                setAttributes({ dropZones: newDropZones });
                setSelectedZone(newDropZones.length - 1);
            }

            function removeDropZone(index) {
                const removedZoneId = dropZones[index].id;
                // Also remove this zone from all draggables' correctZones
                const newDraggables = draggables.map(d => ({
                    ...d,
                    correctZones: d.correctZones.filter(z => z !== removedZoneId)
                }));
                const newDropZones = dropZones.filter((_, i) => i !== index);
                setAttributes({ dropZones: newDropZones, draggables: newDraggables });
                setSelectedZone(null);
            }

            function duplicateDropZone(index) {
                const original = dropZones[index];
                const newDropZones = [...dropZones];
                newDropZones.splice(index + 1, 0, {
                    ...original,
                    id: 'zone' + Date.now(),
                    label: original.label + ' (Kopie)',
                    x: Math.min(90, original.x + 5),
                    y: Math.min(90, original.y + 5)
                });
                setAttributes({ dropZones: newDropZones });
            }

            // Render Draggable Editor Panel
            function renderDraggablePanel(draggable, index) {
                const isExpanded = selectedDraggable === index;

                return el('div', {
                    key: index,
                    className: `draggable-item ${isExpanded ? 'expanded' : 'collapsed'}`,
                    style: { borderLeftColor: draggable.color }
                },
                    el('div', {
                        className: 'item-header',
                        onClick: () => setSelectedDraggable(isExpanded ? null : index)
                    },
                        el('span', {
                            className: 'item-color-indicator',
                            style: { backgroundColor: draggable.color }
                        }),
                        el('span', { className: 'item-title' },
                            draggable.content || __('Element', 'modular-blocks-plugin') + ' ' + (index + 1)
                        ),
                        draggable.infinite && el('span', { className: 'badge infinite' }, '∞'),
                        el('span', { className: 'expand-icon' }, isExpanded ? '▼' : '▶')
                    ),

                    isExpanded && el('div', { className: 'item-content' },
                        el(SelectControl, {
                            label: __('Typ', 'modular-blocks-plugin'),
                            value: draggable.type,
                            options: [
                                { label: __('Text', 'modular-blocks-plugin'), value: 'text' },
                                { label: __('Bild', 'modular-blocks-plugin'), value: 'image' },
                                { label: __('Text + Bild', 'modular-blocks-plugin'), value: 'both' }
                            ],
                            onChange: value => updateDraggable(index, { type: value })
                        }),

                        (draggable.type === 'text' || draggable.type === 'both') && el(TextareaControl, {
                            label: __('Text-Inhalt', 'modular-blocks-plugin'),
                            value: draggable.content,
                            onChange: value => updateDraggable(index, { content: value }),
                            rows: 2
                        }),

                        (draggable.type === 'image' || draggable.type === 'both') && el(MediaUploadCheck, {},
                            el(MediaUpload, {
                                onSelect: media => updateDraggable(index, {
                                    image: { url: media.url, alt: media.alt, id: media.id }
                                }),
                                allowedTypes: ['image'],
                                value: draggable.image?.id,
                                render: ({ open }) => el(Fragment, {},
                                    draggable.image?.url && el('div', { className: 'image-preview' },
                                        el('img', { src: draggable.image.url, alt: draggable.image.alt }),
                                        el(Button, {
                                            isSmall: true,
                                            isDestructive: true,
                                            onClick: () => updateDraggable(index, { image: { url: '', alt: '', id: null } })
                                        }, __('Entfernen', 'modular-blocks-plugin'))
                                    ),
                                    el(Button, {
                                        isSecondary: true,
                                        onClick: open,
                                        style: { marginBottom: '12px' }
                                    }, draggable.image?.url ? __('Bild ändern', 'modular-blocks-plugin') : __('Bild auswählen', 'modular-blocks-plugin'))
                                )
                            })
                        ),

                        el('div', { className: 'color-size-row' },
                            el('div', { className: 'color-control' },
                                el('label', {}, __('Farbe', 'modular-blocks-plugin')),
                                el(ColorPalette, {
                                    colors: colorPalette,
                                    value: draggable.color,
                                    onChange: value => updateDraggable(index, { color: value || '#0073aa' }),
                                    disableCustomColors: false,
                                    clearable: false
                                })
                            ),
                            el(SelectControl, {
                                label: __('Größe', 'modular-blocks-plugin'),
                                value: draggable.size,
                                options: [
                                    { label: __('Klein', 'modular-blocks-plugin'), value: 'small' },
                                    { label: __('Mittel', 'modular-blocks-plugin'), value: 'medium' },
                                    { label: __('Groß', 'modular-blocks-plugin'), value: 'large' }
                                ],
                                onChange: value => updateDraggable(index, { size: value })
                            })
                        ),

                        el(RangeControl, {
                            label: __('Deckkraft (%)', 'modular-blocks-plugin'),
                            value: draggable.opacity || 100,
                            onChange: value => updateDraggable(index, { opacity: value }),
                            min: 20,
                            max: 100,
                            step: 5
                        }),

                        el(ToggleControl, {
                            label: __('Unendlich (klonbar)', 'modular-blocks-plugin'),
                            help: __('Element kann mehrfach verwendet werden', 'modular-blocks-plugin'),
                            checked: draggable.infinite || false,
                            onChange: value => updateDraggable(index, { infinite: value })
                        }),

                        el(TextControl, {
                            label: __('Tipp/Hinweis', 'modular-blocks-plugin'),
                            value: draggable.tip || '',
                            onChange: value => updateDraggable(index, { tip: value }),
                            placeholder: __('Optionaler Hinweis für Benutzer', 'modular-blocks-plugin')
                        }),

                        el('div', { className: 'correct-zones-section' },
                            el('label', { className: 'section-label' }, __('Richtige Drop-Zonen', 'modular-blocks-plugin')),
                            el('div', { className: 'zone-checkboxes' },
                                dropZones.map((zone, zIndex) =>
                                    el('label', { key: zIndex, className: 'zone-checkbox' },
                                        el('input', {
                                            type: 'checkbox',
                                            checked: (draggable.correctZones || []).includes(zone.id),
                                            onChange: e => {
                                                const newCorrectZones = e.target.checked
                                                    ? [...(draggable.correctZones || []), zone.id]
                                                    : (draggable.correctZones || []).filter(z => z !== zone.id);
                                                updateDraggable(index, { correctZones: newCorrectZones });
                                            }
                                        }),
                                        el('span', {
                                            className: 'zone-label-indicator',
                                            style: { backgroundColor: zone.borderColor }
                                        }),
                                        zone.label
                                    )
                                )
                            )
                        ),

                        el('div', { className: 'item-actions' },
                            el(Button, {
                                isSmall: true,
                                onClick: () => duplicateDraggable(index)
                            }, __('Duplizieren', 'modular-blocks-plugin')),
                            el(Button, {
                                isSmall: true,
                                isDestructive: true,
                                onClick: () => removeDraggable(index)
                            }, __('Löschen', 'modular-blocks-plugin'))
                        )
                    )
                );
            }

            // Render Drop Zone Editor Panel
            function renderDropZonePanel(zone, index) {
                const isExpanded = selectedZone === index;

                return el('div', {
                    key: index,
                    className: `dropzone-item ${isExpanded ? 'expanded' : 'collapsed'}`,
                    style: { borderLeftColor: zone.borderColor }
                },
                    el('div', {
                        className: 'item-header',
                        onClick: () => setSelectedZone(isExpanded ? null : index)
                    },
                        el('span', {
                            className: 'item-color-indicator',
                            style: { backgroundColor: zone.borderColor }
                        }),
                        el('span', { className: 'item-title' }, zone.label),
                        zone.acceptMultiple && el('span', { className: 'badge multiple' }, '+'),
                        el('span', { className: 'expand-icon' }, isExpanded ? '▼' : '▶')
                    ),

                    isExpanded && el('div', { className: 'item-content' },
                        el(TextControl, {
                            label: __('ID', 'modular-blocks-plugin'),
                            value: zone.id,
                            onChange: value => {
                                const oldId = zone.id;
                                const newId = value.replace(/\s+/g, '-').toLowerCase();
                                // Update draggables that reference this zone
                                const newDraggables = draggables.map(d => ({
                                    ...d,
                                    correctZones: d.correctZones.map(z => z === oldId ? newId : z)
                                }));
                                updateDropZone(index, { id: newId });
                                setAttributes({ draggables: newDraggables });
                            }
                        }),

                        el(TextControl, {
                            label: __('Bezeichnung', 'modular-blocks-plugin'),
                            value: zone.label,
                            onChange: value => updateDropZone(index, { label: value })
                        }),

                        el(ToggleControl, {
                            label: __('Bezeichnung anzeigen', 'modular-blocks-plugin'),
                            checked: zone.showLabel !== false,
                            onChange: value => updateDropZone(index, { showLabel: value })
                        }),

                        el('div', { className: 'color-control' },
                            el('label', {}, __('Rahmenfarbe', 'modular-blocks-plugin')),
                            el(ColorPalette, {
                                colors: colorPalette,
                                value: zone.borderColor,
                                onChange: value => updateDropZone(index, { borderColor: value || '#0073aa' }),
                                disableCustomColors: false,
                                clearable: false
                            })
                        ),

                        el(RangeControl, {
                            label: __('Hintergrund-Deckkraft (%)', 'modular-blocks-plugin'),
                            value: zone.opacity || 100,
                            onChange: value => updateDropZone(index, { opacity: value }),
                            min: 0,
                            max: 100,
                            step: 5
                        }),

                        el(ToggleControl, {
                            label: __('Mehrere Elemente akzeptieren', 'modular-blocks-plugin'),
                            checked: zone.acceptMultiple || false,
                            onChange: value => updateDropZone(index, { acceptMultiple: value })
                        }),

                        el(ToggleControl, {
                            label: __('Auto-Ausrichtung', 'modular-blocks-plugin'),
                            help: __('Elemente automatisch anordnen', 'modular-blocks-plugin'),
                            checked: zone.autoAlign !== false,
                            onChange: value => updateDropZone(index, { autoAlign: value })
                        }),

                        zone.autoAlign !== false && el(RangeControl, {
                            label: __('Ausrichtungs-Abstand (px)', 'modular-blocks-plugin'),
                            value: zone.alignSpacing || 8,
                            onChange: value => updateDropZone(index, { alignSpacing: value }),
                            min: 0,
                            max: 20
                        }),

                        el('div', { className: 'feedback-section' },
                            el('h5', {}, __('Feedback-Texte', 'modular-blocks-plugin')),
                            el(TextareaControl, {
                                label: __('Bei richtig', 'modular-blocks-plugin'),
                                value: zone.tipCorrect || '',
                                onChange: value => updateDropZone(index, { tipCorrect: value }),
                                placeholder: __('Optionaler Feedback-Text für richtige Platzierung', 'modular-blocks-plugin'),
                                rows: 2
                            }),
                            el(TextareaControl, {
                                label: __('Bei falsch', 'modular-blocks-plugin'),
                                value: zone.tipIncorrect || '',
                                onChange: value => updateDropZone(index, { tipIncorrect: value }),
                                placeholder: __('Optionaler Feedback-Text für falsche Platzierung', 'modular-blocks-plugin'),
                                rows: 2
                            })
                        ),

                        el('div', { className: 'item-actions' },
                            el(Button, {
                                isSmall: true,
                                onClick: () => duplicateDropZone(index)
                            }, __('Duplizieren', 'modular-blocks-plugin')),
                            el(Button, {
                                isSmall: true,
                                isDestructive: true,
                                onClick: () => removeDropZone(index)
                            }, __('Löschen', 'modular-blocks-plugin'))
                        )
                    )
                );
            }

            // ============================================
            // VISUAL EDITOR - Drag & Resize Drop Zones
            // ============================================

            // Get mouse position relative to editor
            function getRelativePosition(e) {
                if (!visualEditorRef.current) return { x: 0, y: 0 };
                const rect = visualEditorRef.current.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }

            // Start dragging a zone
            function handleZoneMouseDown(e, zoneIndex) {
                e.preventDefault();
                e.stopPropagation();

                const zone = dropZones[zoneIndex];
                const pos = getRelativePosition(e);

                setEditingZoneIndex(zoneIndex);
                setSelectedZone(zoneIndex);
                setIsDragging(true);
                setDragStart({ x: pos.x, y: pos.y });
                setZoneStart({ x: zone.x, y: zone.y, width: zone.width, height: zone.height });
            }

            // Start resizing a zone
            function handleResizeMouseDown(e, zoneIndex, handle) {
                e.preventDefault();
                e.stopPropagation();

                const zone = dropZones[zoneIndex];
                const pos = getRelativePosition(e);

                setEditingZoneIndex(zoneIndex);
                setSelectedZone(zoneIndex);
                setIsResizing(true);
                setResizeHandle(handle);
                setDragStart({ x: pos.x, y: pos.y });
                setZoneStart({ x: zone.x, y: zone.y, width: zone.width, height: zone.height });
            }

            // Handle mouse move for drag/resize
            function handleEditorMouseMove(e) {
                if (!isDragging && !isResizing) return;
                if (editingZoneIndex === null) return;

                const pos = getRelativePosition(e);
                const deltaX = pos.x - dragStart.x;
                const deltaY = pos.y - dragStart.y;

                // Convert pixel delta to percentage
                const deltaXPercent = (deltaX / pos.width) * 100;
                const deltaYPercent = (deltaY / pos.height) * 100;

                const newZones = [...dropZones];
                const zone = { ...newZones[editingZoneIndex] };

                if (isDragging) {
                    // Move the zone
                    zone.x = Math.max(0, Math.min(100 - (zone.width / pos.width * 100), zoneStart.x + deltaXPercent));
                    zone.y = Math.max(0, Math.min(100 - (zone.height / pos.height * 100), zoneStart.y + deltaYPercent));
                } else if (isResizing) {
                    // Resize the zone based on handle
                    const minSize = 30;

                    if (resizeHandle.includes('e')) {
                        zone.width = Math.max(minSize, zoneStart.width + deltaX);
                    }
                    if (resizeHandle.includes('w')) {
                        const newWidth = Math.max(minSize, zoneStart.width - deltaX);
                        zone.x = zoneStart.x + deltaXPercent * (zoneStart.width / newWidth);
                        zone.width = newWidth;
                    }
                    if (resizeHandle.includes('s')) {
                        zone.height = Math.max(minSize, zoneStart.height + deltaY);
                    }
                    if (resizeHandle.includes('n')) {
                        const newHeight = Math.max(minSize, zoneStart.height - deltaY);
                        zone.y = zoneStart.y + deltaYPercent * (zoneStart.height / newHeight);
                        zone.height = newHeight;
                    }
                }

                newZones[editingZoneIndex] = zone;
                setAttributes({ dropZones: newZones });
            }

            // Handle mouse up
            function handleEditorMouseUp() {
                // Mark that we just finished dragging/resizing to prevent click
                if (isDragging || isResizing) {
                    justFinishedDragRef.current = true;
                    // Reset after a short delay
                    setTimeout(() => {
                        justFinishedDragRef.current = false;
                    }, 100);
                }
                setIsDragging(false);
                setIsResizing(false);
                setResizeHandle(null);
            }

            // Add zone at click position
            function handleEditorClick(e) {
                // Prevent adding zone if we just finished dragging/resizing
                if (isDragging || isResizing || justFinishedDragRef.current) return;

                // Only add zone if clicking on empty area (not on existing zone)
                if (e.target.classList.contains('visual-editor-zones-overlay')) {
                    const pos = getRelativePosition(e);
                    const xPercent = (pos.x / pos.width) * 100;
                    const yPercent = (pos.y / pos.height) * 100;

                    const newId = 'zone' + Date.now();
                    const newZone = {
                        id: newId,
                        label: __('Zone', 'modular-blocks-plugin') + ' ' + (dropZones.length + 1),
                        showLabel: false,
                        x: Math.min(80, xPercent),
                        y: Math.min(80, yPercent),
                        width: 120,
                        height: 80,
                        acceptMultiple: false,
                        backgroundColor: 'rgba(0, 115, 170, 0.1)',
                        borderColor: colorPalette[dropZones.length % colorPalette.length].color,
                        opacity: 100,
                        autoAlign: true,
                        alignSpacing: 8,
                        tipCorrect: '',
                        tipIncorrect: ''
                    };

                    setAttributes({ dropZones: [...dropZones, newZone] });
                    setEditingZoneIndex(dropZones.length);
                    setSelectedZone(dropZones.length);
                }
            }

            // Render Visual Editor
            function renderVisualEditor() {
                return el('div', { className: 'visual-editor-container' },
                    el('div', { className: 'visual-editor-toolbar' },
                        el('span', { className: 'toolbar-info' },
                            __('Klicken Sie auf die Fläche um eine neue Zone hinzuzufügen. Ziehen Sie Zonen um sie zu verschieben.', 'modular-blocks-plugin')
                        ),
                        el(Button, {
                            isSecondary: true,
                            isSmall: true,
                            onClick: addDropZone
                        }, __('+ Zone hinzufügen', 'modular-blocks-plugin'))
                    ),
                    // Container for image and zones - position: relative
                    el('div', {
                        ref: visualEditorRef,
                        className: 'visual-editor-area' + (isDragging ? ' is-dragging' : '') + (isResizing ? ' is-resizing' : ''),
                        style: {
                            position: 'relative',
                            minHeight: '200px',
                            background: backgroundImage?.url ? 'transparent' : '#f0f0f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }
                    },
                        // Background image as img element (same as frontend)
                        backgroundImage?.url && el('img', {
                            src: backgroundImage.url,
                            alt: backgroundImage.alt || '',
                            style: {
                                display: 'block',
                                width: '100%',
                                height: 'auto',
                                pointerEvents: 'none',
                                borderRadius: '4px'
                            }
                        }),
                        // Overlay container for drop zones - exactly over the image
                        el('div', {
                            className: 'visual-editor-zones-overlay',
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                cursor: isDragging ? 'grabbing' : 'crosshair',
                                userSelect: 'none'
                            },
                            onMouseMove: handleEditorMouseMove,
                            onMouseUp: handleEditorMouseUp,
                            onMouseLeave: handleEditorMouseUp,
                            onClick: handleEditorClick
                        },
                            // Render zones - always gray in editor
                            dropZones.map((zone, index) => {
                                const isSelected = editingZoneIndex === index;
                                // Use gray for all zones
                                const zoneColor = '#888888';
                                const selectedColor = '#555555';
                                return el('div', {
                                    key: zone.id,
                                    className: 'visual-zone' + (isSelected ? ' selected' : ''),
                                    style: {
                                        position: 'absolute',
                                        left: zone.x + '%',
                                        top: zone.y + '%',
                                        width: zone.width + 'px',
                                        height: zone.height + 'px',
                                        border: `2px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? selectedColor : zoneColor}`,
                                        borderRadius: '4px',
                                        backgroundColor: isSelected ? 'rgba(128, 128, 128, 0.25)' : 'rgba(128, 128, 128, 0.15)',
                                        cursor: isDragging && editingZoneIndex === index ? 'grabbing' : 'grab',
                                        boxShadow: isSelected ? '0 0 0 2px ' + selectedColor : 'none',
                                        zIndex: isSelected ? 10 : 1
                                    },
                                    onMouseDown: (e) => handleZoneMouseDown(e, index)
                                },
                                // Zone label
                                el('div', {
                                    className: 'visual-zone-label',
                                    style: {
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: '#333333',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '90%'
                                    }
                                }, zone.label),

                                // Resize handles (only for selected zone)
                                isSelected && el(Fragment, {},
                                    // Corner handles - use gray
                                    ['nw', 'ne', 'sw', 'se'].map(handle =>
                                        el('div', {
                                            key: handle,
                                            className: 'resize-handle resize-' + handle,
                                            style: {
                                                position: 'absolute',
                                                width: '10px',
                                                height: '10px',
                                                background: selectedColor,
                                                borderRadius: '2px',
                                                ...(handle.includes('n') ? { top: '-5px' } : { bottom: '-5px' }),
                                                ...(handle.includes('w') ? { left: '-5px' } : { right: '-5px' }),
                                                cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize'
                                            },
                                            onMouseDown: (e) => handleResizeMouseDown(e, index, handle)
                                        })
                                    ),
                                    // Edge handles - use gray
                                    ['n', 'e', 's', 'w'].map(handle =>
                                        el('div', {
                                            key: handle,
                                            className: 'resize-handle resize-' + handle,
                                            style: {
                                                position: 'absolute',
                                                background: selectedColor,
                                                borderRadius: '2px',
                                                ...(handle === 'n' ? { top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '8px', cursor: 'ns-resize' } : {}),
                                                ...(handle === 's' ? { bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '8px', cursor: 'ns-resize' } : {}),
                                                ...(handle === 'e' ? { right: '-4px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '20px', cursor: 'ew-resize' } : {}),
                                                ...(handle === 'w' ? { left: '-4px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '20px', cursor: 'ew-resize' } : {})
                                            },
                                            onMouseDown: (e) => handleResizeMouseDown(e, index, handle)
                                        })
                                    ),
                                    // Delete button
                                    el('button', {
                                        className: 'zone-delete-btn',
                                        style: {
                                            position: 'absolute',
                                            top: '-12px',
                                            right: '-12px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#dc2626',
                                            color: 'white',
                                            border: '2px solid white',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            lineHeight: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        },
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            removeDropZone(index);
                                            setEditingZoneIndex(null);
                                        },
                                        title: __('Zone löschen', 'modular-blocks-plugin')
                                    }, '×')
                                )
                            );
                        }),

                            // Empty state message
                            dropZones.length === 0 && el('div', {
                                className: 'visual-editor-empty',
                                style: {
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    color: '#666',
                                    pointerEvents: 'none'
                                }
                            },
                                el('div', { style: { fontSize: '48px', marginBottom: '8px' } }, '📍'),
                                el('div', { style: { fontSize: '14px' } }, __('Klicken um erste Drop-Zone hinzuzufügen', 'modular-blocks-plugin'))
                            )
                        ) // Close zones overlay div
                    ), // Close visual-editor-area div

                    // Selected zone properties panel
                    editingZoneIndex !== null && dropZones[editingZoneIndex] && el('div', { className: 'visual-zone-properties' },
                        el('h5', {}, __('Zone bearbeiten:', 'modular-blocks-plugin') + ' ' + dropZones[editingZoneIndex].label),
                        el(TextControl, {
                            label: __('Bezeichnung', 'modular-blocks-plugin'),
                            value: dropZones[editingZoneIndex].label,
                            onChange: value => updateDropZone(editingZoneIndex, { label: value })
                        }),
                        el('div', { className: 'zone-position-info' },
                            el('span', {}, `X: ${Math.round(dropZones[editingZoneIndex].x)}%`),
                            el('span', {}, `Y: ${Math.round(dropZones[editingZoneIndex].y)}%`),
                            el('span', {}, `${Math.round(dropZones[editingZoneIndex].width)}×${Math.round(dropZones[editingZoneIndex].height)}px`)
                        ),
                        el('div', { className: 'zone-quick-settings' },
                            el(ToggleControl, {
                                label: __('Mehrere Elemente', 'modular-blocks-plugin'),
                                checked: dropZones[editingZoneIndex].acceptMultiple || false,
                                onChange: value => updateDropZone(editingZoneIndex, { acceptMultiple: value })
                            }),
                            el(ToggleControl, {
                                label: __('Label anzeigen', 'modular-blocks-plugin'),
                                checked: dropZones[editingZoneIndex].showLabel !== false,
                                onChange: value => updateDropZone(editingZoneIndex, { showLabel: value })
                            })
                        ),
                        el('div', { className: 'zone-color-control' },
                            el('label', {}, __('Farbe', 'modular-blocks-plugin')),
                            el(ColorPalette, {
                                colors: colorPalette,
                                value: dropZones[editingZoneIndex].borderColor,
                                onChange: value => updateDropZone(editingZoneIndex, { borderColor: value || '#0073aa' }),
                                disableCustomColors: false,
                                clearable: false
                            })
                        )
                    )
                );
            }

            // Render Preview
            function renderPreview() {
                return el('div', { className: 'drag-drop-preview' },
                    el('div', {
                        className: 'preview-area',
                        style: {
                            position: 'relative',
                            background: backgroundImage?.url ? 'transparent' : '#f8f9fa',
                            minHeight: '200px',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }
                    },
                        // Background image as img element (same as frontend)
                        backgroundImage?.url && el('img', {
                            src: backgroundImage.url,
                            alt: backgroundImage.alt || '',
                            style: {
                                display: 'block',
                                width: '100%',
                                height: 'auto',
                                borderRadius: '4px'
                            }
                        }),
                        // Overlay for drop zones - exactly over the image
                        el('div', {
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0
                            }
                        },
                            // Drop zones - always gray
                            dropZones.map((zone, index) =>
                                el('div', {
                                    key: index,
                                    className: 'preview-zone',
                                    style: {
                                        position: 'absolute',
                                        left: zone.x + '%',
                                        top: zone.y + '%',
                                        width: zone.width + 'px',
                                        height: zone.height + 'px',
                                        border: '2px dashed #888888',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(128, 128, 128, 0.15)',
                                        opacity: (zone.opacity || 100) / 100,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        color: '#333333'
                                    }
                                }, zone.showLabel !== false ? zone.label : '')
                            )
                        )
                    ),
                    el('div', { className: 'preview-draggables' },
                        el('h5', {}, __('Ziehbare Elemente:', 'modular-blocks-plugin')),
                        el('div', { className: 'draggables-list' },
                            draggables.map((draggable, index) => {
                                // Image-only: show just the image without background
                                const isImageOnly = draggable.type === 'image';
                                return el('span', {
                                    key: index,
                                    className: `preview-draggable draggable-${draggable.size}` + (isImageOnly ? ' image-only' : ''),
                                    style: {
                                        backgroundColor: isImageOnly ? 'transparent' : draggable.color,
                                        opacity: (draggable.opacity || 100) / 100,
                                        border: isImageOnly ? 'none' : undefined,
                                        padding: isImageOnly ? '4px' : undefined
                                    }
                                },
                                    draggable.infinite && el('span', { className: 'infinite-icon' }, '∞'),
                                    (draggable.type === 'image' || draggable.type === 'both') && draggable.image?.url && el('img', {
                                        src: draggable.image.url,
                                        alt: draggable.image.alt,
                                        style: {
                                            maxHeight: isImageOnly ? '60px' : '24px',
                                            maxWidth: isImageOnly ? '80px' : 'auto',
                                            marginRight: draggable.type === 'both' ? '4px' : '0',
                                            borderRadius: '4px'
                                        }
                                    }),
                                    (draggable.type === 'text' || draggable.type === 'both') && draggable.content
                                );
                            })
                        )
                    )
                );
            }

            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, { title: __('Allgemeine Einstellungen', 'modular-blocks-plugin'), initialOpen: true },
                        el(RangeControl, {
                            label: __('Drop-Bereich Höhe (px)', 'modular-blocks-plugin'),
                            value: backgroundHeight,
                            onChange: value => setAttributes({ backgroundHeight: value }),
                            min: 200,
                            max: 800,
                            step: 10
                        }),
                        el(MediaUploadCheck, {},
                            el(MediaUpload, {
                                onSelect: media => setAttributes({
                                    backgroundImage: { url: media.url, alt: media.alt, id: media.id }
                                }),
                                allowedTypes: ['image'],
                                value: backgroundImage?.id,
                                render: ({ open }) => el(Fragment, {},
                                    backgroundImage?.url && el('div', { className: 'background-preview' },
                                        el('img', { src: backgroundImage.url, alt: backgroundImage.alt, style: { maxWidth: '100%', maxHeight: '100px' } }),
                                        el(Button, {
                                            isSmall: true,
                                            isDestructive: true,
                                            onClick: () => setAttributes({ backgroundImage: { url: '', alt: '', id: null } })
                                        }, __('Entfernen', 'modular-blocks-plugin'))
                                    ),
                                    el(Button, {
                                        isSecondary: true,
                                        onClick: open
                                    }, backgroundImage?.url ? __('Hintergrundbild ändern', 'modular-blocks-plugin') : __('Hintergrundbild auswählen', 'modular-blocks-plugin'))
                                )
                            })
                        )
                    ),

                    el(PanelBody, { title: __('Verhaltens-Einstellungen', 'modular-blocks-plugin'), initialOpen: false },
                        el(ToggleControl, {
                            label: __('Feedback anzeigen', 'modular-blocks-plugin'),
                            checked: showFeedback,
                            onChange: value => setAttributes({ showFeedback: value })
                        }),
                        el(ToggleControl, {
                            label: __('Wiederholen-Button', 'modular-blocks-plugin'),
                            checked: showRetry,
                            onChange: value => setAttributes({ showRetry: value })
                        }),
                        el(ToggleControl, {
                            label: __('Lösung anzeigen', 'modular-blocks-plugin'),
                            checked: showSolution,
                            onChange: value => setAttributes({ showSolution: value })
                        }),
                        el(ToggleControl, {
                            label: __('Sofortiges Feedback', 'modular-blocks-plugin'),
                            help: __('Zeigt Feedback direkt nach dem Platzieren', 'modular-blocks-plugin'),
                            checked: instantFeedback,
                            onChange: value => setAttributes({ instantFeedback: value })
                        }),
                        el(ToggleControl, {
                            label: __('Einrasten aktivieren', 'modular-blocks-plugin'),
                            checked: enableSnap,
                            onChange: value => setAttributes({ enableSnap: value })
                        }),
                        el(ToggleControl, {
                            label: __('Punkte anzeigen', 'modular-blocks-plugin'),
                            checked: showScore,
                            onChange: value => setAttributes({ showScore: value })
                        }),
                        el(ToggleControl, {
                            label: __('Elemente mischen', 'modular-blocks-plugin'),
                            checked: randomizeDraggables,
                            onChange: value => setAttributes({ randomizeDraggables: value })
                        }),
                        el(ToggleControl, {
                            label: __('Teilpunkte erlauben', 'modular-blocks-plugin'),
                            checked: allowPartialScore,
                            onChange: value => setAttributes({ allowPartialScore: value })
                        }),
                        el(SelectControl, {
                            label: __('Drop-Zonen hervorheben', 'modular-blocks-plugin'),
                            value: highlightDropZones || 'dragging',
                            options: [
                                { label: __('Beim Ziehen', 'modular-blocks-plugin'), value: 'dragging' },
                                { label: __('Immer', 'modular-blocks-plugin'), value: 'always' },
                                { label: __('Nie', 'modular-blocks-plugin'), value: 'never' }
                            ],
                            onChange: value => setAttributes({ highlightDropZones: value })
                        })
                    ),

                    el(PanelBody, { title: __('Bewertung & Strafen', 'modular-blocks-plugin'), initialOpen: false },
                        el(ToggleControl, {
                            label: __('Strafpunkte aktivieren', 'modular-blocks-plugin'),
                            help: __('Punkte für falsche Platzierungen abziehen', 'modular-blocks-plugin'),
                            checked: applyPenalty || false,
                            onChange: value => setAttributes({ applyPenalty: value })
                        }),
                        applyPenalty && el(RangeControl, {
                            label: __('Strafpunkte pro Fehler', 'modular-blocks-plugin'),
                            value: penaltyPerWrong || 1,
                            onChange: value => setAttributes({ penaltyPerWrong: value }),
                            min: 1,
                            max: 5
                        })
                    ),

                    el(PanelBody, { title: __('Erweiterte Funktionen', 'modular-blocks-plugin'), initialOpen: false },
                        el(ToggleControl, {
                            label: __('Vollbild-Modus', 'modular-blocks-plugin'),
                            help: __('Ermöglicht Vollbildansicht', 'modular-blocks-plugin'),
                            checked: enableFullscreen !== false,
                            onChange: value => setAttributes({ enableFullscreen: value })
                        }),
                        el(ToggleControl, {
                            label: __('Auto-Skalierung', 'modular-blocks-plugin'),
                            help: __('Responsives Skalieren wie H5P', 'modular-blocks-plugin'),
                            checked: enableAutoScale !== false,
                            onChange: value => setAttributes({ enableAutoScale: value })
                        })
                    ),

                    el(PanelBody, { title: __('Feedback-Texte', 'modular-blocks-plugin'), initialOpen: false },
                        el(TextControl, {
                            label: __('Punkte-Text', 'modular-blocks-plugin'),
                            help: __('Verwende @score und @total als Platzhalter', 'modular-blocks-plugin'),
                            value: scoreText,
                            onChange: value => setAttributes({ scoreText: value })
                        }),
                        el(TextareaControl, {
                            label: __('Erfolgs-Text (100%)', 'modular-blocks-plugin'),
                            value: successText,
                            onChange: value => setAttributes({ successText: value }),
                            rows: 2
                        }),
                        el(TextareaControl, {
                            label: __('Teilerfolgs-Text', 'modular-blocks-plugin'),
                            value: partialSuccessText,
                            onChange: value => setAttributes({ partialSuccessText: value }),
                            rows: 2
                        }),
                        el(TextareaControl, {
                            label: __('Misserfolgs-Text', 'modular-blocks-plugin'),
                            value: failText,
                            onChange: value => setAttributes({ failText: value }),
                            rows: 2
                        })
                    )
                ),

                // Main Editor
                el('div', blockProps,
                    el('div', { className: 'drag-drop-editor' },
                        // Title
                        el('div', { className: 'editor-header' },
                            el(RichText, {
                                tagName: 'h3',
                                value: title,
                                onChange: value => setAttributes({ title: value }),
                                placeholder: __('Titel eingeben...', 'modular-blocks-plugin'),
                                className: 'editor-title'
                            }),
                            el(RichText, {
                                tagName: 'p',
                                value: description,
                                onChange: value => setAttributes({ description: value }),
                                placeholder: __('Beschreibung eingeben...', 'modular-blocks-plugin'),
                                className: 'editor-description'
                            })
                        ),

                        // Tab Navigation
                        el('div', { className: 'editor-tabs' },
                            el(Button, {
                                className: activeTab === 'elements' ? 'active' : '',
                                onClick: () => setActiveTab('elements')
                            }, __('Elemente', 'modular-blocks-plugin') + ` (${draggables.length})`),
                            el(Button, {
                                className: activeTab === 'zones' ? 'active' : '',
                                onClick: () => setActiveTab('zones')
                            }, __('Zonen-Liste', 'modular-blocks-plugin') + ` (${dropZones.length})`),
                            el(Button, {
                                className: activeTab === 'visual' ? 'active' : '',
                                onClick: () => setActiveTab('visual')
                            }, __('Visueller Editor', 'modular-blocks-plugin')),
                            el(Button, {
                                className: activeTab === 'preview' ? 'active' : '',
                                onClick: () => setActiveTab('preview')
                            }, __('Vorschau', 'modular-blocks-plugin')),
                            el(Button, {
                                className: activeTab === 'import' ? 'active' : '',
                                onClick: () => setActiveTab('import')
                            }, __('H5P Import', 'modular-blocks-plugin'))
                        ),

                        // Tab Content
                        el('div', { className: 'tab-content' },
                            activeTab === 'elements' && el('div', { className: 'elements-tab' },
                                el('div', { className: 'tab-header' },
                                    el('h4', {}, __('Ziehbare Elemente', 'modular-blocks-plugin')),
                                    el(Button, {
                                        isPrimary: true,
                                        onClick: addDraggable
                                    }, __('+ Neues Element', 'modular-blocks-plugin'))
                                ),
                                el('div', { className: 'items-list' },
                                    draggables.length === 0
                                        ? el('div', { className: 'empty-state' },
                                            __('Keine Elemente vorhanden. Fügen Sie ein Element hinzu.', 'modular-blocks-plugin'))
                                        : draggables.map((d, i) => renderDraggablePanel(d, i))
                                )
                            ),

                            activeTab === 'zones' && el('div', { className: 'zones-tab' },
                                el('div', { className: 'tab-header' },
                                    el('h4', {}, __('Drop-Zonen', 'modular-blocks-plugin')),
                                    el(Button, {
                                        isPrimary: true,
                                        onClick: addDropZone
                                    }, __('+ Neue Zone', 'modular-blocks-plugin'))
                                ),
                                el('div', { className: 'items-list' },
                                    dropZones.length === 0
                                        ? el('div', { className: 'empty-state' },
                                            __('Keine Drop-Zonen vorhanden. Fügen Sie eine Zone hinzu.', 'modular-blocks-plugin'))
                                        : dropZones.map((z, i) => renderDropZonePanel(z, i))
                                )
                            ),

                            activeTab === 'visual' && renderVisualEditor(),

                            activeTab === 'preview' && renderPreview(),

                            activeTab === 'import' && el('div', { className: 'import-tab' },
                                el('div', { className: 'import-header' },
                                    el('h4', {}, __('H5P Drag and Drop importieren', 'modular-blocks-plugin')),
                                    el('p', { className: 'import-description' },
                                        __('Laden Sie eine H5P-Datei (.h5p) hoch, um eine bestehende Drag & Drop Übung zu importieren. Unterstützt werden H5P Drag and Drop und Drag Question Inhaltstypen.', 'modular-blocks-plugin')
                                    )
                                ),
                                el('div', { className: 'import-dropzone' },
                                    el('input', {
                                        type: 'file',
                                        accept: '.h5p',
                                        onChange: handleH5PImport,
                                        id: 'h5p-file-input',
                                        style: { display: 'none' }
                                    }),
                                    el('label', {
                                        htmlFor: 'h5p-file-input',
                                        className: 'import-label'
                                    },
                                        el('span', { className: 'import-icon' }, '📁'),
                                        el('span', { className: 'import-text' },
                                            isImporting
                                                ? __('Importiere...', 'modular-blocks-plugin')
                                                : __('H5P-Datei auswählen oder hier ablegen', 'modular-blocks-plugin')
                                        )
                                    ),
                                    isImporting && el('div', { className: 'import-progress' },
                                        el('div', { className: 'spinner' })
                                    )
                                ),
                                importError && el('div', { className: 'import-error' },
                                    el('span', { className: 'error-icon' }, '⚠️'),
                                    el('span', {}, importError)
                                ),
                                el('div', { className: 'import-info' },
                                    el('h5', {}, __('Unterstützte Funktionen:', 'modular-blocks-plugin')),
                                    el('ul', {},
                                        el('li', {}, __('Ziehbare Elemente (Text und Bild)', 'modular-blocks-plugin')),
                                        el('li', {}, __('Drop-Zonen mit Positionen', 'modular-blocks-plugin')),
                                        el('li', {}, __('Hintergrundbilder', 'modular-blocks-plugin')),
                                        el('li', {}, __('Mehrfach verwendbare Elemente', 'modular-blocks-plugin')),
                                        el('li', {}, __('Feedback-Einstellungen', 'modular-blocks-plugin')),
                                        el('li', {}, __('Punktevergabe-Optionen', 'modular-blocks-plugin'))
                                    )
                                )
                            )
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
