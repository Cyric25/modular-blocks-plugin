<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Sanitizes SVG output: removes scripts and event handlers.
 */
if ( ! function_exists( 'modular_blocks_sanitize_svg' ) ) :
function modular_blocks_sanitize_svg( $svg ) {
    if ( empty( $svg ) ) return '';

    // Strip XML declaration and DOCTYPE – not valid in HTML5 inline SVG
    $svg = preg_replace( '/<\?xml[^?]*\?>/i',  '', $svg );
    $svg = preg_replace( '/<!DOCTYPE[^>]*>/i',  '', $svg );
    $svg = trim( $svg );

    if ( substr( $svg, 0, 4 ) !== '<svg' ) return '';

    libxml_use_internal_errors( true );
    $dom = new DOMDocument();
    $dom->loadXML( $svg, LIBXML_NONET );
    libxml_clear_errors();

    // Remove <script> elements
    foreach ( iterator_to_array( $dom->getElementsByTagName( 'script' ) ) as $node ) {
        $node->parentNode->removeChild( $node );
    }

    // Remove on* event attributes and javascript: URLs
    $xpath = new DOMXPath( $dom );
    $bad_attrs = $xpath->query( '//@*[starts-with(translate(local-name(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"on") or contains(.,"javascript:")]' );
    if ( $bad_attrs ) {
        foreach ( iterator_to_array( $bad_attrs ) as $attr ) {
            $attr->ownerElement->removeAttributeNode( $attr );
        }
    }

    return $dom->saveXML( $dom->documentElement );
}
endif;

$svg_content      = $block_attributes['svgContent']      ?? '';
$canvas_width     = absint( $block_attributes['canvasWidth']  ?? 800 );
$canvas_height    = absint( $block_attributes['canvasHeight'] ?? 450 );
$alt_text         = esc_attr( $block_attributes['altText']    ?? '' );

$clean_svg = modular_blocks_sanitize_svg( $svg_content );

$wrapper_class = 'wp-block-modular-blocks-svg-drawing';
?>
<figure class="<?php echo esc_attr( $wrapper_class ); ?>">
    <?php if ( $clean_svg ) : ?>
        <div
            class="svg-drawing-wrapper"
            style="max-width: <?php echo $canvas_width; ?>px;"
            role="img"
            <?php if ( $alt_text ) : ?>aria-label="<?php echo $alt_text; ?>"<?php endif; ?>
        >
            <?php echo $clean_svg; // sanitized above ?>
        </div>
    <?php else : ?>
        <div class="svg-drawing-wrapper svg-drawing-empty" style="max-width: <?php echo $canvas_width; ?>px; height: <?php echo $canvas_height; ?>px;">
            <p><?php esc_html_e( 'Zeichnung noch nicht gespeichert.', 'modular-blocks-plugin' ); ?></p>
        </div>
    <?php endif; ?>
    <?php if ( $alt_text ) : ?>
        <figcaption><?php echo esc_html( $alt_text ); ?></figcaption>
    <?php endif; ?>
</figure>
