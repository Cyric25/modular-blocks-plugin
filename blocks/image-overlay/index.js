/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    MediaUpload,
    MediaUploadCheck,
    RichText,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl,
    RangeControl,
    Button,
    SelectControl,
    Card,
    CardHeader,
    CardBody,
    ColorPicker,
    __experimentalHStack as HStack,
    __experimentalVStack as VStack,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { plus, trash, drag } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Block registration
 */
registerBlockType('modular-blocks/image-overlay', {
    edit: ({ attributes, setAttributes, className }) => {
        const {
            baseImage,
            layers,
            title,
            description,
            height,
            showLabels,
            showDescriptions,
            allowMultipleVisible,
            transitionDuration,
            buttonStyle,
            buttonPosition,
            buttonSize,
            responsiveHeight,
        } = attributes;

        const onSelectBaseImage = (media) => {
            setAttributes({
                baseImage: {
                    url: media.url,
                    alt: media.alt,
                    id: media.id,
                },
            });
        };

        const removeBaseImage = () => {
            setAttributes({
                baseImage: { url: '', alt: 'Basis-Bild', id: null },
            });
        };

        const updateLayer = (index, field, value) => {
            const newLayers = [...layers];
            if (field === 'image') {
                newLayers[index] = {
                    ...newLayers[index],
                    image: value,
                };
            } else {
                newLayers[index] = {
                    ...newLayers[index],
                    [field]: value,
                };
            }
            setAttributes({ layers: newLayers });
        };

        const addLayer = () => {
            const newLayers = [
                ...layers,
                {
                    image: { url: '', alt: '', id: null },
                    label: `Ebene ${layers.length + 1}`,
                    description: `Überlagerungs-Ebene ${layers.length + 1}`,
                    opacity: 100,
                    visible: false,
                    color: '#0073aa',
                },
            ];
            setAttributes({ layers: newLayers });
        };

        const removeLayer = (index) => {
            if (layers.length <= 1) return; // Keep at least one layer
            const newLayers = layers.filter((_, i) => i !== index);
            setAttributes({ layers: newLayers });
        };

        const moveLayer = (fromIndex, toIndex) => {
            const newLayers = [...layers];
            const [movedLayer] = newLayers.splice(fromIndex, 1);
            newLayers.splice(toIndex, 0, movedLayer);
            setAttributes({ layers: newLayers });
        };

        const toggleLayerVisibility = (index) => {
            const newLayers = [...layers];

            if (!allowMultipleVisible && !newLayers[index].visible) {
                // If single visible mode and layer is being activated, hide all others
                newLayers.forEach((layer, i) => {
                    newLayers[i].visible = i === index;
                });
            } else {
                // Toggle the specific layer
                newLayers[index].visible = !newLayers[index].visible;
            }

            setAttributes({ layers: newLayers });
        };

        const blockStyle = {
            '--overlay-height': `${height}px`,
            '--transition-duration': `${transitionDuration}ms`,
        };

        const blockClasses = [
            className,
            'wp-block-modular-blocks-image-overlay',
            'editor-view',
            `button-style-${buttonStyle}`,
            `button-position-${buttonPosition}`,
            `button-size-${buttonSize}`,
            responsiveHeight ? 'responsive-height' : 'fixed-height',
            showLabels ? 'has-labels' : '',
            showDescriptions ? 'has-descriptions' : '',
            allowMultipleVisible ? 'multiple-visible' : 'single-visible',
        ].filter(Boolean).join(' ');

        // Show placeholder if no base image
        if (!baseImage.url) {
            return (
                <Fragment>
                    <InspectorControls>
                        <PanelBody title={__('Basis-Bild', 'modular-blocks-plugin')}>
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectBaseImage}
                                    allowedTypes={['image']}
                                    value={baseImage.id}
                                    render={({ open }) => (
                                        <Button onClick={open} variant="primary" style={{ width: '100%' }}>
                                            {__('Basis-Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </PanelBody>
                    </InspectorControls>

                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        border: '2px dashed #ddd',
                        borderRadius: '8px',
                        background: '#f9f9f9'
                    }}>
                        <h4>{__('Bild-Überlagerung', 'modular-blocks-plugin')}</h4>
                        <p>{__('Laden Sie ein Basis-Bild hoch, um zu beginnen.', 'modular-blocks-plugin')}</p>
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={onSelectBaseImage}
                                allowedTypes={['image']}
                                value={baseImage.id}
                                render={({ open }) => (
                                    <Button onClick={open} variant="primary">
                                        {__('Basis-Bild auswählen', 'modular-blocks-plugin')}
                                    </Button>
                                )}
                            />
                        </MediaUploadCheck>
                    </div>
                </Fragment>
            );
        }

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Basis-Bild', 'modular-blocks-plugin')}>
                        <div style={{ marginBottom: '15px' }}>
                            <img src={baseImage.url} alt={baseImage.alt} style={{ width: '100%', borderRadius: '4px' }} />
                        </div>
                        <HStack>
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectBaseImage}
                                    allowedTypes={['image']}
                                    value={baseImage.id}
                                    render={({ open }) => (
                                        <Button onClick={open} variant="secondary" size="small">
                                            {__('Ändern', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                            <Button onClick={removeBaseImage} variant="tertiary" size="small" isDestructive>
                                {__('Entfernen', 'modular-blocks-plugin')}
                            </Button>
                        </HStack>
                    </PanelBody>

                    <PanelBody title={__('Überlagerungs-Ebenen', 'modular-blocks-plugin')}>
                        {layers.map((layer, index) => (
                            <Card key={index} style={{ marginBottom: '16px' }}>
                                <CardHeader>
                                    <HStack justify="space-between">
                                        <strong>{layer.label || `Ebene ${index + 1}`}</strong>
                                        <HStack>
                                            {layers.length > 1 && (
                                                <Button
                                                    onClick={() => removeLayer(index)}
                                                    icon={trash}
                                                    variant="tertiary"
                                                    size="small"
                                                    isDestructive
                                                    label={__('Ebene entfernen', 'modular-blocks-plugin')}
                                                />
                                            )}
                                        </HStack>
                                    </HStack>
                                </CardHeader>
                                <CardBody>
                                    <VStack spacing="3">
                                        <TextControl
                                            label={__('Ebenen-Name', 'modular-blocks-plugin')}
                                            value={layer.label}
                                            onChange={(value) => updateLayer(index, 'label', value)}
                                        />

                                        <TextControl
                                            label={__('Beschreibung', 'modular-blocks-plugin')}
                                            value={layer.description}
                                            onChange={(value) => updateLayer(index, 'description', value)}
                                        />

                                        {layer.image.url ? (
                                            <div>
                                                <img src={layer.image.url} alt={layer.image.alt} style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                                                <HStack>
                                                    <MediaUploadCheck>
                                                        <MediaUpload
                                                            onSelect={(media) => updateLayer(index, 'image', { url: media.url, alt: media.alt, id: media.id })}
                                                            allowedTypes={['image']}
                                                            value={layer.image.id}
                                                            render={({ open }) => (
                                                                <Button onClick={open} variant="secondary" size="small">
                                                                    {__('Ändern', 'modular-blocks-plugin')}
                                                                </Button>
                                                            )}
                                                        />
                                                    </MediaUploadCheck>
                                                    <Button
                                                        onClick={() => updateLayer(index, 'image', { url: '', alt: '', id: null })}
                                                        variant="tertiary"
                                                        size="small"
                                                        isDestructive
                                                    >
                                                        {__('Entfernen', 'modular-blocks-plugin')}
                                                    </Button>
                                                </HStack>
                                            </div>
                                        ) : (
                                            <MediaUploadCheck>
                                                <MediaUpload
                                                    onSelect={(media) => updateLayer(index, 'image', { url: media.url, alt: media.alt, id: media.id })}
                                                    allowedTypes={['image']}
                                                    value={layer.image.id}
                                                    render={({ open }) => (
                                                        <Button onClick={open} variant="primary" style={{ width: '100%' }}>
                                                            {__('Bild auswählen', 'modular-blocks-plugin')}
                                                        </Button>
                                                    )}
                                                />
                                            </MediaUploadCheck>
                                        )}

                                        <RangeControl
                                            label={__('Transparenz (%)', 'modular-blocks-plugin')}
                                            value={layer.opacity}
                                            onChange={(value) => updateLayer(index, 'opacity', value)}
                                            min={0}
                                            max={100}
                                            step={5}
                                        />

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                                                {__('Ebenen-Farbe', 'modular-blocks-plugin')}
                                            </label>
                                            <ColorPicker
                                                color={layer.color}
                                                onChangeComplete={(color) => updateLayer(index, 'color', color.hex)}
                                            />
                                        </div>

                                        <ToggleControl
                                            label={__('Standardmäßig sichtbar', 'modular-blocks-plugin')}
                                            checked={layer.visible}
                                            onChange={(value) => updateLayer(index, 'visible', value)}
                                        />
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}

                        <Button
                            onClick={addLayer}
                            icon={plus}
                            variant="secondary"
                            disabled={layers.length >= 10} // Maximum 10 layers
                            style={{ width: '100%' }}
                        >
                            {__('Ebene hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                    </PanelBody>

                    <PanelBody title={__('Darstellungs-Einstellungen', 'modular-blocks-plugin')}>
                        <ToggleControl
                            label={__('Responsive Höhe', 'modular-blocks-plugin')}
                            checked={responsiveHeight}
                            onChange={(value) => setAttributes({ responsiveHeight: value })}
                            help={responsiveHeight ?
                                __('Höhe passt sich automatisch an die Bildgröße an.', 'modular-blocks-plugin') :
                                __('Feste Höhe verwenden.', 'modular-blocks-plugin')
                            }
                        />

                        {!responsiveHeight && (
                            <RangeControl
                                label={__('Höhe (px)', 'modular-blocks-plugin')}
                                value={height}
                                onChange={(value) => setAttributes({ height: value })}
                                min={200}
                                max={800}
                                step={10}
                            />
                        )}

                        <SelectControl
                            label={__('Button-Stil', 'modular-blocks-plugin')}
                            value={buttonStyle}
                            onChange={(value) => setAttributes({ buttonStyle: value })}
                            options={[
                                { label: __('Tabs', 'modular-blocks-plugin'), value: 'tabs' },
                                { label: __('Buttons', 'modular-blocks-plugin'), value: 'buttons' },
                                { label: __('Pills', 'modular-blocks-plugin'), value: 'pills' },
                            ]}
                        />

                        <SelectControl
                            label={__('Button-Größe', 'modular-blocks-plugin')}
                            value={buttonSize}
                            onChange={(value) => setAttributes({ buttonSize: value })}
                            options={[
                                { label: __('Klein', 'modular-blocks-plugin'), value: 'small' },
                                { label: __('Mittel', 'modular-blocks-plugin'), value: 'medium' },
                                { label: __('Groß', 'modular-blocks-plugin'), value: 'large' },
                            ]}
                        />

                        <SelectControl
                            label={__('Button-Position', 'modular-blocks-plugin')}
                            value={buttonPosition}
                            onChange={(value) => setAttributes({ buttonPosition: value })}
                            options={[
                                { label: __('Oben', 'modular-blocks-plugin'), value: 'top' },
                                { label: __('Unten', 'modular-blocks-plugin'), value: 'bottom' },
                                { label: __('Links', 'modular-blocks-plugin'), value: 'left' },
                                { label: __('Rechts', 'modular-blocks-plugin'), value: 'right' },
                            ]}
                        />

                        <RangeControl
                            label={__('Übergangs-Geschwindigkeit (ms)', 'modular-blocks-plugin')}
                            value={transitionDuration}
                            onChange={(value) => setAttributes({ transitionDuration: value })}
                            min={0}
                            max={2000}
                            step={50}
                        />
                    </PanelBody>

                    <PanelBody title={__('Verhalten', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Anzeigemodus', 'modular-blocks-plugin')}
                            value={attributes.displayMode || 'overlay'}
                            onChange={(value) => {
                                setAttributes({
                                    displayMode: value,
                                    allowMultipleVisible: value === 'overlay'
                                });
                            }}
                            options={[
                                {
                                    label: __('Übereinander (Overlay)', 'modular-blocks-plugin'),
                                    value: 'overlay'
                                },
                                {
                                    label: __('Abwechselnd (Toggle)', 'modular-blocks-plugin'),
                                    value: 'toggle'
                                },
                            ]}
                            help={attributes.displayMode === 'overlay' ?
                                __('Mehrere Ebenen können gleichzeitig sichtbar sein (für Überlagerungen mit Transparenz).', 'modular-blocks-plugin') :
                                __('Nur eine Ebene ist zur Zeit sichtbar (zum Umschalten zwischen Bildern).', 'modular-blocks-plugin')
                            }
                        />

                        <ToggleControl
                            label={__('Ebenen-Namen anzeigen', 'modular-blocks-plugin')}
                            checked={showLabels}
                            onChange={(value) => setAttributes({ showLabels: value })}
                        />

                        <ToggleControl
                            label={__('Beschreibungen anzeigen', 'modular-blocks-plugin')}
                            checked={showDescriptions}
                            onChange={(value) => setAttributes({ showDescriptions: value })}
                        />
                    </PanelBody>
                </InspectorControls>

                <div className={blockClasses} style={blockStyle}>
                    <div className="image-overlay-container">
                        {/* Title and Description */}
                        <div className="overlay-header">
                            <RichText
                                tagName="h3"
                                className="overlay-title"
                                value={title}
                                onChange={(value) => setAttributes({ title: value })}
                                placeholder={__('Titel eingeben...', 'modular-blocks-plugin')}
                                allowedFormats={['core/bold', 'core/italic']}
                            />

                            <RichText
                                tagName="div"
                                className="overlay-description"
                                value={description}
                                onChange={(value) => setAttributes({ description: value })}
                                placeholder={__('Beschreibung eingeben...', 'modular-blocks-plugin')}
                                allowedFormats={['core/bold', 'core/italic']}
                            />
                        </div>

                        {/* Layer Controls Preview */}
                        {(buttonPosition === 'top' || buttonPosition === 'bottom') && (
                            <div className={`layer-controls controls-${buttonPosition}`}>
                                <div className="control-buttons">
                                    {layers.map((layer, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`layer-button ${layer.visible ? 'active' : ''}`}
                                            style={{ '--layer-color': layer.color }}
                                            onClick={() => toggleLayerVisibility(index)}
                                        >
                                            <span className="button-indicator"></span>
                                            {showLabels && (
                                                <span className="button-label">{layer.label}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Image Preview */}
                        <div className="overlay-viewport">
                            {(buttonPosition === 'left' || buttonPosition === 'right') && (
                                <div className={`layer-controls controls-${buttonPosition}`}>
                                    <div className="control-buttons">
                                        {layers.map((layer, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={`layer-button ${layer.visible ? 'active' : ''}`}
                                                style={{ '--layer-color': layer.color }}
                                                onClick={() => toggleLayerVisibility(index)}
                                            >
                                                <span className="button-indicator"></span>
                                                {showLabels && (
                                                    <span className="button-label">{layer.label}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="image-stack">
                                <div className="base-layer">
                                    <img src={baseImage.url} alt={baseImage.alt} className="base-image" />
                                </div>

                                {layers.map((layer, index) => {
                                    if (!layer.image.url) return null;
                                    return (
                                        <div
                                            key={index}
                                            className={`overlay-layer ${layer.visible ? 'visible' : 'hidden'}`}
                                            style={{ opacity: layer.visible ? (layer.opacity / 100) : 0 }}
                                        >
                                            <img src={layer.image.url} alt={layer.image.alt} className="overlay-image" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Editor Notice */}
                        <div className="editor-notice" style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#f0f6fc',
                            borderLeft: '4px solid #0073aa',
                            fontSize: '12px',
                            color: '#646970'
                        }}>
                            {__('Vorschau: Die vollständige Interaktivität funktioniert im Frontend. Im Editor können Sie die Ebenen durch Klicken umschalten.', 'modular-blocks-plugin')}
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    },

    save: () => {
        // Dynamic block - rendered by PHP
        return null;
    },
});