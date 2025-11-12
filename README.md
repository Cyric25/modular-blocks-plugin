# Modulare Blöcke Plugin

Ein modulares WordPress Plugin, das dynamisch Gutenberg Blöcke aus Ordnern registriert und verwaltet.

## 🚀 Features

### Block-Verwaltung
- **Dynamische Block-Registrierung**: Automatische Erkennung und Registrierung von Blöcken aus dem `/blocks/` Verzeichnis
- **Modulare Architektur**: Jeder Block lebt in seinem eigenen Ordner ohne Abhängigkeiten
- **Erweiterte Admin-Oberfläche**:
  - ✨ **Neue Blöcke direkt über UI erstellen** mit Template-Generator
  - 📦 **ZIP-Upload** für fertige Blöcke
  - 🗑️ **Blöcke löschen** mit Sicherheitsabfrage
  - 🔄 Aktivieren/Deaktivieren einzelner Blöcke
- **Plug-and-Play**: Neue Blöcke einfach durch Hinzufügen von Ordnern installieren

### Enthaltene Blöcke
- **HTML Sandbox**: Isolierte HTML/CSS/JavaScript-Ausführung (iframe oder Shadow DOM) - **NEU!**
- **Demo Card**: Beispiel-Block mit Titel, Text, Button und Farbauswahl
- **Image Comparison**: Before/After-Bilder mit interaktivem Slider
- **Multiple Choice**: Quiz-Block mit Feedback
- **Image Overlay**: Bilder mit klickbaren Hotspots
- **Point of Interest**: Interaktive Markierungen auf Bildern
- **Summary Block**: Aufklappbare Inhaltsbereiche
- **Statement Connector**: Drag-and-Drop-Zuordnungsübung
- **Drag the Words**: Lückentext mit ziehbaren Wörtern
- **Drag and Drop**: Allgemeiner Drag-and-Drop-Block
- **Molecule Viewer**: 3D-Moleküldarstellung mit 3Dmol.js (ChemViz)
- **Chart Block**: Wissenschaftliche Diagramme mit Plotly.js (ChemViz)

### Technologie
- **PHP 8+ Kompatibel**: Moderne PHP-Entwicklung mit aktuellen Standards
- **WordPress 6.0+ Unterstützung**: Nutzt die neuesten WordPress Block-APIs
- **Development/Production Modus**: Automatische Erkennung der Umgebung

## 📁 Plugin-Struktur

```
modular-blocks-plugin/
├── modular-blocks-plugin.php    # Haupt-Plugin-Datei
├── includes/
│   ├── class-block-manager.php  # Block-Registrierung und -Verwaltung
│   └── class-admin-manager.php  # Admin-Interface
├── admin/
│   ├── admin.css               # Admin-Styles
│   └── admin.js                # Admin-JavaScript
├── blocks/                     # Block-Verzeichnis
│   └── demo-card/              # Beispiel-Block
│       ├── block.json          # Block-Metadaten
│       ├── index.js            # Block-Editor-Code
│       ├── render.php          # Server-seitige Render-Funktion
│       ├── style.css           # Frontend-Styles
│       └── editor.css          # Editor-Styles
├── assets/
│   ├── css/                    # Globale Styles
│   └── js/                     # Globale Scripts
└── languages/                  # Sprachdateien
```

## 🛠 Installation

### Via ZIP-Upload (Empfohlen)

1. Laden Sie alle Plugin-Dateien in einen Ordner namens `modular-blocks-plugin`
2. Erstellen Sie eine ZIP-Datei aus diesem Ordner
3. Gehen Sie zu WordPress Admin → Plugins → Plugin hinzufügen
4. Klicken Sie auf "Plugin hochladen" und wählen Sie die ZIP-Datei
5. Aktivieren Sie das Plugin

### Manuelle Installation

1. Laden Sie den Plugin-Ordner in `/wp-content/plugins/` hoch
2. Aktivieren Sie das Plugin über die WordPress Admin-Oberfläche

## 📋 Systemanforderungen

- **WordPress**: 6.0 oder höher
- **PHP**: 8.0 oder höher
- **Node.js**: 16+ (für Block-Entwicklung)
- **npm**: 7+ (für Block-Entwicklung)

## 🎯 Verwendung

### Admin-Interface

Nach der Aktivierung finden Sie die Plugin-Einstellungen unter:
**Einstellungen → Modulare Blöcke**

Hier können Sie:
- **Neue Blöcke erstellen** über das Modal-Formular
- **ZIP-Dateien hochladen** mit fertigen Blöcken
- Alle verfügbaren Blöcke anzeigen
- Einzelne Blöcke aktivieren/deaktivieren
- Blöcke löschen (mit Sicherheitsabfrage)
- Block-Informationen einsehen

### Block-Entwicklung

> 📖 **Ausführliche Dokumentation**: Siehe [BLOCK-DEVELOPMENT.md](./BLOCK-DEVELOPMENT.md) für eine vollständige Anleitung zur Block-Entwicklung mit Beispielen, Best Practices und Troubleshooting.

#### Neuen Block erstellen

