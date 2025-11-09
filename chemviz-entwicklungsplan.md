# ChemViz Plugin - Vollständiger Entwicklungsplan für Claude Code

## 🎯 Projektübersicht

**Plugin-Name**: ChemViz - Interactive Chemistry Visualizations  
**Version**: 1.0.0  
**Zweck**: WordPress-Plugin für interaktive 3D-Molekülvisualisierung, Diagramme und Chemie-Simulationen  
**Zielgruppe**: Chemielehrer an FOS/BOS, Schüler  
**Lizenz**: MIT

**Technologie-Stack**:
- 3Dmol.js v2.0.3 (3D-Moleküle, BSD-3-Clause)
- Plotly.js v2.27.1 (wissenschaftliche Diagramme, MIT)
- Kekule.js v0.9.5 (Moleküleditor, MIT)
- WordPress 6.0+ mit Gutenberg
- PHP 7.4+
- JavaScript ES6+

---

## 📦 Komplette Verzeichnisstruktur

```
chemviz/
├── chemviz.php                          # Haupt-Plugin-Datei
├── readme.txt                           # WordPress.org Plugin-Beschreibung
├── LICENSE.txt                          # MIT Lizenz
├── uninstall.php                        # Aufräumen bei Deinstallation
├── package.json                         # NPM-Konfiguration
├── package-lock.json
├── webpack.config.js                    # Build-Konfiguration
├── .gitignore
├── .distignore                          # Für Release-ZIP
│
├── includes/                            # PHP-Kernfunktionalität
│   ├── class-chemviz.php               # Hauptklasse
│   ├── class-chemviz-activator.php     # Aktivierungs-Logik
│   ├── class-chemviz-deactivator.php   # Deaktivierungs-Logik
│   ├── class-chemviz-loader.php        # Hooks & Filters Loader
│   ├── class-chemviz-i18n.php          # Internationalisierung
│   └── class-chemviz-shortcodes.php    # Shortcode-System
│
├── admin/                               # Backend-Funktionalität
│   ├── class-chemviz-admin.php         # Admin-Controller
│   ├── js/
│   │   └── chemviz-admin.js            # Admin-JavaScript
│   └── css/
│       └── chemviz-admin.css           # Admin-Styles
│
├── public/                              # Frontend-Funktionalität
│   ├── class-chemviz-public.php        # Public-Controller
│   ├── js/                              
│   │   ├── chemviz-public.js           # Main Frontend JS
│   │   └── src/                         # Eigener Quellcode
│   │       ├── molecule-viewer.js      # 3Dmol.js Wrapper
│   │       ├── chart-creator.js        # Plotly.js Wrapper
│   │       ├── chart-templates.js      # Vordefinierte Diagramme
│   │       └── molecule-editor.js      # Kekule.js Wrapper
│   └── css/
│       └── chemviz-public.css          # Frontend-Styles (BEM)
│
├── assets/                              # Statische Assets
│   ├── js/
│   │   └── vendor/                      # Externe Bibliotheken
│   │       ├── 3Dmol-min.js            # 3Dmol.js (lokal)
│   │       ├── plotly-2.27.1.min.js    # Plotly.js (lokal)
│   │       └── kekule/                  # Kekule.js Distribution
│   ├── structures/                      # Beispiel-Molekülstrukturen
│   │   ├── water.sdf
│   │   ├── ethanol.mol
│   │   └── aspirin.pdb
│   └── images/
│       └── icon-256x256.png            # Plugin-Icon
│
├── blocks/                              # Gutenberg Blocks
│   ├── molecule-viewer/                 # 3D-Molekül-Block
│   │   ├── block.json
│   │   ├── index.js
│   │   ├── edit.js
│   │   ├── save.js
│   │   ├── editor.scss
│   │   └── style.scss
│   ├── chart-block/                     # Diagramm-Block
│   │   ├── block.json
│   │   ├── index.js
│   │   ├── edit.js
│   │   ├── save.js
│   │   └── style.scss
│   └── molecule-editor/                 # Moleküleditor-Block
│       ├── block.json
│       ├── index.js
│       ├── edit.js
│       ├── save.js
│       └── style.scss
│
├── languages/                           # Übersetzungen
│   ├── chemviz-de_DE.po
│   └── chemviz-de_DE.mo
│
├── tests/                               # Tests
│   ├── php/
│   │   └── test-chemviz-shortcodes.php
│   └── js/
│       └── molecule-viewer.test.js
│
└── build/                               # Kompilierte Assets (gitignored)
```

