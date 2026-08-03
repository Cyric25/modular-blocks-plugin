<?php
/**
 * Accordion-Row Block Render Template
 *
 * Rendert eine einzelne Accordion-Zeile: ein klickbarer Kopf-Button und ein
 * Panel mit den verschachtelten InnerBlocks. In dieser Projektphase wird das
 * Panel statisch GEÖFFNET gerendert (kein Zuklappen, keine Theme-Farben,
 * keine Animation – das folgt in späteren Arbeitspaketen), damit der Inhalt
 * auch ohne JavaScript erreichbar ist.
 *
 * @var array    $block_attributes Block-Attribute
 * @var string   $block_content    Bereits gerendertes Inner-Block-Markup
 * @var WP_Block $block_object     Block-Objekt
 */

if (!defined('ABSPATH')) {
    exit;
}

// Titel-Attribut extrahieren und für die Anzeige vorbereiten.
$title = $block_attributes['title'] ?? '';

// Ist der Titel leer oder besteht er nach dem Entfernen aller Tags nur aus
// Leerraum, wird ein Fallback-Text verwendet, damit der Button niemals
// unbeschriftet ist.
if (trim(wp_strip_all_tags($title)) === '') {
    $title_output = esc_html__('Ohne Titel', 'modular-blocks-plugin');
} else {
    // Nur die im Editor per RichText zugelassenen Inline-Formate (fett,
    // kursiv) durchlassen. Der allgemeine Post-Content-Filter waere hier zu
    // grosszuegig (erlaubt z. B. <a> oder <img>) und wuerde invalides bzw.
    // barrierefeindliches Markup innerhalb des <button> ermoeglichen.
    $title_output = wp_kses($title, [
        'strong' => [],
        'b'      => [],
        'em'     => [],
        'i'      => [],
    ]);
}

// Eindeutige IDs für die ARIA-Verknüpfung von Kopf-Button und Panel.
$header_id = wp_unique_id('mb-accordion-header-');
$panel_id  = wp_unique_id('mb-accordion-panel-');

// Anker/Deep-Linking: Es wird bewusst NICHT das WordPress-Bordmittel
// supports.anchor verwendet (siehe block.json: "anchor": false). Core
// deklariert das Attribut "anchor" clientseitig als gesourctes Attribut
// (source: 'attribute', attribute: 'id', selector: '*'), dessen Wert beim
// Laden aus dem gespeicherten save()-Markup zurückgelesen wird. Da save()
// hier bewusst KEIN eigenes Element erzeugt (nur <InnerBlocks.Content />),
// gibt es kein Element, aus dem die id zurückgelesen werden könnte – der
// Wert ginge nach jedem Neuladen verloren und würde render.php nie
// erreichen. Stattdessen wird ein eigenes String-Attribut "rowAnchor"
// verwendet, dessen Wert ganz regulär (wie jedes andere Attribut) in der
// Block-Kommentar-JSON gespeichert wird und render.php zuverlässig erreicht.
$row_anchor = $block_attributes['rowAnchor'] ?? '';

// Serverseitige Filterung auf denselben Zeichensatz, den auch das
// Editor-JS (index.js: normalizeRowAnchor) bereits durchsetzt:
// nur a-z, A-Z, 0-9, "_" und "-". Der WordPress-Filter fuer CSS-Klassennamen
// ist hier bewusst NICHT die richtige Wahl, da er fuer Klassennamen gedacht
// ist und u. a. Punkte und Umlaute anders behandelt als hier gewuenscht.
$row_anchor = trim(preg_replace('/[^A-Za-z0-9_-]/', '', $row_anchor));

$wrapper_args = [
    'class' => 'mb-accordion-row',
];

if ($row_anchor !== '') {
    $wrapper_args['id'] = $row_anchor;
}

$wrapper_attributes = get_block_wrapper_attributes($wrapper_args);
?>
<div <?php echo $wrapper_attributes; ?>>
    <button type="button"
            class="mb-accordion-row__header"
            id="<?php echo esc_attr($header_id); ?>"
            aria-expanded="true"
            aria-controls="<?php echo esc_attr($panel_id); ?>">
        <span class="mb-accordion-row__title"><?php echo $title_output; ?></span>
        <span class="mb-accordion-row__icon" aria-hidden="true"></span>
    </button>
    <div class="mb-accordion-row__panel"
         id="<?php echo esc_attr($panel_id); ?>"
         role="region"
         aria-labelledby="<?php echo esc_attr($header_id); ?>">
        <?php echo $block_content; ?>
    </div>
</div>
