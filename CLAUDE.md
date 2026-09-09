# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Modulare Blöcke Plugin** - A modular WordPress plugin that dynamically registers and manages Gutenberg blocks from folders. Each block is self-contained in its own directory without dependencies.

- **WordPress Version**: 6.0+
- **PHP Version**: 8.0+
- **Node.js**: 16+
- **Text Domain**: `modular-blocks-plugin`

## Development Commands

**CRITICAL: Always run syntax check before creating ZIPs!**

```bash
# Install dependencies
npm install

# Development with watch mode
npm start
# or
npm run dev

# Production build
npm run build

# Linting
npm run lint:js
npm run lint:css

# Testing
npm run test:unit
npm run test:e2e

# Create individual block ZIPs for distribution (RECOMMENDED)
# IMPORTANT: Always run syntax check first!
for file in *.php includes/*.php; do php -l "$file" || exit 1; done && npm run build && npm run block-zips

# ChemViz: Download vendor libraries (3Dmol.js, Plotly.js)
npm run download-libs
# or individually
npm run download-3dmol
npm run download-plotly
```

### Syntax Check (MANDATORY before ZIP creation)

**Always run before creating block ZIPs:**

```bash
# Check all PHP files for syntax errors
for file in *.php includes/*.php; do echo "Checking $file..."; php -l "$file" || exit 1; done
```

**Complete workflow (recommended):**

```bash
# 1. Syntax check all PHP files
for file in *.php includes/*.php; do php -l "$file" || exit 1; done

# 2. If no errors: Build and create block ZIPs
npm run build
npm run block-zips

# 3. Commit and push
git add .
git commit -m "Your commit message"
git push origin main
```

**Why this matters:**
- Prevents distributing broken PHP code
- Catches syntax errors in plugin main file and includes
- Ensures WordPress won't show fatal errors
- Required before every ZIP creation

**What gets checked:**
- Plugin main file: `modular-blocks-plugin.php`
- All files in `includes/` directory
- Syntax validation via `php -l`
- Exit immediately on first error (`|| exit 1`)

**If syntax error found:**
- Fix the error
- Re-run syntax check
- Only then create ZIPs

## Plugin Distribution Strategy

**IMPORTANT:** This plugin uses a **modular distribution approach**:

1. **Empty Plugin Base** (`modular-blocks-plugin-empty-1.0.6.zip`)
   - Minimal plugin shell installed once on WordPress
   - Contains only core files: plugin main file, Block Manager, Admin Manager
   - Never needs to be updated unless core functionality changes
   - **Nachtrag 2026-08-24 (`docs/PLAN-PDF-Notizen-und-Listenformeln.md`,
     AP-1.fix1):** „Never needs to be updated" hat sich als zu absolut
     erwiesen. Das bis dahin einzige vorhandene Basis-ZIP enthielt noch
     einen Stand von `assets/css/blocks.css` mit einem seit 2026-08-16 im
     Quellstand bereits behobenen Fehler (weiße/unsichtbare LaTeX-Formeln,
     Details im Abschnitt „Farben kommen aus data-color-*" unten sowie in
     `Plugins/CDB-Designer/docs/diagnose-latex-listen-2026-08-24.md`). Am
     2026-08-24 wurde das Basis-ZIP mit `npm run plugin-zip-empty` aus dem
     aktuellen Quellstand neu gebaut — **Dateiname bleibt unverändert**
     `modular-blocks-plugin-empty-1.0.6.zip` (die Versionsnummer ist in
     `create-empty-plugin-zip.js` hart codiert, nicht aus `package.json`
     abgeleitet; bekannter, hier nicht behobener Nebenbefund). Die neue
     Datei liegt nur lokal unter `plugin-zips/`, ist **nicht** in Git
     versioniert (Projektkonvention, siehe `reference_file_map.md`) und
     wurde nicht hochgeladen. Vor einem künftigen Redeploy dieser Basis:
     Inhalt von `assets/css/blocks.css` im ZIP gegen den aktuellen
     Quellstand prüfen, statt sich allein auf „never needs to be updated"
     zu verlassen.

2. **Individual Block ZIPs** (uploaded separately)
   - Each block is packaged as a standalone ZIP file
   - Upload via WordPress Admin → Einstellungen → Modulare Blöcke → Block hochladen
   - Only updated blocks need to be re-uploaded
   - Allows granular control over which blocks are installed

**After making changes to a block:**
```bash
npm run build           # Build JavaScript
npm run block-zips      # Create individual block ZIPs
# Upload only the changed block ZIP(s) to WordPress
```

**DO NOT use `npm run plugin-zip`** - Full plugin ZIPs are no longer used for distribution.

## Architecture

### Core Plugin Structure

The plugin uses a singleton pattern with a main class `ModularBlocksPlugin` in `modular-blocks-plugin.php`. It automatically loads two manager classes:

1. **ModularBlocks_Block_Manager** (`includes/class-block-manager.php`)
   - Dynamically scans `/blocks/` directory for subdirectories containing `block.json`
   - Registers blocks automatically via `register_block_type()`
   - Handles server-side rendering by looking for `render.php` in each block directory
   - Manages enabled/disabled state via WordPress options (`modular_blocks_enabled_blocks`)
   - If no blocks are explicitly enabled, all blocks are enabled by default

2. **ModularBlocks_Admin_Manager** (`includes/class-admin-manager.php`)
   - Provides admin UI at **Settings → Modulare Blöcke**
   - AJAX-based toggle system for enabling/disabling individual blocks
   - Uses WordPress nonces for security (`modular_blocks_admin`)
   - Displays block metadata from `block.json` (title, description, category)

### Block Structure

Each block must follow this directory structure:

```
blocks/my-block/
├── block.json          # Required - Block metadata (apiVersion, name, title, attributes)
├── index.js            # Optional - Editor JavaScript
├── render.php          # Optional - Server-side rendering
├── style.css           # Optional - Frontend styles
├── editor.css          # Optional - Editor-only styles
└── view.js             # Optional - Frontend interactivity
```

**Key conventions:**
- Block names use namespace `modular-blocks/*`
- All blocks use apiVersion 3
- `render.php` receives three variables: `$block_attributes`, `$block_content`, `$block_object`
- Frontend JavaScript files (view.js) handle client-side interactivity after page load
- Editor JavaScript (index.js) uses WordPress `@wordpress/blocks` API

### Existing Blocks

The plugin includes several interactive educational blocks:

**General Education Blocks:**
- **image-comparison**: Interactive before/after image slider
- **multiple-choice**: Quiz-style multiple choice questions with feedback
- **summary-block**: Expandable/collapsible content sections
- **statement-summary**: Summary/statement exercise block
- **image-overlay**: Images with clickable hotspots and info popups
- **point-of-interest**: Interactive points on images with tooltips
- **statement-connector**: Drag-and-drop matching exercise connecting statements
- **drag-the-words**: Fill-in-the-blank with draggable words
- **drag-and-drop**: General drag-and-drop sorting/categorization
- **svg-drawing**: Drawing/annotation block (fabric.js)

**Embedding Blocks:**
- **iframe-whitelist**: Embeds external tools from a whitelisted URL list

**ChemViz Chemistry Blocks:**
- **molecule-viewer**: Interactive 3D molecular visualization using 3Dmol.js
  - Loads structures from PDB database, URLs, or uploaded files
  - Supports multiple display styles (stick, sphere, cartoon, line, surface)
  - Color schemes (default, carbon, spectrum, chain, secondary structure)
  - Interactive controls (rotate, zoom, spin, fullscreen)
  - Keyboard navigation support
- **interactive-data-chart**: Scientific charts and diagrams using Plotly.js
  - Predefined chemistry templates (titration curves, kinetics, phase diagrams, IR spectra, Lineweaver-Burk)
  - Custom data support via JSON
  - Interactive and responsive charts
  - Export capabilities

Hinweis: Früher dokumentierte Blöcke `demo-card`, `html-sandbox` und `chart-block`
existieren nicht mehr (chart-block wurde durch interactive-data-chart ersetzt).

Most blocks have both `index.js` (editor) and `view.js` (frontend interactivity).

## Creating New Blocks

To add a new block:

1. Create a directory in `/blocks/` with a unique name
2. Add `block.json` with required metadata:
   ```json
   {
     "apiVersion": 3,
     "name": "modular-blocks/my-block",
     "title": "My Block",
     "category": "design",
     "icon": "star-filled",
     "description": "Block description",
     "attributes": {}
   }
   ```
3. The block is automatically discovered on next page load
4. Enable it in Settings → Modulare Blöcke if it doesn't auto-enable

### Dynamic Blocks with PHP

For server-rendered blocks, create `render.php`:

```php
<?php
// Available variables:
// $block_attributes - Array of block attributes
// $block_content    - Block inner content
// $block_object     - Full WP_Block object

$title = $block_attributes['title'] ?? '';
?>
<div class="wp-block-modular-blocks-my-block">
    <?php echo esc_html($title); ?>
</div>
```

### JavaScript Blocks

Use WordPress scripts with `@wordpress/scripts`:

```javascript
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('modular-blocks/my-block', {
    edit: () => <div>Editor view</div>,
    save: () => <div>Frontend view</div>
});
```

## Important Patterns

### Block Registration Flow