---

## 🚀 SCHNELLSTART: Claude Code Prompts

### Prompt 1: Grundstruktur erstellen

```
Erstelle die komplette Grundstruktur für das WordPress-Plugin "ChemViz":

AUFGABEN:
1. Alle Verzeichnisse gemäß Struktur erstellen
2. Haupt-Plugin-Datei chemviz.php mit vollständigem Header
3. Autoloader für PSR-4-ähnliche Klassen
4. Basis-Klassen in includes/:
   - class-chemviz.php (Hauptklasse)
   - class-chemviz-loader.php (Hooks-System)
   - class-chemviz-activator.php (Aktivierung)
   - class-chemviz-deactivator.php (Deaktivierung)
   - class-chemviz-shortcodes.php (Shortcode-Gerüst)
5. Admin-Klasse in admin/class-chemviz-admin.php
6. Public-Klasse in public/class-chemviz-public.php
7. package.json mit @wordpress/scripts
8. .gitignore und .distignore

ANFORDERUNGEN:
- Namespace: ChemViz\Core, ChemViz\Admin, ChemViz\PublicArea
- Alle PHP-Dateien mit defined('ABSPATH') Check
- Konstanten: CHEMVIZ_VERSION, CHEMVIZ_PLUGIN_DIR, CHEMVIZ_PLUGIN_URL
- WordPress Coding Standards
- PHPDoc-Kommentare für alle Funktionen
- MIT-Lizenz

Erstelle vollständigen, funktionstüchtigen Code ohne Platzhalter.
```

---

### Prompt 2: Asset-Management und Enqueue-System

```
Implementiere das Asset-Management-System für ChemViz:

AUFGABEN für public/class-chemviz-public.php:

1. enqueue_scripts() Methode:
   - Conditional Loading mit has_block('chemviz/molecule-viewer')
   - wp_enqueue_script für 3Dmol.js mit defer-Strategy
   - wp_enqueue_script für Plotly.js mit defer-Strategy
   - wp_enqueue_script für Kekule.js mit defer-Strategy
   - wp_enqueue_script für chemviz-public.js
   - wp_localize_script mit ajaxUrl, nonce, structuresUrl

2. enqueue_styles() Methode:
   - CSS mit BEM-Notation laden

AUFGABEN für public/css/chemviz-public.css:

3. CSS mit BEM-Notation erstellen:
   - .chemviz-viewer und Unterelemente
   - .chemviz-viewer__container mit Aspect-Ratio
   - .chemviz-viewer__canvas mit absolute Positioning
   - .chemviz-viewer__controls mit Flexbox
   - .chemviz-viewer__button mit Touch-Target-Größe 44x44px
   - .chemviz-sr-only für Screen-Reader
   - Responsive Media Queries
   - prefers-reduced-motion Support

AUFGABEN für public/js/chemviz-public.js:

4. JavaScript mit IIFE-Pattern:
   - ChemViz Namespace
   - init() Methode mit DOM Ready
   - Platzhalter für initMoleculeViewers(), initCharts(), initMoleculeEditors()

Alle Scripts mit 'use strict' und vollständiger Error-Handling.
```

---

### Prompt 3: 3D-Molekül-Block erstellen

