/**
 * Frontend-JavaScript fuer den Accordion-Block
 *
 * Der Block liefert serverseitig eine flache Folge gerenderter Bloecke
 * (Ueberschriften und Inhalte) innerhalb von .mb-accordion__content.
 * Dieses Skript baut daraus zur Laufzeit bedienbare Accordion-Zeilen:
 * pro Ueberschrift der konfigurierten Ebene eine Zeile, deren Panel alle
 * Folgegeschwister bis zur naechsten Ueberschrift aufnimmt.
 *
 * Die Inhalte liegen dabei in einem Polster-Wrapper
 * (.mb-accordion-row__panel-inner), der den Innenabstand traegt. Das Panel
 * selbst bleibt polsterlos und laesst sich deshalb exakt auf 0 animieren.
 *
 * Wichtig: Inhalte werden ausschliesslich per Knotenverschiebung
 * (appendChild/insertBefore) umgehaengt, niemals per innerHTML. Andernfalls
 * verlieren verschachtelte Bloecke (3D-Molekuel-Viewer, Plotly-Diagramme,
 * Zeichenflaechen) ihre Event-Handler und ihren Zustand.
 *
 * Zustandsregel (bewusst asymmetrisch - bitte nicht "aufraeumen"):
 * Die Marker einer Zeile folgen nicht mehr alle gemeinsam, sondern in zwei
 * Stufen. Sofort auf den Klick, noch vor dem Start der Hoehenanimation, folgen
 * alle *sichtbaren* Rueckmeldungen: die Kopf-Farben, die Klasse is-closed an
 * der Zeile (daran haengt im Stylesheet die Chevron-Drehung) und
 * aria-expanded am Kopf-Button - letzteres, damit Screenreader-Nutzer dieselbe
 * unmittelbare Rueckmeldung erhalten wie sehende. Erst nach der Bewegung folgt
 * panel.hidden, denn sonst waere der Inhalt sofort weg und es gaebe gar keine
 * Animation zu sehen.
 *
 * Waehrend der 250 ms des Zuklappens ist eine Zeile deshalb absichtlich schon
 * als geschlossen markiert, aber noch sichtbar. Beim Oeffnen tritt der Fall
 * nicht auf: dort passen alle Marker von Anfang an zusammen.
 *
 * Daraus folgt fuer die Umschaltlogik: Die Frage "ist diese Zeile offen?" darf
 * niemals an is-closed, hidden oder aria-expanded allein haengen. Verbindlich
 * ist ausschliesslich isRowOpen() - die Rangfolge ist dort dokumentiert.
 *
 * Optionale Fremd-Schnittstelle: Ist das Plugin "Container Block Designer"
 * aktiv, stellt es window.cbdRenderLatex(root) bereit (Promise<number>, loest
 * nach document.fonts.ready auf). Nach dem Aufklappen laesst dieses Skript den
 * Renderer ueber das nun sichtbare Panel laufen und misst dessen Hoehe danach
 * neu - in einem versteckten Panel wuerde KaTeX ohne die echten Webfonts
 * rendern und jede Messung traefe die Ersatzschrift. Die Funktion wird immer
 * per typeof geprueft; fehlt sie, bleibt alles beim bisherigen Verhalten.
 */

