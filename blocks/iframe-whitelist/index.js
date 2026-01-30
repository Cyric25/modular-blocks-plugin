/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    SelectControl,
    RangeControl,
    ToggleControl,
    Button,
    Notice,
    Placeholder,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Build whitelist options for SelectControl
 */
const buildWhitelistOptions = (whitelist) => {
    const options = [
        { value: '', label: __('-- URL auswählen --', 'modular-blocks-plugin') }
    ];

    whitelist.forEach(entry => {
        options.push({
            value: entry.value,
            label: `${entry.name} (${entry.type === 'domain' ? __('Domain', 'modular-blocks-plugin') : __('Exakt', 'modular-blocks-plugin')})`
        });
    });

    return options;
};

/**
 * Validate URL against whitelist
 */
const validateUrl = (url, whitelist) => {
    if (!url) {
        return { valid: false, entry: null };
    }

    for (const entry of whitelist) {
        if (entry.type === 'domain') {
            if (url.indexOf(entry.value) === 0) {
                return { valid: true, entry };
            }
        } else {
            // Exact match
            const normalizedUrl = url.replace(/\/$/, '');
            const normalizedEntry = entry.value.replace(/\/$/, '');
            if (normalizedUrl === normalizedEntry || normalizedUrl.indexOf(normalizedEntry + '/') === 0) {
                return { valid: true, entry };
            }
        }
    }

    return { valid: false, entry: null };
};

/**
 * Calculate aspect ratio padding
 */
const getAspectRatioPadding = (aspectRatio) => {
    switch (aspectRatio) {
        case '16:9':
            return '56.25%';
        case '4:3':
            return '75%';
        case '1:1':
            return '100%';
        default:
            return null;
    }
};

/**
 * Block registration
 */
