# Datei-Map: Modulare Blöcke Plugin (Eigene WP Blocks)

_Stand: 2026-08-24_

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
| `assets/css/blocks.css` | Globale Block-Styles (wird immer geladen, wenn vorhanden) | **Der frühere `@media (prefers-color-scheme: dark)`-Versuch (2026-08-16) bleibt als warnender Kommentar erhalten, ist aber überholt:** Er setzte `--modular-blocks-text` auf `#ffffff` und folgte damit blind dem Systemdesign — Ergebnis war weiße Schrift auf weißem Grund, weil das Theme dem System nicht folgte. **Seit AP-3.1 (PLAN-Darkmode-Umschaltung.md, 2026-08-24) gibt es einen NEUEN, korrekten `[data-theme="dark"]`-Block** direkt nach diesem Warn-Kommentar — der Unterschied: `data-theme` wird ausschließlich durch einen expliziten Klick auf den Toggle-Button gesetzt (`Theme/header.php`), nie durch die Systemeinstellung, daher kein Wiedereinbau des alten Fehlers. Fast alle Flächen ziehen bereits automatisch über bestehende `var(--color-x, ...)`-Kopplungen mit; einziger ergänzter Sonderfall sind die zwei fest verdrahteten `rgba(0,0,0,...)`-Kartenschatten (`--modular-blocks-shadow`, `--modular-blocks-shadow-hover`), die im Dark-Block auf `var(--color-border, #dcdcde)` umgestellt wurden (dieselbe Kopplung wie `--modular-blocks-border`). Der weite Selektor `[class*="content"]` trägt seit 2026-08-16 die Ausnahme `:not([class*="cbd-"])`, weil er sonst `.cbd-latex-content` des CDB-Plugins mitfärbt. **Seit AP-3.14 (2026-08-24) durchgehend variablenbasiert:** Die sechs lokalen Token `--modular-blocks-primary/-primary-hover/-secondary/-text/-text-light/-border` verweisen jetzt per `var(--color-ui-surface/-ui-surface-dark/-background-light/-text-primary/-text-muted/-border, <alter Wert>)` auf die Theme-Variablen (bisheriger Wert bleibt Fallback); die Kartenfläche folgt `var(--color-background, #ffffff)`. Zwei Ausnahmen bleiben bewusst literal: Button-Textfarbe `#ffffff` (Text auf farbigem Button, keine Kopplung an `--color-background` – sonst bei künftigem Darkmode unlesbar, Präzedenzfall AP-3.6). **Button-Selektor-Fix (derselbe AP, Fund aus AP-3.5.fix1 vom 2026-08-24):** Der frühere Teilstring-Selektor `[class*="wp-block-modular-blocks"] [class*="button"]` traf versehentlich auch block-eigene Elemente mit „button" im Klassennamen, die keine echten Aktions-Buttons sind (Beleg: `.slider-button` in `image-comparison`, siehe dessen Zeile unten). Ersetzt durch den bereits vorhandenen `.button`-Klassenselektor bzw. ersatzlos gestrichen, wo `.modular-block-button` (bereits Teil derselben Selektorliste) redundant gewesen wäre – live verifiziert: `.slider-button` folgt jetzt `--color-ui-surface`, echte Buttons (`summary-button`, `chemviz-viewer__button`) blieben unverändert korrekt gefärbt | – |
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

**CSS-Variablen-Umstellung (Phase 3, `PLAN-CSS-Variablen-Darkmode.md`,
AP-3.0–3.14 + Review AP-3.rev/AP-3.rev.fix1, abgeschlossen 2026-08-24):**
Alle 14 Bildungsblöcke sowie `assets/css/blocks.css` sind auf
Theme-CSS-Variablen umgestellt. Details je Block/AP in den jeweiligen
Übergabenotizen in `PLAN-CSS-Variablen-Darkmode.md` – hier nur die für
künftige Arbeit relevante Kurzfassung. Zwei Muster kamen zum Einsatz:

**Muster A – Custom-Property-Wrapper** (`accordion`, `iframe-whitelist`,
`molecule-viewer`, `summary-block` – AP-3.0–3.3): Der frühere
Anti-Pattern-Fund (`get_theme_mod()`-Wert als hartkodierter Hex-Wert direkt
im Inline-Style von Buttons, siehe `CLAUDE.md` „Buttons mit Theme-Farben")
wurde durch das an `accordion` gespikte (AP-3.0) und auf einer
Produktivseite mit voller Stylesheet-Ladereihenfolge (Theme + CDB-Designer
+ Eigene WP Blocks) live bestätigte Muster ersetzt: `get_theme_mod()`-Werte
landen als Custom-Properties (`--mb-accordion-*`, `--iw-*`, `--mv-*`,
`--sb-*`) im `style`-Attribut des äußeren Block-Wrappers, `style.css`
referenziert sie per `var(--x, #fallback)`. `block.json` registriert bei
diesen vier Blöcken `style-index.css` (Webpack-Build-Artefakt, per
`.gitignore` nicht versioniert) statt `style.css` direkt – eine Änderung an
`style.css` wird erst nach `npm run build` sichtbar. Details/Testnachweis
siehe `CLAUDE.md`, Abschnitt „Buttons mit Theme-Farben".

**Muster B – direkte `var()`-Kopplung lokaler Token-Layer bzw.
verbleibender Rest-Hex-Werte** (kein Anti-Pattern-Fund, kein eigenes
Wrapper-Custom-Property nötig):
- `drag-and-drop` (AP-3.4): Token-Layer `--dd-*` gekoppelt; Content-Fallback
  `$drag_color`/`$zone_border` in `render.php` auf `get_theme_mod()`
  umgestellt – siehe „Strukturelle Falle bei Content-Fallbacks" unten.
- `image-comparison` (AP-3.5/AP-3.5.fix1/AP-3.rev.fix1): siehe eigener
  Absatz unten – Sonderfall mit mehrstufiger Korrektur.
- `image-overlay` (AP-3.6): Token-Layer war bereits vorher gekoppelt, Rest-
  Hex + Content-Fallback ergänzt. `$layer_color` bleibt toter Code
  (berechnet, aber nirgends ausgegeben) – nicht behoben, außerhalb Scope.
- `point-of-interest` (AP-3.7): 5 CSS-Weißwerte auf
  `var(--color-background, #fff)` umgestellt, live bestätigt (kein
  Live-Content vorhanden, nur Verwendung des Musters geprüft). Enthält
  zusätzlich die unten beschriebenen vertauschten Variablennamen; Content-
  Fallback für Hotspot-/Legendenfarbe strukturell wie `drag-and-drop`
  eingeschränkt (siehe unten).
- `multiple-choice` (AP-3.8): Token-Layer `--primary-color`/`--primary-hover`
  auf `var(--color-ui-surface, …)`/`var(--color-ui-surface-dark, …)`.
- `statement-summary` (AP-3.9): lokale `:root`-Redefinition entfernt statt
  umgestellt – siehe eigener Absatz unten.
- `interactive-data-chart` (AP-3.10): nur UI-Chrome (Rahmen, Hintergrund,
  Werkzeugleiste, Tabellenkopf, „Diagramm generieren"-Button) auf
  `--color-ui-surface`/`-ui-surface-dark`/`-background`/`-background-light`/
  `-sidebar-border` umgestellt; Plotly-Diagramm-Datenfarben aus
  `assets/js/chart-templates.js` bewusst unangetastet (Nicht-Ziel).
- `drag-the-words` (AP-3.11): 13 wertexakte Hex-Treffer umgestellt,
  `font-family` auf `var(--font-family-base, …)`. **Offener Fund, nicht
  behoben:** `block.json` registriert `"style": "file:./style-index.css"`,
  aber weder `index.js` noch `view.js` importieren `style.css` – Webpack
  erzeugt `style-index.css` dadurch nie (auch nicht in `build/`). Auf einer
  echten Produktivseite ohne lokalen `build/`-Ordner liefe die
  `style`-Registrierung ins Leere; vorbestehender Konfigurationsfehler,
  unabhängig von dieser CSS-Umstellung. Für ein Korrektur-AP vorgemerkt
  (`index.js`/`view.js` müsste `import './style.css';` ergänzen).
- `statement-connector` (AP-3.12): nur Content-Fallback in `render.php`
  (`$item_color` für `leftItems`/`rightItems`) auf `get_theme_mod()`
  umgestellt. Die dabei geschriebene `--item-color`-Inline-Property wird von
  keiner CSS-Datei referenziert (toter Code, 0 sichtbare Wirkung) – die
  tatsächliche Verbindungslinienfarbe liest `view.js` Zeile 82 direkt aus
  dem eingebetteten JSON, unabhängig davon.
- `svg-drawing` (AP-3.13): nur 1 von 4 UI-Chrome-Rest-Hex-Werten traf das
  Variablen-Vokabular wertexakt (`figcaption`-Textfarbe `#666` →
  `var(--color-text-muted, #666)`, live bestätigt); die übrigen 3
  (Platzhalter-Rahmen/-Hintergrund/-Text) blieben bewusst literal.
  Zeichenfarbpalette (Nutzerinhalt) unangetastet (Nicht-Ziel).
- `assets/css/blocks.css` (AP-3.14): siehe eigene Zeile oben unter „Kern und
  Infrastruktur" (Token-Layer-Kopplung + Button-Selektor-Fix).

**`image-comparison` im Detail (AP-3.5 → AP-3.5.fix1 → AP-3.rev.fix1,
mehrstufige Korrektur):** AP-3.5 stellte `--slider-color`/`--label-color` in
`style.css` auf `var(--color-ui-surface, …)` um, der Live-Test schlug aber
fehl: `block.json` trägt für `sliderColor`/`labelColor` eigene Defaults
(`#0073aa`/`#ffffff`), die WordPress vor `render.php` in die Attribute
einträgt – der `?? get_theme_mod()`-Fallback griff nie, UND `render.php`
schrieb den stets aufgelösten Wert als LITERALE Inline-Custom-Property auf
den Wrapper, die die CSS-`var()`-Kopplung vollständig überschrieb
(Inline-Styles gewinnen gegen Stylesheet-Regeln). **AP-3.5.fix1** behob das
strukturell: `render.php` setzt `--slider-color`/`--label-color` seither nur
noch inline, wenn der Attributwert vom bekannten `block.json`-Default
abweicht (echte Autoren-Anpassung, siehe `$slider_color_is_custom`/
`$label_color_is_custom` in `render.php`); entspricht er dem Default, bleibt
die Property ganz weg und `style.css`s `var()`-Kopplung greift ungehindert.
**AP-3.rev fand dabei einen zweiten, unabhängigen Fehler:** Die Zeile
`--label-color: var(--color-ui-surface, #ffffff)` in `style.css` war selbst
falsch – `--color-ui-surface` ist sitewide praktisch immer definiert
(Orange), der `#ffffff`-Fallback griff daher nie; der „Vorher"/„Nachher"-
Chip-Text war orange statt weiß (Kontrastfehler gegenüber dem
`block.json`-Default). **AP-3.rev.fix1** vereinfachte `--label-color` in
`style.css` deshalb bewusst auf den literalen Wert `#ffffff` – **keine**
Theme-Kopplung mehr, live bestätigt (`getComputedStyle` liefert
`rgb(255, 255, 255)`). `--slider-color` bleibt dagegen korrekt an
`--color-ui-surface` gekoppelt. Der PHP-seitige Autoren-Override aus
AP-3.5.fix1 funktioniert für beide Properties unverändert.

**Strukturelle Falle bei Content-Fallbacks (`drag-and-drop`,
`molecule-viewer`, `point-of-interest`, `statement-connector`):** Wo
`render.php` einen `get_theme_mod()`-Wert nur als PHP-Fallback für ein vom
Autor editierbares Block-Attribut nutzt (`$attr['x'] ?? get_theme_mod(...)`),
trägt `block.json` für dasselbe Attribut meist bereits einen eigenen
Hex-Default ein, den WordPress VOR `render.php` in die Attribute einträgt –
der Fallback greift dadurch bei unverändertem Standard-Content praktisch
nie. Nur bei `image-comparison` wurde das (AP-3.5.fix1, siehe oben)
tatsächlich behoben; bei `drag-and-drop` (AP-3.4), `molecule-viewer`
(AP-3.3, Attribut `backgroundColor`), `point-of-interest` (AP-3.7,
Hotspot-/Legendenfarbe) und `statement-connector` (AP-3.12, `--item-color`,
ohnehin toter Code) ist es weiterhin nur als Randbefund dokumentiert (kein
Kernziel des jeweiligen APs, siehe deren Übergabenotizen) – Übertragung des
AP-3.5.fix1-Musters wäre ein eigenes künftiges Korrektur-AP wert.

**Nachtrag AP-3.9 (`statement-summary`):** Die entfernte lokale Redefinition
war ein `:root { --color-ui-surface: #e24614; … }`-Block – da `:root` stets
das Dokument-Root trifft, nicht nur den Block, konnte das je nach
Ladereihenfolge sogar die Customizer-Werte für die **gesamte Seite**
überschreiben, nicht nur innerhalb dieses Blocks. Zusätzlicher Fund dabei:
zwei der acht redefinierten Namen waren keine echten Namenskollisionen,
sondern Tippfehler mit vertauschter Wortstellung gegenüber den echten
Theme-Variablen – `--color-primary-text` (statt `--color-text-primary`)
und `--color-light-background` (statt `--color-background-light`). Bloßes
Entfernen des lokalen `:root`-Blocks hätte diese zwei Fälle als
undefinierte Custom Properties zurückgelassen; beide Namen wurden daher im
gesamten Block auf die echten Theme-Namen korrigiert. **Derselbe
Tippfehler existiert auch in `blocks/point-of-interest/style.css`**
(bereits `var(--color-primary-text, #333333)` /
`var(--color-light-background, #f8f9fa)`, dort aber mit Fallback-Syntax
statt lokaler Redefinition) – dort greift die Kopplung an die echte
Theme-Variable dadurch nie, der Block läuft dauerhaft auf dem Fallback-Wert.
`point-of-interest` gilt laut Statustabelle als AP-3.7 bereits ☑ erledigt;
dieser Fund ist also ein **neuer, eigenständiger Nachtrag außerhalb des
AP-3.9-Scopes**, keine Umsetzung – vermutlich ein kleines künftiges
Korrektur-AP wert.

**Darkmode-Kontrastkorrekturen (`PLAN-Darkmode-Umschaltung.md`, Phase 3,
AP-3.1/AP-3.2, abgeschlossen 2026-08-24):** Aufbauend auf der oben
beschriebenen var()-Umstellung reichte die reine Variablenkopplung bei 8 der
14 sichtgeprüften Bildungsblöcke nicht für ausreichenden Kontrast im
Darkmode – gezielte `[data-theme="dark"]`-Zusatzregeln wurden in den
folgenden `style.css`-Dateien ergänzt (Lightmode jeweils unverändert, kein
Canvas-/3D-/Diagramm-Inhaltsbereich angefasst):
- `summary-block/style.css` – Aktions-Buttons/Token-Layer, 1 Fehler behoben.
- `drag-and-drop/style.css` – Token-Layer/Buttons, 3 Stellen behoben; vom
  Autor gewählte Zonenfarben (Inhalt) unangetastet.
- `image-overlay/style.css` – Layer-Buttons/Container-Hintergrund, 1 Fehler
  behoben.
- `point-of-interest/style.css` – Hotspot-/Legenden-Marker, 1 Fehler
  behoben; zusätzlich 2 vorbestehende Tippfehler-Variablennamen korrigiert
  (Fallback-Werte identisch zum echten Lightmode-Wert, keine optische
  Änderung).
- `multiple-choice/style.css` – zentraler Fragetext war im Darkmode
  unlesbar (schwerwiegendster Fund), behoben.
- `statement-summary/style.css` – Token-Layer/Zustandsfarben, 1 Fehler
  behoben.
- `drag-the-words/style.css` – umfangreichster Fund: 3
  `var(--color-background, #fff)`-Fehlnutzungen auf `--color-text-on-accent`
  korrigiert (Nachbesserung nach AP-3.rev-Befund 1) plus mehrere
  `[data-theme="dark"]`-Ergänzungen für Grundtext-/Statusfarben; der feste
  Chip-Hintergrund `#0073aa` bleibt bewusst literal (nie variablengekoppelt,
  kein Verstoß gegen die var()-Konvention). Siehe Absatz „Paketierungsbug
  `drag-the-words` behoben" unten – die Darkmode-Korrekturen dieser Datei
  werden inzwischen tatsächlich ausgeliefert.
- `interactive-data-chart/style.css` – nur der Titel (UI-Chrome), 1 Fehler
  behoben; Plotly-Diagramm-Datenfarben aus `assets/js/chart-templates.js`
  unangetastet (Nicht-Ziel).

Die übrigen 6 geprüften Blöcke (`accordion`, `iframe-whitelist`,
`molecule-viewer`, `image-comparison`, `statement-connector`,
`svg-drawing`) hatten keinen Darkmode-Kontrastfehler. Details je Fund in
`PLAN-Darkmode-Umschaltung.md`, AP-3.2-Übergabenotiz; die Datei
`assets/css/blocks.css` selbst ist bereits oben unter „Kern und
Infrastruktur" dokumentiert (AP-3.1).

**Paketierungsbug `drag-the-words` behoben (außerhalb von
`PLAN-Darkmode-Umschaltung.md`, 2026-08-24):** Als Nebenbefund von AP-3.2
stellte sich heraus, dass `block.json` `"style": "file:./style-index.css"`
deklariert, aber weder `index.js` noch `view.js` `style.css` importierten –
das Frontend-CSS des Blocks (inkl. der obigen Darkmode-Korrekturen) wurde
dadurch in einer regulär gebauten Produktivinstallation nie ausgeliefert
(vorbestehender, von diesem Vorhaben unabhängiger Fehler, siehe auch den
älteren, noch offen dokumentierten Fund zu `drag-the-words` weiter oben unter
„Muster B – AP-3.11", der sich auf dieselbe Ursache bezieht und im Rahmen
dieses APs bewusst nicht angepasst wird). Der Orchestrator hat den Bug im
Anschluss an AP-3.2, als eigenständige, außerhalb dieses Plans liegende
Aufgabe, behoben: `import './style.css';` in `drag-the-words/index.js`
ergänzt sowie einen dabei aufgedeckten, unabhängigen Kommentar-Bug in
`style.css` (ein vorzeitig endender CSS-Kommentar brach den
Produktions-Build) korrigiert. `npm run build` danach erfolgreich, live auf
dem Testserver verifiziert.

## Accordion-Block im Detail

**Ein einziger Block, überschriftengesteuert.** Der früher hier beschriebene Kind-Block `modular-blocks/accordion-row` existiert nicht mehr (Verzeichnis `blocks/accordion-row/` ist entfallen); wer noch darauf verweist, liest eine überholte Fassung.

Der Editor nimmt in der InnerBlocks-Zone beliebige Blöcke auf. `render.php` gibt sie als **flache Folge** gerenderter Blöcke (`<h3>`, `<p>`, `<ul>` …) innerhalb von `.mb-accordion__content` aus. Erst `view.js` gruppiert diese Folge zur Laufzeit im Browser: Jede Überschrift der eingestellten Ebene (`headingLevel`, 2–5) eröffnet eine Zeile, alle folgenden Knoten bis zur nächsten solchen Überschrift wandern in deren Panel. `save()` gibt **ausschließlich** `<InnerBlocks.Content />` ohne Wrapper zurück, damit das sichtbare Markup allein in `render.php` entsteht und spätere Markup-Änderungen keine Block-Validierungsfehler in bestehenden Seiten auslösen.

**Optionale Fremd-Schnittstelle:** Ist das Plugin „Container Block Designer" aktiv, stellt es `window.cbdRenderLatex(root)` bereit (`Promise<number>`, löst nach `document.fonts.ready` auf). `view.js` ruft die Funktion nach dem Aufklappen mit dem Panel als Wurzel auf und misst dessen Höhe erst danach – in einem versteckten Panel rendert KaTeX ohne die echten Webfonts, jede Messung träfe die Ersatzschrift. Der Aufruf ist **immer** mit `typeof … === 'function'` abgesichert; fehlt die Funktion, verhält sich das Accordion wie bisher.

| Datei | Zweck | Wichtige Funktionen/Inhalte | Hängt ab von |
|---|---|---|---|
| `blocks/accordion/block.json` | Metadaten | `apiVersion 3`, Kategorie `modular-blocks`, Icon `excerpt-view`, Attribute `allowMultiple`, `openFirst`, `showNumbering`, `showExpandAll`, `headingLevel` (Vorgabe 3), `supports.align` (wide/full) + `spacing`, Assets `index.js`/`view.js`/`index.css`/`style-index.css` | Webpack-Build (`build/blocks/accordion/`) |
| `blocks/accordion/index.js` | Editor-Registrierung | `edit` mit `useBlockProps` + `InnerBlocks` (`templateLock: false`, **kein** `allowedBlocks`, Vorlage Überschrift/Absatz ×2, `ButtonBlockAppender`), Inspector (Überschriftenebene, Mehrfachöffnung, erste Zeile offen, Nummerierung, Steuerleiste), Knopf „Zeile hinzufügen", Anzeige der erkannten Zeilenzahl; `changeHeadingLevel()` schreibt vorhandene Zeilenüberschriften auf die neue Ebene um; `save` nur `InnerBlocks.Content`; `deprecated: []` als vorbereiteter Migrationspunkt | `block.json`, `editor.css`, `style.css` |
| `blocks/accordion/render.php` | Frontend-Wrapper | Wrapper über `get_block_wrapper_attributes()` mit Klasse `mb-accordion` (+ `align*`, `is-numbered`) und den `data-*`-Attributen für view.js (Modi, `heading-level`, Farben aus `get_theme_mod()`); **seit AP-3.0 (2026-08-23, PLAN-CSS-Variablen-Darkmode.md)** schreibt der Wrapper zusätzlich ein `style`-Attribut mit den vier Custom-Properties `--mb-accordion-surface/-active/-hover/-text` (dieselben `get_theme_mod()`-Werte) – `style.css` referenziert `--mb-accordion-active` für die Steuerleisten-Buttons per `var()` statt eines früheren hartkodierten Inline-Hex-Werts an den Buttons selbst (Spike bestätigt: kein Override durch andere Stylesheets); die `data-color-*`-Attribute für die zeilenweise Färbung durch `view.js` bleiben unverändert bestehen; optionale Steuerleiste `.mb-accordion__controls` (serverseitig `hidden`, view.js blendet sie ein); `.mb-accordion__content` gibt `$block_content` unescaped aus; bei leerem Inhalt Hinweis ausschließlich für `current_user_can('edit_posts')` | Attribute, gerendertes Inner-Block-HTML in `$block_content` |
| `blocks/accordion/view.js` | Frontend-Logik (baut die Zeilen) | `buildRows()` iteriert über **`content.childNodes`** (nicht `children` – nackte Textknoten aus aufgespaltenen Absätzen gingen sonst verloren; reiner Leerraum bleibt liegen), `openRow`/`closeRow` mit Höhenanimation (`animateHeight`, `measureContentHeight`), `isRowOpen()` als einzige Zustandsquelle, Exklusivmodus, Steuerleiste, Tastaturnavigation, Hover-Farben, Deep-Linking über `applyHash()`, `MutationObserver` für nachgeladene Inhalte; `renderLatexAndRemeasure()` + `refreshOpenHeight()` ziehen die Höhe nach dem Formelrendern nach, zusätzlich einmalig nach `document.fonts.ready` | Markup aus `render.php`; **optional** `window.cbdRenderLatex` (CDB-Plugin) |
| `blocks/accordion/style.css` | Frontend-Styling | `.mb-accordion` (Rahmen, `overflow: hidden`), Zeilen/Kopf/Titel/Chevron, Panel (polsterlos, animierbar) mit Polster-Wrapper `.mb-accordion-row__panel-inner` (`overflow-x: auto` für überbreite Formeln/Tabellen), Nummerierung per CSS-Counter, Kontrast-Regeln gegen `assets/css/blocks.css`, Regeln für Druck und Bewegungsreduktion, Display-Formeln im Zeilenkopf auf `inline-block`. **Seit 2026-08-21 folgt die Datei dem Farbschema der Website:** Die sieben zuvor fest einprogrammierten Hexwerte (Rahmen, Fokusrahmen, Textfarbe, heller Hintergrund) laufen über `--color-sidebar-border`, `--color-special-text`, `--color-text-primary` und `--color-background-light` mit denselben Werten als Rückfall — sie entsprachen zufällig genau den Standardfarben, weshalb das Accordion einer Customizer-Änderung nur zur Hälfte gefolgt wäre (die Zeilenköpfe holen ihre Farben über `render.php` → `data-color-*` → `view.js`). **Offener und überfahrener Zeilenkopf tragen den plastischen Look** der Icon-Kacheln; geschlossene Zeilen bleiben bewusst flach (heller Grund, und ein Stapel plastischer Bänder liest sich nicht mehr als Liste). Die Schichten sind **farbunabhängig** aus durchsichtigem Weiß und Schwarz gebaut, weil die Grundfarbe erst zur Laufzeit inline gesetzt wird — ein `color-mix()` auf einer CSS-Variablen träfe die falsche. Das trägt nur, solange `setHeaderColors()` in `view.js` ausschließlich die Langform `background-color` setzt; die Kurzform `background` würde die Schichten mitlöschen. Selektoren über `.mb-accordion-row__heading` mit Kindkombinatoren, sonst färbte eine äußere Zeile ein Accordion **im** Panel mit. **Seit AP-3.0 (2026-08-23):** `.mb-accordion__control` (Steuerleisten-Buttons „Alle öffnen"/„Alle schließen") bezieht seine Hintergrundfarbe per `var(--mb-accordion-active, #e24614)` von der Custom-Property, die `render.php` inline auf den Wrapper schreibt – vorher ein pro Button hartkodierter Inline-Style aus `render.php` (siehe `CLAUDE.md`, Abschnitt „Buttons mit Theme-Farben", inzwischen für diesen einen Anwendungsfall überholt). **Diagnose-Nachtrag (AP-1.1, 2026-08-24, `PLAN-PDF-Notizen-und-Listenformeln.md`):** Die gemeldete weiße/unsichtbare LaTeX-Formel in Listen im Accordion-Panel ist **kein Fehler dieser Datei** — die Tag-Aufzählung um Zeile 235-244 (`h1..h6, p, li, blockquote`) deckt `li` bereits korrekt ab und gewinnt gemessen in beiden Fällen (Liste und Absatz). Die tatsächliche Ursache lag in `assets/css/blocks.css` (zu weit gefasster Selektor `[class*="content"]` ohne `:not([class*="cbd-"])`, überschrieb `.cbd-latex-content`s `color: inherit` direkt) und ist dort bereits seit 2026-08-16 behoben (Commits `b854060`, `a2737ff`). Vollständige Farbketten und Rekonstruktion: `Plugins/CDB-Designer/docs/diagnose-latex-listen-2026-08-24.md` | Import in `index.js` → `build/.../style-index.css` |
| `blocks/accordion/editor.css` | Editor-Styling | gestrichelter Rahmen der InnerBlocks-Zone, Zeilenzähler `.mb-accordion-status-count`, Hervorhebung der Überschriften als Zeilenanfang, eigener Editor-Zähler `mb-accordion-editor-row` | Import in `index.js` → `build/.../index.css` |

## Pflegeregel

Jedes Arbeitspaket, das eine Datei anlegt, verschiebt oder wesentlich ändert, aktualisiert deren Zeile in dieser Map. Neue Blöcke bekommen eine Zeile in der Block-Tabelle. Generierte Verzeichnisse (`build/`, `plugin-zips/`, `node_modules/`) werden nicht einzeln gelistet, sondern nur als Sammelzeile.
