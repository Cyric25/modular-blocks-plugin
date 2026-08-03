/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

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
        const { title } = attributes;

        return (
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
