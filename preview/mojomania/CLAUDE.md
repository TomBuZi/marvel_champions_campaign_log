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

**Erst nachsehen, ob der Bogen überhaupt Vektorgrafik ist.** `pg.get_images()`
und `pg.get_image_info()` sagen es. MC32 legt ein Rasterbild über die ganze
Seite und je eins über jeden Panelstreifen; die orange Comic-Schraffur seines
Randes kommt deshalb in **keiner** Vektorfläche vor, und die reine
Vektormessung übersieht die auffälligste Farbe des Bogens vollständig. Wo die
Kunst Raster ist, wird dort gemessen — aus dem gerenderten Pixmap, flächen­weise
gemittelt — und der Kommentar in `styles.css` sagt, welcher Wert woher kommt.

MC40 ist derselbe Herausgeber-Bogen, und dort ist die Falle noch bösartiger: die
**Schraffurlinien** des Randes sind Vektor und stehen mit 25,9 % gleich an
dritter Stelle der Flächenmessung — nur eben schwarz. Der orange **Grund**
darunter ist Raster. Die Vektorzahlen sehen also einen Teil des Randes und
melden ihn als schwarz, was danach aussieht, als wäre der Rand gemessen. Ein
Blick auf das gerenderte Bild gehört deshalb immer dazu, auch wenn die Zahlen
plausibel aussehen. Und weil beide Bögen aus derselben Vorlage stammen, sind
Randkunst und gelbes Abzeichen bei MC32 und MC40 dieselbe Farbe: die
Unterscheidung zweier Kampagnen kann dann nicht am Akzent hängen, sondern muss
in `--page`, `--bar` und den Panels liegen.

**MC45 hat die Falle dann zu Ende geführt, und die Lehre ist grundsätzlicher:
das Raster liegt nicht nur auf dem Rand, es tönt den Innenbereich mit.** Der
sichtbare Grund innerhalb des Rahmens liest sich dort als warme Creme
(`#F4E8E0`), während der Innenbereich im Content-Stream vollständig kühl ist —
Weiß, Stahlblau, Mint, Teal-Konturen. Wer die Creme abtastet und abdunkelt,
macht aus einem kühlen Bogen einen braunen; genau das war der erste Anlauf, und
es fiel erst auf, als jemand Bogen und Bildschirm nebeneinander hielt. Also:
**erst entscheiden, welche Fläche überhaupt der Bogen ist**, und dann messen.
Der orange Rand ist ein Rahmen *um* den Bogen, nicht ein Teil davon — bei MC45
steht deshalb kein Orange in `--halftone`/`--hatch`, anders als bei MC32 und
MC40, deren Bögen *innerhalb* des Rahmens orange schraffieren. Und die
gemessenen Zahlen allein sagen das nicht: sie melden brav eine Cremefläche, die
nur eine Überlagerung ist.

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

**Dazu die Wortmarke — drei Tokens, und die stehen nur einmal.** `--logo-fill`,
`--logo-plate` und `--logo-shadow` kommen nicht aus dem Bogen, sondern aus dem
**Kampagnen-Logo oben links** auf Seite 1, und sie gehören in den *hellen*
`[data-campaign]`-Block, sonst nirgends. Das ist die einzige Ausnahme von der
Vier-Block-Regel und sie ist begründet: die Regel existiert, weil Werte je Theme
verschieden sind, und diese sind es nicht — die drei sind ein geschlossener Satz
aus einem gedruckten Logo, das seinen Kontrast selbst trägt. Eine Deklaration im
hellen Block gilt in allen vier Zuständen, weil die anderen drei Blöcke dasselbe
`:root` treffen und diese Namen nie nennen. Im Print-Reset fehlen sie ebenfalls
absichtlich; der Kommentar dort sagt, warum.

**Alle zehn Logos sind gleich gebaut, und wer das übersieht, misst falsch:
Buchstaben in einer Farbe, hart versetzt in einen Block einer zweiten Farbe, über
einem Grund, der mal zum Logo gehört und mal einfach der Bogen ist.** Der Versatz
ist der **Schatten** — bei MC16 lila, bei MC10 schwarz, bei MC40 dunkelrot — und
er ist das Auffälligste an der Marke. Der erste Anlauf hatte nur Füllung und
„Plakette“ und hat den Schatten mit dem Grund zu *einer* Fläche verrechnet: MC16
wurde damit ein pflaumenfarbener Kasten ohne das Lila, das seine Marke ausmacht,
MC10 bekam den Schatten als Plakette und den Grund gar nicht, und MC40 bekam ein
Marineblau, das auf der Seite **nirgends vorkommt**. Aufgefallen ist es erst, als
jemand Bogen und Bildschirm nebeneinander gehalten hat. Also: erst am gerenderten
Logo entscheiden, welche der drei Rollen welche Farbe hat, dann messen.

