# Block-Entwicklung Guide

Eine ausführliche Anleitung zum Erstellen eigener Gutenberg-Blöcke für das Modulare Blöcke Plugin.

## Inhaltsverzeichnis

- [Schnellstart](#schnellstart)
- [Block-Struktur](#block-struktur)
- [Erforderliche Dateien](#erforderliche-dateien)
- [Optional Dateien](#optionale-dateien)
- [Block-Typen](#block-typen)
- [Entwicklungs-Workflow](#entwicklungs-workflow)
- [Beispiele](#beispiele)
- [Best Practices](#best-practices)

---

## Schnellstart

### Methode 1: Über Admin-UI (Empfohlen für Anfänger)

1. WordPress Admin → **Einstellungen → Modulare Blöcke**
2. Klick auf **"Neuer Block"**
3. Formular ausfüllen:
   - **Slug**: z.B. `my-custom-block` (nur Kleinbuchstaben und Bindestriche)
   - **Titel**: z.B. "Mein Custom Block"
   - **Beschreibung**: Kurze Beschreibung
   - **Kategorie**: Text, Medien, Design, etc.
   - **Icon**: Dashicon-Name (z.B. `star-filled`)
   - **Dynamischer Block**: Aktivieren für PHP-Rendering
4. **"Block erstellen"** klicken
5. Block-Dateien werden automatisch generiert
6. `npm run build` ausführen um Block zu kompilieren
7. Block ist sofort im Editor verfügbar!

### Methode 2: Manuell erstellen

```bash
# 1. Ordner erstellen
mkdir blocks/my-custom-block

# 2. In den Ordner wechseln
cd blocks/my-custom-block

# 3. Dateien erstellen (siehe unten)
# 4. Zurück ins Hauptverzeichnis
cd ../..

# 5. Block kompilieren
npm run build
```

---

## Block-Struktur

Jeder Block liegt in einem eigenen Unterordner unter `blocks/`:

```
blocks/
└── my-custom-block/
    ├── block.json          # ERFORDERLICH - Block-Metadaten
    ├── index.js            # ERFORDERLICH - Editor-JavaScript
    ├── editor.css          # Optional - Editor-Styles
    ├── style.css           # Optional - Frontend-Styles
    ├── render.php          # Optional - Server-Rendering
    └── view.js             # Optional - Frontend-JavaScript
```

---

## Erforderliche Dateien

### 1. `block.json` - Block-Metadaten

**Zweck**: Definiert alle Block-Eigenschaften und ist die zentrale Konfigurationsdatei.

**Minimal-Beispiel**:
```json
{
  "apiVersion": 3,
  "name": "modular-blocks/my-custom-block",
  "title": "Mein Custom Block",
  "category": "widgets",
  "icon": "star-filled",
  "description": "Eine kurze Beschreibung meines Blocks",
  "textdomain": "modular-blocks-plugin",
  "editorScript": "file:./index.js",
  "editorStyle": "file:./editor.css",
  "style": "file:./style.css",
  "attributes": {},
  "supports": {
    "html": false
  }
}
```

**Wichtige Felder**:

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| `apiVersion` | number | Block-API Version (immer 3) | `3` |
| `name` | string | Eindeutiger Block-Name | `"modular-blocks/my-block"` |
| `title` | string | Anzeigename im Editor | `"Mein Block"` |
| `category` | string | Block-Kategorie | `"text"`, `"media"`, `"design"`, `"widgets"`, `"theme"`, `"embed"` |
| `icon` | string | Dashicon-Name | `"star-filled"`, `"admin-post"`, `"format-image"` |
| `description` | string | Kurzbeschreibung | `"Ein toller Block"` |
| `attributes` | object | Block-Attribute (Daten) | Siehe [Attribute](#attribute) |
| `supports` | object | WordPress-Features | Siehe [Supports](#supports) |

**Verfügbare Kategorien**:
- `text` - Text-Blöcke
- `media` - Medien (Bilder, Videos, Audio)
- `design` - Design-Elemente
- `widgets` - Widgets
- `theme` - Theme-Blöcke
- `embed` - Einbettungen

**Dashicons**: [Vollständige Liste anzeigen](https://developer.wordpress.org/resource/dashicons/)

#### Attribute

Attribute speichern die Block-Daten:

```json
{
  "attributes": {
    "content": {
      "type": "string",
      "default": ""
    },
    "alignment": {
      "type": "string",
      "default": "left",
      "enum": ["left", "center", "right"]
    },
    "showTitle": {
      "type": "boolean",
      "default": true
    },
    "count": {
      "type": "number",
      "default": 0
    },
    "items": {
      "type": "array",
      "default": []
    },
    "settings": {
      "type": "object",
      "default": {}
    }
  }
}
```

**Verfügbare Typen**: `string`, `number`, `boolean`, `array`, `object`, `null`

#### Supports

Aktiviert WordPress-Features:

```json
{
  "supports": {
    "html": false,
    "align": ["wide", "full"],
    "anchor": true,
    "customClassName": true,
    "spacing": {
      "margin": true,
      "padding": true
    },
    "color": {
      "background": true,
      "text": true
    },
    "typography": {
      "fontSize": true,
      "lineHeight": true
    }
  }
}
```

---

### 2. `index.js` - Editor-JavaScript

**Zweck**: Definiert das Block-Verhalten im WordPress-Editor.

**Minimal-Beispiel** (Statischer Block):
```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import './editor.css';
import './style.css';

registerBlockType('modular-blocks/my-custom-block', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();

        return (
            <div {...blockProps}>
                <RichText
                    tagName="p"
                    value={attributes.content}
                    onChange={(content) => setAttributes({ content })}
                    placeholder={__('Inhalt eingeben...', 'modular-blocks-plugin')}
                />
            </div>
        );
    },

    save: ({ attributes }) => {
        const blockProps = useBlockProps.save();

        return (
            <div {...blockProps}>
                <RichText.Content tagName="p" value={attributes.content} />
            </div>
        );
    },
});
```

**Wichtige Konzepte**:

- **`edit`**: Wie der Block im Editor aussieht und funktioniert
- **`save`**: Wie der Block im Frontend gespeichert wird
- **`useBlockProps()`**: Liefert notwendige Props für den Block-Wrapper
- **`RichText`**: Editierbarer Text-Bereich
- **`setAttributes()`**: Aktualisiert Block-Attribute

**Erweiterte Komponenten**:
```javascript
import {
    useBlockProps,
    RichText,
    InspectorControls,
    MediaUpload,
    ColorPalette,
    AlignmentToolbar,
} from '@wordpress/block-editor';

import {
    PanelBody,
    TextControl,
    ToggleControl,
    RangeControl,
    SelectControl,
} from '@wordpress/components';
```

**Beispiel mit Sidebar-Steuerung**:
```javascript
edit: ({ attributes, setAttributes }) => {
    const blockProps = useBlockProps();

    return (
        <>
            <InspectorControls>
                <PanelBody title="Einstellungen">
                    <ToggleControl
                        label="Titel anzeigen"
                        checked={attributes.showTitle}
                        onChange={(showTitle) => setAttributes({ showTitle })}
                    />
                    <RangeControl
                        label="Anzahl"
                        value={attributes.count}
                        onChange={(count) => setAttributes({ count })}
                        min={1}
                        max={10}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {/* Block-Inhalt */}
            </div>
        </>
    );
},
```

---

## Optionale Dateien

### 3. `editor.css` - Editor-Styles

**Zweck**: Styles die NUR im WordPress-Editor sichtbar sind.

**Beispiel**:
```css
/**
 * Mein Custom Block - Editor Styles
 */

.wp-block-modular-blocks-my-custom-block {
    border: 2px dashed #ddd;
    padding: 20px;
    background: #f9f9f9;
}

.wp-block-modular-blocks-my-custom-block:hover {
    border-color: #0073aa;
}
```

**Verwendung**:
- Visuelle Hilfen für Editoren
- Platzhalter-Styles
- Drag-and-Drop-Bereiche kennzeichnen

---

### 4. `style.css` - Frontend-Styles

**Zweck**: Styles die sowohl im Editor ALS AUCH im Frontend angewendet werden.

**Beispiel**:
```css
/**
 * Mein Custom Block - Frontend Styles
 */

.wp-block-modular-blocks-my-custom-block {
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.wp-block-modular-blocks-my-custom-block h2 {
    margin-top: 0;
    font-size: 24px;
}

/* Responsive */
@media (max-width: 768px) {
    .wp-block-modular-blocks-my-custom-block {
        padding: 15px;
        margin: 15px 0;
    }
}
```

---

### 5. `render.php` - Server-Rendering (Dynamische Blöcke)

**Zweck**: PHP-basiertes Rendering für dynamische Inhalte (z.B. Datenbank-Abfragen, aktuelle Zeit, etc.).

**Wann verwenden?**
- Inhalte müssen bei jedem Seitenaufruf neu generiert werden
- Datenbankabfragen erforderlich
- Externe APIs einbinden
- Sicherheitskritische Operationen

**Beispiel**:
```php
<?php
/**
 * Mein Custom Block - Server-side rendering
 *
 * @var array    $block_attributes Block attributes
 * @var string   $block_content    Block content
 * @var WP_Block $block_object     Block object
 */

if (!defined('ABSPATH')) {
    exit;
}

// Attribute mit Defaults
$title = $block_attributes['title'] ?? 'Standardtitel';
$show_date = $block_attributes['showDate'] ?? false;
$count = $block_attributes['count'] ?? 0;

// Datenbank-Abfrage oder externe Daten
$posts = get_posts(['numberposts' => $count]);
$current_user = wp_get_current_user();
?>

<div class="wp-block-modular-blocks-my-custom-block">
    <h2><?php echo esc_html($title); ?></h2>

    <?php if ($show_date): ?>
        <p class="date"><?php echo esc_html(current_time('d.m.Y')); ?></p>
    <?php endif; ?>

    <div class="posts">
        <?php foreach ($posts as $post): ?>
            <article>
                <h3><?php echo esc_html($post->post_title); ?></h3>
                <p><?php echo esc_html(wp_trim_words($post->post_content, 20)); ?></p>
            </article>
        <?php endforeach; ?>
    </div>

    <?php if (is_user_logged_in()): ?>
        <p>Hallo, <?php echo esc_html($current_user->display_name); ?>!</p>
    <?php endif; ?>
</div>
```

**Wichtig bei render.php**:
- `save()` in `index.js` muss `null` zurückgeben
- Immer `esc_html()`, `esc_attr()`, `esc_url()` verwenden
- Verfügbare Variablen: `$block_attributes`, `$block_content`, `$block_object`

**index.js Anpassung für dynamische Blöcke**:
```javascript
registerBlockType('modular-blocks/my-custom-block', {
    edit: ({ attributes, setAttributes }) => {
        // Editor-Interface
    },

    save: () => {
        // Bei dynamischen Blöcken: null zurückgeben
        return null;
    },
});
```

**block.json Ergänzung**:
```json
{
  "viewScript": "file:./view.js"
}
```

---

### 6. `view.js` - Frontend-JavaScript

**Zweck**: JavaScript für Interaktivität im Frontend (nicht im Editor).

**Wann verwenden?**
- Tabs, Accordions, Slider
- AJAX-Requests
- Animationen
- Event-Handler
- Externe Libraries (Charts, Maps, etc.)

**Beispiel**:
```javascript
/**
 * Mein Custom Block - Frontend JavaScript
 */

(function() {
    'use strict';

    function initMyBlocks() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-my-custom-block');

        blocks.forEach((block) => {
            const button = block.querySelector('.toggle-button');
            const content = block.querySelector('.toggle-content');

            if (button && content) {
                button.addEventListener('click', () => {
                    content.classList.toggle('is-open');
                    button.setAttribute(
                        'aria-expanded',
                        content.classList.contains('is-open')
                    );
                });
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMyBlocks);
    } else {
        initMyBlocks();
    }

    // Re-initialize for dynamically loaded content
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            let shouldInit = false;
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 &&
                        (node.classList?.contains('wp-block-modular-blocks-my-custom-block') ||
                         node.querySelector?.('.wp-block-modular-blocks-my-custom-block'))) {
                        shouldInit = true;
                    }
                });
            });
            if (shouldInit) initMyBlocks();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
})();
```

**Best Practices**:
- Immer auf DOM-Ready warten
- Keine globalen Variablen (IIFE verwenden)
- Event-Delegation für dynamische Elemente
- Accessibility beachten (ARIA-Attribute)

---

## Block-Typen

### Statischer Block

Inhalt wird beim Speichern in die Datenbank geschrieben.

**Vorteile**:
- Schneller (kein PHP-Rendering)
- Keine Server-Last
- Caching-freundlich

**Nachteile**:
- Inhalt ist "eingefroren"
- Keine dynamischen Daten

**Verwendung**: Texte, Bilder, statische Layouts

**Dateistruktur**:
```
my-static-block/
├── block.json
├── index.js (mit save() Funktion)
├── editor.css
└── style.css
```

---

### Dynamischer Block

Inhalt wird bei jedem Seitenaufruf durch PHP generiert.

**Vorteile**:
- Immer aktuelle Daten
- Datenbankabfragen möglich
- Personalisierung
- Externe APIs

**Nachteile**:
- Langsamer (PHP-Rendering)
- Server-Last
- Caching komplexer

**Verwendung**: Listen, Feeds, aktuelle Daten, Benutzer-spezifisch

**Dateistruktur**:
```
my-dynamic-block/
├── block.json (mit viewScript)
├── index.js (save() gibt null zurück)
├── render.php
├── view.js (optional)
├── editor.css
└── style.css
```

---

### Interaktiver Block

Statischer oder dynamischer Block mit Frontend-JavaScript.

**Verwendung**: Tabs, Slider, Accordions, Maps, Charts

**Dateistruktur**:
```
my-interactive-block/
├── block.json (mit viewScript)
├── index.js
├── view.js (Frontend-Interaktivität)
├── editor.css
└── style.css
```

---

## Entwicklungs-Workflow

### 1. Block erstellen

**Option A - Via Admin UI**:
```
WordPress Admin → Einstellungen → Modulare Blöcke → "Neuer Block"
```

**Option B - Manuell**:
```bash
mkdir blocks/my-new-block
cd blocks/my-new-block
# Dateien erstellen
```

### 2. Entwickeln

```bash
# Watch-Modus für automatisches Kompilieren
npm start

# ODER einzelner Build
npm run build
```

### 3. Testen

1. WordPress-Editor öffnen
2. Block suchen und einfügen
3. Funktionalität testen
4. Browser-Konsole auf Fehler prüfen

### 4. Debuggen

**WordPress Debug aktivieren** (`wp-config.php`):
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('SCRIPT_DEBUG', true);
```

**Log-Datei**: `/wp-content/debug.log`

**PHP-Debugging** (in render.php):
```php
error_log('Block Attributes: ' . print_r($block_attributes, true));
```

**JavaScript-Debugging** (in index.js):
```javascript
console.log('Attributes:', attributes);
```

### 5. Produktions-Build

```bash
# Optimierter Build
npm run build

# Plugin-ZIP erstellen
npm run plugin-zip
```

---

## Beispiele

### Beispiel 1: Einfacher Text-Block

**block.json**:
```json
{
  "apiVersion": 3,
  "name": "modular-blocks/simple-text",
  "title": "Einfacher Text",
  "category": "text",
  "icon": "edit",
  "description": "Ein simpler Text-Block",
  "textdomain": "modular-blocks-plugin",
  "editorScript": "file:./index.js",
  "style": "file:./style.css",
  "attributes": {
    "content": {
      "type": "string",
      "default": ""
    }
  }
}
```

**index.js**:
```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import './style.css';

registerBlockType('modular-blocks/simple-text', {
    edit: ({ attributes, setAttributes }) => {
        return (
            <RichText
                {...useBlockProps()}
                tagName="p"
                value={attributes.content}
                onChange={(content) => setAttributes({ content })}
                placeholder="Text eingeben..."
            />
        );
    },

    save: ({ attributes }) => {
        return (
            <RichText.Content
                {...useBlockProps.save()}
                tagName="p"
                value={attributes.content}
            />
        );
    },
});
```

---

### Beispiel 2: Accordion (Interaktiv)

**block.json**:
```json
{
  "apiVersion": 3,
  "name": "modular-blocks/accordion",
  "title": "Accordion",
  "category": "design",
  "icon": "list-view",
  "description": "Aufklappbarer Inhalt",
  "textdomain": "modular-blocks-plugin",
  "editorScript": "file:./index.js",
  "viewScript": "file:./view.js",
  "style": "file:./style.css",
  "attributes": {
    "title": {
      "type": "string",
      "default": "Accordion Titel"
    },
    "content": {
      "type": "string",
      "default": ""
    },
    "isOpen": {
      "type": "boolean",
      "default": false
    }
  }
}
```

**index.js**:
```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import './style.css';

registerBlockType('modular-blocks/accordion', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();

        return (
            <div {...blockProps}>
                <RichText
                    tagName="h3"
                    value={attributes.title}
                    onChange={(title) => setAttributes({ title })}
                    placeholder={__('Titel...', 'modular-blocks-plugin')}
                />
                <RichText
                    tagName="div"
                    value={attributes.content}
                    onChange={(content) => setAttributes({ content })}
                    placeholder={__('Inhalt...', 'modular-blocks-plugin')}
                />
            </div>
        );
    },

    save: ({ attributes }) => {
        const blockProps = useBlockProps.save({
            className: 'accordion',
        });

        return (
            <div {...blockProps}>
                <button className="accordion-toggle" aria-expanded="false">
                    <RichText.Content tagName="span" value={attributes.title} />
                </button>
                <div className="accordion-content" hidden>
                    <RichText.Content tagName="div" value={attributes.content} />
                </div>
            </div>
        );
    },
});
```

**view.js**:
```javascript
(function() {
    'use strict';

    function initAccordions() {
        const accordions = document.querySelectorAll('.accordion');

        accordions.forEach((accordion) => {
            const toggle = accordion.querySelector('.accordion-toggle');
            const content = accordion.querySelector('.accordion-content');

            if (toggle && content) {
                toggle.addEventListener('click', () => {
                    const isOpen = toggle.getAttribute('aria-expanded') === 'true';

                    toggle.setAttribute('aria-expanded', !isOpen);
                    content.hidden = isOpen;
                    accordion.classList.toggle('is-open');
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordions);
    } else {
        initAccordions();
    }
})();
```

**style.css**:
```css
.accordion {
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 20px 0;
}

.accordion-toggle {
    width: 100%;
    padding: 15px;
    background: #f5f5f5;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: background 0.3s;
}

.accordion-toggle:hover {
    background: #e0e0e0;
}

.accordion.is-open .accordion-toggle {
    background: #2271b1;
    color: white;
}

.accordion-content {
    padding: 15px;
}
```

---

### Beispiel 3: Neueste Posts (Dynamisch)

**block.json**:
```json
{
  "apiVersion": 3,
  "name": "modular-blocks/latest-posts",
  "title": "Neueste Beiträge",
  "category": "widgets",
  "icon": "admin-post",
  "description": "Zeigt die neuesten Beiträge an",
  "textdomain": "modular-blocks-plugin",
  "editorScript": "file:./index.js",
  "style": "file:./style.css",
  "attributes": {
    "numberOfPosts": {
      "type": "number",
      "default": 5
    },
    "showExcerpt": {
      "type": "boolean",
      "default": true
    }
  }
}
```

**index.js**:
```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './style.css';

registerBlockType('modular-blocks/latest-posts', {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Einstellungen', 'modular-blocks-plugin')}>
                        <RangeControl
                            label={__('Anzahl Beiträge', 'modular-blocks-plugin')}
                            value={attributes.numberOfPosts}
                            onChange={(numberOfPosts) => setAttributes({ numberOfPosts })}
                            min={1}
                            max={20}
                        />
                        <ToggleControl
                            label={__('Auszug anzeigen', 'modular-blocks-plugin')}
                            checked={attributes.showExcerpt}
                            onChange={(showExcerpt) => setAttributes({ showExcerpt })}
                        />
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <p>Neueste {attributes.numberOfPosts} Beiträge</p>
                    {attributes.showExcerpt && <p><em>(mit Auszug)</em></p>}
                </div>
            </>
        );
    },

    save: () => {
        // Dynamischer Block - null zurückgeben
        return null;
    },
});
```

**render.php**:
```php
<?php
if (!defined('ABSPATH')) exit;

$number_of_posts = $block_attributes['numberOfPosts'] ?? 5;
$show_excerpt = $block_attributes['showExcerpt'] ?? true;

$posts = get_posts([
    'numberposts' => $number_of_posts,
    'post_status' => 'publish',
]);
?>

<div class="wp-block-modular-blocks-latest-posts">
    <h3><?php _e('Neueste Beiträge', 'modular-blocks-plugin'); ?></h3>

    <?php if (empty($posts)): ?>
        <p><?php _e('Keine Beiträge gefunden.', 'modular-blocks-plugin'); ?></p>
    <?php else: ?>
        <ul class="posts-list">
            <?php foreach ($posts as $post): ?>
                <li class="post-item">
                    <h4>
                        <a href="<?php echo esc_url(get_permalink($post)); ?>">
                            <?php echo esc_html($post->post_title); ?>
                        </a>
                    </h4>

                    <time datetime="<?php echo esc_attr(get_the_date('c', $post)); ?>">
                        <?php echo esc_html(get_the_date('', $post)); ?>
                    </time>

                    <?php if ($show_excerpt): ?>
                        <p><?php echo esc_html(wp_trim_words($post->post_content, 20)); ?></p>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</div>
```

---

## Best Practices

### Sicherheit

✅ **Immer Daten escapen** (PHP):
```php
echo esc_html($text);        // Text
echo esc_attr($attribute);   // HTML-Attribut
echo esc_url($url);          // URL
echo wp_kses_post($html);    // HTML (erlaubt nur sichere Tags)
```

✅ **Attribute validieren** (block.json):
```json
{
  "attributes": {
    "url": {
      "type": "string",
      "default": "",
      "validator": "isURL"
    },
    "count": {
      "type": "number",
      "default": 5,
      "minimum": 1,
      "maximum": 20
    }
  }
}
```

### Performance

✅ **CSS/JS nur wenn nötig laden**:
- Editor-spezifische Styles in `editor.css`
- Frontend-JavaScript nur in `view.js`

✅ **Bilder optimieren**:
```javascript
import { MediaUpload } from '@wordpress/block-editor';

// WordPress Image Sizes nutzen
<MediaUpload
    allowedTypes={['image']}
    value={attributes.imageId}
    onSelect={(media) => setAttributes({
        imageId: media.id,
        imageUrl: media.url,
        imageAlt: media.alt,
    })}
    render={({ open }) => (
        <Button onClick={open}>Bild auswählen</Button>
    )}
/>
```

### Barrierefreiheit

✅ **ARIA-Labels verwenden**:
```javascript
<button
    aria-label={__('Menü öffnen', 'modular-blocks-plugin')}
    aria-expanded={isOpen}
>
```

✅ **Keyboard-Navigation**:
```javascript
onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
    }
}}
```

✅ **Kontraste beachten** (min. 4.5:1)

### Internationalisierung

✅ **Texte übersetzen**:
```javascript
import { __ } from '@wordpress/i18n';

__('Text', 'modular-blocks-plugin')
_n('1 Beitrag', '%d Beiträge', count, 'modular-blocks-plugin')
sprintf(__('Hallo %s', 'modular-blocks-plugin'), name)
```

```php
__('Text', 'modular-blocks-plugin')
_e('Text', 'modular-blocks-plugin')
_n('Singular', 'Plural', $count, 'modular-blocks-plugin')
esc_html__('Text', 'modular-blocks-plugin')
```

### Code-Qualität

✅ **ESLint/Prettier verwenden**:
```bash
npm run lint:js
npm run format
```

✅ **WordPress Coding Standards**:
```bash
# PHP
composer require --dev squizlabs/php_codesniffer
./vendor/bin/phpcs --standard=WordPress blocks/
```

✅ **Kommentare schreiben**:
```javascript
/**
 * Handles the accordion toggle interaction
 *
 * @param {Event} e - Click event
 */
function handleToggle(e) {
    // Implementation
}
```

---

## Troubleshooting

### Block erscheint nicht im Editor

1. **Build ausgeführt?**
   ```bash
   npm run build
   ```

2. **Block aktiviert?**
   - Einstellungen → Modulare Blöcke → Block aktivieren

3. **Cache leeren**:
   - Browser-Cache löschen
   - WordPress-Cache löschen (wenn Plugin aktiv)

4. **Debug-Log prüfen**:
   ```bash
   tail -f /pfad/zu/wordpress/wp-content/debug.log
   ```

### JavaScript-Fehler

1. **Browser-Konsole öffnen** (F12)
2. **Fehler analysieren**
3. **Dependencies prüfen**:
   ```bash
   npm install
   ```

### Styles werden nicht geladen

1. **CSS importiert?** (in index.js):
   ```javascript
   import './editor.css';
   import './style.css';
   ```

2. **Build ausgeführt?**
   ```bash
   npm run build
   ```

3. **Cache leeren**

### Dynamischer Block lädt nicht

1. **save() gibt null zurück?**
2. **render.php vorhanden?**
3. **PHP-Fehler prüfen** (debug.log)

---

## Weitere Ressourcen

- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Block API Reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/)
- [Components Reference](https://developer.wordpress.org/block-editor/reference-guides/components/)
- [Dashicons](https://developer.wordpress.org/resource/dashicons/)
- [wp-scripts Package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/)

---

## Support

Bei Fragen oder Problemen:

1. **Debug-Log prüfen** (`wp-content/debug.log`)
2. **Browser-Konsole prüfen** (F12)
3. **GitHub Issues**: [Repository Issues](https://github.com/username/modular-blocks-plugin/issues)

---

**Happy Block Building! 🚀**
