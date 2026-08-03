/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

const ALLOWED_BLOCKS = ['modular-blocks/accordion-row'];

const TEMPLATE = [
    ['modular-blocks/accordion-row'],
    ['modular-blocks/accordion-row'],
    ['modular-blocks/accordion-row'],
];

/**
 * Block registration
 */
registerBlockType('modular-blocks/accordion', {
    edit: () => {
        const blockProps = useBlockProps({ className: 'mb-accordion' });

        return (
            <div {...blockProps}>
                <InnerBlocks
                    allowedBlocks={ALLOWED_BLOCKS}
                    template={TEMPLATE}
                    templateLock={false}
                    orientation="vertical"
                    renderAppender={InnerBlocks.ButtonBlockAppender}
                />
            </div>
        );
    },

    // Bei dynamischen Bloecken mit InnerBlocks wird das save()-Markup als
    // $block_content an render.php uebergeben. Ein zusaetzlicher Wrapper hier
    // im save() (etwa ueber den save-Aufruf der useBlockProps-Hook) wuerde
    // dort zu doppelten Wrappern fuehren, da render.php selbst einen Wrapper
    // mit get_block_wrapper_attributes() erzeugt. Deshalb gibt save()
    // ausschliesslich InnerBlocks.Content zurueck; das gesamte sichtbare
    // Markup entsteht in render.php.
    save: () => {
        return <InnerBlocks.Content />;
    },

    // Bewusst leer. Sichtbares Markup entsteht in render.php; aendert sich
    // kuenftig das save()-Markup, hier eine Migration ergaenzen.
    deprecated: [],
});
