# Marvel Champions – Kampagnen-Logbuch

Digitaler Ersatz für den gedruckten Kampagnenbogen von *Marvel Champions: The Card Game*.
Eintippen statt ausdrucken: automatisch gespeichert, zweisprachig, teilbar, druckbar.

**Live:** https://tombuzi.github.io/marvel_champions_campaign_log/

Umgesetzt ist zunächst die Kampagne **Fear No Evil (MC60)**. Weitere Kampagnen kommen
als jeweils eigenes Modul dazu — siehe [Eine Kampagne hinzufügen](#eine-kampagne-hinzufügen).

> Inoffizielles Fan-Projekt. Siehe [Rechtliches](#rechtliches).

---

## Was die App kann

* **Der ganze Bogen** — vier Spielerplätze mit Identität und verbleibenden Trefferpunkten,
  die fünf Szenarien mit Schurken-Zuordnung und Fortschritt, die aus der Kampagne
  entfernten Verbündeten und Persona-Unterstützungen, und die beiden Kampagnen-Marken.
* **Mehrere Durchläufe** parallel, mit Auswahl oben; die Kampagne wird beim Anlegen
  gewählt und bleibt danach fest.
* **Automatisch gespeichert** im Speicher des Browsers — kein Server, kein Konto,
  keine Übertragung irgendwohin.
* **Export / Import** als JSON, und **Link teilen**: der komplette Bogen steckt
  komprimiert in der Adresse.
* **Druckansicht** als reine Textfassung in Schwarzweiß, damit nichts abgeschnitten wird.
* **Deutsch und Englisch**, hell und dunkel, beides umschaltbar und gespeichert.
* Läuft auch offline und direkt von der Festplatte (`file://`).

### Fortschritt, „1“, „2“, „Gescheitert“

Auf dem Bogen sehen die drei Kästchen wie drei einzelne Häkchen aus, sind aber
**ein Zähler**: Jede Runde werden zwei Szenarien gezogen, die weder abgeschlossen
noch gescheitert sind, und beide bekommen einen Fortschrittspunkt — der dritte Punkt
bedeutet, dass das Szenario gescheitert ist. In der App setzt ein Klick den Zähler auf
dieses Kästchen; ein Klick auf das oberste gefüllte Kästchen nimmt einen Punkt zurück,
so kommt man auch wieder auf null. Gespeichert wird deshalb nur `progress: 0..3`;
„gescheitert“ ist daraus abgeleitet und kein eigenes Feld.

**„Abgeschlossen“ und „Gescheitert“ schließen sich aus** und sperren einander:
Ein Haken bei „Abgeschlossen“ friert den Fortschritt ein — die gesetzten Kästchen
bleiben sichtbar, sind aber nicht mehr bedienbar. Umgekehrt sperrt ein gescheitertes
Szenario den Abgeschlossen-Haken. Wer es doch ändern will, nimmt zuerst das jeweils
andere zurück; ein Tooltip sagt das an den gesperrten Kästchen auch.

Die Sperre gilt nur, **solange die Zeile widerspruchsfrei ist**. Ein importierter oder
handeditierter Bogen kann beides gesetzt haben — dann blieben beide Bedienelemente
gesperrt und die Zeile wäre nicht mehr zu reparieren. In diesem Fall bleiben deshalb
beide bedienbar, bis eines geklärt ist. `normalize()` wählt bewusst keinen Gewinner:
welche der beiden Angaben gemeint war, ist nicht zu erraten.

### Erledigt-Markierung

Eine Tilde `~` am Anfang eines Listeneintrags streicht ihn durch, ohne ihn zu löschen.
Beim Hineinklicken erscheint der Rohtext wieder.

---

## Speicherkonzept

Alles liegt in `localStorage` dieses Browsers, unter fünf Schlüsseln:

| Schlüssel | Inhalt |
|---|---|
| `mcclog:logs` | alle Bögen, `{ [id]: Bogen }` |
| `mcclog:activeId` | welcher Bogen gerade offen ist |
| `mcclog:lang` | `de` oder `en` |
| `mcclog:theme` | `light`, `dark` oder nicht gesetzt (System folgen) |
| `mcclog:exported` | wann welcher Bogen auf **diesem Gerät** zuletzt exportiert wurde |

Der Browser-Speicher ist **kein Langzeitarchiv**: Browser räumen ihn unter Platzmangel
auf, und iOS-Safari leert ihn nach sieben Tagen ohne Besuch — genau der Rhythmus einer
Kampagne, die man alle paar Wochen weiterspielt. Die App bittet um dauerhaften Speicher
(`navigator.storage.persist()`) und erinnert nach 14 Tagen an eine Sicherung, aber die
verlässliche Kopie ist der JSON-Export.

### Bögen, die diese Version nicht lesen kann

Ein Bogen aus einer neueren Version der App, aus einer unbekannten Kampagne oder mit
einer neueren Fassung eines Bogens wird **nicht** angefasst: er bleibt Byte für Byte
liegen, wird in der Auswahl mit `⚠` markiert und zeigt statt des Bogens einen Hinweis.
Wechseln, Löschen, Exportieren und Teilen funktionieren weiter. Normalisieren würde die
unbekannten Felder wegwerfen und der Schaden würde über Export und Share-Link auf das
Gerät weiterwandern, das den Bogen noch richtig lesen kann. Dasselbe gilt beim Import:
eine plausible, aber hier nicht darstellbare Datei wird verbatim gespeichert statt
abgelehnt — sie ist womöglich die einzige Kopie.

---

## Aufbau

Kein Build-Schritt, keine Abhängigkeiten, keine ES-Module — deshalb läuft die Seite
auch über `file://` und direkt aus dem Repo-Root über GitHub Pages.

| Datei | Aufgabe |
|---|---|
| `index.html` | Rahmen: Topbar, Menü, Dialoge, Hinweisbereich, Druckcontainer. Enthält kein Markup einer bestimmten Kampagne. |
| `styles.css` | Design-Tokens (hell / dunkel / Druck), Comic-Optik, Tabelle samt Schmalvariante, Listen, Menü, Dialoge |
| `core.js` | Speichern, mehrere Bögen, Quarantäne, Export/Import, Share-Link, Druck, Sprache, Theme, Kampagnen-Registry |
| `widgets.js` | wiederverwendbare Bausteine: Checkbox, Zahlenfeld, Textfeld, Auswahl mit Ausschluss, Fortschrittszähler, String-Liste mit Drag&Drop |
| `i18n.js` | `window.I18N = { de, en }` — nur Strings des Rahmens |
| `heroes.js` | 66 Helden (Name, Trefferpunkte) als Vorschlagsliste für die Identitätsfelder |
| `campaigns/fear-no-evil.js` | die Kampagne MC60: eigenes Datenmodell, eigenes Rendering, eigene Strings |
| `test/lint.js` | Prüfungen ohne Browser: Wörterbücher, Kampagnendefinition, Datenmodell, Paketierung |
| `test/selftest.html`, `test/run-browser.js` | Selbsttest, der die echte Seite in einem iframe fernsteuert |
| `fonts/` | Exo 2 (OFL, selbst gehostet), `OFL.txt` daneben |

### Warum ein Modul pro Kampagne

Die Kampagnen von Marvel Champions unterscheiden sich mechanisch massiv — ein
gemeinsames, generisches Datenmodell für alle wäre erzwungen und würde beim nächsten
Sonderfall brechen. Geteilt wird deshalb nur die Infrastruktur; jede Kampagne bringt
ihr eigenes State-Shape und ihr eigenes Rendering mit.

`core.js` weiß über einen Bogen nur: *ist ein JSON-Objekt, gehört zu Kampagne X,
Version N.*

### Eine Kampagne hinzufügen

1. `campaigns/<id>.js` anlegen und `window.registerCampaign({...})` aufrufen:

   ```js
   window.registerCampaign({
     id: "rise-of-red-skull",   // stabil, wandert in jeden Bogen
     code: "MC10",
     titleEn: "…", titleDe: "…",
     theme: "trors",            // -> <html data-campaign="trors">
     stateVersion: 1,
     scenarioCount: 5,
     emptyState: function () {…},           // DOM-frei
     normalize: function (raw) {…},         // DOM-frei, wirft nie
     migrate: function (raw, from) {…},     // ab stateVersion 2 Pflicht, DOM-frei
     render: function (root, ctx) {…},
     renderPrint: function (root, ctx) {…},
     i18n: { de: {…}, en: {…} },
     helpDe: "…", helpEn: "…",
   });
   ```

2. Das Skript in `index.html` **nach** `core.js` einhängen. Die Reihenfolge der
   Skripte ist die Reihenfolge in der Bogen-Auswahl und im Dialog „Neuer Bogen“.
3. `node test/lint.js` — die Definition, die Wörterbücher und die Idempotenz von
   `normalize()` werden dann automatisch mitgeprüft.

`ctx` liefert `{ state, lang, t(key, …args), save(), rerender(), w }`; `w` ist die
Widget-Sammlung aus `widgets.js`.

**Harte Regel:** `emptyState`, `normalize` und `migrate` dürfen das DOM nicht berühren —
weder beim Laden noch beim Aufruf. Nur dadurch kann `test/lint.js` sie kopflos
durchtesten, und genau dieser Test fängt die Fehler, die sonst erst als kaputter
Bogen auffallen.

---

## Lokal starten und prüfen

```bash
python -m http.server 8137          # dann http://127.0.0.1:8137/
node test/lint.js                   # Prüfungen ohne Browser
node test/run-browser.js            # Selbsttest im echten Browser (107 Assertions)
node test/run-browser.js print      # nur ein Fall: basic | quarantine | share | lang |
                                    #   print | import | lock | lockconflict
BROWSER_LANG=de-DE node test/run-browser.js   # unter einer anderen Browser-Sprache
```

`test/seed.html` legt einen ausgefüllten Beispielbogen an und springt in die App —
praktisch für Screenshots und für den Druckvergleich.

Der Selbsttest sucht Edge oder Chrome selbst; mit `BROWSER=/pfad/zum/chrome` lässt sich
das überschreiben. Findet er keinen, bricht er mit Code 2 ab und sagt ausdrücklich,
dass **nicht** getestet wurde — ein Skip ist kein Erfolg.

Die Browser-Sprache ist auf `en-US` festgenagelt (`BROWSER_LANG` überschreibt das).
Das ist Absicht: ohne gespeicherte Präferenz leitet die App ihre Sprache aus
`navigator.language` ab, und Testfälle, die deutsche Wortlaute prüfen, hingen dadurch
an der Sprache des Rechners — auf einem deutschen Desktop grün, in CI rot. Die Fälle
setzen die App-Sprache jetzt selbst, und der Runner läuft absichtlich unter einer
nicht-deutschen Locale, damit dieselbe Annahme nicht wieder durchrutscht. Die
Auto-Erkennung selbst wird gegen `navigator.language` geprüft, nicht gegen eine
festverdrahtete Sprache.

CI (`.github/workflows/ci.yml`) fährt alle drei Schritte bei jedem Push.

---

## Gestaltung

Die Optik ist dem offiziellen MC60-Bogen nachempfunden, aber ausschließlich mit
eigenen Mitteln: die Palette wurde aus dem PDF gemessen, die Schrift ist **Exo 2**
(die Textschrift des Bogens, OFL-1.1, selbst gehostet in `fonts/`), und Halbtonraster,
Schraffur, Tuschekonturen und die harten Versatzschatten sind CSS-Gradienten und
Rahmen. Die Displayschrift des Bogens (Komika Title) ist nicht weiterverteilbar;
an ihrer Stelle steht Exo 2 ExtraBold Italic.

Farb-Tokens sind viermal deklariert: hell, `prefers-color-scheme: dark`, die
ausdrücklichen `[data-theme]`-Überschreibungen und noch einmal in `@media print`
(dort alles schwarz auf weiß). Vordergrundfarben, die auf einer *festen* Fläche
sitzen — Gelb, Warnrot, die Seitenfläche —, haben eigene `--on-*`-Tokens, weil das
Theme sonst hell und dunkel gegeneinander verdreht.

`prefers-reduced-motion` schaltet Animationen ab.

---

## Rechtliches

Dies ist ein inoffizielles, nicht kommerzielles Fan-Projekt.

„Marvel Champions: Das Kartenspiel“ sowie alle zugehörigen Szenario-, Karten- und
Produktnamen sind urheberrechtlich geschützt durch Fantasy Flight Games / Asmodee;
alle Marvel-Charaktere, -Namen und -Logos sind Marken und © MARVEL. Diese Seite wird
von Fantasy Flight Games, Asmodee und Marvel weder produziert noch unterstützt oder
befürwortet und steht in keiner Verbindung zu ihnen.

Als Regel für dieses Repository:

1. **Keine** offiziellen Logos, Artworks, Kartenbilder, Icons oder Scans — nirgends,
   auch nicht als Favicon.
2. Die Ähnlichkeit entsteht nur über Farbe und Typografie.
3. Wiedergegeben werden nur **Namen** (Szenarien, Schurken, Helden) und die
   Feldbezeichnungen des Bogens — ohne sie wäre die App neben dem Spielmaterial
   unbrauchbar.
4. **Kein Kartentext, kein Regeltext, keine Regelbuch-Prosa.** Erklärungsbedürftige
   Felder werden in der Hilfe in eigenen Worten beschrieben.
5. Der originale Kampagnenbogen (`mc60_campaign_log.pdf`) ist in `.gitignore` und
   liegt nur lokal als Layout-Referenz. Sein Fußtext erlaubt „print or photocopy for
   personal use“ — das deckt nicht, ihn hier öffentlich weiterzuverbreiten. Wer ihn
   braucht, bekommt ihn beim Herausgeber.

### Hinweise zu den Namen

* **Schurken- und Heldennamen bleiben in beiden Sprachen englisch.** Das ist die
  Konvention der deutschen Ausgabe: dort behalten Figuren ihre Namen (Rhino, Klaw,
  Ultron), übersetzt werden nur Szenario- und Hauptplan-Namen.
* **Die deutschen Szenarionamen sind vorläufig.** Von MC60 gibt es noch keine
  offizielle deutsche Ausgabe; die Übersetzungen stehen als Entwurf in
  `campaigns/fear-no-evil.js` und sind je eine Zeile zu korrigieren. Es migriert
  nichts, weil gespeichert nur der Slug wird.
* **Daredevil und Echo haben keine Trefferpunkte** in `heroes.js`, solange die
  Kartendaten sie nicht kennen. Ein erfundener Wert wäre schlechter als keiner, also
  bleibt der Hinweis neben dem Feld dort einfach leer.
