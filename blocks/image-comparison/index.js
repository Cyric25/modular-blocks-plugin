/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    MediaUpload,
    MediaUploadCheck,
    BlockControls,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl,
    RangeControl,
    SelectControl,
    Button,
    Placeholder,
    Toolbar,
    ToolbarButton,
    ColorPalette,
    ColorPicker,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Block registration
 */
registerBlockType('modular-blocks/image-comparison', {
    edit: ({ attributes, setAttributes, className }) => {
        const {
            beforeImage,
            afterImage,
            beforeLabel,
            afterLabel,
            orientation,
            displayMode,
            startingPosition,
            showLabels,
            hoverAnimation,
            height,
            sliderColor,
            sliderWidth,
            handleSize,
            animationSpeed,
            labelBackground,
            labelColor,
        } = attributes;

        const onSelectBeforeImage = (media) => {
            setAttributes({
                beforeImage: {
                    url: media.url,
                    alt: media.alt,
                    id: media.id,
                },
            });
        };

        const onSelectAfterImage = (media) => {
            setAttributes({
                afterImage: {
                    url: media.url,
                    alt: media.alt,
                    id: media.id,
                },
            });
        };

        const removeBeforeImage = () => {
            setAttributes({
                beforeImage: { url: '', alt: '', id: null },
            });
        };

        const removeAfterImage = () => {
            setAttributes({
                afterImage: { url: '', alt: '', id: null },
            });
        };

        const blockStyle = {
            '--starting-position': `${startingPosition}%`,
            '--comparison-height': `${height}px`,
            '--slider-color': sliderColor,
            '--slider-width': `${sliderWidth}px`,
            '--slider-handle-size': `${handleSize}px`,
            '--slider-button-size': `${handleSize * 0.67}px`,
            '--label-bg': labelBackground,
            '--label-color': labelColor,
            '--animation-speed': `${animationSpeed}s`,
        };

        const blockClasses = [
            className,
            'wp-block-modular-blocks-image-comparison',
            'is-editor-preview', // Flag to disable animations in editor
            `orientation-${orientation}`,
            `display-mode-${displayMode}`,
            hoverAnimation ? 'has-hover-animation' : '',
            showLabels ? 'has-labels' : '',
        ].filter(Boolean).join(' ');

        // Show placeholder if no images are selected
        if (!beforeImage.url || !afterImage.url) {
            return (
                <Fragment>
                    <InspectorControls>
                        <PanelBody title={__('Bild-Einstellungen', 'modular-blocks-plugin')}>
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectBeforeImage}
                                    allowedTypes={['image']}
                                    value={beforeImage.id}
                                    render={({ open }) => (
                                        <Button
                                            onClick={open}
                                            variant="secondary"
                                            style={{ marginBottom: '10px', width: '100%' }}
                                        >
                                            {beforeImage.url ? __('Vorher-Bild ändern', 'modular-blocks-plugin') : __('Vorher-Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>

                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectAfterImage}
                                    allowedTypes={['image']}
                                    value={afterImage.id}
                                    render={({ open }) => (
                                        <Button
                                            onClick={open}
                                            variant="secondary"
                                            style={{ width: '100%' }}
                                        >
                                            {afterImage.url ? __('Nachher-Bild ändern', 'modular-blocks-plugin') : __('Nachher-Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </PanelBody>
                    </InspectorControls>

                    <Placeholder
                        icon="image-flip-horizontal"
                        label={__('Bild-Vergleich', 'modular-blocks-plugin')}
                        instructions={__('Wählen Sie zwei Bilder aus, um sie zu vergleichen.', 'modular-blocks-plugin')}
                    >
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectBeforeImage}
                                    allowedTypes={['image']}
                                    value={beforeImage.id}
                                    render={({ open }) => (
                                        <Button onClick={open} variant="primary">
                                            {__('Vorher-Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>

                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={onSelectAfterImage}
                                    allowedTypes={['image']}
                                    value={afterImage.id}
                                    render={({ open }) => (
                                        <Button onClick={open} variant="primary">
                                            {__('Nachher-Bild auswählen', 'modular-blocks-plugin')}
                                        </Button>
                                    )}
                                />
                            </MediaUploadCheck>
                        </div>
                    </Placeholder>
                </Fragment>
            );
        }

        // Show simple placeholder in editor instead of preview
        return (
            <Fragment>
                <BlockControls>
                    <Toolbar>
                        <ToolbarButton
                            icon="image-rotate"
                            label={__('Orientierung ändern', 'modular-blocks-plugin')}
                            onClick={() => setAttributes({
                                orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal'
                            })}
                        />
                    </Toolbar>
                </BlockControls>

                <InspectorControls>
                    <PanelBody title={__('Bild-Einstellungen', 'modular-blocks-plugin')}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>{__('Vorher-Bild', 'modular-blocks-plugin')}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <MediaUploadCheck>
                                    <MediaUpload
                                        onSelect={onSelectBeforeImage}
                                        allowedTypes={['image']}
                                        value={beforeImage.id}
                                        render={({ open }) => (
                                            <Button onClick={open} variant="secondary" size="small">
                                                {__('Ändern', 'modular-blocks-plugin')}
                                            </Button>
                                        )}
                                    />
                                </MediaUploadCheck>
                                <Button onClick={removeBeforeImage} variant="tertiary" size="small" isDestructive>
                                    {__('Entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <strong>{__('Nachher-Bild', 'modular-blocks-plugin')}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <MediaUploadCheck>
                                    <MediaUpload
                                        onSelect={onSelectAfterImage}
                                        allowedTypes={['image']}
                                        value={afterImage.id}
                                        render={({ open }) => (
                                            <Button onClick={open} variant="secondary" size="small">
                                                {__('Ändern', 'modular-blocks-plugin')}
                                            </Button>
                                        )}
                                    />
                                </MediaUploadCheck>
                                <Button onClick={removeAfterImage} variant="tertiary" size="small" isDestructive>
                                    {__('Entfernen', 'modular-blocks-plugin')}
                                </Button>
                            </div>
                        </div>
                    </PanelBody>

                    <PanelBody title={__('Vergleichseinstellungen', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Orientierung', 'modular-blocks-plugin')}
                            value={orientation}
                            onChange={(value) => setAttributes({ orientation: value })}
                            options={[
                                { label: __('Horizontal', 'modular-blocks-plugin'), value: 'horizontal' },
                                { label: __('Vertikal', 'modular-blocks-plugin'), value: 'vertical' },
                            ]}
                        />

                        <SelectControl
                            label={__('Anzeigemodus', 'modular-blocks-plugin')}
                            value={displayMode}
                            onChange={(value) => setAttributes({ displayMode: value })}
                            options={[
                                { label: __('Slide (sofortiger Wechsel)', 'modular-blocks-plugin'), value: 'slide' },
                                { label: __('Fade (Überblendung)', 'modular-blocks-plugin'), value: 'fade' },
                                { label: __('Juxtaposition (gleitender Übergang)', 'modular-blocks-plugin'), value: 'juxtaposition' },
                            ]}
                            help={
                                displayMode === 'slide'
                                    ? __('Das Bild springt sofort zur neuen Position ohne Animation.', 'modular-blocks-plugin')
                                    : displayMode === 'fade'
                                    ? __('Das nachher-Bild wird übergeblendet basierend auf der Slider-Position.', 'modular-blocks-plugin')
                                    : __('Das Bild gleitet smooth zur neuen Position mit Animation.', 'modular-blocks-plugin')
                            }
                        />

                        <RangeControl
                            label={__('Startposition (%)', 'modular-blocks-plugin')}
                            value={startingPosition}
                            onChange={(value) => setAttributes({ startingPosition: value })}
                            min={0}
                            max={100}
                            step={1}
                        />

                        <RangeControl
                            label={__('Höhe (px)', 'modular-blocks-plugin')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            min={200}
                            max={800}
                            step={10}
                        />
                    </PanelBody>

                    <PanelBody title={__('Beschriftung & Animation', 'modular-blocks-plugin')}>
                        <ToggleControl
                            label={__('Beschriftungen anzeigen', 'modular-blocks-plugin')}
                            checked={showLabels}
                            onChange={(value) => setAttributes({ showLabels: value })}
                        />

                        {showLabels && (
                            <Fragment>
                                <TextControl
                                    label={__('Vorher-Beschriftung', 'modular-blocks-plugin')}
                                    value={beforeLabel}
                                    onChange={(value) => setAttributes({ beforeLabel: value })}
                                />

                                <TextControl
                                    label={__('Nachher-Beschriftung', 'modular-blocks-plugin')}
                                    value={afterLabel}
                                    onChange={(value) => setAttributes({ afterLabel: value })}
                                />
                            </Fragment>
                        )}

                        <ToggleControl
                            label={__('Hover-Animation', 'modular-blocks-plugin')}
                            checked={hoverAnimation}
                            onChange={(value) => setAttributes({ hoverAnimation: value })}
                        />

                        {hoverAnimation && (
                            <RangeControl
                                label={__('Animationsgeschwindigkeit (Sekunden)', 'modular-blocks-plugin')}
                                value={animationSpeed}
                                onChange={(value) => setAttributes({ animationSpeed: value })}
                                min={0.5}
                                max={5}
                                step={0.5}
                                help={__('Wie schnell die Hover-Animation abläuft', 'modular-blocks-plugin')}
                            />
                        )}
                    </PanelBody>

                    <PanelBody title={__('Slider-Styling', 'modular-blocks-plugin')} initialOpen={false}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>{__('Slider-Farbe', 'modular-blocks-plugin')}</strong>
                            <ColorPalette
                                value={sliderColor}
                                onChange={(color) => setAttributes({ sliderColor: color })}
                                colors={[
                                    { name: 'Blau', color: '#0073aa' },
                                    { name: 'Rot', color: '#dc3232' },
                                    { name: 'Grün', color: '#46b450' },
                                    { name: 'Orange', color: '#f56e28' },
                                    { name: 'Schwarz', color: '#000000' },
                                    { name: 'Weiß', color: '#ffffff' },
                                ]}
                            />
                        </div>

                        <RangeControl
                            label={__('Slider-Dicke (px)', 'modular-blocks-plugin')}
                            value={sliderWidth}
                            onChange={(value) => setAttributes({ sliderWidth: value })}
                            min={1}
                            max={10}
                            step={1}
                        />

                        <RangeControl
                            label={__('Handle-Größe (px)', 'modular-blocks-plugin')}
                            value={handleSize}
                            onChange={(value) => setAttributes({ handleSize: value })}
                            min={24}
                            max={72}
                            step={4}
                        />
                    </PanelBody>

                    <PanelBody title={__('Label-Styling', 'modular-blocks-plugin')} initialOpen={false}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>{__('Label-Hintergrundfarbe', 'modular-blocks-plugin')}</strong>
                            <ColorPicker
                                color={labelBackground}
                                onChangeComplete={(color) => {
                                    const rgba = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                                    setAttributes({ labelBackground: rgba });
                                }}
                                enableAlpha
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <strong>{__('Label-Textfarbe', 'modular-blocks-plugin')}</strong>
                            <ColorPalette
                                value={labelColor}
                                onChange={(color) => setAttributes({ labelColor: color })}
                                colors={[
                                    { name: 'Weiß', color: '#ffffff' },
                                    { name: 'Schwarz', color: '#000000' },
                                    { name: 'Grau', color: '#646970' },
                                ]}
                            />
                        </div>
                    </PanelBody>
                </InspectorControls>

                <Placeholder
                    icon="image-flip-horizontal"
                    label={__('Bild-Vergleich', 'modular-blocks-plugin')}
                >
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <div style={{ fontSize: '48px', opacity: 0.3 }}>
                            🔄
                        </div>
                        <div style={{ fontSize: '14px', color: '#555', maxWidth: '400px' }}>
                            <strong>{__('Bild-Vergleich Block', 'modular-blocks-plugin')}</strong>
                            <p style={{ margin: '10px 0 0 0', fontSize: '12px', lineHeight: '1.5' }}>
                                {__('Vorher-Bild:', 'modular-blocks-plugin')} ✓<br/>
                                {__('Nachher-Bild:', 'modular-blocks-plugin')} ✓<br/>
                                <br/>
                                {__('Anzeigemodus:', 'modular-blocks-plugin')} <strong>{displayMode === 'slide' ? __('Slide (sofort)', 'modular-blocks-plugin') : displayMode === 'fade' ? __('Fade (Überblendung)', 'modular-blocks-plugin') : __('Juxtaposition (gleitend)', 'modular-blocks-plugin')}</strong><br/>
                                {__('Orientierung:', 'modular-blocks-plugin')} <strong>{orientation === 'horizontal' ? __('Horizontal', 'modular-blocks-plugin') : __('Vertikal', 'modular-blocks-plugin')}</strong><br/>
                                {__('Startposition:', 'modular-blocks-plugin')} <strong>{startingPosition}%</strong>
                            </p>
                        </div>
                        <div style={{
                            padding: '10px 15px',
                            backgroundColor: '#0073aa',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}>
                            ℹ️ {__('Nutze die Seitenleiste rechts zum Anpassen', 'modular-blocks-plugin')}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {__('Die Vorschau wird nur im Frontend angezeigt', 'modular-blocks-plugin')}
                        </div>
                    </div>
                </Placeholder>
            </Fragment>
        );
    },

    save: () => {
        // Dynamic block - rendered by PHP
        return null;
    },
});