<?php
/**
 * Summary Block Render Template (H5P-Style)
 *
 * Renders a summary quiz where users select correct statements from groups.
 * Correct statements build up a summary of the topic.
 *
 * @var array $block_attributes Block attributes
 * @var string $block_content Block content
 * @var WP_Block $block_object Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Extract attributes with defaults
$title = $block_attributes['title'] ?? 'Zusammenfassung erstellen';
$description = $block_attributes['description'] ?? 'Wählen Sie aus jeder Gruppe die richtige(n) Aussage(n) aus.';
$statement_groups = $block_attributes['statementGroups'] ?? [];
$progressive_reveal = $block_attributes['progressiveReveal'] ?? true;
$show_feedback = $block_attributes['showFeedback'] ?? true;
$show_retry = $block_attributes['showRetry'] ?? true;
$show_solution = $block_attributes['showSolution'] ?? true;
$shuffle_statements = $block_attributes['shuffleStatements'] ?? true;
$shuffle_groups = $block_attributes['shuffleGroups'] ?? false;
$deferred_feedback = $block_attributes['deferredFeedback'] ?? false;
$enable_pdf_download = $block_attributes['enablePdfDownload'] ?? true;
$pdf_download_threshold = $block_attributes['pdfDownloadThreshold'] ?? 100;
$pdf_message = $block_attributes['pdfMessage'] ?? '';
$penalty_per_wrong = $block_attributes['penaltyPerWrongAnswer'] ?? 1;
$teacher_pdf_count = $block_attributes['teacherPdfCount'] ?? 10;
$success_text = $block_attributes['successText'] ?? 'Ausgezeichnet! Sie haben alle richtigen Aussagen gefunden.';
$partial_success_text = $block_attributes['partialSuccessText'] ?? 'Gut gemacht! Sie haben die meisten richtigen Aussagen gefunden.';
$fail_text = $block_attributes['failText'] ?? 'Versuchen Sie es noch einmal.';
$correct_feedback = $block_attributes['correctFeedback'] ?? 'Richtig! Diese Aussage wurde zur Zusammenfassung hinzugefügt.';
$incorrect_feedback = $block_attributes['incorrectFeedback'] ?? 'Falsch. Versuchen Sie eine andere Aussage.';
$summary_title = $block_attributes['summaryTitle'] ?? 'Ihre Zusammenfassung:';

// Sanitize attributes
$title = wp_kses_post($title);
$description = wp_kses_post($description);
$penalty_per_wrong = max(0, min(10, intval($penalty_per_wrong)));
// AP-1.3: gleiche Grenzen wie der RangeControl in index.js (1..50)
$teacher_pdf_count = max(1, min(50, intval($teacher_pdf_count)));

// Validate statement groups
if (empty($statement_groups) || !is_array($statement_groups)) {
    // echo statt return: render.php laeuft in Output-Buffering, Rueckgabewerte werden verworfen (AP39)
    echo '<div class="summary-error"><p>' . __('Keine Aussagen-Gruppen konfiguriert.', 'modular-blocks-plugin') . '</p></div>';
    return;
}

// jsPDF lokal einbinden (AP-1.1, PLAN-Summary-PDF-und-Content-Links.md).
// Vorher lud view.js die Bibliothek zur Laufzeit von cdnjs.cloudflare.com
// nach - das verstiess gegen die Projektkonvention "keine CDN-Einbindungen
// zur Laufzeit" (DSGVO). Die Datei liegt jetzt im Block-Ordner selbst, damit
// sie die modulare ZIP-Distribution (npm run block-zips) ueberlebt; ein
// plugin-weiter assets/vendor/-Ordner waere im Einzel-Block-ZIP nicht dabei.
// Bewusst unbedingt (nicht nur bei $enable_pdf_download): der in AP-1.3
// ergaenzte Lehrer-Button erzeugt sein Uebungs-PDF unabhaengig davon.
wp_enqueue_script(
    'modular-blocks-summary-jspdf',
    plugins_url('jspdf.umd.min.js', __FILE__),
    array(),
    defined('MODULAR_BLOCKS_PLUGIN_VERSION') ? MODULAR_BLOCKS_PLUGIN_VERSION : false,
    true
);

// Generate unique ID for this block instance
$block_id = 'summary-block-' . wp_unique_id();

// Count correct statements per group and total
$total_correct = 0;
$groups_data = [];

foreach ($statement_groups as $group_index => $group) {
    $statements = $group['statements'] ?? [];
    $correct_in_group = 0;

    foreach ($statements as $statement) {
        if (!empty($statement['isCorrect'])) {
            $correct_in_group++;
            $total_correct++;
        }
    }

    $groups_data[] = [
        'id' => $group['id'] ?? 'group' . $group_index,
        'statements' => $statements,
        'correctCount' => $correct_in_group
    ];
}

// Shuffle groups if enabled
if ($shuffle_groups) {
    shuffle($groups_data);
}

// AP-1.3 (PLAN-Summary-PDF-und-Content-Links.md): Lehrperson-Erkennung.
//
// Erste Naht dieses Plugins zum Theme. Sie folgt dem in der Root-CLAUDE.md
// unter "Direkte Theme-Funktionsaufrufe des Plugins" dokumentierten Muster:
// Aufruf hinter function_exists(), Rueckfall false. Fehlt das Theme oder ist
// es deaktiviert, gilt niemand als Lehrperson - der Knopf erscheint dann fuer
// niemanden, statt dass ein Fatal Error die Seite zerlegt.
//
// simple_clean_ist_lehrperson() (Theme/includes/sichtbarkeit.php) ist die
// projektweit EINZIGE Definition von "Lehrperson"; sie bedeutet aktuell
// lediglich apply_filters('simple_clean_ist_lehrperson', is_user_logged_in()),
// also "angemeldet". Das ist bekannt und bewusst so uebernommen - eine eigene
// current_user_can()-Pruefung waere eine zweite, abweichende Definition.
//
// Die Pruefung laeuft SERVERSEITIG: Ist sie falsch, wird der Knopf gar nicht
// erst ausgegeben. Ein blosses Verstecken per CSS/JS waere per DevTools
// aufzuheben.
$ist_lehrperson = function_exists('simple_clean_ist_lehrperson') && simple_clean_ist_lehrperson();

// AP-1.1 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
// Genau EINE (die als isCorrect markierte) Aussage je Gruppe - nicht mehr
// alle Formulierungen. Jede 3er-Gruppe enthaelt im Datenmodell drei
// Formulierungen DESSELBEN Sachverhalts (nur eine davon isCorrect); ein Pool
// aus allen dreien liess im Uebungsblatt leicht mehrere Varianten desselben
// Fakts gleichzeitig auftauchen. Ohne isCorrect-Kennzeichnung im JSON, weil
// das Uebungsblatt weiterhin keine Loesung enthaelt (Nicht-Ziel) - nur der
// Text der bereits als richtig identifizierten Aussage wird uebernommen.
// Pool bleibt ausschliesslich dieses Block-Exemplars (Architekturentscheidung
// A4 des Vorgaengerplans, hier unveraendert als C1 uebernommen).
//
// Enthaelt eine Gruppe aus irgendeinem Grund keine als richtig markierte
// Aussage (Datenfehler im Editor), wird sie einfach uebersprungen - kein
// Pool-Eintrag fuer diese Gruppe, kein Fataler Fehler.
$all_statement_texts = [];
if ($ist_lehrperson) {
    foreach ($groups_data as $group) {
        foreach ($group['statements'] as $statement) {
            if (empty($statement['isCorrect'])) {
                continue;
            }
            $text = $statement['text'] ?? '';
            if ($text !== '') {
                $all_statement_texts[] = wp_kses_post($text);
            }
            break; // genau eine Aussage je Gruppe - erste als richtig markierte gewinnt
        }
    }
}

// AP-1.5 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md): Kapitel-Titel
// fuer die drei PDF-Ausgaben.
//
// "Kapitel" ist hier die OBERSTE Vorfahren-Seite der aktuellen Seite, also
// Ebene 0 der Seitenhierarchie - dasselbe Verstaendnis wie in
// get_root_page_id() (Theme/sidebar.php), nur mit WordPress-Bordmitteln
// nachgebaut. get_post_ancestors() liefert die Vorfahren von innen nach
// aussen, end() greift damit die aeusserste.
//
// Bewusst OHNE function_exists()-Bruecke zum Theme (anders als bei
// simple_clean_ist_lehrperson() oben): get_post_ancestors() ist
// WordPress-Bordmittel - Architekturentscheidung B4 des Plans. Das Plugin
// bleibt fuer diese Funktion vollstaendig theme-unabhaengig.
//
// is_singular() als Torwaechter: get_queried_object_id() liefert AUCH auf
// Archivseiten einen Wert, dort aber eine Term-ID. Ohne die Pruefung wuerde
// ein summary-block in einem Widget auf einer Kategorieseite die Term-ID als
// Post-ID weiterreichen und im schlimmsten Fall den Titel eines voellig
// fremden Beitrags ins PDF schreiben. Trifft die Pruefung nicht zu, bleibt
// $kapitel_titel leer und view.js gibt gar keine Zeile aus (kein Fehler,
// keine Leerzeile) - die im Plan verlangte Gegenmassnahme zum Sonderfall
// "kein Seitenkontext".
//
// wp_strip_all_tags() statt wp_kses_post(): Der Wert landet ausschliesslich
// als reiner Text in einem PDF. Markup waere dort sinnlos, und so kann
// clientseitig auch nichts anderes als Text ankommen.
$kapitel_titel = '';
$aktuelle_seite_id = is_singular() ? get_queried_object_id() : 0;
if ($aktuelle_seite_id) {
    $kapitel_id = $aktuelle_seite_id;
    $vorfahren = get_post_ancestors($aktuelle_seite_id);
    if (!empty($vorfahren)) {
        $kapitel_id = end($vorfahren);
    }
    $kapitel_titel = wp_strip_all_tags(get_the_title($kapitel_id));
}

// Build CSS classes
$css_classes = [
    'wp-block-modular-blocks-summary-block',
    $progressive_reveal ? 'progressive-reveal' : 'show-all-groups',
    $show_feedback ? 'has-feedback' : ''
];

$css_classes = array_filter($css_classes);
$css_class = implode(' ', $css_classes);

// Get theme colors for buttons
// AP-3.2 (PLAN-CSS-Variablen-Darkmode.md): Rollout des in AP-3.0 (accordion)
// live getesteten Musters, hier identisch zu AP-3.1 (iframe-whitelist)
// angewandt. Die get_theme_mod()-Werte werden nicht mehr als hartkodierter
// Hex-Wert direkt ins Inline-Style der Buttons geschrieben (frueheres
// Anti-Pattern, siehe CLAUDE.md "Buttons mit Theme-Farben"), sondern als
// Custom Properties auf den AEUSSEREN Wrapper geschrieben (siehe
// $wrapper_style_vars unten) - style.css referenziert sie per
// var(--sb-x, #bisheriger-fallback-wert). $color_ui_surface_dark wurde vorher
// bereits geholt, aber nirgends verwendet (das seither wirkungslose
// "transition: background 0.2s ease" unten deutete darauf hin); analog zu
// AP-3.1 steuert er jetzt den Hover-Zustand der gefuellten Buttons.
$color_ui_surface = get_theme_mod('color_ui_surface', '#e24614');
$color_ui_surface_dark = get_theme_mod('color_ui_surface_dark', '#c93d12');

$wrapper_style_vars = sprintf(
    '--sb-primary: %s; --sb-primary-hover: %s;',
    esc_attr($color_ui_surface),
    esc_attr($color_ui_surface_dark)
);

// Prepare data for JavaScript
$summary_data = [
    'groups' => $groups_data,
    'totalCorrect' => $total_correct,
    'progressiveReveal' => $progressive_reveal,
    'showFeedback' => $show_feedback,
    'showRetry' => $show_retry,
    'showSolution' => $show_solution,
    'shuffleStatements' => $shuffle_statements,
    'deferredFeedback' => $deferred_feedback,
    'enablePdfDownload' => $enable_pdf_download,
    'pdfDownloadThreshold' => $pdf_download_threshold,
    'pdfMessage' => $pdf_message,
    'penaltyPerWrong' => $penalty_per_wrong,
    // AP-1.3: Bruecke ans Frontend fuer das Lehrer-Uebungs-PDF.
    // allStatementTexts ist absichtlich leer, wenn der Betrachter keine
    // Lehrperson ist - so steht der Aussagen-Pool nicht ohnehin schon im
    // Quelltext der Seite (die Aussagetexte selbst stehen zwar sichtbar in
    // den Knoepfen, ihre Vollstaendigkeit als fertige Liste aber nicht).
    // AP-1.1 (Punktesystem-Buttons-Kapitellink-Feinschliff): Schluesselname
    // bewusst unveraendert gelassen (Plan erlaubt das ausdruecklich), der
    // Inhalt ist seither aber ein Eintrag JE GRUPPE (nur die als richtig
    // markierte Aussage), nicht mehr je Einzelaussage - siehe Aufbau von
    // $all_statement_texts oben.
    'isTeacher' => $ist_lehrperson,
    'teacherPdfCount' => $teacher_pdf_count,
    'allStatementTexts' => $all_statement_texts,
    // AP-1.5 des Nachtrags: Titel der obersten Vorfahren-Seite, leer wenn
    // kein Seitenkontext vorliegt. Wird nur in den PDFs verwendet, nirgends
    // im sichtbaren Markup - die Ausgabe hier laeuft wie alle anderen
    // Schluessel ueber json_encode() + esc_attr() am Wurzel-div.
    'kapitelTitel' => $kapitel_titel,
    'successText' => $success_text,
    'partialSuccessText' => $partial_success_text,
    'failText' => $fail_text,
    'correctFeedback' => $correct_feedback,
    'incorrectFeedback' => $incorrect_feedback,
    'summaryTitle' => $summary_title,
    'strings' => [
        'group' => __('Frage', 'modular-blocks-plugin'),
        'of' => __('von', 'modular-blocks-plugin'),
        'check' => __('Prüfen', 'modular-blocks-plugin'),
        'retry' => __('Wiederholen', 'modular-blocks-plugin'),
        'showSolution' => __('Lösung anzeigen', 'modular-blocks-plugin'),
        'continue' => __('Weiter', 'modular-blocks-plugin'),
        'correct' => __('Richtig!', 'modular-blocks-plugin'),
        'incorrect' => __('Falsch!', 'modular-blocks-plugin'),
        // AP-1.2 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
        // Text an das neue gruppenbasierte Punktemodell angepasst
        // ("Aussagensätzen richtig" statt "Punkte") - Schluesselname
        // bewusst unveraendert (view.js liest weiterhin strings.score),
        // nur der Inhalt passt jetzt zur neuen Formulierung
        // "${finalScore} von ${groups.length} ${strings.score} (…%)".
        'score' => __('Aussagensätzen richtig', 'modular-blocks-plugin'),
        'completed' => __('Abgeschlossen', 'modular-blocks-plugin'),
        'selectCorrect' => __('Wählen Sie die richtige(n) Aussage(n):', 'modular-blocks-plugin'),
        'downloadPdf' => __('Als PDF herunterladen', 'modular-blocks-plugin')
    ]
];

// Button styles - Farbwerte kommen seit AP-3.2 nicht mehr von hier, sondern
// per CSS-Custom-Property vom Wrapper (siehe oben) plus var(--sb-x, #fallback)
// in style.css; hier nur noch die farbunabhaengigen Layout-Eigenschaften.
//
// AP-1.4 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
// border-radius von 4px auf 6px (Projektstandard, siehe statement-summary) -
// MUSS hier (nicht nur in style.css) geaendert werden, da dieser Inline-Style
// die style.css-Regel ueberschreibt (Grund, warum die dortige 8px-Regel bis
// jetzt wirkungslos war). "color: #fff" ist durch die themegekoppelte
// Variable var(--color-text-on-accent, #ffffff) ersetzt - inhaltlich
// weiterhin #fff in beiden Hell-/Dunkelmodi, aber jetzt keine "kein
// Theme-Wert"-Ausnahme mehr, sondern konsistent mit dem Rest des Projekts
// (Root-CLAUDE.md, Abschnitt "Color Scheme").
$button_style = 'display: inline-flex; align-items: center; justify-content: center; ' .
                'padding: 10px 20px; border: none; border-radius: 6px; ' .
                'color: var(--color-text-on-accent, #ffffff); cursor: pointer; font-size: 14px; font-weight: 500; ' .
                'transition: background 0.2s ease;';

// AP-1.4, Architekturentscheidung C4: "background: transparent" entfernt -
// die drei Sekundaer-Buttons (Wiederholen, Uebungsblatt/Loesungsblatt
// erzeugen) bekommen ihre helle Flaechenfarbe jetzt ausschliesslich ueber
// die !important-Regeln in style.css (.retry-button/.teacher-practice-pdf-
// button/.teacher-solution-sheet-button). Ein hier weiterhin gesetztes
// "background: transparent" wuerde von style.css's !important zwar ohnehin
// ueberschrieben (Inline-Styles verlieren gegen !important-Regeln aus
// externen Stylesheets), bliebe aber irrefuehrender toter Code - deshalb
// ganz entfernt statt nur wirkungslos stehen gelassen. border-radius wie
// oben von 4px auf 6px.
$button_secondary_style = 'display: inline-flex; align-items: center; justify-content: center; ' .
                          'padding: 10px 20px; border-width: 2px; border-style: solid; ' .
                          'border-radius: 6px; ' .
                          'cursor: pointer; ' .
                          'font-size: 14px; font-weight: 500; transition: all 0.2s ease;';
?>

<div id="<?php echo esc_attr($block_id); ?>"
     class="<?php echo esc_attr($css_class); ?>"
     style="<?php echo esc_attr($wrapper_style_vars); ?>"
     data-summary='<?php echo esc_attr(json_encode($summary_data)); ?>'>

    <div class="summary-container">
        <!-- Header -->
        <div class="summary-header">
            <?php if (!empty($title)): ?>
                <h3 class="summary-title"><?php echo $title; ?></h3>
            <?php endif; ?>

            <?php if (!empty($description)): ?>
                <div class="summary-description"><?php echo $description; ?></div>
            <?php endif; ?>

            <?php
            // AP-1.3: Uebungs-PDF-Knopf fuer Lehrpersonen.
            //
            // Bewusst hier im Kopf und NICHT in .summary-controls: Der Knopf
            // muss unabhaengig vom Spielzustand sichtbar sein, also auch vor
            // Beginn der Uebung. .summary-controls steht bis showResults()
            // auf display:none, der Knopf waere dort erst nach Abschluss
            // erreichbar.
            //
            // Die Sichtbarkeit haengt allein an $ist_lehrperson, also an einer
            // serverseitigen Pruefung - fuer alle anderen existiert der Knopf
            // gar nicht erst im HTML.
            ?>
            <?php if ($ist_lehrperson && !empty($all_statement_texts)): ?>
                <?php
                // AP-1.3 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
                // Zahlenfeld fuer die Anzahl der Aufgaben im Uebungsblatt.
                //
                // Zweck: Eine Lehrperson, die nur die veroeffentlichte Seite
                // ansieht, kann die Anzahl aendern, ohne den Block-Editor zu
                // oeffnen. Der Wert wirkt AUSSCHLIESSLICH auf den naechsten
                // Export dieses Seitenaufrufs - es wird nichts gespeichert
                // (Architekturentscheidung B3): kein AJAX, keine
                // REST-Route, keine neue Schreibberechtigung. Nach einem
                // Neuladen steht wieder der im Editor gespeicherte Wert da.
                //
                // Das Feld sitzt im selben if ($ist_lehrperson)-Zweig wie der
                // Knopf. Fuer alle anderen existiert es damit gar nicht erst
                // im HTML - dieselbe serverseitige Bedingung, kein zweiter,
                // schwaecherer Sichtbarkeitsweg per CSS.
                //
                // AP-1.1 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
                // max = Anzahl GRUPPEN, nicht mehr Anzahl Einzelaussagen. Der
                // Uebungsblatt-Pool ($all_statement_texts oben) enthaelt seit
                // diesem AP ohnehin nur noch einen Eintrag je Gruppe, die
                // Obergrenze des Zahlenfelds folgt dem direkt:
                // count($groups_data) statt der frueheren Gesamtzahl aller
                // Einzelaussagen. Sonst verspraeche das Feld eine Anzahl, die
                // das PDF gar nicht liefern kann.
                //
                // value wird zusaetzlich auf max geklemmt (bekannter Bug G3,
                // Nachtragsplan: ein gespeichertes teacherPdfCount groesser
                // als die tatsaechliche Gruppenzahl - z. B. Attribut-Default
                // 10 bei nur 3 Gruppen - liess das Feld zuvor HTML-technisch
                // ungueltig mit value > max oeffnen). Der PDF-Export selbst
                // war davon nie betroffen (view.js deckelte schon vorher auf
                // die Poolgroesse), nur die Anzeige im Feld war falsch.
                $anzahl_feld_id = $block_id . '-teacher-pdf-count';
                $gesamt_gruppen = count($groups_data);
                ?>
                <div class="summary-teacher-tools">
                    <label class="teacher-pdf-count-label" for="<?php echo esc_attr($anzahl_feld_id); ?>">
                        <?php echo esc_html__('Anzahl:', 'modular-blocks-plugin'); ?>
                    </label>
                    <input type="number"
                           id="<?php echo esc_attr($anzahl_feld_id); ?>"
                           class="teacher-pdf-count-input"
                           min="1"
                           max="<?php echo esc_attr($gesamt_gruppen); ?>"
                           step="1"
                           inputmode="numeric"
                           value="<?php echo esc_attr(min($teacher_pdf_count, $gesamt_gruppen)); ?>">
                    <button type="button"
                            class="summary-button teacher-practice-pdf-button"
                            style="<?php echo esc_attr($button_secondary_style); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;" aria-hidden="true" focusable="false">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <?php echo esc_html__('Übungs-PDF erzeugen', 'modular-blocks-plugin'); ?>
                    </button>
                    <?php
                    // AP-1.4 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
                    // Zweiter Lehrer-Knopf, Loesungsblatt. Bewusst im selben
                    // if ($ist_lehrperson)-Zweig und derselben Zeile wie der
                    // Uebungsblatt-Knopf - er zeigt die richtigen Antworten und
                    // darf Lernenden genauso wenig im HTML begegnen wie der
                    // Aussagen-Pool.
                    //
                    // Das Zahlenfeld darueber gilt fuer ihn NICHT: Das
                    // Loesungsblatt gibt immer alle Aussagen aus, ohne
                    // Zufallsauswahl und ohne Begrenzung.
                    ?>
                    <button type="button"
                            class="summary-button teacher-solution-sheet-button"
                            style="<?php echo esc_attr($button_secondary_style); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;" aria-hidden="true" focusable="false">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        <?php echo esc_html__('Lösungsblatt erzeugen', 'modular-blocks-plugin'); ?>
                    </button>
                </div>
            <?php endif; ?>
        </div>

        <!-- Progress indicator -->
        <div class="summary-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%;"></div>
            </div>
            <div class="progress-text">
                <span class="current-group">1</span> / <span class="total-groups"><?php echo count($groups_data); ?></span>
            </div>
        </div>

        <!-- Summary Section (grows as user selects correct answers) -->
        <div class="summary-section" style="display: none;">
            <h4 class="summary-section-title"><?php echo esc_html($summary_title); ?></h4>
            <div class="summary-statements">
                <!-- Correct statements will be added here -->
            </div>
        </div>

        <!-- Groups Container -->
        <div class="summary-groups">
            <?php foreach ($groups_data as $group_index => $group): ?>
                <?php
                $statements = $group['statements'];
                // Shuffle statements within group if enabled (for display)
                if ($shuffle_statements) {
                    shuffle($statements);
                }
                $is_first = ($group_index === 0);
                ?>
                <div class="summary-group <?php echo $is_first && $progressive_reveal ? 'active' : ''; ?>"
                     data-group-index="<?php echo esc_attr($group_index); ?>"
                     data-group-id="<?php echo esc_attr($group['id']); ?>"
                     data-correct-count="<?php echo esc_attr($group['correctCount']); ?>"
                     style="<?php echo !$is_first && $progressive_reveal ? 'display: none;' : ''; ?>">

                    <div class="group-header">
                        <span class="group-label">
                            <?php echo esc_html__('Frage', 'modular-blocks-plugin'); ?>
                            <?php echo ($group_index + 1); ?>
                            <?php echo esc_html__('von', 'modular-blocks-plugin'); ?>
                            <?php echo count($groups_data); ?>
                        </span>
                        <span class="group-instruction">
                            <?php
                            if ($group['correctCount'] > 1) {
                                printf(
                                    esc_html__('Wählen Sie %d richtige Aussagen:', 'modular-blocks-plugin'),
                                    $group['correctCount']
                                );
                            } else {
                                echo esc_html__('Wählen Sie die richtige Aussage:', 'modular-blocks-plugin');
                            }
                            ?>
                        </span>
                    </div>

                    <div class="group-statements">
                        <?php foreach ($statements as $stmt_index => $statement): ?>
                            <?php
                            $stmt_id = $statement['id'] ?? $group['id'] . '-s' . $stmt_index;
                            $stmt_text = wp_kses_post($statement['text'] ?? '');
                            $is_correct = !empty($statement['isCorrect']);
                            ?>
                            <button type="button"
                                    class="statement-option"
                                    data-statement-id="<?php echo esc_attr($stmt_id); ?>"
                                    data-correct="<?php echo $is_correct ? 'true' : 'false'; ?>">
                                <span class="statement-text"><?php echo $stmt_text; ?></span>
                                <span class="statement-icon"></span>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <!-- Group Feedback -->
                    <div class="group-feedback" style="display: none;">
                        <div class="feedback-message"></div>
                    </div>

                    <!-- Group Actions -->
                    <div class="group-actions">
                        <button type="button"
                                class="summary-button continue-button"
                                style="<?php echo esc_attr($button_style); ?> display: none;">
                            <?php echo esc_html__('Weiter', 'modular-blocks-plugin'); ?>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 8px;">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Results Section -->
        <div class="summary-results" style="display: none;">
            <div class="results-content">
                <div class="results-icon"></div>
                <div class="score-display"></div>
                <div class="result-message"></div>
            </div>
        </div>

        <!-- Final Controls -->
        <div class="summary-controls" style="display: none;">
            <?php if ($show_retry): ?>
                <button type="button"
                        class="summary-button retry-button"
                        style="<?php echo esc_attr($button_secondary_style); ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                    <?php echo esc_html__('Wiederholen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($enable_pdf_download): ?>
                <button type="button"
                        class="summary-button pdf-download-button"
                        style="<?php echo esc_attr($button_style); ?> display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <?php echo esc_html__('Als PDF herunterladen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>

            <?php if ($show_solution): ?>
                <button type="button"
                        class="summary-button solution-button"
                        style="<?php echo esc_attr($button_style); ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                    <?php echo esc_html__('Lösung anzeigen', 'modular-blocks-plugin'); ?>
                </button>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const summaryBlock = document.getElementById('<?php echo esc_js($block_id); ?>');
    if (summaryBlock && typeof window.initSummaryBlock === 'function') {
        window.initSummaryBlock(summaryBlock);
    }
});
</script>