Das Logo ist ein **Rasterbild** mit eigenem Xref, keine Vektorfläche — gemessen
wird per Median-Cut darüber, die Rollen dann **mit dem Auge** vergeben. Wortmarke
und Grund automatisch zu trennen scheitert: ein Flood-Fill leckt durch die
antialiasierten Konturen und hat bei MC60 98 % der Marke mitgefressen. Und die
Rollen kippen je Kampagne — sieben Marken sind helle Buchstaben auf dunklem
Grund, MC32 und MC60 dunkle auf hellem. Wer das verwechselt, bekommt 1,0.

**Kontrast nur zwischen Füllung und Plakette: mindestens 4,5.** Der Schatten wird
*nicht* danach gemessen und darf es nicht werden — er trennt über den **Farbton**,
nicht über die Helligkeit: MC16s Lila auf seinem Marineblau steht bei 1,5 und ist
auf Papier völlig deutlich. Wer ihn auf 4,5 zwingt, erfindet eine Farbe, die das
Logo nicht hat. `lint.js` verlangt die drei Tokens und dass der Schatten weder die
Plakette noch die Füllung ist — gleicher Hexwert heißt, es wird nichts gezeichnet,
und kaputt aussehen tut es auch nicht. Der Browser-Test rechnet den Kontrast je
Kampagne nach und prüft zusätzlich, dass der Schatten überhaupt **gemalt** wird:
ein undefiniertes `--logo-shadow` macht die ganze `text-shadow`-Deklaration
ungültig, die Buchstaben werden still flach, und das sieht nach Absicht aus.

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
| `campaigns/mutant-genesis.js` | Beschriftungen, die aus einer Wahl abgeleitet werden, ohne dass die Wahl entscheidet, was gespeichert bleibt; ein Gitter aus Kartensatz × Szenario; und die Grenze zwischen einer Sperre und einem Hinweis |
| `campaigns/mojomania.js` | der kleinste Bogen, und der einzige, der gar nicht als Bogen verkauft wird: er steht auf der **Rückseite des Regelhefts**. Numerierte Freitextzeilen, deren Position die Eintragung mitträgt, und eine Anzeigereihenfolge, die je Sprache dem eigenen Druck folgt, weil die beiden Ausgaben dieselben sechs Kästchen verschieden anordnen |
| `campaigns/next-evolution.js` | eine Tabelle, deren Zeile eine gedruckte Karte ist und deren gedruckte Spalten nur gelesen werden; eine Auswahl mit Eindeutigkeit über die Zeilen hinweg; und ein Feld, das erst mit dieser Auswahl aufgeht |
| `campaigns/galaxys-most-wanted.js` | eine **wachsende** Auswahlliste aus einem festen Pool, deren Eindeutigkeit über alle Spieler hinweg gilt; ein gedrucktes Feld, das nicht abgefragt, sondern gerechnet wird — samt `migrate()`, die den alten Kontostand *exakt* umrechnet statt einen Standardwert zu raten; ein Feld, das per Index auf einen Spieler zeigt statt auf seinen Namen; und zwei Zahlen, aus denen der nächste Spielaufbau abgeleitet wird |
| `campaigns/age-of-apocalypse.js` | sehr schlank: zwei Wahrheitswerte je gedruckter Zeile, die sich gegenseitig ausschließen und gemeinsam den Zeilennamen durchstreichen — dazu ein Bogen, dessen deutscher Druck vorlag, also nichts als Platzhalter stehen ließ |
| `campaigns/agents-of-shield.js` | der umgekehrte Fall zu MC40: ein großer **gedruckter Block, an dem nichts eingetragen wird**, weil er sich aus einer Handvoll Kästchen vollständig ergibt; dazu eine Tabelle aus gedruckten Zeilen mal gedruckten Spalten, gezeichnete Symbole, die ihre Bedeutung als `aria-label` tragen, und ein Bogen, dessen deutscher Druck vorlag, dessen Kartennamen aber trotzdem offen sind, weil das Papier gar keine druckt |

Harte Punkte:

* `emptyState`, `normalize`, `migrate` fassen **das DOM nicht an** — `lint.js`
  fährt sie kopflos und prüft, dass `normalize()` ein Fixpunkt ist.
* `stateVersion: 1` heißt kein `migrate()`. Ab 2 ist es Pflicht — und eine
  Migration, die ein Feld hinzufügt, muss überlegen, was der Standardwert für
  **bestehende** Bögen bedeutet. (MC60 hat gelernt: `expert: false` versteckte
  eingetragene Lebenspunkte.) Wo es geht, wird gar kein Standardwert geraten:
  MC16 hat ein Feld von „übrig“ auf „verdient“ umgestellt und rechnet in der
  Migration `übrig + ausgegeben` — und was ausgegeben wurde, steht als
  Kartenliste direkt daneben. Ein Bogen ohne eingetragenen Kontostand bekommt
  auch danach keinen: aus den Karten eine Einnahme abzuleiten, die nie notiert
  wurde, wäre eine Erfindung.