registerBlockType('modular-blocks/iframe-whitelist', {
    edit: ({ attributes, setAttributes }) => {
        const {
            url,
            height,
            aspectRatio,
            allowFullscreen,
            showBorder,
            borderRadius,
            title,
        } = attributes;

        const blockProps = useBlockProps();

        // Get whitelist from localized data
        const whitelist = (typeof window.modularBlocksIframeWhitelist !== 'undefined' &&
            window.modularBlocksIframeWhitelist.whitelist) || [];

        // State for manual URL input
        const [manualUrl, setManualUrl] = useState('');
        const [inputMode, setInputMode] = useState('dropdown'); // 'dropdown' or 'manual'
        const [validationResult, setValidationResult] = useState(null);

        // Sync manual URL when switching modes
        useEffect(() => {
            if (inputMode === 'manual') {
                setManualUrl(url);
            }
        }, [inputMode]);

        // Validate manual URL on change
        useEffect(() => {
            if (inputMode === 'manual' && manualUrl) {
                const result = validateUrl(manualUrl, whitelist);
                setValidationResult(result);
            } else {
                setValidationResult(null);
            }
        }, [manualUrl, inputMode, whitelist]);

        // Handle URL selection from dropdown
        const handleUrlChange = (newUrl) => {
            setAttributes({ url: newUrl });
            setValidationResult(null);
        };

        // Handle applying manual URL
        const applyManualUrl = () => {
            if (validationResult && validationResult.valid) {
                setAttributes({ url: manualUrl });
            }
        };

        // Build preview styles
        const previewStyle = {
            borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
            overflow: borderRadius > 0 ? 'hidden' : undefined,
        };

        const paddingBottom = getAspectRatioPadding(aspectRatio);
        if (paddingBottom) {
            previewStyle.paddingBottom = paddingBottom;
            previewStyle.position = 'relative';
        }

        const isWhitelistEmpty = whitelist.length === 0;

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('URL-Einstellungen', 'modular-blocks-plugin')}>
                        {isWhitelistEmpty ? (
                            <Notice status="warning" isDismissible={false}>
                                {__('Die Whitelist ist leer. Bitte fügen Sie zuerst URLs in den Plugin-Einstellungen hinzu.', 'modular-blocks-plugin')}
                            </Notice>
                        ) : (
                            <>
                                <div className="iframe-whitelist-input-mode">
                                    <Button
                                        variant={inputMode === 'dropdown' ? 'primary' : 'secondary'}
                                        onClick={() => setInputMode('dropdown')}
                                        isSmall
                                    >
                                        {__('Auswählen', 'modular-blocks-plugin')}
                                    </Button>
                                    <Button
                                        variant={inputMode === 'manual' ? 'primary' : 'secondary'}
                                        onClick={() => setInputMode('manual')}
                                        isSmall
                                    >
                                        {__('Eingeben', 'modular-blocks-plugin')}
                                    </Button>
                                </div>

                                {inputMode === 'dropdown' ? (
                                    <SelectControl
                                        label={__('Whitelist-URL', 'modular-blocks-plugin')}
                                        value={url}
                                        options={buildWhitelistOptions(whitelist)}
                                        onChange={handleUrlChange}
                                    />
                                ) : (
                                    <>
                                        <TextControl
                                            label={__('URL eingeben', 'modular-blocks-plugin')}
                                            value={manualUrl}
                                            onChange={setManualUrl}
                                            placeholder="https://example.com/app"
                                            help={__('URL muss mit einem Whitelist-Eintrag übereinstimmen.', 'modular-blocks-plugin')}
                                        />
                                        {validationResult && (
                                            <Notice
                                                status={validationResult.valid ? 'success' : 'error'}
                                                isDismissible={false}
                                            >
                                                {validationResult.valid
                                                    ? __('URL ist gültig: ', 'modular-blocks-plugin') + validationResult.entry.name
                                                    : __('URL nicht in der Whitelist gefunden.', 'modular-blocks-plugin')
                                                }
                                            </Notice>
                                        )}
                                        <Button
                                            variant="primary"
                                            onClick={applyManualUrl}
                                            disabled={!validationResult || !validationResult.valid}
                                        >
                                            {__('URL übernehmen', 'modular-blocks-plugin')}
                                        </Button>
                                    </>
                                )}
                            </>
                        )}

                        <TextControl
                            label={__('Titel (Barrierefreiheit)', 'modular-blocks-plugin')}
                            value={title}
                            onChange={(newTitle) => setAttributes({ title: newTitle })}
                            placeholder={__('Beschreibung des Inhalts', 'modular-blocks-plugin')}
                            help={__('Wird als title-Attribut für Screenreader verwendet.', 'modular-blocks-plugin')}
                        />
                    </PanelBody>

                    <PanelBody title={__('Darstellung', 'modular-blocks-plugin')} initialOpen={true}>
                        <SelectControl
                            label={__('Seitenverhältnis', 'modular-blocks-plugin')}
                            value={aspectRatio}
                            options={[
                                { value: 'custom', label: __('Benutzerdefinierte Höhe', 'modular-blocks-plugin') },
                                { value: '16:9', label: '16:9 (Breitbild)' },
                                { value: '4:3', label: '4:3 (Standard)' },
                                { value: '1:1', label: '1:1 (Quadrat)' },
                            ]}
                            onChange={(newRatio) => setAttributes({ aspectRatio: newRatio })}
                        />

                        {aspectRatio === 'custom' && (
                            <RangeControl
                                label={__('Höhe (px)', 'modular-blocks-plugin')}
                                value={height}
                                onChange={(newHeight) => setAttributes({ height: newHeight })}
                                min={200}
                                max={1200}
                                step={10}
                            />
                        )}

                        <ToggleControl
                            label={__('Rahmen anzeigen', 'modular-blocks-plugin')}
                            checked={showBorder}
                            onChange={(newValue) => setAttributes({ showBorder: newValue })}
                        />

                        <RangeControl
                            label={__('Eckenradius (px)', 'modular-blocks-plugin')}
                            value={borderRadius}
                            onChange={(newRadius) => setAttributes({ borderRadius: newRadius })}
                            min={0}
                            max={24}
                        />
                    </PanelBody>

                    <PanelBody title={__('Funktionen', 'modular-blocks-plugin')} initialOpen={false}>
                        <ToggleControl
                            label={__('Vollbild erlauben', 'modular-blocks-plugin')}
                            checked={allowFullscreen}
                            onChange={(newValue) => setAttributes({ allowFullscreen: newValue })}
                            help={__('Zeigt einen Vollbild-Button an.', 'modular-blocks-plugin')}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    {isWhitelistEmpty ? (
                        <Placeholder
                            icon="shield-alt"
                            label={__('Iframe Whitelist', 'modular-blocks-plugin')}
                            instructions={__('Die Whitelist ist leer. Bitte konfigurieren Sie zuerst erlaubte URLs in den Plugin-Einstellungen unter "Modulare Blöcke → Iframe Whitelist".', 'modular-blocks-plugin')}
                        >
                            <Button
                                variant="primary"
                                href={window.ajaxurl?.replace('admin-ajax.php', 'admin.php?page=modular-blocks-iframe-whitelist')}
                            >
                                {__('Whitelist konfigurieren', 'modular-blocks-plugin')}
                            </Button>
                        </Placeholder>
                    ) : url ? (
                        <div
                            className={`iframe-whitelist-preview ${showBorder ? 'has-border' : ''}`}
                            style={previewStyle}
                        >
                            <div className="iframe-whitelist-overlay">
                                <span className="dashicons dashicons-shield-alt"></span>
                                <p>{__('Iframe-Vorschau', 'modular-blocks-plugin')}</p>
                                <code>{url}</code>
                                {title && <small>{title}</small>}
                            </div>
                            {aspectRatio === 'custom' && (
                                <div className="iframe-whitelist-height-indicator">
                                    {height}px
                                </div>
                            )}
                        </div>
                    ) : (
                        <Placeholder
                            icon="shield-alt"
                            label={__('Iframe Whitelist', 'modular-blocks-plugin')}
                            instructions={__('Wählen Sie eine URL aus der Whitelist aus oder geben Sie eine passende URL ein.', 'modular-blocks-plugin')}
                        >
                            <SelectControl
                                value={url}
                                options={buildWhitelistOptions(whitelist)}
                                onChange={handleUrlChange}
                            />
                        </Placeholder>
                    )}
                </div>
            </>
        );
    },

    save: () => null, // Dynamic rendering via PHP
});
