# Projektplan: Accordion-Block für „Eigene WP Blocks"

_Erstellt am: 2026-08-03 · Letzte Aktualisierung: 2026-08-03_

## 0. Anweisungen für den ausführenden Agenten

Du arbeitest nach diesem Plan. Er ist die einzige Wahrheitsquelle – du hast
keinen Zugriff auf das Gespräch, in dem er entstand. Halte dich an diese Regeln:

**Rollen und Modelle:**
A. Wird die Abarbeitung von einem Orchestrator koordiniert (Opus), gilt:
   Der Orchestrator delegiert APs an Subagenten und implementiert NIEMALS
   selbst. Er gibt jedem Subagenten nur dessen AP-Text plus die Abschnitte
   0–5 dieses Plans als Kontext, prüft jede Rückmeldung gegen die
   Akzeptanzkriterien des APs, bevor er abhängige APs freigibt, und pflegt
   die Statustabelle.
B. Jedes AP nennt sein Ausführungsmodell (**Modell:** sonnet | opus).
   Subagenten mit genau diesem Modell starten.
C. Unabhängige APs derselben Phase (disjunkte Dateien) dürfen parallel
   bearbeitet werden. APs, die dieselben Dateien ändern, nie parallel.

**Arbeitsweise:**
1. Bearbeite genau EIN Arbeitspaket (AP) pro Auftrag, sofern nicht anders beauftragt.
2. Prüfe vor Beginn die Abhängigkeiten deines APs in der Statustabelle
   (Abschnitt 8). Sind sie nicht ☑, brich ab und melde das.
3. Setze deinen AP-Status auf ◐ (in Arbeit), bevor du beginnst.
4. Bleibe strikt im Scope des APs. Fällt dir Verbesserungspotenzial außerhalb
   auf, notiere es in der Übergabenotiz – setze es nicht um.
5. Beachte die Nicht-Ziele (Abschnitt 2) und Constraints (Abschnitt 3).
   Besonders: die Plugin-Kerninfrastruktur (`includes/`, `webpack.config.js`,
   `create-block-zips.js`, `modular-blocks-plugin.php`) wird in keinem AP
   dieses Plans geändert – nur gelesen.

**Tests (Pflicht, ein AP ohne bestandene Tests ist nicht fertig):**
6. Nach Abschluss: alle Akzeptanzkriterien einzeln nachweisen + die im AP
   definierten Tests durchführen.
7. TDD entfällt in diesem Plan (kein JS-/PHP-Testframework im Projekt
   eingerichtet, funktionale Prüfung erfolgt manuell im WordPress-Editor).
   Falls ein AP dennoch Testfälle vorgibt: Tests niemals abändern, damit sie
   bestehen. Hältst du einen Test für inhaltlich falsch, dokumentiere das in
   der Übergabenotiz und stoppe.
8. Ergebnis ins Testprotokoll (Abschnitt 9) eintragen.
9. Erst dann Status auf ☑. Bei Fehlschlag: Status ✗ (blockiert), Ursache in
   die Übergabenotiz, nicht mit abhängigen APs weitermachen.
10. Nach dem letzten Implementierungs-AP einer Phase zusätzlich:
    Integrationstest der Phase + Regressionscheck aller vorherigen Phasen.
    In diesem Projekt geschieht das im jeweiligen Abnahme-AP der Phase
    (AP-1.4, AP-2.3, AP-3.4, AP-4.4). Eintrag ins Testprotokoll.
11. Danach folgt das Review-AP (`AP-<N>.rev`): ausgeführt von einem frischen
    Agenten, der KEINES der APs dieser Phase implementiert hat, ausschließlich
    lesend, ohne eine Datei zu verändern. Kritische Befunde führen zu
    Korrektur-APs (Regel 16); die Phase ist erst danach abgeschlossen.

