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
            startingPosition,
            showLabels,
            hoverAnimation,
            height,
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
        };

        const blockClasses = [
            className,
            'wp-block-modular-blocks-image-comparison',
            `orientation-${orientation}`,
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
                    </PanelBody>
                </InspectorControls>

                <div className={blockClasses} style={blockStyle}>
                    <div className="image-comparison-container">
                        <div className="image-comparison-before">
                            <img src={beforeImage.url} alt={beforeImage.alt} draggable={false} />
                            {showLabels && beforeLabel && (
                                <div className="image-comparison-label label-before">
                                    {beforeLabel}
                                </div>
                            )}
                        </div>

                        <div className="image-comparison-after">
                            <img src={afterImage.url} alt={afterImage.alt} draggable={false} />
                            {showLabels && afterLabel && (
                                <div className="image-comparison-label label-after">
                                    {afterLabel}
                                </div>
                            )}
                        </div>

                        <div className="image-comparison-slider">
                            <div className="slider-handle">
                                <div className="slider-button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="slider-line"></div>
                        </div>
                    </div>

                    <div className="editor-notice" style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f0f6fc',
                        borderLeft: '4px solid #0073aa',
                        fontSize: '12px',
                        color: '#646970'
                    }}>
                        {__('Vorschau: Der interaktive Slider funktioniert im Frontend. Im Editor wird eine statische Vorschau angezeigt.', 'modular-blocks-plugin')}
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