1. `ModularBlocksPlugin::init()` runs on WordPress `init` hook
2. `ModularBlocks_Block_Manager::register_blocks()` scans `/blocks/` directory
3. Each valid directory (contains `block.json`) is checked against enabled blocks list
4. Enabled blocks are registered via `register_block_type($block_dir, $block_data)`
5. If `render.php` exists, a render callback is automatically attached

### Admin Toggle System

The admin interface uses AJAX (`wp_ajax_modular_blocks_toggle_block`) to enable/disable blocks:
- Updates `modular_blocks_enabled_blocks` option (array of enabled block names)
- Changes take effect immediately without page reload
- Blocks are identified by directory name (e.g., "multiple-choice")

### Asset Enqueuing

- Global block styles can be added to `assets/css/blocks.css`
- Individual block assets are defined in `block.json` using `editorScript`, `editorStyle`, `style`, `viewScript`
- The Block Manager automatically enqueues these when `register_block_type()` is called

### Buttons mit Theme-Farben (WICHTIG!)

**Historie:** Diese Sektion enthielt bis 2026-08 die unbelegte Vermutung
„CSS-Variablen werden oft überschrieben, GRUNDSÄTZLICH hardcoded
Inline-Styles verwenden". `PLAN-CSS-Variablen-Darkmode.md`, AP-3.0, hat das
an einem echten Block (`accordion`) auf einer Produktivseite mit voller
Stylesheet-Ladereihenfolge (Theme + CDB-Designer + Eigene WP Blocks
gemeinsam geladen) tatsächlich getestet: **Spike positiv** – ein CSS-Custom-
Property-Wrapper-Muster löst das historische Override-Problem zuverlässig.
Das Muster wurde in AP-3.1–3.3 auf drei weitere Blöcke ausgerollt
(`iframe-whitelist`, `summary-block`, `molecule-viewer`). Es gibt also
**zwei aktuell gültige Muster für zwei unterschiedliche Situationen** – das
eine ersetzt nicht das andere:

#### Muster A (empfohlen seit AP-3.0): Custom-Property-Wrapper

**Wann:** Theme-Farbe eines Elements, das über eine externe, per Klasse
geltende `style.css`-Regel gestylt wird (z. B. ein Button mit eigener
CSS-Klasse) – der Normalfall für UI-Chrome-Buttons/Toolbars in den
Bildungsblöcken.

**Muster:** `get_theme_mod()`-Wert in PHP lesen, als Custom-Property auf den
**äußeren Block-Wrapper** schreiben (nicht auf den Button selbst!),
`style.css` referenziert die Property per `var(--x, #fallback)` in der
jeweiligen Klassenregel. Vorbild: `cbd_get_icon_position_style()` im
CDB-Plugin (`Plugins/CDB-Designer/includes/functions.php`).

```php
// In render.php – Theme-Farben aus WordPress Customizer holen
$color_active = get_theme_mod('color_ui_surface', '#e24614');
$color_hover  = get_theme_mod('color_ui_surface_dark', '#c93d12');

// NICHT auf den Button schreiben, sondern als Custom-Property auf den
// äusseren Wrapper (get_block_wrapper_attributes()) – style.css uebernimmt
// die eigentliche Faerbung ueber die Klassenregel:
$wrapper_style_vars = sprintf(
    '--mb-myblock-active: %s; --mb-myblock-hover: %s;',
    esc_attr($color_active),
    esc_attr($color_hover)
);
echo '<div ' . get_block_wrapper_attributes(['style' => $wrapper_style_vars]) . '>';

// Der Button selbst bekommt KEINEN Farb-Inline-Style mehr:
echo '<button type="button" class="mb-myblock__button">Text</button>';
```

```css
/* In style.css */
.mb-myblock__button {
    background-color: var(--mb-myblock-active, #e24614);
}
.mb-myblock__button:hover {
    background-color: var(--mb-myblock-hover, #c93d12);
}
```

**Warum das funktioniert (Testnachweis AP-3.0):** Eine Inline-Custom-Property
auf dem Wrapper hat als Inline-Style ohnehin höchste Spezifität – anders als
eine `.klasse { background: var(--color-ui-surface); }`-Regel in einer
externen Datei kann sie nicht durch die Ladereihenfolge anderer Stylesheets
verdrängt werden. Das eigentliche historische Risiko lag vermutlich darin,
eine **globale** Custom Property direkt in einer Stylesheet-Regel ohne
Wrapper-Isolation zu referenzieren – das wurde bewusst NICHT erneut
getestet (siehe Architekturentscheidungen im Plan), das Wrapper-Muster
umgeht das Risiko strukturell. Live bestätigt in AP-3.0–3.3, jeweils inkl.
Customizer-Farbänderung → Seite neu laden → Button zeigt neue Farbe.

**Bekannte Falle dabei – zu weite globale CSS-Selektoren:** `assets/css/
blocks.css` enthielt bis AP-3.14 einen Selektor `[class*="wp-block-modular-
blocks"] [class*="button"]`, der per Teilstring-Suche auch block-eigene,
nicht als Aktions-Button gedachte Elemente traf (z. B. `.slider-button` in
`image-comparison`) und deren `var()`-Kopplung mit einer fremden,
zufällig gleich aussehenden Variable überschrieb. Beim Anlegen neuer
Button-Klassen in `blocks.css` immer mit der tatsächlichen Klasse
matchen, nicht mit einer Teilstring-Suche.

#### Muster B (weiterhin gültig): Direkter PHP-Wert ohne Wrapper-Property

**Wann:** (a) Nicht-Farb-Eigenschaften von PHP-generierten Buttons (Padding,
`border-radius`, `display`, `font-size` – das war nie das eigentliche
Problem und bleibt regulär inline, siehe z. B. `$button_style` in
`blocks/summary-block/render.php`); (b) echte Content-Fallbackwerte für vom
Autor **pro Instanz** editierbare Attribute (z. B. Rahmenfarbe einer
einzelnen Drag-and-Drop-Zone, Farbe eines einzelnen Hotspots) – hier gibt
es keine einzelne Klassenregel, die für alle Instanzen gleichzeitig gilt,
der aufgelöste Wert muss also weiterhin direkt in den Stil des jeweiligen
Einzelelements geschrieben werden (als literaler Wert oder als
Inline-Custom-Property mit literalem statt `var()`-Wert):

```php
// Content-Fallback fuer ein Autoren-editierbares Attribut (z. B. Rahmenfarbe
// einer einzelnen Zone) – get_theme_mod() nur als PHP-Default, Autoren-Wert
// hat Vorrang:
$zone_border = sanitize_hex_color($zone['borderColor'] ?? get_theme_mod('color_ui_surface', '#0073aa'));
echo '<div style="border-color: ' . esc_attr($zone_border) . ';">';
```

**Bekannte, strukturelle Falle bei Muster B (AP-3.3/3.4/3.5/3.7/3.12
gefunden):** `block.json` trägt für solche Attribute meist bereits einen
eigenen Hex-Default ein, den WordPress **vor** `render.php` in
`$block_attributes` einträgt. Ein `$attr['x'] ?? get_theme_mod(...)`-Fallback
greift dadurch bei unverändertem Standard-Content praktisch **nie** – jede
Bestandsseite ohne manuelle Autoren-Anpassung bekommt weiterhin exakt den
alten `block.json`-Default, nicht den Theme-Wert. Das ist meist nur ein
kleiner Nebenaspekt (Fallback wirkungslos, aber auch keine sichtbare
Regression) – bei `image-comparison` (AP-3.5) zerstörte es aber das
eigentliche AP-Ziel vollständig, weil `render.php` den PHP-aufgelösten Wert
zusätzlich als LITERALE Inline-Custom-Property auf den Wrapper schrieb, die
die CSS-`var()`-Kopplung von Muster A komplett überschrieb (Inline-Styles
gewinnen immer gegen Stylesheet-Regeln). **Korrekte Lösung (AP-3.5.fix1,
siehe `blocks/image-comparison/render.php`):** Die Inline-Custom-Property
nur setzen, wenn der Attributwert vom bekannten `block.json`-Default
abweicht (= echte Autoren-Anpassung); entspricht er dem Default, die
Property ganz weglassen, damit `style.css`s `var(--color-ui-surface, …)`-
Kopplung ungehindert greift. Dieses Fix-Muster ist noch **nicht** auf
`drag-and-drop`, `molecule-viewer`, `point-of-interest` und
`statement-connector` übertragen (dort weiterhin offener Nebenbefund, siehe
`reference_file_map.md`, Abschnitt „Strukturelle Falle bei
Content-Fallbacks").

**Auch für andere Elemente anwenden (Muster B, unverändert):**
- Icons innerhalb von Buttons: explizit `color: #fff !important; background: transparent !important;`
- Text-Spans innerhalb von Buttons: explizit stylen, nicht vererben lassen

### Iframe Sandbox-Attribut (WICHTIG!)

**Problem:** Das `sandbox`-Attribut auf iframes blockiert viele Funktionen wie PDF-Export, Downloads, und andere JavaScript-Features - selbst mit vielen `allow-*` Werten.

**Lösung für whitelisted/vertrauenswürdige URLs:** Kein `sandbox`-Attribut verwenden!

```php
// NICHT verwenden für vertrauenswürdige URLs:
// $sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads';
// 'sandbox' => $sandbox,

// Stattdessen: Kein sandbox-Attribut
$iframe_attrs = [
    'src' => esc_url($url),
    'class' => 'iframe-whitelist-frame',
    'loading' => 'lazy',
    // KEIN 'sandbox' => ...
];
```

**Begründung:**
- URLs sind bereits durch Whitelist geprüft = vertrauenswürdig
- `sandbox` mit allen `allow-*` Werten funktioniert trotzdem nicht zuverlässig
- PDF-Export, Downloads, komplexe JavaScript-Apps brauchen volle Berechtigungen
- Sicherheit wird durch die Whitelist gewährleistet, nicht durch sandbox

## Darkmode

Seit `PLAN-Darkmode-Umschaltung.md` (Phase 3, abgeschlossen 2026-08-24)
unterstützt das Plugin einen expliziten, getesteten Dunkelmodus.

**Mechanismus (gehört dem Theme, nicht diesem Plugin):** Der Darkmode wird
ausschließlich über das `data-theme="dark"`-Attribut gesteuert, das
`Theme/header.php` nach einem expliziten Klick auf den Toggle-Button setzt
und lokal speichert – **keine** automatische, systemabhängige Umschaltung
per `@media (prefers-color-scheme: dark)`.

**`assets/css/blocks.css`:** Der Kommentar „KEIN Dunkelmodus – bitte nicht
wieder einbauen" (2026-08-16, dokumentiert einen gescheiterten
`prefers-color-scheme`-Versuch mit weißer Schrift auf weißem Grund) wurde
**nicht gelöscht**, sondern seit AP-3.1 um einen Update-Kommentar ergänzt:
Der frühere Fehlschlag betraf nur die automatische, systemabhängige
Variante; der jetzige `[data-theme="dark"]`-Mechanismus wird ausschließlich
durch den expliziten Toggle gesetzt und ist eine andere, gezielt getestete
Lösung – kein Wiedereinbau des alten Fehlers. Direkt danach folgt jetzt ein
neuer `[data-theme="dark"]`-Block: Fast alle Flächen ziehen bereits über
bestehende `var(--color-x, ...)`-Kopplungen automatisch mit; einziger echter
Sonderfall waren die zwei fest verdrahteten `rgba(0,0,0,...)`-Kartenschatten,
die auf `var(--color-border, #dcdcde)` umgestellt wurden.

