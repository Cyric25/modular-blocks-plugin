# Datei-Map: Modulare Blöcke Plugin (Eigene WP Blocks)

_Stand: 2026-08-16_

Navigationshilfe: Welche Datei ist für was zuständig. Details zur Architektur stehen in `CLAUDE.md` (Plugin-Verzeichnis), der Leitfaden für neue Blöcke in `BLOCK-DEVELOPMENT.md`.

## Kern und Infrastruktur

| Datei | Zweck | Wichtige Funktionen/Inhalte | Hängt ab von |
|---|---|---|---|
| `modular-blocks-plugin.php` | Plugin-Hauptdatei, Singleton `ModularBlocksPlugin`, Einstiegspunkt | Konstanten `MODULAR_BLOCKS_PLUGIN_VERSION/_URL/_PATH/_BASENAME`, `modular_blocks_debug_log()`, lädt alle Manager-Klassen, `init()` auf WP-Hook `init` | WordPress 6.0+, PHP 8.0+ |
| `includes/class-block-manager.php` | Automatische Block-Discovery und Registrierung | `register_blocks()`, `scan_block_directories()` (Transient-Cache), `register_single_block()`, `register_block_assets_from_build()` (Dev-Modus über `build/`), `render_dynamic_block()`, `get_available_blocks()`, Konstante `DISCOVERY_CACHE_KEY = 'modular_blocks_dir_cache'` (12 h) | `modular-blocks-plugin.php` |
| `includes/class-admin-manager.php` | Admin-UI unter Einstellungen → Modulare Blöcke | `admin_page_callback()`, `ajax_toggle_block()`, `ajax_create_block()`, `ajax_delete_block()`, `ajax_upload_block()` (entpackt Block-ZIPs, leitet Zielordner aus `block.json` → `name` ab, invalidiert Discovery-Cache), `ajax_clear_cache()` | `class-block-manager.php` |
| `includes/class-diagnostics.php` | Diagnoseseite im Admin (Umgebung, Blockstatus) | `get_diagnostics()`, `render_diagnostics_page()` | – |
| `includes/class-webapp-manager.php` | Verwaltung eingebetteter Web-Apps | `get_webapps_dir()`, `get_webapps_url()`, `init_webapps_directory()` | – |
| `includes/class-iframe-whitelist-manager.php` | URL-Whitelist für den Block `iframe-whitelist` | `get_whitelist()`, `save_whitelist()`, `add_entry()`, `is_url_whitelisted()`, `get_matching_entry()`, Option `modular_blocks_iframe_whitelist` | Block `iframe-whitelist` |
| `includes/class-chemviz-enqueue.php` | Bedingtes Laden der ChemViz-Bibliotheken | `enqueue_chemviz_assets()`, `has_chemviz_blocks()` (nutzt `has_block()`), CDN-Fallback | `assets/js/vendor/` |
| `includes/class-chemviz-shortcodes.php` | Shortcodes `[chemviz_molecule]`, `[chemviz_chart]` | `molecule_viewer_shortcode()`, `chart_shortcode()` (letzterer außer Funktion, siehe CLAUDE.md) | ChemViz-Blöcke |
| `webpack.config.js` | Build-Konfiguration: erzeugt automatisch je Block einen Entry für `index.js` und `view.js` | Ausgabe nach `build/blocks/<slug>/`; `style.css` → `style-index.css`, `editor.css` → `index.css` | `@wordpress/scripts` |
| `create-block-zips.js` | Erzeugt pro Block ein eigenes ZIP in `plugin-zips/` (Standard-Auslieferungsweg) | validiert `block.json` und Build-Dateien; packt Build-Artefakte + `block.json`, `render.php`, `editor.css`, `style.css` | `build/blocks/`, `archiver` |
| `create-empty-plugin-zip.js` | Erzeugt das leere Plugin-Grundgerüst (einmalige Installation) | – | – |
| `create-zip.js`, `create-custom-plugin-zip.js`, `verify-zip.js` | Ältere/alternative ZIP-Skripte; **nicht** für die reguläre Auslieferung verwenden (`npm run plugin-zip` ist deprecated) | – | – |
| `debug-capabilities.php` | Hilfsskript zur Prüfung von Benutzerrechten | – | – |
| `package.json` | npm-Skripte und Abhängigkeiten | `build`, `start`, `lint:js`, `lint:css`, `block-zips`, `download-libs`; Version 1.1.8 | Node 16+, npm 7+ |
| `assets/css/blocks.css` | Globale Block-Styles (wird immer geladen, wenn vorhanden) | **Bewusst OHNE Dunkelmodus** (seit 2026-08-16): Ein `@media (prefers-color-scheme: dark)`-Block setzte `--modular-blocks-text` auf `#ffffff` — das Theme folgt dem Systemdesign aber nicht und bleibt weiß, Ergebnis war weiße Schrift auf weißem Grund. Die Begründung steht als Kommentar in der Datei; **nicht wieder einbauen**, ein Dunkelmodus muss vom Theme ausgehen. Der weite Selektor `[class*="content"]` trägt seit demselben Datum die Ausnahme `:not([class*="cbd-"])`, weil er sonst `.cbd-latex-content` des CDB-Plugins mitfärbt | – |
| `assets/js/chart-templates.js` | Vordefinierte Chemie-Diagrammvorlagen (Titration, Kinetik, Phasendiagramme, IR, Lineweaver-Burk) | – | Plotly.js |
| `assets/js/vendor/` | Sammelzeile: lokale Fremdbibliotheken (`3Dmol-min.js`, `plotly-2.27.1.min.js`, `imagetracer.js`) – aus DSGVO-Gründen lokal statt CDN | – | – |
| `assets/structures/` | Sammelzeile: Beispiel-Molekülstrukturen (`water.pdb`, `ethanol.pdb`) | – | – |
| `build/` | Sammelzeile: generierte Build-Artefakte – **nicht manuell bearbeiten**, entsteht durch `npm run build` | – | `webpack.config.js` |
| `plugin-zips/` | Sammelzeile: erzeugte Auslieferungs-ZIPs – Ausgabeartefakte, nicht bearbeiten | – | `create-block-zips.js` |
| `CLAUDE.md` | Architektur- und Arbeitsdokumentation des Plugins (Konventionen, Blockliste, Warnabschnitte zu Theme-Farben und iframe-Sandbox) | – | – |
| `BLOCK-DEVELOPMENT.md` | Leitfaden für die Entwicklung neuer Blöcke mit Beispielen | – | – |
| `PLAN-accordion-block.md` | Projektplan für den Accordion-Block (Phasen, Arbeitspakete, Status, Testprotokoll) | – | – |
| `reference_file_map.md` | Diese Datei-Map | – | – |
| `README.md` | Kurzbeschreibung und Installationshinweise des Plugins | – | – |
| `CHEMVIZ_INTEGRATION.md` | Dokumentation der ChemViz-Integration (3Dmol.js, Plotly.js) | – | – |
| `chemviz-entwicklungsplan.md` | Historischer Entwicklungsplan der ChemViz-Blöcke | – | – |
| `BUILD_SUCCESS.md` | Notiz zu einem abgeschlossenen Build/Meilenstein (historisch) | – | – |
| `package-lock.json` | Sammelzeile: npm-Abhängigkeitsbaum, generiert – nicht manuell bearbeiten | – | `package.json` |