```
Erstelle den Gutenberg Block "molecule-viewer" für 3D-Molekülvisualisierung:

AUFGABEN:

1. Verzeichnis blocks/molecule-viewer/ erstellen

2. block.json mit Attributen:
   - sourceType (pdb/url/upload)
   - pdbId, structureUrl, structureData
   - displayStyle (stick/sphere/cartoon/line/surface)
   - colorScheme (default/carbon/spectrum/chain/ss)
   - backgroundColor, width, height
   - showControls, enableSpin
   - ariaLabel, description

3. edit.js mit:
   - InspectorControls für alle Einstellungen
   - SelectControl für sourceType, displayStyle, colorScheme
   - TextControl für pdbId, structureUrl
   - Button für Media Library Upload
   - RangeControl für width/height
   - ToggleControl für showControls/enableSpin
   - ColorPicker für backgroundColor
   - Preview-Placeholder im Editor

4. save.js mit:
   - data-Attributen für Frontend-Initialisierung
   - Responsive Container mit Aspect-Ratio
   - ARIA-Attribute für Accessibility
   - Controls-Buttons (Reset, Spin, Fullscreen)
   - Screen-Reader-Beschreibung

5. style.scss für Block-Styles

Vollständiger, funktionstüchtiger Code ohne TODO-Kommentare.
```

---

### Prompt 4: 3D-Molekül Frontend-JavaScript

```
Implementiere die Frontend-Initialisierung für den 3D-Molekül-Block:

DATEI: public/js/src/molecule-viewer.js

AUFGABEN:

1. IIFE-wrapped Modul ChemVizMoleculeViewer

2. init() Methode:
   - Alle [data-chemviz-viewer] Elemente finden
   - Für jeden Viewer initSingleViewer() aufrufen

3. initSingleViewer() Methode:
   - Config aus data-Attributen lesen
   - Intersection Observer für Lazy Loading
   - attachControlListeners() aufrufen
   - setupKeyboardNav() aufrufen

4. loadViewer() Methode:
   - $3Dmol.createViewer() initialisieren
   - PDB-Struktur laden (via $3Dmol.pdb() oder jQuery.get())
   - applyStyle() mit displayStyle und colorScheme
   - viewer.zoomTo() und viewer.render()
   - Auto-Spin wenn aktiviert
   - Viewer-Instanz in Map speichern
   - setupResizeHandler()

5. applyStyle() Methode:
   - Style-Config für 3Dmol.js erstellen
   - Color-Scheme anwenden

6. getFormatFromUrl() Methode:
   - Dateiendung erkennen (.pdb, .sdf, .mol, .xyz, .cif)

7. attachControlListeners() Methode:
   - Event-Listener für Reset, Spin, Fullscreen
   - viewer.zoomTo(), viewer.spin(), requestFullscreen()

8. setupResizeHandler() Methode:
   - Debounced Resize mit 250ms Verzögerung
   - viewer.resize() und viewer.render()

9. setupKeyboardNav() Methode:
   - Pfeiltasten für Rotation
   - +/- für Zoom
   - R für Reset

10. showError() Methode für Fehlerbehandlung

Integration in chemviz-public.js:
- initMoleculeViewers() ruft ChemVizMoleculeViewer.init() auf

Vollständiger Code mit Error-Handling und Accessibility.
```

---

### Prompt 5: Shortcode-System implementieren

```
Implementiere das Shortcode-System für ChemViz:

DATEI: includes/class-chemviz-shortcodes.php

AUFGABEN:

1. Klasse ChemViz_Shortcodes im Namespace ChemViz\Core

2. init() Methode:
   - add_shortcode('chemviz_molecule', ...)
   - add_shortcode('chemviz_chart', ...)
   - add_shortcode('chemviz_editor', ...)

3. molecule_viewer_shortcode($atts) Methode:
   - shortcode_atts mit Defaults:
     * pdb, url, style, color, background
     * width, height, controls, spin, label
   - Conditional Script-Enqueuing (wp_enqueue_script wenn nicht geladen)
   - Unique Viewer-ID generieren
   - data-Attribute für Frontend-Initialisierung
   - Aspect-Ratio berechnen
   - HTML-Output mit ob_start/ob_get_clean
   - Sanitization mit esc_attr, esc_url
   - ARIA-Labels

4. chart_shortcode($atts) Methode (Gerüst):
   - Vorbereitung für Phase 6

5. molecule_editor_shortcode($atts) Methode (Gerüst):
   - Vorbereitung für Phase 7

HTML-Struktur identisch zum Block save.js für Konsistenz.
Vollständige Sanitization und Security.
```