**Grenze zwischen Agenten- und Nutzerarbeit (wichtig in diesem Projekt):**
12. Funktionale Tests im WordPress-Editor und Frontend kann der Agent NICHT
    selbst ausführen – es gibt keine lokal angebundene WordPress-Instanz für
    ihn. Der Agent führt die lokalen Gates aus (Abschnitt 3, „Deploy-Gate D"),
    erzeugt die Block-ZIPs und legt dem Nutzer die im AP formulierte
    Abnahme-Checkliste vor. Der Nutzer lädt die ZIPs hoch, klickt die
    Checkliste durch und meldet das Ergebnis zurück. Erst diese Rückmeldung
    schließt das Abnahme-AP ab. Nie einen funktionalen Test als bestanden
    protokollieren, den niemand durchgeführt hat.

**Übergabe:**
13. Fülle die Übergabenotiz deines APs aus: was geändert wurde, getroffene
    Entscheidungen, was für Folge-APs relevant ist.
14. Hat dein AP Dateien angelegt oder wesentlich geändert: aktualisiere deren
    Zeilen in `reference_file_map.md` im Plugin-Verzeichnis (Datei | Zweck |
    wichtige Funktionen/Inhalte | Hängt ab von).
15. Aktualisiere „Letzte Aktualisierung" im Dateikopf dieses Plans.
16. Git: mindestens ein Commit je AP mit AP-ID im Text, z. B.
    `AP-1.2: Eltern-Block accordion angelegt`. Nach jedem abgeschlossenen AP
    den Phasen-Branch pushen (`git push -u origin <branch>`). Phasen-Branch
    erst nach bestandenem Abnahme-AP UND Review in `main` mergen, danach
    `main` pushen. Alle Git-Befehle ausschließlich im Verzeichnis
    `Plugins/Eigene WP Blocks` ausführen – das übergeordnete Website-
    Verzeichnis ist KEIN Git-Repository.

**Umplanung:**
17. Trägt der Plan nicht (Review-Befunde, blockierte APs, falsche Annahmen),
    werden Korrektur-APs mit fortlaufender Nummer ergänzt (`AP-<N>.fix1`, …)
    und in Statustabelle und Testprotokoll aufgenommen. Bestehende APs und
    Übergabenotizen werden nie gelöscht, nur ergänzt.

## 1. Projektziel

Ein neuer Gutenberg-Block „Accordion" für das Plugin *Eigene WP Blocks*: Ein Eltern-Block enthält mehrere anklickbare Zeilen; ein Klick auf eine Zeile klappt deren Inhalt auf und schließt dabei standardmäßig die zuvor geöffnete Zeile (exklusives Verhalten). Per Inspector-Schalter ist auf „mehrere gleichzeitig offen" umschaltbar. Jede Zeile nimmt über InnerBlocks beliebige WordPress-Blöcke auf (Text, Bilder, andere `modular-blocks/*`-Blöcke). Zusätzlich: Option „erste Zeile beim Laden offen", automatische Nummerierung der Zeilen, Buttons „Alle öffnen / Alle schließen", und Deep-Linking (Seitenaufruf mit `#anker` öffnet und scrollt zur passenden Zeile).

Fertig ist das Vorhaben, wenn beide Block-ZIPs (`accordion.zip`, `accordion-row.zip`) auf der Live-WordPress-Installation hochgeladen sind, der Block sich im Editor mit beliebigem Inhalt füllen lässt, das Frontend-Verhalten der Abnahme-Checkliste aus AP-3.4 vollständig entspricht und der Block auch innerhalb eines CDB-Container-Blocks funktioniert (AP-4.1).

## 2. Nicht-Ziele

- **Keine Änderung an der Plugin-Kerninfrastruktur.** `includes/class-block-manager.php`, `includes/class-admin-manager.php`, `modular-blocks-plugin.php`, `webpack.config.js`, `create-block-zips.js`, `package.json` werden ausschließlich gelesen. Die automatische Block-Discovery und der bestehende Build reichen für dieses Vorhaben aus.
- **Keine Änderung an den 13 bestehenden Blöcken** in `blocks/`. Sie dienen nur als Referenzmuster.
- **Keine neuen npm-Abhängigkeiten, keine Fremd-Libraries, keine CDN-Einbindungen** (DSGVO). Das gesamte Verhalten wird mit Vanilla-JS in `view.js` umgesetzt.
- **Kein Fix der bekannten html2canvas-Einschränkung** des CDB-Designers (geschlossene Accordion-Panels erscheinen nicht im Screenshot/PDF-Export eines Container-Blocks). Wird in AP-4.3 nur dokumentiert.
- **Keine DB-Änderung, keine Migration, keine neuen WordPress-Options.**
- **Keine Volltextsuche/Filterung innerhalb des Accordions**, keine Verschachtelung eines Accordions in eine Accordion-Zeile als beworbenes Feature (technisch möglich, wird nicht getestet und nicht dokumentiert).
- **Kein `npm run plugin-zip`** (vollständiges Plugin-ZIP) – laut Projektkonvention deprecated.
- **Keine Änderung am Root-`CLAUDE.md`-Farbschema oder am Theme.**

## 3. Kontext & Constraints

- **Umgebung:** WordPress 6.0+, PHP 8.0+ (lokal geprüft mit PHP 8.5.1 CLI, im PATH verfügbar), Node 16+/npm 7+, `node_modules` und `build/` sind im Projekt bereits vorhanden.
- **Arbeitsverzeichnis:** `c:\Users\mtnhu\OneDrive - Bildungsdirektion\#Unterricht\Website\Plugins\Eigene WP Blocks`. Alle relativen Pfade in diesem Plan beziehen sich darauf, sofern nicht ausdrücklich anders angegeben.
- **Bestehende Konventionen** (verbindlich, aus `CLAUDE.md` im Plugin-Verzeichnis und `BLOCK-DEVELOPMENT.md`):
  - Blockstruktur `blocks/<slug>/` mit `block.json` (Pflicht), `index.js` (Editor), `render.php` (Server-Rendering), `view.js` (Frontend), `style.css`, `editor.css`.
  - `apiVersion: 3`, Namespace `modular-blocks/*`, Kategorie `modular-blocks`, Textdomain `modular-blocks-plugin`.
  - Webpack (`wp-scripts`) kompiliert pro Block: `index.js` → `build/blocks/<slug>/index.js`, `view.js` → `build/blocks/<slug>/view.js`, das in `index.js` importierte `style.css` → `build/blocks/<slug>/style-index.css`, das importierte `editor.css` → `build/blocks/<slug>/index.css`. **Deshalb muss `block.json` auf `"style": "file:./style-index.css"` und `"editorStyle": "file:./index.css"` zeigen** (Vorbild: `blocks/summary-block/block.json`), und `index.js` muss beide CSS-Dateien importieren, sonst entstehen sie nicht.
  - `render.php` erhält `$block_attributes`, `$block_content`, `$block_object`. Fehler-/Hinweisausgabe per `echo`, **nicht** per `return` – die Datei läuft im Output-Buffering, Rückgabewerte werden verworfen (siehe Kommentar in `blocks/summary-block/render.php:46`).
  - `if (!defined('ABSPATH')) { exit; }` am Anfang jeder PHP-Datei.
  - Escaping: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()` für redaktionellen HTML-Text. Bereits gerendertes Inner-Block-HTML (`$block_content`) wird **nicht** erneut escaped oder durch `wp_kses_post()` geschickt.
  - i18n durchgängig mit Textdomain `modular-blocks-plugin`.
  - `view.js`-Muster: IIFE mit `'use strict'`, DOM-Ready-Prüfung (`document.readyState === 'loading'`), `MutationObserver` für nachgeladene Inhalte, keine globalen Variablen.
- **HARTE Farb-Konvention** (`CLAUDE.md` im Plugin-Verzeichnis, Abschnitt „Buttons mit Theme-Farben"): Theme-Farben in PHP über `get_theme_mod()` lesen und als **Inline-Style mit hartkodierten Hex-Werten** und `!important` ausgeben. CSS-Variablen wie `var(--color-ui-surface)` sind ausdrücklich verboten, weil sie von Core-/Plugin-Styles überschrieben werden. Zu verwenden:
  - `get_theme_mod('color_ui_surface', '#e24614')` – Flächen aktiver/interaktiver Elemente
  - `get_theme_mod('color_ui_surface_dark', '#c93d12')` – Hover/aktiver Zustand
  - `get_theme_mod('color_ui_surface_light', '#f5ede9')` – zurückhaltende Hintergründe
  - `get_theme_mod('color_special_text', '#71230a')` – hervorgehobener Text
- **Harte Grenzen:** keine neuen Abhängigkeiten; keine Änderung bestehender Blöcke; kein `npm run plugin-zip`; keine Datenbank-Änderungen.
- **Testumgebung:** Funktionale Prüfung erfolgt auf der **Live-WordPress-Installation nach Upload der Block-ZIPs** (Entscheidung des Nutzers). Lokal laufen nur statische Gates (siehe „Deploy-Gate D"). Optional steht ein lokaler Server unter `C:\allinkl-testserver` (Apache/PHP/MariaDB) bereit; er ist für diesen Plan nicht eingeplant und darf, wenn der Nutzer es wünscht, als zusätzliche Vorprüfung genutzt werden.
- **Git-Strategie:** Branch pro Phase (`phase-1-accordion-grundlage`, `phase-2-accordion-editor`, `phase-3-accordion-frontend`, `phase-4-accordion-integration`), Commit pro AP mit AP-ID, Push nach jedem AP, Merge in `main` erst nach Abnahme-AP und Review der Phase. Ausgangszustand: Branch `main`, Arbeitsverzeichnis sauber, letzter Commit `f6826a5`.
- **Remote-Repository:** `https://github.com/Cyric25/modular-blocks-plugin.git` (bereits als `origin` verbunden – kein Setup-AP nötig, nur Verifikation in AP-1.1).

### Deploy-Gate D (Standardprozedur, in mehreren APs referenziert)

Immer vollständig und in dieser Reihenfolge ausführen. Alle Befehle im Bash-Tool (nicht PowerShell), Arbeitsverzeichnis `Plugins/Eigene WP Blocks`:

```bash
# D1 – PHP-Syntaxcheck (Kern + die beiden neuen render.php)
for file in *.php includes/*.php blocks/accordion/render.php blocks/accordion-row/render.php; do
  [ -f "$file" ] || continue
  php -l "$file" || exit 1
done

# D2 – Lint nur der neuen Blöcke (verhindert Fehlschlag durch Altlasten in anderen Blöcken)
npx wp-scripts lint-js blocks/accordion blocks/accordion-row
npx wp-scripts lint-style "blocks/accordion/*.css" "blocks/accordion-row/*.css"

# D3 – Build
npm run build

# D4 – Block-ZIPs erzeugen
npm run block-zips
```

**D5 – Auslieferung (macht der Nutzer, nicht der Agent):**
1. In WordPress: Einstellungen → Modulare Blöcke → „Block hochladen"
2. **Zuerst** `plugin-zips/accordion-row.zip`, **danach** `plugin-zips/accordion.zip`
3. Danach im selben Admin-Bereich „Cache leeren" klicken
4. **Nur diese zwei ZIPs hochladen.** `npm run block-zips` erzeugt ZIPs für *alle* Blöcke; alle anderen bleiben unangetastet.

Schlägt D1–D4 fehl, ist das AP blockiert (Status ✗) – nicht mit dem Upload weitermachen.

## 4. Architekturentscheidungen

Diese Entscheidungen sind mit dem Nutzer abgestimmt und werden vom ausführenden Agenten nicht neu bewertet.

| Entscheidung | Begründung | Verworfene Alternative |
|---|---|---|
| Eltern-/Kind-Blockpaar in zwei eigenen Ordnern: `blocks/accordion/` (`modular-blocks/accordion`) und `blocks/accordion-row/` (`modular-blocks/accordion-row`) | Ein Block kann nur eine InnerBlocks-Zone haben, wir brauchen aber eine pro Zeile. WordPress-Standardmuster (analog `core/columns` + `core/column`). Eigene Ordner passen zur automatischen Discovery des Plugins und erlauben serverseitiges Rendering pro Zeile. | Kind-Block nur clientseitig in der `index.js` des Eltern registrieren: spart ein ZIP, verhindert aber `render.php` für Zeilen; Markup und ARIA würden in `save()` einfrieren und bei jeder Änderung Block-Validierungsfehler erzeugen. |
| `save()` gibt in beiden Blöcken **nur** `<InnerBlocks.Content />` im `useBlockProps.save()`-Wrapper zurück; sämtliches sichtbares Markup entsteht in `render.php` | Der in der Datenbank gespeicherte Markup-Anteil bleibt minimal und stabil. Spätere Markup-Änderungen (Struktur, ARIA, Klassen) betreffen nur PHP und erzeugen keine „Block enthält unerwarteten Inhalt"-Fehler in bestehenden Seiten. | Statisches `save()` mit vollständigem Markup: bei jeder Markup-Änderung wären `deprecated`-Migrationen nötig. |
| Optionen des Eltern-Blocks werden als `data-*`-Attribute am Eltern-Wrapper ausgegeben; `view.js` liest sie über `element.closest()` | Kein serverseitig eingebettetes JSON, keine globalen JS-Variablen, funktioniert bei beliebig vielen Accordions pro Seite und auch verschachtelt in CDB-Containern. | Inline-`<script>` mit Konfigurationsobjekt je Instanz: kollidiert mit der Script-Isolation des CDB-Designers und bläht das Markup auf. |
| Nummerierung per CSS-Counter (`counter-reset` am Eltern, `counter-increment` + `::before` am Zeilen-Header) | Bleibt beim Umsortieren der Zeilen im Editor automatisch korrekt, ohne dass der Eltern-Block Indizes an Kinder durchreichen muss. | PHP-Index beim Rendern: der Eltern-Block rendert Kinder nicht selbst (er bekommt nur fertiges HTML in `$block_content`), eine Indexübergabe wäre nur über HTML-Manipulation oder Block-Context machbar. |
| Deep-Linking über `supports.anchor: true` am Kind-Block (WordPress-Feld „HTML-Anker" im Reiter „Erweitert") | Bordmittel, Redakteure kennen das Feld, keine eigene ID-Verwaltung nötig. | Eigenes Attribut `rowId` mit selbstgebauter Slug-Erzeugung: mehr Code, doppelte Semantik zu einem vorhandenen WP-Feature. |
| ARIA-Verdrahtung serverseitig in `blocks/accordion-row/render.php` mit IDs aus `wp_unique_id()`, Header als echtes `<button>` | Tastaturbedienung (Enter/Leertaste), Fokusreihenfolge und Screenreader-Ankündigung funktionieren dadurch schon ohne JavaScript; `view.js` schaltet nur Zustände um. | `<div role="button">` + eigene Key-Handler: mehr Code, mehr Fehlerquellen. |
| Panel-Animation über gemessene `scrollHeight` in `view.js`, abgeschaltet bei `prefers-reduced-motion` | Funktioniert mit beliebig hohem InnerBlocks-Inhalt und in älteren Browsern; keine Abhängigkeit von `grid-template-rows: 0fr`-Support. | Reine CSS-Transition auf `max-height` mit fixem Grenzwert: schneidet lange Inhalte ab oder erzeugt ruckelige Animationen. |
| Im Editor klappt eine Zeile auf, sobald sie selektiert ist oder einen selektierten Innenblock enthält (`useSelect` + `hasSelectedInnerBlock`), zusätzlich manueller Chevron-Toggle; **im Editor bewusst nicht exklusiv** | Redakteure müssen mehrere Zeilen nebeneinander bearbeiten und vergleichen können; exklusives Zuklappen während des Schreibens wäre störend. | Exklusives Verhalten auch im Editor: erschwert das Bearbeiten ohne Mehrwert. |
| Keine eigenen „Zeile hinzufügen/entfernen"-Routinen | Der Standard-InnerBlocks-Appender plus WordPress-Blockwerkzeuge (Verschieben, Duplizieren, Löschen) leisten das bereits. Ersetzt das Handmuster aus `blocks/multiple-choice/index.js:82-100`. | Eigene Add/Remove-Buttons wie in `multiple-choice`: doppelte Funktionalität, mehr Code. |

## 5. Risiken & Rollback

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme / Rollback |
|---|---|---|---|
| Beim Upload wird nur eines der beiden ZIPs eingespielt → Accordion ist still kaputt (Eltern ohne registrierten Kind-Block zeigt im Editor „Block enthält ungültigen Inhalt") | hoch | hoch | Deploy-Gate D5 schreibt Reihenfolge vor (erst `accordion-row.zip`, dann `accordion.zip`). `blocks/accordion/render.php` gibt bei leerem `$block_content` einen Hinweis für angemeldete Redakteure aus (AP-1.2). Doku-Warnung in AP-4.3. |
| `accordion-row` erscheint in der Admin-Liste (Einstellungen → Modulare Blöcke) und wird dort versehentlich deaktiviert | mittel | hoch | Blockbeschreibung in `block.json` beginnt mit dem Hinweis, dass der Block Teil des Accordions ist und nicht deaktiviert werden darf (AP-1.3); zusätzlich Warnhinweis in `CLAUDE.md` (AP-4.3). Rollback: Block in der Admin-Liste wieder aktivieren. |
| Neuer Block erscheint nach dem Upload nicht, weil der Discovery-Transient `modular_blocks_dir_cache` (12 h Laufzeit) noch alt ist | mittel | mittel | Der Upload-Handler invalidiert den Cache automatisch (`includes/class-admin-manager.php:870`). Bei manuellem Kopieren des Ordners: „Cache leeren"-Button im Admin. Steht in Deploy-Gate D5 und in der Abnahme-Checkliste. |
| `npm run build` + `npm run block-zips` erzeugen ZIPs für alle 15 Blöcke; versehentlich werden auch bestehende Blöcke hochgeladen | mittel | mittel | Deploy-Gate D5 nennt ausdrücklich nur die zwei neuen ZIPs. AP-4.1 prüft per `git status` / `git diff --stat` gegen `main`, dass kein bestehender Block verändert wurde. |
| Block-Validierungsfehler in bereits gespeicherten Seiten nach späteren Markup-Änderungen | niedrig | hoch | Architekturentscheidung: minimales `save()`, alles Sichtbare in `render.php`. Zusätzlich in beiden `index.js` ein leeres `deprecated: []`-Array mit Kommentar als vorbereiteter Migrationspunkt (AP-1.2, AP-1.3). |
| `view.js` wird nicht geladen, wenn das Accordion in einem CDB-Container-Block verschachtelt ist | niedrig | hoch | AP-4.1 prüft genau diesen Fall explizit (Netzwerk-Tab: `view.js` wird geladen; Funktionstest im Container). Fällt es aus, wird ein Korrektur-AP angelegt; Notlösung wäre eine Registrierung des View-Scripts analog `interactive-data-chart` in `includes/class-block-manager.php:188-203` – diese Änderung an der Kerninfrastruktur bedarf ausdrücklicher Nutzerfreigabe (Nicht-Ziel). |
| Lint-Gate schlägt wegen bestehender Verstöße in anderen Blöcken fehl und blockiert das AP | mittel | niedrig | Deploy-Gate D2 lintet gezielt nur `blocks/accordion` und `blocks/accordion-row`. |
| Barrierefreiheit bleibt Nebensache (Tastatur, Fokus, Kontrast, Bewegungsreduktion) | mittel | mittel | Eigene, messbare Akzeptanzkriterien in AP-3.1 (echtes `<button>`, ARIA), AP-3.3 (Fokus-Styles, Kontrast, `prefers-reduced-motion`, Druckausgabe) und in der Abnahme-Checkliste AP-3.4. |
| Screenshot-/PDF-Export eines CDB-Containers zeigt geschlossene Accordion-Inhalte nicht | hoch | niedrig | Bewusst nicht gelöst (Nicht-Ziel); wird in AP-4.3 als bekannte Einschränkung dokumentiert, inkl. Empfehlung „vor dem Export alle Zeilen öffnen". |

**Generelle Rollback-Strategie:** Jede Phase arbeitet in eigenem Branch; `main` bleibt bis zum Phasen-Merge unberührt und ist jederzeit der funktionierende Rückkehrpunkt (`git checkout main`). Auf der WordPress-Seite gilt: Ein fehlerhafter Block wird über Einstellungen → Modulare Blöcke deaktiviert oder gelöscht; die bestehenden 13 Blöcke sind davon nicht betroffen, weil pro Block ein eigener Ordner ausgeliefert wird. Vor dem ersten Upload auf der Live-Seite empfiehlt sich ein Datenbank-Backup, da neue Blöcke in Seiteninhalten gespeichert werden (kein Schema-Eingriff, nur Inhalt).

## 6. Phasenübersicht

Jede Phase endet mit `AP-<N>.rev` (unabhängiges Review) und `AP-<N>.doc` (Dokumentation) – in dieser Reihenfolge nach den Implementierungs- und Abnahme-APs.

| Phase | Ziel | Lauffähiger Endzustand | APs |
|---|---|---|---|
| 1 | Grundlage & Registrierung: Datei-Map anlegen, beide Blöcke registriert, Grundmarkup steht | Beide Blöcke sind im Editor auffindbar; der Eltern-Block akzeptiert ausschließlich Accordion-Zeilen; eine Seite mit Accordion speichert und rendert im Frontend Zeilentitel plus Zeileninhalt – **alle Zeilen dauerhaft offen, noch keine Interaktivität** | AP-1.1, AP-1.2, AP-1.3, AP-1.4, AP-1.rev, AP-1.doc |
| 2 | Editor-Erlebnis: Optionen und komfortable Bearbeitung | Redakteure können im Inspector alle vier Optionen setzen; Zeilen klappen im Editor beim Bearbeiten auf und lassen sich per Chevron manuell auf-/zuklappen; die Optionen erscheinen als `data-*`-Attribute im Frontend-Markup (noch ohne Wirkung) | AP-2.1, AP-2.2, AP-2.3, AP-2.rev, AP-2.doc |
| 3 | Frontend-Verhalten & Gestaltung | Vollständige Funktion im Frontend: exklusives Öffnen, umschaltbarer Mehrfachmodus, erste Zeile offen, Nummerierung, Alle öffnen/schließen, Deep-Linking per `#anker`, Animation mit Bewegungsreduktion, Theme-Farben, Tastaturbedienung | AP-3.1, AP-3.2, AP-3.3, AP-3.4, AP-3.rev, AP-3.doc |
| 4 | Integration, Regression, Auslieferung & Doku-Fortschreibung | Accordion funktioniert nachweislich auch in einem CDB-Container-Block; kein bestehender Block wurde verändert; Muster und Betriebswissen sind in `BLOCK-DEVELOPMENT.md` und beiden `CLAUDE.md` dokumentiert; alles ist in `main` gemergt und gepusht | AP-4.1, AP-4.2, AP-4.3, AP-4.4, AP-4.rev, AP-4.doc |

## 7. Arbeitspakete

### Phase 1: Grundlage & Registrierung

---

### AP-1.1: Versionierung verifizieren und Datei-Map des Plugins anlegen

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** keine

**Ziel & Kontext:**
Das Plugin *Eigene WP Blocks* hat bisher keine `reference_file_map.md`; die einzige Übersichtsdatei im Projekt (`DOKUMENTATION.md` im übergeordneten Website-Verzeichnis) verweist nur auf andere Dokumente. Bevor neue Dateien entstehen, wird der Ist-Zustand als Datei-Map festgehalten – sie ist ab jetzt das Navigationsdokument, das jedes weitere AP dieses Plans mitpflegt. Zusätzlich wird der Git-Ausgangszustand verifiziert und der Phasen-Branch angelegt.

Umfang der Datei-Map bewusst begrenzt auf: Plugin-Hauptdatei, `includes/`, Build-/ZIP-Skripte, `assets/`, und **eine Zeile pro Block-Ordner** unter `blocks/` (nicht eine Zeile pro Datei innerhalb eines Blocks – das würde die Map unlesbar machen).

**Betroffene Dateien:**
- `reference_file_map.md` (neu, im Plugin-Verzeichnis `Plugins/Eigene WP Blocks/`)
- `../../DOKUMENTATION.md` (ändern – eine Zeile ergänzen, die auf die neue Datei-Map verweist; Datei liegt im Website-Wurzelverzeichnis)

**Vorgehen:**
1. Git-Zustand prüfen: `git remote -v` muss `origin https://github.com/Cyric25/modular-blocks-plugin.git` zeigen, `git status --porcelain` muss leer sein. Weicht etwas ab, AP stoppen und in der Übergabenotiz melden.
2. Phasen-Branch anlegen: `git checkout -b phase-1-accordion-grundlage`.
3. `reference_file_map.md` mit Kopf `# Datei-Map: Modulare Blöcke Plugin (Eigene WP Blocks)` und `_Stand: <heutiges Datum>_` erstellen.
4. Tabelle mit den Spalten `| Datei | Zweck | Wichtige Funktionen/Inhalte | Hängt ab von |` anlegen und mindestens folgende Einträge füllen (Inhalte durch Lesen der Dateien ermitteln, nicht raten): `modular-blocks-plugin.php`, `includes/class-block-manager.php`, `includes/class-admin-manager.php`, `includes/class-chemviz-enqueue.php`, `includes/class-chemviz-shortcodes.php`, `webpack.config.js`, `create-block-zips.js`, `create-empty-plugin-zip.js`, `package.json`, `assets/js/vendor/` (Sammelzeile), `assets/js/chart-templates.js`, `assets/structures/` (Sammelzeile), `build/` (Sammelzeile: generiert, nicht manuell bearbeiten), `plugin-zips/` (Sammelzeile: Ausgabeartefakte).
5. Zweite Tabelle `## Blöcke` mit einer Zeile pro Ordner unter `blocks/` (13 Blöcke): Spalten `| Block-Ordner | Blockname | Zweck | Dateien |`. Blockname und Zweck aus dem jeweiligen `block.json` (`name`, `description`) übernehmen, Dateien als Kurzliste (z. B. `block.json, index.js, render.php, view.js, style.css, editor.css`).
6. Abschnitt `## Pflegeregel` ergänzen: Jedes AP, das eine Datei anlegt oder wesentlich ändert, aktualisiert deren Zeile.
7. In `../../DOKUMENTATION.md` unter „Architektur-/Arbeitsdoku je Komponente" eine Zeile ergänzen: Verweis auf `Plugins/Eigene WP Blocks/reference_file_map.md` als Datei-Map des Plugins.
8. Commit `AP-1.1: Datei-Map des Plugins angelegt` und `git push -u origin phase-1-accordion-grundlage`.

**Akzeptanzkriterien:**
- [ ] `reference_file_map.md` existiert im Plugin-Verzeichnis und enthält beide Tabellen.
- [ ] Alle 13 Ordner unter `blocks/` haben je eine Zeile in der Block-Tabelle; die Blocknamen stimmen wörtlich mit dem Feld `name` im jeweiligen `block.json` überein.
- [ ] Jede der in Schritt 4 genannten Kerndateien hat eine Zeile mit ausgefülltem Zweck.
- [ ] `../../DOKUMENTATION.md` verweist auf die neue Datei-Map.
- [ ] Branch `phase-1-accordion-grundlage` existiert lokal und auf `origin`; Commit trägt die AP-ID im Text.

**Tests:**
- Smoke-Test: `git log --oneline -n 1` zeigt den AP-1.1-Commit; `git status --porcelain` ist danach leer.
- Stichprobe 1: Zeile zu `includes/class-block-manager.php` mit der Datei vergleichen – die genannten Funktionen (`register_blocks()`, `scan_block_directories()`, `render_dynamic_block()`) müssen dort tatsächlich existieren.
- Stichprobe 2: Zeile zum Block `summary-block` gegen `blocks/summary-block/block.json` prüfen – Blockname `modular-blocks/summary-block` muss übereinstimmen.
- Zählprüfung: `ls blocks/ | wc -l` ergibt 13; die Block-Tabelle hat genau 13 Datenzeilen.

**Übergabenotiz:**
Erledigt 2026-08-03, Commit `4898b13`. Git-Ausgangszustand verifiziert (`origin` korrekt, `main` sauber, letzter Commit `f6826a5`), Branch `phase-1-accordion-grundlage` angelegt und gepusht. `reference_file_map.md` neu mit zwei Tabellen: 24 Kern-/Infrastrukturzeilen und 13 Blockzeilen (Zählprüfung 13/13 bestanden). Stichproben bestanden: `register_blocks()`/`scan_block_directories()`/`render_dynamic_block()` existieren in `includes/class-block-manager.php` (Zeilen 57, 77, 315); Blockname `modular-blocks/summary-block` stimmt.

Drei Abweichungen zur AP-Beschreibung, alle bewusst:
1. `git status --porcelain` war nicht leer, sondern zeigte die untracked Plandatei `PLAN-accordion-block.md`. Da sie das Ausgangsdokument dieses Vorhabens ist, wurde sie in denselben Commit aufgenommen statt das AP zu blockieren.
2. Beim Erheben des Ist-Zustands zeigte sich, dass das Plugin mehr Kernklassen enthält als `CLAUDE.md` dokumentiert: `class-diagnostics.php`, `class-webapp-manager.php`, `class-iframe-whitelist-manager.php` sind in der Datei-Map erfasst, fehlen aber in `CLAUDE.md`. **Für AP-4.3 relevant** – dort prüfen, ob das ergänzt werden soll (nicht Teil dieses Plans, deshalb nur notiert).
3. `../../DOKUMENTATION.md` liegt im Website-Wurzelverzeichnis, das **kein** Git-Repository ist. Die dort ergänzte Verweiszeile ist daher nicht versioniert – erwartetes Verhalten, kein Fehler.

---

### AP-1.2: Eltern-Block `accordion` anlegen (Registrierung + Grundstruktur)

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-1.1 (Branch und Datei-Map stehen)

**Ziel & Kontext:**
Der Eltern-Block `modular-blocks/accordion` ist der Container für die einzelnen Accordion-Zeilen. In diesem AP entsteht er als registrierbarer, im Editor einfügbarer Block mit InnerBlocks-Zone, die ausschließlich `modular-blocks/accordion-row` erlaubt (dieser Kind-Block entsteht parallel in AP-1.3; die Referenz erfolgt über den Namens-String, deshalb sind die beiden APs unabhängig voneinander umsetzbar). Optionen und Frontend-Verhalten kommen erst in Phase 2 und 3 – hier geht es um Registrierung, Speicherformat und Grundmarkup.

Referenzmuster für Dateiaufbau und `block.json`-Felder: `blocks/summary-block/block.json` und `blocks/multiple-choice/index.js` (Imports, Registrierungsstil). Kein bestehender Block des Plugins nutzt InnerBlocks – dieses AP etabliert das Muster.

**Betroffene Dateien:**
- `blocks/accordion/block.json` (neu)
- `blocks/accordion/index.js` (neu)
- `blocks/accordion/render.php` (neu)
- `blocks/accordion/view.js` (neu – in diesem AP nur leere IIFE als Platzhalter, Logik folgt in AP-3.2)
- `blocks/accordion/style.css` (neu)
- `blocks/accordion/editor.css` (neu)
- `reference_file_map.md` (ändern – neue Zeilen)

**Vorgehen:**
1. `blocks/accordion/block.json` anlegen mit:
   - `"apiVersion": 3`, `"name": "modular-blocks/accordion"`, `"version": "1.0.0"`
   - `"title": "Accordion – Aufklappbare Zeilen"`, `"category": "modular-blocks"`, `"icon": "excerpt-view"`
   - `"description"`: Kurzbeschreibung auf Deutsch, die erwähnt, dass Zeilen beliebige Blöcke aufnehmen und standardmäßig nur eine Zeile geöffnet ist.
   - `"keywords": ["accordion", "aufklappen", "zusammenklappen", "faq", "toggle"]`
   - `"textdomain": "modular-blocks-plugin"`
   - `"editorScript": "file:./index.js"`, `"editorStyle": "file:./index.css"`, `"style": "file:./style-index.css"`, `"viewScript": "file:./view.js"`
   - `"attributes"`: vorerst leeres Objekt `{}` (die vier Optionen kommen in AP-2.1)
   - `"supports": { "html": false, "anchor": false, "align": ["wide", "full"], "spacing": { "margin": true, "padding": true } }`
   - **Wichtig:** `viewScript` bereits hier eintragen, obwohl `view.js` erst in AP-3.2 Inhalt bekommt – in diesem AP eine `blocks/accordion/view.js` mit leerer IIFE anlegen, damit Webpack den Entry erzeugt und `block.json` nicht auf eine fehlende Datei zeigt.
2. `blocks/accordion/view.js` als Platzhalter anlegen: IIFE mit `'use strict';` und einem Kommentar, dass die Logik in AP-3.2 folgt.
3. `blocks/accordion/index.js` anlegen:
   - Imports: `registerBlockType` aus `@wordpress/blocks`; `useBlockProps`, `InnerBlocks` aus `@wordpress/block-editor`; `__` aus `@wordpress/i18n`; danach `import './editor.css';` und `import './style.css';` (beide Importe sind zwingend, sonst erzeugt Webpack `index.css` bzw. `style-index.css` nicht).
   - `edit`: Wrapper über `useBlockProps({ className: 'mb-accordion' })`, darin `<InnerBlocks allowedBlocks={['modular-blocks/accordion-row']} template={[['modular-blocks/accordion-row'], ['modular-blocks/accordion-row'], ['modular-blocks/accordion-row']]} templateLock={false} orientation="vertical" renderAppender={InnerBlocks.ButtonBlockAppender} />`.
   - `save`: `<div {...useBlockProps.save()}><InnerBlocks.Content /></div>` – nichts weiter.
   - `deprecated: []` mit Kommentar: „Bewusst leer. Sichtbares Markup entsteht in render.php; ändert sich künftig das save()-Markup, hier eine Migration ergänzen."
4. `blocks/accordion/render.php` anlegen:
   - `if (!defined('ABSPATH')) { exit; }`
   - Doc-Kommentar mit `@var array $block_attributes`, `@var string $block_content`, `@var WP_Block $block_object`.
   - Wrapper über `get_block_wrapper_attributes(['class' => 'mb-accordion'])` ausgeben.
   - `$block_content` **unverändert** ausgeben (kein `esc_*`, kein `wp_kses_post` – es ist bereits gerendertes Block-HTML).
   - Ist `trim($block_content)` leer: statt des Wrappers einen Hinweis per `echo` ausgeben, aber **nur für Nutzer mit `current_user_can('edit_posts')`**; für alle anderen nichts ausgeben. Text (übersetzt): „Accordion: Es sind keine Zeilen vorhanden oder der Block ‚Accordion-Zeile' ist nicht aktiviert." Grund: fehlt der Kind-Block, soll der Redakteur die Ursache sehen, Besucher aber keinen Fehlertext.
5. `blocks/accordion/style.css` anlegen: nur Grundgerüst (Block-Wrapper mit `margin`, `border`-Rahmen um die Zeilenliste). Vollständige Gestaltung folgt in AP-3.3. Datei darf nicht leer sein (Webpack erzeugt sonst keine `style-index.css`) – mindestens eine echte Regel für `.mb-accordion`.
6. `blocks/accordion/editor.css` anlegen: mindestens eine Regel, die den Block im Editor erkennbar macht (z. B. gestrichelter Rahmen um die leere InnerBlocks-Zone).
7. `npm run build` ausführen und prüfen, dass `build/blocks/accordion/` die Dateien `index.js`, `view.js`, `index.css`, `style-index.css` enthält.
8. Zeilen für die fünf neuen Dateien in `reference_file_map.md` ergänzen (Block-Tabelle + ggf. Dateitabelle).
9. Commit `AP-1.2: Eltern-Block accordion angelegt` und Push auf `phase-1-accordion-grundlage`.

**Akzeptanzkriterien:**
- [ ] `php -l blocks/accordion/render.php` meldet „No syntax errors detected".
- [ ] `npm run build` läuft ohne Fehler; `build/blocks/accordion/` enthält `index.js`, `view.js`, `index.css`, `style-index.css`.
- [ ] `blocks/accordion/block.json` ist valides JSON (`node -e "JSON.parse(require('fs').readFileSync('blocks/accordion/block.json','utf8'))"` läuft fehlerfrei) und enthält `"style": "file:./style-index.css"` sowie `"editorStyle": "file:./index.css"`.
- [ ] `save()` in `index.js` enthält ausschließlich den Wrapper und `<InnerBlocks.Content />` – keinen Titel, keine Buttons, kein Panel-Markup.
- [ ] `render.php` gibt `$block_content` ohne Escaping aus und den Leer-Hinweis nur innerhalb einer `current_user_can('edit_posts')`-Prüfung.
- [ ] `npx wp-scripts lint-js blocks/accordion` und `npx wp-scripts lint-style "blocks/accordion/*.css"` laufen ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build` bricht nicht ab, und `ls build/blocks/accordion` listet die vier erwarteten Dateien.
- Syntaxtest: `php -l blocks/accordion/render.php`.
- Statische Prüfung: In `index.js` per Textsuche bestätigen, dass `allowedBlocks` genau `['modular-blocks/accordion-row']` enthält und `templateLock` auf `false` steht.
- Funktionale Prüfung im Editor erfolgt gebündelt im Abnahme-AP-1.4 (erfordert Upload) – hier nicht behaupten, sie sei erfolgt.

**Übergabenotiz:**
Erledigt 2026-08-03, Commit `c993993`, ausgeführt von einem Subagenten (Sonnet), geprüft vom Orchestrator. Sechs Dateien in `blocks/accordion/` angelegt: `block.json` (25 Z.), `index.js` (55 Z.), `render.php` (31 Z.), `view.js` (6 Z., Platzhalter-IIFE), `style.css` (10 Z.), `editor.css` (9 Z.).

**Planabweichung (wichtig für alle Folge-APs):** `save()` gibt **ohne** `useBlockProps.save()`-Wrapper nur `<InnerBlocks.Content />` zurück – abweichend vom ursprünglichen AP-Text. Grund: Bei dynamischen Blöcken mit InnerBlocks wird das `save()`-Markup als `$block_content` an `render.php` übergeben; ein `save()`-Wrapper hätte pro Block einen zweiten, von PHP nicht kontrollierten Wrapper erzeugt. Siehe Abschnitt 11, Änderung 1.

Umsetzungsdetails: `ALLOWED_BLOCKS`/`TEMPLATE` als Modulkonstanten; `renderAppender={InnerBlocks.ButtonBlockAppender}`; `deprecated: []` mit erklärendem Kommentar. Leerer Zustand gibt den Redakteurs-Hinweis innerhalb von `current_user_can('edit_posts')` aus und beendet mit `return;` ohne Wrapper.

Nachbesserung nach Orchestrator-Review: unbenutzter `__`-Import aus `@wordpress/i18n` entfernt (kommt in AP-2.1 mit den Inspector-Labels zurück). Kein `example`-Feld in `block.json` gesetzt, weil `attributes` in dieser Phase leer ist – kann später ergänzt werden.

Tests: `php -l` ohne Fehler, `block.json` valides JSON, `build/blocks/accordion/` enthält `index.js`, `view.js`, `index.css`, `style-index.css` (plus RTL-Varianten und `*.asset.php` aus dem Standard-Build). Kein `var(--` in den Dateien.

---

### AP-1.3: Kind-Block `accordion-row` anlegen (Registrierung + Grundmarkup)

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-1.1 (Branch und Datei-Map stehen). Unabhängig von AP-1.2 – andere Dateien, Verbindung nur über Namens-Strings; parallele Ausführung erlaubt.

**Ziel & Kontext:**
Der Kind-Block `modular-blocks/accordion-row` ist eine einzelne Accordion-Zeile: ein anklickbarer Kopf mit Titel und ein Panel, das über InnerBlocks beliebige WordPress-Blöcke aufnimmt. Er ist über `parent` fest an `modular-blocks/accordion` gebunden und erscheint deshalb nicht in der allgemeinen Blockauswahl.

In dieser Phase rendert die Zeile **semantisch korrektes, aber statisch geöffnetes** Markup: Der Kopf ist ein echtes `<button>`, das Panel ist sichtbar. So ist der Inhalt schon ohne JavaScript erreichbar. Das Zuklappen, die Theme-Farben und die Animation folgen in AP-3.1 bis AP-3.3.

**Betroffene Dateien:**
- `blocks/accordion-row/block.json` (neu)
- `blocks/accordion-row/index.js` (neu)
- `blocks/accordion-row/render.php` (neu)
- `blocks/accordion-row/style.css` (neu)
- `blocks/accordion-row/editor.css` (neu)
- `reference_file_map.md` (ändern – neue Zeilen)

**Vorgehen:**
1. `blocks/accordion-row/block.json` anlegen mit:
   - `"apiVersion": 3`, `"name": "modular-blocks/accordion-row"`, `"version": "1.0.0"`
   - `"title": "Accordion-Zeile"`, `"category": "modular-blocks"`, `"icon": "editor-justify"`
   - `"description"`: Muss mit dem Hinweis beginnen, dass dieser Block Teil des Blocks „Accordion" ist und **nicht deaktiviert werden darf**, weil sonst alle Accordions unbrauchbar werden. (Diese Beschreibung erscheint in der Adminliste unter Einstellungen → Modulare Blöcke.)
   - `"parent": ["modular-blocks/accordion"]`
   - `"textdomain": "modular-blocks-plugin"`
   - `"editorScript": "file:./index.js"`, `"editorStyle": "file:./index.css"`, `"style": "file:./style-index.css"` (kein `viewScript` – die Frontend-Logik liegt beim Eltern-Block)
   - `"attributes": { "title": { "type": "string", "default": "" } }`
   - `"supports": { "html": false, "anchor": true, "reusable": false, "spacing": { "margin": false, "padding": false } }`
2. `blocks/accordion-row/index.js` anlegen:
   - Imports: `registerBlockType`; `useBlockProps`, `InnerBlocks`, `RichText` aus `@wordpress/block-editor`; `__` aus `@wordpress/i18n`; `import './editor.css';` und `import './style.css';`.
   - `edit`: Wrapper über `useBlockProps({ className: 'mb-accordion-row' })`; darin
     a) `<RichText tagName="span" className="mb-accordion-row__title-input" value={attributes.title} onChange={(title) => setAttributes({ title })} placeholder={__('Titel der Zeile …', 'modular-blocks-plugin')} allowedFormats={['core/bold', 'core/italic']} />`
     b) ein Panel-`div` mit `<InnerBlocks templateLock={false} />` (keine `allowedBlocks`-Einschränkung – Zeilen nehmen bewusst beliebige Blöcke auf).
   - `save`: `<div {...useBlockProps.save()}><InnerBlocks.Content /></div>` – der Titel wird **nicht** in `save()` ausgegeben, er lebt als Attribut und wird in `render.php` gerendert.
   - `deprecated: []` mit demselben erklärenden Kommentar wie im Eltern-Block.
3. `blocks/accordion-row/render.php` anlegen:
   - `if (!defined('ABSPATH')) { exit; }` und Doc-Kommentar mit den drei verfügbaren Variablen.
   - `$title = $block_attributes['title'] ?? '';` – Ausgabe über `wp_kses_post()` (erlaubt die Inline-Formate aus RichText). Ist der Titel leer, Fallback-Text `__('Ohne Titel', 'modular-blocks-plugin')` verwenden, damit der Button niemals leer und damit unklickbar/unbeschriftet ist.
   - Zwei IDs erzeugen: `$header_id = wp_unique_id('mb-accordion-header-');` und `$panel_id = wp_unique_id('mb-accordion-panel-');`.
   - Wrapper über `get_block_wrapper_attributes(['class' => 'mb-accordion-row'])`.
   - Darin:
     - `<button type="button" class="mb-accordion-row__header" id="<header_id>" aria-expanded="true" aria-controls="<panel_id>"><span class="mb-accordion-row__title"><?php echo wp_kses_post($title); ?></span><span class="mb-accordion-row__icon" aria-hidden="true"></span></button>`
     - `<div class="mb-accordion-row__panel" id="<panel_id>" role="region" aria-labelledby="<header_id>">` + `$block_content` unverändert + `</div>`
   - **Anker-Prüfung (wichtig):** Der Kind-Block hat `supports.anchor: true`; der Redakteur trägt den Anker im Editor unter „Erweitert → HTML-Anker" ein. Verifiziere empirisch, ob der Anker automatisch als `id` am Wrapper landet (Seitenquelltext ansehen). Falls **nicht**, den Anker explizit setzen: `$anchor = $block_attributes['anchor'] ?? '';` und bei nicht-leerem Wert `get_block_wrapper_attributes(['class' => 'mb-accordion-row', 'id' => sanitize_html_class($anchor)])` verwenden. Das Ergebnis dieser Prüfung in der Übergabenotiz festhalten – AP-3.2 (Deep-Linking) baut darauf auf. Doppelte `id`-Attribute am selben Element sind in jedem Fall zu vermeiden.
   - Ist `trim($block_content)` leer, das Panel trotzdem rendern (leere Zeilen sind erlaubt), aber keinen Hinweistext ausgeben.
4. `blocks/accordion-row/style.css` und `editor.css` anlegen: Grundgerüst (Zeile als Block, Kopf als volle Breite, Panel mit Innenabstand). Beide Dateien mit mindestens einer echten Regel füllen. Vollständige Gestaltung in AP-3.3.
5. `npm run build` ausführen; `build/blocks/accordion-row/` muss `index.js`, `index.css`, `style-index.css` enthalten (keine `view.js` – korrekt, dieser Block hat keine).
6. Zeilen für die fünf neuen Dateien in `reference_file_map.md` ergänzen.
7. Commit `AP-1.3: Kind-Block accordion-row angelegt` und Push.

**Akzeptanzkriterien:**
- [ ] `php -l blocks/accordion-row/render.php` meldet „No syntax errors detected".
- [ ] `blocks/accordion-row/block.json` ist valides JSON, enthält `"parent": ["modular-blocks/accordion"]`, `"anchor": true` und **kein** `viewScript`.
- [ ] Die `description` in `block.json` beginnt mit dem Hinweis, dass der Block nicht deaktiviert werden darf.
- [ ] `render.php` erzeugt Kopf und Panel mit verknüpften IDs: `aria-controls` des Buttons entspricht der `id` des Panels, `aria-labelledby` des Panels entspricht der `id` des Buttons; beide IDs stammen aus `wp_unique_id()`.
- [ ] Der Kopf ist ein `<button type="button">` (kein `<div>`, kein `<a>`).
- [ ] `$block_content` wird ohne Escaping ausgegeben; `$title` ausschließlich über `wp_kses_post()`.
- [ ] `save()` enthält ausschließlich Wrapper und `<InnerBlocks.Content />`.
- [ ] `npm run build` erzeugt `build/blocks/accordion-row/index.js`, `index.css`, `style-index.css`.
- [ ] `npx wp-scripts lint-js blocks/accordion-row` und `npx wp-scripts lint-style "blocks/accordion-row/*.css"` laufen ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build` läuft durch; `ls build/blocks/accordion-row` zeigt die drei erwarteten Dateien.
- Syntaxtest: `php -l blocks/accordion-row/render.php`.
- Statische Prüfung: In `render.php` per Textsuche bestätigen, dass genau ein `aria-expanded`, ein `aria-controls` und ein `aria-labelledby` vorkommen und dass `wp_unique_id` zweimal aufgerufen wird.
- Funktionale Prüfung im Editor erfolgt in AP-1.4.

**Übergabenotiz:**
Erledigt 2026-08-03, Commit `4c8718d`, ausgeführt von einem Subagenten (Sonnet) parallel zu AP-1.2, geprüft vom Orchestrator. Fünf Dateien in `blocks/accordion-row/` angelegt: `block.json` (30 Z.), `index.js` (60 Z.), `render.php` (69 Z.), `style.css` (35 Z.), `editor.css` (34 Z.). Die Datei-Map-Ergänzung deckt beide Blöcke ab und liegt in diesem Commit.

**Anker-Frage aus dem AP-Text ist entschieden und benötigt keine empirische Prüfung mehr:** Weil `save()` keinen Wrapper erzeugt (Abschnitt 11, Änderung 1), kann WordPress den HTML-Anker nirgends selbst ausgeben. `render.php` setzt die `id` deshalb immer selbst – `$block_attributes['anchor']` wird per `sanitize_html_class()` gefiltert und nur bei nicht-leerem Wert an `get_block_wrapper_attributes(['class' => …, 'id' => …])` übergeben. Ein doppeltes `id`-Attribut ist damit strukturell ausgeschlossen. **AP-3.1 muss diesen Punkt nicht mehr klären, sondern nur beibehalten.**

Markup-Stand (Vertrag für AP-3.1/AP-3.2): Wrapper `.mb-accordion-row` → Kopf `button.mb-accordion-row__header` mit `id`, `aria-expanded="true"`, `aria-controls` → `span.mb-accordion-row__title` (Titel per `wp_kses_post()`, Fallback `Ohne Titel` bei leerem oder nur aus Tags bestehendem Titel) + `span.mb-accordion-row__icon[aria-hidden]` → Panel `div.mb-accordion-row__panel` mit `id`, `role="region"`, `aria-labelledby` und unescapedem `$block_content`. IDs aus `wp_unique_id('mb-accordion-header-')` bzw. `wp_unique_id('mb-accordion-panel-')`. In dieser Phase bewusst dauerhaft geöffnet (kein `hidden`, kein `is-closed`) – Phase 3 ergänzt genau diese drei Marker.

Nachbesserung nach Orchestrator-Review: typografisch falsches Schlusszeichen in der `description` korrigiert (`„Accordion\"` → `„Accordion“`), da dieser Text in der Adminliste erscheint.

Tests: `php -l` ohne Fehler; `block.json` valides JSON mit `parent: ["modular-blocks/accordion"]`, genau einem Attribut (`title`), `anchor: true`, ohne `viewScript`; `wp_unique_id` zweimal aufgerufen; `build/blocks/accordion-row/` enthält `index.js`, `index.css`, `style-index.css` (korrekt ohne `view.js`). Kein `var(--` in den Dateien.

---

### AP-1.4: Abnahme Phase 1 – Gates, Erst-Deploy und Editor-Grundfunktion

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-1.2, AP-1.3

**Ziel & Kontext:**
Erster Nachweis, dass beide Blöcke in einer echten WordPress-Installation registriert werden, zusammen funktionieren und Inhalte speichern. Der Agent führt die lokalen Gates aus und erzeugt die ZIPs; den Upload und die Klick-Checkliste führt der **Nutzer** durch. Das AP ist erst abgeschlossen, wenn der Nutzer das Ergebnis zurückgemeldet hat. Dieses AP ist gleichzeitig der Integrationstest der Phase 1.

**Betroffene Dateien:**
- keine Codeänderungen (nur Build-Artefakte in `build/` und `plugin-zips/`)
- `PLAN-accordion-block.md` (ändern – Testprotokoll und Status)

**Vorgehen:**
1. Deploy-Gate D vollständig ausführen (Abschnitt 3 dieses Plans, Schritte D1–D4):
   ```bash
   for file in *.php includes/*.php blocks/accordion/render.php blocks/accordion-row/render.php; do
     [ -f "$file" ] || continue
     php -l "$file" || exit 1
   done
   npx wp-scripts lint-js blocks/accordion blocks/accordion-row
   npx wp-scripts lint-style "blocks/accordion/*.css" "blocks/accordion-row/*.css"
   npm run build
   npm run block-zips
   ```
2. Bestätigen, dass `plugin-zips/accordion.zip` und `plugin-zips/accordion-row.zip` existieren und neuer als der Build-Start sind. Dateigrößen notieren.
3. Prüfen, dass `npm run block-zips` keine Validierungsfehler für andere Blöcke geworfen hat (Ausgabe enthält „All blocks validated successfully").
4. Dem Nutzer die folgende Abnahme-Checkliste vorlegen (wortgleich, damit nichts übersprungen wird) und auf die Rückmeldung warten:
   - **U1:** In WordPress Einstellungen → Modulare Blöcke → „Block hochladen": zuerst `accordion-row.zip`, dann `accordion.zip`. Danach „Cache leeren".
   - **U2:** Adminliste zeigt beide neuen Blöcke („Accordion – Aufklappbare Zeilen" und „Accordion-Zeile"), beide aktiviert.
   - **U3:** Neue Seite/Beitrag → Block „Accordion" einfügen → es erscheinen drei leere Zeilen.
   - **U4:** In Zeile 1 einen Titel eintippen, im Panel einen Absatz-Block und ein Bild einfügen. In Zeile 2 einen Titel und eine Liste einfügen.
   - **U5:** Versuchen, direkt im Accordion (nicht in einer Zeile) einen Absatz-Block einzufügen → darf nicht möglich sein; angeboten wird nur „Accordion-Zeile".
   - **U6:** Speichern, Seite neu laden im Editor → Inhalte sind unverändert vorhanden, **keine** Meldung „Dieser Block enthält unerwarteten oder ungültigen Inhalt".
   - **U7:** Seite im Frontend aufrufen → alle Zeilen sind sichtbar, Titel als Schaltflächen, Inhalte darunter sichtbar (in dieser Phase noch dauerhaft offen und ungestylt).
   - **U8:** Browser-Konsole im Frontend und im Editor: keine roten Fehler.
   - **U9:** Falls `WP_DEBUG` aktiv: `wp-content/debug.log` enthält keine neuen PHP-Notices/Warnings mit Bezug zu `accordion`.
   - **U10:** (nachträglich ergänzt, ersetzt die empirische Anker-Prüfung aus AP-1.3) In Zeile 1 unter „Erweitert → HTML-Anker" den Wert `test-zeile` eintragen, speichern, Frontend-Quelltext ansehen → das äußere `div` dieser Zeile trägt `id="test-zeile"`, und zwar genau einmal. Dieser Anker wird in Phase 3 für das Deep-Linking gebraucht.
5. Rückmeldung des Nutzers wörtlich in die Übergabenotiz und als Zeile ins Testprotokoll (Abschnitt 9) übernehmen. Bei Fehlschlag: Status ✗, Ursache dokumentieren, Korrektur-AP `AP-1.fix1` anlegen.
6. Commit `AP-1.4: Phase-1-Abnahme dokumentiert` und Push.

**Akzeptanzkriterien:**
- [ ] D1 (PHP-Syntaxcheck) ohne Fehler für alle geprüften Dateien.
- [ ] D2 (Lint der beiden neuen Blöcke) ohne Fehler.
- [ ] D3 (`npm run build`) ohne Fehler.
- [ ] D4 (`npm run block-zips`) meldet „All blocks validated successfully" und erzeugt `plugin-zips/accordion.zip` sowie `plugin-zips/accordion-row.zip`.
- [ ] Die Checkliste U1–U9 wurde vom Nutzer durchgeführt und das Ergebnis liegt schriftlich vor.
- [ ] U3, U5, U6 und U7 sind bestanden (das sind die harten Kriterien des Phasen-Endzustands).
- [ ] Testprotokoll (Abschnitt 9) enthält eine Zeile „Phase 1 abgeschlossen" mit dem Ergebnis.

**Tests:**
- Die Gates D1–D4 sind selbst der technische Test.
- Der funktionale Test ist die Checkliste U1–U10; sie wird vom Nutzer ausgeführt. Ein nicht durchgeführter Punkt gilt als nicht bestanden und darf nicht als bestanden protokolliert werden.

**Übergabenotiz:**
Stand 2026-08-03: **technischer Teil erledigt, funktionale Abnahme offen.** Status bleibt ◐, bis die Rückmeldung des Nutzers zu U1–U10 vorliegt.

Gate-Ergebnisse:
- **D1** PHP-Syntaxcheck über `*.php`, `includes/*.php` und beide neuen `render.php`: keine Fehler (PHP 8.5.1 CLI).
- **D2** Lint: **abgeschwächt zum informativen Check**, siehe Abschnitt 11, Änderung 2. Neue Blöcke: 75 `prettier/prettier`-Meldungen (Tabs statt der projektweit verwendeten 4 Leerzeichen) und 2 `react-hooks/rules-of-hooks`-Meldungen zu `useBlockProps` im `edit`-Callback. Vergleichsmessung im Bestand: `blocks/multiple-choice` 715 Fehler, `blocks/summary-block` 1258 Fehler, darunter 6× dieselbe `rules-of-hooks`-Meldung. Es tritt also keine Fehlerklasse auf, die der Bestand nicht ebenfalls aufweist.
- **D3** `npm run build`: erfolgreich (webpack 5.102.0, 3 Warnungen – ausschließlich die projektweit vorhandenen Bundle-Size-Hinweise). `build/blocks/accordion/` enthält `index.js`, `view.js`, `index.css`, `style-index.css`; `build/blocks/accordion-row/` enthält `index.js`, `index.css`, `style-index.css`.
- **D4** `npm run block-zips`: „All blocks validated successfully", 15 ZIPs erzeugt. Neu: `plugin-zips/accordion.zip` (4,01 KB) und `plugin-zips/accordion-row.zip` (5,35 KB). Inhaltskontrolle beider ZIPs: `block.json`, `render.php`, `style.css`, `editor.css` sowie die kompilierten `index.js`/`index.css`/`style-index.css` (bei `accordion` zusätzlich `view.js`) sind enthalten.

Offen (Nutzer): Upload gemäß Deploy-Gate D5 – **zuerst `accordion-row.zip`, dann `accordion.zip`**, danach „Cache leeren" – und Abarbeitung der Checkliste U1–U10.

---

### AP-1.rev: Unabhängiges Review Phase 1

**Status:** ☐ offen
**Umfang:** M
**Modell:** opus
**Abhängigkeiten:** AP-1.1, AP-1.2, AP-1.3, AP-1.4

**Ziel & Kontext:**
Unabhängige Qualitätsprüfung der Phase 1 durch einen Agenten, der an keiner Implementierung beteiligt war. Nur lesend arbeiten (Read/Grep/Glob) – **keine Datei verändern**, auch nicht diesen Plan (Befunde gehen in die Übergabenotiz, der Orchestrator überträgt sie).

**Vorgehen:**
1. Für AP-1.1 bis AP-1.4 den tatsächlichen Zustand gegen die jeweiligen Akzeptanzkriterien prüfen – im Quelltext nachsehen, nicht den Übergabenotizen glauben.
2. Phasen-Endzustand prüfen: Sind beide Blöcke registrierbar (valides `block.json`, korrekte Asset-Pfade `index.css`/`style-index.css`), enthält `save()` in beiden Blöcken ausschließlich Wrapper + `InnerBlocks.Content`, ist die ARIA-Verknüpfung in `blocks/accordion-row/render.php` konsistent?
3. Scope-Check: Wurde eine Datei außerhalb von `blocks/accordion/`, `blocks/accordion-row/`, `reference_file_map.md`, `../../DOKUMENTATION.md` und dieser Plandatei verändert? Prüfen mit `git diff --stat main...phase-1-accordion-grundlage`. Insbesondere dürfen `includes/`, `webpack.config.js`, `create-block-zips.js`, `package.json` und die 13 bestehenden Block-Ordner unverändert sein.
4. Qualitäts-/Sicherheits-Check: Escaping in beiden `render.php` (Titel über `wp_kses_post()`, `$block_content` unescaped, kein `echo` von Rohattributen), `ABSPATH`-Guard vorhanden, keine `error_log`-Debugreste, i18n-Aufrufe mit Textdomain `modular-blocks-plugin`, keine hartkodierten deutschen Strings ohne Übersetzungsfunktion in JS/PHP.
5. Konventions-Check gegen `CLAUDE.md` im Plugin-Verzeichnis: Kategorie `modular-blocks`, `apiVersion: 3`, Dateinamen, keine CSS-Variablen für Farben (in Phase 1 sollten noch gar keine Farben gesetzt sein – falls doch, prüfen, ob die Inline-Hex-Konvention verletzt wurde).
6. Befunde als Bericht in die Übergabenotiz: je Befund Schweregrad (kritisch / mittel / gering), betroffenes AP, Datei und Fundstelle mit Zeilennummer.

**Akzeptanzkriterien:**
- [ ] Jedes AP der Phase 1 wurde gegen seine Akzeptanzkriterien geprüft, mit Fundstellen belegt.
- [ ] Der Scope-Check per `git diff --stat` ist dokumentiert (Liste der geänderten Dateien).
- [ ] Alle Befunde mit Schweregrad, Datei und Zeilennummer dokumentiert.
- [ ] Keine Datei wurde verändert.

**Tests:**
- entfällt (Review-AP; das Ergebnis ist der Bericht).

**Übergabenotiz:**

---

### AP-1.doc: Dokumentation Phase 1 aktualisieren

**Status:** ☐ offen
**Umfang:** S
**Modell:** sonnet
**Abhängigkeiten:** AP-1.rev

**Ziel & Kontext:**
Die Dokumentation auf den Stand nach Phase 1 bringen. **Wichtig – keine Parallelstruktur aufbauen:** Das Plugin dokumentiert seine Architektur in `CLAUDE.md` im Plugin-Verzeichnis (so deklariert es die `DOKUMENTATION.md` im Website-Wurzelverzeichnis). Es wird deshalb **keine** eigene `DOKUMENTATION.md` im Plugin angelegt. Die inhaltliche Fortschreibung von `CLAUDE.md` und `BLOCK-DEVELOPMENT.md` erfolgt gebündelt in Phase 4 (AP-4.2, AP-4.3); dieses AP hält nur die Datei-Map und den Planstatus aktuell.

**Betroffene Dateien:**
- `reference_file_map.md` (ändern)
- `PLAN-accordion-block.md` (ändern – Kopfdatum, Statustabelle, Testprotokoll)

**Vorgehen:**
1. Übergabenotizen von AP-1.1 bis AP-1.rev durchgehen.
2. `reference_file_map.md` gegen den echten Dateibestand von `blocks/accordion/` und `blocks/accordion-row/` abgleichen: Jede vorhandene Datei hat eine Zeile, jede Zeile beschreibt eine vorhandene Datei.
3. In der Block-Tabelle die zwei neuen Blöcke mit Blocknamen und Zweck ergänzen (falls in AP-1.2/AP-1.3 noch nicht vollständig) und in der Zeile zu `accordion-row` den Hinweis „darf nicht deaktiviert werden" vermerken.
4. `_Stand:_`-Datum in `reference_file_map.md` und „Letzte Aktualisierung" in dieser Plandatei aktualisieren.
5. Statustabelle (Abschnitt 8) und Testprotokoll (Abschnitt 9) auf den tatsächlichen Stand bringen.
6. Ergebnisse offener mittlerer/geringer Review-Befunde, die nicht behoben wurden, in einem Abschnitt „Offene Punkte" am Ende der Datei-Map notieren.
7. Commit `AP-1.doc: Dokumentation Phase 1` und Push. Danach Phasen-Branch in `main` mergen (`git checkout main && git merge --no-ff phase-1-accordion-grundlage`) und `main` pushen.

**Akzeptanzkriterien:**
- [ ] Jede in Phase 1 neu angelegte Datei hat eine aktuelle Zeile in der Datei-Map: 6 Dateien in `blocks/accordion/` (`block.json`, `index.js`, `render.php`, `view.js`, `style.css`, `editor.css`), 5 Dateien in `blocks/accordion-row/` (`block.json`, `index.js`, `render.php`, `style.css`, `editor.css`) sowie `reference_file_map.md` selbst.
- [ ] Kein Verweis in der Datei-Map zeigt auf eine nicht existierende Datei (stichprobenartig alle Pfade der neuen Zeilen mit `test -f` prüfen).
- [ ] Statustabelle und Testprotokoll dieses Plans spiegeln den Stand nach Phase 1.
- [ ] Es wurde **keine** neue `DOKUMENTATION.md` im Plugin-Verzeichnis angelegt.
- [ ] `main` enthält den Phase-1-Stand und ist gepusht.

**Tests:**
- Stichprobe: Zwei zufällige neue Zeilen der Datei-Map gegen den echten Dateiinhalt prüfen (Zweck und genannte Inhalte stimmen).
- `git log --oneline -n 3` auf `main` zeigt den Merge und die AP-Commits.

**Übergabenotiz:**

---

### Phase 2: Editor-Erlebnis und Optionen

---

### AP-2.1: Eltern-Block-Optionen, Inspector und Durchleitung ins Markup

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-1.doc (Phase 1 in `main` gemergt)

**Ziel & Kontext:**
Der Eltern-Block `modular-blocks/accordion` erhält seine vier Konfigurationsoptionen samt Inspector-Oberfläche, und diese Optionen werden als `data-*`-Attribute in das Frontend-Markup durchgeleitet. Die Optionen haben in dieser Phase noch **keine** Frontend-Wirkung – `view.js` liest sie erst in AP-3.2. Vor Beginn: `git checkout main && git checkout -b phase-2-accordion-editor`.

Die vier Optionen (Attributnamen verbindlich, `view.js` in AP-3.2 baut darauf auf):

| Attribut | Typ | Default | Bedeutung | `data`-Attribut im Markup |
|---|---|---|---|---|
| `allowMultiple` | boolean | `false` | mehrere Zeilen gleichzeitig offen erlaubt | `data-allow-multiple="true|false"` |
| `openFirst` | boolean | `false` | erste Zeile ist beim Laden geöffnet | `data-open-first="true|false"` |
| `showNumbering` | boolean | `false` | Zeilen werden automatisch durchnummeriert | `data-numbering="true|false"` + CSS-Klasse `is-numbered` am Wrapper |
| `showExpandAll` | boolean | `false` | Schaltflächen „Alle öffnen / Alle schließen" oberhalb der Zeilen | `data-expand-all="true|false"` |

**Betroffene Dateien:**
- `blocks/accordion/block.json` (ändern – `attributes` füllen)
- `blocks/accordion/index.js` (ändern – InspectorControls)
- `blocks/accordion/render.php` (ändern – `data`-Attribute und Klassen)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. In `blocks/accordion/block.json` das leere `attributes`-Objekt durch die vier Booleans aus der Tabelle ersetzen (jeweils `{"type": "boolean", "default": false}`).
2. In `blocks/accordion/index.js`:
   - Zusätzliche Imports: `InspectorControls` aus `@wordpress/block-editor`; `PanelBody`, `ToggleControl` aus `@wordpress/components`; `Fragment` aus `@wordpress/element` (Muster: `blocks/multiple-choice/index.js`, Zeilen 1–26).
   - `edit` in ein `Fragment` fassen und `<InspectorControls><PanelBody title={__('Accordion-Einstellungen', 'modular-blocks-plugin')}>` mit vier `ToggleControl` ergänzen. Labels (deutsch, über `__()`):
     - „Mehrere Zeilen gleichzeitig offen erlauben" (`allowMultiple`), `help`: „Aus: Das Öffnen einer Zeile schließt die zuvor geöffnete."
     - „Erste Zeile beim Laden öffnen" (`openFirst`)
     - „Zeilen nummerieren" (`showNumbering`)
     - „Schaltflächen ‚Alle öffnen / Alle schließen' anzeigen" (`showExpandAll`), `help`: „Sinnvoll vor allem, wenn mehrere Zeilen gleichzeitig offen sein dürfen."
   - Am Editor-Wrapper die Klasse `is-numbered` setzen, wenn `showNumbering` aktiv ist, damit die Nummerierung schon im Editor sichtbar wird: `useBlockProps({ className: showNumbering ? 'mb-accordion is-numbered' : 'mb-accordion' })`.
3. In `blocks/accordion/render.php`:
   - Die vier Attribute mit Defaults auslesen (`$allow_multiple = !empty($block_attributes['allowMultiple']);` usw.).
   - Klassenliste bauen: immer `mb-accordion`, zusätzlich `is-numbered`, wenn `showNumbering` aktiv.
   - `get_block_wrapper_attributes()` mit `class` **und** den vier `data`-Attributen aufrufen; Boolean-Werte als String `'true'`/`'false'` ausgeben (nicht als leerer String, damit `view.js` eindeutig auswerten kann).
   - Ist `showExpandAll` aktiv, oberhalb des `$block_content` eine Steuerleiste ausgeben:
     `<div class="mb-accordion__controls">` mit zwei `<button type="button" class="mb-accordion__control" data-action="open-all">` bzw. `data-action="close-all"`, Beschriftungen `__('Alle öffnen', 'modular-blocks-plugin')` und `__('Alle schließen', 'modular-blocks-plugin')`.
     Die Buttons erhalten Theme-Farben als Inline-Style nach Projektkonvention: `get_theme_mod('color_ui_surface', '#e24614')` als `background`/`background-color` mit `!important`, Textfarbe `#fff !important`, plus `border: none`, `border-radius: 4px`, `padding: 8px 16px`, `cursor: pointer` – Vorbild ist der Abschnitt „Buttons mit Theme-Farben" in `CLAUDE.md` im Plugin-Verzeichnis. **Keine CSS-Variablen verwenden.** Style-String über `esc_attr()` ausgeben.
     Ist `allowMultiple` aus, nur „Alle schließen" ausgeben (im Exklusivmodus wäre „Alle öffnen" widersprüchlich).
4. `npm run build` ausführen.
5. Datei-Map-Zeilen der drei geänderten Dateien aktualisieren (neue Inhalte: Attribute, Inspector, `data`-Attribute).
6. Commit `AP-2.1: Optionen und Inspector für Accordion` und Push auf `phase-2-accordion-editor`.

**Akzeptanzkriterien:**
- [ ] `blocks/accordion/block.json` enthält genau die vier Attribute mit Typ `boolean` und Default `false`.
- [ ] `index.js` zeigt vier `ToggleControl` in einem `PanelBody`; alle Labels laufen durch `__()` mit Textdomain `modular-blocks-plugin`.
- [ ] `render.php` gibt `data-allow-multiple`, `data-open-first`, `data-numbering`, `data-expand-all` mit den Werten `"true"` oder `"false"` aus.
- [ ] Bei aktivem `showNumbering` trägt der Wrapper die Klasse `is-numbered` – im Editor und im Frontend.
- [ ] Die Steuerleiste erscheint nur bei aktivem `showExpandAll`; im Exklusivmodus enthält sie ausschließlich „Alle schließen".
- [ ] Die Buttons der Steuerleiste verwenden `get_theme_mod()`-Werte als Inline-Hex mit `!important`; im gesamten AP kommt kein `var(--` in CSS oder PHP vor (`grep -r "var(--" blocks/accordion blocks/accordion-row` liefert keine Treffer).
- [ ] `php -l blocks/accordion/render.php` ohne Fehler, `npm run build` ohne Fehler, Lint der beiden Blöcke ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build` läuft durch; `php -l blocks/accordion/render.php` ohne Fehler.
- Statische Prüfung: `grep -n "data-allow-multiple\|data-open-first\|data-numbering\|data-expand-all" blocks/accordion/render.php` findet alle vier.
- Statische Prüfung: `grep -rn "var(--" blocks/accordion blocks/accordion-row` liefert keine Treffer.
- Funktionale Prüfung erfolgt in AP-2.3.

**Übergabenotiz:**

---

### AP-2.2: Editor-Bedienung der Accordion-Zeile

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-1.doc. Unabhängig von AP-2.1 (andere Dateien) – parallele Ausführung erlaubt.

**Ziel & Kontext:**
Im Editor sollen Zeilen nicht alle gleichzeitig ausgeklappt sein (unübersichtlich bei vielen Zeilen), aber sofort bearbeitbar, sobald man sie anfasst. Verhalten: Eine Zeile ist im Editor geöffnet, wenn sie selbst selektiert ist, wenn ein Block in ihr selektiert ist, oder wenn der Redakteur sie manuell per Chevron aufgeklappt hat. Bewusst **nicht** exklusiv – mehrere Zeilen dürfen im Editor gleichzeitig offen sein (Architekturentscheidung, Abschnitt 4).

**Betroffene Dateien:**
- `blocks/accordion-row/index.js` (ändern)
- `blocks/accordion-row/editor.css` (ändern)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. In `blocks/accordion-row/index.js`:
   - Zusätzliche Imports: `useSelect` aus `@wordpress/data`, `useState` aus `@wordpress/element`, `Button` aus `@wordpress/components`, `store as blockEditorStore` aus `@wordpress/block-editor`.
   - `edit` erhält `clientId` und `isSelected` aus den Props.
   - Über `useSelect` ermitteln, ob ein Innenblock selektiert ist:
     `const hasSelectedInner = useSelect((select) => select(blockEditorStore).hasSelectedInnerBlock(clientId, true), [clientId]);`
   - Lokalen Zustand `const [manuallyOpen, setManuallyOpen] = useState(false);` einführen (rein visuell, **kein** Block-Attribut – der Zustand darf nicht in der Datenbank landen).
   - `const isOpen = isSelected || hasSelectedInner || manuallyOpen;`
   - Kopfzeile: links das bestehende `RichText`-Titelfeld, rechts ein `Button` mit `icon={isOpen ? 'arrow-up-alt2' : 'arrow-down-alt2'}`, `label={isOpen ? __('Zeile zuklappen', 'modular-blocks-plugin') : __('Zeile aufklappen', 'modular-blocks-plugin')}`, `onClick={() => setManuallyOpen(!manuallyOpen)}`.
   - Panel nur rendern, wenn `isOpen` – andernfalls eine kompakte Vorschauzeile anzeigen, die die Anzahl der enthaltenen Blöcke nennt, ermittelt über
     `useSelect((select) => select(blockEditorStore).getBlockCount(clientId), [clientId])`, Text z. B. `sprintf(__('%d Block(e) – zum Bearbeiten aufklappen', 'modular-blocks-plugin'), count)` (`sprintf` aus `@wordpress/i18n`).
     **Wichtig:** Das InnerBlocks-Element darf nicht dauerhaft aus dem Baum entfernt werden, wenn dadurch Inhalte verloren gehen – zugeklappte Zeilen deshalb per CSS ausblenden statt aus dem Render-Baum zu nehmen: Panel immer rendern, aber mit Klasse `is-collapsed` versehen und in `editor.css` per `display: none` verbergen. Die Vorschauzeile wird zusätzlich angezeigt.
   - Titel-Platzhalter beibehalten; bei leerem Titel im Editor eine dezente Hinweisfarbe (per `editor.css`).
2. In `blocks/accordion-row/editor.css`:
   - `.mb-accordion-row` als Karte mit Rahmen und leichtem Abstand, Kopfzeile als Flex-Container (Titel links, Chevron rechts).
   - `.mb-accordion-row__panel.is-collapsed { display: none; }`
   - Vorschauzeile (`.mb-accordion-row__preview`) klein und grau.
   - Editor-Farben zurückhaltend halten; **keine** Theme-Farben im Editor-CSS hartkodieren (der Editor kennt die Customizer-Werte nicht; Farben gehören ins Frontend-Rendering).
3. `npm run build` ausführen.
4. Datei-Map-Zeilen aktualisieren.
5. Commit `AP-2.2: Editor-Bedienung der Accordion-Zeile` und Push.

**Akzeptanzkriterien:**
- [ ] Eine Zeile klappt im Editor auf, sobald sie selektiert ist oder ein Block in ihr selektiert ist (`isSelected || hasSelectedInnerBlock`).
- [ ] Der Chevron-Button klappt manuell auf und zu; sein `label` wechselt zwischen „Zeile aufklappen" und „Zeile zuklappen".
- [ ] Der Auf-/Zuklappzustand des Editors wird **nicht** als Block-Attribut gespeichert (`blocks/accordion-row/block.json` enthält weiterhin nur das Attribut `title`).
- [ ] Zugeklappte Zeilen entfernen ihr InnerBlocks-Element nicht aus dem Render-Baum, sondern verbergen es per CSS-Klasse `is-collapsed`.
- [ ] Die Vorschauzeile nennt die Anzahl der enthaltenen Blöcke.
- [ ] `npm run build` und Lint (`npx wp-scripts lint-js blocks/accordion-row`, `npx wp-scripts lint-style "blocks/accordion-row/*.css"`) ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build` läuft durch.
- Statische Prüfung: `grep -n "hasSelectedInnerBlock\|useState\|is-collapsed" blocks/accordion-row/index.js` findet alle drei Bausteine; `grep -n "openByDefault\|isOpen.*setAttributes" blocks/accordion-row/index.js` findet **keinen** Treffer (Zustand darf nicht persistiert werden).
- Statische Prüfung: `blocks/accordion-row/block.json` enthält genau ein Attribut (`title`).
- Funktionale Prüfung erfolgt in AP-2.3.

**Übergabenotiz:**

---

### AP-2.3: Abnahme Phase 2 – Editor-Optionen und Bedienung

**Status:** ☐ offen
**Umfang:** S
**Modell:** sonnet
**Abhängigkeiten:** AP-2.1, AP-2.2

**Ziel & Kontext:**
Integrationstest der Phase 2: Optionen und Editor-Bedienung greifen zusammen, und die Optionen erscheinen im Frontend-Markup (noch ohne Wirkung). Der Agent führt die Gates aus und erzeugt die ZIPs; der Nutzer lädt hoch und klickt die Checkliste.

**Betroffene Dateien:**
- keine Codeänderungen
- `PLAN-accordion-block.md` (ändern – Status, Testprotokoll)

**Vorgehen:**
1. Deploy-Gate D, Schritte D1–D4 ausführen (Befehle in Abschnitt 3).
2. Regressionscheck Phase 1 vorbereiten: Bestätigen, dass `git diff --stat main...phase-2-accordion-editor` ausschließlich Dateien der beiden neuen Blöcke, `reference_file_map.md` und diese Plandatei listet.
3. Dem Nutzer die Abnahme-Checkliste vorlegen und auf Rückmeldung warten:
   - **U1:** `accordion-row.zip`, dann `accordion.zip` hochladen, „Cache leeren".
   - **U2:** Bestehende Accordion-Seite aus Phase 1 im Editor öffnen → Inhalte unverändert, **keine** Meldung über ungültigen Blockinhalt (Regressionscheck Phase 1).
   - **U3:** Accordion selektieren → Seitenleiste zeigt „Accordion-Einstellungen" mit genau vier Schaltern.
   - **U4:** Alle vier Schalter einzeln umlegen → keine Konsolenfehler, Editor bleibt bedienbar.
   - **U5:** „Zeilen nummerieren" aktivieren → im Editor erscheinen Nummern vor den Zeilentiteln (Gestaltung folgt in Phase 3, Nummern müssen aber sichtbar sein).
   - **U6:** In eine Zeile klicken → sie klappt auf; in eine andere Zeile klicken → diese klappt auf, die erste bleibt offen (im Editor bewusst nicht exklusiv).
   - **U7:** Chevron einer offenen, nicht selektierten Zeile klicken → sie klappt zu und zeigt die Vorschauzeile mit Blockanzahl.
   - **U8:** Speichern, Seite neu laden → alle Inhalte erhalten, keine Validierungsmeldung.
   - **U9:** Frontend aufrufen, Seitenquelltext ansehen → der Accordion-Wrapper trägt `data-allow-multiple`, `data-open-first`, `data-numbering`, `data-expand-all` mit `"true"`/`"false"` entsprechend den gesetzten Optionen.
   - **U10:** Mit aktiviertem Schalter „Alle öffnen/Alle schließen" → Steuerleiste erscheint im Frontend; Buttons sind in der Theme-Farbe (orange, `#e24614` bzw. der im Customizer gesetzten Farbe) eingefärbt, nicht grau/transparent.
   - **U11:** Konsole (Editor und Frontend) ohne rote Fehler; bei aktivem `WP_DEBUG` keine neuen PHP-Notices zu `accordion` im `debug.log`.
4. Ergebnis in Übergabenotiz und Testprotokoll übernehmen (inkl. Zeile „Phase 2 abgeschlossen"). Bei Fehlschlag Status ✗ und Korrektur-AP `AP-2.fix1` anlegen.
5. Commit `AP-2.3: Phase-2-Abnahme dokumentiert` und Push.

**Akzeptanzkriterien:**
- [ ] D1–D4 ohne Fehler.
- [ ] `git diff --stat main...phase-2-accordion-editor` listet keine Datei außerhalb des erlaubten Scopes (keine `includes/`, keine bestehenden Blöcke, kein `webpack.config.js`, kein `package.json`).
- [ ] Checkliste U1–U11 vom Nutzer durchgeführt, Ergebnis liegt schriftlich vor.
- [ ] U2 (Regression Phase 1), U3, U6, U9 und U10 sind bestanden.
- [ ] Testprotokoll enthält „Phase 2 abgeschlossen".

**Tests:**
- Gates D1–D4 als technischer Test.
- Checkliste U1–U11 als funktionaler Test (durch den Nutzer).

**Übergabenotiz:**

---

### AP-2.rev: Unabhängiges Review Phase 2

**Status:** ☐ offen
**Umfang:** S
**Modell:** opus
**Abhängigkeiten:** AP-2.1, AP-2.2, AP-2.3

**Ziel & Kontext:**
Unabhängige Prüfung der Phase 2 durch einen Agenten, der keines dieser APs implementiert hat. Nur lesend, keine Datei verändern.

**Vorgehen:**
1. AP-2.1 und AP-2.2 gegen ihre Akzeptanzkriterien im Quelltext prüfen.
2. Phasen-Endzustand prüfen: Sind alle vier Optionen im Inspector vorhanden, korrekt benannt, mit Default `false`, und landen sie als `data-*`-Attribute im Markup? Ist der Editor-Aufklappzustand nachweislich nicht persistiert?
3. Farb-Konvention prüfen: `grep -rn "var(--" blocks/accordion blocks/accordion-row` muss leer sein; die Steuerleisten-Buttons in `blocks/accordion/render.php` müssen `get_theme_mod()`-Werte als Inline-Hex mit `!important` verwenden.
4. Escaping prüfen: Alle Attributwerte in `render.php` laufen durch `esc_attr()`; Inline-Style-Strings ebenfalls; `$block_content` bleibt unescaped.
5. Scope-Check per `git diff --stat main...phase-2-accordion-editor`.
6. i18n prüfen: keine unübersetzten sichtbaren Strings in `index.js` und `render.php` beider Blöcke.
7. Befunde mit Schweregrad, Datei und Zeilennummer in die Übergabenotiz.

**Akzeptanzkriterien:**
- [ ] AP-2.1 und AP-2.2 gegen alle Akzeptanzkriterien geprüft und belegt.
- [ ] Farb-, Escaping-, i18n- und Scope-Prüfung dokumentiert.
- [ ] Alle Befunde mit Schweregrad, Datei und Zeilennummer.
- [ ] Keine Datei verändert.

**Tests:**
- entfällt (Review-AP).

**Übergabenotiz:**

---

### AP-2.doc: Dokumentation Phase 2 aktualisieren

**Status:** ☐ offen
**Umfang:** S
**Modell:** sonnet
**Abhängigkeiten:** AP-2.rev

**Ziel & Kontext:**
Datei-Map und Planstatus auf den Stand nach Phase 2 bringen. Die inhaltliche Fortschreibung von `CLAUDE.md` und `BLOCK-DEVELOPMENT.md` bleibt Phase 4 (AP-4.2/AP-4.3) – hier nicht vorgreifen.

**Betroffene Dateien:**
- `reference_file_map.md` (ändern)
- `PLAN-accordion-block.md` (ändern)

**Vorgehen:**
1. Übergabenotizen der Phase 2 durchgehen.
2. In der Datei-Map die Zeilen zu `blocks/accordion/block.json`, `index.js`, `render.php` und `blocks/accordion-row/index.js`, `editor.css` um die neuen Inhalte ergänzen (vier Optionen, Inspector, `data`-Attribute, Editor-Aufklappverhalten).
3. Die vier Attributnamen samt Bedeutung als kleine Tabelle in der Datei-Map oder in einem Abschnitt „Accordion-Optionen" festhalten, damit spätere Erweiterungen die Namen nicht erraten müssen.
4. `_Stand:_`- und „Letzte Aktualisierung"-Daten aktualisieren; Statustabelle und Testprotokoll pflegen.
5. Offene mittlere/geringe Review-Befunde unter „Offene Punkte" ergänzen.
6. Commit `AP-2.doc: Dokumentation Phase 2` und Push; danach `phase-2-accordion-editor` mit `--no-ff` in `main` mergen und `main` pushen.

**Akzeptanzkriterien:**
- [ ] Alle in Phase 2 geänderten Dateien haben aktuelle Zeilen in der Datei-Map.
- [ ] Die vier Optionsnamen (`allowMultiple`, `openFirst`, `showNumbering`, `showExpandAll`) sind mit Bedeutung dokumentiert.
- [ ] Statustabelle und Testprotokoll aktuell.
- [ ] `main` enthält den Phase-2-Stand und ist gepusht.

**Tests:**
- Stichprobe: Zwei Zeilen der Datei-Map gegen den Dateiinhalt prüfen.
- `git log --oneline -n 3` auf `main` zeigt den Merge.

**Übergabenotiz:**

---

### Phase 3: Frontend-Verhalten und Gestaltung

---

### AP-3.1: Frontend-Markup der Zeile fertigstellen (geschlossener Grundzustand, ARIA, Theme-Farben)

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-2.doc (Phase 2 in `main` gemergt)

**Ziel & Kontext:**
`blocks/accordion-row/render.php` rendert bisher alle Zeilen dauerhaft geöffnet (Zwischenstand aus AP-1.3). Jetzt entsteht der endgültige Auslieferungszustand: Zeilen sind serverseitig **geschlossen**, der Kopf trägt die Theme-Farben nach Projektkonvention, und die ARIA-Zustände beschreiben den geschlossenen Zustand korrekt. Das Öffnen übernimmt `view.js` (AP-3.2).

Wichtig für die Zusammenarbeit mit AP-3.2: Der geschlossene Zustand wird über die Klasse `is-closed` am Zeilen-Wrapper **und** `aria-expanded="false"` am Kopf-Button ausgedrückt; das Panel erhält zusätzlich das `hidden`-Attribut. `view.js` entfernt/setzt genau diese drei Marker. Vor Beginn: `git checkout main && git checkout -b phase-3-accordion-frontend`.

**Betroffene Dateien:**
- `blocks/accordion-row/render.php` (ändern)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. Zeilen-Wrapper: Klassenliste `mb-accordion-row is-closed` (über `get_block_wrapper_attributes()`).
2. Kopf-Button: `aria-expanded="false"`, `aria-controls="<panel_id>"`, Klasse `mb-accordion-row__header`. Inline-Styles nach Farb-Konvention aus `CLAUDE.md` im Plugin-Verzeichnis:
   - Hintergrund `get_theme_mod('color_ui_surface_light', '#f5ede9')` mit `!important` (geschlossener Grundzustand, dezent).
   - Textfarbe `get_theme_mod('color_special_text', '#71230a')` mit `!important`.
   - Zusätzlich: `display: flex !important; width: 100% !important; align-items: center !important; gap: 10px !important; padding: 12px 16px !important; border: none !important; text-align: left !important; cursor: pointer !important; font-weight: 600 !important;`
   - Den Style-String in einer PHP-Variablen zusammensetzen und über `esc_attr()` ausgeben. **Keine CSS-Variablen.**
   - Zusätzlich `data-color-active` und `data-color-hover` am Button ausgeben (Werte `get_theme_mod('color_ui_surface', '#e24614')` bzw. `get_theme_mod('color_ui_surface_dark', '#c93d12')`), damit `view.js` in AP-3.2 den geöffneten und den Hover-Zustand ohne CSS-Variablen umfärben kann.
3. Panel: `<div class="mb-accordion-row__panel" id="<panel_id>" role="region" aria-labelledby="<header_id>" hidden>` – Inhalt bleibt `$block_content` unverändert.
4. Icon-Element (`<span class="mb-accordion-row__icon" aria-hidden="true"></span>`) beibehalten; seine Darstellung übernimmt `style.css` (AP-3.3).
5. Anker-Ergebnis aus AP-1.3 umsetzen: Landet der „HTML-Anker" nicht automatisch als `id` am Wrapper, `id` explizit über `get_block_wrapper_attributes(['id' => ...])` setzen (`$block_attributes['anchor']`, gefiltert mit `sanitize_html_class()`). Sicherstellen, dass kein doppeltes `id`-Attribut entsteht.
6. `npm run build` ausführen, `php -l blocks/accordion-row/render.php` prüfen.
7. Datei-Map-Zeile zu `blocks/accordion-row/render.php` aktualisieren (geschlossener Grundzustand, Marker `is-closed`/`hidden`/`aria-expanded`, `data-color-*`).
8. Commit `AP-3.1: Frontend-Markup der Accordion-Zeile fertiggestellt` und Push.

**Akzeptanzkriterien:**
- [ ] Jede Zeile wird serverseitig geschlossen ausgegeben: Wrapper mit Klasse `is-closed`, Button mit `aria-expanded="false"`, Panel mit `hidden`.
- [ ] Der Kopf ist weiterhin ein `<button type="button">` mit korrektem `aria-controls`; das Panel hat `role="region"` und `aria-labelledby` auf die Button-ID.
- [ ] Alle Farben stammen aus `get_theme_mod()` und stehen als hartkodierte Hex-Werte mit `!important` im Inline-Style; `grep -n "var(--" blocks/accordion-row/render.php` liefert keinen Treffer.
- [ ] Der Button trägt `data-color-active` und `data-color-hover` mit gültigen Hex-Werten.
- [ ] Ein im Editor gesetzter HTML-Anker erscheint als `id` am Zeilen-Wrapper, und zwar genau einmal.
- [ ] `php -l` und `npm run build` ohne Fehler; Lint ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `php -l blocks/accordion-row/render.php`, `npm run build`.
- Statische Prüfung: `grep -c "hidden" blocks/accordion-row/render.php` ≥ 1; `grep -n "aria-expanded=\"false\"" blocks/accordion-row/render.php` findet den Treffer.
- Statische Prüfung: `grep -n "get_theme_mod" blocks/accordion-row/render.php` findet mindestens vier Aufrufe (`color_ui_surface`, `color_ui_surface_dark`, `color_ui_surface_light`, `color_special_text`).
- Funktionale Prüfung in AP-3.4 (ohne `view.js` sind die Zeilen zunächst nicht öffenbar – das ist in diesem AP der erwartete Zwischenzustand und darf nicht als Fehler protokolliert werden).

**Übergabenotiz:**

---

### AP-3.2: Frontend-Logik in `view.js` (exklusives Öffnen, Modi, Deep-Linking)

**Status:** ☐ offen
**Umfang:** L
**Modell:** opus
**Abhängigkeiten:** AP-3.1 (Markup-Marker `is-closed`, `hidden`, `aria-expanded`, `data-color-*` stehen), AP-2.1 (`data-*`-Optionen am Eltern-Wrapper stehen)

**Ziel & Kontext:**
`blocks/accordion/view.js` ist bisher eine leere IIFE (Platzhalter aus AP-1.2). Hier entsteht die vollständige Frontend-Logik. Sie muss mit mehreren Accordions pro Seite umgehen, auch wenn diese in CDB-Container-Blöcken verschachtelt sind, und darf keine globalen Variablen anlegen.

**Vorgegebene Markup-Verträge** (aus AP-2.1 und AP-3.1, nicht abweichen):
- Eltern-Wrapper: `.mb-accordion`, optional Klasse `is-numbered`, Attribute `data-allow-multiple`, `data-open-first`, `data-numbering`, `data-expand-all` (Werte `"true"`/`"false"`).
- Steuerleiste (optional): `.mb-accordion__controls` mit `button[data-action="open-all"]` und/oder `button[data-action="close-all"]`.
- Zeile: `.mb-accordion-row`, geschlossen = Klasse `is-closed`; Kopf: `button.mb-accordion-row__header` mit `aria-expanded`, `aria-controls`, `data-color-active`, `data-color-hover`; Panel: `.mb-accordion-row__panel` mit `hidden`.

**Betroffene Dateien:**
- `blocks/accordion/view.js` (ändern – ersetzt den Platzhalter)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. Datei als IIFE mit `'use strict';` aufbauen, ohne globale Variablen. Struktur: interne Hilfsfunktionen + `initAccordions()` + DOM-Ready-Aufruf + `MutationObserver` (Muster: bestehende `view.js`-Dateien des Plugins, z. B. `blocks/multiple-choice/view.js`).
2. Idempotenz sicherstellen: Jedes initialisierte Accordion mit `dataset.mbAccordionInit = '1'` markieren und in `initAccordions()` bereits markierte überspringen. Notwendig, weil der `MutationObserver` mehrfach feuern kann.
3. Zeilen eines Accordions nur direkt zugeordnet ermitteln: `accordion.querySelectorAll('.mb-accordion-row')` und dann per `row.closest('.mb-accordion') === accordion` filtern. Damit steuert ein äußeres Accordion niemals die Zeilen eines verschachtelten Accordions.
4. Öffnen/Schließen als zwei Funktionen `openRow(row, animate)` und `closeRow(row, animate)`:
   - Öffnen: `hidden` entfernen, Klasse `is-closed` entfernen, `aria-expanded="true"` setzen, Kopf-Hintergrund auf `data-color-active` setzen (Inline-Style, `setProperty(..., 'important')`), Höhe animieren.
   - Schließen: Höhe auf 0 animieren, danach `hidden` setzen, Klasse `is-closed` setzen, `aria-expanded="false"`, Kopffarbe auf den Ausgangswert zurücksetzen (Ausgangswert beim Init aus dem Inline-Style lesen und am Element in `dataset` sichern).
   - Animation: Panel-Höhe über `scrollHeight` messen, per `style.height` von `0px` auf `<messwert>px` (bzw. umgekehrt) mit `transition: height 250ms ease` animieren, nach `transitionend` `style.height` wieder entfernen, damit sich der Inhalt frei anpassen kann. Bei `window.matchMedia('(prefers-reduced-motion: reduce)').matches` ohne Animation direkt umschalten.
5. Klick-Verhalten am Kopf-Button: Ist das Accordion im Exklusivmodus (`data-allow-multiple !== 'true'`), vor dem Öffnen alle anderen Zeilen **desselben** Accordions schließen. Ist die geklickte Zeile bereits offen, wird sie geschlossen (Toggle bleibt erhalten).
6. Initialzustand: Ist `data-open-first === 'true'`, die erste Zeile ohne Animation öffnen. Sonst bleiben alle Zeilen geschlossen (Serverzustand).
7. Steuerleiste: Klick auf `[data-action="open-all"]` öffnet alle Zeilen des Accordions (auch im Exklusivmodus zulassen, falls der Button vorhanden ist – die Sichtbarkeit steuert bereits PHP); `[data-action="close-all"]` schließt alle.
8. Deep-Linking:
   - Beim Init: `window.location.hash` auswerten. Passt die ID zu einer Zeile (Wrapper-`id`) oder liegt das Element mit dieser ID **innerhalb** einer Zeile, diese Zeile öffnen (im Exklusivmodus die übrigen schließen) und per `scrollIntoView({ block: 'start' })` anspringen. `decodeURIComponent()` auf den Hash anwenden und ungültige Selektoren abfangen (`try/catch` um `document.getElementById`-Alternativen, keine unescaped Selektor-Strings verwenden).
   - Zusätzlich auf `hashchange` reagieren, damit interne Links auf derselben Seite funktionieren.
   - Sonderfall dokumentieren und umsetzen: Ist gleichzeitig `data-open-first` aktiv und ein passender Hash vorhanden, gewinnt der Hash (die erste Zeile wird im Exklusivmodus geschlossen).
9. Tastatur: Über das echte `<button>` sind Enter und Leertaste bereits abgedeckt – keine eigenen Key-Handler für das Öffnen anlegen. Optional (nur wenn ohne Zusatzkomplexität möglich): `ArrowDown`/`ArrowUp` bewegen den Fokus zum nächsten/vorherigen Kopf-Button desselben Accordions; `Home`/`End` zum ersten/letzten. Wird das umgesetzt, muss es in der Übergabenotiz stehen, damit AP-3.4 es prüft.
10. Hover-Zustand: `mouseenter`/`mouseleave` am Kopf-Button setzen die Hintergrundfarbe auf `data-color-hover` bzw. zurück. Grund: Der Inline-Style mit `!important` aus AP-3.1 lässt sich per CSS-`:hover` nicht überschreiben.
11. `npm run build` ausführen; `npx wp-scripts lint-js blocks/accordion` ohne Fehler.
12. Datei-Map-Zeile zu `blocks/accordion/view.js` mit den umgesetzten Funktionen aktualisieren.
13. Commit `AP-3.2: Frontend-Logik des Accordions` und Push.

**Akzeptanzkriterien:**
- [ ] Ein Klick auf einen geschlossenen Zeilenkopf öffnet die Zeile; im Exklusivmodus (`data-allow-multiple="false"`) schließt dabei die zuvor offene Zeile desselben Accordions.
- [ ] Bei `data-allow-multiple="true"` bleiben beliebig viele Zeilen gleichzeitig offen.
- [ ] Ein Klick auf einen offenen Zeilenkopf schließt diese Zeile.
- [ ] `aria-expanded` am Kopf und das `hidden`-Attribut am Panel spiegeln jederzeit den sichtbaren Zustand.
- [ ] Bei `data-open-first="true"` ist nach dem Laden genau die erste Zeile offen, ohne Animation.
- [ ] `[data-action="open-all"]`/`[data-action="close-all"]` wirken nur auf Zeilen des eigenen Accordions.
- [ ] Aufruf mit `#<anker>` öffnet die passende Zeile und scrollt sie in den Sichtbereich; `hashchange` wirkt ebenso.
- [ ] Mehrere Accordions auf einer Seite arbeiten unabhängig; ein verschachteltes Accordion wird nicht vom äußeren gesteuert (Filter über `row.closest('.mb-accordion') === accordion`).
- [ ] Bei `prefers-reduced-motion: reduce` erfolgt kein Höhen-Animationsschritt.
- [ ] Die Datei legt keine globalen Variablen an (`grep -n "^var \|^let \|^const \|window\.[A-Za-z]* *=" blocks/accordion/view.js` zeigt keine Zuweisung außerhalb der IIFE).
- [ ] Doppelte Initialisierung ist ausgeschlossen (`dataset.mbAccordionInit`-Marker).
- [ ] `npm run build` und `npx wp-scripts lint-js blocks/accordion` ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build` läuft durch; `build/blocks/accordion/view.js` existiert und ist größer als die Platzhalterversion.
- Statische Prüfung: `grep -n "prefers-reduced-motion\|scrollHeight\|hashchange\|mbAccordionInit\|closest('.mb-accordion')" blocks/accordion/view.js` findet alle fünf Bausteine.
- Statische Prüfung: keine `innerHTML`-Zuweisung mit variablem Inhalt (`grep -n "innerHTML" blocks/accordion/view.js` – Treffer nur zulässig, wenn kein Nutzerinhalt geschrieben wird; im Zweifel vermeiden).
- Funktionale Prüfung vollständig in AP-3.4.

**Übergabenotiz:**

---

### AP-3.3: Gestaltung, Nummerierung und Barrierefreiheit im CSS

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-3.1 (Klassen und Marker stehen). Unabhängig von AP-3.2 (andere Dateien) – parallele Ausführung erlaubt.

**Ziel & Kontext:**
Die Frontend-Gestaltung beider Blöcke fertigstellen: Zeilenlayout, Nummerierung per CSS-Counter, Icon-Zustand, Fokus-Sichtbarkeit, Bewegungsreduktion, Druckausgabe, responsives Verhalten. **Farben von Interaktionsflächen kommen aus dem PHP-Inline-Style (AP-3.1) bzw. aus `view.js` (AP-3.2)** – in diesen CSS-Dateien werden keine Theme-Farben hartkodiert und keine CSS-Variablen verwendet; hier geht es um Struktur, Abstände, Rahmen, Typografie und Zustände.

**Betroffene Dateien:**
- `blocks/accordion/style.css` (ändern)
- `blocks/accordion-row/style.css` (ändern)
- `blocks/accordion/editor.css` (ändern – Nummerierung auch im Editor)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. `blocks/accordion/style.css`:
   - `.mb-accordion` – Blockabstand, `border: 1px solid #e0e0e0`, `border-radius: 4px`, `overflow: hidden`.
   - `.mb-accordion__controls` – Flex-Container mit `gap`, Abstand nach unten; Buttons erhalten ihre Farben per Inline-Style aus PHP, hier nur `font-size`, `border-radius` (falls nicht schon inline) und `focus-visible`-Umriss.
   - Nummerierung: `.mb-accordion.is-numbered { counter-reset: mb-accordion-row; }` und `.mb-accordion.is-numbered .mb-accordion-row > .mb-accordion-row__header::before { counter-increment: mb-accordion-row; content: counter(mb-accordion-row) ". "; font-weight: 700; }`
     **Wichtig:** Der Selektor muss so gebaut sein, dass ein verschachteltes Accordion die Zählung des äußeren nicht fortsetzt – deshalb `counter-reset` am jeweiligen `.mb-accordion` und Zugriff nur über das direkte Kind-Verhältnis `.mb-accordion-row > .mb-accordion-row__header`.
   - `@media print { .mb-accordion .mb-accordion-row__panel[hidden] { display: block !important; } }` – im Druck sind alle Inhalte lesbar. (`[hidden]` per `display: block` zu überschreiben ist hier bewusst gewollt und nur im Druckkontext aktiv.)
2. `blocks/accordion-row/style.css`:
   - `.mb-accordion-row` – `border-bottom: 1px solid #e0e0e0`, letzte Zeile ohne Rahmen (`:last-child`).
   - `.mb-accordion-row__header` – Struktur ergänzend zum Inline-Style (z. B. `font-size`, `line-height`, `width: 100%`), `:focus-visible { outline: 3px solid #71230a; outline-offset: -3px; }` für sichtbaren Tastaturfokus.
   - `.mb-accordion-row__title` – `flex: 1`.
   - `.mb-accordion-row__icon` – Chevron per CSS zeichnen (z. B. `border`-Dreieck oder gedrehtes Pseudo-Element), `transition: transform 200ms ease`; im geschlossenen Zustand (`.is-closed`) nach unten, im offenen nach oben gedreht.
   - `.mb-accordion-row__panel` – `padding: 12px 16px`, `overflow: hidden` (Voraussetzung für die Höhenanimation aus AP-3.2), `transition: height 250ms ease`.
   - `@media (prefers-reduced-motion: reduce) { .mb-accordion-row__panel, .mb-accordion-row__icon { transition: none !important; } }`
   - Responsiv: unter 600 px Breite kleinere Innenabstände und `font-size`.
3. `blocks/accordion/editor.css`: dieselben Counter-Regeln wie im Frontend ergänzen, damit die Nummerierung im Editor sichtbar ist (der Editor-Wrapper trägt `is-numbered` aus AP-2.1).
4. `npm run build`; `npx wp-scripts lint-style "blocks/accordion/*.css" "blocks/accordion-row/*.css"` ohne Fehler.
5. Datei-Map-Zeilen aktualisieren.
6. Commit `AP-3.3: Gestaltung, Nummerierung und Barrierefreiheit` und Push.

**Akzeptanzkriterien:**
- [ ] Nummerierung funktioniert per CSS-Counter und ist an `.mb-accordion.is-numbered` gebunden; ein verschachteltes Accordion beginnt seine Zählung bei 1.
- [ ] `:focus-visible` erzeugt einen deutlich sichtbaren Umriss am Zeilenkopf und an den Steuerleisten-Buttons.
- [ ] Der Chevron dreht sich abhängig von `.is-closed`.
- [ ] `@media (prefers-reduced-motion: reduce)` schaltet die Transitions ab.
- [ ] `@media print` zeigt auch geschlossene Panels.
- [ ] Weder `blocks/accordion/style.css` noch `blocks/accordion-row/style.css` enthalten `var(--` oder hartkodierte Theme-Farben (`#e24614`, `#c93d12`, `#f5ede9`); Ausnahme: `#71230a` als Fokus-Umriss und neutrale Grautöne (`#e0e0e0`, `#333`) sind erlaubt.
- [ ] `npm run build` und Style-Lint ohne Fehler.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Smoke-Test: `npm run build`; `build/blocks/accordion/style-index.css` und `build/blocks/accordion-row/style-index.css` existieren und enthalten die Counter- bzw. Fokus-Regeln (`grep -n "counter-increment" build/blocks/accordion/style-index.css`).
- Statische Prüfung: `grep -n "e24614\|c93d12\|f5ede9\|var(--" blocks/accordion/style.css blocks/accordion-row/style.css blocks/accordion/editor.css` liefert keine Treffer.
- Statische Prüfung: `grep -n "prefers-reduced-motion" blocks/accordion-row/style.css` und `grep -n "@media print" blocks/accordion/style.css` finden je einen Treffer.
- Funktionale Prüfung in AP-3.4.

**Übergabenotiz:**

---

### AP-3.4: Abnahme Phase 3 – vollständige Frontend-Funktion

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-3.1, AP-3.2, AP-3.3

**Ziel & Kontext:**
Integrationstest der Phase 3 und damit der Kern-Abnahmetest des gesamten Vorhabens: Das Accordion muss im Frontend vollständig wie spezifiziert funktionieren. Der Agent führt die Gates aus und erzeugt die ZIPs; der Nutzer lädt hoch und arbeitet die Checkliste ab.

**Betroffene Dateien:**
- keine Codeänderungen
- `PLAN-accordion-block.md` (ändern – Status, Testprotokoll)

**Vorgehen:**
1. Deploy-Gate D, Schritte D1–D4 ausführen.
2. Scope-Check: `git diff --stat main...phase-3-accordion-frontend` – nur Dateien der beiden neuen Blöcke, `reference_file_map.md`, diese Plandatei.
3. Dem Nutzer die Checkliste vorlegen und auf Rückmeldung warten. Testseite: eine Seite mit **einem** Accordion mit vier Zeilen, davon eine mit HTML-Anker `test-zeile` (Editor → Zeile auswählen → Reiter „Erweitert" → HTML-Anker), und **zweitens** einer weiteren Seite mit zwei Accordions untereinander:
   - **U1:** `accordion-row.zip`, dann `accordion.zip` hochladen, „Cache leeren".
   - **U2:** Bestehende Seite aus Phase 2 öffnen → Inhalte unverändert, keine Validierungsmeldung (Regression Phase 1+2).
   - **U3:** Frontend, Grundzustand: alle Zeilen geschlossen, Titel als Schaltflächen sichtbar, Köpfe in dezenter Theme-Farbe (hellorange), Chevron zeigt nach unten.
   - **U4:** Klick auf Zeile 2 → öffnet sich mit Animation, Chevron dreht, Kopf wird kräftig orange.
   - **U5:** Klick auf Zeile 4 → Zeile 4 öffnet sich, **Zeile 2 schließt sich** (exklusives Verhalten).
   - **U6:** Klick auf die offene Zeile 4 → schließt sich wieder.
   - **U7:** Im Editor „Mehrere Zeilen gleichzeitig offen erlauben" aktivieren, speichern, Frontend neu laden → Zeilen 2 und 4 können gleichzeitig offen sein.
   - **U8:** „Erste Zeile beim Laden öffnen" aktivieren, speichern, Frontend neu laden → Zeile 1 ist sofort offen, ohne sichtbares Aufklapp-Ruckeln.
   - **U9:** „Zeilen nummerieren" aktivieren → Zeilen zeigen im Frontend 1. bis 4.
   - **U10:** „Alle öffnen/Alle schließen" aktivieren → Steuerleiste erscheint; „Alle öffnen" öffnet alle vier Zeilen, „Alle schließen" schließt alle.
   - **U11:** Seite mit `#test-zeile` aufrufen (z. B. `https://…/seite/#test-zeile`) → genau diese Zeile ist offen und im Sichtbereich.
   - **U12:** Tastaturbedienung: mit Tab bis zu einem Zeilenkopf navigieren → deutlich sichtbarer Fokusrahmen; Enter öffnet, Leertaste schließt. (Falls in AP-3.2 zusätzlich Pfeiltasten-Navigation umgesetzt wurde: Pfeil ab/auf bewegt den Fokus zwischen den Köpfen.)
   - **U13:** Zwei-Accordion-Seite: Zeile im ersten Accordion öffnen, dann Zeile im zweiten öffnen → die Zeile im ersten bleibt offen (Accordions arbeiten unabhängig).
   - **U14:** Mobil/schmales Fenster (Breite ~375 px): Zeilen bleiben lesbar, Titel bricht um, keine horizontale Scrollleiste.
   - **U15:** Druckvorschau (Strg+P) → auch geschlossene Zeileninhalte sind im Druckbild sichtbar.
   - **U16:** Konsole (Frontend und Editor) ohne rote Fehler; bei aktivem `WP_DEBUG` keine neuen PHP-Notices zu `accordion`.
   - **U17 (optional, falls das Betriebssystem es erlaubt):** Systemeinstellung „Bewegung reduzieren" aktivieren, Seite neu laden → Zeilen öffnen ohne Animation, sofort.
4. Ergebnis wörtlich in Übergabenotiz und Testprotokoll übernehmen, inklusive Zeile „Phase 3 abgeschlossen". Bei Fehlschlägen: Status ✗ und je Fehlschlag ein Korrektur-AP (`AP-3.fix1`, `AP-3.fix2`, …) mit Bezug auf den fehlgeschlagenen Prüfpunkt anlegen.
5. Commit `AP-3.4: Phase-3-Abnahme dokumentiert` und Push.

**Akzeptanzkriterien:**
- [ ] D1–D4 ohne Fehler.
- [ ] Scope-Check zeigt keine Datei außerhalb des erlaubten Bereichs.
- [ ] Checkliste U1–U16 vom Nutzer durchgeführt, Ergebnis liegt schriftlich vor (U17 optional).
- [ ] U3, U4, U5, U6, U7, U8, U9, U10, U11, U12, U13 und U16 sind bestanden – das sind die Kernfunktionen des Projektziels.
- [ ] Testprotokoll enthält „Phase 3 abgeschlossen".

**Tests:**
- Gates D1–D4 als technischer Test.
- Checkliste U1–U17 als funktionaler Test (durch den Nutzer).

**Übergabenotiz:**

---

### AP-3.rev: Unabhängiges Review Phase 3

**Status:** ☐ offen
**Umfang:** M
**Modell:** opus
**Abhängigkeiten:** AP-3.1, AP-3.2, AP-3.3, AP-3.4

**Ziel & Kontext:**
Unabhängige Prüfung der Phase 3 durch einen Agenten, der keines dieser APs implementiert hat. Nur lesend, keine Datei verändern. Diese Phase enthält die sicherheits- und barrierefreiheitsrelevanten Teile – entsprechend genau prüfen.

**Vorgehen:**
1. AP-3.1, AP-3.2, AP-3.3 gegen ihre Akzeptanzkriterien im Quelltext prüfen.
2. Phasen-Endzustand prüfen: Deckt `blocks/accordion/view.js` alle sieben Verhaltensanforderungen ab (exklusiv, Mehrfachmodus, erste Zeile offen, Alle öffnen/schließen, Deep-Linking inkl. `hashchange`, Bewegungsreduktion, Unabhängigkeit mehrerer Accordions)? Konkrete Codestellen benennen.
3. Sicherheits-Check: Kein `innerHTML` mit variablem Inhalt in `view.js`; Hash-Auswertung ohne unescaped Selektoren (kein `querySelector('#' + hash)` ohne Absicherung – `getElementById` bzw. `CSS.escape` oder `try/catch` erwartet); in `render.php` alle Attributwerte und Inline-Styles über `esc_attr()`, Titel über `wp_kses_post()`, `$block_content` unescaped.
4. ARIA-Konsistenz: `aria-expanded` wird bei jedem Zustandswechsel mitgeführt, `hidden` und Klasse `is-closed` bleiben synchron; keine Stelle im Code ändert nur einen der drei Marker.
5. Farb-Konvention: `grep -rn "var(--" blocks/accordion blocks/accordion-row` leer; Theme-Farben ausschließlich über `get_theme_mod()` in PHP bzw. über `data-color-*` in JS.
6. Scope-Check per `git diff --stat main...phase-3-accordion-frontend`.
7. Befunde mit Schweregrad, Datei und Zeilennummer in die Übergabenotiz.

**Akzeptanzkriterien:**
- [ ] Alle drei Implementierungs-APs gegen ihre Kriterien geprüft und mit Fundstellen belegt.
- [ ] Sicherheits-Check (Escaping, `innerHTML`, Hash-Auswertung) dokumentiert.
- [ ] ARIA-Konsistenz explizit geprüft und bewertet.
- [ ] Scope-Check dokumentiert.
- [ ] Alle Befunde mit Schweregrad, Datei und Zeilennummer.
- [ ] Keine Datei verändert.

**Tests:**
- entfällt (Review-AP).

**Übergabenotiz:**

---

### AP-3.doc: Dokumentation Phase 3 aktualisieren

**Status:** ☐ offen
**Umfang:** S
**Modell:** sonnet
**Abhängigkeiten:** AP-3.rev

**Ziel & Kontext:**
Datei-Map und Planstatus auf den Stand nach Phase 3 bringen und die Markup-Verträge festhalten, auf die künftige Erweiterungen aufbauen müssen.

**Betroffene Dateien:**
- `reference_file_map.md` (ändern)
- `PLAN-accordion-block.md` (ändern)

**Vorgehen:**
1. Übergabenotizen der Phase 3 durchgehen.
2. Datei-Map-Zeilen zu `blocks/accordion/view.js`, `blocks/accordion/style.css`, `blocks/accordion/editor.css`, `blocks/accordion-row/render.php`, `blocks/accordion-row/style.css` aktualisieren.
3. Einen Abschnitt „Accordion – Markup-Vertrag" in der Datei-Map ergänzen: die Klassen (`mb-accordion`, `is-numbered`, `mb-accordion__controls`, `mb-accordion-row`, `is-closed`, `mb-accordion-row__header`, `mb-accordion-row__panel`, `mb-accordion-row__icon`), die `data`-Attribute und die drei Zustandsmarker (`is-closed`, `hidden`, `aria-expanded`). Begründung mit einem Satz: PHP-Rendering und `view.js` sind über diesen Vertrag gekoppelt; wer eines ändert, muss das andere anpassen.
4. Falls in AP-3.2 die Pfeiltasten-Navigation umgesetzt wurde, das hier festhalten.
5. `_Stand:_`- und „Letzte Aktualisierung"-Daten aktualisieren; Statustabelle und Testprotokoll pflegen; offene Review-Befunde unter „Offene Punkte".
6. Commit `AP-3.doc: Dokumentation Phase 3` und Push; danach `phase-3-accordion-frontend` mit `--no-ff` in `main` mergen und `main` pushen.

**Akzeptanzkriterien:**
- [ ] Alle in Phase 3 geänderten Dateien haben aktuelle Zeilen in der Datei-Map.
- [ ] Der Abschnitt „Accordion – Markup-Vertrag" listet alle Klassen, `data`-Attribute und Zustandsmarker vollständig.
- [ ] Statustabelle und Testprotokoll aktuell.
- [ ] `main` enthält den Phase-3-Stand und ist gepusht.

**Tests:**
- Stichprobe: Die im Markup-Vertrag genannten Klassennamen per `grep` in `blocks/accordion-row/render.php` und `blocks/accordion/view.js` gegenprüfen – jeder genannte Name muss dort vorkommen.
- `git log --oneline -n 3` auf `main` zeigt den Merge.

**Übergabenotiz:**

---

### Phase 4: Integration, Regression, Auslieferung und Doku-Fortschreibung

---

### AP-4.1: Integration im CDB-Container und Regressionscheck der bestehenden Blöcke

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-3.doc (Phase 3 in `main` gemergt)

**Ziel & Kontext:**
Das Accordion wird in der Praxis meist innerhalb eines Container-Blocks des zweiten Projekt-Plugins *Container Block Designer* (`container-block-designer/*`) eingesetzt. Container-Blöcke erlauben unbeschränkte InnerBlocks (`templateLock: false`, keine `allowedBlocks`-Einschränkung), sodass das Accordion dort einfügbar sein muss. Kritisch ist, ob das Frontend-Script `view.js` in dieser Verschachtelung geladen wird. Zusätzlich wird nachgewiesen, dass keiner der 13 bestehenden Blöcke verändert wurde. Vor Beginn: `git checkout main && git checkout -b phase-4-accordion-integration`.

**Betroffene Dateien:**
- keine Codeänderungen (rein prüfend; Befunde fließen in AP-4.3 in die Doku)
- `PLAN-accordion-block.md` (ändern – Status, Testprotokoll)

**Vorgehen:**
1. Statischen Regressionsnachweis führen:
   - `git diff --stat f6826a5..HEAD -- blocks/` – die Ausgabe darf ausschließlich Pfade unter `blocks/accordion/` und `blocks/accordion-row/` enthalten.
   - `git diff --stat f6826a5..HEAD -- includes/ webpack.config.js create-block-zips.js create-zip.js create-empty-plugin-zip.js package.json modular-blocks-plugin.php` – muss leer sein. Ist sie es nicht, AP stoppen und melden (Nicht-Ziel verletzt).
2. Deploy-Gate D, Schritte D1–D4 ausführen, damit der Nutzer aktuelle ZIPs hat.
3. Dem Nutzer die Integrations-Checkliste vorlegen und auf Rückmeldung warten:
   - **U1:** Aktuelle ZIPs hochladen (`accordion-row.zip`, dann `accordion.zip`), „Cache leeren".
   - **U2:** Neue Testseite: Container-Block (CDB) einfügen → darin ein Accordion mit drei gefüllten Zeilen. Speichern.
   - **U3:** Frontend: Zeilen öffnen und schließen → exklusives Verhalten funktioniert wie außerhalb des Containers.
   - **U4:** Browser-DevTools → Netzwerk-Tab, Seite neu laden, nach „view" filtern → die `view.js` des Accordions wird geladen (Status 200). **Falls nicht:** Prüfpunkt als fehlgeschlagen melden; dann ist ein Korrektur-AP nötig (Analyse: Registrierung des View-Scripts; eine Änderung an `includes/class-block-manager.php` wäre laut Nicht-Zielen nur mit ausdrücklicher Freigabe des Nutzers zulässig).
   - **U5:** Container-Funktionen im selben Container prüfen, soweit im Blockdesign aktiviert: Ein-/Ausklappen des Containers, „Kopieren", Nummerierung, Screenshot, PDF-Export → alle verhalten sich wie vor der Erweiterung.
   - **U6:** Screenshot/PDF-Export mit **geschlossenen** Accordion-Zeilen ausführen und das Ergebnis notieren (erwartet: geschlossene Inhalte fehlen – bekannte Einschränkung, wird in AP-4.3 dokumentiert, ist kein Fehlschlag).
   - **U7:** Zwei bestehende Blöcke aus dem Plugin stichprobenartig prüfen (z. B. „Multiple Choice" und „Summary"): auf einer bestehenden Seite öffnen, im Frontend bedienen → unverändert funktionsfähig.
   - **U8:** Konsole ohne rote Fehler; bei aktivem `WP_DEBUG` keine neuen PHP-Notices.
4. Ergebnisse in Übergabenotiz und Testprotokoll übernehmen; das Ergebnis von U6 wörtlich festhalten (Grundlage für AP-4.3).
5. Commit `AP-4.1: CDB-Container-Integration und Regressionscheck` und Push.

**Akzeptanzkriterien:**
- [ ] `git diff --stat f6826a5..HEAD -- blocks/` listet ausschließlich Pfade der zwei neuen Blöcke.
- [ ] `git diff --stat` über `includes/`, `webpack.config.js`, `create-*.js`, `package.json`, `modular-blocks-plugin.php` ist leer.
- [ ] U2, U3, U4, U5, U7 und U8 sind vom Nutzer bestätigt bestanden.
- [ ] Das Ergebnis von U4 (Laden von `view.js` im Container) ist explizit dokumentiert.
- [ ] Das Ergebnis von U6 (Screenshot/PDF mit geschlossenen Zeilen) ist wörtlich dokumentiert.
- [ ] Testprotokoll enthält eine Zeile zu diesem AP.

**Tests:**
- Technischer Test: die beiden `git diff --stat`-Aufrufe aus Schritt 1 plus Gate D1–D4.
- Funktionaler Test: Checkliste U1–U8 (durch den Nutzer).

**Übergabenotiz:**

---

### AP-4.2: InnerBlocks-Eltern/Kind-Muster in `BLOCK-DEVELOPMENT.md` dokumentieren

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-3.doc. Unabhängig von AP-4.1 (andere Dateien) – parallele Ausführung erlaubt.

**Ziel & Kontext:**
`BLOCK-DEVELOPMENT.md` im Plugin-Verzeichnis ist der Entwicklungs-Leitfaden für neue Blöcke. Er enthält in den Zeilen 719–863 ein einfaches, einzeiliges Accordion-Beispiel als statischen Block – dieses Beispiel bleibt als „einfache Variante" erhalten, wird aber klar abgegrenzt. Ergänzt wird das mit diesem Projekt etablierte, bis dahin im Plugin nicht vorhandene Muster: ein Eltern-/Kind-Blockpaar mit InnerBlocks und serverseitigem Rendering. Künftige Blöcke sollen sich daran orientieren können, ohne den Quellcode zu rekonstruieren.

**Betroffene Dateien:**
- `BLOCK-DEVELOPMENT.md` (ändern)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. Beim bestehenden Accordion-Beispiel (Abschnitt „Beispiel 2: Accordion (Interaktiv)") eine einleitende Notiz ergänzen: Das Beispiel zeigt eine einzelne, statisch gespeicherte Klappzeile; für mehrzeilige Accordions mit frei befüllbaren Zeilen ist das Eltern-/Kind-Muster im neuen Abschnitt maßgeblich, umgesetzt in `blocks/accordion/` und `blocks/accordion-row/`.
2. Neuen Abschnitt „Eltern-/Kind-Blöcke mit InnerBlocks (Muster: Accordion)" ergänzen, mit:
   - **Wann verwenden:** wenn ein Block mehrere frei befüllbare Bereiche braucht (ein Block hat nur eine InnerBlocks-Zone) – Beispiele: Accordion, Tabs, Spalten.
   - **Ordnerstruktur:** zwei Block-Ordner, Eltern hält Optionen, Kind hält Inhalt; `parent`-Feld im Kind, `allowedBlocks` im Eltern.
   - **Codebeispiele** (gekürzt, aber lauffähig): `block.json`-Ausschnitte beider Blöcke (inkl. `parent`, `allowedBlocks`, `supports.anchor`), `edit`/`save` beider Blöcke, das Minimal-`save()` mit `<InnerBlocks.Content />`, und ein `render.php`-Ausschnitt, der `$block_content` unverändert ausgibt.
   - **Regel „minimales save()":** Warum sichtbares Markup ausschließlich in `render.php` entsteht (Block-Validierungsfehler in bestehenden Seiten vermeiden) und dass `deprecated: []` als vorbereiteter Migrationspunkt angelegt wird.
   - **Editor-Verhalten:** Aufklappen bei Selektion über `useSelect` + `hasSelectedInnerBlock`, rein visueller Zustand mit `useState` – **nicht** als Attribut persistieren.
   - **Kopplung PHP ↔ view.js:** Optionen als `data`-Attribute am Eltern-Wrapper, Zustandsmarker (`is-closed`, `hidden`, `aria-expanded`), Zuordnung von Zeilen zum eigenen Eltern-Block über `row.closest('.mb-accordion') === accordion` (wichtig für Verschachtelung).
   - **Auslieferung:** Ein Eltern-/Kind-Paar erzeugt **zwei** Block-ZIPs; beide müssen hochgeladen und aktiv sein, sonst zeigt der Editor „ungültiger Inhalt". Upload-Reihenfolge Kind → Eltern.
   - **Barrierefreiheit:** echter `<button>` als Kopf, `aria-expanded`/`aria-controls`/`aria-labelledby`, `:focus-visible`, `prefers-reduced-motion`.
3. Inhaltsverzeichnis am Dateianfang um den neuen Abschnitt ergänzen (die Datei hat eine Verlinkungsliste – neuen Eintrag mit passendem Anker einfügen).
4. Alle Codebeispiele gegen den tatsächlichen Code in `blocks/accordion/` und `blocks/accordion-row/` abgleichen: Klassennamen, Attributnamen und Funktionsnamen müssen wörtlich stimmen.
5. Datei-Map-Zeile zu `BLOCK-DEVELOPMENT.md` ergänzen/aktualisieren.
6. Commit `AP-4.2: InnerBlocks-Muster in BLOCK-DEVELOPMENT.md dokumentiert` und Push.

**Akzeptanzkriterien:**
- [ ] `BLOCK-DEVELOPMENT.md` enthält den neuen Abschnitt mit allen acht in Schritt 2 genannten Unterpunkten.
- [ ] Das bestehende einzeilige Accordion-Beispiel ist als „einfache Variante" gekennzeichnet und verweist auf den neuen Abschnitt.
- [ ] Alle Klassen-, Attribut- und Dateinamen in den neuen Codebeispielen stimmen wörtlich mit dem echten Code überein (stichprobenartig mit `grep` belegt).
- [ ] Das Inhaltsverzeichnis der Datei enthält den neuen Abschnitt.
- [ ] Datei-Map aktualisiert.

**Tests:**
- Stichprobe: Drei im Dokument genannte Bezeichner (z. B. `mb-accordion-row__panel`, `allowMultiple`, `hasSelectedInnerBlock`) per `grep` im Quellcode nachweisen.
- Konsistenzprüfung: Jeder im neuen Abschnitt genannte Dateipfad existiert (`test -f`).

**Übergabenotiz:**

---

### AP-4.3: `CLAUDE.md` (Plugin und Projekt-Root) sowie Betriebs- und Deploy-Wissen fortschreiben

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-4.1 (Ergebnisse der Integrations- und Screenshot-Prüfung liegen vor)

**Ziel & Kontext:**
Die beiden `CLAUDE.md`-Dateien sind laut `DOKUMENTATION.md` im Website-Wurzelverzeichnis die Architektur- und Arbeitsdokumentation der jeweiligen Komponente. Sie müssen den neuen Block, seine Besonderheiten und die Betriebsfallen kennen – sonst tappt die nächste Erweiterung in dieselben Löcher (zwei ZIPs, Kind-Block nicht deaktivieren, Cache leeren, Screenshot-Einschränkung).

**Betroffene Dateien:**
- `CLAUDE.md` (ändern – im Plugin-Verzeichnis `Plugins/Eigene WP Blocks/`)
- `../../CLAUDE.md` (ändern – im Website-Wurzelverzeichnis)
- `reference_file_map.md` (ändern)

**Vorgehen:**
1. In `CLAUDE.md` des Plugins:
   - Im Abschnitt „Existing Blocks" bei den „General Education Blocks" beide neuen Blöcke ergänzen: `accordion` („Accordion – Aufklappbare Zeilen: mehrere Zeilen, standardmäßig exklusives Öffnen, Zeilen nehmen beliebige Blöcke auf") und `accordion-row` mit ausdrücklichem Warnhinweis: **Kind-Block, darf in Einstellungen → Modulare Blöcke NICHT deaktiviert werden – sonst zeigen alle Accordions im Editor „ungültiger Inhalt".**
   - Neuen Unterabschnitt „Eltern-/Kind-Blöcke mit InnerBlocks (WICHTIG)" ergänzen, analog zu den bestehenden Warnabschnitten („Buttons mit Theme-Farben", „Iframe Sandbox-Attribut"): minimales `save()`, Markup in `render.php`, zwei ZIPs, Upload-Reihenfolge Kind → Eltern, Verweis auf den ausführlichen Abschnitt in `BLOCK-DEVELOPMENT.md`.
   - Im Abschnitt „Plugin Distribution Strategy" ergänzen, dass Blockpaare zwei ZIPs erzeugen und beide hochgeladen werden müssen, und dass nach manuellem Kopieren von Blockordnern der „Cache leeren"-Button nötig ist (Discovery-Transient `modular_blocks_dir_cache`, 12 h).
   - Abschnitt „Bekannte Einschränkungen" (neu, falls nicht vorhanden): Screenshot-/PDF-Export eines CDB-Containers erfasst geschlossene Accordion-Panels nicht – vor dem Export „Alle öffnen" verwenden. Das wörtliche Ergebnis aus AP-4.1/U6 als Belegsatz einbauen.
2. In `../../CLAUDE.md` (Website-Root):
   - Im Abschnitt „Available Blocks" die beiden neuen Blöcke in die Liste der „Educational"-Blöcke aufnehmen (alphabetisch einsortiert), mit dem Hinweis, dass `accordion-row` ein Kind-Block ist.
   - Im Abschnitt „Plugin Compatibility" beim Integrationsmuster ergänzen, dass Accordion-Zeilen selbst InnerBlocks enthalten und damit eine weitere Verschachtelungsebene entsteht (Container → Accordion → Zeile → beliebige Blöcke), sowie den Verweis auf die Screenshot-Einschränkung.
3. Beide Dateien auf Widerspruchsfreiheit prüfen: keine Aussage darf dem tatsächlichen Verhalten oder den Nicht-Zielen dieses Plans widersprechen.
4. Datei-Map-Zeilen zu beiden `CLAUDE.md`-Dateien ergänzen/aktualisieren.
5. Commit `AP-4.3: CLAUDE.md-Dateien und Betriebswissen fortgeschrieben` und Push.

**Akzeptanzkriterien:**
- [ ] `CLAUDE.md` im Plugin listet beide neuen Blöcke inklusive Warnhinweis zu `accordion-row`.
- [ ] `CLAUDE.md` im Plugin enthält den neuen Unterabschnitt zum InnerBlocks-Eltern/Kind-Muster und den Hinweis auf zwei ZIPs plus Upload-Reihenfolge.
- [ ] Die Cache-Falle (`modular_blocks_dir_cache`, „Cache leeren") ist dokumentiert.
- [ ] Die Screenshot-/PDF-Einschränkung ist mit dem Prüfergebnis aus AP-4.1 dokumentiert.
- [ ] `../../CLAUDE.md` listet beide Blöcke und beschreibt die zusätzliche Verschachtelungsebene.
- [ ] Kein Widerspruch zwischen den beiden Dateien und dem tatsächlichen Code (stichprobenartig geprüft: Blocknamen, Optionsnamen).
- [ ] Datei-Map aktualisiert.

**Tests:**
- Stichprobe: Die in beiden `CLAUDE.md` genannten Blocknamen (`modular-blocks/accordion`, `modular-blocks/accordion-row`) per `grep` in den jeweiligen `block.json` nachweisen.
- Konsistenzprüfung: Die genannten Optionsnamen (`allowMultiple`, `openFirst`, `showNumbering`, `showExpandAll`) kommen in `blocks/accordion/block.json` vor.

**Übergabenotiz:**

---

### AP-4.4: Abschluss-Abnahme, Merge und Auslieferung

**Status:** ☐ offen
**Umfang:** M
**Modell:** sonnet
**Abhängigkeiten:** AP-4.1, AP-4.2, AP-4.3

**Ziel & Kontext:**
Integrationstest der Phase 4 und Projektabschluss: letzte Gates, finale ZIPs, Abnahme durch den Nutzer, Merge in `main`, Push. Danach ist der Block ausgeliefert und dokumentiert.

**Betroffene Dateien:**
- keine Codeänderungen
- `PLAN-accordion-block.md` (ändern – Status, Testprotokoll)

**Vorgehen:**
1. Deploy-Gate D, Schritte D1–D4 ausführen. Zusätzlich einmalig den vollständigen projektweiten Syntaxcheck laufen lassen, wie er in `CLAUDE.md` des Plugins vorgeschrieben ist:
   ```bash
   for file in *.php includes/*.php; do echo "Checking $file..."; php -l "$file" || exit 1; done
   ```
2. Dem Nutzer die Abschluss-Checkliste vorlegen und auf Rückmeldung warten:
   - **U1:** Finale ZIPs hochladen (`accordion-row.zip`, dann `accordion.zip`), „Cache leeren".
   - **U2:** Alle in Phase 1–3 angelegten Testseiten öffnen → Inhalte unverändert, keine Validierungsmeldungen, Frontend-Verhalten wie in AP-3.4 abgenommen (Gesamt-Regressionscheck).
   - **U3:** Container-Testseite aus AP-4.1 erneut prüfen → unverändert funktionsfähig.
   - **U4:** Einstellungen → Modulare Blöcke: beide neuen Blöcke gelistet und aktiv; die Beschreibung von „Accordion-Zeile" weist auf das Deaktivierungsverbot hin.
   - **U5:** Eine Zeile im Editor löschen und eine neue hinzufügen, speichern, Frontend prüfen → Nummerierung ist wieder fortlaufend, Verhalten korrekt.
   - **U6:** Konsole ohne rote Fehler; bei aktivem `WP_DEBUG` keine neuen PHP-Notices zu `accordion`.
3. Nach bestätigter Abnahme: `phase-4-accordion-integration` mit `git merge --no-ff` in `main` mergen, `main` pushen. Die Phasen-Branches nicht löschen (Historie).
4. Abschließenden Statusüberblick in die Statustabelle eintragen (alle APs ☑) und im Testprotokoll die Zeile „Phase 4 abgeschlossen / Projekt ausgeliefert" ergänzen.
5. Commit `AP-4.4: Abschluss-Abnahme und Auslieferung` und Push.

**Akzeptanzkriterien:**
- [ ] Deploy-Gate D1–D4 und der projektweite Syntaxcheck laufen ohne Fehler.
- [ ] Checkliste U1–U6 vom Nutzer durchgeführt und bestanden.
- [ ] `main` enthält alle vier Phasen (`git log --oneline main | head -20` zeigt die vier Merge-Commits) und ist auf `origin` gepusht.
- [ ] Statustabelle: alle APs ☑ oder mit dokumentierter Ausnahme.
- [ ] Testprotokoll enthält „Phase 4 abgeschlossen / Projekt ausgeliefert".

**Tests:**
- Technischer Test: Gates aus Schritt 1.
- Funktionaler Test: Checkliste U1–U6 (durch den Nutzer).
- Verifikation: `git status` sauber, `git log origin/main..main` leer (alles gepusht).

**Übergabenotiz:**

---

### AP-4.rev: Unabhängiges Review Phase 4 und Gesamtabnahme

**Status:** ☐ offen
**Umfang:** M
**Modell:** opus
**Abhängigkeiten:** AP-4.1, AP-4.2, AP-4.3, AP-4.4

**Ziel & Kontext:**
Letzte unabhängige Prüfung: Phase 4 gegen ihre Akzeptanzkriterien und das Gesamtvorhaben gegen Projektziel und Nicht-Ziele. Nur lesend, keine Datei verändern.

**Vorgehen:**
1. AP-4.1 bis AP-4.4 gegen ihre Akzeptanzkriterien prüfen.
2. Gesamtabnahme gegen Abschnitt 1 (Projektziel): Sind alle sechs zugesagten Funktionen im Code nachweisbar (exklusives Öffnen, Mehrfachmodus-Schalter, erste Zeile offen, Nummerierung, Alle öffnen/schließen, Deep-Linking) und im Testprotokoll als vom Nutzer geprüft dokumentiert?
3. Gesamtabnahme gegen Abschnitt 2 (Nicht-Ziele): `git diff --stat f6826a5..main` prüfen – keine Änderung an `includes/`, `webpack.config.js`, `create-*.js`, `package.json`, `modular-blocks-plugin.php` oder einem der 13 bestehenden Blöcke; keine neue npm-Abhängigkeit (`git diff f6826a5..main -- package.json` leer); keine CDN-URL in den neuen Blockdateien (`grep -rn "http://\|https://" blocks/accordion blocks/accordion-row` – Treffer nur in Kommentaren/Doku zulässig).
4. Dokumentationsprüfung: Enthalten `BLOCK-DEVELOPMENT.md`, beide `CLAUDE.md` und `reference_file_map.md` den neuen Stand, ohne Verweise auf nicht existierende Dateien?
5. Prüfen, dass das Testprotokoll für jede Phase einen Abschlusseintrag hat und keine funktionale Prüfung als bestanden markiert ist, für die keine Nutzer-Rückmeldung dokumentiert ist.
6. Befunde mit Schweregrad, Datei und Zeilennummer in die Übergabenotiz; abschließende Gesamtbewertung (ausgeliefert / mit Einschränkungen ausgeliefert / nachzuarbeiten).

**Akzeptanzkriterien:**
- [ ] AP-4.1 bis AP-4.4 gegen ihre Kriterien geprüft und belegt.
- [ ] Alle sechs Zielfunktionen mit Codefundstelle **und** Testprotokolleintrag belegt.
- [ ] Nicht-Ziele-Prüfung mit den vier `git`-/`grep`-Nachweisen aus Schritt 3 dokumentiert.
- [ ] Dokumentationsprüfung dokumentiert.
- [ ] Abschließende Gesamtbewertung abgegeben.
- [ ] Keine Datei verändert.

**Tests:**
- entfällt (Review-AP).

**Übergabenotiz:**

---

### AP-4.doc: Abschlussdokumentation

**Status:** ☐ offen
**Umfang:** S
**Modell:** sonnet
**Abhängigkeiten:** AP-4.rev

**Ziel & Kontext:**
Letzte Fortschreibung: Datei-Map vollständig, Erweiterungspunkt „Accordion erweitern" beschrieben, offene Punkte gesammelt, Plan abgeschlossen. Es wird weiterhin **keine** eigene `DOKUMENTATION.md` im Plugin angelegt – die Architektur-Doku des Plugins ist `CLAUDE.md` (so deklariert in der `DOKUMENTATION.md` des Website-Wurzelverzeichnisses).

**Betroffene Dateien:**
- `reference_file_map.md` (ändern)
- `PLAN-accordion-block.md` (ändern)

**Vorgehen:**
1. Übergabenotizen der Phase 4 durchgehen, insbesondere die Befunde aus AP-4.rev.
2. Datei-Map final abgleichen: `ls blocks/accordion blocks/accordion-row` gegen die gelisteten Zeilen; alle Dokumentationsdateien (`BLOCK-DEVELOPMENT.md`, `CLAUDE.md`, `PLAN-accordion-block.md`) haben Zeilen.
3. Abschnitt „Erweiterungspunkte" in der Datei-Map ergänzen (oder erweitern) mit einer knappen Anleitung: Wie fügt man dem Accordion eine weitere Option hinzu? (1. Attribut in `blocks/accordion/block.json`, 2. `ToggleControl` in `blocks/accordion/index.js`, 3. `data`-Attribut in `blocks/accordion/render.php`, 4. Auswertung in `blocks/accordion/view.js`, 5. `npm run build` + `npm run block-zips`, 6. nur `accordion.zip` hochladen, wenn nur der Eltern-Block betroffen ist.)
4. Abschnitt „Offene Punkte / bekannte Einschränkungen" in der Datei-Map: Screenshot-/PDF-Einschränkung, alle nicht behobenen mittleren/geringen Review-Befunde, sowie die bewusst ausgelassenen Nicht-Ziele, die als Wunsch wiederkehren könnten (z. B. Accordion-in-Accordion nicht getestet).
5. `_Stand:_`- und „Letzte Aktualisierung"-Daten aktualisieren; Statustabelle vollständig auf ☑ bringen; Testprotokoll abschließen.
6. Commit `AP-4.doc: Abschlussdokumentation` und Push auf `main`.

**Akzeptanzkriterien:**
- [ ] Jede Datei in `blocks/accordion/` und `blocks/accordion-row/` hat eine Zeile in der Datei-Map; kein Verweis zeigt auf eine nicht existierende Datei (`test -f` über alle gelisteten Pfade der beiden Blöcke).
- [ ] Der Erweiterungspunkt „weitere Accordion-Option hinzufügen" ist als sechsschrittige Anleitung dokumentiert.
- [ ] Offene Punkte und bekannte Einschränkungen sind gesammelt.
- [ ] Statustabelle und Testprotokoll dieses Plans sind vollständig und abgeschlossen.
- [ ] Es existiert **keine** `DOKUMENTATION.md` im Plugin-Verzeichnis.
- [ ] `main` ist gepusht (`git log origin/main..main` leer).

**Tests:**
- Stichprobe: Zwei zufällige Zeilen der Datei-Map gegen den echten Dateiinhalt prüfen.
- Vollständigkeitsprüfung: Anzahl der Dateien in beiden Blockordnern (`ls blocks/accordion blocks/accordion-row | wc -l`) mit der Anzahl der zugehörigen Zeilen in der Datei-Map vergleichen.

**Übergabenotiz:**

---

## 8. Status

Wird während der Ausführung gepflegt. Legende: ☐ offen · ◐ in Arbeit · ☑ erledigt · ✗ blockiert

| AP | Titel | Modell | Status | Abhängig von | Notiz |
|---|---|---|---|---|---|
| AP-1.1 | Versionierung verifizieren, Datei-Map anlegen | sonnet | ☑ | – | Commit `4898b13`, Branch `phase-1-accordion-grundlage` gepusht |
| AP-1.2 | Eltern-Block `accordion` anlegen | sonnet | ☑ | AP-1.1 | Commit `c993993`, Subagent parallel zu AP-1.3, `save()` ohne Wrapper (Abschnitt 11) |
| AP-1.3 | Kind-Block `accordion-row` anlegen | sonnet | ☑ | AP-1.1 | Commit `4c8718d`, Subagent parallel zu AP-1.2, Anker-Frage entschieden |
| AP-1.4 | Abnahme Phase 1 (Gates, Erst-Deploy) | sonnet | ◐ | AP-1.2, AP-1.3 | Gates D1–D4 bestanden, ZIPs liegen bereit; **wartet auf Nutzer-Checkliste U1–U10** |
| AP-1.rev | Unabhängiges Review Phase 1 | opus | ☐ | AP-1.1–AP-1.4 | nur lesend |
| AP-1.doc | Dokumentation Phase 1 | sonnet | ☐ | AP-1.rev | Merge in `main` |
| AP-2.1 | Optionen, Inspector, `data`-Attribute | sonnet | ☐ | AP-1.doc | Branch `phase-2-accordion-editor`, parallel zu AP-2.2 |
| AP-2.2 | Editor-Bedienung der Zeile | sonnet | ☐ | AP-1.doc | parallel zu AP-2.1 |
| AP-2.3 | Abnahme Phase 2 | sonnet | ☐ | AP-2.1, AP-2.2 | Nutzer klickt Checkliste U1–U11 |
| AP-2.rev | Unabhängiges Review Phase 2 | opus | ☐ | AP-2.1–AP-2.3 | nur lesend |
| AP-2.doc | Dokumentation Phase 2 | sonnet | ☐ | AP-2.rev | Merge in `main` |
| AP-3.1 | Frontend-Markup der Zeile fertigstellen | sonnet | ☐ | AP-2.doc | Branch `phase-3-accordion-frontend` |
| AP-3.2 | Frontend-Logik `view.js` | opus | ☐ | AP-3.1, AP-2.1 | Kernlogik, parallel zu AP-3.3 |
| AP-3.3 | Gestaltung, Nummerierung, Barrierefreiheit | sonnet | ☐ | AP-3.1 | parallel zu AP-3.2 |
| AP-3.4 | Abnahme Phase 3 (Kernabnahme) | sonnet | ☐ | AP-3.1–AP-3.3 | Nutzer klickt Checkliste U1–U17 |
| AP-3.rev | Unabhängiges Review Phase 3 | opus | ☐ | AP-3.1–AP-3.4 | nur lesend, Sicherheits-/a11y-Fokus |
| AP-3.doc | Dokumentation Phase 3 | sonnet | ☐ | AP-3.rev | Merge in `main`, Markup-Vertrag |
| AP-4.1 | CDB-Container-Integration, Regressionscheck | sonnet | ☐ | AP-3.doc | Branch `phase-4-accordion-integration` |
| AP-4.2 | InnerBlocks-Muster in BLOCK-DEVELOPMENT.md | sonnet | ☐ | AP-3.doc | parallel zu AP-4.1 |
| AP-4.3 | CLAUDE.md ×2 + Betriebswissen | sonnet | ☐ | AP-4.1 | braucht Ergebnis U6 aus AP-4.1 |
| AP-4.4 | Abschluss-Abnahme, Merge, Auslieferung | sonnet | ☐ | AP-4.1–AP-4.3 | Nutzer klickt Checkliste U1–U6 |
| AP-4.rev | Review Phase 4 + Gesamtabnahme | opus | ☐ | AP-4.1–AP-4.4 | nur lesend |
| AP-4.doc | Abschlussdokumentation | sonnet | ☐ | AP-4.rev | Projektabschluss |

## 9. Testprotokoll

Wird während der Ausführung gepflegt. Ein Eintrag pro abgeschlossenem AP und pro Phasenabschluss. Bei funktionalen Prüfungen in Spalte „Getestet von" vermerken, wer geklickt hat (Agent oder Nutzer).

| Datum | AP / Phase | Getestet | Ergebnis | Getestet von |
|---|---|---|---|---|
| 2026-08-03 | AP-1.1 | Git-Zustand (`remote`, `status`, Branch), Datei-Map-Stichproben (`class-block-manager.php`-Funktionen, Blockname `summary-block`), Zählprüfung 13 Blockordner ↔ 13 Tabellenzeilen | bestanden | Orchestrator (Opus) |
| 2026-08-03 | AP-1.2 | `php -l blocks/accordion/render.php`, JSON-Validierung `block.json`, Build-Ausgabe `build/blocks/accordion/`, `grep` auf `var(--` und Wrapper-freies `save()` | bestanden | Subagent (Sonnet), nachgeprüft vom Orchestrator |
| 2026-08-03 | AP-1.3 | `php -l blocks/accordion-row/render.php`, JSON-Validierung (`parent`, 1 Attribut, kein `viewScript`), 2× `wp_unique_id`, ARIA-Verknüpfung im Quelltext, `grep` auf `var(--` | bestanden | Subagent (Sonnet), nachgeprüft vom Orchestrator |
| 2026-08-03 | AP-1.4 (technischer Teil) | Gate D1 `php -l` (Kern + 2 neue `render.php`), D2 Lint informativ mit Bestandsvergleich (715/1258 Fehler), D3 `npm run build`, D4 `npm run block-zips` inkl. Inhaltskontrolle beider ZIPs | bestanden | Orchestrator (Opus) |
| offen | AP-1.4 (funktionaler Teil) | Checkliste U1–U10 im Live-WordPress nach Upload beider Block-ZIPs | ausstehend | Nutzer |

## 10. Dokumentation

- **Architektur-/Arbeitsdokumentation des Plugins:** `CLAUDE.md` im Plugin-Verzeichnis `Plugins/Eigene WP Blocks/`. Das ist die etablierte Konvention dieses Projekts (so deklariert in `DOKUMENTATION.md` im Website-Wurzelverzeichnis). **Es wird bewusst keine separate `DOKUMENTATION.md` im Plugin angelegt** – keine Parallelstruktur. Fortgeschrieben in AP-4.3.
- **Entwicklungs-Leitfaden für Blöcke:** `BLOCK-DEVELOPMENT.md` im Plugin-Verzeichnis. Erhält in AP-4.2 den Abschnitt zum InnerBlocks-Eltern/Kind-Muster.
- **Datei-Map:** `reference_file_map.md` im Plugin-Verzeichnis – neu angelegt in AP-1.1, gepflegt von **jedem** AP, das Dateien anlegt oder wesentlich ändert, final abgeglichen in AP-4.doc. Enthält zusätzlich die Abschnitte „Accordion-Optionen", „Accordion – Markup-Vertrag", „Erweiterungspunkte" und „Offene Punkte".
- **Projektüberblick:** `CLAUDE.md` im Website-Wurzelverzeichnis (Blockliste, Plugin-Kompatibilität) – fortgeschrieben in AP-4.3.
- **Dieser Plan:** `Plugins/Eigene WP Blocks/PLAN-accordion-block.md` – Statustabelle und Testprotokoll sind Teil der Projekthistorie und werden nicht bereinigt.

## 11. Planänderungen während der Ausführung

Nach Regel 16: bestehende AP-Texte bleiben stehen, Änderungen werden hier ergänzt. Bei Widersprüchen gilt dieser Abschnitt.

### Änderung 1 – `save()` ohne Wrapper in beiden Blöcken (entschieden vor AP-1.2/AP-1.3, 2026-08-03)

**Ursprünglich geplant:** `save()` gibt `<InnerBlocks.Content />` im `useBlockProps.save()`-Wrapper zurück.
**Jetzt gültig:** `save()` gibt in **beiden** Blöcken ausschließlich `<InnerBlocks.Content />` zurück, ohne jedes umgebende Element.

**Begründung:** Bei einem dynamischen Block mit InnerBlocks reicht WordPress das gespeicherte `save()`-Markup als `$block_content` an `render.php` weiter. Ein `save()`-Wrapper wäre damit nicht *statt*, sondern *innerhalb* des von `render.php` erzeugten Wrappers gelandet – pro Zeile zwei verschachtelte `div`s. Schwerwiegender: `useBlockProps.save()` schreibt den HTML-Anker (`supports.anchor`) als `id` in genau diesen inneren Wrapper, sodass der Deep-Link-Anker auf einem Element gelegen hätte, das `render.php` nicht kontrolliert und das nicht das äußere Zeilenelement ist.

**Auswirkungen auf Folge-APs:**
- **AP-3.1:** Die dort vorgesehene empirische Prüfung, ob WordPress den Anker selbst als `id` ausgibt, entfällt. Da `save()` keinen Wrapper erzeugt, kann WordPress das nicht tun – `render.php` setzt die `id` immer selbst (bereits in AP-1.3 umgesetzt: `sanitize_html_class($block_attributes['anchor'])` als `id` an `get_block_wrapper_attributes()`). AP-3.1 muss dieses Verhalten nur erhalten.
- **AP-4.2:** Diese Begründung gehört in den dort zu schreibenden Abschnitt „Eltern-/Kind-Blöcke mit InnerBlocks" – sie ist die eigentliche Falle des Musters.
- Nachweis der Wirksamkeit: Prüfpunkt **U10** in AP-1.4 (Anker erscheint genau einmal am äußeren Zeilen-`div`).

### Änderung 2 – Gate D2 (Lint) ist informativ, nicht blockierend (entschieden in AP-1.4, 2026-08-03)

**Ursprünglich geplant:** „Lint der beiden neuen Blöcke ohne Fehler" als hartes Gate und als Akzeptanzkriterium in AP-1.2, AP-1.3, AP-2.1, AP-2.2, AP-3.1, AP-3.2, AP-3.3.
**Jetzt gültig:** `php -l` (D1) bleibt hartes Gate. `npx wp-scripts lint-js` / `lint-style` laufen weiterhin bei jedem Gate-Durchlauf, aber als **informativer Check**. Bestanden ist er, wenn **keine Fehlerklasse auftritt, die der Bestand nicht ebenfalls aufweist**. Das Ergebnis wird im Testprotokoll mit Zahlen dokumentiert.

**Begründung (gemessen, nicht vermutet):** Der Bestand erfüllt den `wp-scripts`-Lint-Standard nirgends – `blocks/multiple-choice` meldet 715, `blocks/summary-block` 1258 Fehler. Der Großteil ist `prettier/prettier`: Der Standard verlangt Tabs, das gesamte Projekt ist mit 4 Leerzeichen geschrieben. Ein `--fix` über die neuen Blöcke hätte sie als einzige Dateien des Projekts auf Tabs umgestellt und damit stilistisch aus der Codebasis herausgelöst. Auch die Meldung `react-hooks/rules-of-hooks` zu `useBlockProps` im `edit`-Callback ist Projektstandard (6× im Bestand) und entsteht daraus, dass Gutenberg-Blöcke ihre Edit-Funktion als Objekt-Property `edit:` statt als großgeschriebene Komponente definieren. Konsistenz mit der Codebasis wiegt hier schwerer als ein formaler Lint-Haken; `CLAUDE.md` führt ohnehin nur `php -l` als verbindliches Gate.

**Wenn das anders gewünscht ist:** Ein projektweiter `npx wp-scripts lint-js --fix` über alle Blöcke wäre die konsistente Alternative – das ist aber ein eigenes Vorhaben (berührt alle 13 bestehenden Blöcke und damit ein Nicht-Ziel dieses Plans) und müsste gesondert beauftragt werden.

### Änderung 3 – Prüfpunkt U10 in AP-1.4 ergänzt (2026-08-03)

Die Anker-Prüfung aus AP-1.3 ist als Prüfpunkt U10 in die Abnahme-Checkliste von AP-1.4 gewandert, weil sie nur im Live-Frontend nachweisbar ist. Ergebnis fließt in AP-3.2 (Deep-Linking) ein.
