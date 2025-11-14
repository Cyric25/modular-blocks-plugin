# ZIP-Validierung - Beispiele

Dieses Dokument zeigt, wie die automatische Validierung in den ZIP-Skripten funktioniert.

## ✅ Erfolgreiche Validierung

### Block-ZIPs
```
Creating Block ZIP Files
==================================================
Found 12 blocks. Validating files...

⚠️  Warnings:
   chart-block: No render.php (static block)
   molecule-viewer: No render.php (static block)

✓ All blocks validated successfully!

[1/12] Creating chart-block.zip...
...
```

**Ergebnis:** ZIPs werden erstellt. Warnungen sind OK - chart-block und molecule-viewer sind statische Blöcke ohne Server-Rendering.

### Leeres Plugin
```
Creating Empty Plugin ZIP (without blocks)
==================================================
Validating plugin files...

ℹ️  Optional files not found (OK):
   LICENSE.txt
   LICENSE

✓ All required files validated successfully!

Removing old ZIP file...
...
```

**Ergebnis:** ZIP wird erstellt. Fehlende optionale Dateien werden nur informativ angezeigt.

### Vollständiges Plugin
```
Creating WordPress Plugin ZIP: modular-blocks-plugin-1.0.0.zip
==================================================
Validating plugin files...

✓ All required files validated successfully!

Removing old ZIP file...
...
```

**Ergebnis:** ZIP wird erstellt. Alle erforderlichen Dateien sind vorhanden.

## ❌ Validierungsfehler

### Block ohne block.json
```
Creating Block ZIP Files
==================================================
Found 12 blocks. Validating files...

❌ Validation Errors:
   my-block: Missing critical file block.json
   my-block: No build files found

==================================================
Cannot create ZIPs due to validation errors.
Please fix the errors above and run "npm run build" again.
```

**Ergebnis:** Prozess wird abgebrochen. Keine ZIPs werden erstellt.

**Lösung:**
1. Erstelle `blocks/my-block/block.json`
2. Führe `npm run build` aus
3. Versuche erneut `npm run block-zips`

### Build-Verzeichnis fehlt
```
Creating WordPress Plugin ZIP: modular-blocks-plugin-1.0.0.zip
==================================================
Validating plugin files...

❌ Validation Errors:
   Missing critical directory: build/blocks
   Build directory not found - please run "npm run build" first

==================================================
Cannot create plugin ZIP due to validation errors.
Please run "npm run build" first if build files are missing.
```

**Ergebnis:** Prozess wird abgebrochen.

**Lösung:** Führe `npm run build` aus, dann erneut `npm run plugin-zip`

### Leere blocks/ Directory
```
Creating WordPress Plugin ZIP: modular-blocks-plugin-1.0.0.zip
==================================================
Validating plugin files...

❌ Validation Errors:
   Directory blocks/ is empty - no blocks found!

==================================================
Cannot create plugin ZIP due to validation errors.
```

**Ergebnis:** Prozess wird abgebrochen.

**Lösung:** Füge mindestens einen Block im `blocks/` Verzeichnis hinzu.

### Fehlende Core-Dateien
```
Creating Empty Plugin ZIP (without blocks)
==================================================
Validating plugin files...

❌ Validation Errors:
   Missing critical file: modular-blocks-plugin.php
   Missing critical directory: includes

==================================================
Cannot create empty plugin ZIP due to validation errors.
```

**Ergebnis:** Prozess wird abgebrochen.

**Lösung:** Stelle sicher, dass du dich im richtigen Verzeichnis befindest und alle Core-Dateien vorhanden sind.

## Validierungsstufen

### 🔴 Kritische Fehler (Prozess wird abgebrochen)
- Fehlende `block.json`
- Fehlende Build-Dateien
- Fehlende Core-Dateien (`modular-blocks-plugin.php`, `includes/`, etc.)
- Leere kritische Verzeichnisse

### ⚠️ Warnungen (Prozess läuft weiter)
- Fehlende `render.php` bei Blöcken (OK für statische Blöcke)
- Leere nicht-kritische Verzeichnisse

### ℹ️ Informationen (nur angezeigt)
- Fehlende optionale Dateien (LICENSE, README bei leerem Plugin)

## Validierte Dateien pro Skript

### `create-block-zips.js`
**Pro Block wird geprüft:**
- ✅ `blocks/[name]/block.json` (kritisch)
- ⚠️ `blocks/[name]/render.php` (Warnung wenn fehlt)
- ✅ `build/blocks/[name]/` existiert (kritisch)
- ✅ `build/blocks/[name]/` ist nicht leer (kritisch)

### `create-empty-plugin-zip.js`
**Geprüfte Dateien:**
- ✅ `modular-blocks-plugin.php` (kritisch)
- ✅ `includes/` (kritisch)
- ✅ `admin/` (kritisch)
- ✅ `assets/` (kritisch)
- ℹ️ `languages/` (optional)
- ℹ️ `README.md` (optional)
- ℹ️ `LICENSE.txt` oder `LICENSE` (optional)

### `create-zip.js`
**Geprüfte Dateien:**
- ✅ `modular-blocks-plugin.php` (kritisch)
- ✅ `includes/` (kritisch)
- ✅ `admin/` (kritisch)
- ✅ `assets/` (kritisch)
- ✅ `blocks/` (kritisch, darf nicht leer sein)
- ✅ `build/blocks/` (kritisch)

## Best Practices

1. **Immer zuerst builden:**
   ```bash
   npm run build
   ```

2. **Dann ZIPs erstellen:**
   ```bash
   npm run zip-all
   ```

3. **Bei Fehlern:**
   - Lies die Fehlermeldung genau
   - Behebe die angegebenen Probleme
   - Führe `npm run build` erneut aus (wenn Build-Fehler)
   - Versuche die ZIP-Erstellung erneut

4. **Vor Commit:**
   - Stelle sicher alle ZIPs erfolgreich erstellt wurden
   - Teste mindestens einen Block-ZIP im leeren Plugin
   - Prüfe ob `plugin-zips/` Verzeichnis alle Dateien enthält