---

### Prompt 6: Admin-Bereich erstellen

```
Entwickle den Admin-Bereich für ChemViz:

DATEI: admin/class-chemviz-admin.php

AUFGABEN:

1. Klasse ChemViz_Admin im Namespace ChemViz\Admin

2. init() Methode:
   - add_action('admin_menu', ...)
   - add_action('admin_init', ...)
   - add_action('admin_enqueue_scripts', ...)

3. add_admin_menu() Methode:
   - add_menu_page für ChemViz (dashicons-atom)
   - add_submenu_page für "Einstellungen"
   - add_submenu_page für "Bibliotheken"
   - add_submenu_page für "Beispiele"

4. register_settings() Methode:
   - register_setting('chemviz_options', 'chemviz_settings')
   - add_settings_section für Allgemeine Einstellungen
   - add_settings_field für library_source, default_viewer_style, enable_lazy_loading

5. render_settings_page() Methode:
   - settings_fields() und do_settings_sections()
   - System-Information Tabelle:
     * Plugin-Version, PHP-Version, WordPress-Version
     * Status der Bibliotheken (3Dmol.js, Plotly.js, Kekule.js)

6. render_libraries_page() Methode:
   - Übersicht über alle verwendeten Bibliotheken
   - Lizenz-Informationen
   - Links zu Dokumentation und Releases

7. render_examples_page() Methode:
   - Code-Snippets für Shortcodes mit Copy-Button
   - Parameter-Tabelle
   - Gutenberg-Block-Hinweise

8. sanitize_settings($input) Callback

9. enqueue_admin_scripts($hook) Methode:
   - Nur auf ChemViz-Seiten laden (strpos check)

DATEI: admin/css/chemviz-admin.css
- Styling für Admin-Seiten

Vollständiger, sicherer Code mit current_user_can('manage_options') Checks.
```

---

### Prompt 7: Chart-Templates und Plotly.js Integration

```
Implementiere Chart-Templates für häufige Chemie-Diagramme:

DATEI: public/js/src/chart-templates.js

AUFGABEN:

1. Export const ChartTemplates mit vordefinierten Templates:

   - titrationCurve:
     * x: Volumen Base (0-40 mL)
     * y: pH-Wert (3-12)
     * Layout mit Achsenbeschriftungen
     * type: 'scatter', mode: 'lines+markers'

   - firstOrderKinetics:
     * x: Zeit (0-100 min)
     * y: Konzentration (exponentiell abfallend)
     * Layout für Reaktionskinetik
     
   - phaseDiagram:
     * Drei Arrays für Fest-Flüssig, Flüssig-Gas, Fest-Gas
     * Logarithmische y-Achse (Druck)
     * x-Achse: Temperatur

   - lineweaverBurk:
     * 1/[S] vs 1/v für Enzymkinetik
     * Lineare Regression

   - irSpectrum:
     * Wellenzahl (4000-500 cm⁻¹) reversed
     * Transmission (%)
     * Fill tozeroy

2. Jedes Template mit:
   - name (String)
   - data (Object/Array)
   - layout (Object mit title, xaxis, yaxis)
   - config (Object mit type, mode, etc.)

DATEI: public/js/src/chart-creator.js

3. ChemVizChartCreator Modul:
   - init() für alle [data-chemviz-chart] Elemente
   - loadChart() mit Plotly.newPlot()
   - Template-Loader aus chart-templates.js
   - Responsive: Plotly.Plots.resize()

Export für Integration in chemviz-public.js
```