* Kartennamen als Tabelle mit `en` und `de`. `de: null` zeigt den englischen
  Namen; `de: ""` ist verboten und wird von `lint.js` gefangen.
* Ein englisch angezeigter Name trägt `lang="en"`, ein übersetzter nicht.
* Expertenmodus, falls die Kampagne einen hat: **Ausblenden ist nicht Löschen.**
* Alle Beschriftungen über `i18n`, in beiden Sprachen, dazu `helpDe`/`helpEn`.
* **Der Hilfetext trägt nur Abhängigkeiten** — Sperren, abgeleitete Werte,
  Eindeutigkeitsregeln, Gitter, Ausschlüsse, Freischaltungen. Was auf jedem
  Bogen gleich ist, steht im Rahmen (`i18n.js`, `help*`): Speichern, Spieler,
  Identität und Deck, Expertenmodus, Listen, Durchstreichen, Export, Druck.
  Das war einmal anders, und es ist teuer geworden: der Absatz über den
  Expertenmodus und der Satz „Ausblenden heißt nicht löschen“ standen in
  **allen neun** Modulen einzeln (heute sind es zehn), „es gibt hier bewusst keine Szenario-Tabelle“
  in sieben, die Begründung einseitiger Sperren in fünf, und ein Modul
  wiederholte wörtlich einen Absatz des Rahmens. Zusammen war das die Hälfte
  des Textes. `helpDe`/`helpEn` sind **Arrays von Absätzen**, gleich lang in
  beiden Sprachen — `lint.js` prüft beides.
