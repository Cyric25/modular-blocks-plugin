/**
 * Summary Block - Frontend (H5P-Style)
 *
 * Interactive summary quiz where users select correct statements from groups.
 * Correct statements build up a summary of the topic.
 *
 * Features:
 * - Regular mode: Immediate feedback on correctness
 * - Deferred feedback mode: All statements added to summary, feedback only at end
 * - PDF export: Download summary as PDF (only at 100% success)
 */

(function() {
    'use strict';

    /**
     * jsPDF-Konstruktor holen.
     *
     * AP-1.1 (PLAN-Summary-PDF-und-Content-Links.md): Die Bibliothek wird
     * nicht mehr zur Laufzeit von einem CDN nachgeladen, sondern liegt lokal
     * im Block-Ordner und wird von render.php per wp_enqueue_script()
     * eingebunden (Handle "modular-blocks-summary-jspdf"). Der UMD-Build von
     * jsPDF 2.5.1 haengt den Konstruktor an window.jspdf.jsPDF.
     *
     * @returns {Function|null} Der jsPDF-Konstruktor oder null, wenn das
     *                          Skript (noch) nicht geladen ist.
     */
    function getJsPDF() {
        if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return window.jspdf.jsPDF;
        }
        // Aeltere/abweichende Builds legen den Konstruktor direkt auf window.
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        return null;
    }

    /**
     * Aussagetext in reinen Text umwandeln.
     *
     * AP-1.2 (PLAN-Summary-PDF-und-Content-Links.md): Das PDF listet seit
     * diesem AP alle Aussagen aus der data-summary-JSON statt nur der im DOM
     * sichtbar gewordenen. Die Texte dort kommen unveraendert aus
     * wp_kses_post() und duerfen Markup enthalten (<strong>, <em>, ...); im
     * DOM-Weg loeste das vorher .textContent auf. jsPDF wuerde solche Tags
     * dagegen woertlich drucken.
     *
     * @param {string} html - Aussagetext, moeglicherweise mit Markup.
     * @returns {string} Reiner Text ohne Tags, Whitespace normalisiert.
     */
    function htmlToText(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = String(html);
        return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Initialize a summary block
     * @param {HTMLElement} block - The summary block element
     */
    function initSummaryBlock(block) {
        if (!block || block.dataset.initialized === 'true') return;
        block.dataset.initialized = 'true';

        // Parse block data
        const data = JSON.parse(block.dataset.summary || '{}');
        const {
            groups = [],
            totalCorrect = 0,
            progressiveReveal = true,
            showFeedback = true,
            deferredFeedback = false,
            enablePdfDownload = true,
            pdfDownloadThreshold = 100,
            pdfMessage = '',
            penaltyPerWrong = 1,
            successText = '',
            partialSuccessText = '',
            failText = '',
            correctFeedback = '',
            incorrectFeedback = '',
            strings = {},
            // AP-1.3: Lehrer-Uebungs-PDF. teacherPdfCount und
            // allStatementTexts kommen aus derselben data-summary-JSON wie
            // alles andere; allStatementTexts ist leer, wenn render.php den
            // Betrachter nicht als Lehrperson erkannt hat.
            teacherPdfCount = 10,
            allStatementTexts = [],
            // AP-1.5 des Nachtrags (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
            // Titel der obersten Vorfahren-Seite, von render.php ermittelt.
            // Leer, wenn kein Seitenkontext vorliegt - dann gibt keines der
            // drei PDFs eine Kapitelzeile aus.
            kapitelTitel = ''
        } = data;

        // State
        let currentGroupIndex = 0;
        let score = totalCorrect; // Start with max score, deduct for wrong answers
        let wrongAttempts = 0;
        // AP-1.2 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
        // Fehlklicks je Aussagensatz (Gruppe), Schluessel ist der
        // data-group-index des jeweiligen .summary-group-Elements.
        //
        // Bewusst eine EIGENE Struktur neben dem bestehenden, globalen
        // `wrongAttempts` und nicht dessen Umbau (Architekturentscheidung B2
        // des Plans): `wrongAttempts` haengt an der Punktelogik
        // (`penaltyPerWrong`), dieser Zaehler ist rein informativ und darf die
        // Punktzahl unter keinen Umstaenden beeinflussen.
        let wrongAttemptsByGroup = {};
        let correctSelections = []; // Tracks correct statement texts
        let wrongSelections = []; // Tracks wrong statement texts (for deferred mode)
        let allSelections = []; // All selected statement objects (for deferred mode)
        let isCompleted = false;
        // AP-1.2: Der im Ergebnis-PDF gedruckte Prozentwert muss exakt dem auf
        // dem Bildschirm angezeigten entsprechen. Deshalb wird der in
        // showResults() berechnete Wert hier gemerkt statt in generatePDF()
        // ein zweites Mal berechnet - eine zweite Rechnung koennte bei
        // kuenftigen Aenderungen an calculateFinalScore() auseinanderlaufen.
        let lastPercentage = null;

        // DOM elements
        const container = block.querySelector('.summary-container');
        const groupElements = block.querySelectorAll('.summary-group');
        const progressBar = block.querySelector('.progress-fill');
        const currentGroupSpan = block.querySelector('.current-group');
        const summarySection = block.querySelector('.summary-section');
        const summaryStatements = block.querySelector('.summary-statements');
        const resultsSection = block.querySelector('.summary-results');
        const controlsSection = block.querySelector('.summary-controls');
        const retryButton = block.querySelector('.retry-button');
        const solutionButton = block.querySelector('.solution-button');
        const pdfButton = block.querySelector('.pdf-download-button');
        // AP-1.3: nur vorhanden, wenn render.php den Betrachter serverseitig
        // als Lehrperson erkannt hat.
        const teacherPdfButton = block.querySelector('.teacher-practice-pdf-button');
        // AP-1.3 des Nachtrags (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
        // Zahlenfeld neben dem Knopf, aus derselben serverseitigen Bedingung
        // heraus gerendert. Bewusst ueber `block.querySelector` und nicht
        // ueber `document.querySelector` wie im Planvorschlag: Stehen mehrere
        // summary-blocks auf einer Seite, wuerde die dokumentweite Suche
        // immer das Feld des ERSTEN Blocks liefern und alle weiteren Bloecke
        // mit dessen Wert exportieren.
        const teacherPdfCountInput = block.querySelector('.teacher-pdf-count-input');
        // AP-1.4 des Nachtrags: zweiter Lehrer-Knopf, Loesungsblatt. Gleiche
        // serverseitige Sichtbarkeitsbedingung wie die beiden Elemente darueber.
        const teacherSolutionSheetButton = block.querySelector('.teacher-solution-sheet-button');

        /**
         * Einen Fehlklick der zugehoerigen Gruppe zuschreiben.
         *
         * AP-1.2 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md):
         * Schluessel ist `data-group-index` des umgebenden
         * `.summary-group`-Elements, nicht `currentGroupIndex` — bei
         * abgeschaltetem `progressiveReveal` stehen alle Gruppen gleichzeitig
         * offen und der Lernende kann in beliebiger Reihenfolge klicken;
         * `currentGroupIndex` waere dann die falsche Zuordnung.
         *
         * `render.php` gibt `data-group-index` in derselben Reihenfolge aus,
         * in der `$groups_data` in die `data-summary`-JSON wandert — der
         * Index passt also 1:1 auf die Konstante `groups`, die
         * `showSolution()` durchlaeuft.
         *
         * @param {HTMLElement} groupEl - Das .summary-group-Element.
         */
        function countWrongAttempt(groupEl) {
            const rohIndex = groupEl ? parseInt(groupEl.dataset.groupIndex, 10) : NaN;
            const key = Number.isNaN(rohIndex) ? 0 : rohIndex;
            wrongAttemptsByGroup[key] = (wrongAttemptsByGroup[key] || 0) + 1;
        }

        /**
         * Update progress bar
         */
        function updateProgress() {
            const progress = ((currentGroupIndex) / groups.length) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (currentGroupSpan) {
                currentGroupSpan.textContent = Math.min(currentGroupIndex + 1, groups.length);
            }
        }

        /**
         * Show feedback for a statement selection (regular mode only)
         * @param {HTMLElement} statementEl - The statement element
         * @param {boolean} isCorrect - Whether the selection was correct
         */
        function showStatementFeedback(statementEl, isCorrect) {
            const groupEl = statementEl.closest('.summary-group');
            const feedbackEl = groupEl.querySelector('.group-feedback');
            const feedbackMessage = feedbackEl ? feedbackEl.querySelector('.feedback-message') : null;

            statementEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            statementEl.disabled = true;

            if (showFeedback && !deferredFeedback && feedbackEl) {
                feedbackEl.style.display = 'block';
                feedbackEl.className = 'group-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-incorrect');
                if (feedbackMessage) {
                    feedbackMessage.textContent = isCorrect ? correctFeedback : incorrectFeedback;
                }

                // Auto-hide incorrect feedback after 2 seconds
                if (!isCorrect) {
                    setTimeout(() => {
                        feedbackEl.style.display = 'none';
                    }, 2000);
                }
            }
        }

        /**
         * Add statement to summary
         * @param {string} text - The statement text
         * @param {boolean} isCorrect - Whether statement is correct (for styling in deferred mode)
         */
        function addToSummary(text, isCorrect = true) {
            if (!summarySection || !summaryStatements) return;

            // Show summary section if hidden
            summarySection.style.display = 'block';

            // Create summary item
            const item = document.createElement('div');
            item.className = 'summary-item';

            // In deferred mode, don't show checkmark yet - mark correct/incorrect after evaluation
            if (deferredFeedback) {
                item.setAttribute('data-correct', isCorrect ? 'true' : 'false');
                item.innerHTML = `
                    <span class="summary-bullet">•</span>
                    <span class="summary-text">${text}</span>
                `;
            } else {
                item.innerHTML = `
                    <span class="summary-bullet">✓</span>
                    <span class="summary-text">${text}</span>
                `;
            }

            // Animate in
            item.style.opacity = '0';
            item.style.transform = 'translateY(-10px)';
            summaryStatements.appendChild(item);

            requestAnimationFrame(() => {
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });

            // No scroll - stay at current position
        }

        /**
         * Zeile mit der Zahl der Fehlversuche eines Aussagensatzes anhaengen.
         *
         * AP-1.2 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md). Bewusst
         * eine EIGENE Klasse `.summary-wrong-count` und ausdruecklich KEIN
         * `.summary-item`: `updateSummaryAfterEvaluation()` laeuft im
         * verzoegerten Feedback ueber alle `.summary-item`-Elemente und
         * erwartet dort ein `.summary-bullet` und ein `.summary-text` — diese
         * Zeile hat beides nicht und wuerde die Schleife zum Absturz bringen.
         *
         * @param {number} anzahl - Fehlversuche in diesem Aussagensatz.
         */
        function addWrongCountLine(anzahl) {
            if (!summarySection || !summaryStatements) return;

            summarySection.style.display = 'block';

            const zeile = document.createElement('div');
            zeile.className = 'summary-wrong-count';
            zeile.setAttribute('data-wrong-count', String(anzahl));
            zeile.textContent = anzahl === 1
                ? '1 falscher Versuch in diesem Aussagensatz'
                : `${anzahl} falsche Versuche in diesem Aussagensatz`;

            summaryStatements.appendChild(zeile);
        }

        /**
         * Update summary items after deferred feedback evaluation
         */
        function updateSummaryAfterEvaluation() {
            const items = summaryStatements.querySelectorAll('.summary-item');
            items.forEach(item => {
                const isCorrect = item.getAttribute('data-correct') === 'true';
                const bullet = item.querySelector('.summary-bullet');
                const text = item.querySelector('.summary-text');

                if (isCorrect) {
                    bullet.textContent = '✓';
                    bullet.style.color = '#0f9d58';
                    text.style.color = '#333';
                } else {
                    bullet.textContent = '✗';
                    bullet.style.color = '#ea4335';
                    text.style.textDecoration = 'line-through';
                    text.style.color = '#999';
                }
            });
        }

        /**
         * Check if group is completed
         * @param {HTMLElement} groupEl - The group element
         * @returns {boolean}
         */
        function isGroupCompleted(groupEl) {
            if (deferredFeedback) {
                // In deferred mode, group is completed when at least one statement is selected
                const anySelected = groupEl.querySelectorAll('.statement-option.correct, .statement-option.incorrect').length > 0;
                return anySelected;
            } else {
                // In regular mode, need all correct statements
                const correctCount = parseInt(groupEl.dataset.correctCount || '1', 10);
                const correctSelected = groupEl.querySelectorAll('.statement-option.correct').length;
                return correctSelected >= correctCount;
            }
        }

        /**
         * Show continue button for group
         * @param {HTMLElement} groupEl - The group element
         */
        function showContinueButton(groupEl) {
            const continueBtn = groupEl.querySelector('.continue-button');
            if (continueBtn) {
                continueBtn.style.display = 'inline-flex';
            }
        }

        /**
         * Move to next group
         */
        function goToNextGroup() {
            if (currentGroupIndex >= groups.length - 1) {
                showResults();
                return;
            }

            // Hide current group
            if (progressiveReveal && groupElements[currentGroupIndex]) {
                groupElements[currentGroupIndex].classList.remove('active');
                groupElements[currentGroupIndex].style.display = 'none';
            }

            // Show next group
            currentGroupIndex++;
            if (progressiveReveal && groupElements[currentGroupIndex]) {
                groupElements[currentGroupIndex].style.display = 'block';
                groupElements[currentGroupIndex].classList.add('active');

                // Scroll group to center of viewport
                groupElements[currentGroupIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            updateProgress();
        }

        /**
         * Calculate final score
         *
         * AP-1.2 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
         * Jede Gruppe (Aussagen-Trio) ist genau EINEN Punkt wert, verloren
         * beim ERSTEN Fehlklick in dieser Gruppe - unabhaengig davon, wie
         * viele Fehlklicks danach noch in derselben Gruppe folgen (zwei
         * Fehlklicks zaehlen genauso wie einer). Nutzt die bereits
         * vorhandene `wrongAttemptsByGroup`-Struktur (Deklaration oben,
         * gefuellt ueber countWrongAttempt() an beiden Fehlklick-Stellen -
         * REGELMODUS UND deferredFeedback gleichermassen, siehe dortige
         * Aufrufe). Frueher unterschied diese Funktion zwischen Regel- und
         * Verzoegert-Modus (aussagenbasierte Zaehlung via `score` bzw. ein
         * Alles-oder-nichts-Vergleich gegen `allSelections`); beide Wege
         * sind jetzt durch dieselbe gruppenbasierte Zaehlung ersetzt, damit
         * beide Modi konsistent rechnen (Plan-Vorgehen AP-1.2, Schritt 3).
         *
         * Iteriert bewusst ueber `groups` (Laenge = Gruppenanzahl), NICHT
         * ueber Object.keys(wrongAttemptsByGroup) - fehlerfreie Gruppen
         * legen dort gar keinen Schluessel an.
         *
         * @returns {number} Anzahl der fehlerfrei abgeschlossenen Gruppen.
         */
        function calculateFinalScore() {
            let correctGroups = 0;
            groups.forEach((group, index) => {
                if (!wrongAttemptsByGroup[index]) {
                    correctGroups++;
                }
            });
            return correctGroups;
        }

        /**
         * Kapitelzeile in ein PDF schreiben, sofern ein Kapitel bekannt ist.
         *
         * AP-1.5 des Nachtrags (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md).
         * Eine gemeinsame Funktion fuer alle drei PDF-Wege, damit die Zeile in
         * Schueler-Ergebnis-, Uebungs- und Loesungsblatt gleich aussieht und
         * eine spaetere Aenderung nur an einer Stelle noetig ist.
         *
         * Ist `kapitelTitel` leer (z. B. weil der Block ausserhalb eines
         * Seitenkontexts steht), passiert nichts: keine Zeile, kein
         * Leerraum, kein Fehler.
         *
         * `htmlToText()` laeuft aus demselben Grund darueber wie ueber die
         * Aussagetexte: Der Wert kommt aus der JSON, nicht aus dem DOM -
         * HTML-Entities (z. B. `&amp;`) wuerde jsPDF sonst woertlich drucken.
         * Markup kann nicht mehr enthalten sein, das raeumt render.php schon
         * serverseitig mit wp_strip_all_tags() weg.
         *
         * @param {Object} doc        - jsPDF-Dokument.
         * @param {number} startY     - Obere Kante in mm.
         * @param {number} margin     - Linker Rand in mm.
         * @param {number} maxWidth   - Verfuegbare Textbreite in mm.
         * @param {number} lineHeight - Zeilenhoehe in mm.
         * @returns {number} Die neue y-Position (unveraendert, wenn nichts
         *                   geschrieben wurde).
         */
        function writeChapterLine(doc, startY, margin, maxWidth, lineHeight) {
            const text = htmlToText(kapitelTitel);
            if (!text) return startY;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(120, 120, 120);
            const wrapped = doc.splitTextToSize(text, maxWidth);
            doc.text(wrapped, margin, startY);

            // Farbe und Schnitt bewusst zurueckstellen: Die Aufrufer setzen
            // danach zwar beides selbst, aber so bleibt diese Funktion ohne
            // Nebenwirkung auf den Dokumentzustand.
            doc.setTextColor(0, 0, 0);
            return startY + wrapped.length * lineHeight;
        }

        /**
         * Generate PDF of summary
         */
        function generatePDF() {
            const jsPDF = getJsPDF();
            if (!jsPDF) {
                // AP-1.1: Sichtbare Meldung statt stillem Abbruch. Tritt nur
                // auf, wenn jspdf.umd.min.js nicht ausgeliefert wurde oder
                // beim Laden ein Fehler auftrat.
                console.error('jsPDF library not available (expected handle: modular-blocks-summary-jspdf).');
                alert('Die PDF-Bibliothek konnte nicht geladen werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
                return;
            }

            try {
                const doc = new jsPDF();

                // Get block title
                const titleEl = block.querySelector('.summary-title');
                const title = titleEl ? titleEl.textContent : 'Zusammenfassung';

                // AP-1.5 des Nachtrags: Kapitelzeile ueber dem Blocktitel.
                // Ohne Kapitel liefert writeChapterLine() den Startwert
                // unveraendert zurueck - der Kopf steht dann Zeile fuer Zeile
                // exakt dort, wo er vorher stand (Titel y=20,
                // Zusammenfassungs-Ueberschrift y=35, Inhalt ab y=45).
                const titelY = writeChapterLine(doc, 20, 20, doc.internal.pageSize.width - 40, 8);

                // Add title
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text(title, 20, titelY);

                // Add summary title
                const summaryTitleEl = block.querySelector('.summary-section-title');
                const summaryTitle = summaryTitleEl ? summaryTitleEl.textContent : 'Ihre Zusammenfassung:';
                doc.setFontSize(14);
                doc.text(summaryTitle, 20, titelY + 15);

                // AP-1.2: Alle Aussagen aus ALLEN Gruppen, jeweils mit
                // Richtig/Falsch-Kennzeichnung. Vorher listete das PDF nur die
                // im DOM aufgelaufenen .summary-item-Elemente, also allein die
                // vom Lernenden ausgewaehlten. Als Lernunterlage muss aber
                // jede Aussage samt ihrem Wahrheitswert drinstehen.
                // Datenquelle ist bewusst dieselbe wie fuer die
                // Interaktionslogik: das bereits geparste data-summary-JSON
                // (Konstante `groups`), keine zweite Quelle.
                let yPosition = titelY + 25;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 20;
                const lineHeight = 8;
                const textIndent = 26; // Platz fuer die Marke "[RICHTIG] "
                // Rechter Rand aus der echten Seitenbreite, nicht die bisher
                // fest verdrahteten 170 - die liefen von x = margin + 10 aus
                // bis x = 200 und damit 10 mm ueber den rechten Seitenrand.
                const textWidth = doc.internal.pageSize.width - 2 * margin - textIndent;

                // Bewusst ASCII statt "✓"/"✗": jsPDF setzt mit den
                // eingebauten Standardschriften (Helvetica) in WinAnsi. Haken
                // und Kreuz liegen dort NICHT im Zeichensatz und kaemen als
                // leere oder falsche Glyphe heraus. Deutsche Umlaute sind in
                // WinAnsi enthalten und funktionieren weiterhin.
                const MARK_CORRECT = '[RICHTIG]';
                const MARK_WRONG = '[FALSCH]';

                /**
                 * Seitenumbruch, wenn der naechste Block nicht mehr passt.
                 * @param {number} needed - Benoetigte Hoehe in mm.
                 */
                function ensureSpace(needed) {
                    if (yPosition + needed > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                }

                groups.forEach((group, groupIndex) => {
                    const statements = Array.isArray(group.statements) ? group.statements : [];
                    if (statements.length === 0) return;

                    // Gruppenueberschrift in derselben Form wie im Frontend
                    // ("Frage 1 von 2"), damit die PDF-Struktur der Struktur
                    // der Uebung entspricht. Die Gruppen selbst tragen im
                    // Datenmodell keinen eigenen Namen, nur eine `id`.
                    const groupLabel = `${strings.group || 'Frage'} ${groupIndex + 1} ${strings.of || 'von'} ${groups.length}`;
                    ensureSpace(lineHeight + 4);
                    yPosition += 4;
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                    doc.text(groupLabel, margin, yPosition);
                    doc.setFont(undefined, 'normal');
                    yPosition += lineHeight;

                    doc.setFontSize(11);

                    statements.forEach(stmt => {
                        const text = htmlToText(stmt && stmt.text);
                        const isCorrect = !!(stmt && stmt.isCorrect);
                        const wrappedText = doc.splitTextToSize(text, textWidth);

                        ensureSpace(wrappedText.length * lineHeight);

                        doc.setTextColor(0, 0, 0);
                        doc.text(isCorrect ? MARK_CORRECT : MARK_WRONG, margin, yPosition);
                        doc.text(wrappedText, margin + textIndent, yPosition);

                        yPosition += wrappedText.length * lineHeight;
                    });
                });

                // AP-1.2: Gesamtprozentsatz. `lastPercentage` stammt aus
                // showResults() - derselbe Wert, der auf dem Bildschirm in
                // .score-display steht, nicht neu berechnet.
                if (typeof lastPercentage === 'number') {
                    yPosition += 6;
                    ensureSpace(lineHeight);
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                    doc.text(`Ergebnis: ${lastPercentage}% richtig`, margin, yPosition);
                    doc.setFont(undefined, 'normal');
                    yPosition += lineHeight;
                }

                // Add custom message if set
                if (pdfMessage) {
                    yPosition += 10;
                    if (yPosition > pageHeight - margin - 20) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.setFontSize(11);
                    doc.setTextColor(80, 80, 80);
                    doc.setFont(undefined, 'italic');
                    const wrappedMessage = doc.splitTextToSize(htmlToText(pdfMessage), 170);
                    doc.text(wrappedMessage, margin, yPosition);
                    doc.setFont(undefined, 'normal');
                }

                // Add date
                const today = new Date().toLocaleDateString('de-DE');
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text(`Erstellt am ${today}`, margin, pageHeight - 15);

                // Save PDF
                const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
                doc.save(filename);
            } catch (error) {
                console.error('PDF generation error:', error);
                alert('Fehler beim Erstellen der PDF-Datei.');
            }
        }

        /**
         * Übungsblatt-PDF für Lehrpersonen erzeugen.
         *
         * AP-1.3 (PLAN-Summary-PDF-und-Content-Links.md): Zieht `N` zufällige,
         * sich nicht wiederholende Aussagen aus dem Pool DIESES
         * Block-Exemplars (Architekturentscheidung A4 — kein Pool über Block-
         * oder Seitengrenzen hinweg) und setzt daraus ein leeres Aufgabenblatt.
         *
         * Bewusst OHNE Lösung: kein Richtig/Falsch, kein Prozentwert, keine
         * zweite Seite mit Antworten (Nicht-Ziel, Nutzerentscheidung
         * 2026-09-07). `allStatementTexts` enthält deshalb serverseitig gar
         * kein `isCorrect` — die Information steht hier nicht zur Verfügung
         * und kann auch nicht versehentlich durchrutschen.
         *
         * AP-1.1 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
         * `allStatementTexts` enthält seit diesem AP nur noch EINEN Eintrag
         * je Gruppe (die als `isCorrect` markierte Aussage, serverseitig in
         * `render.php` ausgewählt) statt aller drei Formulierungen des
         * jeweiligen Sachverhalts. Das verhindert, dass dasselbe Faktum in
         * mehreren Formulierungen gleichzeitig im selben Übungsblatt landet.
         * `N` bezieht sich damit jetzt auf die Gruppenzahl, nicht mehr auf
         * die Gesamtzahl aller Einzelaussagen.
         */
        function generateTeacherPracticePDF() {
            const jsPDF = getJsPDF();
            if (!jsPDF) {
                console.error('jsPDF library not available (expected handle: modular-blocks-summary-jspdf).');
                alert('Die PDF-Bibliothek konnte nicht geladen werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
                return;
            }

            let pool = Array.isArray(allStatementTexts) ? allStatementTexts.slice() : [];
            // AP-1.1 (PLAN-Summary-Punktesystem-Buttons-und-Kapitellink-Feinschliff.md):
            // Zusaetzliche Absicherung, nicht weil aktuell noetig - render.php
            // liefert seit diesem AP bereits nur noch eine (die richtige)
            // Aussage je Gruppe -, sondern als Schutz gegen kuenftige
            // Datenfehler, falls zwei Gruppen zufaellig wortgleiche Texte
            // tragen sollten.
            pool = Array.from(new Set(pool));
            if (pool.length === 0) {
                alert('Für dieses Element stehen keine Aussagen für ein Übungsblatt zur Verfügung.');
                return;
            }

            try {
                // Fisher-Yates auf einer Kopie: zieht ohne Zurücklegen, also
                // garantiert ohne Wiederholung innerhalb eines PDFs.
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = pool[i];
                    pool[i] = pool[j];
                    pool[j] = tmp;
                }
                // AP-1.3 des Nachtrags: Der Wert aus dem Frontend-Zahlenfeld
                // uebersteuert das Blockattribut - aber nur fuer diesen einen
                // Export. Gespeichert wird nichts (Architekturentscheidung
                // B3); nach einem Neuladen der Seite steht wieder der im
                // Editor gesetzte Wert im Feld.
                //
                // Rueckfall auf das Attribut, wenn das Feld fehlt (kein
                // Lehrer-Kontext), leer ist oder etwas Unlesbares enthaelt.
                // Die anschliessende Deckelung auf die Poolgroesse ist
                // unveraendert die aus dem Vorgaengerplan - eine Eingabe von
                // 999 bei 6 Aussagen liefert weiterhin 6 Zeilen.
                const eingabeRoh = teacherPdfCountInput ? parseInt(teacherPdfCountInput.value, 10) : NaN;
                const gewuenschteAnzahl = Number.isNaN(eingabeRoh)
                    ? (parseInt(teacherPdfCount, 10) || 1)
                    : eingabeRoh;
                const count = Math.min(
                    Math.max(1, gewuenschteAnzahl || 1),
                    pool.length
                );
                const picked = pool.slice(0, count);

                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                const margin = 20;
                const lineHeight = 8;
                const numberIndent = 10;
                const textWidth = pageWidth - 2 * margin - numberIndent;

                // Ankreuzfelder in ASCII, nicht als "☐" (U+2610): jsPDF setzt
                // mit den eingebauten Standardschriften in WinAnsiEncoding,
                // in dem dieses Zeichen nicht enthalten ist (siehe AP-1.2).
                const CHECKBOXES = '[  ] Richtig     [  ] Falsch';

                const titleEl = block.querySelector('.summary-title');
                const blockTitle = titleEl ? titleEl.textContent.trim() : '';

                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Übungsblatt', margin, 20);

                // AP-1.5 des Nachtrags: Kapitelzeile ueber dem Blocktitel,
                // also zwischen Dokumentueberschrift und Blocktitel. Ohne
                // Kapitel bleibt yPosition bei 32 wie zuvor.
                let yPosition = writeChapterLine(doc, 32, margin, pageWidth - 2 * margin, lineHeight);
                if (blockTitle) {
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(80, 80, 80);
                    const wrappedTitle = doc.splitTextToSize(blockTitle, pageWidth - 2 * margin);
                    doc.text(wrappedTitle, margin, yPosition);
                    yPosition += wrappedTitle.length * lineHeight;
                }

                yPosition += 6;
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');

                picked.forEach((rawText, index) => {
                    const text = htmlToText(rawText);
                    const wrappedText = doc.splitTextToSize(text, textWidth);
                    // Aussage + Ankreuffzeile + Leerzeile müssen zusammen auf
                    // eine Seite passen, sonst steht die Frage auf der einen
                    // und ihr Ankreuzfeld auf der nächsten.
                    const needed = (wrappedText.length + 1) * lineHeight + 6;
                    if (yPosition + needed > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    doc.text(`${index + 1}.`, margin, yPosition);
                    doc.text(wrappedText, margin + numberIndent, yPosition);
                    yPosition += wrappedText.length * lineHeight;

                    doc.text(CHECKBOXES, margin + numberIndent, yPosition);
                    yPosition += lineHeight + 6;
                });

                const today = new Date().toLocaleDateString('de-DE');
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text(`Erstellt am ${today}`, margin, pageHeight - 15);

                // Eigener Dateiname zur Unterscheidung vom Schüler-Ergebnis-PDF
                doc.save(`uebungsblatt_${Date.now()}.pdf`);
            } catch (error) {
                console.error('Teacher practice PDF generation error:', error);
                alert('Fehler beim Erstellen der PDF-Datei.');
            }
        }

        /**
         * Lösungsblatt-PDF für Lehrpersonen erzeugen.
         *
         * AP-1.4 (PLAN-Nachtraege-Summary-PDF-und-Kapitellinks.md). Aufbau und
         * Dokument-Setup folgen `generateTeacherPracticePDF()`, der Inhalt ist
         * bewusst das Gegenstück dazu:
         * - ALLE Aussagen aus ALLEN Gruppen, keine Zufallsauswahl. Das
         *   Zahlenfeld aus AP-1.3 wird hier absichtlich NICHT gelesen.
         * - je Aussage `[RICHTIG]`/`[FALSCH]` nach `statement.isCorrect`,
         *   in ASCII wie im Schüler-Ergebnis-PDF (jsPDF setzt mit den
         *   eingebauten Standardschriften in WinAnsiEncoding, in dem „✓"/„✗"
         *   nicht enthalten sind).
         * - KEIN Prozentwert: Das Blatt gehört zu keinem konkreten
         *   Schüler-Durchlauf.
         *
         * Datenquelle ist die Konstante `groups` aus der `data-summary`-JSON —
         * dieselbe, aus der `generatePDF()` liest. `allStatementTexts` taugt
         * hier nicht: Diese Liste trägt bewusst kein `isCorrect`.
         */
        function generateSolutionSheetPDF() {
            const jsPDF = getJsPDF();
            if (!jsPDF) {
                console.error('jsPDF library not available (expected handle: modular-blocks-summary-jspdf).');
                alert('Die PDF-Bibliothek konnte nicht geladen werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
                return;
            }

            if (!Array.isArray(groups) || groups.length === 0) {
                alert('Für dieses Element stehen keine Aussagen für ein Lösungsblatt zur Verfügung.');
                return;
            }

            try {
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                const margin = 20;
                const lineHeight = 8;
                const textIndent = 26; // Platz fuer die Marke "[RICHTIG] "
                const textWidth = pageWidth - 2 * margin - textIndent;

                const MARK_CORRECT = '[RICHTIG]';
                const MARK_WRONG = '[FALSCH]';

                const titleEl = block.querySelector('.summary-title');
                const blockTitle = titleEl ? titleEl.textContent.trim() : '';

                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Lösungsblatt', margin, 20);

                // AP-1.5 des Nachtrags: Kapitelzeile, gleiche Stelle wie im
                // Uebungsblatt.
                let yPosition = writeChapterLine(doc, 32, margin, pageWidth - 2 * margin, lineHeight);
                if (blockTitle) {
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(80, 80, 80);
                    const wrappedTitle = doc.splitTextToSize(blockTitle, pageWidth - 2 * margin);
                    doc.text(wrappedTitle, margin, yPosition);
                    yPosition += wrappedTitle.length * lineHeight;
                }

                /**
                 * Seitenumbruch, wenn der naechste Block nicht mehr passt.
                 * @param {number} needed - Benoetigte Hoehe in mm.
                 */
                function ensureSpace(needed) {
                    if (yPosition + needed > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                }

                groups.forEach((group, groupIndex) => {
                    const statements = Array.isArray(group.statements) ? group.statements : [];
                    if (statements.length === 0) return;

                    const groupLabel = `${strings.group || 'Frage'} ${groupIndex + 1} ${strings.of || 'von'} ${groups.length}`;
                    ensureSpace(lineHeight + 4);
                    yPosition += 4;
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'bold');
                    doc.text(groupLabel, margin, yPosition);
                    doc.setFont(undefined, 'normal');
                    yPosition += lineHeight;

                    doc.setFontSize(11);

                    statements.forEach(stmt => {
                        const text = htmlToText(stmt && stmt.text);
                        const isCorrect = !!(stmt && stmt.isCorrect);
                        const wrappedText = doc.splitTextToSize(text, textWidth);

                        ensureSpace(wrappedText.length * lineHeight);

                        doc.setTextColor(0, 0, 0);
                        doc.text(isCorrect ? MARK_CORRECT : MARK_WRONG, margin, yPosition);
                        doc.text(wrappedText, margin + textIndent, yPosition);

                        yPosition += wrappedText.length * lineHeight;
                    });
                });

                const today = new Date().toLocaleDateString('de-DE');
                doc.setFontSize(9);
                doc.setTextColor(128, 128, 128);
                doc.text(`Erstellt am ${today}`, margin, pageHeight - 15);

                // Eigener Dateiname, klar unterscheidbar von
                // uebungsblatt_<ts>.pdf (AP-1.3 des Vorgaengerplans) und vom
                // Schueler-PDF (<Blocktitel>_<ts>.pdf).
                doc.save(`loesungsblatt_${Date.now()}.pdf`);
            } catch (error) {
                console.error('Solution sheet PDF generation error:', error);
                alert('Fehler beim Erstellen der PDF-Datei.');
            }
        }

        /**
         * Show final results
         */
        function showResults() {
            isCompleted = true;

            // Calculate final score
            const finalScore = calculateFinalScore();
            // AP-1.2: Bezugsgroesse fuer die Prozentrechnung ist jetzt die
            // Gruppenanzahl (Aussagen-Trios), nicht mehr `totalCorrect`
            // (Gesamtzahl aller als isCorrect markierten Einzelaussagen -
            // im Regelfall zwar identisch mit groups.length, aber nicht bei
            // Gruppen mit correctCount !== 1, siehe AP-1.1-Uebergabenotiz).
            const percentage = groups.length > 0 ? Math.round((finalScore / groups.length) * 100) : 0;
            lastPercentage = percentage; // AP-1.2: Quelle fuer die Ergebniszeile im PDF

            // In deferred mode, update summary with correct/incorrect marks
            if (deferredFeedback) {
                updateSummaryAfterEvaluation();
            }

            // Update progress to 100%
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            // Hide groups
            if (progressiveReveal) {
                groupElements.forEach(g => {
                    g.style.display = 'none';
                });
            }

            // Show results
            if (resultsSection) {
                resultsSection.style.display = 'block';

                const iconEl = resultsSection.querySelector('.results-icon');
                const scoreEl = resultsSection.querySelector('.score-display');
                const messageEl = resultsSection.querySelector('.result-message');

                if (iconEl) {
                    iconEl.innerHTML = percentage === 100
                        ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>'
                        : percentage >= 50
                            ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
                            : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>';
                }

                if (scoreEl) {
                    // AP-1.2: Anzeige jetzt gruppenbasiert ("X von Y
                    // Aussagensaetzen richtig"), nicht mehr aussagenbasiert.
                    // `strings.of` wird bereits fuer das Gruppenlabel
                    // ("Frage 1 von 3") verwendet und hier bewusst
                    // wiederverwendet statt eines eigenen Schluessels.
                    scoreEl.textContent = `${finalScore} ${strings.of || 'von'} ${groups.length} ${strings.score || 'Aussagensätzen richtig'} (${percentage}%)`;
                }

                if (messageEl) {
                    if (percentage === 100) {
                        messageEl.textContent = successText;
                        messageEl.className = 'result-message success';
                    } else if (percentage >= 50) {
                        messageEl.textContent = partialSuccessText;
                        messageEl.className = 'result-message partial';
                    } else {
                        messageEl.textContent = failText;
                        messageEl.className = 'result-message fail';
                    }
                }
            }

            // Show PDF button if threshold reached and enabled
            if (pdfButton && enablePdfDownload && percentage >= pdfDownloadThreshold) {
                pdfButton.style.display = 'inline-flex';
            }

            // Show controls
            if (controlsSection) {
                controlsSection.style.display = 'flex';
            }
        }

        /**
         * Show solution (all correct answers)
         */
        function showSolution() {
            // Clear summary and rebuild with all correct statements
            if (summaryStatements) {
                summaryStatements.innerHTML = '';
            }

            groups.forEach((group, groupIndex) => {
                group.statements.forEach(stmt => {
                    if (stmt.isCorrect) {
                        addToSummary(stmt.text, true);
                    }
                });
                // AP-1.2: Fehlversuchszaehler dieses Aussagensatzes. Wird
                // fuer JEDE Gruppe ausgegeben, auch bei 0 - so ist auf einen
                // Blick erkennbar, welche Gruppen fehlerfrei liefen, statt
                // dass eine fehlende Zeile mehrdeutig bleibt (Plan: einheitlich
                // fuer alle Gruppen, nicht gruppenabhaengig formatiert).
                addWrongCountLine(wrongAttemptsByGroup[groupIndex] || 0);
            });

            // Mark all correct statements in UI
            groupElements.forEach((groupEl, groupIndex) => {
                groupEl.style.display = 'block';
                groupEl.classList.add('solution-shown');

                const statements = groupEl.querySelectorAll('.statement-option');
                statements.forEach(stmtEl => {
                    const isCorrect = stmtEl.dataset.correct === 'true';
                    stmtEl.classList.remove('correct', 'incorrect');
                    stmtEl.classList.add(isCorrect ? 'solution-correct' : 'solution-incorrect');
                    stmtEl.disabled = true;
                });
            });

            // Hide solution button after showing
            if (solutionButton) {
                solutionButton.style.display = 'none';
            }

            // Update summary display
            if (deferredFeedback) {
                updateSummaryAfterEvaluation();
            }
        }

        /**
         * Reset the quiz
         */
        function resetQuiz() {
            // Reset state
            currentGroupIndex = 0;
            score = totalCorrect;
            wrongAttempts = 0;
            wrongAttemptsByGroup = {}; // AP-1.2: keine Reste aus dem vorherigen Versuch
            correctSelections = [];
            wrongSelections = [];
            allSelections = [];
            isCompleted = false;
            lastPercentage = null; // AP-1.2

            // Reset UI
            groupElements.forEach((groupEl, index) => {
                groupEl.classList.remove('active', 'solution-shown');
                groupEl.style.display = progressiveReveal && index > 0 ? 'none' : 'block';
                if (index === 0) {
                    groupEl.classList.add('active');
                }

                // Reset statements
                const statements = groupEl.querySelectorAll('.statement-option');
                statements.forEach(stmtEl => {
                    stmtEl.classList.remove('correct', 'incorrect', 'solution-correct', 'solution-incorrect');
                    stmtEl.disabled = false;
                });

                // Hide feedback and continue button
                const feedback = groupEl.querySelector('.group-feedback');
                if (feedback) feedback.style.display = 'none';

                const continueBtn = groupEl.querySelector('.continue-button');
                if (continueBtn) continueBtn.style.display = 'none';
            });

            // Clear summary
            if (summaryStatements) {
                summaryStatements.innerHTML = '';
            }
            if (summarySection) {
                summarySection.style.display = 'none';
            }

            // Hide results, controls, and PDF button
            if (resultsSection) resultsSection.style.display = 'none';
            if (controlsSection) controlsSection.style.display = 'none';
            if (solutionButton) solutionButton.style.display = 'inline-flex';
            if (pdfButton) pdfButton.style.display = 'none';

            // Reset progress
            updateProgress();

            // Scroll to top
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        /**
         * Handle statement click
         * @param {Event} event - Click event
         */
        function handleStatementClick(event) {
            if (isCompleted) return;

            const statementEl = event.currentTarget;
            if (statementEl.disabled) return;

            const groupEl = statementEl.closest('.summary-group');
            const isCorrect = statementEl.dataset.correct === 'true';
            const statementId = statementEl.dataset.statementId;
            const statementText = statementEl.querySelector('.statement-text').textContent;

            if (deferredFeedback) {
                // DEFERRED FEEDBACK MODE
                // Add ALL selected statements to summary (no immediate feedback)
                statementEl.classList.add('selected');
                statementEl.disabled = true;

                // Track selection
                allSelections.push({
                    id: statementId,
                    text: statementText,
                    isCorrect: isCorrect
                });

                if (isCorrect) {
                    correctSelections.push(statementText);
                } else {
                    wrongSelections.push(statementText);
                    // AP-1.2: Im verzoegerten Feedback wurde bislang gar kein
                    // Fehlklick gezaehlt (auch nicht der globale
                    // `wrongAttempts`). Die Punktelogik bleibt unberuehrt -
                    // sie wertet in diesem Modus ausschliesslich
                    // `allSelections` in calculateFinalScore() aus.
                    countWrongAttempt(groupEl);
                }

                // Add to summary (no checkmark yet)
                addToSummary(statementText, isCorrect);

                // Check if group has at least one selection
                if (isGroupCompleted(groupEl)) {
                    // Disable remaining statements
                    const remainingStatements = groupEl.querySelectorAll('.statement-option:not(.selected)');
                    remainingStatements.forEach(stmt => {
                        stmt.disabled = true;
                        stmt.classList.add('disabled');
                    });

                    // Show continue button or advance
                    if (progressiveReveal) {
                        if (currentGroupIndex < groups.length - 1) {
                            showContinueButton(groupEl);
                        } else {
                            // Last group - show results
                            setTimeout(showResults, 500);
                        }
                    }
                }
            } else {
                // REGULAR MODE (immediate feedback)
                if (isCorrect) {
                    // Correct answer
                    showStatementFeedback(statementEl, true);
                    correctSelections.push(statementText);
                    addToSummary(statementText, true);

                    // Check if group is completed
                    if (isGroupCompleted(groupEl)) {
                        // Disable remaining statements in this group
                        const remainingStatements = groupEl.querySelectorAll('.statement-option:not(.correct):not(.incorrect)');
                        remainingStatements.forEach(stmt => {
                            stmt.disabled = true;
                            stmt.classList.add('disabled');
                        });

                        // Auto-advance to next group after short delay
                        if (progressiveReveal) {
                            setTimeout(() => {
                                if (currentGroupIndex < groups.length - 1) {
                                    goToNextGroup();
                                } else {
                                    showResults();
                                }
                            }, 800);
                        }
                    }
                } else {
                    // Wrong answer
                    showStatementFeedback(statementEl, false);
                    wrongAttempts++;
                    // AP-1.2: zusaetzlich zur bestehenden globalen Zaehlung,
                    // die Reihenfolge zur Punktezeile darunter ist bewusst
                    // unveraendert geblieben.
                    countWrongAttempt(groupEl);
                    score -= penaltyPerWrong;
                }
            }
        }

        /**
         * Handle continue button click
         * @param {Event} event - Click event
         */
        function handleContinueClick(event) {
            goToNextGroup();
        }

        // Setup event listeners
        block.querySelectorAll('.statement-option').forEach(stmt => {
            stmt.addEventListener('click', handleStatementClick);
        });

        block.querySelectorAll('.continue-button').forEach(btn => {
            btn.addEventListener('click', handleContinueClick);
        });

        if (retryButton) {
            retryButton.addEventListener('click', resetQuiz);
        }

        if (solutionButton) {
            solutionButton.addEventListener('click', showSolution);
        }

        if (pdfButton) {
            pdfButton.addEventListener('click', generatePDF);
        }

        // AP-1.3: Der Knopf existiert nur, wenn render.php den Betrachter als
        // Lehrperson erkannt hat - hier ist keine zweite Rechteprüfung nötig
        // (und eine client-seitige wäre ohnehin wertlos).
        if (teacherPdfButton) {
            teacherPdfButton.addEventListener('click', generateTeacherPracticePDF);
        }

        // AP-1.4 des Nachtrags: derselbe Weg wie beim Knopf darueber - der
        // Knopf existiert nur, wenn render.php den Betrachter serverseitig als
        // Lehrperson erkannt hat.
        if (teacherSolutionSheetButton) {
            teacherSolutionSheetButton.addEventListener('click', generateSolutionSheetPDF);
        }

        // Initialize
        updateProgress();
    }

    // Export for external use
    window.initSummaryBlock = initSummaryBlock;

    /**
     * Initialize all summary blocks on the page
     */
    function initAllSummaryBlocks() {
        const blocks = document.querySelectorAll('.wp-block-modular-blocks-summary-block');
        blocks.forEach(initSummaryBlock);
    }

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllSummaryBlocks);
    } else {
        initAllSummaryBlocks();
    }

    // Also initialize on window load
    window.addEventListener('load', initAllSummaryBlocks);

    // Handle dynamically added blocks
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && node.classList.contains('wp-block-modular-blocks-summary-block')) {
                                initSummaryBlock(node);
                            }
                            const blocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-summary-block');
                            if (blocks) {
                                blocks.forEach(initSummaryBlock);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

})();
