/**
 * Point of Interest Block - Editor
 *
 * Interactive hotspots on images with full editor controls
 */
import './style.css';
import './editor.css';

import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    InspectorControls,
    MediaUpload,
    MediaUploadCheck,
    ColorPalette
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    TextareaControl,
    Button,
    RangeControl,
    SelectControl,
    ToggleControl,
    Icon
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { plus, trash, chevronUp, chevronDown } from '@wordpress/icons';

// Color palette for hotspots
const HOTSPOT_COLORS = [
    { name: __('Blau', 'modular-blocks-plugin'), color: '#0073aa' },
    { name: __('Rot', 'modular-blocks-plugin'), color: '#d63638' },
    { name: __('Grün', 'modular-blocks-plugin'), color: '#00a32a' },
    { name: __('Orange', 'modular-blocks-plugin'), color: '#f56e28' },
    { name: __('Lila', 'modular-blocks-plugin'), color: '#9b59b6' },
    { name: __('Türkis', 'modular-blocks-plugin'), color: '#1abc9c' },
    { name: __('Schwarz', 'modular-blocks-plugin'), color: '#1e1e1e' },
    { name: __('Grau', 'modular-blocks-plugin'), color: '#646970' },
];

// Icon options
const ICON_OPTIONS = [
    { label: __('Info', 'modular-blocks-plugin'), value: 'info' },
    { label: __('Stern', 'modular-blocks-plugin'), value: 'star' },
    { label: __('Gebäude', 'modular-blocks-plugin'), value: 'building' },
    { label: __('Natur', 'modular-blocks-plugin'), value: 'nature' },
    { label: __('Geschäft', 'modular-blocks-plugin'), value: 'store' },
    { label: __('Standort', 'modular-blocks-plugin'), value: 'location' },
    { label: __('Warnung', 'modular-blocks-plugin'), value: 'warning' },
    { label: __('Plus', 'modular-blocks-plugin'), value: 'plus' },
];

// Size options
const SIZE_OPTIONS = [
    { label: __('Klein', 'modular-blocks-plugin'), value: 'small' },
    { label: __('Mittel', 'modular-blocks-plugin'), value: 'medium' },
    { label: __('Groß', 'modular-blocks-plugin'), value: 'large' },
];

// Animation options
const ANIMATION_OPTIONS = [
    { label: __('Keine', 'modular-blocks-plugin'), value: 'none' },
    { label: __('Pulsieren', 'modular-blocks-plugin'), value: 'pulse' },
    { label: __('Hüpfen', 'modular-blocks-plugin'), value: 'bounce' },
];

// Trigger options
const TRIGGER_OPTIONS = [
    { label: __('Klick', 'modular-blocks-plugin'), value: 'click' },
    { label: __('Hover', 'modular-blocks-plugin'), value: 'hover' },
];

// Hotspot style options
const HOTSPOT_STYLE_OPTIONS = [
    { label: __('Kreis', 'modular-blocks-plugin'), value: 'circle' },
    { label: __('Quadrat', 'modular-blocks-plugin'), value: 'square' },
    { label: __('Pin', 'modular-blocks-plugin'), value: 'pin' },
];

// Popup style options
const POPUP_STYLE_OPTIONS = [
    { label: __('Tooltip', 'modular-blocks-plugin'), value: 'tooltip' },
    { label: __('Modal', 'modular-blocks-plugin'), value: 'modal' },
    { label: __('Seitenleiste', 'modular-blocks-plugin'), value: 'sidebar' },
];

// Popup position options
const POPUP_POSITION_OPTIONS = [
    { label: __('Automatisch', 'modular-blocks-plugin'), value: 'auto' },
    { label: __('Oben', 'modular-blocks-plugin'), value: 'top' },
    { label: __('Unten', 'modular-blocks-plugin'), value: 'bottom' },
    { label: __('Links', 'modular-blocks-plugin'), value: 'left' },
    { label: __('Rechts', 'modular-blocks-plugin'), value: 'right' },
];

// Default hotspot template
const DEFAULT_HOTSPOT = {
    x: 50,
    y: 50,
    title: __('Neuer Hotspot', 'modular-blocks-plugin'),
    content: __('Beschreibung des Hotspots', 'modular-blocks-plugin'),
    icon: 'info',
    color: '#0073aa',
    size: 'medium',
    animation: 'pulse',
    trigger: 'click'
};