**Bildungsblöcke (AP-3.2):** 8 von 14 sichtgeprüften Blöcken hatten trotz
bestehender `var()`-Kopplung echte Kontrastfehler im Darkmode und wurden
korrigiert: `summary-block`, `drag-and-drop`, `image-overlay`,
`point-of-interest`, `multiple-choice`, `statement-summary`,
`drag-the-words`, `interactive-data-chart`. Details je Block stehen in
`reference_file_map.md`, Abschnitt „Darkmode-Kontrastkorrekturen", und in
`PLAN-Darkmode-Umschaltung.md`, AP-3.2-Übergabenotiz. Canvas-/3D-/
Diagramm-Inhaltsflächen (`molecule-viewer`-Viewerhintergrund,
`svg-drawing`-Zeichenfläche, `interactive-data-chart`-Plotly-Datenbereich)
wurden dabei bewusst nicht angefasst.

Beiläufig dazu: `drag-the-words` lud sein Frontend-CSS wegen eines
vorbestehenden, von diesem Vorhaben unabhängigen Paketierungsfehlers
(`block.json` deklarierte `style-index.css`, aber keine JS-Datei
importierte `style.css`) in einer regulär gebauten Produktivinstallation gar
nicht. Das wurde inzwischen außerhalb dieses Plans behoben (Import
ergänzt) – die Darkmode-Korrekturen dieser Datei kommen seither tatsächlich
beim Besucher an (CSS lädt korrekt).

**Pflicht-Konvention für neue/geänderte Regeln:** Neue Blöcke bzw. neue
Regeln in bestehenden Blöcken verwenden ausschließlich
`var(--color-x, #fallback)` mit den projektweiten Theme-Variablen – nie
hartcodierte Hex-Werte – damit sie automatisch darkmode-fähig sind.
Inhaltsfarben (vom Autor/Nutzer gewählte Zeichenfarben,
Diagramm-Datenreihen, 3D-Viewer-Hintergrund) bleiben davon ausdrücklich
ausgenommen.

## Accordion-Block: Zeilen entstehen erst im Browser

Der Block `modular-blocks/accordion` ist der einzige, dessen sichtbare
Struktur **nicht** vom Server kommt. `blocks/accordion/render.php` gibt den
Inhalt flach aus — eine Folge von `<h3>`, `<p>`, Listen. Erst
`blocks/accordion/view.js` gruppiert das im Browser zu Klappzeilen: Jede
Überschrift der eingestellten Ebene wird zum Zeilenkopf, alles bis zur
nächsten Überschrift wandert in ihr Panel.

**Es gibt keinen Kind-Block.** Eine frühere Fassung hatte
`modular-blocks/accordion-row` als eigenen Block (Muster `core/columns` +
`core/column`); dieser Weg wurde verworfen, der Block ist entfernt. Ältere
Dokumentation, die ihn beschreibt, ist überholt.

### `buildRows()` muss über `childNodes` iterieren, nicht über `children`

Das ist der Kern und eine Falle, die schon einmal zugeschlagen hat.
`children` liefert nur **Elemente**. Nackte Textknoten bleiben dabei liegen,
wo sie sind — also außerhalb jeder Klappzeile, dauerhaft sichtbar, auch wenn
alle Zeilen zu sind.

Nackte Textknoten entstehen regelmäßig: Sobald ein Block-Element mitten in
einem Absatz steht, spaltet der HTML-Parser des Browsers den `<p>` auf und
lässt den Text dahinter als eigenen Knoten zurück. Der Regelfall dafür sind
Display-Formeln. Genau deshalb gibt das CDB-Plugin seine Display-Formeln
inzwischen als `<span>` aus und nicht mehr als `<div>` — beide Seiten
zusammen ergeben erst das richtige Ergebnis.

Weil sich die Knotenliste beim Verschieben ändert, braucht es vorher eine
feste Kopie (`Array.prototype.slice.call(content.childNodes)`); sonst
überspringt die Schleife jeden zweiten Knoten. Reine Leerraum-Knoten werden
verworfen, nicht verschoben.

### Naht zum CDB-Plugin: `window.cbdRenderLatex`

Nach dem Aufklappen ruft `finishOpen()` die Funktion
`window.cbdRenderLatex(panel)` aus dem Plugin „Container Block Designer" auf
und misst die Panelhöhe **erst im `.then()`** neu. Ohne das misst das
Accordion die Ersatzschrift, weil KaTeX seine Webfonts für einen
`display:none`-Teilbaum nicht lädt — die Aufklapp-Animation liefe dann auf
eine falsche Zielhöhe.

**Der Aufruf ist einseitig optional und muss es bleiben.** Das CDB-Plugin
kann abgeschaltet sein, deshalb immer
`typeof window.cbdRenderLatex === 'function'` prüfen und ohne die Funktion
das bisherige Verhalten beibehalten. Die vollständige Zusage der Funktion
(Rückgabe, Verhalten ohne KaTeX, Markierung gescheiterter Formeln) steht in
`Plugins/CDB-Designer/CLAUDE.md`, Abschnitt „LaTeX-Formeln: Renderpfad und
Wiederholrendern".

Das ist nach dem Accordion-Import und der Klassen-Freigabe die **dritte**
Stelle, an der die beiden Plugins zusammenwirken.

### Farben kommen aus `data-color-*`, nicht aus dem Stylesheet

`render.php` schreibt die Theme-Farben als `data-color-surface`,
`data-color-active`, `data-color-hover` und `data-color-text` an den
Wurzel-`<div>`; `view.js` setzt sie inline auf die Zeilenköpfe. Eine offene
Zeile bekommt dabei **weiße** Schrift auf der Akzentfarbe. `style.css` legt
sich bei Zeilenkopf-Hintergründen deshalb bewusst nicht fest.

Der Panel-Inhalt wird von `style.css` auf `#333` zurückgeholt — die Regel
zählt `p`, `li`, `h1`–`h6` und `blockquote` **einzeln** auf. Alles andere
erbt weiter.

**Korrektur 2026-08-24 (AP-1.doc, `docs/PLAN-PDF-Notizen-und-
Listenformeln.md`, Befund B8 aus AP-1.rev):** Die frühere Anweisung „Wer
dort ein Element ergänzt, das Text zeigt, muss es in diese Aufzählung
aufnehmen" ist auf dem heutigen Stand nachweislich überholt und sollte
künftige Agenten nicht mehr zu unnötigen Enumerationserweiterungen
anleiten. `assets/css/blocks.css:106-110` setzt dieselbe Grundfarbe bereits
eine Ebene weiter außen für den **gesamten** Panel-Inhalt
(`.mb-accordion__content`) — per Laufzeittest bestätigt: Die Aufzählung
hier vollständig abgeschaltet, blieben alle zwölf gemessenen Formeln über
acht Blocktypen unverändert lesbar. Die Aufzählung ist damit redundant,
schadet aber nicht.

