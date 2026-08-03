<?php
/**
 * Accordion Block Render Template
 *
 * Rendert den Accordion-Container. Die eigentlichen aufklappbaren Zeilen
 * werden vom Kind-Block modular-blocks/accordion-row (InnerBlocks) erzeugt
 * und liegen bereits fertig gerendert in $block_content vor.
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content (bereits gerendertes Inner-Block-HTML)
 * @var WP_Block $block_object     Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

if (trim($block_content) === '') {
    // Kein Wrapper fuer leeren Zustand. Hinweis nur fuer berechtigte Nutzer
    // (Redakteure), damit Besucher keinen leeren/kaputten Block sehen.
    if (current_user_can('edit_posts')) {
        echo '<p class="mb-accordion__notice">' . esc_html__('Accordion: Es sind keine Zeilen vorhanden oder der Block „Accordion-Zeile“ ist nicht aktiviert.', 'modular-blocks-plugin') . '</p>';
    }
    return;
}

// Dieser Block nutzt bewusst keinen save()-Wrapper (siehe index.js), daher
// setzt WordPress die align-Klasse (alignwide/alignfull) NICHT automatisch.
// render.php muss $block_attributes['align'] deshalb selbst in die
// Wrapper-Klasse uebernehmen, bevor get_block_wrapper_attributes() greift.
$classes = 'mb-accordion';
$align = $block_attributes['align'] ?? '';
if (is_string($align) && $align !== '') {
    $classes .= ' align' . sanitize_html_class($align);
}

echo '<div ' . get_block_wrapper_attributes(['class' => $classes]) . '>';
// $block_content ist bereits gerendertes Inner-Block-HTML und wird bewusst
// nicht escaped bzw. nicht durch wp_kses_post() geschickt.
echo $block_content;
echo '</div>';
