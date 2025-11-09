# ChemViz Integration - Vollständige Dokumentation

## Übersicht

Das Modulare Blöcke Plugin wurde erfolgreich um ChemViz-Funktionalität erweitert. ChemViz ermöglicht die interaktive 3D-Visualisierung von Molekülen und wissenschaftliche Diagramme für den Chemieunterricht.

## Neu hinzugefügte Dateien

### Gutenberg Blocks

#### 1. Molecule Viewer Block (`blocks/molecule-viewer/`)
- `block.json` - Block-Definition mit allen Attributen
- `index.js` - Editor-Interface mit React-Komponenten
- `view.js` - Frontend 3D-Rendering mit 3Dmol.js
- `style.css` - Frontend-Styles (BEM-Notation)
- `editor.css` - Editor-Styles

**Features:**
- Laden von Strukturen aus PDB-Datenbank (z.B. PDB ID: 1YCR)
- Upload eigener Strukturdateien (PDB, SDF, MOL, XYZ, CIF)
- Externe URLs für Strukturdateien
- 5 Display-Stile: Stick, Sphere, Cartoon, Line, Surface
- 5 Farbschemata: Default, Carbon, Spectrum, Chain, Secondary Structure
- Interaktive Steuerelemente (Reset, Spin, Fullscreen)
- Tastaturnavigation (Pfeiltasten, +/-, R)
- ARIA-Labels für Barrierefreiheit
- Lazy Loading via IntersectionObserver

#### 2. Chart Block (`blocks/chart-block/`)
- `block.json` - Block-Definition
- `index.js` - Editor-Interface
- `view.js` - Plotly.js Chart-Rendering
- `style.css` - Chart-Styles
- `editor.css` - Editor-Styles

**Features:**
- 5 vordefinierte Chemie-Templates:
  - Titrationskurve (Säure-Base)
  - Reaktionskinetik (1. Ordnung)
  - Phasendiagramm
  - Lineweaver-Burk-Diagramm
  - IR-Spektrum
- Eigene Daten via JSON
- Interaktive Diagramme (Zoom, Pan)
- Export-Funktionen
- Responsive Design

### JavaScript Module

#### `assets/js/chart-templates.js`
Vordefinierte Chemie-Diagramm-Konfigurationen:
- Jedes Template enthält vorgefertigte Daten, Layout und Plotly-Config
- Wiederverwendbar für Blocks und Shortcodes
- Wissenschaftlich korrekte Beispieldaten

#### `blocks/molecule-viewer/view.js`
3D-Molekül-Rendering-Engine:
- IntersectionObserver für Performance
- Viewer-Instanzen-Management
- Event-Handling für Controls
- Keyboard-Navigation
- Fullscreen-Support
- Error-Handling

#### `blocks/chart-block/view.js`
Chart-Rendering-Engine:
- Template-Loading
- Custom-Data-Parsing
- Responsive Resize-Handler
- Plotly-Integration

### PHP Classes

#### `includes/class-chemviz-enqueue.php`
Asset-Management für ChemViz-Bibliotheken:
- Conditional Loading (nur wenn Blocks vorhanden)
- CDN vs. lokale Dateien
- Fallback-Mechanismus
- Filter für CDN-Nutzung: `modular_blocks_use_cdn`

**Wichtige Methoden:**
- `enqueue_chemviz_assets()` - Frontend-Enqueuing
- `enqueue_3dmol()` - 3Dmol.js laden
- `enqueue_plotly()` - Plotly.js laden
- `enqueue_admin_assets()` - Editor-Assets

#### `includes/class-chemviz-shortcodes.php`
Shortcode-System für ChemViz:
- `[chemviz_molecule]` - Molekül-Viewer Shortcode
- `[chemviz_chart]` - Diagramm-Shortcode
- Vollständige Sanitization
- Conditional Script-Loading
- ARIA-Support

### Vendor Libraries

#### `assets/js/vendor/README.md`
Dokumentation für externe Bibliotheken:
- Download-Anleitung für 3Dmol.js
- Download-Anleitung für Plotly.js
- CDN vs. lokale Installation
- Lizenz-Informationen

**Wichtig:** Bibliotheken müssen separat heruntergeladen werden:
```bash
npm run download-libs
```