**Option 1: Über Admin-UI (Empfohlen)**

1. WordPress Admin → **Einstellungen → Modulare Blöcke**
2. Klick auf **"Neuer Block"**
3. Formular ausfüllen (Slug, Titel, Beschreibung, etc.)
4. **"Block erstellen"** klicken
5. Automatisch generierte Dateien werden erstellt
6. `npm run build` ausführen
7. Block ist sofort verfügbar!

**Option 2: Manuell**

1. Erstellen Sie einen neuen Ordner in `/blocks/`
2. Fügen Sie mindestens eine `block.json` Datei hinzu
3. `npm run build` ausführen
4. Der Block wird automatisch erkannt und im Admin-Interface angezeigt

#### Block-Struktur (Minimal)

```
blocks/mein-block/
└── block.json              # Erforderlich: Block-Metadaten
```

#### Block-Struktur (Komplett)

```
blocks/mein-block/
├── block.json              # Block-Metadaten
├── index.js                # Editor-Code (optional)
├── render.php              # Server-Rendering (für dynamische Blöcke)
├── style.css               # Frontend-Styles (optional)
└── editor.css              # Editor-Styles (optional)
```

#### Beispiel `block.json`

```json
{
    \"apiVersion\": 3,
    \"name\": \"modular-blocks/mein-block\",
    \"title\": \"Mein Block\",
    \"category\": \"design\",
    \"icon\": \"star-filled\",
    \"description\": \"Ein eigener Block.\",
    \"attributes\": {
        \"content\": {
            \"type\": \"string\",
            \"default\": \"Hallo Welt\"
        }
    }
}
```

#### Dynamische Blöcke mit PHP

Für server-seitige Darstellung erstellen Sie eine `render.php`:

```php
<?php
// Verfügbare Variablen:
// $block_attributes - Block-Attribute
// $block_content    - Block-Inhalt
// $block_object     - Block-Objekt

$content = $block_attributes['content'] ?? '';
?>
<div class=\"wp-block-modular-blocks-mein-block\">
    <?php echo esc_html($content); ?>
</div>
```

## 🔧 Entwicklung

### JavaScript-Builds (für Block-Entwicklung)

Das Plugin unterstützt moderne Block-Entwicklung. Für JavaScript-basierte Blöcke:

1. Installieren Sie `@wordpress/create-block`:
   ```bash
   npm install -g @wordpress/create-block
   ```

2. Erstellen Sie einen neuen Block:
   ```bash
   npx @wordpress/create-block mein-block --no-plugin
   ```

3. Verschieben Sie den generierten Ordner nach `/blocks/`

### Build-Prozess

Für Entwicklung mit modernen JavaScript-Features:

```bash
# Abhängigkeiten installieren
npm install

# Development-Modus (Watch)
npm start
# oder
npm run dev

# Production Build
npm run build

# Plugin-ZIP für WordPress erstellen
npm run plugin-zip

# Code-Qualität
npm run lint:js
npm run lint:css

# ChemViz-Bibliotheken herunterladen
npm run download-libs
```

## 🎨 Beispiel-Block: Demo Card

Das Plugin enthält einen vollständigen Beispiel-Block \"Demo Card\":

- **Lokation**: `/blocks/demo-card/`
- **Features**:
  - Titel und Text-Editor
  - Button mit URL
  - Farbauswahl für Hintergrund und Text
  - Responsive Design
  - Server-seitiges Rendering

## 🔐 Sicherheit

- Alle Eingaben werden sanitized
- CSRF-Schutz über WordPress Nonces
- Capability-Checks für Admin-Funktionen
- Sichere File-Uploads und -Zugriffe

## 🌐 Übersetzung

Das Plugin ist übersetzungsbereit:

- **Textdomain**: `modular-blocks-plugin`
- **Sprachdateien**: `/languages/`
- **POT-Datei**: Kann mit WP-CLI generiert werden

## 🐛 Debugging

### Debug-Logs aktivieren

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

### Häufige Probleme

**Block wird nicht angezeigt:**
- Prüfen Sie die `block.json` auf Syntax-Fehler
- Stellen Sie sicher, dass der Block im Admin aktiviert ist
- Überprüfen Sie die Browser-Konsole auf JavaScript-Fehler

**PHP-Fehler in render.php:**
- Prüfen Sie die Error-Logs in `/wp-content/debug.log`
- Stellen Sie sicher, dass alle Variablen definiert sind

## 🤝 Mitwirken

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch
3. Commiten Sie Ihre Änderungen
4. Erstellen Sie einen Pull-Request

## 📄 Lizenz

GPL-2.0+ - Siehe WordPress Plugin-Richtlinien

## 🔗 Nützliche Links

- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Block Development Best Practices](https://developer.wordpress.org/block-editor/how-to-guides/)
- [@wordpress/create-block](https://www.npmjs.com/package/@wordpress/create-block)

## 📞 Support

Für Support und Fragen:
- GitHub Issues erstellen
- WordPress Plugin-Support-Forum
- Entwickler-Community kontaktieren

---

**Entwickelt mit ❤️ für die WordPress-Community**