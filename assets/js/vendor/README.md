# Vendor Libraries für ChemViz

Dieses Verzeichnis enthält die externen JavaScript-Bibliotheken für die ChemViz-Funktionalität.

## Benötigte Bibliotheken

### 1. 3Dmol.js (für Molekül-Viewer)

**Version**: 2.0.3 oder höher
**Lizenz**: BSD-3-Clause
**Download**: https://3dmol.csb.pitt.edu/download.html

**Datei**: `3Dmol-min.js`

**Installation**:
```bash
# Direkt herunterladen
curl -o assets/js/vendor/3Dmol-min.js https://3dmol.csb.pitt.edu/build/3Dmol-min.js
```

Oder via CDN in der Enqueue-Funktion:
```php
wp_enqueue_script(
    '3dmol',
    'https://3dmol.csb.pitt.edu/build/3Dmol-min.js',
    array('jquery'),
    '2.0.3',
    true
);
```

### 2. Plotly.js (für Diagramme)

**Version**: 2.27.1 oder höher
**Lizenz**: MIT
**Download**: https://github.com/plotly/plotly.js/releases

**Datei**: `plotly-2.27.1.min.js`

**Installation**:
```bash
# Basic Bundle (empfohlen für kleinere Dateigröße)
curl -o assets/js/vendor/plotly-2.27.1.min.js https://cdn.plot.ly/plotly-2.27.1.min.js
```

Oder via CDN:
```php
wp_enqueue_script(
    'plotly',
    'https://cdn.plot.ly/plotly-2.27.1.min.js',
    array(),
    '2.27.1',
    true
);
```

### 3. Kekule.js (für Moleküleditor) - OPTIONAL

**Version**: 0.9.5 oder höher
**Lizenz**: MIT
**Download**: http://partridgejiang.github.io/Kekule.js/

**Dateien**:
- `kekule/kekule.min.js`
- `kekule/themes/default/kekule.css`

**Installation**:
```bash
# Gesamtes Paket herunterladen
mkdir -p assets/js/vendor/kekule
curl -L -o kekule.zip https://github.com/partridgejiang/Kekule.js/releases/download/v0.9.5/Kekule.js-0.9.5.zip
unzip kekule.zip -d assets/js/vendor/kekule/
```

## Integration in das Plugin

Die Bibliotheken werden in `includes/class-block-manager.php` oder einer separaten Enqueue-Klasse geladen:

```php
public function enqueue_chemviz_scripts() {
    // Nur laden wenn ChemViz-Blöcke vorhanden sind
    if (has_block('modular-blocks/molecule-viewer')) {
        wp_enqueue_script(
            'chemviz-3dmol',
            MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/3Dmol-min.js',
            array('jquery'),
            '2.0.3',
            true
        );
    }

    if (has_block('modular-blocks/chart-block')) {
        wp_enqueue_script(
            'chemviz-plotly',
            MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/vendor/plotly-2.27.1.min.js',
            array(),
            '2.27.1',
            true
        );

        wp_enqueue_script(
            'chemviz-chart-templates',
            MODULAR_BLOCKS_PLUGIN_URL . 'assets/js/chart-templates.js',
            array('chemviz-plotly'),
            MODULAR_BLOCKS_PLUGIN_VERSION,
            true
        );
    }
}
```

## CDN vs. Lokale Dateien

**Vorteile CDN**:
- Kleinere Plugin-Größe
- Potentiell schnelleres Laden durch Browser-Caching
- Automatische Updates

**Vorteile Lokal**:
- Funktioniert offline
- Keine externe Abhängigkeit
- DSGVO-konform
- Volle Kontrolle über Versionen

**Empfehlung**: Für Produktions-Plugins lokale Dateien verwenden.

## Lizenz-Hinweise

Alle verwendeten Bibliotheken sind Open Source:
- **3Dmol.js**: BSD-3-Clause License
- **Plotly.js**: MIT License
- **Kekule.js**: MIT License

Die Lizenztexte müssen im Plugin beibehalten werden.