Auch der letzte Satz der ursprünglichen Fassung war ungenau: LaTeX-Formeln
waren nicht wegen einer fehlenden Ergänzung dieser Aufzählung unsichtbar.
Die tatsächliche, am 2026-08-16 behobene Ursache (Commits `b854060`,
`a2737ff`) war ein zu weit gefasster Selektor in `assets/css/blocks.css`,
der die Formelfarbe direkt am Element `.cbd-latex-content` überschrieb,
bevor die Vererbung von dieser Aufzählung überhaupt greifen konnte. Details
und vollständige Farbketten:
`Plugins/CDB-Designer/docs/diagnose-latex-listen-2026-08-24.md`.

## Summary-Block: PDF-Export für Schüler und Lehrpersonen (seit 2026-09)

Vorhaben „Summary-PDF und Content-Links", Phase 1
(`PLAN-Summary-PDF-und-Content-Links.md`, Website-Root). Betrifft
ausschließlich `blocks/summary-block/`. Der Block hatte bereits vorher einen
PDF-Export für das Schülerergebnis; diese Phase hat ihn erweitert und dabei
die Fremdbibliothek von einem CDN gelöst. Details, Fundstellen und
Übergabenotizen: `reference_file_map.md`, Abschnitt „Summary-Block:
PDF-Export im Detail".

**Lokal gebündelte jsPDF statt CDN (AP-1.1).** `view.js` lud jsPDF 2.5.1
früher zur Laufzeit per `<script src="https://cdnjs.cloudflare.com/…">` nach
— ein Verstoß gegen die projektweite DSGVO-Konvention „keine
CDN-Einbindungen zur Laufzeit" (siehe Root-`CLAUDE.md`, Abschnitt
„Harte Grenzen"). Jetzt liegt `blocks/summary-block/jspdf.umd.min.js` lokal
im Block-Ordner (nicht in `assets/js/vendor/` — die modulare
Block-ZIP-Distribution packt pro Block nur dessen eigenen Ordner) und wird
serverseitig unbedingt eingebunden:

```php
// render.php, kurz nach der Gruppen-Validierung
wp_enqueue_script(
    'modular-blocks-summary-jspdf',
    plugins_url('jspdf.umd.min.js', __FILE__),
    array(),
    defined('MODULAR_BLOCKS_PLUGIN_VERSION') ? MODULAR_BLOCKS_PLUGIN_VERSION : false,
    true
);
```

`view.js` liest den Konstruktor seither synchron über `getJsPDF()` (Zeile
28) aus `window.jspdf.jsPDF` — kein `<script>`-Nachladen, kein Callback mehr.
Fehlt die Bibliothek beim Klick auf einen PDF-Knopf trotzdem (z. B. weil das
Skript noch lädt), zeigt der Code eine sichtbare Fehlermeldung statt eines
stillen Abbruchs. Die Datei ist in Git versioniert (anders als
`assets/js/vendor/`, das `.gitignore` ausschließt) und wird ausschließlich
über `npm run download-jspdf` erneuert — bewusst **nicht** Teil von
`npm run download-libs`.

**Neues Attribut `teacherPdfCount`** (`block.json`, `type: number`, Default
`10`). Im Editor (`index.js`) als `RangeControl` „Anzahl Aussagen im
Übungs-PDF" (1–50) neben `pdfDownloadThreshold` platziert — bewusst
**außerhalb** des `{enablePdfDownload && …}`-Zweigs, weil der Lehrer-Knopf
unten unabhängig vom Schüler-PDF-Download funktioniert. `render.php` klemmt
den Wert serverseitig zusätzlich auf 1–50 (`$teacher_pdf_count`, analog zu
`$penalty_per_wrong`).

**Neue Theme-Naht: `function_exists('simple_clean_ist_lehrperson')`
(AP-1.3).** Erste Stelle, an der dieses Plugin aktiv eine Theme-Funktion
aufruft (bislang war die Kopplungsrichtung immer umgekehrt oder es gab gar
keine). `render.php` ermittelt:

```php
$ist_lehrperson = function_exists('simple_clean_ist_lehrperson') && simple_clean_ist_lehrperson();
```

Das folgt exakt dem in Root-`CLAUDE.md`, Abschnitt „Direkte
Theme-Funktionsaufrufe des Plugins", für den CDB-Designer dokumentierten
Muster: Aufruf hinter `function_exists()`, Kurzschluss-`&&`, Rückfall
`false`. Fehlt das Theme oder ist `simple_clean_ist_lehrperson` nicht
definiert, gilt niemand als Lehrperson — der Übungs-PDF-Knopf erscheint dann
für niemanden, es gibt **keinen** Fatal Error (live geprüft, indem die
Funktion auf der Testinstallation umbenannt wurde). `simple_clean_ist_lehrperson()`
(`Theme/includes/sichtbarkeit.php`) ist die projektweit **einzige**
Definition von „Lehrperson"; sie bedeutet aktuell nur `is_user_logged_in()`
gefiltert über `apply_filters('simple_clean_ist_lehrperson', …)`, also
schlicht „angemeldet" — jede angemeldete Person sieht den Knopf. Das ist
bewusst übernommenes, bereits vorher dokumentiertes Verhalten der
wiederverwendeten Funktion, keine neue Schwachstelle dieses Plugins; eine
Verschärfung gehört ins Theme.

**Die Prüfung läuft serverseitig, nicht nur versteckt per CSS.** Ist
`$ist_lehrperson` falsch, gibt `render.php` weder den Knopf
(`.teacher-practice-pdf-button`) noch den Aussagen-Pool
(`allStatementTexts` in der `data-summary`-JSON) überhaupt aus — anonym per
`curl` geprüft: kein `<button …teacher-practice-pdf-button…>` im
ausgelieferten HTML. Ein bloßes `display:none` wäre per DevTools aufzuheben
gewesen.

**Schüler-Ergebnis-PDF (AP-1.2).** `generatePDF()` (`view.js`) listet jetzt
für jede Aussage jeder Gruppe eine Zeile mit `[RICHTIG]`/`[FALSCH]` nach
`statement.isCorrect` — unabhängig davon, was der Lernende tatsächlich
angeklickt hat (das PDF ist ein Lösungsblatt mit Punktestand, kein Protokoll
der eigenen Antworten). Am Ende steht `Ergebnis: N % richtig`, exakt der in
`showResults()` bereits berechnete, nicht neu berechnete Prozentwert.
`pdfMessage`, Titel und Datum blieben unverändert.

**Lehrer-Übungs-PDF (AP-1.3).** `generateTeacherPracticePDF()` (`view.js`,
Zeile 480) zieht per Fisher-Yates-Shuffle `min(teacherPdfCount, Poolgröße)`
zufällige, nicht wiederholte Aussagetexte aus `allStatementTexts` — **nur**
aus dem Aussagen-Pool dieses einen Block-Exemplars, nie aus anderen
summary-blocks (Architekturentscheidung A4 des Plans). Jede Zeile bekommt
ein leeres Ankreuzfeld `[  ] Richtig     [  ] Falsch`, **ohne**
Richtig/Falsch-Kennzeichnung und **ohne** Prozentwert (kein Lösungsblatt,
Nutzerentscheidung). Der Knopf sitzt bewusst im Blockkopf
(`.summary-teacher-tools`), nicht in `.summary-controls` (das bis
`showResults()` auf `display:none` steht) — er muss unabhängig vom
Spielzustand sichtbar sein.

**Zwei Fallen bei reiner jsPDF-Textausgabe (belegt, betreffen beide
Export-Wege):**
1. jsPDF setzt mit den eingebauten Standardschriften (Helvetica) in
   **WinAnsiEncoding**. Unicode-Symbole wie „✓"/„✗"/„☐" liegen dort nicht im
   Zeichensatz und kämen als leere oder falsche Glyphe heraus — deshalb
   ASCII-Marken (`[RICHTIG]`/`[FALSCH]`, `[  ]`). Deutsche Umlaute sind in
   WinAnsi enthalten und funktionieren normal.
2. Aussagetexte dürfen Markup enthalten (`wp_kses_post()` in `render.php`).
   Die Hilfsfunktion `htmlToText()` (`view.js`, Zeile 52, Modulebene) räumt
   das vor der PDF-Ausgabe weg; ohne sie druckt jsPDF die Tags wörtlich.

Kein html2canvas, kein Screenshot, keine Kopplung an die
PDF-Infrastruktur des CDB-Designers (Architekturentscheidung A7 des Plans)
— beide Export-Wege bleiben reine jsPDF-Textausgabe wie der Bestandscode.

### Nachtrag: Fünf Nachbesserungen (Phase 1, `PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md`, 2026-09-08)

Nach dem Live-Test durch den Betreiber wurden fünf weitere Punkte am
`summary-block` nachgebessert. Unabhängig review-geprüft (eigenes
AP-1.rev dieses Nachtragsplans, nicht zu verwechseln mit dem
gleichnamigen AP des Vorgängerplans oben): kein kritischer Befund, ein
Befund mittlerer Schwere (**M1**, betrifft nur den Plantext, siehe Punkt 1
unten) und sieben geringe (siehe „Bekannte Einschränkungen — Nachtrag"
weiter unten). Kein `AP-1.fix1` nötig, Phase merge-fähig. Vollständige
Befundliste inkl. Belegen:
`PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md`, Übergabenotiz AP-1.rev.