(function () {
    'use strict';

    var ROOT_SELECTOR = '.mb-accordion';
    var CONTENT_SELECTOR = '.mb-accordion__content';
    var CONTROLS_SELECTOR = '.mb-accordion__controls';
    var CONTROL_SELECTOR = '.mb-accordion__control';
    var ROW_CLASS = 'mb-accordion-row';
    var ROW_SELECTOR = '.mb-accordion-row';
    var HEADER_CLASS = 'mb-accordion-row__header';
    var HEADER_SELECTOR = '.mb-accordion-row__header';
    var CLOSED_CLASS = 'is-closed';
    var ANIMATION_DURATION = 250;
    // Standardkurve fuer Auf-/Zuklappbewegungen; wirkt beim Schliessen
    // deutlich weniger abrupt als 'ease'.
    var ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
    var OPEN_TITLE_COLOR = '#ffffff';

    // Standardfarben, falls die data-color-*-Attribute fehlen.
    var DEFAULT_COLORS = {
        surface: '#f5ede9',
        active: '#e24614',
        hover: '#c93d12',
        text: '#71230a'
    };

    // Zeilenkoepfe, auf denen der Zeiger gerade steht. Notwendig, weil die
    // Farben inline mit 'important' gesetzt werden und CSS-':hover' deshalb
    // nicht greift - siehe setHeaderColors().
    var hoveredHeaders = new WeakSet();

    // Laufende Hoehen-Animationen: Panel-Element -> { target, onEnd, timer }.
    // Modul-lokal (keine globale Variable), damit ein Umschalten waehrend einer
    // laufenden Animation den Vorgaenger sauber abbrechen kann.
    var runningAnimations = new WeakMap();

    // Zaehler fuer generierte IDs (Kopf-Button und Panel).
    var idCounter = 0;

    // Eigenes Skript-Tag (Footer), um beim fruehen Lauf zu erkennen, welche
    // Accordions bereits vollstaendig geparst sind.
    var ownScript = document.currentScript || null;

    // Der MutationObserver wird nur einmal gestartet.
    var observerStarted = false;

    /**
     * Erzeugt eine im Dokument garantiert freie ID.
     *
     * @param {string} prefix ID-Praefix
     * @return {string} Eindeutige ID
     */
    function uniqueId(prefix) {
        var id;

        do {
            idCounter++;
            id = prefix + '-' + idCounter;
        } while (document.getElementById(id));

        return id;
    }

    /**
     * Prueft, ob der Nutzer reduzierte Bewegung wuenscht.
     *
     * @return {boolean} true, wenn nicht animiert werden darf
     */
    function prefersReducedMotion() {
        if (!window.matchMedia) {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Liest die Farbwerte aus den data-color-*-Attributen des Accordions.
     *
     * @param {HTMLElement} root Accordion-Wurzelelement
     * @return {Object} Farbwerte
     */
    function readColors(root) {
        return {
            surface: root.dataset.colorSurface || DEFAULT_COLORS.surface,
            active: root.dataset.colorActive || DEFAULT_COLORS.active,
            hover: root.dataset.colorHover || DEFAULT_COLORS.hover,
            text: root.dataset.colorText || DEFAULT_COLORS.text
        };
    }

    /**
     * Liest die Ueberschriftenebene und begrenzt sie auf 2 bis 5 (Fallback 3).
     *
     * @param {HTMLElement} root Accordion-Wurzelelement
     * @return {number} Ueberschriftenebene
     */
    function readHeadingLevel(root) {
        var level = parseInt(root.dataset.headingLevel, 10);

        if (isNaN(level) || level < 2 || level > 5) {
            return 3;
        }

        return level;
    }

    /**
     * Setzt Hintergrund- und Textfarbe eines Zeilenkopfs.
     *
     * Immer inline mit 'important': Das globale Stylesheet des Plugins
     * (assets/css/blocks.css) faerbt alle Elemente mit "title" im Klassennamen
     * im Dunkelmodus weiss. Ohne Inline-Wichtigkeit waeren geschlossene Titel
     * auf hellem Kopf unlesbar.
     *
     * Weil die Inline-Werte 'important' tragen, kommt ein CSS-':hover' nicht
     * dagegen an. Steht der Zeiger gerade auf diesem Kopf, gewinnt deshalb der
     * uebergebene Hover-Hintergrund - sonst wuerde die Flaeche bei einem Klick
     * auf die Zustandsfarbe springen, obwohl der Zeiger nie weggegangen ist.
     * Die Textfarbe folgt immer dem Zustand, nur der Hintergrund wird ersetzt.
     *
     * @param {HTMLElement} header            Kopf-Button
     * @param {string}      background        Hintergrundfarbe des Zustands
     * @param {string}      color             Textfarbe des Zustands
     * @param {string}      [hoverBackground] Hintergrund waehrend des Hoverns
     */
    function setHeaderColors(header, background, color, hoverBackground) {
        var effective = (hoverBackground && hoveredHeaders.has(header)) ? hoverBackground : background;

        header.style.setProperty('background-color', effective, 'important');
        header.style.setProperty('color', color, 'important');

        var title = header.querySelector('.mb-accordion-row__title');

        if (title) {
            title.style.setProperty('color', color, 'important');
        }
    }

    /**
     * Setzt nur die Hintergrundfarbe eines Zeilenkopfs (fuer Hover-Zustaende).
     *
     * Bewusst nur die Langform background-color, damit ein in style.css
     * gesetztes Hintergrundbild oder ein Gradient nicht verloren geht.
     *
     * @param {HTMLElement} element    Kopf-Button
     * @param {string}      background Hintergrundfarbe
     */
    function setBackground(element, background) {
        element.style.setProperty('background-color', background, 'important');
    }

    /**
     * Setzt die Hintergrundfarbe eines Steuerungs-Buttons.
     *
     * Die Serverausgabe setzt dort sowohl die Kurzform 'background' als auch
     * 'background-color' mit !important. Beide werden ueberschrieben, damit die
     * Hover-Farbe unabhaengig von der Deklarationsreihenfolge greift.
     *
     * @param {HTMLElement} element    Steuerungs-Button
     * @param {string}      background Hintergrundfarbe
     */
    function setControlBackground(element, background) {
        element.style.setProperty('background', background, 'important');
        element.style.setProperty('background-color', background, 'important');
    }

    /**
     * Bricht eine laufende Hoehen-Animation ab und entfernt die Inline-Werte.
     *
     * @param {HTMLElement} panel Panel-Element
     */
    function cancelAnimation(panel) {
        var running = runningAnimations.get(panel);

        if (!running) {
            return;
        }

        runningAnimations.delete(panel);
        panel.removeEventListener('transitionend', running.onEnd);
        window.clearTimeout(running.timer);
        panel.style.removeProperty('height');
        panel.style.removeProperty('transition');
        panel.style.removeProperty('overflow');
    }

    /**
     * Misst die Zielhoehe eines Panels am Polster-Wrapper.
     *
     * Das Panel selbst ist polsterlos und wird waehrend der Animation auf eine
     * Inline-Hoehe geklemmt - es kennt die Inhaltshoehe also nicht zuverlaessig.
     * Der Wrapper haelt Inhalt samt Innenabstand und behaelt seine natuerliche
     * Hoehe, auch wenn das Panel auf 0 steht.
     *
     * offsetHeight (Rahmen und Polster eingeschlossen) und scrollHeight
     * (Inhaltsbox samt Polster) koennen sich je nach CSS unterscheiden; der
     * groessere Wert verhindert ein Abschneiden des Inhalts.
     *
     * @param {HTMLElement} panelInner Polster-Wrapper
     * @return {number} Zielhoehe in Pixel
     */
    function measureContentHeight(panelInner) {
        if (!panelInner) {
            return 0;
        }

        return Math.max(panelInner.scrollHeight || 0, panelInner.offsetHeight || 0);
    }

    /**
     * Gibt das Ziel einer laufenden Animation zurueck ('open' oder 'close').
     *
     * @param {HTMLElement} panel Panel-Element
     * @return {string|null} Animationsziel
     */
    function pendingTarget(panel) {
        var running = runningAnimations.get(panel);

        return running ? running.target : null;
    }

    /**
     * Animiert die Panel-Hoehe und raeumt die Inline-Werte danach wieder auf,
     * damit der Inhalt frei fliessen kann.
     *
     * @param {HTMLElement} panel      Panel-Element
     * @param {number}      fromHeight Startwert in Pixel
     * @param {number}      toHeight   Zielwert in Pixel
     * @param {string}      target     'open' oder 'close'
     * @param {Function}    onDone     Aufraeum-Rueckruf
     */
    function animateHeight(panel, fromHeight, toHeight, target, onDone) {
        cancelAnimation(panel);

        var finish = function () {
            if (!runningAnimations.has(panel)) {
                return;
            }

            var running = runningAnimations.get(panel);

            runningAnimations.delete(panel);
            panel.removeEventListener('transitionend', running.onEnd);
            window.clearTimeout(running.timer);
            panel.style.removeProperty('height');
            panel.style.removeProperty('transition');
            panel.style.removeProperty('overflow');
            onDone();
        };

        var onEnd = function (event) {
            // Nur die eigene Hoehen-Transition beachten, keine Transitions
            // verschachtelter Bloecke im Panel.
            if (event.target !== panel || event.propertyName !== 'height') {
                return;
            }

            finish();
        };

        panel.style.overflow = 'hidden';
        panel.style.height = fromHeight + 'px';
        panel.style.transition = 'height ' + ANIMATION_DURATION + 'ms ' + ANIMATION_EASING;
        panel.addEventListener('transitionend', onEnd);

        // Sicherheitsnetz: feuert transitionend nicht (z. B. weil Start- und
        // Zielhoehe gleich sind), schliesst der Timer den Vorgang ab.
        var timer = window.setTimeout(finish, ANIMATION_DURATION + 80);

        runningAnimations.set(panel, { target: target, onEnd: onEnd, timer: timer });

        // Reflow erzwingen, damit der Startwert als Ausgangspunkt gilt.
        void panel.offsetHeight;

        panel.style.height = toHeight + 'px';
    }

    /**
     * Baut aus der flachen Blockfolge die Accordion-Zeilen.
     *
     * Das Original-Heading-Element bleibt erhalten (samt HTML-Anker und
     * vorhandenen Klassen) und wird nur in die Zeilen-Huelle verschoben.
     *
     * Iteriert bewusst ueber childNodes und nicht ueber children: Steht ein
     * Block-Element in einem Absatz - bei Display-Formeln der Regelfall -,
     * spaltet der HTML-Parser des Browsers den <p> auf, und dabei entstehen
     * nackte Textknoten. Ueber children waeren die fuer diese Schleife
     * unsichtbar: Sie blieben zwischen den Klappzeilen sichtbar stehen,
     * waehrend der Rest ihres Absatzes im Panel verschwindet.
     *
     * @param {HTMLElement} content Inhaltszone des Accordions
     * @param {number}      level   Ueberschriftenebene
     * @param {Object}      colors  Farbwerte
     * @param {Map}         parts   Zuordnung Zeile -> { header, panel, panelInner }
     * @return {Array} Zeilen-Elemente in Dokumentreihenfolge
     */
    function buildRows(content, level, colors, parts) {
        var headingTag = 'H' + level;
        // Feste Kopie: Das Verschieben veraendert content.childNodes waehrend
        // der Schleife - ueber die Live-Liste wuerde jeder zweite Knoten
        // uebersprungen.
        var nodes = Array.prototype.slice.call(content.childNodes);
        var rows = [];
        var activeInner = null;
        var i;

        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            // Zeilentrenner ist ausschliesslich ein Ueberschriftenelement der
            // eingestellten Ebene. Ein Textknoten hat kein tagName und ist
            // deshalb nie ein Zeilenkopf.
            if (node.nodeType === 1 && node.tagName === headingTag) {
                var row = document.createElement('div');

                row.className = ROW_CLASS + ' ' + CLOSED_CLASS;
                content.insertBefore(row, node);

                var headerId = uniqueId('mb-accordion-header');
                var panelId = uniqueId('mb-accordion-panel');

                var header = document.createElement('button');

                header.type = 'button';
                header.className = HEADER_CLASS;
                header.id = headerId;
                header.setAttribute('aria-expanded', 'false');
                header.setAttribute('aria-controls', panelId);

                var title = document.createElement('span');

                title.className = 'mb-accordion-row__title';

                // Inhalt der Ueberschrift per Knotenverschiebung uebernehmen
                // (kein innerHTML), damit Verlinkungen und Formatierungen
                // unveraendert erhalten bleiben.
                while (node.firstChild) {
                    title.appendChild(node.firstChild);
                }

                var icon = document.createElement('span');

                icon.className = 'mb-accordion-row__icon';
                icon.setAttribute('aria-hidden', 'true');

                header.appendChild(title);
                header.appendChild(icon);
                node.appendChild(header);
                node.classList.add('mb-accordion-row__heading');

                // Original-Heading in die Zeile verschieben; dadurch bleibt ein
                // im Editor gesetzter HTML-Anker als Sprungziel erhalten.
                row.appendChild(node);

                var panel = document.createElement('div');

                panel.className = 'mb-accordion-row__panel';
                panel.id = panelId;
                panel.setAttribute('role', 'region');
                panel.setAttribute('aria-labelledby', headerId);
                panel.hidden = true;

                // Polster-Wrapper: Der Innenabstand liegt per CSS auf diesem
                // Element, nicht auf dem Panel. Nur so laesst sich das Panel
                // exakt auf 0 animieren - mit Polster am Panel selbst bliebe
                // beim Schliessen die Polsterhoehe stehen und wuerde erst durch
                // 'hidden' schlagartig verschwinden (sichtbares Stocken).
                var panelInner = document.createElement('div');

                panelInner.className = 'mb-accordion-row__panel-inner';
                panel.appendChild(panelInner);
                row.appendChild(panel);

                setHeaderColors(header, colors.surface, colors.text, colors.hover);

                parts.set(row, { header: header, panel: panel, panelInner: panelInner });
                rows.push(row);
                activeInner = panelInner;
                continue;
            }

            // Inhalt vor der ersten Ueberschrift (Einleitungstext) bleibt
            // unveraendert an seiner Stelle stehen.
            if (!activeInner) {
                continue;
            }

            // Reiner Einrueckungs-Leerraum zwischen den Bloecken gehoert in
            // kein Panel - er bleibt liegen, wo er ist. Sonst wanderte der
            // Zeilenumbruch hinter jeder Ueberschrift in die Klappzeile.
            if (node.nodeType === 3 && node.textContent.trim() === '') {
                continue;
            }

            // Alles Uebrige - Elemente wie nicht-leere Textknoten - gehoert in
            // das Panel der zuletzt eroeffneten Zeile.
            activeInner.appendChild(node);
        }

        return rows;
    }

    /**
     * Prueft, ob ein Accordion vollstaendig geparst im DOM steht.
     *
     * Waehrend des Parsens (readyState 'loading') darf nur umgebaut werden, was
     * komplett vor dem eigenen Footer-Skript liegt. Andernfalls fehlten noch
     * Geschwister, die dann nicht mehr in ein Panel wandern wuerden.
     *
     * @param {HTMLElement} root Accordion-Wurzelelement
     * @return {boolean} true, wenn der Umbau jetzt sicher ist
     */
    function isFullyParsed(root) {
        if (document.readyState !== 'loading') {
            return true;
        }

        if (!ownScript || typeof root.compareDocumentPosition !== 'function') {
            return false;
        }

        if (root.contains(ownScript)) {
            return false;
        }

        var position = root.compareDocumentPosition(ownScript);

        // Das Skript-Tag folgt dem Accordion: alles darin ist bereits geparst.
        return (position & 4) === 4;
    }

    /**
     * Initialisiert ein einzelnes Accordion.
     *
     * @param {HTMLElement} root Accordion-Wurzelelement
     */
    function initAccordion(root) {
        if (!root || root.nodeType !== 1) {
            return;
        }

        // Idempotenz: Der MutationObserver kann mehrfach fuer dasselbe
        // Accordion feuern.
        if (root.dataset.mbAccordionInit === '1') {
            return;
        }

        // Noch nicht fertig geparst: DOMContentLoaded holt es nach.
        if (!isFullyParsed(root)) {
            return;
        }

        var content = root.querySelector(CONTENT_SELECTOR);

        // Nur die eigene Inhaltszone verwenden, nie die eines verschachtelten
        // Accordions.
        if (!content || content.closest(ROOT_SELECTOR) !== root) {
            return;
        }

        root.dataset.mbAccordionInit = '1';

        var level = readHeadingLevel(root);
        var colors = readColors(root);
        var allowMultiple = root.dataset.allowMultiple === 'true';
        var openFirst = root.dataset.openFirst === 'true';
        var parts = new Map();
        var rows = buildRows(content, level, colors, parts);

        // Robustheit: Ohne Ueberschrift der konfigurierten Ebene bleibt der
        // Inhalt unveraendert stehen - keine Zeilen, kein Fehler.
        if (!rows.length) {
            return;
        }

        /**
         * Prueft, ob eine Zeile als offen gilt. Einzige verbindliche Quelle
         * fuer die Umschaltlogik (siehe Zustandsregel im Dateikopf).
         *
         * Rangfolge:
         * 1. Laeuft eine Hoehenanimation, entscheidet allein ihr Ziel
         *    (pendingTarget). Eine zuklappende Zeile gilt sofort als
         *    geschlossen, eine aufklappende sofort als offen. Nur so kehrt ein
         *    Klick mitten in der Bewegung die Richtung um, statt zu blockieren.
         * 2. Ohne laufende Animation entscheidet die Klasse is-closed.
         *
         * hidden wird bewusst nicht geprueft: Es folgt der Bewegung erst
         * nachtraeglich und waere waehrend des Zuklappens noch false, obwohl die
         * Zeile bereits als geschlossen gilt.
         *
         * @param {HTMLElement} row Zeilen-Element
         * @return {boolean} true, wenn offen oder gerade aufklappend
         */
        function isRowOpen(row) {
            var part = parts.get(row);

            if (!part) {
                return false;
            }

            var target = pendingTarget(part.panel);

            if (target) {
                return target === 'open';
            }

            return !row.classList.contains(CLOSED_CLASS);
        }

        /**
         * Zieht die Hoehe eines offenen Panels nach, wenn sich sein Inhalt
         * nachtraeglich veraendert hat - etwa weil KaTeX erst nach dem
         * Aufklappen mit den echten Webfonts gerendert hat.
         *
         * Warum hier nicht bedingungslos eine Pixelhoehe gesetzt wird:
         * animateHeight() entfernt am Ende jeder Bewegung seine Inline-Werte,
         * ein fertig geoeffnetes Panel steht also auf natuerlicher Hoehe und
         * waechst mit seinem Inhalt von selbst. Eine feste Pixelhoehe waere
         * dort schaedlich - sie ueberlebte jede spaetere Layoutaenderung
         * (Fensterbreite, umbrechender Text) und wuerde den Inhalt wegen des
         * overflow:hidden am Panel abschneiden. Die frisch gemessene Hoehe
         * wird deshalb nur dort gesetzt, wo tatsaechlich eine Inline-Hoehe
         * wirkt: waehrend einer laufenden Oeffnen-Animation (sie bekommt das
         * korrigierte Ziel und traegt es ueber die Transition weich nach)
         * oder bei einem Restwert aus einer abgebrochenen Bewegung.
         *
         * @param {HTMLElement} row Zeilen-Element
         */
        function refreshOpenHeight(row) {
            var part = parts.get(row);

            // Der Nutzer kann inzwischen wieder zugeklappt haben.
            if (!part || !isRowOpen(row)) {
                return;
            }

            var panel = part.panel;
            var height = measureContentHeight(part.panelInner);

            if (pendingTarget(panel) === 'open' || panel.style.height) {
                panel.style.height = height + 'px';
            }
        }

        /**
         * Laesst den LaTeX-Renderer des CDB-Plugins ueber ein gerade
         * geoeffnetes Panel laufen und misst danach neu.
         *
         * Der sichtbare Teilbaum ist der Punkt: In einem versteckten Panel
         * laedt der Browser die KaTeX-Webfonts nicht, jede Hoehenmessung
         * traefe dort die Ersatzschrift. window.cbdRenderLatex(panel) loest
         * erst nach document.fonts.ready auf - erst danach ist die Messung
         * verlaesslich.
         *
         * Die Funktion stammt aus einem anderen Plugin (Container Block
         * Designer) und fehlt, wenn dieses abgeschaltet ist. Ohne sie bleibt
         * es beim bisherigen Verhalten: Das resize-Ereignis aus finishOpen()
         * ist die Rueckfallebene, sie sagt aber nicht, wann fertig gerendert
         * ist.
         *
         * @param {HTMLElement} row Zeilen-Element
         */
        function renderLatexAndRemeasure(row) {
            if (typeof window.cbdRenderLatex !== 'function') {
                return;
            }

            var part = parts.get(row);

            if (!part) {
                return;
            }

            // Der ganze Block liegt im try: Zugesichert ist zwar, dass die
            // Funktion nie wirft und ein Promise liefert - aber sie stammt aus
            // einem fremden Plugin. Weder ein Wurf noch ein Thenable ohne
            // catch() darf das Aufklappen aufhalten.
            try {
                var pending = window.cbdRenderLatex(part.panel);

                if (!pending || typeof pending.then !== 'function') {
                    return;
                }

                var settled = pending.then(function () {
                    refreshOpenHeight(row);
                });

                if (settled && typeof settled['catch'] === 'function') {
                    settled['catch'](function () {
                        // Ein Problem im LaTeX-Renderer bleibt folgenlos: Die
                        // Zeile ist offen, nur die Nachmessung entfaellt.
                    });
                }
            } catch (error) {
                // bewusst still - siehe oben
            }
        }

        /**
         * Oeffnet eine Zeile dieses Accordions.
         *
         * @param {HTMLElement} row     Zeilen-Element
         * @param {boolean}     animate Mit Hoehen-Animation
         */
        function openRow(row, animate) {
            var part = parts.get(row);

            // Fremde Zeilen (etwa aus einem verschachtelten Accordion) sind
            // nicht in parts hinterlegt und werden ignoriert.
            if (!part || isRowOpen(row)) {
                return;
            }

            var panel = part.panel;
            var header = part.header;

            // Startwert: die aktuell gerenderte Panel-Hoehe. Bei einer
            // abgebrochenen Schliess-Animation ist das der Zwischenwert.
            var startHeight = panel.hidden ? 0 : panel.offsetHeight;

            cancelAnimation(panel);

            // Beim Oeffnen passen alle Marker von Anfang an zusammen: Der Inhalt
            // muss sichtbar sein, damit die Bewegung ueberhaupt etwas zeigt.
            // Deshalb hier - anders als im Schliesspfad - keine Zweistufigkeit.
            panel.hidden = false;
            row.classList.remove(CLOSED_CLASS);
            header.setAttribute('aria-expanded', 'true');
            setHeaderColors(header, colors.active, OPEN_TITLE_COLOR, colors.hover);

            var finishOpen = function () {
                // Formeln, die erst mit dem Aufklappen sichtbar geworden sind,
                // rendern lassen und die Hoehe danach nachziehen. Fehlt das
                // CDB-Plugin, tut der Aufruf nichts.
                renderLatexAndRemeasure(row);

                // Verschachtelte Spezialbloecke (Plotly-Diagramme, 3D-Viewer)
                // messen ihre Groesse beim Initialisieren. Wurden sie in einem
                // geschlossenen Panel initialisiert, richten sie sich erst nach
                // einem resize-Ereignis korrekt aus.
                window.dispatchEvent(new Event('resize'));
            };

            if (animate && !prefersReducedMotion()) {
                // Zielhoehe am Polster-Wrapper messen, nicht am polsterlosen
                // Panel: nur der Wrapper kennt Inhalt samt Innenabstand.
                animateHeight(panel, startHeight, measureContentHeight(part.panelInner), 'open', finishOpen);
            } else {
                panel.style.removeProperty('height');
                panel.style.removeProperty('transition');
                panel.style.removeProperty('overflow');
                finishOpen();
            }
        }

        /**
         * Schliesst eine Zeile dieses Accordions.
         *
         * @param {HTMLElement} row     Zeilen-Element
         * @param {boolean}     animate Mit Hoehen-Animation
         */
        function closeRow(row, animate) {
            var part = parts.get(row);

            if (!part || !isRowOpen(row)) {
                return;
            }

            var panel = part.panel;
            var header = part.header;

            // Startwert: die aktuell gerenderte Panel-Hoehe. Bei einer
            // abgebrochenen Oeffnen-Animation ist das der Zwischenwert. Muss
            // vor cancelAnimation() gelesen werden.
            var startHeight = panel.offsetHeight;

            cancelAnimation(panel);

            // Sofortige Rueckmeldung auf den Klick, noch vor dem Start der
            // Animation (siehe Zustandsregel im Dateikopf): Kopf-Farben zurueck
            // auf den geschlossenen Zustand, is-closed fuer die Chevron-Drehung
            // und aria-expanded fuer Screenreader. Nur panel.hidden wartet auf
            // das Ende der Bewegung - sonst gaebe es nichts zu animieren.
            row.classList.add(CLOSED_CLASS);
            header.setAttribute('aria-expanded', 'false');
            setHeaderColors(header, colors.surface, colors.text, colors.hover);

            var finishClose = function () {
                panel.hidden = true;
            };

            if (animate && !prefersReducedMotion()) {
                animateHeight(panel, startHeight, 0, 'close', finishClose);
            } else {
                panel.style.removeProperty('height');
                panel.style.removeProperty('transition');
                panel.style.removeProperty('overflow');
                finishClose();
            }
        }

        /**
         * Schliesst alle Zeilen dieses Accordions ausser der angegebenen.
         *
         * @param {HTMLElement} keepRow Zeile, die offen bleibt
         * @param {boolean}     animate Mit Hoehen-Animation
         */
        function closeOthers(keepRow, animate) {
            rows.forEach(function (row) {
                if (row !== keepRow) {
                    closeRow(row, animate);
                }
            });
        }

        /**
         * Oeffnet eine Zeile und beachtet dabei den Exklusivmodus.
         *
         * @param {HTMLElement} row     Zeilen-Element
         * @param {boolean}     animate Mit Hoehen-Animation
         */
        function activateRow(row, animate) {
            if (!parts.has(row)) {
                return;
            }

            if (!allowMultiple) {
                closeOthers(row, animate);
            }

            openRow(row, animate);
        }

        /**
         * Oeffnet alle Zeilen dieses Accordions.
         *
         * @param {boolean} animate Mit Hoehen-Animation
         */
        function openAll(animate) {
            rows.forEach(function (row) {
                openRow(row, animate);
            });
        }

        /**
         * Schliesst alle Zeilen dieses Accordions.
         *
         * @param {boolean} animate Mit Hoehen-Animation
         */
        function closeAll(animate) {
            rows.forEach(function (row) {
                closeRow(row, animate);
            });
        }

        /**
         * Klicks auf Zeilenkoepfe und Steuerungs-Buttons verarbeiten.
         *
         * @param {Event} event Klick-Ereignis
         */
        function handleClick(event) {
            var target = event.target;

            if (!target || typeof target.closest !== 'function') {
                return;
            }

            var header = target.closest(HEADER_SELECTOR);

            if (header) {
                var row = header.closest(ROW_SELECTOR);

                // Zeilen eines verschachtelten Accordions gehoeren nicht zu
                // diesem Accordion.
                if (!row || row.closest(ROOT_SELECTOR) !== root || !parts.has(row)) {
                    return;
                }

                if (isRowOpen(row)) {
                    closeRow(row, true);
                } else {
                    activateRow(row, true);
                }

                return;
            }

            var control = target.closest(CONTROL_SELECTOR);

            if (!control || control.closest(ROOT_SELECTOR) !== root) {
                return;
            }

            var action = control.dataset.action;

            if (action === 'open-all') {
                openAll(true);
            } else if (action === 'close-all') {
                closeAll(true);
            }
        }

        /**
         * Tastaturnavigation zwischen den Zeilenkoepfen (ARIA-Accordion-Muster).
         *
         * Enter und Leertaste brauchen keinen Handler, weil der Kopf ein echter
         * Button ist.
         *
         * @param {KeyboardEvent} event Tasten-Ereignis
         */
        function handleHeaderKeydown(event) {
            var key = event.key;

            if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') {
                return;
            }

            var row = event.currentTarget.closest(ROW_SELECTOR);
            var index = row ? rows.indexOf(row) : -1;

            if (index === -1) {
                return;
            }

            var nextIndex;

            if (key === 'ArrowDown') {
                nextIndex = (index + 1) % rows.length;
            } else if (key === 'ArrowUp') {
                nextIndex = (index - 1 + rows.length) % rows.length;
            } else if (key === 'Home') {
                nextIndex = 0;
            } else {
                nextIndex = rows.length - 1;
            }

            var nextPart = parts.get(rows[nextIndex]);

            if (!nextPart) {
                return;
            }

            event.preventDefault();
            nextPart.header.focus();
        }

        /**
         * Hover-Farben eines Zeilenkopfs setzen bzw. zuruecksetzen.
         *
         * @param {MouseEvent} event Maus-Ereignis
         */
        function handleHeaderHover(event) {
            var header = event.currentTarget;
            var row = header.closest(ROW_SELECTOR);

            if (!row) {
                return;
            }

            if (event.type === 'mouseenter') {
                // Merken, damit setHeaderColors() die Hover-Farbe auch bei einem
                // Zustandswechsel unter dem stehenden Zeiger beibehaelt.
                hoveredHeaders.add(header);
                setBackground(header, colors.hover);
                return;
            }

            hoveredHeaders.delete(header);

            // Zurueck auf den Zustandswert. isRowOpen() ist dabei verbindlich:
            // Mitten in einer Animation liefert es das Ziel der Bewegung, sodass
            // die Zielfarbe erscheint und nicht die Ausgangsfarbe.
            setBackground(header, isRowOpen(row) ? colors.active : colors.surface);
        }

        /**
         * Hover-Farben eines Steuerungs-Buttons setzen bzw. zuruecksetzen.
         *
         * Die Serverausgabe setzt die Farben inline, deshalb greift ein
         * CSS-:hover dort nicht.
         *
         * @param {MouseEvent} event Maus-Ereignis
         */
        function handleControlHover(event) {
            var control = event.currentTarget;

            setControlBackground(control, event.type === 'mouseenter' ? colors.hover : colors.active);
        }

        /**
         * Deep-Linking: Zeile zum aktuellen Hash oeffnen und anspringen.
         *
         * Bewusst immer ohne Animation - beim ersten Laden wie bei jedem
         * hashchange. Zwei Gruende: Beim Ankersprung will der Nutzer sofort am
         * Ziel sein und keiner Bewegung zusehen. Und ohne Animation ist die
         * Layouthoehe bereits final, sodass die von scrollIntoView berechnete
         * Zielposition stimmt - animiert geoeffnet waere das Panel im Moment des
         * Scrollens noch 0 Pixel hoch und die Position saesse 250 ms spaeter
         * daneben. Im Exklusivmodus schliessen die uebrigen Zeilen deshalb
         * ebenfalls ohne Animation, damit die Hoehe vor dem Scrollen endgueltig
         * ist.
         *
         * @return {boolean} true, wenn eine Zeile dieses Accordions getroffen wurde
         */
        function applyHash() {
            var raw = window.location.hash.slice(1);

            if (!raw) {
                return false;
            }

            var id;

            try {
                id = decodeURIComponent(raw);
            } catch (error) {
                id = raw;
            }

            if (!id) {
                return false;
            }

            var target = null;

            // getElementById statt Selektor-String, damit ungueltige Zeichen
            // keinen Fehler ausloesen; zusaetzlich abgesichert.
            try {
                target = document.getElementById(id);
            } catch (error) {
                target = null;
            }

            if (!target || !root.contains(target)) {
                return false;
            }

            // Alle Zeilen dieses Accordions sammeln, die das Ziel enthalten
            // (bei verschachtelten Accordions kann das mehr als eine sein).
            var chain = [];
            var node = target;

            while (node && root.contains(node)) {
                var candidate = node.closest ? node.closest(ROW_SELECTOR) : null;

                if (!candidate) {
                    break;
                }

                if (parts.has(candidate)) {
                    chain.push(candidate);
                }

                node = candidate.parentElement;
            }

            if (!chain.length) {
                return false;
            }

            // Von aussen nach innen und ohne Animation oeffnen, damit das Layout
            // vor dem Scrollen fertig ist.
            chain.reverse().forEach(function (row) {
                activateRow(row, false);
            });

            // Erst jetzt springen: Die Panels haben ihre endgueltige Hoehe.
            if (typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ block: 'start' });
            }

            return true;
        }

        // Ereignisse verdrahten.
        root.addEventListener('click', handleClick);

        rows.forEach(function (row) {
            var part = parts.get(row);

            part.header.addEventListener('keydown', handleHeaderKeydown);
            part.header.addEventListener('mouseenter', handleHeaderHover);
            part.header.addEventListener('mouseleave', handleHeaderHover);
        });

        // Steuerleiste sichtbar machen: Ohne JavaScript sollen keine toten
        // Schaltflaechen erscheinen, deshalb traegt sie serverseitig 'hidden'.
        var controls = root.querySelector(CONTROLS_SELECTOR);

        if (controls && controls.closest(ROOT_SELECTOR) === root && root.dataset.expandAll !== 'false') {
            controls.hidden = false;

            var controlButtons = controls.querySelectorAll(CONTROL_SELECTOR);

            Array.prototype.forEach.call(controlButtons, function (control) {
                control.addEventListener('mouseenter', handleControlHover);
                control.addEventListener('mouseleave', handleControlHover);
            });
        }

        // Startzustand: Ein passender Hash gewinnt gegen data-open-first.
        var hashHandled = applyHash();

        if (!hashHandled && openFirst) {
            openRow(rows[0], false);
        }

        window.addEventListener('hashchange', function () {
            applyHash();
        });

        // Zeilen, die schon beim Laden offen sind (Option "erste Zeile
        // oeffnen" oder Deep-Link), wurden vermessen, bevor die Schriften
        // standen. Sobald sie geladen sind, die Hoehen einmalig nachziehen.
        // Nur messen, nicht rendern: Das Rendern beim Laden erledigt der
        // LaTeX-Renderer fuer das ganze Dokument selbst.
        var fontsReady = document.fonts && document.fonts.ready;

        if (fontsReady && typeof fontsReady.then === 'function') {
            var fontsSettled = fontsReady.then(function () {
                rows.forEach(function (row) {
                    refreshOpenHeight(row);
                });
            });

            if (fontsSettled && typeof fontsSettled['catch'] === 'function') {
                fontsSettled['catch'](function () {
                    // Scheitert das Schriften-Versprechen, bleibt es bei der
                    // Messung von vorhin - kein Grund fuer einen Fehler.
                });
            }
        }
    }

    /**
     * Initialisiert alle Accordions im Dokument bzw. in einem Teilbaum.
     *
     * @param {Element|Document} [scope] Suchbereich
     */
    function initAll(scope) {
        var base = scope || document;

        if (base.nodeType === 1 && base.classList && base.classList.contains('mb-accordion')) {
            initAccordion(base);
        }

        if (typeof base.querySelectorAll !== 'function') {
            return;
        }

        var found = base.querySelectorAll(ROOT_SELECTOR);

        Array.prototype.forEach.call(found, initAccordion);
    }

    /**
     * Startet die Beobachtung nachgeladener Inhalte (AJAX, Lazy Loading).
     */
    function startObserver() {
        if (observerStarted || !window.MutationObserver || !document.body) {
            return;
        }

        observerStarted = true;

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type !== 'childList') {
                    return;
                }

                Array.prototype.forEach.call(mutation.addedNodes, function (node) {
                    if (node.nodeType !== 1) {
                        return;
                    }

                    initAll(node);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Sofort initialisieren, nicht erst bei DOMContentLoaded. Das Skript laeuft
    // im Footer, das Accordion-Markup steht zu diesem Zeitpunkt bereits im DOM.
    // Fruehes Schliessen der Panels ist wichtig: Schwergewichtige Bloecke im
    // Inneren (3D-Viewer, Diagramme, Zeichenflaechen) initialisieren sich so
    // erst beim Oeffnen; ein Umbau nach deren Initialisierung wuerde ihre
    // Messungen zerstoeren.
    initAll();
    startObserver();

    // Nur noch als Nachzieher fuer Markup, das erst nach diesem Skript geparst
    // wird (etwa Accordions in Footer-Widgets).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initAll();
            startObserver();
        });
    }
})();