---

### Prompt 8: Chart-Block erstellen

```
Erstelle den Gutenberg Block "chart-block" für Diagramme:

DATEI: blocks/chart-block/block.json

1. Attribute:
   - chartType (scatter/bar/line/heatmap/3d)
   - chartData (JSON-String)
   - chartTemplate (titration/kinetics/phase/lineweaver/ir)
   - chartTitle, xAxisLabel, yAxisLabel
   - showLegend, chartTemplate
   - width, height

DATEI: blocks/chart-block/edit.js

2. Editor mit:
   - InspectorControls:
     * SelectControl für chartType
     * SelectControl für chartTemplate (mit Templates aus chart-templates.js)
     * Button "Template laden"
     * TextareaControl für chartData (JSON)
     * TextControl für chartTitle, xAxisLabel, yAxisLabel
     * ToggleControl für showLegend
     * RangeControl für width/height
   - Preview mit Plotly im Editor (optional vereinfacht)

DATEI: blocks/chart-block/save.js

3. Frontend-Output:
   - data-Attribute für Initialisierung
   - Container mit max-width
   - Loading-Indikator

4. Integration:
   - chart-creator.js initialisiert alle Diagramme
   - Plotly.js conditional loading in enqueue_scripts()

Vollständiger Code mit Template-Integration.
```

---

### Prompt 9: Package.json und Build-System

```
Richte das Build-System für ChemViz ein:

DATEI: package.json

1. Basis-Konfiguration:
   - name, version, description, author, license
   - scripts:
     * "build": "wp-scripts build"
     * "start": "wp-scripts start"
     * "lint:js": "wp-scripts lint-js"
     * "lint:css": "wp-scripts lint-style"
     * "format": "wp-scripts format"
     * "test": "wp-scripts test-unit-js"
   - devDependencies:
     * @wordpress/scripts
     * @wordpress/create-block

DATEI: webpack.config.js (optional)

2. Erweiterte Konfiguration falls nötig:
   - Multi-Entry-Points für Blocks
   - Custom Output-Path

DATEI: .gitignore

3. Git-Ignore:
   - node_modules/
   - build/
   - *.log
   - .DS_Store

DATEI: .distignore

4. Distribution-Ignore für Release-ZIP:
   - .git, .github
   - node_modules, src
   - tests
   - .editorconfig, .eslintrc
   - package.json, webpack.config.js
   - phpunit.xml

DATEI: build-release.sh

5. Bash-Script für Release:
   - Cleanup build-release/
   - rsync mit --exclude-from
   - npm ci --production
   - npm run build
   - Cleanup Dev-Files
   - ZIP-Erstellung

Ausführbare Scripts mit chmod +x.
```

---

### Prompt 10: Testing und Dokumentation

```
Erstelle Tests und Dokumentation für ChemViz:

DATEI: tests/js/molecule-viewer.test.js

1. Jest-Tests:
   - Test für init() findet Viewer
   - Test für getFormatFromUrl()
   - Test für data-Attribut-Parsing
   - DOM-Setup mit @jest-environment jsdom

DATEI: tests/php/test-chemviz-shortcodes.php

2. PHPUnit-Tests:
   - test_molecule_viewer_shortcode_exists()
   - test_molecule_viewer_shortcode_output()
   - test_shortcode_sanitization()
   - extends WP_UnitTestCase

DATEI: README.md

3. Benutzer-Dokumentation:
   - Features-Übersicht
   - Installation
   - Verwendung (Blocks + Shortcodes)
   - Beispiele mit Screenshots
   - Technische Details
   - FAQ
   - Support-Kontakt

DATEI: readme.txt

4. WordPress.org Plugin-Readme:
   - === ChemViz === Format
   - Tags, Requires, Tested up to
   - Short Description
   - Description
   - Installation
   - Frequently Asked Questions
   - Screenshots
   - Changelog

DATEI: CHANGELOG.md

5. Versions-History:
   - ## [1.0.0] - 2025-10-03
   - ### Added, ### Changed, ### Fixed

Vollständige Dokumentation für User und Entwickler.
```

