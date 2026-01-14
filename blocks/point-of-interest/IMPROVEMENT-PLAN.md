# Point of Interest Block - Verbesserungsplan

## Übersicht

Dieses Dokument beschreibt die geplanten Verbesserungen für den Point of Interest Block.

## Aktuelle Probleme

1. **Editor-UI sehr basic** - Viele Attribute sind definiert aber nicht im Editor einstellbar
2. **CSS fast leer** - Styles für Hotspots, Animationen, Popups fehlen
3. **Keine visuelle Positionierung** - Hotspots nur über Slider positionierbar
4. **Keine Auswahl für Icon, Farbe, Animation, Größe** im Editor

## Geplante Verbesserungen

### 1. Editor UI Erweiterung (index.js)

**Neue InspectorControls hinzufügen:**

```
PanelBody: "Hintergrundbild"
├── MediaUpload (bereits vorhanden)
└── RangeControl: Höhe (200-800px)

PanelBody: "Allgemeine Einstellungen"
├── SelectControl: Hotspot-Stil (circle, square, pin)
├── SelectControl: Popup-Stil (tooltip, modal, sidebar)
├── SelectControl: Popup-Position (auto, top, bottom, left, right)
├── ToggleControl: Nummern anzeigen
├── ToggleControl: Auto-Close
├── ToggleControl: Bei Außenklick schließen

PanelBody: "Zoom-Funktionen"
├── ToggleControl: Zoom aktivieren
└── RangeControl: Max Zoom-Level (100-300%)

PanelBody: "Hotspots" (pro Hotspot)
├── TextControl: Titel
├── TextareaControl: Inhalt (später RichText)
├── RangeControl: X Position (0-100%)
├── RangeControl: Y Position (0-100%)
├── SelectControl: Icon (info, star, building, nature, store, location, warning, plus)
├── ColorPalette: Farbe
├── SelectControl: Größe (small, medium, large)
├── SelectControl: Animation (none, pulse, bounce)
├── SelectControl: Trigger (click, hover)
└── Button: Hotspot entfernen
```

**Drag-and-Drop Positionierung im Editor:**
- Hotspots im Editor-Bild per Maus verschiebbar machen
- onMouseDown/onMouseMove/onMouseUp Handler
- Position in Prozent berechnen relativ zum Bild

### 2. CSS vervollständigen (style.css)

**Grundstruktur:**
```css
/* Container */
.wp-block-modular-blocks-point-of-interest { ... }
.poi-container { ... }
.poi-header { ... }
.poi-interactive-area { ... }
.poi-image-container { ... }

/* Hotspots */
.poi-hotspot { ... }
.hotspot-small { ... }
.hotspot-medium { ... }
.hotspot-large { ... }
.hotspot-marker { ... }
.hotspot-icon { ... }
.hotspot-number { ... }
.hotspot-ripple { ... }

/* Hotspot Styles */
.hotspot-style-circle .poi-hotspot { ... }
.hotspot-style-square .poi-hotspot { ... }
.hotspot-style-pin .poi-hotspot { ... }

/* Animationen */
@keyframes pulse { ... }
@keyframes bounce { ... }
.animation-pulse { ... }
.animation-bounce { ... }
.animation-none { ... }

/* Popups */
.poi-popup { ... }
.popup-style-tooltip .poi-popup { ... }
.popup-style-modal .poi-popup { ... }
.popup-style-sidebar .poi-popup { ... }
.popup-content { ... }
.popup-header { ... }
.popup-title { ... }
.popup-close { ... }
.popup-body { ... }
.popup-arrow { ... }

/* Zoom Controls */
.zoom-controls { ... }
.zoom-button { ... }

/* Legend */
.poi-legend { ... }
.legend-title { ... }
.legend-items { ... }
.legend-item { ... }
.legend-marker { ... }

/* Responsive */
@media (max-width: 768px) { ... }

/* Accessibility */
@media (prefers-reduced-motion: reduce) { ... }
@media (prefers-contrast: high) { ... }

/* Print */
@media print { ... }
```

### 3. Editor CSS (editor.css)

```css
/* Editor-spezifische Styles */
.point-of-interest-editor { ... }
.point-of-interest-editor img { ... }

/* Draggable Hotspots im Editor */
.editor-hotspot { ... }
.editor-hotspot:hover { ... }
.editor-hotspot.is-dragging { ... }
.editor-hotspot.is-selected { ... }

/* Hotspot Edit Card */
.hotspot-edit-card { ... }

/* Editor Notice */
.editor-notice { ... }
```

### 4. block.json Anpassungen

- Keine Änderungen nötig, alle Attribute sind bereits definiert

## Implementierungsreihenfolge

1. **style.css** - Alle Frontend-Styles definieren
2. **editor.css** - Editor-Styles für Drag-and-Drop
3. **index.js** - Editor UI komplett überarbeiten:
   - Alle InspectorControls hinzufügen
   - Drag-and-Drop Positionierung implementieren
   - Bessere visuelle Vorschau

## Verwendete WordPress-Komponenten

```javascript
// @wordpress/block-editor
import {
    useBlockProps,
    InspectorControls,
    MediaUpload,
    MediaUploadCheck,
    ColorPalette
} from '@wordpress/block-editor';

// @wordpress/components
import {
    PanelBody,
    TextControl,
    TextareaControl,
    Button,
    RangeControl,
    SelectControl,
    ToggleControl,
    Card,
    CardHeader,
    CardBody
} from '@wordpress/components';

// @wordpress/i18n
import { __ } from '@wordpress/i18n';

// @wordpress/icons
import { plus, trash, chevronUp, chevronDown } from '@wordpress/icons';
```

## Farbpalette für Hotspots

```javascript
const hotspotColors = [
    { name: 'Blau', color: '#0073aa' },
    { name: 'Rot', color: '#d63638' },
    { name: 'Grün', color: '#00a32a' },
    { name: 'Orange', color: '#f56e28' },
    { name: 'Lila', color: '#9b59b6' },
    { name: 'Türkis', color: '#1abc9c' },
    { name: 'Schwarz', color: '#1e1e1e' },
    { name: 'Grau', color: '#646970' },
];
```

## Icon-Optionen

```javascript
const iconOptions = [
    { label: 'Info', value: 'info' },
    { label: 'Stern', value: 'star' },
    { label: 'Gebäude', value: 'building' },
    { label: 'Natur', value: 'nature' },
    { label: 'Geschäft', value: 'store' },
    { label: 'Standort', value: 'location' },
    { label: 'Warnung', value: 'warning' },
    { label: 'Plus', value: 'plus' },
];
```

## Testplan

1. Block in WordPress-Editor einfügen
2. Hintergrundbild hochladen
3. Hotspots hinzufügen und per Drag-and-Drop positionieren
4. Alle Einstellungen testen (Icon, Farbe, Animation, Größe)
5. Popup-Stile testen (tooltip, modal, sidebar)
6. Zoom-Funktionen testen
7. Frontend-Ansicht prüfen
8. Responsive-Verhalten testen
9. Keyboard-Navigation testen
10. `npm run build` ausführen
11. `npm run block-zips` für Distribution
