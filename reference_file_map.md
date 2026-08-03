# Datei-Map: Modulare Blöcke Plugin (Eigene WP Blocks)

_Stand: 2026-08-03_

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
| `assets/css/blocks.css` | Globale Block-Styles (wird immer geladen, wenn vorhanden) | – | – |
| `assets/js/chart-templates.js` | Vordefinierte Chemie-Diagrammvorlagen (Titration, Kinetik, Phasendiagramme, IR, Lineweaver-Burk) | – | Plotly.js |
| `assets/js/vendor/` | Sammelzeile: lokale Fremdbibliotheken (`3Dmol-min.js`, `plotly-2.27.1.min.js`, `imagetracer.js`) – aus DSGVO-Gründen lokal statt CDN | – | – |
| `assets/structures/` | Sammelzeile: Beispiel-Molekülstrukturen (`water.pdb`, `ethanol.pdb`) | – | – |
| `build/` | Sammelzeile: generierte Build-Artefakte – **nicht manuell bearbeiten**, entsteht durch `npm run build` | – | `webpack.config.js` |
| `plugin-zips/` | Sammelzeile: erzeugte Auslieferungs-ZIPs – Ausgabeartefakte, nicht bearbeiten | – | `create-block-zips.js` |
| `CLAUDE.md` | Architektur- und Arbeitsdokumentation des Plugins (Konventionen, Blockliste, Warnabschnitte zu Theme-Farben und iframe-Sandbox) | – | – |
| `BLOCK-DEVELOPMENT.md` | Leitfaden für die Entwicklung neuer Blöcke mit Beispielen | – | – |
| `PLAN-accordion-block.md` | Projektplan für den Accordion-Block (Phasen, Arbeitspakete, Status, Testprotokoll) | – | – |
| `reference_file_map.md` | Diese Datei-Map | – | – |

## Blöcke

Jeder Block liegt autark in `blocks/<Ordner>/` und wird automatisch entdeckt, sobald eine `block.json` vorhanden ist.

