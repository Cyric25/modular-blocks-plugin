<?php
/**
 * Accordion Block Render Template
 *
 * Rendert den Accordion-Wrapper. Die InnerBlocks-Zone nimmt beliebige Bloecke
 * auf; Ueberschriften der eingestellten Ebene (headingLevel) markieren im
 * Frontend per view.js den Beginn einer aufklappbaren Zeile. $block_content
 * enthaelt bereits das fertig gerenderte, flache Inner-Block-HTML – dieser
 * Block hat keinen Kind-Block mehr.
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content (bereits gerendertes Inner-Block-HTML)
 * @var WP_Block $block_object     Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

$heading_level = isset($block_attributes['headingLevel']) ? absint($block_attributes['headingLevel']) : 3;
if ($heading_level < 1) {
    $heading_level = 3;
}

if (trim($block_content) === '') {
    // Kein Wrapper fuer leeren Zustand. Hinweis nur fuer berechtigte Nutzer
    // (Redakteure), damit Besucher keinen leeren/kaputten Block sehen.
    if (current_user_can('edit_posts')) {
        echo '<p class="mb-accordion__notice">' . sprintf(
            /* translators: %d: Ueberschriftenebene, z. B. 3 fuer H3 */
            esc_html__('Accordion: Es fehlen Inhalte bzw. Überschriften der eingestellten Ebene (H%d). Schreibe Überschrift, Inhalt, Überschrift, Inhalt … – jede Überschrift dieser Ebene beginnt im Frontend eine neue Klappzeile.', 'modular-blocks-plugin'),
            $heading_level
        ) . '</p>';
    }
    return;
}

$allow_multiple  = !empty($block_attributes['allowMultiple']);
$open_first      = !empty($block_attributes['openFirst']);
$show_numbering  = !empty($block_attributes['showNumbering']);
$show_expand_all = !empty($block_attributes['showExpandAll']);

// Theme-Farben: view.js faerbt die Zeilenkoepfe zur Laufzeit anhand der
// data-Attribute unten inline (mit !important) ein - das bleibt unveraendert
// (siehe CLAUDE.md, Abschnitt "Farben kommen aus data-color-*").
//
// AP-3.0-Spike (PLAN-CSS-Variablen-Darkmode.md): Fuer die "Alle oeffnen"/
// "Alle schliessen"-Buttons wird hier zusaetzlich getestet, ob ein Inline-
// Custom-Property auf dem Wrapper (Vorbild cbd_get_icon_position_style() im
// CDB-Plugin) das in CLAUDE.md dokumentierte Override-Problem umgeht, das die
// bisherige Empfehlung "keine CSS-Variablen" begruendet hat. Der PHP-Wert
// wird weiterhin per get_theme_mod() aufgeloest (siehe Begruendung unten),
// aber statt als hartkodierter Hex-Wert direkt im Inline-Style der Buttons
// nun als Custom-Property auf dem AEUSSEREN Wrapper - style.css referenziert
// sie per var(--mb-accordion-active, #fallback). Testergebnis: siehe
// Uebergabenotiz AP-3.0 im Plan.
$color_active  = get_theme_mod('color_ui_surface', '#e24614');
$color_hover   = get_theme_mod('color_ui_surface_dark', '#c93d12');
$color_surface = get_theme_mod('color_ui_surface_light', '#f5ede9');
$color_text    = get_theme_mod('color_special_text', '#71230a');

// AP-3.0: Alle vier oben gelesenen Theme-Werte als Inline-Custom-Properties
// auf dem Wrapper - unabhaengig davon, ob style.css aktuell alle vier
// referenziert (aktuell nur --mb-accordion-active fuer die Buttons; die
// uebrigen drei bleiben zusaetzlich als data-color-*-Attribute fuer view.js
// erhalten, siehe unten).
$wrapper_style_vars = sprintf(
    '--mb-accordion-surface: %s; --mb-accordion-active: %s; --mb-accordion-hover: %s; --mb-accordion-text: %s;',
    esc_attr($color_surface),
    esc_attr($color_active),
    esc_attr($color_hover),
    esc_attr($color_text)
);

// Dieser Block nutzt bewusst keinen save()-Wrapper (siehe index.js), daher
// setzt WordPress die align-Klasse (alignwide/alignfull) NICHT automatisch.
// render.php muss $block_attributes['align'] deshalb selbst in die
// Wrapper-Klasse uebernehmen, bevor get_block_wrapper_attributes() greift.
$classes = 'mb-accordion';
$align = $block_attributes['align'] ?? '';
if (is_string($align) && $align !== '') {
    $classes .= ' align' . sanitize_html_class($align);
}
if ($show_numbering) {
    $classes .= ' is-numbered';
}

echo '<div ' . get_block_wrapper_attributes([
    'class'               => $classes,
    'style'               => $wrapper_style_vars,
    'data-allow-multiple' => $allow_multiple ? 'true' : 'false',
    'data-open-first'     => $open_first ? 'true' : 'false',
    'data-numbering'      => $show_numbering ? 'true' : 'false',
    'data-expand-all'     => $show_expand_all ? 'true' : 'false',
    'data-heading-level'  => $heading_level,
    'data-color-surface'  => $color_surface,
    'data-color-active'   => $color_active,
    'data-color-hover'    => $color_hover,
    'data-color-text'     => $color_text,
]) . '>';

if ($show_expand_all) {
    // AP-3.0-Spike: keine Inline-Farben mehr an den Buttons selbst - die
    // Farbe kommt aus der Custom-Property auf dem Wrapper (siehe oben),
    // style.css referenziert sie per var(--mb-accordion-active, #fallback).
    echo '<div class="mb-accordion__controls" hidden>';
    if ($allow_multiple) {
        // "Alle oeffnen" ist im Exklusivmodus (allowMultiple aus)
        // widerspruechlich und wird dort nicht ausgegeben.
        echo '<button type="button" class="mb-accordion__control" data-action="open-all">' . esc_html__('Alle öffnen', 'modular-blocks-plugin') . '</button>';
    }
    echo '<button type="button" class="mb-accordion__control" data-action="close-all">' . esc_html__('Alle schließen', 'modular-blocks-plugin') . '</button>';
    echo '</div>';
}

echo '<div class="mb-accordion__content">';
// $block_content ist bereits gerendertes Inner-Block-HTML und wird bewusst
// nicht escaped bzw. nicht durch wp_kses_post() geschickt.
echo $block_content;
echo '</div>';

echo '</div>';