### Beispiel-Strukturen

#### `assets/structures/`
- `water.pdb` - Wasser-Molekül (H₂O)
- `ethanol.pdb` - Ethanol-Molekül (C₂H₆O)
- `README.md` - Dokumentation für Strukturdateien

## Integration in bestehendes Plugin

### Änderungen in `modular-blocks-plugin.php`

```php
// In load_dependencies()
if (file_exists(MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-enqueue.php')) {
    require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-enqueue.php';
}
if (file_exists(MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-shortcodes.php')) {
    require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-shortcodes.php';
}

// In init()
if (class_exists('ModularBlocks_ChemViz_Enqueue')) {
    $chemviz_enqueue = new ModularBlocks_ChemViz_Enqueue();
    $chemviz_enqueue->init();
}

if (class_exists('ModularBlocks_ChemViz_Shortcodes')) {
    $chemviz_shortcodes = new ModularBlocks_ChemViz_Shortcodes();
    $chemviz_shortcodes->init();
}
```

### Änderungen in `package.json`

Neue NPM-Scripts hinzugefügt:
```json
"download-3dmol": "curl -o assets/js/vendor/3Dmol-min.js https://3dmol.csb.pitt.edu/build/3Dmol-min.js",
"download-plotly": "curl -o assets/js/vendor/plotly-2.27.1.min.js https://cdn.plot.ly/plotly-2.27.1.min.js",
"download-libs": "npm run download-3dmol && npm run download-plotly"
```

Neue Keywords:
- chemistry, chemviz, molecules, 3d, science, education

## Installation und Verwendung

### 1. Vendor Libraries herunterladen

```bash
cd /pfad/zum/plugin
npm run download-libs
```

Dies lädt:
- `3Dmol-min.js` (~1.2 MB)
- `plotly-2.27.1.min.js` (~3.5 MB)

**Alternativ:** Plugin nutzt automatisch CDN-Fallback.

### 2. Build erstellen

```bash
npm install
npm run build
```

### 3. Blocks im Admin aktivieren

1. WordPress Admin → Einstellungen → Modulare Blöcke
2. "molecule-viewer" aktivieren
3. "chart-block" aktivieren

### 4. Blocks verwenden

#### Im Block-Editor:
1. Block hinzufügen: "3D Molekül-Viewer" oder "Chemie-Diagramm"
2. Einstellungen in der Seitenleiste konfigurieren
3. Speichern

#### Mit Shortcodes:

**Molekül aus PDB-Datenbank:**
```
[chemviz_molecule pdb="1YCR" style="cartoon" color="spectrum"]
```

**Molekül von URL:**
```
[chemviz_molecule url="/wp-content/uploads/aspirin.pdb" style="stick"]
```

**Titrationskurve:**
```
[chemviz_chart template="titration"]
```

**Eigenes Diagramm:**
```
[chemviz_chart type="scatter" data='[{"x":[1,2,3],"y":[4,5,6]}]' title="Meine Daten"]
```

## Technische Details

### 3Dmol.js Integration

**Abhängigkeiten:**
- jQuery (WordPress Core)
- 3Dmol.js v2.0.3+

**Unterstützte Formate:**
- PDB (Protein Data Bank)
- SDF (Structure Data File)
- MOL (MDL Molfile)
- MOL2 (Sybyl)
- XYZ (Cartesian Coordinates)
- CIF (Crystallographic Information File)

**Display-Stile:**
- `stick` - Stäbchenmodell
- `sphere` - Kalottenmodell
- `cartoon` - Cartoon-Darstellung (Proteine)
- `line` - Linienmodell
- `surface` - Oberfläche

**Farbschemata:**
- `default` - Standardfarben
- `carbon` - Carbon-basiert
- `spectrum` - Spektralfarben
- `chain` - Nach Kette gefärbt
- `ss` - Nach Sekundärstruktur

### Plotly.js Integration

**Abhängigkeiten:**
- Plotly.js v2.27.1+

**Chart-Typen:**
- Scatter (Streudiagramm)
- Line (Liniendiagramm)
- Bar (Balkendiagramm)
- Heatmap (Heatmap)
- 3D (3D-Plots)