## Blöcke

Jeder Block liegt autark in `blocks/<Ordner>/` und wird automatisch entdeckt, sobald eine `block.json` vorhanden ist.

| Block-Ordner | Blockname | Zweck | Dateien |
|---|---|---|---|
| `drag-and-drop` | `modular-blocks/drag-and-drop` | Interaktive Drag-&-Drop-Aufgaben mit Bild- oder Text-Elementen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `h5p-import.php` (H5P-Import, wird von der Plugin-Hauptdatei geladen) |
| `drag-the-words` | `modular-blocks/drag-the-words` | Lückentexte mit per Drag & Drop einzusetzenden Wörtern | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `iframe-whitelist` | `modular-blocks/iframe-whitelist` | Externe Websites sicher einbetten (nur Whitelist-URLs, ohne `sandbox`-Attribut) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`; zusätzlich liegen lokal nicht versionierte Build-Artefakte im Ordner (`index.css`, `style-index.css`, `*.asset.php` – per `.gitignore` ausgeschlossen) |
| `image-comparison` | `modular-blocks/image-comparison` | Zwei Bilder mit interaktivem Schieberegler vergleichen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `editor.css.backup` |
| `image-overlay` | `modular-blocks/image-overlay` | Bild mit interaktiven Informations-Ebenen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`; zusätzlich lokal nicht versionierte `*.asset.php` aus dem Build |
| `interactive-data-chart` | `modular-blocks/interactive-data-chart` | Dateneingabe im Frontend mit automatischer Diagramm-Generierung (Plotly.js) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `molecule-viewer` | `modular-blocks/molecule-viewer` | 3D-Visualisierung von Molekülen (3Dmol.js; PDB, PubChem, SMILES, AlphaFold) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `multiple-choice` | `modular-blocks/multiple-choice` | Multiple-Choice-Fragen mit Bewertung und Feedback | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `point-of-interest` | `modular-blocks/point-of-interest` | Anklickbare Hotspots auf Bildern | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `IMPROVEMENT-PLAN.md` |
| `statement-connector` | `modular-blocks/statement-connector` | Aussagen per Drag & Drop richtig verbinden | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `statement-summary` | `modular-blocks/statement-summary` | Lernende wählen richtige Aussagen, die eine Zusammenfassung bilden (statischer Block, **kein** `render.php`) | `block.json`, `index.js`, `view.js`, `style.css`, `editor.css` |
| `summary-block` | `modular-blocks/summary-block` | Summary-Quiz im H5P-Stil mit Gruppen, PDF-Ausgabe | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `svg-drawing` | `modular-blocks/svg-drawing` | Zeichenfläche, auch für Zeichnungen aus OneNote/Zwischenablage (**kein** `view.js`) | `block.json`, `index.js`, `render.php`, `style.css`, `editor.css` |
| `accordion` | `modular-blocks/accordion` | Klappzeilen aus normalem Inhalt: Jede Überschrift der eingestellten Ebene beginnt im Frontend eine aufklappbare Zeile. **Ein** Block, kein Kind-Block | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |

