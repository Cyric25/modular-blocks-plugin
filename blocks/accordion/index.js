/**
 * WordPress dependencies
 */
import { registerBlockType, createBlock } from '@wordpress/blocks';
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
    Button,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';

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

        const { insertBlocks, updateBlockAttributes } = useDispatch(blockEditorStore);

        // Legt am Ende der Innenbloecke eine vollstaendige neue Klappzeile an:
        // Ueberschrift mit der aktuell eingestellten Ebene + leerer Absatz.
        // insertBlocks selektiert automatisch den ersten eingefuegten Block
        // (die Ueberschrift), der Redakteur kann also sofort tippen.
        const addRow = () => {
            const heading = createBlock('core/heading', { level: headingLevel });
            const paragraph = createBlock('core/paragraph', {});
            insertBlocks([heading, paragraph], innerBlocks.length, clientId);
        };

        // Beim Wechsel der Ueberschriftenebene sollen bestehende Zeilen nicht
        // verloren gehen: Alle Ueberschriften der BISHERIGEN Zeilen-Ebene
        // werden auf die neue Ebene umgeschrieben, bevor das Attribut selbst
        // gesetzt wird (sonst waere die alte Ebene beim Sammeln schon weg).
        // Ueberschriften anderer Ebenen (z. B. eine H4-Zwischenueberschrift
        // innerhalb einer H3-Zeile) sind bewusst normaler Inhalt und bleiben
        // unangetastet.
        const changeHeadingLevel = (value) => {
            const nextLevel = parseInt(value, 10);

            if (nextLevel === headingLevel) {
                return;
            }

            const rowHeadingIds = innerBlocks
                .filter(
                    (block) => block.name === 'core/heading' && block.attributes.level === headingLevel
                )
                .map((block) => block.clientId);

            if (rowHeadingIds.length > 0) {
                updateBlockAttributes(rowHeadingIds, { level: nextLevel });
            }

            setAttributes({ headingLevel: nextLevel });
        };

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
                            onChange={changeHeadingLevel}
                            help={__(
                                'Überschriften dieser Ebene werden im Frontend zu anklickbaren Klappzeilen. Andere Überschriftenebenen bleiben normaler Inhalt. Beim Ändern werden bestehende Zeilen-Überschriften automatisch auf die neue Ebene umgestellt, damit keine Zeile verloren geht.',
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
                                    'Keine Überschrift der Ebene H%d gefunden. Überschriften dieser Ebene markieren den Beginn einer Klappzeile – ohne eine solche Überschrift öffnet sich im Frontend nichts. Nutze den Knopf „Zeile hinzufügen“ unterhalb der Inhalte: Er legt automatisch eine neue Überschrift der Ebene H%d samt Absatz an.',
                                    'modular-blocks-plugin'
                                ),
                                headingLevel,
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
                    <Button
                        variant="primary"
                        icon={plus}
                        onClick={addRow}
                        className="mb-accordion-add-row"
                    >
                        {__('Zeile hinzufügen', 'modular-blocks-plugin')}
                    </Button>
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