---

## 📚 Wichtige Code-Snippets

### BEM CSS-Beispiel

```css
/* Viewer Container */
.chemviz-viewer {
    position: relative;
    width: 100%;
    margin: 20px 0;
}

.chemviz-viewer__container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 75%; /* 4:3 Aspect Ratio */
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
}

.chemviz-viewer__canvas {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    cursor: grab;
}

.chemviz-viewer__canvas:active {
    cursor: grabbing;
}

.chemviz-viewer__button {
    min-width: 44px;
    min-height: 44px;
    padding: 8px 16px;
    background-color: #0073aa;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.chemviz-viewer__button:focus {
    outline: 3px solid #4A90E2;
    outline-offset: 2px;
}

/* Screen Reader Only */
.chemviz-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* Responsive */
@media (max-width: 768px) {
    .chemviz-viewer__controls {
        flex-direction: column;
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### IIFE-Pattern für JavaScript

```javascript
(function(window, $, chemvizData) {
    'use strict';

    const ChemViz = {
        init: function() {
            console.log('ChemViz initialized');
            this.initMoleculeViewers();
            this.initCharts();
        },

        initMoleculeViewers: function() {
            if (typeof window.ChemVizMoleculeViewer !== 'undefined') {
                window.ChemVizMoleculeViewer.init();
            }
        },

        initCharts: function() {
            if (typeof window.ChemVizChartCreator !== 'undefined') {
                window.ChemVizChartCreator.init();
            }
        }
    };

    // DOM Ready
    $(document).ready(function() {
        ChemViz.init();
    });

    // Export für Debugging
    window.ChemViz = ChemViz;

})(window, jQuery, chemvizData);
```

### Shortcode-Beispiele für Benutzer

```
# Einfaches Molekül aus PDB
[chemviz_molecule pdb="1YCR"]

# Mit allen Optionen
[chemviz_molecule pdb="4HHB" style="cartoon" color="spectrum" width="800" height="600" controls="true" spin="false" background="#1a1a1a"]

# Hochgeladene Struktur
[chemviz_molecule url="/wp-content/uploads/structures/aspirin.pdb" style="stick"]