## Accordion-Block im Detail

**Ein einziger Block, überschriftengesteuert.** Der früher hier beschriebene Kind-Block `modular-blocks/accordion-row` existiert nicht mehr (Verzeichnis `blocks/accordion-row/` ist entfallen); wer noch darauf verweist, liest eine überholte Fassung.

Der Editor nimmt in der InnerBlocks-Zone beliebige Blöcke auf. `render.php` gibt sie als **flache Folge** gerenderter Blöcke (`<h3>`, `<p>`, `<ul>` …) innerhalb von `.mb-accordion__content` aus. Erst `view.js` gruppiert diese Folge zur Laufzeit im Browser: Jede Überschrift der eingestellten Ebene (`headingLevel`, 2–5) eröffnet eine Zeile, alle folgenden Knoten bis zur nächsten solchen Überschrift wandern in deren Panel. `save()` gibt **ausschließlich** `<InnerBlocks.Content />` ohne Wrapper zurück, damit das sichtbare Markup allein in `render.php` entsteht und spätere Markup-Änderungen keine Block-Validierungsfehler in bestehenden Seiten auslösen.

**Optionale Fremd-Schnittstelle:** Ist das Plugin „Container Block Designer" aktiv, stellt es `window.cbdRenderLatex(root)` bereit (`Promise<number>`, löst nach `document.fonts.ready` auf). `view.js` ruft die Funktion nach dem Aufklappen mit dem Panel als Wurzel auf und misst dessen Höhe erst danach – in einem versteckten Panel rendert KaTeX ohne die echten Webfonts, jede Messung träfe die Ersatzschrift. Der Aufruf ist **immer** mit `typeof … === 'function'` abgesichert; fehlt die Funktion, verhält sich das Accordion wie bisher.

