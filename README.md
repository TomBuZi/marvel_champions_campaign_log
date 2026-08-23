# Marvel Champions – Kampagnen-Logbuch

Digitaler Ersatz für den gedruckten Kampagnenbogen von *Marvel Champions: The Card Game*.
Eintippen statt ausdrucken: automatisch gespeichert, zweisprachig, teilbar, druckbar.

**Live:** https://tombuzi.github.io/marvel_champions_campaign_log/

Umgesetzt sind die Kampagnen **Fear No Evil (MC60)** und
**The Rise of Red Skull (MC10)**. Die Kampagne wird beim Anlegen eines Bogens gewählt
und bleibt danach fest. Weitere kommen als jeweils eigenes Modul dazu — siehe
[Eine Kampagne hinzufügen](#eine-kampagne-hinzufügen).

> Inoffizielles Fan-Projekt. Siehe [Rechtliches](#rechtliches).

---

## Was die App kann

* **Der ganze Bogen, je Kampagne der ihre.** Jedes Modul folgt seiner Vorlage Feld
  für Feld, und die beiden Vorlagen sind sehr verschieden:
  * *Fear No Evil (MC60)* — Spielerplätze mit Identität und verbleibenden
    Trefferpunkten, die fünf Szenarien mit Schurken-Zuordnung und Fortschritt, die
    aus der Kampagne entfernten Verbündeten und Persona-Unterstützungen, und die
    beiden Kampagnen-Marken.
  * *The Rise of Red Skull (MC10)* — je Spieler Identität, Trefferpunkte,
    Verpflichtungen, Tech- und Basis-Verbesserung und gerettete Verbündete; dazu die
    drei Felder, nach denen spätere Szenarien fragen, und die entfernten
    Verbündeten. **Keine** Szenario-Tabelle, kein Fortschritt, kein Würfel — der
    gedruckte MC10-Bogen hat das alles nicht, weil die fünf Szenarien in fester
    Reihenfolge gespielt werden.
* **Standard- oder Expertenstufe** — der Haken „Expertenmodus“ oben im
  Spielerbereich, in beiden Kampagnen an derselben Stelle. Auf Standardstufe
  blendet der Bogen aus, was es dort nicht gibt, statt danach zu fragen:
  * *Fear No Evil (MC60)* — die verbleibenden Trefferpunkte.
  * *The Rise of Red Skull (MC10)* — die verbleibenden Trefferpunkte **und** die
    Verpflichtungen; das MC10-Regelheft nennt beides ausdrücklich als Sache der
    Expertenstufe.

  **Ausblenden ist nicht Löschen**: wer versehentlich umschaltet, findet nach dem
  Zurückschalten alles wieder vor. Gedruckt wird der Haken mit, weil er
  entscheidet, was der Bogen überhaupt bedeutet.
* **Karten statt Freitext** (MC10) — wo auf Papier eine leere Zeile steht, stehen hier
  die tatsächlichen Karten. Jedes dieser Felder hat genau vier gedruckte
  Möglichkeiten, und jedes trägt seine eigene Regel aus der Kampagne:
  * *Verpflichtungen* — jeder Spieler hat seinen eigenen Satz aller vier, zwei
    Spieler können also dieselbe haben.
  * *Tech- und Basis-Verbesserung* — jede Karte gibt es einmal in der Kampagne, eine
    gewählte verschwindet daher aus den Feldern der anderen Spieler.
  * *Gerettete Verbündete* — auch jeder nur einmal, aber ein Spieler kann mehrere
    haben; deshalb Kästchen statt Auswahlfeld, und bei den übrigen Spielern gesperrt
    statt verschwunden, mit dem Namen des Besitzers als Sperrgrund.
  * *Experimentalwaffen* — der Bogen will die Namen, nicht die Anzahl: Szenario 2
    mischt genau die aufgeschriebenen wieder ins Begegnungsdeck.
* **Ein bis vier Spieler** — Karten werden hinzugefügt, wenn jemand mitspielt, statt
  vier feste Plätze zu zeigen. Der gedruckte Bogen muss alle vier vorhalten; ein
  Bildschirm nicht.
* **Schurken auslosen** (MC60) — der Würfel neben einem leeren Schurken-Feld zieht einen der
  noch nicht zugeordneten Schurken. Steht schon einer im Feld, ist der Würfel gesperrt;
  ein Würfel überschreibt nie eine Wahl.
* **„Nächste Runde"** (MC60) — zieht zwei Szenarien, die noch im Spiel sind, und gibt jedem
  einen Fortschrittspunkt. Ist nur noch eines im Spiel, bekommt es beide.
* **Mehrere Durchläufe** parallel, mit Auswahl oben; die Kampagne wird beim Anlegen
  gewählt und bleibt danach fest.
* **Automatisch gespeichert** im Speicher des Browsers — kein Server, kein Konto,
  keine Übertragung irgendwohin.
* **Export / Import** als JSON, und **Link teilen**: der komplette Bogen steckt
  komprimiert in der Adresse.
* **Druckansicht** als reine Textfassung in Schwarzweiß, damit nichts abgeschnitten wird.
* **Deutsch und Englisch**, hell und dunkel, beides umschaltbar und gespeichert —
  die Sprache lässt sich auch über die Adresse vorgeben (`…/de/`, `…/en/`).
* Läuft auch offline und direkt von der Festplatte (`file://`).

### Fortschritt, „1“, „2“, „Gescheitert“

Auf dem Bogen sehen die drei Kästchen wie drei einzelne Häkchen aus, sind aber
**ein Zähler**: Jede Runde werden zwei Szenarien gezogen, die weder abgeschlossen
noch gescheitert sind, und beide bekommen einen Fortschrittspunkt — der dritte Punkt
bedeutet, dass das Szenario gescheitert ist. In der App setzt ein Klick den Zähler auf
dieses Kästchen; ein Klick auf das oberste gefüllte Kästchen nimmt einen Punkt zurück,
so kommt man auch wieder auf null. Gespeichert wird deshalb nur `progress: 0..3`;
„gescheitert“ ist daraus abgeleitet und kein eigenes Feld.

„Nächste Runde" im Kopf der Szenarien-Tafel macht genau das, was die Regel beschreibt:
Es **zieht** zwei der noch im Spiel befindlichen Szenarien — zufällig, nicht die obersten
zwei — und erhöht deren Zähler um eins. Bleibt nur noch eines übrig, erhält es beide
Punkte, denn die Runde findet ohnehin statt. Anschließend nennt eine Meldung die
gezogenen Szenarien, sonst wäre eine Änderung an zwei Zeilen nur zu sehen, wenn man
schon weiß, wo man hinschauen muss. Abgeschlossene und gescheiterte Szenarien sind aus
dem Spiel und werden nie angefasst; ist keines mehr im Spiel, ist der Knopf gesperrt.

**„Abgeschlossen“ und „Gescheitert“ schließen sich aus** und sperren einander:
Ein Haken bei „Abgeschlossen“ friert den Fortschritt ein — die gesetzten Kästchen
bleiben sichtbar, sind aber nicht mehr bedienbar. Umgekehrt sperrt ein gescheitertes
Szenario den Abgeschlossen-Haken. Wer es doch ändern will, nimmt zuerst das jeweils
andere zurück; ein Tooltip sagt das an den gesperrten Kästchen auch.

Ein Szenario, das durch ist — abgeschlossen oder gescheitert —, stellt sein
Schurken-Feld dunkler dar, damit die Zeilen, die noch laufen, hervorstechen.

Die Sperre gilt nur, **solange die Zeile widerspruchsfrei ist**. Ein importierter oder
handeditierter Bogen kann beides gesetzt haben — dann blieben beide Bedienelemente
gesperrt und die Zeile wäre nicht mehr zu reparieren. In diesem Fall bleiben deshalb
beide bedienbar, bis eines geklärt ist. `normalize()` wählt bewusst keinen Gewinner:
welche der beiden Angaben gemeint war, ist nicht zu erraten.

### Spieler

„+ Spieler" legt eine weitere Karte an, bis vier erreicht sind; das × an einer Karte
entfernt sie wieder. Die letzte Karte bleibt stehen — ein Bogen ohne Spieler hat keine
Bedeutung. Steht auf einer Karte etwas, wird vor dem Entfernen gefragt. Danach werden
die verbleibenden Karten neu durchnummeriert.

Das Identitätsfeld ist Freitext mit Vorschlagsliste aus `heroes.js`; passt der Name auf
einen bekannten Helden, erscheint daneben dessen aufgedruckter Startwert als Erinnerung.

Das Spielerraster richtet sich nach der **Spielerzahl**, nicht nach der freien Breite:
vier Spieler stehen in einer Reihe, solange dafür Platz ist, und darunter als 2 + 2 —
nie als 3 + 1. (`auto-fit` entscheidet nach der Breite und bricht dann um; genau daher
kam das 3 + 1.)

### Erledigt-Markierung

Eine Tilde `~` am Anfang eines Listeneintrags streicht ihn durch, ohne ihn zu löschen.
Beim Hineinklicken erscheint der Rohtext wieder.

### Sprache über die Adresse

Wer einen Link weitergibt, kann die Sprache mitgeben:

| Adresse | Wirkung |
|---|---|
| `…/marvel_champions_campaign_log/de/` | öffnet auf Deutsch |
| `…/marvel_champions_campaign_log/en/` | öffnet auf Englisch |
| `…/index.html?lang=de` (bzw. `en`) | dasselbe, ohne den Umweg über das Verzeichnis |

`?lang=` gilt als **ausdrückliche Wahl**: sie schlägt eine gespeicherte Einstellung und
wird selbst gespeichert — der nächste Besuch ohne Parameter bleibt also dabei. Ein
unbekannter Wert (`?lang=fr`) wird ignoriert und lässt die gespeicherte Sprache in Ruhe;
ein Tippfehler im Link soll sie nicht überschreiben. Beim Übernehmen wird nur der
Sprach-Schlüssel geschrieben, nicht der ganze Speicher: einem Link zu folgen ist keine
Änderung an einem Bogen, und ein voller `saveStorage()` beim Start würde jeden Bogen in
migrierter Form zurückschreiben (siehe [Alte Bögen](#alte-bögen)).

`de/` und `en/` sind **echte Verzeichnisse mit je einer `index.html`** — GitHub Pages
kennt keine Rewrites, ein Pfad ohne Datei dahinter ist ein 404. Die beiden Dateien
enthalten keine Kopie der App, sondern nur die Weiterleitung auf `../index.html?lang=…`;
der Seitenrahmen bleibt an einer Stelle. `test/lint.js` prüft das mit: sobald in einem
der Stubs ein `<script src>` oder ein Stylesheet auftaucht, schlägt die Prüfung fehl.

Das Ziel nennt `index.html` ausdrücklich, damit es auch über `file://` funktioniert —
dort ist eine Verzeichnisadresse ein Listing, keine Seite. `location.replace` nimmt ein
angehängtes `#log=…` mit und hinterlässt keinen zusätzlichen Schritt im Verlauf.

Am Pfad hängt nur die Sprache, nicht die Daten: `localStorage` gehört zum **Origin**,
nicht zum Verzeichnis — ein Bogen, der unter `/en/` angelegt wurde, ist unter `/`
derselbe. Der Share-Link trägt die Sprache umgekehrt nicht mit: er transportiert einen
Bogen, keine Ansicht, und der Empfänger bleibt bei seiner eigenen Sprache.

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

### Alte Bögen

Jede Kampagne versioniert ihr eigenes State-Shape (`stateVersion`) und bringt bei
Bedarf ein `migrate()` mit. Fear No Evil steht bei **3**:

* **1 → 2** — Version 1 hatte immer genau vier Spielereinträge, Version 2 nur die
  Spieler, die es gibt. Beim Öffnen eines alten Bogens werden die leeren Plätze am
  Ende weggelassen — mindestens einer bleibt —, während eine Lücke zwischen zwei
  gefüllten Karten erhalten bleibt, damit sich die Nummerierung der Spieler, die auf
  dem Bogen *sind*, nicht unter ihnen verschiebt.
* **2 → 3** — dazugekommen ist der Haken für die Expertenstufe. Zu tun ist dabei
  nichts: ein Bogen, der ihn nicht erwähnt, ist ein Standardbogen, und genau das
  liest `normalize()` aus einem fehlenden Feld. Eine neue Version ist es trotzdem,
  weil ein Build von vor dem Feld es beim nächsten Speichern wegwerfen würde.

Migriert wird beim **Lesen**, geschrieben erst bei der nächsten echten Änderung. Ein
Besuch, der nichts ändert, lässt den gespeicherten Bogen also unangetastet — womit ein
älterer Build auf einem anderen Gerät ihn weiter lesen kann, bis sich wirklich etwas
ändert.

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
| `de/index.html`, `en/index.html` | die Adressen `…/de/` und `…/en/`: keine Kopie der App, nur eine Weiterleitung auf `../index.html?lang=…` |
| `styles.css` | Design-Tokens (hell / dunkel / Druck), Comic-Optik, Tabelle samt Schmalvariante, Listen, Menü, Dialoge |
| `core.js` | Speichern, mehrere Bögen, Quarantäne, Export/Import, Share-Link, Druck, Sprache, Theme, Kampagnen-Registry |
| `widgets.js` | wiederverwendbare Bausteine: Checkbox, Zahlenfeld, Textfeld, Auswahl mit Ausschluss, Fortschrittszähler, Icon-Button, String-Liste mit Drag&Drop — jeweils mit optionalem gesperrten Zustand |
| `i18n.js` | `window.I18N = { de, en }` — nur Strings des Rahmens |
| `heroes.js` | 68 Helden (Name, Trefferpunkte) als Vorschlagsliste für die Identitätsfelder |
| `campaigns/fear-no-evil.js` | die Kampagne MC60: eigenes Datenmodell, eigenes Rendering, eigene Strings |
| `campaigns/rise-of-red-skull.js` | die Kampagne MC10: feste Kartenpools mit ihren Eindeutigkeitsregeln und drei Szenariofelder; bewusst ohne Szenario-Tabelle |
| `test/lint.js` | Prüfungen ohne Browser: Wörterbücher, Kampagnendefinition, Datenmodell, Paketierung |
| `test/selftest.html`, `test/run-browser.js` | Selbsttest, der die echte Seite in einem iframe fernsteuert |
| `fonts/` | Exo 2 (OFL, selbst gehostet), `OFL.txt` daneben |
| `.github/workflows/ci.yml` | die Prüfungen bei jedem Push |
| `.github/workflows/preview.yml` | spiegelt einen `preview/<name>`-Branch nach `preview/<name>/` auf `main` |
| `preview/` | von Actions verwaltete Branch-Vorschauen — **nie von Hand anfassen** |

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
     id: "mutant-genesis",      // stabil, wandert in jeden Bogen
     code: "MC24",
     titleEn: "…", titleDe: "…",
     theme: "mg",               // -> <html data-campaign="mg">
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
   `normalize()` werden dann automatisch mitgeprüft, ebenso, dass `index.html` das
   neue Skript wirklich lädt.
4. Für einen `[data-campaign]`-Skin einen Farbblock in `styles.css` ergänzen. Achtung:
   **vier** Blöcke, wie die Tokens darüber — ein einzelner `[data-campaign]`-Block ist
   spezifischer als das bloße `:root` in der Dark-Media-Query und würde im Dunkelmodus
   die helle Palette malen.

Als Vorlagen dienen die beiden vorhandenen Module, und sie sind bewusst
unterschiedlich: `campaigns/fear-no-evil.js` zeigt abgeleiteten Zustand, gegenseitige
Sperren, eine Auslosung und ein `migrate()`; `campaigns/rise-of-red-skull.js` ist das
schlanke Gegenstück — reine Eingabefelder, kein `migrate()`, keine erfundenen Felder.

`ctx` liefert `{ state, lang, t(key, …args), save(), rerender(), toast(msg), w }`;
`w` ist die Widget-Sammlung aus `widgets.js`.

**Harte Regel:** `emptyState`, `normalize` und `migrate` dürfen das DOM nicht berühren —
weder beim Laden noch beim Aufruf. Nur dadurch kann `test/lint.js` sie kopflos
durchtesten, und genau dieser Test fängt die Fehler, die sonst erst als kaputter
Bogen auffallen.

---

## Lokal starten und prüfen

```bash
python -m http.server 8137          # dann http://127.0.0.1:8137/
node test/lint.js                   # Prüfungen ohne Browser
node test/run-browser.js            # Selbsttest im echten Browser (322 Assertions)
node test/run-browser.js print      # nur ein Fall: basic | quarantine | share | lang |
                                    #   langpath | print | import | lock |
                                    #   lockconflict | random | randomspread |
                                    #   appearance | players | migrate | expert |
                                    #   round | roundlast | roundspread |
                                    #   rrs | rrsdialog | rrsprint | rrspools |
                                    #   rrsexpert
BROWSER_LANG=de-DE node test/run-browser.js   # unter einer anderen Browser-Sprache
```

`test/seed.html` legt einen ausgefüllten Beispielbogen an und springt in die App —
praktisch für Screenshots und für den Druckvergleich. `?c=mc10` nimmt den MC10-Bogen
statt MC60, `?expert=0` stellt den Bogen auf Standardstufe, und `?theme=dark` nagelt das
Theme fest; letzteres braucht man, um zu prüfen, dass der Druck auch aus einer
Dark-Mode-Sitzung schwarz auf weiß bleibt.

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

CI (`.github/workflows/ci.yml`) fährt alle drei Schritte bei jedem Push auf `main`
und auf `preview/**`-Branches. Änderungen unter `preview/` auf `main` — also die
Spiegel-Commits der Vorschau — lösen sie nicht aus: keine der Prüfungen liest dort
etwas.

### Branch-Vorschau auf GitHub Pages

Ein Branch namens `preview/<name>` wird von `.github/workflows/preview.yml` bei jedem
Push nach `preview/<name>/` auf `main` gespiegelt und ist damit unter
`…/marvel_champions_campaign_log/preview/<name>/` erreichbar — dieselbe Seite,
derselbe Origin, der Betrieb im Root bleibt unberührt. Der Workflow committet
ausschließlich unterhalb von `preview/` und bricht ab, sobald er dabei einen Pfad
außerhalb anfassen würde.

Derselbe Origin ist Absicht: die gespeicherten Bögen und alte `#log=`-Links lassen
sich direkt gegen den Vorschau-Build testen. Einen alten Share-Link prüft man, indem
man alles ab dem `#` hinter die Vorschau-Adresse hängt — das Payload enthält keinen
Pfad und keine Sprache.

Das heißt aber auch: **die Vorschau schreibt in denselben `localStorage`.** Deshalb
vor dem Testen alle Bögen als JSON exportieren. Ein Bogen einer Kampagne, die es nur
in der Vorschau gibt, erscheint im Betrieb mit ⚠ als nicht lesbar — das ist die
Quarantäne und kein Fehler (siehe [Bögen, die diese Version nicht lesen
kann](#bögen-die-diese-version-nicht-lesen-kann)). In der Vorschau erzeugte
Share-Links nicht weitergeben: sie zeigen in ein Verzeichnis, das mit dem Branch
wieder verschwindet.

Wird der Branch gelöscht — auch automatisch nach dem Merge —, räumt der Workflow das
Verzeichnis wieder ab.

---

## Gestaltung

Die Optik ist den offiziellen Bögen nachempfunden, aber ausschließlich mit
eigenen Mitteln: die Paletten wurden aus den PDFs gemessen, die Schrift ist **Exo 2**
(die Textschrift des Bogens, OFL-1.1, selbst gehostet in `fonts/`), und Halbtonraster,
Schraffur, Tuschekonturen und die harten Versatzschatten sind CSS-Gradienten und
Rahmen. Die Displayschrift des Bogens (Komika Title) ist nicht weiterverteilbar;
an ihrer Stelle steht Exo 2 ExtraBold Italic.

Farb-Tokens sind viermal deklariert: hell, `prefers-color-scheme: dark`, die
ausdrücklichen `[data-theme]`-Überschreibungen und noch einmal in `@media print`
(dort alles schwarz auf weiß). Vordergrundfarben, die auf einer *festen* Fläche
sitzen — Gelb, Warnrot, die Seitenfläche —, haben eigene `--on-*`-Tokens, weil das
Theme sonst hell und dunkel gegeneinander verdreht.

**Jede Kampagne bringt ihre eigene Palette mit**, gesetzt über
`[data-campaign]` am `<html>`: MC60 ist comic-orange auf Dunkelrot, MC10 salbeigrün
auf Tiefgrün mit Senfgelb — beides aus dem jeweiligen Bogen-PDF gemessen. Ein
solcher Skin muss dieselben **vier** Blöcke spiegeln. Ein einzelner
`[data-campaign]`-Block wäre spezifischer als das bloße `:root` in der
Dark-Media-Query und würde im Dunkelmodus die helle Palette malen; umgekehrt muss
der Print-Reset `[data-campaign][data-theme]` mitnennen, sonst druckt eine
Dark-Mode-Sitzung die Kampagnenfarben statt Schwarz auf Weiß.

Komponenten-CSS nennt nie eine Kampagnenfarbe, sondern nur die generischen Tokens.
`test/lint.js` kann das nicht prüfen, deshalb steht es hier: wer eine Farbe direkt
in eine Regel schreibt, macht sie für jede weitere Kampagne falsch.

`color-scheme` ist pro Theme gesetzt, damit auch die Teile, die die Seite nicht selbst
malt — das aufgeklappte `<select>`, die Zahlen-Spinner, Scrollbalken — dem Theme folgen
statt der Systemeinstellung. Das Menü setzt seine Textfarbe ausdrücklich: das
UA-Stylesheet gibt `[popover]` ein eigenes `color: CanvasText`, das dem Theme **nicht**
folgt — im Dark Mode stand das Menü dadurch schwarz auf fast schwarz.

Der Fall `appearance` im Selbsttest rechnet Kontrastverhältnisse aus, statt sie auf
Screenshots zu beurteilen: Menütext gegen Menühintergrund, die Ziffer auf dem Gelb,
und ob ein erledigtes Schurken-Feld wirklich dunkler wird statt heller.

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

## Kontakt und Danke

Fehler gefunden oder ein Änderungswunsch? **Tom@marvelchampionspodcast.de**

Wer sich bedanken möchte: **https://ko-fi.com/mc_campaign_logs** — beides steht auch
im Footer der Seite. Der Ko-fi-Link öffnet in einem neuen Tab und trägt
`rel="noopener noreferrer"`.

---

### Hinweise zu den Namen

* **Schurken- und Heldennamen bleiben in beiden Sprachen englisch.** Das ist die
  Konvention der deutschen Ausgabe: dort behalten Figuren ihre Namen (Rhino, Klaw,
  Ultron), übersetzt werden nur Szenario- und Hauptplan-Namen.
* **Die deutschen Szenarionamen sind vorläufig.** Von MC60 gibt es noch keine
  offizielle deutsche Ausgabe; sie stehen als eine Zeile je Szenario in
  `campaigns/fear-no-evil.js` und sind dort zu korrigieren, sobald es eine gibt.
  Es migriert nichts, weil gespeichert nur der Slug wird.
* **Helden mit zwei Trägern stehen einzeln in der Liste**, mit `*` getrennt:
  „Spider-Man * Peter Parker“ und „Spider-Man * Miles Morales“, „Black Panther *
  T'Challa“ und „Black Panther * Shuri“. Die Kartendaten führen sie unter einem Namen,
  die Trefferpunkte unterscheiden sich aber.
* **Das Identitätsfeld ist Freitext**, `heroes.js` liefert nur Vorschläge. Ein Umbenennen
  in der Liste ändert also nie einen bestehenden Bogen — dort bleibt der eingetippte
  Name stehen, höchstens der Trefferpunkte-Hinweis daneben findet keine Entsprechung
  mehr. Es gibt deshalb nichts zu migrieren, wenn die Liste wächst oder sich ändert.
* `health` darf `null` sein, wenn ein Wert nicht belegt ist; der Hinweis neben dem Feld
  bleibt dann leer. Ein erfundener Wert wäre schlechter als keiner.
