# Marvel Champions – Kampagnen-Logbuch

Digitaler Ersatz für den gedruckten Kampagnenbogen von *Marvel Champions: The Card Game*.
Eintippen statt ausdrucken: automatisch gespeichert, zweisprachig, teilbar, druckbar.

**Live:** https://tombuzi.github.io/marvel_champions_campaign_log/

Umgesetzt sind die Kampagnen **Fear No Evil (MC60)**,
**The Rise of Red Skull (MC10)**, **The Mad Titan's Shadow (MC21)**,
**Sinister Motives (MC27)** und **Mutant Genesis (MC32)**.
Die Kampagne wird beim Anlegen eines Bogens gewählt
und bleibt danach fest. Weitere kommen als jeweils eigenes Modul dazu — siehe
[Eine Kampagne hinzufügen](#eine-kampagne-hinzufügen).

> Inoffizielles Fan-Projekt. Siehe [Rechtliches](#rechtliches).

---

## Was die App kann

* **Der ganze Bogen, je Kampagne der ihre.** Jedes Modul folgt seiner Vorlage Feld
  für Feld, und die fünf Vorlagen sind sehr verschieden:
  * *Fear No Evil (MC60)* — Spielerplätze mit Identität und verbleibenden
    Lebenspunkten, die fünf Szenarien mit Schurken-Zuordnung und Fortschritt, die
    aus der Kampagne entfernten Verbündeten und Persona-Unterstützungen, und die
    beiden Kampagnen-Marken.
  * *The Rise of Red Skull (MC10)* — je Spieler Identität, Lebenspunkte,
    Verpflichtungen, Tech- und Basis-Upgrade und gerettete Verbündete; dazu die
    drei Felder, nach denen spätere Szenarien fragen, und die entfernten
    Verbündeten. **Keine** Szenario-Tabelle, kein Fortschritt, kein Würfel — der
    gedruckte MC10-Bogen hat das alles nicht, weil die fünf Szenarien in fester
    Reihenfolge gespielt werden.
  * *The Mad Titan's Shadow (MC21)* — der schlankeste von allen: je Spieler
    Identität und Lebenspunkte, dazu neun benannte Kästchen in vier
    Szenario-Abschnitten. Sieben von ihnen sagen auf Papier denselben Satz
    („… was added to campaign pool“), deshalb stehen sie hier als eine
    Überschrift über benannten Kästchen. Das fünfte Szenario gegen Loki fehlt
    auch auf dem gedruckten Bogen — im Finale gibt es nichts festzuhalten.
  * *Sinister Motives (MC27)* — der einzige Bogen ohne ein einziges gedrucktes
    Kästchen: alles sind Schreibfelder. Je Spieler Identität, Lebenspunkte und
    die drei Belohnungen der Reputationsleiste (S.H.I.E.L.D. Tech, Aspect
    Advantage, Planning Ahead) direkt in der Spielerkarte; dazu Community
    Service und Last Ones Standing als Kästchen über dem jeweiligen Kartensatz,
    Osborn Tech als eine Zelle je Stufe der Leiste, und Waking Nightmare sowie
    Final Reputation Score als Zahlen. Und die Reputationsleiste selbst: sie
    steht auf dem Logbuchblatt gar nicht, sondern auf der ersten Seite des
    gedruckten Bogens, und ohne sie ließe sich nicht sagen, welche Belohnungen
    gerade gelten. Deshalb ein Zahlenfeld 0–35 und daneben die sieben Stufen
    (1, 5, 9, 13, 17, 21, 25) mit Belohnung und Strafe; erreichte Stufen sind
    hervorgehoben, die offenen abgeblendet. Das „pro Spieler"-Symbol, das der
    gedruckte Bogen an drei Stellen im Regeltext setzt, steht auch hier —
    gezeichnet statt aus der Icon-Schrift des Herausgebers, und mit seiner
    Bedeutung als Name, damit Screenreader „pro Spieler" sagen.
  * *Mutant Genesis (MC32)* — der kästchenreichste, und keine seiner
    Schreibflächen hat gedruckte Zeilen. Je Spieler Identität, Lebenspunkte,
    **Rolle** und darunter die fünf Verbesserungen dieser Rolle als Kästchen;
    dazu die vier Kampagnen-Nebenpläne in je einer Szenariospalte, die fünf
    Future-Past-Karten einmal als Menge („Victory Display“, denn Entfernen ist
    endgültig) und einmal als Gitter aus fünf Karten × vier Szenarien
    („Encounter Deck“, denn die Karten werden wieder eingemischt), die drei
    Jubilee-Spalten genau so, wie der Bogen sie druckt — Szenario 2 ein
    Kästchen, Szenario 3 und 4 je zwei —, die vier CAPTIVE-Verbündeten aus
    *Abduction Protocols* als Kästchen und die Verbündeten unter *Rescue
    Captives* oder *Find the Prisoners* als Freitextliste. Das fünfte Szenario
    gegen Magneto fehlt auch auf dem gedruckten Bogen: im Finale gibt es nichts
    mehr festzuhalten.
* **Standard- oder Expertenstufe** — der Haken „Expertenmodus“ oben im
  Spielerbereich, in allen fünf Kampagnen an derselben Stelle. Auf Standardstufe
  blendet der Bogen aus, was es dort nicht gibt, statt danach zu fragen:
  * *Fear No Evil (MC60)* — die verbleibenden Lebenspunkte.
  * *The Rise of Red Skull (MC10)* — die verbleibenden Lebenspunkte **und** die
    Verpflichtungen; das MC10-Regelheft nennt beides ausdrücklich als Sache der
    Expertenstufe.
  * *The Mad Titan's Shadow (MC21)* — die verbleibenden Lebenspunkte. Die neun
    Kästchen bleiben auf beiden Stufen stehen.
  * *Sinister Motives (MC27)* — die verbleibenden Lebenspunkte; das ist auch das
    einzige Feld, das der gedruckte MC27-Bogen mit „Expert Mode Only“
    kennzeichnet. Alles andere bleibt auf beiden Stufen stehen.
  * *Mutant Genesis (MC32)* — die verbleibenden Lebenspunkte, und nur die: der
    gedruckte Bogen setzt „(expert)“ unter dieses eine Feld. Rolle und
    Rollenverbesserungen bleiben auf beiden Stufen stehen.

  **Ausblenden ist nicht Löschen**: wer versehentlich umschaltet, findet nach dem
  Zurückschalten alles wieder vor. Gedruckt wird der Haken mit, weil er
  entscheidet, was der Bogen überhaupt bedeutet.
* **Freischaltung durch Reputation** (MC27) — dieselbe Zahl, die die Stufen der
  Leiste hervorhebt, öffnet auch die Felder: S.H.I.E.L.D. Tech ab 1, Aspect
  Advantage ab 9, Planning Ahead ab 17, die drei Osborn-Tech-Zellen ab 1, 13 und
  21. Ein noch nicht freigeschaltetes Feld ist gesperrt und sagt, ab welcher
  Stufe es aufgeht — samt dem Würfel daneben. **Gesperrt ist nicht versteckt und nicht geleert**: wer die
  Reputation nach einem Zahlendreher zurückstellt, verliert keine Eintragung —
  und ein importierter Bogen darf Eintragungen tragen, die die aktuelle Zahl
  noch nicht erreicht. Was freigeschaltet ist, wird aus der einen Zahl
  abgeleitet und nie gespeichert.
* **Karten statt Freitext** (MC10, MC27, MC32) — wo auf Papier eine leere Zeile steht, stehen
  hier die tatsächlichen Karten. Bei MC10 hat jedes dieser Felder genau vier gedruckte
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

  Bei MC27 sind es die vier Kartensätze der Kampagne, und die Form folgt der Frage,
  die der Bogen stellt. *Community Service* und *Last Ones Standing* fragen, **welche**
  Karten — deshalb Kästchen über dem ganzen Satz. *Osborn Tech* fragt, welche Karte auf
  **welcher Stufe** der Leiste hereinkam — deshalb eine Zelle je Stufe, und deshalb wird
  diese eine Liste nicht sortiert: die Position ist Teil der Eintragung. *S.H.I.E.L.D.
  Tech* gibt es einmal je Kampagne, eine gewählte Karte verschwindet daher aus den
  Feldern der anderen Spieler. Aspect Advantage und Planning Ahead bleiben Freitext,
  weil die Karte aus der eigenen Sammlung beziehungsweise dem eigenen Deck kommt und
  keine endliche gedruckte Liste ist.

  Bei MC32 sind es fünf gedruckte Sätze, und jeder bekommt die Form der Frage,
  die der Bogen stellt. Die vier **Kampagnen-Nebenpläne** und die vier
  **CAPTIVE-Verbündeten** fragen, welche — Kästchen. Die fünf
  **Future-Past-Karten** fragen es zweimal: einmal für die ganze Kampagne, denn
  eine Karte im Victory Display ist endgültig entfernt, und einmal je Szenario,
  denn eine im Begegnungsdeck eingetragene Karte wird im nächsten Setup wieder
  eingemischt und darf in mehreren Spalten stehen. Genau das ist der Unterschied
  zwischen den beiden Abschnitten, und der Bogen sagt es selbst: der obere druckt
  keine Spalten, der untere vier. Die **Rollenverbesserungen** fragen, welche der
  fünf einer Rolle — Kästchen, deren Beschriftungen aus der gewählten Rolle
  fallen. Nur die Verbündeten unter *Rescue Captives* oder *Find the Prisoners*
  bleiben Freitext: sie kommen aus den eigenen Decks der Spieler.
* **Abgeleitete Beschriftungen** (MC32) — welche fünf Verbesserungen ein Spieler
  überhaupt sieht, entscheidet seine Rolle; ohne Rolle steht dort der Hinweis,
  erst eine zu wählen. Jeder Spieler muss eine andere Rolle nehmen, eine
  vergebene ist bei den anderen also abgeblendet. Ein Rollenwechsel **löscht
  nichts**: Eintragungen der alten Rolle bleiben gespeichert und werden nur
  nicht mehr als Kästchen gezeigt. Das ist kein Detail — beim Tausch zweier
  Rollen geht zwangsläufig einer der beiden kurz ohne Rolle durch, und ein
  Fehlklick im Auswahlfeld darf keine fünf Häkchen kosten. Gesagt wird darüber
  nichts, und gedruckt auch nicht: es ist Buchführung, kein Hinweis, den jemand
  braucht, und die Eintragungen stehen im JSON-Export und im Share-Link.
* **Was aus der Kampagne heraus ist, wird gesperrt** (MC32) — und zwar
  **einseitig**: ein bereits gesetztes Kästchen bleibt immer bedienbar, denn
  `normalize()` entscheidet einen Widerspruch nicht, also muss der Ausweg auf
  dem Bildschirm liegen. Ein importierter oder von Hand bearbeiteter Bogen darf
  nie festgefroren ankommen.
  * *Jubilee* — „in play“ und „removed from campaign“ eines Szenarios sind zwei
    Zustände eines Ergebnisses („im Spiel eintragen, **sonst** aus dem Logbuch
    entfernen“) und sperren sich gegenseitig, wie MC60s „Abgeschlossen“ und
    „Gescheitert“. Die Szenarien hängen außerdem aneinander: die Kästchen eines
    Szenarios sind erst offen, wenn das **vorige** „in play“ trägt — Szenario 3
    fragt nur nach ihr, weil der Sieg-Schritt von Szenario 2 sie ins Logbuch
    geschrieben hat und das Setup von Szenario 3 sie ins Spiel bringt.
    Szenario 2 hat nichts davor und ist immer offen. Und sobald sie entfernt
    ist, sind die Kästchen **aller späteren Szenarien** zu: sie kommt nicht
    zurück. Ein trotzdem vorhandener Widerspruch wird zusätzlich benannt — das
    noch offene Kästchen ist das, das korrigiert werden muss.
  * *Future Past* — eine Karte im Victory Display ist aus der Kampagne
    entfernt, also ist ihre ganze Zeile im Begegnungsdeck-Gitter durchgestrichen
    und zu. Hier zählt die Einseitigkeit am meisten: eine Karte kann in einem
    frühen Szenario im Begegnungsdeck gestanden haben und zwei Szenarien später
    im Victory Display landen, und dieser Abschnitt druckt keine Spalten, kann
    also nicht sagen, *wann* sie entfernt wurde. Die leeren Zellen zu schließen
    verhindert den nächsten falschen Eintrag; die gesetzten zu schließen würde
    eine richtige Eintragung für einen Fehler erklären.
* **Wo es nur um eine Anzahl geht, passiert nichts** (MC32) — wie viele
  Rollenverbesserungen die Kampagne vergeben hat, hängt an den
  Nebenplan-Kästchen, begrenzt aber nur eine **Anzahl** und keine bestimmte
  Karte. Gesperrt wird deshalb nichts: sonst wären genau die Kästchen zu, die
  beim Erreichen der Grenze zufällig leer waren, und ein frischer Bogen —
  Grenze 1 — käme sofort zu vier Fünfteln zu. Mitgezählt wird auch nicht: die
  Regel kennen die Spieler, das Papier prüft sie ebenfalls nicht, und eine
  ständig mitlaufende Zahl fängt an, wie eine Grenze auszusehen.
* **Ein bis vier Spieler** — Karten werden hinzugefügt, wenn jemand mitspielt, statt
  vier feste Plätze zu zeigen. Der gedruckte Bogen muss alle vier vorhalten; ein
  Bildschirm nicht.
* **Schurken auslosen** (MC60) — der Würfel neben einem leeren Schurken-Feld zieht einen der
  noch nicht zugeordneten Schurken. Steht schon einer im Feld, ist der Würfel gesperrt;
  ein Würfel überschreibt nie eine Wahl.
* **Karten auslosen** (MC27) — dieselbe Regel, zwei Formen, weil die Kampagne zwei
  Formen kennt. Der Würfel neben einer *Osborn-Tech*-Zelle zieht **eine** Karte und
  trägt sie ein, aus den Karten, die in keiner anderen Zelle stehen. Der Würfel neben
  dem *S.H.I.E.L.D.-Tech*-Feld eines Spielers teilt **drei** Verbesserungen aus, von
  denen der Spieler eine behält: die drei erscheinen unter dem Feld und werden mit
  einem Klick eingetragen. Die Auslosung selbst wird nicht gespeichert — sie ist keine
  Eintragung auf dem Bogen und steht nur bis zur Wahl. Beide Würfel sind genau dann
  bedienbar, wenn das Feld daneben es ist, und keiner überschreibt eine Wahl.
* **„Nächste Runde"** (MC60) — zieht zwei Szenarien, die noch im Spiel sind, und gibt jedem
  einen Fortschrittspunkt. Ist nur noch eines im Spiel, bekommt es beide.
* **Mehrere Durchläufe** parallel, mit Auswahl oben; die Kampagne wird beim Anlegen
  gewählt und bleibt danach fest. Die Auswahl gruppiert nach Kampagne — und zwar
  nach **jeder** umgesetzten Kampagne, auch einer, von der noch kein Bogen
  existiert; direkt unter jeder Überschrift steht `< Neue Kampagne starten >`.
  Das legt keinen Bogen an, sondern öffnet den Dialog „Neuer Bogen" mit dieser
  Kampagne schon angekreuzt. So ist jede Kampagne von hier aus zu beginnen, und
  nicht nur die, die man schon spielt. Wer die Zeile aus Versehen erwischt, bricht ab und hat nichts
  angerichtet; die Auswahl springt vorher schon auf den Bogen zurück, der
  wirklich offen ist.
* **Automatisch gespeichert** im Speicher des Browsers — kein Server, kein Konto,
  keine Übertragung irgendwohin.
* **Export / Import** als JSON, und **Link teilen**: der komplette Bogen steckt
  komprimiert in der Adresse. Der Teilen-Knopf steht oben rechts in der Leiste und
  nicht im Menü — er ist die eine Handlung, die man mitten im Spiel braucht, und
  es gibt ihn deshalb genau einmal. Was er tut, hängt am Gerät: auf einem Zeigegerät
  landet der Link in der Zwischenablage, auf einem Touchgerät öffnet er das
  System-Teilen; der Knopf trägt das übliche Teilen-Zeichen, drei Punkte mit
  zwei Verbindungslinien. Es ist das einzige Inline-SVG im Projekt, und zwar aus
  demselben Grund, aus dem alles andere hier CSS ist: Halbtonraster und
  Schraffur sind Texturen und dürfen ungefähr sein, dieses Zeichen ist eine
  Figur und muss stimmen. Gezeichnet statt aus einem Icon-Satz genommen, weil es
  *nur* seine Geometrie ist — Kreise mit r=3 auf dem 24er-Raster und zwei Balken
  zwischen ihren Rändern —, und eine lizenzierte Kopie brächte
  Nennungspflicht und ein Fremdasset für vier Zeilen Rechnung. Entschieden wird
  das am **Zeiger**
  (`(hover: none) and (pointer: coarse)`), nicht an der Kennung des Browsers:
  `navigator.share` gibt es auch auf dem Desktop, wo ein Teilen-Dialog die falsche
  Antwort ist. Wird der Dialog abgebrochen, passiert nichts — abbrechen ist eine
  Entscheidung und kein Fehler; scheitert er dagegen, übernimmt die Zwischenablage,
  und ohne Zwischenablage steht der Link zum Herauskopieren im Dialog.
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
| `heroes.js` | 68 Helden (Name, Lebenspunkte) als Vorschlagsliste für die Identitätsfelder |
| `campaigns/fear-no-evil.js` | die Kampagne MC60: eigenes Datenmodell, eigenes Rendering, eigene Strings |
| `campaigns/rise-of-red-skull.js` | die Kampagne MC10: feste Kartenpools mit ihren Eindeutigkeitsregeln und drei Szenariofelder; bewusst ohne Szenario-Tabelle |
| `campaigns/mad-titans-shadow.js` | die Kampagne MC21: Spieler und neun benannte Kästchen in vier Szenario-Abschnitten; das schlankeste der Module |
| `campaigns/sinister-motives.js` | die Kampagne MC27: die vier Kartensätze der Kampagne, drei Belohnungsfelder in der Spielerkarte und die Reputationsleiste, die Stufen *und* Felder freischaltet |
| `campaigns/mutant-genesis.js` | die Kampagne MC32: benannte Kästchen über fünf gedruckten Kartensätzen, ein Gitter aus Kartensatz × Szenario, und Beschriftungen, die aus der gewählten Rolle eines Spielers fallen |
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

Hier steht der **Vertrag** eines Moduls. Der **Arbeitsweg** — Vorschau-Branch,
Farben aus dem Bogen-PDF messen, Testfälle, Merge nach `main` — steht in
[`CLAUDE.md`](CLAUDE.md), zusammen mit den Fallstricken, die dabei schon Zeit
gekostet haben.

1. `campaigns/<id>.js` anlegen und `window.registerCampaign({...})` aufrufen:

   ```js
   window.registerCampaign({
     id: "kurzname-der-kampagne",  // stabil, wandert in jeden Bogen
     code: "MC99",
     titleEn: "…", titleDe: "…",
     theme: "kk",               // -> <html data-campaign="kk">
     stateVersion: 1,
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

Als Vorlagen dienen die fünf vorhandenen Module, und sie sind bewusst
unterschiedlich: `campaigns/fear-no-evil.js` zeigt abgeleiteten Zustand, gegenseitige
Sperren, eine Auslosung und ein `migrate()`; `campaigns/rise-of-red-skull.js` ist das
schlanke Gegenstück — reine Eingabefelder, kein `migrate()`, keine erfundenen Felder;
`campaigns/mad-titans-shadow.js` ist das kürzeste — Spieler plus benannte Kästchen;
`campaigns/sinister-motives.js` zeigt feste Kartensätze in Zellgittern, in denen die
*Position* Teil der Eintragung ist, und einen abgeleiteten Zustand, der aus einer
einzigen Zahl fällt; `campaigns/mutant-genesis.js` zeigt Beschriftungen, die aus einer
Wahl abgeleitet werden, ein Gitter aus Kartensatz × Szenario, und die Grenze zwischen
einer Sperre und einem Hinweis.

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
node test/run-browser.js            # Selbsttest im echten Browser (544 Assertions)
node test/run-browser.js print      # nur ein Fall: basic | quarantine | share | lang |
                                    #   langpath | print | import | lock |
                                    #   lockconflict | random | randomspread |
                                    #   appearance | players | migrate | expert |
                                    #   round | roundlast | roundspread |
                                    #   rrs | rrsdialog | rrsprint | rrspools |
                                    #   rrsexpert | mts | mtsexpert | mtsprint |
                                    #   sm | smrep | smexpert | smprint |
                                    #   mg | mgrole | mgexpert | mgprint |
                                    #   sharebtn
BROWSER_LANG=de-DE node test/run-browser.js   # unter einer anderen Browser-Sprache
```

`test/seed.html` legt einen ausgefüllten Beispielbogen an und springt in die App —
praktisch für Screenshots und für den Druckvergleich. `?c=mc10` nimmt den MC10-Bogen,
`?c=mc21` den MC21-Bogen, `?c=mc27` den MC27-Bogen und `?c=mc32` den MC32-Bogen statt
MC60, `?expert=0` stellt
den Bogen auf
Standardstufe, und `?theme=dark` nagelt das
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
auf Tiefgrün mit Senfgelb, MC21 Indigo und Lavendel auf Rostorange mit Gold, MC27
Karminrot und Altrosa auf Violett mit Pink, MC32 Teal und Minze auf Tiefteal mit
Gold — alle fünf aus dem jeweiligen Bogen-PDF gemessen. Bei MC32 reichte die reine
Vektormessung nicht: die orange Comic-Schraffur seines Randes ist ein Rasterbild und
kommt in keiner Vektorfläche vor, sie lebt hier deshalb im Halbtonraster und in der
Schraffur — was sie auf dem Bogen auch ist. Ein
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
  die Lebenspunkte unterscheiden sich aber.
* **Das Identitätsfeld ist Freitext**, `heroes.js` liefert nur Vorschläge. Ein Umbenennen
  in der Liste ändert also nie einen bestehenden Bogen — dort bleibt der eingetippte
  Name stehen, höchstens der Lebenspunkte-Hinweis daneben findet keine Entsprechung
  mehr. Es gibt deshalb nichts zu migrieren, wenn die Liste wächst oder sich ändert.
* `health` darf `null` sein, wenn ein Wert nicht belegt ist; der Hinweis neben dem Feld
  bleibt dann leer. Ein erfundener Wert wäre schlechter als keiner.