| Datei | Zweck | Wichtige Funktionen/Inhalte | Hängt ab von |
|---|---|---|---|
| `blocks/accordion/block.json` | Metadaten | `apiVersion 3`, Kategorie `modular-blocks`, Icon `excerpt-view`, Attribute `allowMultiple`, `openFirst`, `showNumbering`, `showExpandAll`, `headingLevel` (Vorgabe 3), `supports.align` (wide/full) + `spacing`, Assets `index.js`/`view.js`/`index.css`/`style-index.css` | Webpack-Build (`build/blocks/accordion/`) |
| `blocks/accordion/index.js` | Editor-Registrierung | `edit` mit `useBlockProps` + `InnerBlocks` (`templateLock: false`, **kein** `allowedBlocks`, Vorlage Überschrift/Absatz ×2, `ButtonBlockAppender`), Inspector (Überschriftenebene, Mehrfachöffnung, erste Zeile offen, Nummerierung, Steuerleiste), Knopf „Zeile hinzufügen", Anzeige der erkannten Zeilenzahl; `changeHeadingLevel()` schreibt vorhandene Zeilenüberschriften auf die neue Ebene um; `save` nur `InnerBlocks.Content`; `deprecated: []` als vorbereiteter Migrationspunkt | `block.json`, `editor.css`, `style.css` |
| `blocks/accordion/render.php` | Frontend-Wrapper | Wrapper über `get_block_wrapper_attributes()` mit Klasse `mb-accordion` (+ `align*`, `is-numbered`) und den `data-*`-Attributen für view.js (Modi, `heading-level`, Farben aus `get_theme_mod()`); optionale Steuerleiste `.mb-accordion__controls` (serverseitig `hidden`, view.js blendet sie ein); `.mb-accordion__content` gibt `$block_content` unescaped aus; bei leerem Inhalt Hinweis ausschließlich für `current_user_can('edit_posts')` | Attribute, gerendertes Inner-Block-HTML in `$block_content` |
| `blocks/accordion/view.js` | Frontend-Logik (baut die Zeilen) | `buildRows()` iteriert über **`content.childNodes`** (nicht `children` – nackte Textknoten aus aufgespaltenen Absätzen gingen sonst verloren; reiner Leerraum bleibt liegen), `openRow`/`closeRow` mit Höhenanimation (`animateHeight`, `measureContentHeight`), `isRowOpen()` als einzige Zustandsquelle, Exklusivmodus, Steuerleiste, Tastaturnavigation, Hover-Farben, Deep-Linking über `applyHash()`, `MutationObserver` für nachgeladene Inhalte; `renderLatexAndRemeasure()` + `refreshOpenHeight()` ziehen die Höhe nach dem Formelrendern nach, zusätzlich einmalig nach `document.fonts.ready` | Markup aus `render.php`; **optional** `window.cbdRenderLatex` (CDB-Plugin) |
| `blocks/accordion/style.css` | Frontend-Styling | `.mb-accordion` (Rahmen, `overflow: hidden`), Zeilen/Kopf/Titel/Chevron, Panel (polsterlos, animierbar) mit Polster-Wrapper `.mb-accordion-row__panel-inner` (`overflow-x: auto` für überbreite Formeln/Tabellen), Nummerierung per CSS-Counter, Kontrast-Regeln gegen `assets/css/blocks.css`, Regeln für Druck und Bewegungsreduktion, Display-Formeln im Zeilenkopf auf `inline-block`. **Seit 2026-08-21 folgt die Datei dem Farbschema der Website:** Die sieben zuvor fest einprogrammierten Hexwerte (Rahmen, Fokusrahmen, Textfarbe, heller Hintergrund) laufen über `--color-sidebar-border`, `--color-special-text`, `--color-text-primary` und `--color-background-light` mit denselben Werten als Rückfall — sie entsprachen zufällig genau den Standardfarben, weshalb das Accordion einer Customizer-Änderung nur zur Hälfte gefolgt wäre (die Zeilenköpfe holen ihre Farben über `render.php` → `data-color-*` → `view.js`). **Offener und überfahrener Zeilenkopf tragen den plastischen Look** der Icon-Kacheln; geschlossene Zeilen bleiben bewusst flach (heller Grund, und ein Stapel plastischer Bänder liest sich nicht mehr als Liste). Die Schichten sind **farbunabhängig** aus durchsichtigem Weiß und Schwarz gebaut, weil die Grundfarbe erst zur Laufzeit inline gesetzt wird — ein `color-mix()` auf einer CSS-Variablen träfe die falsche. Das trägt nur, solange `setHeaderColors()` in `view.js` ausschließlich die Langform `background-color` setzt; die Kurzform `background` würde die Schichten mitlöschen. Selektoren über `.mb-accordion-row__heading` mit Kindkombinatoren, sonst färbte eine äußere Zeile ein Accordion **im** Panel mit | Import in `index.js` → `build/.../style-index.css` |
| `blocks/accordion/editor.css` | Editor-Styling | gestrichelter Rahmen der InnerBlocks-Zone, Zeilenzähler `.mb-accordion-status-count`, Hervorhebung der Überschriften als Zeilenanfang, eigener Editor-Zähler `mb-accordion-editor-row` | Import in `index.js` → `build/.../index.css` |

## Pflegeregel

Jedes Arbeitspaket, das eine Datei anlegt, verschiebt oder wesentlich ändert, aktualisiert deren Zeile in dieser Map. Neue Blöcke bekommen eine Zeile in der Block-Tabelle. Generierte Verzeichnisse (`build/`, `plugin-zips/`, `node_modules/`) werden nicht einzeln gelistet, sondern nur als Sammelzeile.
