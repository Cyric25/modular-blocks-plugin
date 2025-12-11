/**
 * Web-App Embed Block - Editor
 */

import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    RangeControl,
    ToggleControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import './editor.css';

registerBlockType('modular-blocks/web-app-embed', {
    edit: ({ attributes, setAttributes }) => {
        const {
            appName,
            height,
            aspectRatio,
            allowFullscreen,
            showBorder,
            borderRadius
        } = attributes;

        const [webApps, setWebApps] = useState([]);
        const [loading, setLoading] = useState(true);

        const blockProps = useBlockProps({
            className: 'wp-block-modular-blocks-web-app-embed-editor'
        });

        // Fetch available web-apps from REST API
        useEffect(() => {
            // For now, we'll use a simple approach - check the web-apps directory
            // In production, you'd want a proper REST endpoint
            setLoading(false);
            // Placeholder - will be populated by PHP
            setWebApps(window.modularBlocksWebApps || []);
        }, []);

        // Get app options for dropdown
        const appOptions = [
            { label: __('-- Web-App auswählen --', 'modular-blocks-plugin'), value: '' },
            ...webApps.map(app => ({
                label: app.name,
                value: app.name
            }))
        ];

        // Get selected app URL
        const selectedApp = webApps.find(app => app.name === appName);
        const appUrl = selectedApp ? selectedApp.url : '';

        return (
            <>
                <InspectorControls>
                    <PanelBody
                        title={__('Web-App Einstellungen', 'modular-blocks-plugin')}
                        initialOpen={true}
                    >
                        <SelectControl
                            label={__('Web-App', 'modular-blocks-plugin')}
                            value={appName}
                            options={appOptions}
                            onChange={(value) => setAttributes({ appName: value })}
                            help={__('Wählen Sie eine hochgeladene Web-App aus', 'modular-blocks-plugin')}
                        />

                        {appName && appUrl && (
                            <p style={{ marginTop: '10px' }}>
                                <a href={appUrl} target="_blank" rel="noopener noreferrer" className="components-button is-link">
                                    {__('Vorschau in neuem Tab', 'modular-blocks-plugin')} ↗
                                </a>
                            </p>
                        )}
                    </PanelBody>

                    <PanelBody
                        title={__('Darstellung', 'modular-blocks-plugin')}
                        initialOpen={true}
                    >
                        <SelectControl
                            label={__('Seitenverhältnis', 'modular-blocks-plugin')}
                            value={aspectRatio}
                            options={[
                                { label: __('Benutzerdefiniert (Höhe)', 'modular-blocks-plugin'), value: 'custom' },
                                { label: __('16:9 (Widescreen)', 'modular-blocks-plugin'), value: '16:9' },
                                { label: __('4:3 (Standard)', 'modular-blocks-plugin'), value: '4:3' },
                                { label: __('1:1 (Quadratisch)', 'modular-blocks-plugin'), value: '1:1' }
                            ]}
                            onChange={(value) => setAttributes({ aspectRatio: value })}
                            help={__('Wählen Sie das Seitenverhältnis für die Web-App', 'modular-blocks-plugin')}
                        />

                        {aspectRatio === 'custom' && (
                            <RangeControl
                                label={__('Höhe (px)', 'modular-blocks-plugin')}
                                value={height}
                                onChange={(value) => setAttributes({ height: value })}
                                min={200}
                                max={2000}
                                step={50}
                            />
                        )}

                        <ToggleControl
                            label={__('Vollbild erlauben', 'modular-blocks-plugin')}
                            checked={allowFullscreen}
                            onChange={(value) => setAttributes({ allowFullscreen: value })}
                            help={__('Fügt einen Vollbild-Button hinzu', 'modular-blocks-plugin')}
                        />

                        <ToggleControl
                            label={__('Rahmen anzeigen', 'modular-blocks-plugin')}
                            checked={showBorder}
                            onChange={(value) => setAttributes({ showBorder: value })}
                        />

                        {showBorder && (
                            <RangeControl
                                label={__('Rahmenradius (px)', 'modular-blocks-plugin')}
                                value={borderRadius}
                                onChange={(value) => setAttributes({ borderRadius: value })}
                                min={0}
                                max={20}
                            />
                        )}
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="webapp-embed-editor-preview">
                        <div className="preview-header">
                            <span className="dashicons dashicons-embed-generic"></span>
                            <h3>{__('Web-App Embed', 'modular-blocks-plugin')}</h3>
                        </div>

                        {!appName ? (
                            <div className="preview-placeholder">
                                <span className="dashicons dashicons-welcome-widgets-menus"></span>
                                <p>{__('Wählen Sie eine Web-App in den Einstellungen aus', 'modular-blocks-plugin')}</p>
                                {webApps.length === 0 && (
                                    <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                                        {__('Keine Web-Apps vorhanden. Laden Sie zuerst eine Web-App hoch unter:', 'modular-blocks-plugin')}<br />
                                        <strong>{__('Einstellungen → Web-Apps', 'modular-blocks-plugin')}</strong>
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="preview-info">
                                <div className="info-item">
                                    <strong>{__('Web-App:', 'modular-blocks-plugin')}</strong>
                                    <span>{appName}</span>
                                </div>

                                <div className="info-item">
                                    <strong>{__('Seitenverhältnis:', 'modular-blocks-plugin')}</strong>
                                    <span>
                                        {aspectRatio === 'custom' ? `${height}px` : aspectRatio}
                                    </span>
                                </div>

                                <div className="info-item">
                                    <strong>{__('Vollbild:', 'modular-blocks-plugin')}</strong>
                                    <span>{allowFullscreen ? '✓' : '✗'}</span>
                                </div>

                                <div className="preview-iframe-container"
                                     style={{
                                         height: aspectRatio === 'custom' ? `${height}px` : 'auto',
                                         paddingBottom: aspectRatio === '16:9' ? '56.25%' : aspectRatio === '4:3' ? '75%' : aspectRatio === '1:1' ? '100%' : '0',
                                         position: aspectRatio !== 'custom' ? 'relative' : 'static'
                                     }}>
                                    {appUrl ? (
                                        <iframe
                                            src={appUrl}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                border: showBorder ? '2px solid #dcdcde' : 'none',
                                                borderRadius: showBorder ? `${borderRadius}px` : '0',
                                                position: aspectRatio !== 'custom' ? 'absolute' : 'static',
                                                top: 0,
                                                left: 0
                                            }}
                                            title={appName}
                                        />
                                    ) : (
                                        <div className="preview-loading">
                                            {__('Lädt...', 'modular-blocks-plugin')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    },

    save: () => {
        // Server-side rendering via render.php
        return null;
    }
});