* **Symbole im Regeltext.** Setzt der Bogen ein Zeichen aus der Icon-Schrift des
  Herausgebers (`MarvelLCGIcons`, z. B. `` = „pro Spieler"), wird es
  **gezeichnet**, nicht eingebettet — die Schrift ist nicht unsere. Im
  Wörterbuch steht an der Stelle ein Marker, damit Wortlaut und Position des
  Symbols zusammenbleiben und keine Übersetzung ihn verliert (`{pp}` in MC27),
  und das gezeichnete Element trägt die Bedeutung als `aria-label`: ein Symbol,
  das niemand lesen kann, ist schlimmer als das Wort dafür. Zu finden sind alle
  Vorkommen so:

  ```python
  import fitz
  for pno, pg in enumerate(fitz.open("mcXX_....pdf")):
      for b in pg.get_text("dict")["blocks"]:
          for l in b.get("lines", []):
              for sp in l["spans"]:
                  if "Icon" in sp["font"]:
                      print(pno, [hex(ord(c)) for c in sp["text"].strip()],
                            "".join(x["text"] for x in l["spans"]))
  ```

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
gemeint ist, sonst räumt ein späterer Leser das Falsche auf. MC16 hat gar kein
`de: null`: alle 28 Marktkarten sind übersetzt, und weil das der einzige solche
Fall ist, sagt es der Dateikopf ausdrücklich — sonst sucht jemand den fehlenden
Fall, statt ihn als erledigt zu erkennen. Und wo zwei deutsche Drucke einander
widersprechen — beim MC16-Artefakt „Ei des Monarchen von Hujahdarian" setzt das
Regelheft eine Silbe weniger als die Karte —, gewinnt die Karte, und der
Kommentar hält fest, warum die Tabelle nicht zum Regelheft passt.

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
  Lüge — bei jeder Änderung mitlesen. Dazu gehört jede **Zahl, die die
  Kampagnen zählt** („der schlankeste der drei“, „der einzige der vier“): sie
  ist beim nächsten Modul falsch, und niemand denkt daran. Ohne Zahl
  formulieren — „der schlankeste von allen“.
* **`display: flex` auf einem `<td>` zerstört `border-collapse`.** Eine
  Tabellenzelle, die zum Flex-Container gemacht wird, ist keine Table-Cell-Box
  mehr; die Tabelle packt sie in eine anonyme Zelle, und die Rahmen der beiden
  werden nicht mehr mit den Nachbarzellen verschmolzen. Sichtbar wird das als
  **eine Spalte mit doppelt so dicken Linien**, während alle anderen einfache
  haben — und weil es nur diese Spalte betrifft, sieht es nach einem
  Farb- oder Breitenproblem aus, nicht nach dem Box-Modell. MC60s
  Schurken-Spalte hatte das monatelang. Braucht ein Zellinhalt Flex, kommt ein
  Wrapper **in** die Zelle (`.with-die`), nie auf das `<td>`. Aufgefallen ist es
  nur, weil jemand hingesehen hat — **jetzt fängt es ein Test**:
  `cellsAreCells()` in `test/selftest.html` liest für jede Zelle jeder
  `.sheet-table` das berechnete `display` und verlangt `table-cell`. Aufgerufen
  wird es in `basic`, `smrep`, `mg`, `ne`, `aoa` und `aos` — also einmal je Kampagne,
  die überhaupt eine Tabelle druckt (MC10, MC16, MC21 und MC39 haben keine, ihre
  Spielerspalten sind `.player-grid`). Nur in der
  Breitansicht sinnvoll: die Schmalvariante macht jede Zelle absichtlich zum
  Block und legt den Rahmen auf die Zeile.
* **Eine Basisklasse unter ihren Varianten schlägt sie alle.** `.icon-btn` stand
  in `styles.css` rund dreihundert Zeilen *unter* `.player-remove`,
  `.deck-clear` und `.deck-copy`. Alle vier sind Ein-Klassen-Selektoren, also
  entscheidet nur die Reihenfolge — und die Basis gewann. Die drei „leisen"
  Varianten baten um `background: none`, um `border-color: transparent` und um
  eine kleinere Kantenlänge und bekamen nichts davon: gezeichnet wurde jedes Mal
  der gefüllte, gerahmte Würfelknopf. Drei Kommentare im Stylesheet behaupteten
  einen stillen Knopf, keiner stimmte. **Ein Stylesheet hat keine Tests** — es
  fiel erst auf, als jemand einen Screenshot ansah. Die Basis steht jetzt
  oberhalb ihrer Varianten und sagt dort, dass sie dort bleiben muss. Und die
  Auflösung ist die zweite Hälfte der Lehre: die Pill **war** die gewollte Form,
  die stillen Deklarationen sind deshalb *gestrichen* statt in Kraft gesetzt.
  Was von einer Variante übrig bleibt, sind ihre Farben — also genau das, was
  auch gezeichnet wird. Eine Regel, die nichts tut, ist kein harmloser Rest: sie
  liest sich als Absicht.
* **Ein eigenes `display` hebelt das `hidden`-Attribut aus.** `[hidden]` ist
  eine Regel des UA-Stylesheets, und jede Autorenregel mit `display` schlägt
  sie. Die Wortmarke hatte `display: inline-flex` und stand deshalb als leere
  Plakette über dem Kampagnen-Dialog eines frischen Besuchs — was nach einem
  Renderfehler aussieht, nicht nach einem leeren Zustand. Wer einem Element mit
  `hidden` ein `display` gibt, schreibt `.x[hidden] { display: none; }` dazu.
  Bösartig ist daran der Test: die Zusicherung prüfte `node.hidden`, und die
  **Eigenschaft war die ganze Zeit `true`**. Grün, während es auf dem Schirm
  stand. Sichtbarkeit prüft man am berechneten `display`, nie am Attribut —
  gefunden hat es nur ein Blick auf einen Screenshot.
* **Ein Bogen muss kein eigenes PDF sein.** Bei MC39 gibt es keinen
  Kampagnenbogen zum Herunterladen, und der erste Eindruck war deshalb „diese
  Kampagne hat keinen Bogen“ — sie hat einen, auf der **Rückseite des
  Regelhefts**, in beiden Ausgaben, mit der üblichen Kopiererlaubnis. Vor
  diesem Schluss gehört ein Blick auf die letzte Seite jedes Regelhefts. Und
  der Unterschied ist groß: mit Bogen ist es der übliche feldtreue Weg, ohne
  müsste man etwas erfinden, was dieses Projekt nirgends tut.
* **Zwei Drucke, zwei Anordnungen.** MC39 druckt dieselben sechs Kästchen
  deutsch und englisch an verschiedenen Plätzen. Feldtreue heißt dann: je
  Sprache dem eigenen Druck folgen, nicht einen der beiden zum Original
  erklären. Die gespeicherten Schlüssel bleiben davon unberührt — sie sind
  die Set-Codes aus `marvelsdb-json-data`, und nur die Anzeige dreht sich.
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
* **Der erfundene Kampagnenname in `test/selftest.html`.** Die
  Quarantäne-Fälle brauchen einen Bogen einer Kampagne, die es *nicht* gibt.
  Zweimal war das der Name einer Kampagne, die es noch nicht gab — MC24, dann
  MC32 als `mutant-genesis` —, und beide Male hörten am Tag der Umsetzung
  mehrere Zusicherungen still auf zu prüfen. Der Wächter heißt jetzt
  `no-such-campaign`, und `test/lint.js` prüft, dass keine Kampagne ihn belegt.
  Merksatz: der Wächter darf kein plausibler Kampagnenname sein.
* **Die Suite dauert.** Im Hintergrund starten, nicht in ein Timeout laufen
  lassen, und die **Zahl** der Zusicherungen lesen, nicht nur die Fehlerzahl.
