/**
 * Frontend-JavaScript fuer den Accordion-Block
 *
 * Der Block liefert serverseitig eine flache Folge gerenderter Bloecke
 * (Ueberschriften und Inhalte) innerhalb von .mb-accordion__content.
 * Dieses Skript baut daraus zur Laufzeit bedienbare Accordion-Zeilen:
 * pro Ueberschrift der konfigurierten Ebene eine Zeile, deren Panel alle
 * Folgegeschwister bis zur naechsten Ueberschrift aufnimmt.
 *
 * Wichtig: Inhalte werden ausschliesslich per Knotenverschiebung
 * (appendChild/insertBefore) umgehaengt, niemals per innerHTML. Andernfalls
 * verlieren verschachtelte Bloecke (3D-Molekuel-Viewer, Plotly-Diagramme,
 * Zeichenflaechen) ihre Event-Handler und ihren Zustand.
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
    var OPEN_TITLE_COLOR = '#ffffff';

    // Standardfarben, falls die data-color-*-Attribute fehlen.
    var DEFAULT_COLORS = {
        surface: '#f5ede9',
        active: '#e24614',
        hover: '#c93d12',
        text: '#71230a'
    };

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
     * @param {HTMLElement} header     Kopf-Button
     * @param {string}      background Hintergrundfarbe
     * @param {string}      color      Textfarbe
     */
    function setHeaderColors(header, background, color) {
        header.style.setProperty('background-color', background, 'important');
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
        panel.style.transition = 'height ' + ANIMATION_DURATION + 'ms ease';
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
     * @param {HTMLElement} content Inhaltszone des Accordions
     * @param {number}      level   Ueberschriftenebene
     * @param {Object}      colors  Farbwerte
     * @param {Map}         parts   Zuordnung Zeile -> { header, panel }
     * @return {Array} Zeilen-Elemente in Dokumentreihenfolge
     */
    function buildRows(content, level, colors, parts) {
        var headingTag = 'H' + level;
        var children = Array.prototype.slice.call(content.children);
        var rows = [];
        var activePanel = null;
        var i;

        for (i = 0; i < children.length; i++) {
            var node = children[i];

            if (node.tagName === headingTag) {
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
                row.appendChild(panel);

                setHeaderColors(header, colors.surface, colors.text);

                parts.set(row, { header: header, panel: panel });
                rows.push(row);
                activePanel = panel;
            } else if (activePanel) {
                activePanel.appendChild(node);
            }

            // Inhalt vor der ersten Ueberschrift (Einleitungstext) bleibt
            // unveraendert an seiner Stelle stehen.
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
         * Prueft, ob eine Zeile offen ist (beruecksichtigt laufende Animationen).
         *
         * @param {HTMLElement} row Zeilen-Element
         * @return {boolean} true, wenn offen oder gerade oeffnend
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
            var startHeight = panel.hidden ? 0 : panel.offsetHeight;

            cancelAnimation(panel);

            // Die drei Zustandsmarker immer gemeinsam setzen.
            panel.hidden = false;
            row.classList.remove(CLOSED_CLASS);
            header.setAttribute('aria-expanded', 'true');
            setHeaderColors(header, colors.active, OPEN_TITLE_COLOR);

            var finishOpen = function () {
                // Verschachtelte Spezialbloecke (Plotly-Diagramme, 3D-Viewer)
                // messen ihre Groesse beim Initialisieren. Wurden sie in einem
                // geschlossenen Panel initialisiert, richten sie sich erst nach
                // einem resize-Ereignis korrekt aus.
                window.dispatchEvent(new Event('resize'));
            };

            if (animate && !prefersReducedMotion()) {
                animateHeight(panel, startHeight, panel.scrollHeight, 'open', finishOpen);
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
            var startHeight = panel.offsetHeight;

            var finishClose = function () {
                // Die drei Zustandsmarker immer gemeinsam setzen.
                panel.hidden = true;
                row.classList.add(CLOSED_CLASS);
                header.setAttribute('aria-expanded', 'false');
                setHeaderColors(header, colors.surface, colors.text);
            };

            cancelAnimation(panel);

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
                setBackground(header, colors.hover);
                return;
            }

            // Zurueck auf den Zustandswert.
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
         * @param {boolean} animate Mit Hoehen-Animation
         * @return {boolean} true, wenn eine Zeile dieses Accordions getroffen wurde
         */
        function applyHash(animate) {
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

            // Von aussen nach innen oeffnen, damit Hoehenmessungen stimmen.
            chain.reverse().forEach(function (row) {
                activateRow(row, animate);
            });

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
        var hashHandled = applyHash(false);

        if (!hashHandled && openFirst) {
            openRow(rows[0], false);
        }

        window.addEventListener('hashchange', function () {
            applyHash(true);
        });
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