1. **`pdfDownloadThreshold`-Standardwert von 100 auf 0 (AP-1.1,
   `block.json`).** Der Schüler-Download-Knopf erscheint damit nach jedem
   Ergebnis, auch bei 0 %, statt praktisch nur bei einem fehlerfreien
   Durchlauf. Der Inspector-Regler bleibt unverändert nutzbar, falls eine
   Lehrperson doch eine Mindestpunktzahl verlangen will.

   **Wichtig — wirkt rückwirkend auf alle Bestandsseiten ohne explizit
   gesetzten Wert, entgegen der ursprünglichen Planannahme.** Der
   Nachtragsplan (`PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md`,
   Abschnitt 2 „Nicht-Ziele") behauptet, bestehende Blockinstanzen
   behielten „ihren gespeicherten Wert (in der Regel 100, da nie
   geändert)". **Das trifft nachweislich nicht zu** (Review-Befund
   **M1**, Schweregrad mittel — der Fehler liegt im Plantext, nicht im
   Code, der Abschnitt bleibt dort unverändert als Historie stehen):
   Gutenberg serialisiert ein Blockattribut nicht in den
   Blockkommentar, wenn dessen Wert dem in `block.json` hinterlegten
   Default entspricht, und `WP_Block_Type::prepare_attributes_for_render()`
   trägt vor jedem `render.php`-Aufruf stets den aktuellen
   `block.json`-Default ein, wenn im Markup kein Wert steht. Auf dem
   Testserver hatte **keine einzige** der 26 Produktivseiten mit
   summary-block `pdfDownloadThreshold` je explizit gesetzt (der Regler
   stand dort immer auf dem alten Default 100, der deshalb nie
   serialisiert wurde) — alle 26 übernehmen den neuen Standard 0
   automatisch, ohne Datenbankschreibung, ohne Migrations-Hook, allein
   durch die eine geänderte Zeile in `block.json`. Wer für eine einzelne
   Seite weiterhin eine Mindestpunktzahl will, setzt sie im
   Inspector-Regler „PDF-Download ab (%)" — sobald der Wert vom Default
   abweicht, wird er serialisiert und gewinnt. Das ist **keine
   Datenmigration** (kein Code fasst die Datenbank an) und entspricht
   inhaltlich dem Projektziel „Download standardmäßig ohne
   Mindestpunktzahl verfügbar", geht aber weiter als der ursprüngliche
   Plantext erwartete.

2. **Falsch-Zähler pro Aussagensatz in der Lösungsanzeige (AP-1.2,
   `view.js`, `style.css`).** Neue, von der bestehenden Punkteberechnung
   unabhängige Struktur `wrongAttemptsByGroup` (Gruppenindex → Anzahl,
   Schlüssel `groupEl.dataset.groupIndex`, bewusst **nicht**
   `currentGroupIndex` — bei `progressiveReveal: false` liegen alle
   Gruppen gleichzeitig offen und die Klickreihenfolge ist frei). Gefüllt
   an **beiden** Fehlklick-Stellen von `handleStatementClick()`, also auch
   im `deferredFeedback`-Zweig, wo zuvor überhaupt nichts gezählt wurde.
   „Lösung anzeigen" zeigt je Gruppe eine eigene Zeile
   (`.summary-wrong-count`, bewusst **kein** `.summary-item`, sonst bricht
   `updateSummaryAfterEvaluation()` mit einem `TypeError` ab).
   `calculateFinalScore()`/`percentage` sind dabei nachweislich
   byteidentisch geblieben (Review-Gegenprüfung: einziger Unterschied im
   Diff ist eine Kommentarzeile).

3. **Frontend-Eingabefeld für die Anzahl der Übungsaufgaben (AP-1.3,
   `render.php`, `view.js`, `style.css`).** Zahlenfeld neben dem
   Übungsblatt-Knopf, nur im selben `if ($ist_lehrperson)`-Zweig, daher im
   DOM nur für Lehrpersonen. Übersteuert `teacherPdfCount` **nur
   clientseitig** für den jeweiligen Export (Architekturentscheidung B3
   des Nachtragsplans) — kein `fetch`/`apiFetch`, kein
   `update_post_meta()`; der gespeicherte Blockattributwert bleibt
   unverändert, nach Neuladen zeigt das Feld wieder den Editor-Wert. Der
   Wert wird `block`-weit gelesen (`block.querySelector('.teacher-pdf-count-input')`,
   bewusst **nicht** `document.querySelector(...)`) — bei mehreren
   summary-blocks auf einer Seite läse sonst jeder Block das Feld des
   ersten.

4. **Zweiter Lehrer-Knopf „Lösungsblatt erzeugen" (AP-1.4, `render.php`,
   `view.js`: neue Funktion `generateSolutionSheetPDF()`).** Erzeugt,
   anders als das Übungsblatt, **alle** Aussagen **aller** Gruppen mit
   `[RICHTIG]`/`[FALSCH]`-Kennzeichnung nach `isCorrect` (ASCII wegen der
   WinAnsiEncoding-Einschränkung von jsPDF), **ohne** Zufallsauswahl,
   **ohne** Deckelung durch das Zahlenfeld aus AP-1.3, **ohne**
   Prozentwert. Eigener Dateiname `loesungsblatt_<timestamp>.pdf`,
   unterscheidbar von `uebungsblatt_<timestamp>.pdf` und dem
   Schüler-Ergebnis-PDF-Dateinamen. Datenquelle ist dieselbe
   `groups`-Struktur wie im Schüler-PDF, nicht `allStatementTexts` (die
   trägt bewusst kein `isCorrect`).

5. **Kapitel-Titel in allen drei PDF-Dokumenten (AP-1.5, `render.php`,
   `view.js`).** `render.php` ermittelt den Titel der **obersten**
   Vorfahren-Seite über `get_post_ancestors()` + `end()` (Fallback: die
   Seite selbst, wenn keine Vorfahren vorhanden sind) und gibt ihn als
   JSON-Schlüssel `kapitelTitel` aus — **ohne** `function_exists()`-Brücke
   zum Theme, `get_post_ancestors()` ist WordPress-Bordmittel
   (Architekturentscheidung B4 des Nachtragsplans). Zwei Absicherungen
   über den ursprünglichen Planvorschlag hinaus: (a) `is_singular()` als
   Torwächter vor `get_queried_object_id()` — auf Archiv-/Taxonomieseiten
   liefert diese Funktion sonst eine **Term**-ID, die als Post-ID
   fälschlich den Titel eines fremden Beitrags ins PDF schreiben könnte;
   (b) `wp_strip_all_tags()`, weil `get_the_title()` durch den
   `the_title`-Filter läuft, den fremde Erweiterungen mit Markup füllen
   könnten, der Wert aber ausschließlich als reiner PDF-Text landet.
   `view.js` bekommt eine gemeinsame Hilfsfunktion `writeChapterLine()`,
   aufgerufen von allen drei PDF-Wegen; ist `kapitelTitel` leer, kehrt sie
   sofort zurück, ohne Dokumentzustand oder y-Position zu verändern — kein
   Fehler, keine leere Zeile.

### Bekannte Einschränkungen — Nachtrag Phase 1 (Review AP-1.rev, `PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md`, 2026-09-08)

Die restlichen sechs Review-Befunde (alle „gering"; **M1** ist oben bei
AP-1.1 bereits eingearbeitet):

- **G1 — zwei tote Rückfallwerte, die noch die alte Schwelle 100 nennen**
  (`render.php:29`: `$pdf_download_threshold = $block_attributes['pdfDownloadThreshold'] ?? 100;`;
  `view.js:76`: Destrukturierungs-Default `pdfDownloadThreshold = 100`).
  Praktisch tot — WordPress trägt den `block.json`-Default immer in
  `$block_attributes` ein, `render.php` schreibt den Schlüssel immer in
  die JSON —, aber irreführend beim Lesen. Keine Verhaltensänderung zu
  erwarten, falls aufgeräumt.
- **G2 — `block.json`-`version` (weiterhin `2.2.2`) trotz sichtbarer
  Layoutänderung nicht erhöht** (`.summary-teacher-tools` von `block` auf
  `inline-flex` mit `flex-wrap`/`gap` umgestellt). Derselbe Befund wie
  weiter oben aus dem Review des Vorgängerplans, der Nachtrag hat ihn
  nicht behoben — betrifft `register_block_style_handle()`s
  `?ver=`-Parameter für das Blockstylesheet. Auf dem Testserver ohne
  Wirkung (Stylesheet wird inline eingebettet), auf Produktiv nicht
  garantiert, falls `style-index.css` (14 194 Byte) dort das
  20 000-Byte-Inline-Budget sprengt.
- **G3 — Zahlenfeld aus AP-1.3 kann `value` größer als `max` rendern**
  (`render.php`): Ist der gespeicherte `teacherPdfCount` größer als die
  Poolgröße (Regelfall, da Attribut-Default 10), rendert das Feld z. B.
  `value="10" max="6"` — HTML-technisch ungültig (Browser markiert es als
  `:invalid`), aber ohne Funktionsverlust: Die Deckelung in `view.js`
  greift beim Klick, das PDF enthält korrekt 6 Zeilen. Die Lehrperson
  liest allerdings „10" statt „6".