| Block-Ordner | Blockname | Zweck | Dateien |
|---|---|---|---|
| `drag-and-drop` | `modular-blocks/drag-and-drop` | Interaktive Drag-&-Drop-Aufgaben mit Bild- oder Text-Elementen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `h5p-import.php` (H5P-Import, wird von der Plugin-Hauptdatei geladen) |
| `drag-the-words` | `modular-blocks/drag-the-words` | Lückentexte mit per Drag & Drop einzusetzenden Wörtern | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `iframe-whitelist` | `modular-blocks/iframe-whitelist` | Externe Websites sicher einbetten (nur Whitelist-URLs, ohne `sandbox`-Attribut) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` + eingecheckte Build-Artefakte (`index.css`, `style-index.css`, `*.asset.php`) |
| `image-comparison` | `modular-blocks/image-comparison` | Zwei Bilder mit interaktivem Schieberegler vergleichen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `editor.css.backup` |
| `image-overlay` | `modular-blocks/image-overlay` | Bild mit interaktiven Informations-Ebenen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` + `*.asset.php` |
| `interactive-data-chart` | `modular-blocks/interactive-data-chart` | Dateneingabe im Frontend mit automatischer Diagramm-Generierung (Plotly.js) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `molecule-viewer` | `modular-blocks/molecule-viewer` | 3D-Visualisierung von Molekülen (3Dmol.js; PDB, PubChem, SMILES, AlphaFold) | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `multiple-choice` | `modular-blocks/multiple-choice` | Multiple-Choice-Fragen mit Bewertung und Feedback | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `point-of-interest` | `modular-blocks/point-of-interest` | Anklickbare Hotspots auf Bildern | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`, `IMPROVEMENT-PLAN.md` |
| `statement-connector` | `modular-blocks/statement-connector` | Aussagen per Drag & Drop richtig verbinden | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `statement-summary` | `modular-blocks/statement-summary` | Lernende wählen richtige Aussagen, die eine Zusammenfassung bilden (statischer Block, **kein** `render.php`) | `block.json`, `index.js`, `view.js`, `style.css`, `editor.css` |
| `summary-block` | `modular-blocks/summary-block` | Summary-Quiz im H5P-Stil mit Gruppen, PDF-Ausgabe | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `svg-drawing` | `modular-blocks/svg-drawing` | Zeichenfläche, auch für Zeichnungen aus OneNote/Zwischenablage (**kein** `view.js`) | `block.json`, `index.js`, `render.php`, `style.css`, `editor.css` |
| `accordion` | `modular-blocks/accordion` | Eltern-Block: Container für aufklappbare Zeilen, standardmäßig nur eine Zeile offen | `block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css` |
| `accordion-row` | `modular-blocks/accordion-row` | Kind-Block: eine einzelne Accordion-Zeile (`parent: modular-blocks/accordion`). **Darf in Einstellungen → Modulare Blöcke nicht deaktiviert werden** – sonst zeigen alle Accordions im Editor ungültigen Inhalt | `block.json`, `index.js`, `render.php`, `style.css`, `editor.css` |

## Accordion-Block im Detail

Erster Block des Plugins mit InnerBlocks und Eltern-/Kind-Struktur (WordPress-Standardmuster analog `core/columns` + `core/column`). Beide Blöcke rendern serverseitig; `save()` gibt in beiden Fällen **ausschließlich** `<InnerBlocks.Content />` ohne Wrapper zurück, damit das sichtbare Markup allein in `render.php` entsteht und spätere Markup-Änderungen keine Block-Validierungsfehler in bestehenden Seiten auslösen.

| Datei | Zweck | Wichtige Funktionen/Inhalte | Hängt ab von |
|---|---|---|---|
| `blocks/accordion/block.json` | Metadaten des Eltern-Blocks | `apiVersion 3`, Kategorie `modular-blocks`, Icon `excerpt-view`, `supports.align` (wide/full) + `spacing`, Assets `index.js`/`view.js`/`index.css`/`style-index.css` | Webpack-Build (`build/blocks/accordion/`) |
| `blocks/accordion/index.js` | Editor-Registrierung des Eltern-Blocks | `edit` mit `useBlockProps` + `InnerBlocks` (`ALLOWED_BLOCKS = ['modular-blocks/accordion-row']`, `TEMPLATE` mit 3 Zeilen, `templateLock: false`, `orientation: vertical`, `ButtonBlockAppender`); `save` nur `InnerBlocks.Content`; `deprecated: []` als vorbereiteter Migrationspunkt | `block.json`, `editor.css`, `style.css`; Kind-Block nur per Namens-String |
| `blocks/accordion/render.php` | Frontend-Wrapper des Eltern-Blocks | Wrapper über `get_block_wrapper_attributes(['class' => 'mb-accordion'])`, gibt `$block_content` unescaped aus; bei leerem Inhalt Hinweis ausschließlich für `current_user_can('edit_posts')` (Diagnose bei fehlendem Kind-Block) | gerendertes Kind-Block-HTML in `$block_content` |
| `blocks/accordion/view.js` | Frontend-Interaktivität des Accordions | derzeit Platzhalter-IIFE; Auf-/Zuklapplogik, Exklusivmodus, Deep-Linking folgen in AP-3.2 | Markup-Vertrag aus `accordion-row/render.php` |
| `blocks/accordion/style.css` | Frontend-Grundstyling des Containers | `.mb-accordion` (Abstand, Rahmen `#e0e0e0`, `border-radius`, `overflow: hidden`) | Import in `index.js` → `build/.../style-index.css` |
| `blocks/accordion/editor.css` | Editor-Styling des Containers | gestrichelter Rahmen zur Erkennbarkeit der InnerBlocks-Zone | Import in `index.js` → `build/.../index.css` |
| `blocks/accordion-row/block.json` | Metadaten des Kind-Blocks | `parent: ["modular-blocks/accordion"]`, Attribut `title` (string), `supports.anchor: true` (HTML-Anker für Deep-Linking), `reusable: false`, **kein** `viewScript`; Beschreibung beginnt mit dem Deaktivierungsverbot | Eltern-Block per Namens-String |
| `blocks/accordion-row/index.js` | Editor-UI der Zeile | `edit` mit `RichText`-Titel (`allowedFormats`: bold/italic) und `InnerBlocks templateLock={false}` ohne `allowedBlocks` (Zeilen nehmen beliebige Blöcke auf); `save` nur `InnerBlocks.Content`, Titel wird nicht gespeichertes Markup; `deprecated: []` | `block.json`, `editor.css`, `style.css` |
| `blocks/accordion-row/render.php` | Frontend-Markup der Zeile | Kopf als echtes `<button type="button">` mit `aria-expanded`/`aria-controls`, Panel mit `role="region"`/`aria-labelledby`; IDs aus `wp_unique_id('mb-accordion-header-')` und `wp_unique_id('mb-accordion-panel-')`; HTML-Anker per `sanitize_html_class()` als `id` an `get_block_wrapper_attributes()`; Titel über `wp_kses_post()` mit Fallback „Ohne Titel"; `$block_content` unescaped | Attribute `title`/`anchor`, `$block_content` |
| `blocks/accordion-row/style.css` | Frontend-Grundstyling der Zeile | `.mb-accordion-row` (Trennlinie, letzte Zeile ohne), `.mb-accordion-row__header`, `__title`, `__icon`, `__panel` | Import in `index.js` → `build/.../style-index.css` |
| `blocks/accordion-row/editor.css` | Editor-Styling der Zeile | Karten-Optik, Kopfzeile als Flex-Container, Platzhalter-Stil für leeren Titel | Import in `index.js` → `build/.../index.css` |

## Pflegeregel

Jedes Arbeitspaket, das eine Datei anlegt, verschiebt oder wesentlich ändert, aktualisiert deren Zeile in dieser Map. Neue Blöcke bekommen eine Zeile in der Block-Tabelle. Generierte Verzeichnisse (`build/`, `plugin-zips/`, `node_modules/`) werden nicht einzeln gelistet, sondern nur als Sammelzeile.
