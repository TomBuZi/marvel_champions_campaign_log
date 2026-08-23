# Arbeitsanleitung für Claude Code

Dieses Repo ist das **Marvel Champions Kampagnen-Logbuch**: eine statische Seite
ohne Build-Schritt, ohne Abhängigkeiten, ausgeliefert über GitHub Pages. Ein
Modul pro Kampagne unter `campaigns/`, der Rahmen in `core.js`.

**Konventionen, bevor du etwas schreibst**

* Kommentare im Code: **Englisch**, und sie sagen *warum*, nicht *was*.
* README und dieses Dokument: **Deutsch**.
* Commit-Nachrichten: **Englisch**, Prosa statt Stichpunkte, sie erklären den
  Grund und benennen Fallstricke. Am Ende die `Co-Authored-By`-Zeile.
* Kein ES-Modul, kein `let`/`const` in den Kampagnenmodulen — die laufen auch
  über `file://` und halten sich an den Stil der Nachbarmodule.
* `node test/lint.js` und `node test/run-browser.js` sind die einzigen Prüfungen.
  Beide müssen grün sein, bevor etwas eingecheckt wird.

Der **Modulvertrag** (`registerCampaign`, `emptyState`, `normalize`, `migrate`,
`render`, `renderPrint`, `i18n`, `helpDe`/`helpEn`) steht in der README unter
„Eine Kampagne hinzufügen". Hier steht der *Weg*, nicht der Vertrag.

---

## Eine neue Kampagne anlegen

### 0. Vorbereitung

Den offiziellen Kampagnenbogen als PDF ins Repo-Wurzelverzeichnis legen. `*.pdf`
ist **gitignoriert** — das Referenzmaterial des Herausgebers wird nicht
mitveröffentlicht, es liegt nur lokal.

```bash
git checkout -b preview/<kurzname>
```

### 1. Den Bogen lesen, nicht erfinden

```bash
pdftotext -layout mcXX_....pdf -          # Feldnamen wörtlich
```

Dazu die Seite ansehen, um Anordnung und Gruppierung zu verstehen:

```python
import fitz
pg = fitz.open("mcXX_....pdf")[0]
pg.get_pixmap(dpi=110).save("<tmp>/bogen.png")
```

**Streng feldtreu.** Was nicht gedruckt ist, kommt nicht in den Bogen: keine
Szenario-Tabelle, kein „Abgeschlossen", kein Fortschritt, keine Notizen, wenn
das Original sie nicht hat. Fehlende Abschnitte sind eine Aussage über den
Bogen, kein Versäumnis — und der Dateikopf des Moduls sagt das ausdrücklich,
sonst „reparieren" spätere Leser es.

Was der Bogen mehrfach gleich sagt, wird **eine** Überschrift über benannten
Kästchen (siehe `lblAddedToPool` in MC21). Das Häkchen ist das „check here".

**Zellen zählt man an den Trennlinien, nicht am Bild.** Wie viele Kästchen ein
Abschnitt hat, steht in den Vektorlinien des Content-Streams — Rasterbilder
täuschen, und Abzählen mit dem Auge auch:

```python
import fitz
pg = fitz.open("mcXX_....pdf")[1]
for d in sorted(pg.get_drawings(), key=lambda d: d["rect"].y0):
    r = d["rect"]
    print("y %7.1f-%7.1f  x %7.1f-%7.1f" % (r.y0, r.y1, r.x0, r.x1))
```

Bei MC27 hat das die Gitter 2×2, 3×2 und 1×3 ergeben und die sieben Stufen der
Reputationsleiste — die Trennlinien laufen genau durch die Kreismittelpunkte.
Eine solche Ableitung gehört gegengeprüft: dass die Osborn-Tech-Strafe in genau
drei Stufen auftaucht und der Bogen genau drei Osborn-Tech-Zellen druckt, war
der Beleg, dass die Zeilenzahl stimmt.