- **G4 — doppelte Kopfzeile im PDF, wenn Kapitel- und Blocktitel
  identisch sind** (`view.js`, `writeChapterLine()`/alle drei PDF-Wege):
  Auf einer Seite ohne Elternseite ist der Kapiteltitel per Definition der
  Seitentitel selbst; trägt der Block denselben Titel wie die Seite
  (häufig bei „Übungen zu …"-Seiten), steht dieselbe Zeile zweimal
  untereinander im Kopf. Rein kosmetisch, kein verletztes
  Akzeptanzkriterium.
- **G5 — neue Frontend-Texte sind fest auf Deutsch verdrahtet**
  (`view.js`: „N falsche(r) Versuch(e) in diesem Aussagensatz",
  „Lösungsblatt", beide `alert()`-Meldungen in
  `generateSolutionSheetPDF()`). Setzt die bereits im Review des
  Vorgängerplans dokumentierte Einschränkung (siehe oben, „Neue PDF-Texte
  … deutsch fest verdrahtet") fort; die `strings`-Brücke aus der
  `data-summary`-JSON wird weiterhin nur für `strings.group`/`strings.of`
  genutzt. Nur bei künftiger Mehrsprachigkeit relevant.
- **G7 — `htmlToText()` bleibt ein `innerHTML`-Sink, jetzt auch von
  `generateSolutionSheetPDF()` durchlaufen** (`view.js`): Kein neuer
  Befund — derselbe Pfad existiert bereits seit `generatePDF()` des
  Vorgängerplans (dort bereits dokumentiert, siehe Bullet oben zur
  Datei-Map-Behauptung über `wp_kses_post()`) und läuft, anders als der
  sichtbare `<span>`-Ausgabepfad, nicht durch `wp_kses_post()`. AP-1.4
  benutzt ihn nur erneut, ohne ihn zu erweitern. `kapitelTitel` (AP-1.5)
  macht es an seiner eigenen Stelle besser: serverseitig durch
  `wp_strip_all_tags()` geführt, bevor es überhaupt bei `htmlToText()`
  ankommt.

**Zusätzlich, außerhalb der G-Liste des Reviews — vorbestehender, durch
den Nachtrag nicht verursachter Mangel:** Der `deferredFeedback`-Modus
lässt sich über die Oberfläche **nicht abschließen**. Der deferred-Zweig
in `handleStatementClick()` setzt die Klasse `selected`, `isGroupCompleted()`
prüft für denselben Modus aber auf `.statement-option.correct`/
`.statement-option.incorrect`, die dort nie gesetzt werden —
`showResults()` läuft folglich nie, `.summary-controls` (und damit der
Knopf „Lösung anzeigen") bleibt verborgen. Bestätigt unverändert bereits
auf `main` vor diesem Nachtrag (`git show main:blocks/summary-block/view.js`);
**keine** Produktivseite verwendet `deferredFeedback: true` (nur eine
Testseite). Der neue Falsch-Zähler aus AP-1.2 funktioniert im
deferred-Zweig trotzdem korrekt, wenn der Knopf „Lösung anzeigen" direkt
angesprochen wird. Empfehlung für ein eigenes, künftiges AP:
`isGroupCompleted()` im deferred-Zweig zusätzlich auf
`.statement-option.selected` prüfen.

### Bekannte Einschränkungen (Review AP-1.rev, 2026-09-08)

Das unabhängige Review der Phase fand keinen kritischen und einen Befund
mittlerer Schwere; kein Korrektur-AP war nötig, die Phase ist merge-fähig.
Vollständige Befundliste inkl. Belegen: `PLAN-Summary-PDF-und-Content-Links.md`,
Übergabenotiz AP-1.rev.

- **jsPDF lädt unbedingt auf jeder Seite mit summary-block** (mittel,
  `render.php`, der `wp_enqueue_script()`-Aufruf oben) — auch wenn
  `enablePdfDownload: false` gesetzt ist oder der Betrachter keine
  Lehrperson ist. Gemessen: ~115 KB gzip pro Erstbesuch (im Footer geladen,
  blockiert das Rendern nicht; `?ver=`-Parameter erlaubt Browser-Caching).
  Bewusst so entschieden, weil der Lehrer-Knopf die Bibliothek unabhängig
  von `enablePdfDownload` braucht — die Kosten wurden dabei nicht beziffert
  und kein Akzeptanzkriterium der Phase adressiert sie. **Kandidat für ein
  Folgevorhaben:** entweder den Enqueue an eine Bedingung knüpfen
  (`$enable_pdf_download || $ist_lehrperson`, hilft nur bei abgeschaltetem
  Schüler-Download) oder die lokale Datei erst beim ersten Klick per
  `wp_enqueue_script`/dynamischem Nachladen der **lokalen** URL laden (wahrt
  die DSGVO-Vorgabe vollständig, kostet aber die heutige Synchronität von
  `getJsPDF()` zurück).
- Das Ergebnis-PDF trägt weiterhin die Überschrift „Ihre Zusammenfassung:",
  enthält aber seit AP-1.2 nicht mehr die vom Lernenden tatsächlich
  gewählten Aussagen, sondern **alle** Aussagen mit `[RICHTIG]`/`[FALSCH]`
  nach `isCorrect` — zwei Lernende mit unterschiedlichem Ergebnis erhalten
  bis auf die Prozentzeile identische Dokumente. Entspricht dem Planwortlaut
  (Lösungsblatt mit Punktestand), ist aber ein Informationsverlust
  gegenüber dem alten Verhalten (Protokoll der eigenen Antworten).
- Die neuen PDF-Texte in `view.js` (`Ergebnis: … % richtig`,
  `[RICHTIG]`/`[FALSCH]`, `Übungsblatt`, `[  ] Richtig     [  ] Falsch`, beide
  `alert()`-Fehlermeldungen) sind deutsch fest verdrahtet, obwohl der Block
  über `strings` (`data-summary`-JSON) eine i18n-Brücke hat; nur die
  Gruppenüberschrift nutzt sie korrekt. Nur relevant bei künftiger
  Mehrsprachigkeit.
- `block.json` `version` blieb bei dieser Phase auf `2.2.2`, obwohl fünf
  Dateien geändert wurden. Für die Editor-/Frontend-JS unkritisch
  (WordPress hasht `view.js`/`index.js` über `*.asset.php`); das
  Blockstylesheet fiele theoretisch auf dieses Feld zurück, auf dem
  Testserver aber ohne Wirkung, weil `style-index.css` inline eingebettet
  wird.
- Die Datei-Map behauptete an einer Stelle, alle Aussagetexte kämen über
  `wp_kses_post()` an — für den in AP-1.2 neu eingeführten JSON-Lesepfad
  (`htmlToText()` auf ungefiltertem `$groups_data['statements']`) stimmt
  das nicht; der `<span>`-Ausgabepfad und `allStatementTexts` laufen
  weiterhin durch `wp_kses_post()`. Kein neues Risiko (derselbe Sink
  existierte schon vorher über `.textContent`), Aussagetexte stammen von
  Redakteuren mit Editorrecht.
- `pdfMessage` im Ergebnis-PDF behielt den alten Seitenumbruch-Test und die
  feste Breite 170 (statt der in AP-1.2 für die Aussagenschleife
  eingeführten `ensureSpace()`/dynamischen Seitenbreite) — unkritisch, weil
  die Breite hier innerhalb der A4-Seite bleibt, aber eine sehr lange
  `pdfMessage` kann weiterhin unten aus der Seite laufen.
- Bei `shuffleStatements: true` weicht die Reihenfolge im Ergebnis-PDF von
  der Bildschirmreihenfolge ab, weil `render.php` nur die Anzeigekopie
  mischt, nicht `$groups_data` (die JSON-Quelle des PDFs). Rein kosmetisch.

### Nachtrag: Punktesystem pro Aussagensatz, Übungsblatt-Pool, `progressiveReveal`-Fix, Button-Styling (Phase 1, dritte Runde, `PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md`, 2026-09-09)

Dritte Nachbesserungsrunde am `summary-block`, ausgelöst durch eine
Diagnose vom 2026-09-08/09 zu vier gemeldeten Punkten. Vier
Implementierungs-APs, unabhängig review-geprüft (AP-1.rev): kein
kritischer Befund, zwei mittlere (**M1** — `block.json`-`version`, siehe
unten; **M2** — vorbestehend, siehe „Bekannte Einschränkungen" weiter
unten), elf geringe. Kein `AP-1.fix1` nötig, Phase merge-fähig. Details,
Fundstellen und Testnachweise: `PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md`
(Website-Root), Übergabenotizen AP-1.1–AP-1.4 und AP-1.rev; Datei-Referenzen:
`reference_file_map.md`.

1. **Übungsblatt-Pool: eine Aussage je Gruppe statt aller drei Formulierungen
   (AP-1.1, `render.php`, `view.js`).** Jede 3er-Gruppe enthält im
   Datenmodell drei Formulierungen **desselben Sachverhalts** (nur eine
   `isCorrect`). Der Übungsblatt-Pool (`$all_statement_texts` in
   `render.php`, gelesen von `generateTeacherPracticePDF()` in `view.js`)
   nahm bisher alle drei auf — eine Zufallsauswahl konnte dadurch mehrere
   Formulierungen desselben Fakts im selben Übungsblatt landen lassen.
   `render.php` baut den Pool jetzt pro Gruppe mit genau der (ersten)
   `isCorrect`-Aussage; fehlt einer Gruppe eine solche (Datenfehler im
   Editor), wird sie ohne Fehler übersprungen. Der JSON-Schlüssel heißt
   weiterhin `allStatementTexts`, enthält aber nur noch einen Eintrag je
   Gruppe. Die Eingabeobergrenze des Zahlenfelds (`max`) kommt seither aus
   der neuen Variable `$gesamt_gruppen = count($groups_data)`
   (Gruppenzahl) statt der früheren Gesamtzahl aller Einzelaussagen; das
   `value`-Attribut ist zusätzlich auf `min($teacher_pdf_count,
   $gesamt_gruppen)` geklemmt — behebt den bekannten Bug, dass das Feld mit
   einem ungültigen `value > max` öffnen konnte (z. B. `value="10"
   max="6"`). `view.js` dedupliziert den Pool zusätzlich defensiv
   (`Array.from(new Set(pool))`) gegen künftige, wortgleiche Duplikate.
   Das Lösungsblatt-PDF (`generateSolutionSheetPDF()`) ist davon
   unberührt und listet weiterhin alle Aussagen aller Gruppen.

2. **Punktesystem auf Aussagen-Trio umgestellt (AP-1.2, `view.js`,
   `index.js`).** Bisher zählte `calculateFinalScore()` „Anzahl richtiger
   Einzelaussagen minus `penaltyPerWrongAnswer` je Fehlklick". Jetzt ist
   jede 3er-Gruppe genau **einen** Punkt wert, verloren beim **ersten**
   Fehlklick in dieser Gruppe — weitere Fehlklicks in derselben Gruppe
   ändern am Ergebnis nichts mehr. Die dafür genutzte Datenstruktur
   `wrongAttemptsByGroup` (Gruppenindex → Anzahl Fehlklicks) existierte
   bereits aus dem vorherigen Nachtrag und wurde direkt wiederverwendet,
   keine neue Zählstruktur. `percentage` bezieht sich seither auf
   `groups.length` statt `totalCorrect`; `.score-display` zeigt „X von Y
   Aussagensätzen richtig (Z%)" (`strings.score` in `render.php` von
   `'Punkte'` auf `'Aussagensätzen richtig'` geändert, Schlüsselname
   unverändert). Alle fünf laut Diagnose abhängigen Stellen
   (`percentage`, `lastPercentage`, `pdfDownloadThreshold`-Vergleich,
   Text-/Icon-Schwellen `successText`/`partialSuccessText`/`failText`, die
   PDF-Zeile „Ergebnis: N% richtig") lesen denselben `percentage`-Wert und
   brauchten keine eigene Codeänderung — vom Review einzeln
   nachgeprüft. Die frühere Fallunterscheidung Regelmodus/`deferredFeedback`
   ist dabei vollständig entfallen: **beide Modi laufen jetzt über exakt
   denselben Code**, nicht über zwei synchron gehaltene Zweige (stärkste
   Form der geforderten Konsistenz — siehe aber G6/G7 unten zur
   `deferredFeedback`-Beobachtbarkeit). `penaltyPerWrongAnswer` ist unter
   diesem Modell **funktionslos**, bleibt aber bewusst im Datenmodell:
   in `block.json` unverändert als Attribut vorhanden (Kompatibilität mit
   gespeicherten Blockinstanzen), das zugehörige `RangeControl`
   „Punktabzug pro Fehler" wurde jedoch aus den `InspectorControls` in
   `index.js` entfernt (nur noch als Erklärkommentar). Die alte
   `score`/`wrongAttempts`/`penaltyPerWrong`-Buchführung in `view.js` läuft
   technisch weiter mit, ihr Ergebnis wird aber nirgends mehr gelesen
   (toter Code, bewusst nicht aufgeräumt, außerhalb des AP-Scopes).

3. **`progressiveReveal: false` erreicht jetzt die Ergebnisanzeige (AP-1.3,
   `view.js`).** Bei dieser Blockeinstellung wurde `showResults()` bisher
   nie erreicht — der Aufruf lag ausschließlich innerhalb eines
   `if (progressiveReveal) { … }`-Blocks in `handleStatementClick()`.
   **Abweichung vom ursprünglichen Plantext:** Statt eines Index-Vergleichs
   (`currentGroupIndex === groups.length - 1`, wie zunächst vorgeschlagen)
   verwendet die Umsetzung eine neue Hilfsfunktion `allGroupsCompleted()`
   (`Array.prototype.every.call(groupElements, isGroupCompleted)`) — ein
   Index-Vergleich hätte hier nie ausgelöst, weil bei
   `progressiveReveal: false` laut `resetQuiz()` von Anfang an ALLE
   Gruppen gleichzeitig sichtbar/bearbeitbar sind und `currentGroupIndex`
   dauerhaft bei `0` bleibt (`goToNextGroup()`, die einzige Stelle, die ihn
   erhöht, wird in diesem Modus nie aufgerufen). `allGroupsCompleted()`
   prüft stattdessen jede Gruppe einzeln, unabhängig von der
   Bearbeitungsreihenfolge — belegt per Test: Gruppe 2 vor Gruppe 0
   beantwortet erreicht `showResults()` genauso wie die aufsteigende
   Reihenfolge. Der bestehende `progressiveReveal: true`-Pfad blieb dabei
   unangetastet (nur ein neuer `else if`-Zweig ergänzt), keine Vermischung
   der beiden Modi. Der bereits vorbestehende `deferredFeedback`-Mangel
   (siehe „Bekannte Einschränkungen — Nachtrag Phase 1" oben) ist von
   dieser Änderung nicht betroffen: `allGroupsCompleted()` liefert dort
   weiterhin `false`, weil `isGroupCompleted()` in diesem Zweig auf
   `.correct`/`.incorrect` prüft, die dort nie gesetzt werden.

4. **Button-Styling vereinheitlicht (AP-1.4, `style.css`, `render.php`,
   Architekturentscheidung C4).** Eckenradius aller summary-block-Buttons
   von 4 px auf die im Plugin sonst übliche 6 px korrigiert (in BEIDEN
   Inline-Style-Strings `$button_style`/`$button_secondary_style` aus
   `render.php` **und** in `style.css` — die Inline-Styles überschreiben
   die externe Regel ohne `!important`, eine Änderung nur an einer Stelle
   wäre wirkungslos geblieben); primäre Buttons (`.continue-button`,
   `.pdf-download-button`, `.solution-button`) von hartkodiertem
   `color: #fff` auf `var(--color-text-on-accent, #ffffff)`; toter
   Google-Blau-Fallback `#1a73e8` durch `#e24614` ersetzt (Fokusring
   entsprechend auf `rgba(226, 70, 20, 0.1)`). **Die drei Sekundär-Buttons**
   (`.retry-button`, `.teacher-practice-pdf-button`,
   `.teacher-solution-sheet-button`) wechseln von der bisherigen
   Umriss-Optik (transparenter Hintergrund) auf das im Plugin bereits
   etablierte Muster für sekundäre Buttons — helle Fläche
   (`var(--color-background-light, #f8f9fa)`) + farbiger Rand, Vorbild
   `statement-summary/style.css:184-193`; Rand/Text bleiben bewusst an die
   bereits Customizer-gekoppelten lokalen Tokens `--sb-primary`/
   `--sb-primary-hover` gebunden statt auf die globalen
   `--color-ui-surface`-Variablen des Vorbilds umgestellt, um die Kopplung
   nicht doppelt zu führen. `render.php`s `$button_secondary_style` verliert
   dafür das bisherige `background: transparent;`.
   **Build-/Deploy-Falle (wichtig für künftige CSS-Änderungen an diesem
   Block):** `block.json` deklariert `"style": "file:./style-index.css"` —
   eine kompilierte, minifizierte Datei, **nicht** die von diesem AP
   bearbeitete Quelldatei `style.css` direkt. `includes/class-block-manager.php`
   bevorzugt beim Registrieren `build/blocks/<name>/`, wenn dieser Ordner
   existiert, sonst fällt es auf `blocks/<name>/style-index.css` direkt
   zurück. Der im Repo liegende `blocks/summary-block/style-index.css` ist
   ein bewusst **gitignorierter**, oft veralteter Kompilatrest — er wird
   von diesem Repo nie gelesen, solange `build/` existiert, und auch nicht
   von `create-block-zips.js` (zieht aus `build/blocks/<name>/`). **Die
   tatsächlich wirksame Datei ist also `build/blocks/summary-block/style-index.css`**
   (bzw. auf einem Server ohne `build/`-Ordner — wie dem Testserver — die
   frisch dorthin kopierte `blocks/summary-block/style-index.css`): Ohne
   `npm run build` + gezielten Kopiervorgang aus `build/blocks/summary-block/`
   wären CSS-Änderungen an `style.css` unsichtbar geblieben, obwohl der
   Quelltext korrekt geändert war. Alle Akzeptanzkriterien dieses APs wurden
   deshalb über **berechnete** Stile (`getComputedStyle()`) gegen die
   tatsächlich deployte kompilierte Datei geprüft, nicht nur gegen den
   Quelltext.

**`block.json`-`version` auf `2.2.3` erhöht (AP-1.doc, behebt Review-Befund
M1).** Die Version stand über zwei vorangegangene Phasen mit sichtbaren
Stylesheet-Änderungen unverändert bei `2.2.2`. WordPress nutzt dieses Feld
über `register_block_style_handle()` als `?ver=`-Cache-Buster, sobald das
Blockstylesheet als eigene Datei (nicht inline) ausgeliefert wird —
`wp_maybe_inline_styles()` bettet nur innerhalb eines gemeinsamen Budgets
von standardmäßig 20 000 Byte ein, und `style-index.css` allein wiegt
bereits über 14 000 Byte. Auf dem Testserver war das nicht reproduzierbar
(dort wird tatsächlich inline eingebettet), auf einer Produktivinstallation
mit weiteren Blockstylesheets auf derselben Seite ist das nicht garantiert
— ohne die Erhöhung hätten wiederkehrende Besucher das neue Button-Styling
aus AP-1.4 möglicherweise weiterhin mit den alten, aus dem Browser-Cache
bedienten Werten gesehen.

### Bekannte Einschränkungen — dritte Runde Phase 1 (Review AP-1.rev, `PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md`, 2026-09-09)

**M2 — behoben durch AP-1.fix1 (2026-09-09, nach dem Merge von Phase 1
nachgezogenes Korrektur-AP).** `resetQuiz()` entfernt seither in derselben
bestehenden Schleife zusätzlich `classList.remove('disabled', 'selected')`
je Aussage — exakt der unten im ursprünglichen Befund vorgeschlagene Fix.
Live per `getComputedStyle()` verifiziert: nach „Wiederholen" tragen alle
`.statement-option`-Elemente wieder `pointer-events: 'auto'`, in beiden
`progressiveReveal`-Modi; ein zweiter Durchlauf mit echten (auch falschen)
Mausklicks auf die vorher „steckenbleibenden" Aussagen liefert seither ein
korrekt abweichendes Ergebnis statt pauschal 100 %. Ursprünglicher Befund
(Historie, unverändert stehen gelassen):

**M2 — „Wiederholen" macht den zweiten Durchlauf trivial (vorbestehend,
NICHT durch diese Phase verursacht, aber hier erstmals durch AP-1.3
beobachtbar).** `resetQuiz()` (`view.js`, um Zeile 1040-1043) entfernt beim
Klick auf „Wiederholen" die Klassen `correct`/`incorrect`/
`solution-correct`/`solution-incorrect` und setzt die `disabled`-**Property**
zurück, **nicht** aber die gleichnamige CSS-**Klasse** `disabled`, die
`handleStatementClick()` bei Gruppenabschluss auf die übrigen Aussagen
dieser Gruppe setzt. Da `.statement-option.disabled` in `style.css` (Zeile
262-267) `pointer-events: none; opacity: 0.5` trägt, bleiben nach einem
Klick auf „Wiederholen" die meisten Aussagen-Buttons unklickbar — je Gruppe
bleibt nur die zuvor als richtig markierte Aussage anklickbar. Ein zweiter
Durchlauf zeigt dadurch praktisch immer 100 %. **Live gemessen: 48 von 75
Aussagen behielten nach „Wiederholen" `pointer-events:'none'`,
`opacity:'0.5'`.** Der Mangel existiert nachweislich bereits auf `main`
(identischer Code, identische CSS-Regel dort) und verletzt kein
Akzeptanzkriterium dieses Plans — er wird hier nur deshalb erstmals
beobachtbar, weil AP-1.3 den „Wiederholen"-Knopf erstmals auch im Modus
`progressiveReveal: false` erreichbar macht, wo eine zweite Ergebnisanzeige
vorher unerreichbar war. **Das ist ein potenziell wichtiger Fund für den
Betreiber und ein klarer Kandidat für einen eigenen Folgeplan** (Fix: in
`resetQuiz()` zusätzlich `classList.remove('disabled', 'selected')` je
Aussage ergänzen).

**G6/G7 — latente Semantik der neuen `calculateFinalScore()` im
`deferredFeedback`-Modus (gering, `view.js`).** Die Umstellung auf das
gruppenbasierte Punktemodell (Punkt 2 oben) gilt seit AP-1.2 formal auch im
`deferredFeedback`-Modus (ein einziger Codepfad für beide Modi). Sie ist
dort aber aktuell **nicht beobachtbar**, weil `showResults()` in diesem
Modus weiterhin unerreichbar bleibt — der vorbestehende, von diesem Plan
bewusst nicht behobene Mangel, dass `isGroupCompleted()` im
`deferredFeedback`-Zweig auf `.correct`/`.incorrect` prüft, die dort nie
gesetzt werden (siehe „Bekannte Einschränkungen — Nachtrag Phase 1" oben,
letzter Absatz). Bisher galt in diesem Modus Alles-oder-nichts pro BLOCK,
künftig (sobald der `deferredFeedback`-Mangel einmal behoben wird) griffe
ohne weiteres Zutun die Gruppenzählung. Zusätzlich (G7): Eine nie
angeklickte Gruppe zählt in der neuen Formel (`!wrongAttemptsByGroup[index]`)
als richtig — heute folgenlos, weil `showResults()` ausschließlich nach
Abschluss aller Gruppen erreichbar ist und das alte Modell genauso rechnete
(keine Regression), aber die Funktion ist damit nicht selbstsichernd
gegenüber einem künftigen „Jetzt auswerten"-Knopf für unvollständige
Durchläufe.

## Security Considerations

- All admin functions check `current_user_can('manage_options')`
- AJAX requests validate nonces with `check_ajax_referer()`
- User inputs are sanitized with `sanitize_text_field()`, `esc_html()`, `esc_attr()`, `esc_url()`
- Direct file access prevented with `if (!defined('ABSPATH')) exit;`
- Block attributes should define `type` and use WordPress sanitization

## WordPress Standards

- Follow WordPress PHP Coding Standards
- Use WordPress function prefixes to avoid conflicts
- Hooks are registered via the Loader pattern
- Translations ready with `__()`, `_e()`, and text domain `modular-blocks-plugin`
- Plugin constants: `MODULAR_BLOCKS_PLUGIN_VERSION`, `MODULAR_BLOCKS_PLUGIN_URL`, `MODULAR_BLOCKS_PLUGIN_PATH`

## ChemViz Integration

### External Libraries

ChemViz blocks require external JavaScript libraries for 3D visualization and charting:

**3Dmol.js** (v2.0.3+)
- License: BSD-3-Clause
- Used by: `molecule-viewer` block
- Location: `assets/js/vendor/3Dmol-min.js` or CDN
- Documentation: https://3dmol.csb.pitt.edu/doc/

**Plotly.js** (v2.27.1+)
- License: MIT
- Used by: `interactive-data-chart`
- Location: `assets/js/vendor/plotly-2.27.1.min.js` or CDN
- Documentation: https://plotly.com/javascript/

**Chart Templates** (custom)
- Location: `assets/js/chart-templates.js`
- Predefined chemistry chart configurations (titration, kinetics, phase diagrams, IR spectra, Lineweaver-Burk)

### Asset Loading Strategy

The plugin uses conditional loading via `ModularBlocks_ChemViz_Enqueue` class:
- Libraries are only loaded when their respective blocks are present on the page
- Uses `has_block()` to detect block presence
- Falls back to CDN if local files are not found
- Filter `modular_blocks_use_cdn` can force CDN usage

### ChemViz Shortcodes

Two shortcodes are available for backward compatibility and flexible content integration:

**Molecule Viewer Shortcode:**
```php
[chemviz_molecule pdb="1YCR" style="cartoon" color="spectrum" width="800" height="600"]
[chemviz_molecule url="/path/to/structure.pdb" controls="true" spin="false"]
```

**Chart Shortcode:**
```php
[chemviz_chart template="titration"]
[chemviz_chart type="scatter" data='[{"x":[1,2,3],"y":[4,5,6]}]' title="Custom Chart"]
```

**ACHTUNG:** `[chemviz_chart]` ist derzeit AUSSER FUNKTION — er referenzierte den
entfernten chart-block und sein Markup wird von keinem Script verarbeitet.
Redakteure sehen einen Hinweis, Besucher nichts. Stattdessen den Block
„Interaktives Datendiagramm" verwenden. Details: VERBESSERUNGSPLAN-3.md (AP32/AP35).

Implementation in `includes/class-chemviz-shortcodes.php`.

### Example Structures

Sample molecule files are provided in `assets/structures/`:
- `water.pdb` - H₂O (simple example)
- `ethanol.pdb` - C₂H₆O (organic molecule)

Users can upload their own PDB, SDF, MOL, XYZ, or CIF files via WordPress Media Library.

### ChemViz Block Architecture

**molecule-viewer Block:**
- `view.js` handles 3D rendering with lazy loading via IntersectionObserver
- Stores viewer instances in a Map for cleanup and control
- Keyboard navigation: Arrow keys (rotate), +/- (zoom), R (reset)
- Fullscreen API support with vendor prefixes
- ARIA labels for accessibility

**interactive-data-chart:**
- `view.js` initializes Plotly charts with template or custom data
- Responsive resizing with debounced handler
- Template system loads predefined chemistry diagrams
- Plotly configuration allows interactive features (zoom, pan, export)

## Development Notes

- Debug-Logging läuft über `modular_blocks_debug_log()` (nur bei WP_DEBUG + WP_DEBUG_LOG aktiv); echte Fehler werden immer geloggt
- Block discovery ist per Transient gecacht (`modular_blocks_dir_cache`, 12h); Invalidierung bei Block-Upload/-Löschung/-Anlage und Plugin-Aktivierung
- Admin interface instantiates a fresh Block_Manager to get current block list
- ChemViz libraries can be downloaded via npm scripts or will fall back to CDN
- For production, download libraries locally with `npm run download-libs` to ensure GDPR compliance and offline functionality