**Vordefinierte Templates:**
1. **titration** - Säure-Base-Titrationskurve
2. **kinetics** - Reaktionskinetik 1. Ordnung
3. **phase** - Phasendiagramm (Wasser)
4. **lineweaver** - Lineweaver-Burk (Enzymkinetik)
5. **ir** - IR-Spektrum

## Performance-Optimierung

### Conditional Loading
- Assets werden nur geladen, wenn Blocks auf der Seite vorhanden sind
- `has_block()` Check vor Enqueuing

### Lazy Loading
- Molecule Viewer nutzt IntersectionObserver
- 3D-Strukturen werden erst geladen, wenn im Viewport

### Debouncing
- Resize-Events werden gedrosselt (250ms)
- Verhindert zu häufige Re-Renders

### Caching
- Browser-Cache für Vendor-Libraries
- PDB-Strukturen können gecacht werden

## Barrierefreiheit (A11y)

### Molecule Viewer
- ARIA-Labels auf allen Elementen
- Tastaturnavigation vollständig implementiert
- Screen-Reader-Beschreibungen
- Focus-Indikatoren (3:1 Kontrast)
- Touch-Target-Größe 44x44px

### Chart Block
- ARIA-Labels für Charts
- Plotly's eingebaute Accessibility-Features
- Keyboard-Navigation via Plotly

### CSS
- `prefers-reduced-motion` Support
- Hochkontrast-Modi
- Screen-Reader-only Klassen (`.chemviz-sr-only`)

## Sicherheit

### Input Sanitization
- Alle User-Inputs werden sanitized
- PDB-IDs: `sanitize_text_field()`
- URLs: `esc_url()`
- Colors: `sanitize_hex_color()`
- JSON: Validierung vor Parsing

### Nonce Validation
- WordPress Nonces für alle AJAX-Requests

### File Upload
- WordPress Media Library für sichere Uploads
- Validierung von Dateiendungen

### XSS Prevention
- Alle Ausgaben mit `esc_html()`, `esc_attr()`
- JSON-Daten werden escaped

## Troubleshooting

### Problem: 3Dmol.js lädt nicht

**Lösung:**
```bash
# Bibliothek manuell herunterladen
npm run download-3dmol

# Oder CDN erzwingen
add_filter('modular_blocks_use_cdn', '__return_true');
```

### Problem: Molekül wird nicht angezeigt

**Debugging:**
1. Browser-Console öffnen (F12)
2. Nach Fehlern suchen
3. Prüfen ob `$3Dmol` definiert ist:
   ```javascript
   console.log(typeof $3Dmol);
   ```
4. WordPress Debug aktivieren:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```

### Problem: Chart zeigt "Keine Daten"

**Lösung:**
- Template angeben: `template="titration"`
- Oder eigene Daten als JSON: `data='[{"x":[1,2,3],"y":[4,5,6]}]'`

### Problem: Blocks erscheinen nicht im Editor

**Lösung:**
```bash
# Build neu erstellen
npm run build

# Cache leeren
# WordPress Admin → Plugins → Deaktivieren + Aktivieren

# Browser-Cache leeren (Strg+Shift+R)
```

## Lizenzen

### Plugin-Code
- GPL-2.0-or-later (wie WordPress)

### Externe Bibliotheken
- **3Dmol.js**: BSD-3-Clause License
- **Plotly.js**: MIT License

Beide Lizenzen erlauben kommerzielle Nutzung und Distribution.

## Support und Weiterentwicklung

### Weitere mögliche Features

1. **Molecule Editor Block** (Kekule.js)
   - Moleküle direkt im Editor zeichnen
   - Export als verschiedene Formate

2. **Reaktionsgleichungen**
   - MathJax/KaTeX Integration
   - Chemische Formeln

3. **Periodensystem-Block**
   - Interaktives Periodensystem
   - Element-Details

4. **3D-Animationen**
   - Reaktionsmechanismen
   - Moleküldynamik

5. **Quiz-Integration**
   - Strukturerkennung
   - Nomenklatur-Übungen

### Community

Das Plugin ist modular aufgebaut - jeder Block kann unabhängig erweitert werden.

---

**Version**: 1.0.0 mit ChemViz Integration
**Datum**: 2025-10-07
**Dokumentation**: Vollständig
