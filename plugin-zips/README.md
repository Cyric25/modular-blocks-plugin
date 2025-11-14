# Plugin ZIP-Dateien

Dieser Ordner enthält alle generierten ZIP-Dateien für das Modulare Blöcke Plugin.

## Erstellte Dateien

### Vollständige Plugins

1. **modular-blocks-plugin-1.0.0.zip** (1.34 MB)
   - Vollständiges Plugin mit ALLEN Blöcken
   - Direkt in WordPress installierbar
   - Upload via: `Plugins → Neu hinzufügen → Plugin hochladen`

2. **modular-blocks-plugin-empty-1.0.3.zip** (1.22 MB)
   - Leeres Plugin OHNE Blöcke
   - Blöcke können einzeln nachträglich hochgeladen werden
   - Upload via: `Plugins → Neu hinzufügen → Plugin hochladen`

### Einzelne Block-ZIPs

Diese ZIPs können einzeln in das leere Plugin hochgeladen werden:

- **chart-block.zip** (4.7 KB) - Wissenschaftliche Diagramme mit Plotly.js
- **demo-card.zip** (6.4 KB) - Einfache Beispiel-Card
- **drag-and-drop.zip** (11 KB) - Drag & Drop Sortierung
- **drag-the-words.zip** (8.7 KB) - Lückentext mit ziehbaren Wörtern
- **html-sandbox.zip** (9.7 KB) - HTML/CSS/JS Sandbox
- **image-comparison.zip** (14 KB) - Vorher/Nachher Bildvergleich ⭐ **AKTUALISIERT mit 0% Fix**
- **image-overlay.zip** (16 KB) - Bilder mit anklickbaren Hotspots
- **molecule-viewer.zip** (5.4 KB) - 3D Molekül-Visualisierung
- **multiple-choice.zip** (15 KB) - Multiple-Choice Quiz
- **point-of-interest.zip** (8.1 KB) - Interaktive Punkte auf Bildern
- **statement-connector.zip** (8.6 KB) - Zuordnungsübungen
- **summary-block.zip** (6.2 KB) - Ausklappbare Zusammenfassungen

## Verwendung

### Option 1: Vollständiges Plugin (empfohlen für neue Installationen)

1. `modular-blocks-plugin-1.0.0.zip` in WordPress hochladen
2. Plugin aktivieren
3. Fertig! Alle Blöcke sind verfügbar

### Option 2: Leeres Plugin + Einzelne Blöcke (empfohlen zum Testen)

1. `modular-blocks-plugin-empty-1.0.3.zip` in WordPress hochladen & aktivieren
2. Zu `Einstellungen → Modulare Blöcke` gehen
3. Einzelne Block-ZIPs hochladen (z.B. `image-comparison.zip`)
4. Blöcke werden sofort verfügbar

## Neue ZIPs erstellen

```bash
# Alle ZIPs neu erstellen (empfohlen)
npm run zip-all

# Oder einzeln:
npm run build              # Blöcke kompilieren
npm run plugin-zip         # Vollständiges Plugin
npm run plugin-zip-empty   # Leeres Plugin
npm run block-zips         # Alle einzelnen Blöcke
```

### Automatische Validierung

Alle ZIP-Skripte prüfen automatisch, ob alle erforderlichen Dateien vorhanden sind:

**Block-ZIPs (`npm run block-zips`):**
- ✅ Prüft ob `block.json` existiert (kritisch)
- ✅ Prüft ob Build-Dateien existieren
- ✅ Prüft ob Source-Verzeichnis existiert
- ⚠️ Warnt wenn `render.php` fehlt (OK für statische Blöcke)

**Leeres Plugin (`npm run plugin-zip-empty`):**
- ✅ Prüft ob `modular-blocks-plugin.php` existiert
- ✅ Prüft ob `includes/`, `admin/`, `assets/` existieren
- ℹ️ Zeigt optional fehlende Dateien (LICENSE, README)

**Vollständiges Plugin (`npm run plugin-zip`):**
- ✅ Prüft alle Core-Dateien
- ✅ Prüft ob `blocks/` Verzeichnis Blöcke enthält
- ✅ Prüft ob Build-Verzeichnis existiert

Bei Fehlern wird das Skript mit Fehlermeldung abgebrochen.

## Hinweise

- Alle ZIPs enthalten kompilierte (gebaute) Dateien aus `build/`
- Vor dem Erstellen der ZIPs wird automatisch `npm run build` ausgeführt
- Die ZIPs werden bei jedem Durchlauf neu erstellt (alte werden überschrieben)
- Block-ZIPs enthalten: `block.json`, `render.php` + alle Assets aus `build/blocks/[name]/`

## Aktuelle Version

- Plugin-Version: **1.0.3**
- Letzte Aktualisierung: November 14, 2024

### Änderungen in 1.0.3

- ✅ **Image-Comparison Block:** 0% Position Bug behoben
- ✅ **Image-Comparison Block:** Slider-Verzögerung entfernt (perfekt synchron)
- ✅ **Image-Comparison Block:** Hover-Animation verlangsamt (12 Sekunden)
