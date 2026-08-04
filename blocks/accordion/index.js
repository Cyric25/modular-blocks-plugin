/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
    useBlockProps,
    InnerBlocks,
    InspectorControls,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import {
    PanelBody,
    ToggleControl,
    SelectControl,
    Notice,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.css';
import './style.css';

const HEADING_LEVEL_OPTIONS = [2, 3, 4, 5].map((level) => ({
    label: sprintf(__('H%d', 'modular-blocks-plugin'), level),
    value: String(level),
}));

/**
 * Block registration
 */
registerBlockType('modular-blocks/accordion', {
    edit: ({ attributes, setAttributes, clientId }) => {
        const { allowMultiple, openFirst, showNumbering, showExpandAll, headingLevel } = attributes;

        const blockProps = useBlockProps({
            className: showNumbering ? 'mb-accordion is-numbered' : 'mb-accordion',
        });

        // Direkte Kindbloecke ermitteln, um zu erkennen, ob (und wie viele)
        // Ueberschriften der eingestellten Ebene vorhanden sind. Diese Zaehlung
        // ist reine Editor-Hilfe und landet nicht im gespeicherten Markup.
        const innerBlocks = useSelect(
            (select) => select(blockEditorStore).getBlocks(clientId),
            [clientId]
        );

        const rowCount = innerBlocks.filter(
            (block) => block.name === 'core/heading' && block.attributes.level === headingLevel
        ).length;

        const TEMPLATE = [
            [
                'core/heading',
                {
                    level: headingLevel,
                    placeholder: __('Titel der Klappzeile …', 'modular-blocks-plugin'),
                },
            ],
            [
                'core/paragraph',
                { placeholder: __('Inhalt dieser Zeile …', 'modular-blocks-plugin') },
            ],
            [
                'core/heading',
                {
                    level: headingLevel,
                    placeholder: __('Titel der Klappzeile …', 'modular-blocks-plugin'),
                },
            ],
            [
                'core/paragraph',
                { placeholder: __('Inhalt dieser Zeile …', 'modular-blocks-plugin') },
            ],
        ];

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title={__('Accordion-Einstellungen', 'modular-blocks-plugin')}>
                        <SelectControl
                            label={__('Überschriftenebene für Zeilentitel', 'modular-blocks-plugin')}
                            value={String(headingLevel)}
                            options={HEADING_LEVEL_OPTIONS}
                            onChange={(value) => setAttributes({ headingLevel: parseInt(value, 10) })}
                            help={__(
                                'Überschriften dieser Ebene werden im Frontend zu anklickbaren Klappzeilen. Andere Überschriftenebenen bleiben normaler Inhalt.',
                                'modular-blocks-plugin'
                            )}
                        />
                        <ToggleControl
                            label={__('Mehrere Zeilen gleichzeitig offen erlauben', 'modular-blocks-plugin')}
                            checked={allowMultiple}
                            onChange={(value) => setAttributes({ allowMultiple: value })}
                            help={__(
                                'Aus: Das Öffnen einer Zeile schließt die zuvor geöffnete.',
                                'modular-blocks-plugin'
                            )}
                        />
                        <ToggleControl
                            label={__('Erste Zeile beim Laden öffnen', 'modular-blocks-plugin')}
                            checked={openFirst}
                            onChange={(value) => setAttributes({ openFirst: value })}
                        />
                        <ToggleControl
                            label={__('Zeilen nummerieren', 'modular-blocks-plugin')}
                            checked={showNumbering}
                            onChange={(value) => setAttributes({ showNumbering: value })}
                        />
                        <ToggleControl
                            label={__(
                                'Schaltflächen „Alle öffnen / Alle schließen“ anzeigen',
                                'modular-blocks-plugin'
                            )}
                            checked={showExpandAll}
                            onChange={(value) => setAttributes({ showExpandAll: value })}
                            help={__(
                                'Sinnvoll vor allem, wenn mehrere Zeilen gleichzeitig offen sein dürfen.',
                                'modular-blocks-plugin'
                            )}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    {rowCount === 0 ? (
                        <Notice status="warning" isDismissible={false}>
                            {sprintf(
                                __(
                                    'Keine Überschrift der Ebene H%d gefunden. Überschriften dieser Ebene markieren den Beginn einer Klappzeile – ohne eine solche Überschrift öffnet sich im Frontend nichts. Füge eine Überschrift der eingestellten Ebene hinzu, um eine Klappzeile zu erzeugen.',
                                    'modular-blocks-plugin'
                                ),
                                headingLevel
                            )}
                        </Notice>
                    ) : (
                        <p className="mb-accordion-status-count">
                            {sprintf(
                                _n(
                                    '%d Klappzeile erkannt',
                                    '%d Klappzeilen erkannt',
                                    rowCount,
                                    'modular-blocks-plugin'
                                ),
                                rowCount
                            )}
                        </p>
                    )}
                    <InnerBlocks
                        template={TEMPLATE}
                        templateLock={false}
                        orientation="vertical"
                        renderAppender={InnerBlocks.ButtonBlockAppender}
                    />
                </div>
            </Fragment>
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
