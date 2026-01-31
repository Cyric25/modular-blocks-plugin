import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, TextareaControl, RangeControl, ToggleControl, Button, ColorPicker, ExternalLink, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.css';
import './style.css';

registerBlockType('modular-blocks/molecule-viewer', {
    edit: ({ attributes, setAttributes }) => {
        const {
            sourceType,
            pdbId,
            pubchemQuery,
            pubchemType,
            smilesString,
            alphafoldId,
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

        // Helper to get source description
        const getSourceDescription = () => {
            switch (sourceType) {
                case 'pdb':
                    return pdbId ? `PDB: ${pdbId}` : __('Keine PDB-ID', 'modular-blocks-plugin');
                case 'pubchem':
                    return pubchemQuery ? `PubChem: ${pubchemQuery}` : __('Keine PubChem-Abfrage', 'modular-blocks-plugin');
                case 'smiles':
                    return smilesString ? `SMILES: ${smilesString.substring(0, 30)}${smilesString.length > 30 ? '...' : ''}` : __('Kein SMILES', 'modular-blocks-plugin');
                case 'alphafold':
                    return alphafoldId ? `AlphaFold: ${alphafoldId}` : __('Keine UniProt-ID', 'modular-blocks-plugin');
                case 'url':
                case 'upload':
                    return structureUrl ? __('Datei geladen', 'modular-blocks-plugin') : __('Keine Datei', 'modular-blocks-plugin');
                default:
                    return '';
            }
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Molekül-Quelle', 'modular-blocks-plugin')} initialOpen={true}>
                        <SelectControl
                            label={__('Quelltyp', 'modular-blocks-plugin')}
                            value={sourceType}
                            options={[
                                { label: __('PDB-Datenbank (Proteine, DNA)', 'modular-blocks-plugin'), value: 'pdb' },
                                { label: __('PubChem (kleine Moleküle)', 'modular-blocks-plugin'), value: 'pubchem' },
                                { label: __('SMILES (eigene Struktur)', 'modular-blocks-plugin'), value: 'smiles' },
                                { label: __('AlphaFold (KI-Proteine)', 'modular-blocks-plugin'), value: 'alphafold' },
                                { label: __('URL', 'modular-blocks-plugin'), value: 'url' },
                                { label: __('Datei hochladen', 'modular-blocks-plugin'), value: 'upload' }
                            ]}
                            onChange={(value) => setAttributes({ sourceType: value })}
                        />

                        {/* PDB Source */}
                        {sourceType === 'pdb' && (
                            <>
                                <TextControl
                                    label={__('PDB ID', 'modular-blocks-plugin')}
                                    value={pdbId}
                                    onChange={(value) => setAttributes({ pdbId: value.toUpperCase() })}
                                    placeholder="1YCR, 4HHB, 1BNA"
                                    help={__('4-stellige ID aus der Protein Data Bank', 'modular-blocks-plugin')}
                                />
                                <ExternalLink href="https://www.rcsb.org/" style={{ display: 'block', marginBottom: '16px' }}>
                                    {__('→ PDB-Datenbank durchsuchen', 'modular-blocks-plugin')}
                                </ExternalLink>
                            </>
                        )}

                        {/* PubChem Source */}
                        {sourceType === 'pubchem' && (
                            <>
                                <SelectControl
                                    label={__('Suche nach', 'modular-blocks-plugin')}
                                    value={pubchemType}
                                    options={[
                                        { label: __('Molekülname', 'modular-blocks-plugin'), value: 'name' },
                                        { label: __('PubChem CID', 'modular-blocks-plugin'), value: 'cid' }
                                    ]}
                                    onChange={(value) => setAttributes({ pubchemType: value })}
                                />
                                <TextControl
                                    label={pubchemType === 'name' ? __('Molekülname', 'modular-blocks-plugin') : __('PubChem CID', 'modular-blocks-plugin')}
                                    value={pubchemQuery}
                                    onChange={(value) => setAttributes({ pubchemQuery: value })}
                                    placeholder={pubchemType === 'name' ? 'Aspirin, Glucose, Ethanol' : '2244'}
                                    help={pubchemType === 'name'
                                        ? __('Englischer Molekülname', 'modular-blocks-plugin')
                                        : __('Numerische Compound ID', 'modular-blocks-plugin')
                                    }
                                />
                                <ExternalLink href="https://pubchem.ncbi.nlm.nih.gov/" style={{ display: 'block', marginBottom: '16px' }}>
                                    {__('→ PubChem durchsuchen', 'modular-blocks-plugin')}
                                </ExternalLink>
                            </>
                        )}

                        {/* SMILES Source */}
                        {sourceType === 'smiles' && (
                            <>
                                <TextareaControl
                                    label={__('SMILES-String', 'modular-blocks-plugin')}
                                    value={smilesString}
                                    onChange={(value) => setAttributes({ smilesString: value })}
                                    placeholder="CCO (Ethanol), CC(=O)O (Essigsäure)"
                                    help={__('SMILES-Notation für die Molekülstruktur', 'modular-blocks-plugin')}
                                    rows={3}
                                />
                                <div style={{ marginBottom: '16px' }}>
                                    <ExternalLink href="https://molview.org/" style={{ display: 'block', marginBottom: '8px' }}>
                                        {__('→ MolView: Struktur zeichnen & SMILES kopieren', 'modular-blocks-plugin')}
                                    </ExternalLink>
                                    <Notice status="info" isDismissible={false}>
                                        <strong>{__('Tipp:', 'modular-blocks-plugin')}</strong> {__('In MolView zeichnen → Tools → Information Card → SMILES kopieren', 'modular-blocks-plugin')}
                                    </Notice>
                                </div>
                                <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px' }}>
                                    <strong>{__('Beispiele:', 'modular-blocks-plugin')}</strong><br />
                                    CCO = Ethanol<br />
                                    CC(=O)O = Essigsäure<br />
                                    c1ccccc1 = Benzol<br />
                                    CC(=O)OC1=CC=CC=C1C(=O)O = Aspirin
                                </p>
                            </>
                        )}

                        {/* AlphaFold Source */}
                        {sourceType === 'alphafold' && (
                            <>
                                <TextControl
                                    label={__('UniProt ID', 'modular-blocks-plugin')}
                                    value={alphafoldId}
                                    onChange={(value) => setAttributes({ alphafoldId: value.toUpperCase() })}
                                    placeholder="P00533, P04637, Q9Y6K9"
                                    help={__('UniProt Accession Number für AlphaFold-Struktur', 'modular-blocks-plugin')}
                                />
                                <ExternalLink href="https://alphafold.ebi.ac.uk/" style={{ display: 'block', marginBottom: '8px' }}>
                                    {__('→ AlphaFold Datenbank', 'modular-blocks-plugin')}
                                </ExternalLink>
                                <ExternalLink href="https://www.uniprot.org/" style={{ display: 'block', marginBottom: '16px' }}>
                                    {__('→ UniProt (Protein-IDs finden)', 'modular-blocks-plugin')}
                                </ExternalLink>
                            </>
                        )}

                        {/* URL Source */}
                        {sourceType === 'url' && (
                            <TextControl
                                label={__('Struktur-URL', 'modular-blocks-plugin')}
                                value={structureUrl}
                                onChange={(value) => setAttributes({ structureUrl: value })}
                                placeholder="https://example.com/molecule.pdb"
                                help={__('Direkte URL zu .pdb, .sdf, .mol, .xyz, .cif Datei', 'modular-blocks-plugin')}
                            />
                        )}

                        {/* Upload Source */}
                        {sourceType === 'upload' && (
                            <>
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
                                {structureUrl && (
                                    <p style={{ marginTop: '8px', fontSize: '12px' }}>
                                        {__('Geladen:', 'modular-blocks-plugin')} {structureUrl.split('/').pop()}
                                    </p>
                                )}
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('Darstellung', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Display-Stil', 'modular-blocks-plugin')}
                            value={displayStyle}
                            options={[
                                { label: 'Stick (Stäbchen)', value: 'stick' },
                                { label: 'Sphere (Kugeln)', value: 'sphere' },
                                { label: 'Ball & Stick', value: 'ballstick' },
                                { label: 'Cartoon (Proteine)', value: 'cartoon' },
                                { label: 'Line (Linien)', value: 'line' },
                                { label: 'Surface (Oberfläche)', value: 'surface' }
                            ]}
                            onChange={(value) => setAttributes({ displayStyle: value })}
                            help={__('Cartoon eignet sich für Proteine, Stick/Sphere für kleine Moleküle', 'modular-blocks-plugin')}
                        />

                        <SelectControl
                            label={__('Farbschema', 'modular-blocks-plugin')}
                            value={colorScheme}
                            options={[
                                { label: __('Element (Standard)', 'modular-blocks-plugin'), value: 'default' },
                                { label: __('Carbon (grün)', 'modular-blocks-plugin'), value: 'carbon' },
                                { label: __('Spectrum (Regenbogen)', 'modular-blocks-plugin'), value: 'spectrum' },
                                { label: __('Chain (nach Kette)', 'modular-blocks-plugin'), value: 'chain' },
                                { label: __('Secondary Structure', 'modular-blocks-plugin'), value: 'ss' }
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

                    <PanelBody title={__('Größe', 'modular-blocks-plugin')} initialOpen={false}>
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

                    <PanelBody title={__('Interaktivität', 'modular-blocks-plugin')} initialOpen={false}>
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

                    <PanelBody title={__('Barrierefreiheit', 'modular-blocks-plugin')} initialOpen={false}>
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
                        <p style={{ opacity: 0.8 }}>{getSourceDescription()}</p>
                        <p style={{ opacity: 0.6, fontSize: '14px' }}>
                            {__('Stil:', 'modular-blocks-plugin')} {displayStyle} | {__('Farbe:', 'modular-blocks-plugin')} {colorScheme}
                        </p>
                    </div>
                </div>
            </>
        );
    },

    // Dynamic block - HTML generated by render.php
    save: () => null
});
