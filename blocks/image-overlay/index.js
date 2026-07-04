import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { InspectorControls, MediaUpload, MediaUploadCheck, RichText } from '@wordpress/block-editor';
import {
    PanelBody, Button, RangeControl, ToggleControl, SelectControl,
    TextControl, ColorPicker, Card, CardHeader, CardBody,
    __experimentalHStack as HStack,
    __experimentalVStack as VStack,
    ColorPalette
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/primitives';

const deleteIcon = (
    <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <Path fillRule="evenodd" clipRule="evenodd" d="M12 5.5A2.25 2.25 0 0 0 9.878 7h4.244A2.251 2.251 0 0 0 12 5.5ZM12 4a3.751 3.751 0 0 0-3.675 3H5v1.5h1.27l.818 8.997a2.75 2.75 0 0 0 2.739 2.501h4.347a2.75 2.75 0 0 0 2.738-2.5L17.73 8.5H19V7h-3.325A3.751 3.751 0 0 0 12 4Zm4.224 4.5H7.776l.806 8.861a1.25 1.25 0 0 0 1.245 1.137h4.347a1.25 1.25 0 0 0 1.245-1.137l.805-8.861Z" />
    </SVG>
);

const plusIcon = (
    <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <Path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" />
    </SVG>
);

registerBlockType('modular-blocks/image-overlay', {
    edit: ({ attributes, setAttributes, className }) => {
        const {
            baseImage, layers, title, description, height,
            showLabels, showDescriptions, allowMultipleVisible,
            displayMode, transitionDuration, buttonStyle,
            buttonPosition, buttonSize, responsiveHeight,
            backgroundColor
        } = attributes;

        const onSelectBaseImage = (media) => {
            setAttributes({
                baseImage: { url: media.url, alt: media.alt, id: media.id }
            });
        };

        const updateLayer = (index, key, value) => {
            const newLayers = [...layers];
            if (key === 'image') {
                newLayers[index] = { ...newLayers[index], image: value };
            } else {
                newLayers[index] = { ...newLayers[index], [key]: value };
            }
            setAttributes({ layers: newLayers });
        };

        const toggleLayerVisibility = (index) => {
            const newLayers = [...layers];
            if (allowMultipleVisible || newLayers[index].visible) {
                newLayers[index].visible = !newLayers[index].visible;
            } else {
                newLayers.forEach((layer, i) => {
                    newLayers[i].visible = i === index;
                });
            }
            setAttributes({ layers: newLayers });
        };

        const removeLayer = (index) => {
            if (layers.length <= 1) return;
            const newLayers = layers.filter((_, i) => i !== index);
            setAttributes({ layers: newLayers });
        };

        const addLayer = () => {
            const newLayers = [...layers, {
                image: { url: '', alt: '', id: null },
                label: `Ebene ${layers.length + 1}`,
                description: `Überlagerungs-Ebene ${layers.length + 1}`,
                opacity: 100,
                visible: false,
                color: '#0073aa'
            }];
            setAttributes({ layers: newLayers });
        };

        const inlineStyles = {
            '--overlay-height': `${height}px`,
            '--transition-duration': `${transitionDuration}ms`
        };

        const hasBaseImage = !!baseImage.url;

        const cssClasses = [
            className,
            'wp-block-modular-blocks-image-overlay',
            'editor-view',
            `button-style-${buttonStyle}`,
            `button-position-${buttonPosition}`,
            `button-size-${buttonSize}`,
            `display-mode-${displayMode || 'overlay'}`,
            responsiveHeight ? 'responsive-height' : 'fixed-height',
            !hasBaseImage ? 'no-base-image' : '',
            showLabels ? 'has-labels' : '',
            showDescriptions ? 'has-descriptions' : '',
            allowMultipleVisible ? 'multiple-visible' : 'single-visible'
        ].filter(Boolean).join(' ');

        const bgColors = [
            { name: __('Weiß', 'modular-blocks-plugin'), color: '#ffffff' },
            { name: __('Hellgrau', 'modular-blocks-plugin'), color: '#f0f0f0' },
            { name: __('Grau', 'modular-blocks-plugin'), color: '#cccccc' },
            { name: __('Dunkelgrau', 'modular-blocks-plugin'), color: '#333333' },
            { name: __('Schwarz', 'modular-blocks-plugin'), color: '#000000' },
            { name: __('Transparent', 'modular-blocks-plugin'), color: 'transparent' },
        ];

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Verhalten', 'modular-blocks-plugin')} initialOpen={true}>
                        <SelectControl
                            label={__('Anzeigemodus', 'modular-blocks-plugin')}
                            value={attributes.displayMode || 'overlay'}
                            onChange={(val) => {
                                setAttributes({
                                    displayMode: val,
                                    allowMultipleVisible: val === 'overlay'
                                });
                            }}
                            options={[
                                { label: __('Übereinander (Overlay)', 'modular-blocks-plugin'), value: 'overlay' },
                                { label: __('Abwechselnd (Toggle)', 'modular-blocks-plugin'), value: 'toggle' },
                            ]}
                            help={attributes.displayMode === 'overlay'
                                ? __('Mehrere Ebenen können gleichzeitig sichtbar sein (für Überlagerungen mit Transparenz).', 'modular-blocks-plugin')
                                : __('Nur eine Ebene ist zur Zeit sichtbar (zum Umschalten zwischen Bildern).', 'modular-blocks-plugin')
                            }
                        />
                        <ToggleControl
                            label={__('Ebenen-Namen anzeigen', 'modular-blocks-plugin')}
                            checked={showLabels}
                            onChange={(val) => setAttributes({ showLabels: val })}
                        />
                        <ToggleControl
                            label={__('Beschreibungen anzeigen', 'modular-blocks-plugin')}
                            checked={showDescriptions}
                            onChange={(val) => setAttributes({ showDescriptions: val })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Darstellungs-Einstellungen', 'modular-blocks-plugin')}>
                        <ToggleControl
                            label={__('Responsive Höhe', 'modular-blocks-plugin')}
                            checked={responsiveHeight}
                            onChange={(val) => setAttributes({ responsiveHeight: val })}
                            help={responsiveHeight
                                ? __('Höhe passt sich automatisch an die Bildgröße an.', 'modular-blocks-plugin')
                                : __('Feste Höhe verwenden.', 'modular-blocks-plugin')
                            }
                        />
                        {!responsiveHeight && (
                            <RangeControl
                                label={__('Höhe (px)', 'modular-blocks-plugin')}
                                value={height}
                                onChange={(val) => setAttributes({ height: val })}
                                min={200}
                                max={800}
                                step={10}
                            />
                        )}

                        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                                {__('Hintergrundfarbe', 'modular-blocks-plugin')}
                            </label>
                            <p style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>
                                {__('Für Bilder mit transparentem Hintergrund (PNG).', 'modular-blocks-plugin')}
                            </p>
                            <ColorPalette
                                colors={bgColors}
                                value={backgroundColor || ''}
                                onChange={(val) => setAttributes({ backgroundColor: val || '' })}
                                clearable={true}
                            />
                        </div>

                        <SelectControl
                            label={__('Button-Stil', 'modular-blocks-plugin')}
                            value={buttonStyle}
                            onChange={(val) => setAttributes({ buttonStyle: val })}
                            options={[
                                { label: __('Tabs', 'modular-blocks-plugin'), value: 'tabs' },
                                { label: __('Buttons', 'modular-blocks-plugin'), value: 'buttons' },
                                { label: __('Pills', 'modular-blocks-plugin'), value: 'pills' },
                            ]}
                        />
                        <SelectControl
                            label={__('Button-Größe', 'modular-blocks-plugin')}
                            value={buttonSize}
                            onChange={(val) => setAttributes({ buttonSize: val })}
                            options={[
                                { label: __('Klein', 'modular-blocks-plugin'), value: 'small' },
                                { label: __('Mittel', 'modular-blocks-plugin'), value: 'medium' },
                                { label: __('Groß', 'modular-blocks-plugin'), value: 'large' },
                            ]}
                        />
                        <SelectControl
                            label={__('Button-Position', 'modular-blocks-plugin')}
                            value={buttonPosition}
                            onChange={(val) => setAttributes({ buttonPosition: val })}
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
                            onChange={(val) => setAttributes({ transitionDuration: val })}
                            min={0}
                            max={2000}
                            step={50}
                        />
                    </PanelBody>

                    <PanelBody title={__('Basis-Bild (optional)', 'modular-blocks-plugin')}>
                        {hasBaseImage ? (
                            <>
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
                                    <Button
                                        onClick={() => setAttributes({ baseImage: { url: '', alt: 'Basis-Bild', id: null } })}
                                        variant="tertiary"
                                        size="small"
                                        isDestructive
                                    >
                                        {__('Entfernen', 'modular-blocks-plugin')}
                                    </Button>
                                </HStack>
                            </>
                        ) : (
                            <>
                                <p style={{ fontSize: '12px', color: '#757575', marginBottom: '8px' }}>
                                    {__('Kein Basis-Bild gesetzt. Hintergrund ist weiß.', 'modular-blocks-plugin')}
                                </p>
                                <MediaUploadCheck>
                                    <MediaUpload
                                        onSelect={onSelectBaseImage}
                                        allowedTypes={['image']}
                                        value={baseImage.id}
                                        render={({ open }) => (
                                            <Button onClick={open} variant="secondary" style={{ width: '100%' }}>
                                                {__('Basis-Bild auswählen', 'modular-blocks-plugin')}
                                            </Button>
                                        )}
                                    />
                                </MediaUploadCheck>
                            </>
                        )}
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
                                                    icon={deleteIcon}
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
                                            onChange={(val) => updateLayer(index, 'label', val)}
                                        />
                                        <TextControl
                                            label={__('Beschreibung', 'modular-blocks-plugin')}
                                            value={layer.description}
                                            onChange={(val) => updateLayer(index, 'description', val)}
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
                                            onChange={(val) => updateLayer(index, 'opacity', val)}
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
                                            onChange={(val) => updateLayer(index, 'visible', val)}
                                        />
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                        <Button
                            onClick={addLayer}
                            icon={plusIcon}
                            variant="secondary"
                            disabled={layers.length >= 10}
                            style={{ width: '100%' }}
                        >
                            {__('Ebene hinzufügen', 'modular-blocks-plugin')}
                        </Button>
                    </PanelBody>

                </InspectorControls>

                <div className={cssClasses} style={inlineStyles}>
                    <div className="image-overlay-container">
                        <div className="overlay-header">
                            <RichText
                                tagName="h3"
                                className="overlay-title"
                                value={title}
                                onChange={(val) => setAttributes({ title: val })}
                                placeholder={__('Titel eingeben...', 'modular-blocks-plugin')}
                                allowedFormats={['core/bold', 'core/italic']}
                            />
                            <RichText
                                tagName="div"
                                className="overlay-description"
                                value={description}
                                onChange={(val) => setAttributes({ description: val })}
                                placeholder={__('Beschreibung eingeben...', 'modular-blocks-plugin')}
                                allowedFormats={['core/bold', 'core/italic']}
                            />
                        </div>

                        {(buttonPosition === 'top' || buttonPosition === 'bottom') && (
                            <div className={`layer-controls controls-${buttonPosition}`}>
                                <div className="control-buttons">
                                    {layers.map((layer, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={'layer-button ' + (layer.visible ? 'active' : '')}
                                            onClick={() => toggleLayerVisibility(index)}
                                        >
                                            <span className="button-indicator"></span>
                                            {showLabels && <span className="button-label">{layer.label}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="overlay-viewport">
                            {(buttonPosition === 'left' || buttonPosition === 'right') && (
                                <div className={`layer-controls controls-${buttonPosition}`}>
                                    <div className="control-buttons">
                                        {layers.map((layer, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={'layer-button ' + (layer.visible ? 'active' : '')}
                                                onClick={() => toggleLayerVisibility(index)}
                                            >
                                                <span className="button-indicator"></span>
                                                {showLabels && <span className="button-label">{layer.label}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="image-stack" style={{ backgroundColor: backgroundColor || (!hasBaseImage ? '#ffffff' : undefined) }}>
                                {hasBaseImage && (
                                    <div className="base-layer">
                                        <img src={baseImage.url} alt={baseImage.alt} className="base-image" />
                                    </div>
                                )}
                                {layers.map((layer, index) =>
                                    layer.image.url ? (
                                        <div
                                            key={index}
                                            className={'overlay-layer ' + (layer.visible ? 'visible' : 'hidden')}
                                            style={{ opacity: layer.visible ? layer.opacity / 100 : 0 }}
                                        >
                                            <img src={layer.image.url} alt={layer.image.alt} className="overlay-image" />
                                        </div>
                                    ) : null
                                )}
                            </div>
                        </div>

                        <div className="editor-notice" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f6fc', borderLeft: '4px solid #0073aa', fontSize: '12px', color: '#646970' }}>
                            {__('Vorschau: Die vollständige Interaktivität funktioniert im Frontend. Im Editor können Sie die Ebenen durch Klicken umschalten.', 'modular-blocks-plugin')}
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    },

    save: () => null
});