**Die Kartensätze kommen aus `C:\Repos\marvelsdb-json-data`**, nicht aus dem
Gedächtnis: `sets.json` nennt die Sets einer Kampagne (`community_service`,
`osborn_tech`, …), `pack/<pack>.json` die Karten mit ihrem `set_code`, und
`translations/de/pack/<pack>.json` die deutschen Namen, soweit es sie dort gibt.
Die Kampagnenkarten fehlen teils, aber die Encounter-Sets sind vollständig.

### 2. Farben aus dem PDF

Nicht das Rasterbild abtasten — die **Vektor-Füllflächen** des Content-Streams,
gewichtet nach Fläche. Das ist die Methode, die die Kommentare in `styles.css`
für alle Paletten behaupten, und sie muss stimmen.

```python
import fitz, collections
pg = fitz.open("mcXX_....pdf")[0]
area = collections.Counter()
for d in pg.get_drawings():
    col, r = d.get("fill"), d["rect"]
    if not col:
        continue
    a = abs(r.width * r.height)
    if a > 0:
        area["#%02X%02X%02X" % tuple(int(round(c * 255)) for c in col)] += a
total = sum(area.values()) or 1
for hexs, a in area.most_common(12):
    print("  %s  %6.2f%%" % (hexs, 100.0 * a / total))
```

Dann die Rollen vergeben (`--bar` Konturen, `--page` Seitenfläche, `--panel-1/-2`
Verlauf, `--pill` Überschriften, `--check` leeres Kästchen, `--zap` Akzent,
`--ink` Text). **Kontraste rechnen**, nicht schätzen: jedes Paar, das Text
trägt, gegen die vorhandenen Paletten messen und notfalls nachdunkeln — MC10s
`--brick` und MC21s `--page` sind genau deshalb dunkler als gedruckt.

### 3. Palette eintragen — vier Blöcke

In `styles.css` **vier** Blöcke, nach dem Muster der vorhandenen:
`:root[data-campaign="x"]`, derselbe in `@media (prefers-color-scheme: dark)`,
`[data-theme="light"]`, `[data-theme="dark"]`. Ein einzelner Block ist
spezifischer als das bloße `:root` in der Dark-Media-Query und würde im
Dunkelmodus die helle Palette malen.

**Der Dunkelmodus muss dieselben Farben tragen wie der Hellmodus**, nicht nur
die dominante. Eine Kampagne, die hell aus Indigo, Rost, Creme und Gold besteht,
darf dunkel nicht nur indigo sein — sonst liest sie sich wie eine andere
Kampagne. Wenn der Akzent im *Haken* lebt (hell: farbiges Kästchen, goldener
Haken), braucht der Dunkelmodus `--check-on` für den angehakten Zustand;
Standard ist `var(--bar)`, andere Kampagnen bleiben also unberührt.

### 4. Modul schreiben

Vorlagen, bewusst verschieden:

| Datei | Charakter |
|---|---|
| `campaigns/fear-no-evil.js` | abgeleiteter Zustand, gegenseitige Sperren, Auslosung, `migrate()` |
| `campaigns/rise-of-red-skull.js` | feste Kartenpools mit Eindeutigkeitsregeln |
| `campaigns/mad-titans-shadow.js` | das schlankeste: Spieler plus benannte Kästchen |
| `campaigns/sinister-motives.js` | eine Zahl, aus der zwei abgeleitete Zustände fallen: erreichte Stufen und freigeschaltete Felder; dazu eine Liste, in der die Position Teil der Eintragung ist |

Harte Punkte:

* `emptyState`, `normalize`, `migrate` fassen **das DOM nicht an** — `lint.js`
  fährt sie kopflos und prüft, dass `normalize()` ein Fixpunkt ist.
* `stateVersion: 1` heißt kein `migrate()`. Ab 2 ist es Pflicht — und eine
  Migration, die ein Feld hinzufügt, muss überlegen, was der Standardwert für
  **bestehende** Bögen bedeutet. (MC60 hat gelernt: `expert: false` versteckte
  eingetragene Lebenspunkte.)