# Mit ARIA-Label
[chemviz_molecule pdb="2NA5" label="DNA-Doppelhelix Struktur"]
```

---

## ✅ Erfolgsmetriken & Checkliste

### Funktionalität
- [ ] Alle 3 Gutenberg Blocks funktionieren
- [ ] Shortcodes für alle Features verfügbar
- [ ] 3D-Moleküle laden aus PDB und lokalen Dateien
- [ ] Interaktive Steuerelemente (Reset, Spin, Fullscreen)
- [ ] Charts rendern mit Plotly.js
- [ ] Templates für häufige Chemie-Diagramme

### Performance
- [ ] Lighthouse Performance Score > 80
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Lazy Loading für Visualisierungen
- [ ] Conditional Script-Loading funktioniert
- [ ] Keine JavaScript-Konsolen-Fehler

### Accessibility
- [ ] WCAG 2.1 AA Compliance
- [ ] Tastaturnavigation funktioniert vollständig
- [ ] ARIA-Labels auf allen interaktiven Elementen
- [ ] Focus-Indikatoren sichtbar (min. 3:1 Kontrast)
- [ ] Screen-Reader-freundliche Textalternativen
- [ ] prefers-reduced-motion wird respektiert
- [ ] Color-Contrast-Ratios erfüllt

### Kompatibilität
- [ ] Chrome/Chromium (Desktop + Mobile) ✓
- [ ] Firefox (Desktop + Mobile) ✓
- [ ] Safari (Desktop + iOS) ✓
- [ ] Edge ✓
- [ ] Responsive auf Tablets 768px
- [ ] Responsive auf Smartphones 375px

### Code-Qualität
- [ ] WordPress Coding Standards befolgt
- [ ] Keine PHP Warnings/Errors
- [ ] ESLint ohne Fehler
- [ ] Stylelint ohne Fehler
- [ ] PHPDoc-Kommentare vorhanden
- [ ] JSDoc-Kommentare vorhanden

### Dokumentation
- [ ] README.md vollständig
- [ ] readme.txt für WordPress.org
- [ ] CHANGELOG.md gepflegt
- [ ] Code-Kommentare ausreichend
- [ ] Beispiele im Admin-Bereich

### Testing
- [ ] Jest Unit-Tests (JavaScript)
- [ ] PHPUnit Tests (PHP)
- [ ] Manuelle Browser-Tests
- [ ] Accessibility-Tests mit WAVE
- [ ] Performance-Tests mit Lighthouse

### Deployment
- [ ] Build-Prozess funktioniert (npm run build)
- [ ] Release-Script erstellt ZIP korrekt
- [ ] .distignore vollständig
- [ ] Version-Nummern konsistent
- [ ] Git-Tags für Releases

---

## 🔧 Entwicklungs-Workflow

### 1. Lokale Entwicklung starten

```bash
# Im Plugin-Verzeichnis
npm install
npm run start  # Watch-Modus für Entwicklung
```

### 2. Nach jeder Änderung testen

```bash
# Linting
npm run lint:js
npm run lint:css

# Tests
npm run test

# Browser-Test
# Seite neu laden und in DevTools Console prüfen
```

### 3. Production-Build erstellen

```bash
npm run build
```

### 4. Release erstellen

```bash
# Version in chemviz.php und package.json erhöhen
# CHANGELOG.md aktualisieren
./build-release.sh
```

---

## 🎓 Lernressourcen

### WordPress-Entwicklung
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/)

### JavaScript-Bibliotheken
- [3Dmol.js Dokumentation](https://3dmol.csb.pitt.edu/doc/)
- [Plotly.js JavaScript Documentation](https://plotly.com/javascript/)
- [Kekule.js Documentation](http://partridgejiang.github.io/Kekule.js/)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

## 🆘 Troubleshooting

### Problem: 3Dmol.js lädt nicht
**Lösung**: Prüfen Sie in Browser-Console:
```javascript
console.log(typeof $3Dmol);  // sollte 'object' sein
```
Falls 'undefined': Script-Enqueue-Reihenfolge prüfen.

### Problem: Block erscheint nicht im Editor
**Lösung**:
```bash
# Build neu erstellen
npm run build

# WordPress Cache leeren
# Im Browser: Strg+Shift+R (Hard Reload)
```

### Problem: Shortcode zeigt nur Text
**Lösung**: Shortcode-Registrierung in class-chemviz-shortcodes.php prüfen:
```php
add_shortcode('chemviz_molecule', array($this, 'molecule_viewer_shortcode'));
```

### Problem: CSS-Konflikte mit Theme
**Lösung**: BEM-Präfix prüfen - alle Klassen müssen mit `.chemviz-` beginnen.

---

## 📞 Support & Community

- **GitHub Issues**: [Link zu Ihrem Repository]
- **WordPress.org Support**: [Nach Veröffentlichung]
- **Dokumentation**: Im Admin-Bereich unter ChemViz → Beispiele

---

**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-10-03  
**Lizenz**: MIT

---

# 🎉 Los geht's mit Claude Code!

Kopieren Sie die Prompts 1-10 nacheinander in Claude Code und entwickeln Sie Schritt für Schritt Ihr professionelles WordPress-Plugin für Chemie-Visualisierungen.

**Viel Erfolg!**