registerBlockType('modular-blocks/point-of-interest', {
    edit: ({ attributes, setAttributes, isSelected }) => {
        const blockProps = useBlockProps();
        const {
            backgroundImage,
            title,
            description,
            hotspots,
            hotspotStyle,
            popupStyle,
            popupPosition,
            showNumbers,
            autoClose,
            closeOnOutsideClick,
            height,
            enableZoom,
            zoomLevel
        } = attributes;

        // State for expanded hotspot cards and dragging
        const [expandedHotspot, setExpandedHotspot] = useState(null);
        const [selectedHotspot, setSelectedHotspot] = useState(null);
        const [isDragging, setIsDragging] = useState(false);

        const imageWrapperRef = useRef(null);
        const dragIndexRef = useRef(null);
        const hotspotsRef = useRef(hotspots);

        // Keep hotspotsRef in sync
        hotspotsRef.current = hotspots;

        // Add a new hotspot
        const addHotspot = () => {
            const newHotspots = [...hotspots, { ...DEFAULT_HOTSPOT }];
            setAttributes({ hotspots: newHotspots });
            setExpandedHotspot(newHotspots.length - 1);
            setSelectedHotspot(newHotspots.length - 1);
        };

        // Update a specific hotspot
        const updateHotspot = (index, updates) => {
            const newHotspots = [...hotspots];
            newHotspots[index] = { ...newHotspots[index], ...updates };
            setAttributes({ hotspots: newHotspots });
        };

        // Remove a hotspot
        const removeHotspot = (index) => {
            const newHotspots = hotspots.filter((_, i) => i !== index);
            setAttributes({ hotspots: newHotspots });
            if (expandedHotspot === index) {
                setExpandedHotspot(null);
            }
            if (selectedHotspot === index) {
                setSelectedHotspot(null);
            }
        };

        // Move hotspot up in the list
        const moveHotspotUp = (index) => {
            if (index === 0) return;
            const newHotspots = [...hotspots];
            [newHotspots[index - 1], newHotspots[index]] = [newHotspots[index], newHotspots[index - 1]];
            setAttributes({ hotspots: newHotspots });
            if (expandedHotspot === index) setExpandedHotspot(index - 1);
            if (selectedHotspot === index) setSelectedHotspot(index - 1);
        };

        // Move hotspot down in the list
        const moveHotspotDown = (index) => {
            if (index === hotspots.length - 1) return;
            const newHotspots = [...hotspots];
            [newHotspots[index], newHotspots[index + 1]] = [newHotspots[index + 1], newHotspots[index]];
            setAttributes({ hotspots: newHotspots });
            if (expandedHotspot === index) setExpandedHotspot(index + 1);
            if (selectedHotspot === index) setSelectedHotspot(index + 1);
        };

        // Handle mouse down on hotspot - start dragging
        const handleMouseDown = (e, index) => {
            e.preventDefault();
            e.stopPropagation();

            setIsDragging(true);
            setSelectedHotspot(index);
            dragIndexRef.current = index;

            const handleMouseMove = (moveEvent) => {
                if (dragIndexRef.current === null || !imageWrapperRef.current) return;

                const rect = imageWrapperRef.current.getBoundingClientRect();
                const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

                let x = ((clientX - rect.left) / rect.width) * 100;
                let y = ((clientY - rect.top) / rect.height) * 100;

                // Clamp values between 0 and 100
                x = Math.max(0, Math.min(100, x));
                y = Math.max(0, Math.min(100, y));

                // Update hotspot position
                const newHotspots = [...hotspotsRef.current];
                newHotspots[dragIndexRef.current] = {
                    ...newHotspots[dragIndexRef.current],
                    x: Math.round(x * 10) / 10,
                    y: Math.round(y * 10) / 10
                };
                setAttributes({ hotspots: newHotspots });
            };

            const handleMouseUp = () => {
                setIsDragging(false);
                dragIndexRef.current = null;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        // Render single hotspot card in inspector
        const renderHotspotCard = (hotspot, index) => {
            const isExpanded = expandedHotspot === index;
            const isSelectedHotspot = selectedHotspot === index;

            return (
                <div
                    key={index}
                    className={`hotspot-edit-card ${isExpanded ? 'is-expanded' : ''}`}
                >
                    <div
                        className="hotspot-card-header"
                        onClick={() => {
                            setExpandedHotspot(isExpanded ? null : index);
                            setSelectedHotspot(index);
                        }}
                    >
                        <div className="hotspot-card-title">
                            <div
                                className="hotspot-card-marker"
                                style={{ backgroundColor: hotspot.color }}
                            >
                                {index + 1}
                            </div>
                            <span className="hotspot-card-name">
                                {hotspot.title || `Hotspot ${index + 1}`}
                            </span>
                        </div>
                        <div className="hotspot-card-actions">
                            <div className="reorder-buttons">
                                <Button
                                    icon={chevronUp}
                                    size="small"
                                    disabled={index === 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveHotspotUp(index);
                                    }}
                                    label={__('Nach oben', 'modular-blocks-plugin')}
                                />
                                <Button
                                    icon={chevronDown}
                                    size="small"
                                    disabled={index === hotspots.length - 1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        moveHotspotDown(index);
                                    }}
                                    label={__('Nach unten', 'modular-blocks-plugin')}
                                />
                            </div>
                            <Button
                                icon={trash}
                                isDestructive
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeHotspot(index);
                                }}
                                label={__('Entfernen', 'modular-blocks-plugin')}
                            />
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="hotspot-card-content">
                            <TextControl
                                label={__('Titel', 'modular-blocks-plugin')}
                                value={hotspot.title}
                                onChange={(value) => updateHotspot(index, { title: value })}
                            />

                            <TextareaControl
                                label={__('Inhalt', 'modular-blocks-plugin')}
                                value={hotspot.content}
                                onChange={(value) => updateHotspot(index, { content: value })}
                                rows={3}
                            />

                            <div className="position-controls">
                                <RangeControl
                                    label={__('X Position (%)', 'modular-blocks-plugin')}
                                    value={hotspot.x}
                                    onChange={(value) => updateHotspot(index, { x: value })}
                                    min={0}
                                    max={100}
                                    step={0.5}
                                />
                                <RangeControl
                                    label={__('Y Position (%)', 'modular-blocks-plugin')}
                                    value={hotspot.y}
                                    onChange={(value) => updateHotspot(index, { y: value })}
                                    min={0}
                                    max={100}
                                    step={0.5}
                                />
                            </div>

                            <div className="settings-grid">
                                <SelectControl
                                    label={__('Icon', 'modular-blocks-plugin')}
                                    value={hotspot.icon}
                                    options={ICON_OPTIONS}
                                    onChange={(value) => updateHotspot(index, { icon: value })}
                                />

                                <SelectControl
                                    label={__('Größe', 'modular-blocks-plugin')}
                                    value={hotspot.size}
                                    options={SIZE_OPTIONS}
                                    onChange={(value) => updateHotspot(index, { size: value })}
                                />

                                <SelectControl
                                    label={__('Animation', 'modular-blocks-plugin')}
                                    value={hotspot.animation}
                                    options={ANIMATION_OPTIONS}
                                    onChange={(value) => updateHotspot(index, { animation: value })}
                                />

                                <SelectControl
                                    label={__('Auslöser', 'modular-blocks-plugin')}
                                    value={hotspot.trigger}
                                    options={TRIGGER_OPTIONS}
                                    onChange={(value) => updateHotspot(index, { trigger: value })}
                                />
                            </div>

                            <div className="hotspot-color-palette">
                                <p style={{ marginBottom: '8px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' }}>
                                    {__('Farbe', 'modular-blocks-plugin')}
                                </p>
                                <ColorPalette
                                    colors={HOTSPOT_COLORS}
                                    value={hotspot.color}
                                    onChange={(value) => updateHotspot(index, { color: value || '#0073aa' })}
                                    clearable={false}
                                />
                            </div>

                            {hotspot.animation !== 'none' && (
                                <div className="animation-preview">
                                    <div
                                        className={`animation-preview-dot preview-${hotspot.animation}`}
                                        style={{ '--preview-color': hotspot.color }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        {__('Animation-Vorschau', 'modular-blocks-plugin')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div {...blockProps}>
                <InspectorControls>
                    {/* Background Image Panel */}
                    <PanelBody title={__('Hintergrundbild', 'modular-blocks-plugin')} initialOpen={true}>
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={(media) => setAttributes({
                                    backgroundImage: {
                                        url: media.url,
                                        alt: media.alt,
                                        id: media.id
                                    }
                                })}
                                allowedTypes={['image']}
                                value={backgroundImage.id}
                                render={({ open }) => (
                                    <div>
                                        {backgroundImage.url && (
                                            <img
                                                src={backgroundImage.url}
                                                alt={backgroundImage.alt}
                                                style={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    marginBottom: '10px',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        )}
                                        <Button onClick={open} variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                            {backgroundImage.url
                                                ? __('Bild ändern', 'modular-blocks-plugin')
                                                : __('Bild auswählen', 'modular-blocks-plugin')
                                            }
                                        </Button>
                                        {backgroundImage.url && (
                                            <Button
                                                onClick={() => setAttributes({ backgroundImage: { url: '', alt: '', id: null } })}
                                                variant="tertiary"
                                                isDestructive
                                                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                                            >
                                                {__('Bild entfernen', 'modular-blocks-plugin')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            />
                        </MediaUploadCheck>

                        <RangeControl
                            label={__('Höhe (px)', 'modular-blocks-plugin')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            min={200}
                            max={800}
                            step={10}
                        />

                        <TextControl
                            label={__('Titel (optional)', 'modular-blocks-plugin')}
                            value={title}
                            onChange={(value) => setAttributes({ title: value })}
                            placeholder={__('z.B. Interaktive Karte', 'modular-blocks-plugin')}
                        />

                        <TextareaControl
                            label={__('Beschreibung (optional)', 'modular-blocks-plugin')}
                            value={description}
                            onChange={(value) => setAttributes({ description: value })}
                            placeholder={__('Kurze Erklärung für Benutzer...', 'modular-blocks-plugin')}
                            rows={2}
                        />
                    </PanelBody>

                    {/* General Settings Panel */}
                    <PanelBody title={__('Allgemeine Einstellungen', 'modular-blocks-plugin')} initialOpen={false}>
                        <SelectControl
                            label={__('Hotspot-Stil', 'modular-blocks-plugin')}
                            value={hotspotStyle}
                            options={HOTSPOT_STYLE_OPTIONS}
                            onChange={(value) => setAttributes({ hotspotStyle: value })}
                        />

                        <SelectControl
                            label={__('Popup-Stil', 'modular-blocks-plugin')}
                            value={popupStyle}
                            options={POPUP_STYLE_OPTIONS}
                            onChange={(value) => setAttributes({ popupStyle: value })}
                            help={
                                popupStyle === 'tooltip'
                                    ? __('Kleine Info-Box direkt am Hotspot', 'modular-blocks-plugin')
                                    : popupStyle === 'modal'
                                    ? __('Zentriertes Overlay-Fenster', 'modular-blocks-plugin')
                                    : __('Seitliches Panel (rechts)', 'modular-blocks-plugin')
                            }
                        />

                        {popupStyle === 'tooltip' && (
                            <SelectControl
                                label={__('Popup-Position', 'modular-blocks-plugin')}
                                value={popupPosition}
                                options={POPUP_POSITION_OPTIONS}
                                onChange={(value) => setAttributes({ popupPosition: value })}
                            />
                        )}

                        <ToggleControl
                            label={__('Nummern anzeigen', 'modular-blocks-plugin')}
                            checked={showNumbers}
                            onChange={(value) => setAttributes({ showNumbers: value })}
                            help={__('Zeigt Nummern auf den Hotspots', 'modular-blocks-plugin')}
                        />

                        <ToggleControl
                            label={__('Automatisch schließen', 'modular-blocks-plugin')}
                            checked={autoClose}
                            onChange={(value) => setAttributes({ autoClose: value })}
                            help={__('Schließt Popup beim Öffnen eines anderen', 'modular-blocks-plugin')}
                        />

                        <ToggleControl
                            label={__('Bei Außenklick schließen', 'modular-blocks-plugin')}
                            checked={closeOnOutsideClick}
                            onChange={(value) => setAttributes({ closeOnOutsideClick: value })}
                        />
                    </PanelBody>

                    {/* Zoom Settings Panel */}
                    <PanelBody title={__('Zoom-Funktionen', 'modular-blocks-plugin')} initialOpen={false}>
                        <ToggleControl
                            label={__('Zoom aktivieren', 'modular-blocks-plugin')}
                            checked={enableZoom}
                            onChange={(value) => setAttributes({ enableZoom: value })}
                            help={__('Ermöglicht Zoom und Pan im Bild', 'modular-blocks-plugin')}
                        />

                        {enableZoom && (
                            <RangeControl
                                label={__('Max. Zoom-Level (%)', 'modular-blocks-plugin')}
                                value={zoomLevel}
                                onChange={(value) => setAttributes({ zoomLevel: value })}
                                min={100}
                                max={300}
                                step={10}
                            />
                        )}
                    </PanelBody>

                    {/* Hotspots Panel */}
                    <PanelBody
                        title={
                            <span className="hotspots-panel-title">
                                {__('Hotspots', 'modular-blocks-plugin')}
                                <span className="hotspots-count">{hotspots.length}</span>
                            </span>
                        }
                        initialOpen={true}
                    >
                        {hotspots.length === 0 ? (
                            <div className="no-hotspots-notice">
                                {__('Noch keine Hotspots vorhanden. Fügen Sie einen hinzu!', 'modular-blocks-plugin')}
                            </div>
                        ) : (
                            hotspots.map((hotspot, index) => renderHotspotCard(hotspot, index))
                        )}

                        <Button
                            onClick={addHotspot}
                            variant="primary"
                            icon={plus}
                            className="add-hotspot-button"
                        >
                            {__('Hotspot hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                    </PanelBody>
                </InspectorControls>

                {/* Editor Preview */}
                <div className="point-of-interest-editor">
                    {backgroundImage.url ? (
                        <div
                            ref={imageWrapperRef}
                            className="poi-editor-image-wrapper"
                            style={{ minHeight: `${height}px` }}
                        >
                            <img
                                src={backgroundImage.url}
                                alt={backgroundImage.alt}
                                style={{ width: '100%', display: 'block' }}
                            />

                            {/* Render draggable hotspots */}
                            {hotspots.map((hotspot, index) => (
                                <div
                                    key={index}
                                    className={`editor-hotspot ${isDragging && selectedHotspot === index ? 'is-dragging' : ''} ${selectedHotspot === index ? 'is-selected' : ''}`}
                                    style={{
                                        left: `${hotspot.x}%`,
                                        top: `${hotspot.y}%`,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, index)}
                                    onClick={() => {
                                        setSelectedHotspot(index);
                                        setExpandedHotspot(index);
                                    }}
                                >
                                    <div
                                        className="editor-hotspot-marker"
                                        style={{ backgroundColor: hotspot.color }}
                                    >
                                        {showNumbers ? index + 1 : ''}
                                    </div>
                                    <div className="editor-hotspot-label">
                                        {hotspot.title || `Hotspot ${index + 1}`}
                                    </div>
                                </div>
                            ))}

                            {/* Drag instructions */}
                            {hotspots.length > 0 && isSelected && (
                                <div className="drag-instructions">
                                    {__('Hotspots per Drag & Drop verschieben', 'modular-blocks-plugin')}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="poi-editor-placeholder">
                            <p>{__('Wählen Sie ein Hintergrundbild in den Block-Einstellungen', 'modular-blocks-plugin')}</p>
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={(media) => setAttributes({
                                        backgroundImage: {
                                            url: media.url,
                                            alt: media.alt,
                                            id: media.id
                                        }
                                    })}
                                    allowedTypes={['image']}
                                    render={({ open }) => (
                                        <Button onClick={open} variant="primary">
                                            {__('Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </div>
                    )}

                    {/* Editor notice */}
                    {backgroundImage.url && isSelected && (
                        <div className="poi-editor-notice">
                            <strong>{__('Hinweis', 'modular-blocks-plugin')}</strong>
                            {__('Die vollständige Interaktivität (Popups, Zoom, Animationen) ist nur in der Frontend-Ansicht verfügbar. Hotspots können per Drag & Drop positioniert werden.', 'modular-blocks-plugin')}
                        </div>
                    )}
                </div>
            </div>
        );
    },

    save: () => null, // Dynamic block - rendered via render.php
});
