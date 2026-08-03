/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    InnerBlocks,
    RichText,
    InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

/**
 * Normalisiert den Anker-Wert auf den Zeichensatz, den render.php serverseitig
 * ebenfalls durchsetzt: Kleinbuchstaben, Leerzeichen werden zu Bindestrichen,
 * anschließend werden alle Zeichen außer a-z, 0-9, "_" und "-" entfernt.
 * Umlaute werden VOR dieser Bereinigung sinnvoll transkribiert (ä→ae, ö→oe,
 * ü→ue, ß→ss), damit z. B. "Übung" nicht zu "bung" verstümmelt wird.
 *
 * WICHTIG: Diese Funktion muss mit dem PHP-Filter in render.php
 * (`preg_replace('/[^A-Za-z0-9_-]/', '', ...)`) denselben Zeichensatz liefern.
 */
const normalizeRowAnchor = ( value ) => {
    return value
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/ß/g, 'ss')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '');
};

/**
 * Block registration
 *
 * "accordion-row" ist der Kind-Block einer einzelnen Accordion-Zeile.
 * Er ist über block.json ("parent") fest an "modular-blocks/accordion"
 * gebunden und kann nicht eigenständig eingefügt werden.
 */
registerBlockType('modular-blocks/accordion-row', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps({ className: 'mb-accordion-row' });
        const { title, rowAnchor } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={ __('Zeilen-Einstellungen', 'modular-blocks-plugin') }>
                        <TextControl
                            label={ __('Anker für Direktlinks', 'modular-blocks-plugin') }
                            help={ __('Optional. Erlaubt sind Buchstaben, Zahlen, Bindestrich und Unterstrich. Die Zeile ist dann per #anker direkt aufrufbar und öffnet sich beim Aufruf automatisch.', 'modular-blocks-plugin') }
                            value={ rowAnchor }
                            onChange={ ( newAnchor ) => setAttributes({ rowAnchor: normalizeRowAnchor( newAnchor ) }) }
                        />
                    </PanelBody>
                </InspectorControls>
                <div { ...blockProps }>
                    <div className="mb-accordion-row__header">
                        <RichText
                            tagName="span"
                            className="mb-accordion-row__title-input"
                            value={ title }
                            onChange={ ( newTitle ) => setAttributes({ title: newTitle }) }
                            placeholder={ __('Titel der Zeile …', 'modular-blocks-plugin') }
                            allowedFormats={ ['core/bold', 'core/italic'] }
                        />
                    </div>
                    <div className="mb-accordion-row__panel">
                        <InnerBlocks templateLock={ false } />
                    </div>
                </div>
            </Fragment>
        );
    },

    // save() gibt bewusst NUR InnerBlocks.Content zurück, OHNE eigenen Wrapper:
    // Dieser Block ist ein dynamischer Block (render.php rendert das Frontend-Markup).
    // Das save()-Ergebnis wird von WordPress lediglich als $block_content an render.php
    // übergeben. Ein zusätzlicher Block-Props-Wrapper (wie ihn useBlockProps im
    // save-Pfad erzeugen würde) hätte hier zu doppelt verschachtelten Wrappern geführt
    // und den HTML-Anker (id) auf ein Element gelegt, das render.php nicht kontrolliert.
    // Der Titel wird hier NICHT ausgegeben – er lebt ausschließlich als Attribut und
    // wird serverseitig in render.php gerendert.
    save: () => {
        return <InnerBlocks.Content />;
    },

    // Bewusst leer. Sichtbares Markup entsteht in render.php; ändert sich künftig das
    // save()-Markup, hier eine Migration ergänzen.
    deprecated: [],
});