* Kartennamen als Tabelle mit `en` und `de`. `de: null` zeigt den englischen
  Namen; `de: ""` ist verboten und wird von `lint.js` gefangen.
* Ein englisch angezeigter Name trägt `lang="en"`, ein übersetzter nicht.
* Expertenmodus, falls die Kampagne einen hat: **Ausblenden ist nicht Löschen.**
* Alle Beschriftungen über `i18n`, in beiden Sprachen, dazu `helpDe`/`helpEn`.

**Zweisprachig anlegen, englisch befüllen, deutsch trägt der Herausgeber nach.**
Das ist das Vorgehen für neue Kampagnen. Es zerfällt in zwei Gruppen, und die
Unterscheidung ist der ganze Punkt:

* Wörter, die **die App selbst wählt** — Spaltentitel, Platzhalter, Hinweise und
  das gemeinsame Vokabular aller Kampagnen („Verbleibende Lebenspunkte") — werden
  sofort auf Deutsch eingetragen. Das gemeinsame Vokabular wird aus einem
  vorhandenen Modul **wörtlich** übernommen, nicht neu formuliert.
* Wörter, die **vom gedruckten Bogen kommen** — Abschnittsnamen, ihre
  Unterzeilen, Regeltexte, Legenden — stehen zunächst in beiden Wörterbüchern
  englisch. Leere Werte fängt `lint.js`, also ist der englische Wortlaut der
  Platzhalter. Darüber ein Kommentarblock, der sagt, dass das offene Arbeit ist
  und aus dem deutschen Druck **wörtlich** nachzutragen.

Dieselbe Zweiteilung gilt für `de: null` in den Kartentabellen, und dort ist sie
am leichtesten zu verwechseln: bei MC10 und MC21 heißt `null` „bleibt im
deutschen Druck englisch" — eine **Entscheidung**. Bei MC27 heißt es „noch nicht
eingetragen" — **offene Arbeit**. Der Kommentar muss sagen, welches von beiden
gemeint ist, sonst räumt ein späterer Leser das Falsche auf.

Dann in `index.html` einhängen (`<script src="campaigns/....js">`). Die
Reihenfolge dort ist nur noch die Registrierung — **angezeigt** wird nach
MC-Nummer sortiert (`campaignsByCode()` in `core.js`).

### 5. Tests

* **`test/lint.js`** findet neue Module selbst. Einen `if (def.id === "…")`-Block
  ergänzen: Standardstufe als Vorgabe, Felder als echte Booleans, versteckte
  Werte überleben, fremde Felder fallen weg.
* **`test/selftest.html`**: drei Fälle nach dem Muster `<kürzel>`,
  `<kürzel>expert`, `<kürzel>print`.
* **`test/run-browser.js`**: den Fall in die `CASES`-Tabelle eintragen —
  **mit Mindestzahl an Zusicherungen**. Die Zahl ist kein Schmuck: ein Fall, der
  mittendrin eine Ausnahme wirft, meldet keinen Fehler, sondern nur weniger
  Zeilen. Beim Hinzufügen von Zusicherungen die Zahl im selben Commit anheben.
* Ein frischer Besuch zeigt den **Kampagnen-Dialog**, es entsteht kein Bogen von
  selbst. Ein Fall, der einen Bogen braucht, ruft
  `answerCampaignDialog(d, "<id>")` als Erstes in seinem Boot-Callback.

**Zusicherungen nicht an Vergängliches nageln.** Keine festen Kampagnenzahlen
(`radios.length === 2`), keine Positionen (`radios[1]`), keine ausgeschriebenen
Beschriftungen in *negativen* Prüfungen — sonst hört die Prüfung beim nächsten
Umbenennen still auf zu prüfen. Ableiten: aus den Skript-Tags, nach Wert
auswählen, gegen die eigene Sortierung vergleichen.

### 6. Prüfen

```bash
node test/lint.js
node test/run-browser.js                  # ~10 Minuten — im Hintergrund starten
node test/run-browser.js <kürzel> …       # einzelne Fälle beim Entwickeln
```

Und **hinsehen**, hell und dunkel — Farben prüft kein Test:

```bash
python -m http.server 8731 --bind 127.0.0.1 &
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --no-sandbox --user-data-dir=<tmp>/profil \
  --window-size=1280,900 --virtual-time-budget=12000 --screenshot=<tmp>/hell.png \
  "http://127.0.0.1:8731/test/seed.html?c=mcXX&theme=light"
```

`test/seed.html` braucht dafür einen Beispielbogen der neuen Kampagne unter
`?c=mcXX`. Auch die bestehenden Kampagnen einmal ansehen: eine neue Regel in
`styles.css` kann sie mit treffen.

### 7. Vorschau

Push auf `preview/<kurzname>`. `.github/workflows/preview.yml` spiegelt den
Branch nach `preview/<kurzname>/` auf `main` — **gleiche Origin wie die
Produktion**, und genau das ist der Zweck: echte gespeicherte Bögen und alte
`#log=`-Links sind dort testbar, ohne etwas zu kopieren.

Nach dem Push auf den Spiegel-Commit warten (`git fetch` und `origin/main`
ansehen), erst dann ist die Vorschau-URL aktuell.

### 8. Nach `main` holen

```bash
git checkout main && git merge --ff-only origin/main
git merge --no-ff preview/<kurzname> -F <nachrichtendatei>
node test/lint.js && node test/run-browser.js      # auf main, vor dem Push
git push origin main
git push origin --delete preview/<kurzname>
git branch -d preview/<kurzname>
```

**Kein Fast-Forward:** die Spiegel-Commits der Automatik liegen auf `main`, es
ist also ein echter Merge — konfliktfrei, weil `preview/**` nur dort existiert.
Das Löschen des Branches löst den `delete`-Trigger aus, der das
Spiegelverzeichnis selbst wieder wegräumt; danach prüfen, dass unter `preview/`
nichts übrig ist.

---

## Fallstricke, die schon Zeit gekostet haben

* **Übersetzungen brechen Tests.** Sobald deutsche Kartennamen eingetragen sind,
  scheitert jede Zusicherung, die den englischen erwartet. Erwartungen auf die
  angezeigte Sprache ziehen und die Sprach-Tag-Prüfung als *Äquivalenz*
  schreiben, damit sie den nächsten gefüllten Namen überlebt.
* **i18n-Texte, die etwas über den Bildschirm behaupten.** `helpDe`/`helpEn`
  beschreiben die Oberfläche. Wird die Oberfläche geändert, werden sie sonst zur
  Lüge — bei jeder Änderung mitlesen.
* **Terminologie über alle Kampagnen hinweg.** Dasselbe Feld heißt überall
  gleich („Verbleibende Lebenspunkte"). Eine Umbenennung in einer Kampagne ist
  keine halbe Arbeit: README, Hilfetexte und Tests gehören dazu.
* **`git checkout -- <datei>` wirft ungestagte Arbeit weg.** Für einen
  Sabotage-Test (beißt der Wächter?) über eine Kopie oder `.bak` gehen und so
  zurücksetzen, nie über `git checkout`.
* **Ein hängender Testlauf.** Die Suite kann sich in einem Fall festsetzen; das
  Zeitbudget greift bei einem festhängenden Renderer nicht. Der laufende Fall
  steht im Prozessnamen des Browsers (`…/mcclog-test-XXXX/p_<fall>`). Stille ist
  kein Fortschritt — Prozesse ansehen, nicht warten.
* **Die Suite dauert.** Im Hintergrund starten, nicht in ein Timeout laufen
  lassen, und die **Zahl** der Zusicherungen lesen, nicht nur die Fehlerzahl.
