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
    // wp_kses_post() erlaubt die von RichText zugelassenen Inline-Formate
    // (fett, kursiv) und filtert alles andere heraus.
    $title_output = wp_kses_post($title);
}

// Eindeutige IDs für die ARIA-Verknüpfung von Kopf-Button und Panel.
$header_id = wp_unique_id('mb-accordion-header-');
$panel_id  = wp_unique_id('mb-accordion-panel-');

// Anker/Deep-Linking: Da save() keinen eigenen Wrapper erzeugt, muss
// render.php einen im Editor gesetzten HTML-Anker selbst als id an den
// Block-Wrapper weitergeben. Es darf dabei höchstens ein id-Attribut
// entstehen.
$anchor = $block_attributes['anchor'] ?? '';

$wrapper_args = [
    'class' => 'mb-accordion-row',
];

if (!empty($anchor)) {
    $wrapper_args['id'] = sanitize_html_class($anchor);
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
