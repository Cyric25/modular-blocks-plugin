# HTML Sandbox Block - Entwicklungsrichtlinien

Dieser Leitfaden erklärt die spezifischen Anforderungen und Best Practices für die Erstellung von HTML-Code für den HTML Sandbox Block.

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Isolationsmodi](#isolationsmodi)
3. [Code-Anforderungen](#code-anforderungen)
4. [Best Practices](#best-practices)
5. [Canvas und Grafiken](#canvas-und-grafiken)
6. [Externe Bibliotheken](#externe-bibliotheken)
7. [Häufige Fehler](#häufige-fehler)
8. [Beispiele](#beispiele)

---

## Überblick

Der HTML Sandbox Block ermöglicht die sichere Ausführung von HTML, CSS und JavaScript in WordPress-Seiten. Er bietet zwei Isolationsmodi mit unterschiedlichen Vor- und Nachteilen.

### Grundlegende Eigenschaften

- **Automatische Höhenanpassung**: Der Block passt seine Höhe automatisch an den Inhalt an
- **Sicherheits-Sandbox**: Einstellbare Sicherheitsflags für iframe-Modus
- **UTF-8 Support**: Volle Unterstützung für Umlaute und Sonderzeichen
- **Base64-Kodierung**: Verhindert HTML-Injection und Escape-Probleme

---

## Isolationsmodi

### iframe-Modus (Empfohlen für die meisten Fälle)

**Vorteile:**
- ✅ Vollständige Isolation von der Hauptseite
- ✅ Keine CSS-Konflikte
- ✅ Keine JavaScript-Konflikte
- ✅ Globale Variablen beeinflussen Parent-Seite nicht
- ✅ Canvas-Elemente funktionieren einwandfrei

**Nachteile:**
- ❌ Kein direkter Zugriff auf Parent-Seite (Sicherheitsfeature)
- ❌ Bei deaktiviertem `allow-same-origin`: Keine automatische Höhenanpassung

**Wann verwenden:**
- Interaktive Demos mit viel JavaScript
- Canvas-basierte Visualisierungen
- Externe Bibliotheken (z.B. Chart.js, D3.js)
- Code, der globale Variablen verwendet

### Shadow DOM-Modus (Modern)

**Vorteile:**
- ✅ Modernes Web Components API
- ✅ CSS-Isolation mit ShadowRoot
- ✅ Schnellere Performance (kein iframe)
- ✅ Zugriff auf shadowRoot via JavaScript

**Nachteile:**
- ❌ JavaScript läuft im Hauptkontext (kann Parent beeinflussen)
- ❌ Keine vollständige Isolation
- ❌ Externe Styles müssen manuell importiert werden

**Wann verwenden:**
- Einfache HTML/CSS-Demos ohne komplexes JavaScript
- Performance-kritische Anwendungen
- Code ohne globale Variablen

---

## Code-Anforderungen

### HTML

#### ✅ Erlaubt
```html
<!-- Semantisches HTML5 -->
<div class="container">
    <h2>Überschrift</h2>
    <p>Text mit <strong>Hervorhebung</strong></p>
</div>

<!-- Canvas-Elemente -->
<canvas id="myCanvas" width="600" height="400"></canvas>

<!-- SVG-Grafiken -->
<svg width="100" height="100">
    <circle cx="50" cy="50" r="40" fill="blue" />
</svg>

<!-- Formulare (wenn allowForms aktiv) -->
<form id="myForm">
    <input type="text" id="name" />
    <button type="submit">Senden</button>
</form>
```

#### ❌ Zu vermeiden
```html
<!-- Externe Ressourcen direkt im HTML -->
<link rel="stylesheet" href="..."> <!-- Nutze CSS-Tab -->
<script src="..."></script> <!-- Nutze "Externe Skripte" -->

<!-- Inline Styles (nutze CSS-Tab) -->
<div style="color: red;">Text</div>

<!-- Inline Scripts (nutze JavaScript-Tab) -->
<button onclick="doSomething()">Click</button>
```

### CSS

#### ✅ Best Practices
```css
/* Scoped Selektoren verwenden */
.my-demo {
    font-family: Arial, sans-serif;
}

.my-demo h2 {
    color: #e24614;
    margin-bottom: 1rem;
}

/* Canvas Container */
.canvas-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

/* Responsive Canvas */
canvas {
    display: block;
    width: 100%;
    height: auto;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .my-demo {
        background: #1a1a1a;
        color: #f0f0f0;
    }
}
```

#### ❌ Zu vermeiden
```css
/* Globale Selektoren (beeinflussen nur Shadow DOM) */
body { font-size: 16px; }

/* !important sollte vermieden werden */
.my-class { color: red !important; }

/* Sehr spezifische Selektoren */
div > div > div > p.text { }
```

### JavaScript

#### ✅ Best Practices

**iframe-Modus:**
```javascript
// Globale Variablen sind OK (isoliert im iframe)
var myGlobalVar = "Hello";

// Canvas-Zugriff direkt möglich
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 100);

// Event Listeners
document.getElementById('myButton').addEventListener('click', function() {
    console.log('Button clicked!');
});

// Async/Await funktioniert
async function loadData() {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
}
```

**Shadow DOM-Modus:**
```javascript
// shadowRoot-Parameter verwenden
const container = shadowRoot.querySelector('.container');

// Canvas im Shadow DOM
const canvas = shadowRoot.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Event Delegation
shadowRoot.addEventListener('click', function(e) {
    if (e.target.matches('.my-button')) {
        console.log('Button clicked');
    }
});

// KEINE globalen Variablen verwenden
// (function() {
    // Alles in IIFE kapseln
    const localVar = "Safe";
// })();
```

#### ❌ Zu vermeiden
```javascript
// alert(), confirm(), prompt() (wenn allowModals deaktiviert)
alert('Hello'); // Funktioniert nicht im Sandbox

// window.open() (wenn allowPopups deaktiviert)
window.open('https://...'); // Blockiert

// Zugriff auf Parent-Seite (wenn allowSameOrigin deaktiviert)
window.parent.document // Nicht erlaubt
window.top.location // Nicht erlaubt

// Synchrone XHR
var xhr = new XMLHttpRequest();
xhr.open('GET', url, false); // Schlecht für Performance
```

---

## Canvas und Grafiken

### Canvas-Elemente richtig verwenden

#### ✅ Empfohlene Methode (iframe-Modus)

**HTML:**
```html
<div class="canvas-wrapper">
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <p id="fps">FPS: 0</p>
</div>
```

**CSS:**
```css
.canvas-wrapper {
    text-align: center;
    padding: 1rem;
}

#gameCanvas {
    border: 2px solid #333;
    background: #f0f0f0;
    display: block;
    margin: 0 auto;
}
```

**JavaScript:**
```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sicherstellen, dass Canvas bereit ist
if (canvas && ctx) {
    // Animation Loop
    let lastTime = 0;

    function animate(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Canvas löschen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Zeichnen
        ctx.fillStyle = '#e24614';
        ctx.fillRect(50, 50, 100, 100);

        // FPS anzeigen
        document.getElementById('fps').textContent =
            'FPS: ' + Math.round(1000 / deltaTime);

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
} else {
    console.error('Canvas konnte nicht initialisiert werden');
}
```

### Responsive Canvas

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Canvas an Container-Größe anpassen
function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // CSS-Größe setzen
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    // Interne Auflösung anpassen (für scharfe Grafiken)
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);
}

// Bei Größenänderung anpassen
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial aufrufen
```

### Canvas mit externen Bibliotheken

**Chart.js Beispiel:**

**HTML:**
```html
<canvas id="myChart"></canvas>
```

**Externe Skripte:**
```
https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
```

**JavaScript:**
```javascript
// Warten bis Chart.js geladen ist
if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('myChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
} else {
    console.error('Chart.js nicht geladen');
}
```

---

## Externe Bibliotheken

### Reihenfolge beachten

Externe Skripte werden **sequenziell** geladen. Die Reihenfolge ist wichtig!

**Beispiel: D3.js mit Plugin**
```
https://d3js.org/d3.v7.min.js
https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js
```

### Beliebte Bibliotheken (getestet)

| Bibliothek | CDN URL | Verwendung |
|------------|---------|------------|
| **Chart.js** | `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` | Diagramme |
| **D3.js** | `https://d3js.org/d3.v7.min.js` | Datenvisualisierung |
| **Three.js** | `https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js` | 3D-Grafiken |
| **P5.js** | `https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js` | Creative Coding |
| **Plotly.js** | `https://cdn.plot.ly/plotly-2.26.0.min.js` | Wissenschaftliche Grafiken |
| **Anime.js** | `https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js` | Animationen |

### Überprüfen ob geladen

```javascript
// Immer prüfen ob Bibliothek verfügbar ist
if (typeof d3 !== 'undefined') {
    // D3-Code hier
} else {
    console.error('D3.js wurde nicht geladen');
    document.body.innerHTML = '<p style="color: red;">Fehler: D3.js konnte nicht geladen werden.</p>';
}
```

---

## Häufige Fehler

### 1. Canvas bleibt leer

**Problem:**
```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.fillRect(10, 10, 50, 50); // Nichts wird gezeichnet
```

**Lösung:**
```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// WICHTIG: fillStyle VOR fillRect setzen
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 50, 50);

// Alternative: Immer Styles explizit setzen
ctx.beginPath();
ctx.rect(10, 10, 50, 50);
ctx.fillStyle = 'blue';
ctx.fill();
```

### 2. Script läuft nicht

**Problem:** Externe Bibliothek wird vor Inline-Code ausgeführt

**Lösung:**
```javascript
// Polling-Methode (wartet auf Bibliothek)
function waitForLibrary(callback, maxWait = 5000) {
    const startTime = Date.now();

    function check() {
        if (typeof MyLibrary !== 'undefined') {
            callback();
        } else if (Date.now() - startTime < maxWait) {
            setTimeout(check, 100);
        } else {
            console.error('Timeout: Bibliothek nicht geladen');
        }
    }

    check();
}

waitForLibrary(function() {
    // Code der MyLibrary verwendet
});
```

### 3. Höhe wird nicht korrekt angepasst

**Problem:** Canvas-Höhe wird nicht erkannt

**Lösung:**
```javascript
// Nach dem Zeichnen: Event auslösen damit Block Höhe neu berechnet
setTimeout(function() {
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
}, 100);
```

### 4. Umlaute werden falsch dargestellt

**Problem:** `ä, ö, ü` werden als `Ã¤, Ã¶, Ã¼` angezeigt

**Lösung:** ✅ Wird automatisch durch Base64-UTF8-Encoding behoben
- Einfach normale Umlaute verwenden
- Der Block kodiert/dekodiert automatisch korrekt

---

## Beispiele

### Beispiel 1: Einfache Canvas-Animation

**HTML:**
```html
<div class="demo-container">
    <canvas id="bounceCanvas" width="600" height="400"></canvas>
    <div class="controls">
        <button id="startBtn">Start</button>
        <button id="stopBtn">Stop</button>
    </div>
</div>
```

**CSS:**
```css
.demo-container {
    max-width: 600px;
    margin: 2rem auto;
    text-align: center;
}

#bounceCanvas {
    border: 2px solid #e24614;
    background: #f5f5f5;
    display: block;
    margin-bottom: 1rem;
}

.controls button {
    padding: 0.5rem 1rem;
    margin: 0 0.5rem;
    background: #e24614;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.controls button:hover {
    background: #c93d12;
}
```

**JavaScript:**
```javascript
const canvas = document.getElementById('bounceCanvas');
const ctx = canvas.getContext('2d');

let animationId = null;
let ball = {
    x: 300,
    y: 200,
    radius: 20,
    dx: 3,
    dy: 2,
    color: '#e24614'
};

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function update() {
    // Canvas löschen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ball zeichnen
    drawBall();

    // Position aktualisieren
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wandkollision
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    animationId = requestAnimationFrame(update);
}

// Event Listeners
document.getElementById('startBtn').addEventListener('click', function() {
    if (!animationId) {
        update();
    }
});

document.getElementById('stopBtn').addEventListener('click', function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
});

// Auto-Start
update();
```

### Beispiel 2: Interaktives Chart mit Chart.js

**HTML:**
```html
<div class="chart-wrapper">
    <h3>Monatliche Verkäufe 2024</h3>
    <canvas id="salesChart"></canvas>
</div>
```

**CSS:**
```css
.chart-wrapper {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-wrapper h3 {
    color: #71230a;
    margin-top: 0;
    text-align: center;
}
```

**Externe Skripte:**
```
https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
```

**JavaScript:**
```javascript
if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('salesChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Verkäufe (€)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#e24614',
                backgroundColor: 'rgba(226, 70, 20, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toLocaleString('de-DE') + ' €';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('de-DE') + ' €';
                        }
                    }
                }
            }
        }
    });
}
```

### Beispiel 3: P5.js Creative Sketch

**HTML:**
```html
<div id="p5-container"></div>
```

**CSS:**
```css
#p5-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}
```

**Externe Skripte:**
```
https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js
```

**JavaScript:**
```javascript
if (typeof p5 !== 'undefined') {
    new p5(function(p) {
        p.setup = function() {
            p.createCanvas(600, 400).parent('p5-container');
            p.background(240);
        };

        p.draw = function() {
            // Hintergrund mit Transparenz
            p.fill(240, 240, 240, 25);
            p.rect(0, 0, p.width, p.height);

            // Kreis folgt Maus
            p.fill(226, 70, 20, 150);
            p.noStroke();
            p.ellipse(p.mouseX, p.mouseY, 50, 50);
        };
    });
}
```

---

## Checkliste für Canvas-Code

Vor dem Veröffentlichen:

- [ ] **iframe-Modus aktiviert** (für Canvas empfohlen)
- [ ] **Canvas-Element hat eindeutige ID**
- [ ] **Width und Height im HTML definiert**
- [ ] **`getContext('2d')` wird geprüft** (null-check)
- [ ] **fillStyle/strokeStyle VOR Zeichnen gesetzt**
- [ ] **requestAnimationFrame für Animationen** (nicht setInterval)
- [ ] **Externe Bibliotheken auf Verfügbarkeit geprüft**
- [ ] **Responsive Canvas-Größe implementiert** (falls nötig)
- [ ] **Fehlerbehandlung vorhanden**
- [ ] **Performance optimiert** (keine unnötigen Redraws)

---

## Weiterführende Ressourcen

### Offizielle Dokumentation
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [P5.js Reference](https://p5js.org/reference/)

### Best Practices
- [HTML5 Canvas Performance](https://www.html5rocks.com/en/tutorials/canvas/performance/)
- [requestAnimationFrame Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

### WordPress Block Development
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-01-19
**Autor:** FOS Online Schulbuch Team
