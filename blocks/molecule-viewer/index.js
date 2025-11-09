import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, RangeControl, ToggleControl, Button, ColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.css';

registerBlockType('modular-blocks/molecule-viewer', {
    edit: ({ attributes, setAttributes }) => {
        const {
            sourceType,
            pdbId,
            structureUrl,
            displayStyle,
            colorScheme,
            backgroundColor,
            width,
            height,
            showControls,
            enableSpin,
            ariaLabel,
            description
        } = attributes;

        const blockProps = useBlockProps({
            className: 'molecule-viewer-editor'
        });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Molekül-Quelle', 'modular-blocks-plugin')} initialOpen={true}>
                        <SelectControl
                            label={__('Quelltyp', 'modular-blocks-plugin')}
                            value={sourceType}
                            options={[
                                { label: 'PDB-Datenbank', value: 'pdb' },
                                { label: 'URL', value: 'url' },
                                { label: 'Upload', value: 'upload' }
                            ]}
                            onChange={(value) => setAttributes({ sourceType: value })}
                        />

                        {sourceType === 'pdb' && (
                            <TextControl
                                label={__('PDB ID', 'modular-blocks-plugin')}
                                value={pdbId}
                                onChange={(value) => setAttributes({ pdbId: value })}
                                help={__('z.B. 1YCR, 4HHB', 'modular-blocks-plugin')}
                            />
                        )}

                        {sourceType === 'url' && (
                            <TextControl
                                label={__('Struktur-URL', 'modular-blocks-plugin')}
                                value={structureUrl}
                                onChange={(value) => setAttributes({ structureUrl: value })}
                                help={__('Direkte URL zu .pdb, .sdf, .mol Datei', 'modular-blocks-plugin')}
                            />
                        )}

                        {sourceType === 'upload' && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const frame = wp.media({
                                        title: __('Molekül-Datei auswählen', 'modular-blocks-plugin'),
                                        multiple: false
                                    });
                                    frame.on('select', () => {
                                        const attachment = frame.state().get('selection').first().toJSON();
                                        setAttributes({ structureUrl: attachment.url });
                                    });
                                    frame.open();
                                }}
                            >
                                {__('Datei hochladen', 'modular-blocks-plugin')}
                            </Button>
                        )}
                    </PanelBody>

                    <PanelBody title={__('Darstellung', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Display-Stil', 'modular-blocks-plugin')}
                            value={displayStyle}
                            options={[
                                { label: 'Stick', value: 'stick' },
                                { label: 'Sphere', value: 'sphere' },
                                { label: 'Cartoon', value: 'cartoon' },
                                { label: 'Line', value: 'line' },
                                { label: 'Surface', value: 'surface' }
                            ]}
                            onChange={(value) => setAttributes({ displayStyle: value })}
                        />

                        <SelectControl
                            label={__('Farbschema', 'modular-blocks-plugin')}
                            value={colorScheme}
                            options={[
                                { label: 'Standard', value: 'default' },
                                { label: 'Carbon', value: 'carbon' },
                                { label: 'Spectrum', value: 'spectrum' },
                                { label: 'Chain', value: 'chain' },
                                { label: 'Secondary Structure', value: 'ss' }
                            ]}
                            onChange={(value) => setAttributes({ colorScheme: value })}
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>
                                {__('Hintergrundfarbe', 'modular-blocks-plugin')}
                            </label>
                            <ColorPicker
                                color={backgroundColor}
                                onChangeComplete={(value) => setAttributes({ backgroundColor: value.hex })}
                            />
                        </div>
                    </PanelBody>

                    <PanelBody title={__('Größe', 'modular-blocks-plugin')}>
                        <RangeControl
                            label={__('Breite (px)', 'modular-blocks-plugin')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                            min={300}
                            max={1200}
                        />

                        <RangeControl
                            label={__('Höhe (px)', 'modular-blocks-plugin')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            min={300}
                            max={1200}
                        />
                    </PanelBody>

                    <PanelBody title={__('Interaktivität', 'modular-blocks-plugin')}>
                        <ToggleControl
                            label={__('Steuerelemente anzeigen', 'modular-blocks-plugin')}
                            checked={showControls}
                            onChange={(value) => setAttributes({ showControls: value })}
                        />

                        <ToggleControl
                            label={__('Auto-Rotation aktivieren', 'modular-blocks-plugin')}
                            checked={enableSpin}
                            onChange={(value) => setAttributes({ enableSpin: value })}
                        />
                    </PanelBody>

                    <PanelBody title={__('Barrierefreiheit', 'modular-blocks-plugin')}>
                        <TextControl
                            label={__('ARIA-Label', 'modular-blocks-plugin')}
                            value={ariaLabel}
                            onChange={(value) => setAttributes({ ariaLabel: value })}
                        />

                        <TextControl
                            label={__('Beschreibung', 'modular-blocks-plugin')}
                            value={description}
                            onChange={(value) => setAttributes({ description: value })}
                            help={__('Für Screen-Reader', 'modular-blocks-plugin')}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <div className="molecule-viewer-placeholder" style={{
                        backgroundColor: backgroundColor,
                        minHeight: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#fff',
                        borderRadius: '8px'
                    }}>
                        <span className="dashicons dashicons-admin-site" style={{ fontSize: '48px', marginBottom: '16px' }}></span>
                        <h3>{__('3D Molekül-Viewer', 'modular-blocks-plugin')}</h3>
                        <p style={{ opacity: 0.8 }}>
                            {sourceType === 'pdb' && pdbId && `PDB: ${pdbId}`}
                            {sourceType === 'url' && structureUrl && `URL: ${structureUrl}`}
                            {sourceType === 'upload' && structureUrl && __('Hochgeladene Datei', 'modular-blocks-plugin')}
                        </p>
                        <p style={{ opacity: 0.6, fontSize: '14px' }}>
                            {__('Stil:', 'modular-blocks-plugin')} {displayStyle} | {__('Farbe:', 'modular-blocks-plugin')} {colorScheme}
                        </p>
                    </div>
                </div>
            </>
        );
    },

    save: ({ attributes }) => {
        const {
            sourceType,
            pdbId,
            structureUrl,
            displayStyle,
            colorScheme,
            backgroundColor,
            width,
            height,
            showControls,
            enableSpin,
            ariaLabel,
            description
        } = attributes;

        const blockProps = useBlockProps.save({
            className: 'chemviz-viewer',
            'data-chemviz-viewer': 'true',
            'data-source-type': sourceType,
            'data-pdb-id': sourceType === 'pdb' ? pdbId : '',
            'data-structure-url': sourceType !== 'pdb' ? structureUrl : '',
            'data-display-style': displayStyle,
            'data-color-scheme': colorScheme,
            'data-background-color': backgroundColor,
            'data-enable-spin': enableSpin,
            'aria-label': ariaLabel
        });

        const aspectRatio = (height / width) * 100;

        return (
            <div {...blockProps}>
                <div className="chemviz-viewer__container" style={{
                    paddingBottom: `${aspectRatio}%`,
                    backgroundColor: backgroundColor
                }}>
                    <div className="chemviz-viewer__canvas" id={`chemviz-${Math.random().toString(36).substr(2, 9)}`}></div>
                </div>

                {showControls && (
                    <div className="chemviz-viewer__controls">
                        <button className="chemviz-viewer__button" data-action="reset">
                            {__('Reset', 'modular-blocks-plugin')}
                        </button>
                        <button className="chemviz-viewer__button" data-action="spin">
                            {enableSpin ? __('Stop', 'modular-blocks-plugin') : __('Drehen', 'modular-blocks-plugin')}
                        </button>
                        <button className="chemviz-viewer__button" data-action="fullscreen">
                            {__('Vollbild', 'modular-blocks-plugin')}
                        </button>
                    </div>
                )}

                {description && (
                    <p className="chemviz-sr-only">{description}</p>
                )}
            </div>
        );
    }
});
