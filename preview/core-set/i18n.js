/* UI strings for the app shell. German first, English second.

   Campaign-specific wording lives in campaigns/*.js, not here: only the shell
   (menu, dialogs, toasts, notices, help chrome) is translated in this file.

   Deliberately touches no DOM and defines no behaviour, so CI can load it with
   new Function("window", src) and check that both dictionaries carry the same
   keys. Loaded as a plain script (no ES module) so the app also works via
   file://. */
window.I18N = {
  de: {
    htmlLang: "de",
    langSwitch: "EN",
    langSwitchTitle: "Switch to English",

    appTitle: "Kampagnen-Logbuch",
    appSubtitle: "Marvel Champions",
    /* "%s" = Produktcode. Den Kampagnennamen trägt die Wortmarke darüber, der
       Untertitel nennt nur noch die Herkunft. */
    appSubtitlePattern: "Marvel Champions · %s",
    unofficial: "inoffiziell",
    logLabel: "Bogen",
    untitled: "Ohne Titel",
    /* Die Zeile unter jeder Kampagnen-Überschrift der Bogen-Auswahl. Die
       spitzen Klammern setzt core.js, damit sie keiner Übersetzung verloren
       gehen können. */
    newRun: "Neue Kampagne starten",
    menu: "Menü",
    close: "Schließen",

    menuLog: "Bogen",
    newLog: "Neuer Bogen …",
    renameLog: "Umbenennen …",
    deleteLog: "Löschen …",
    menuData: "Daten",
    export: "Exportieren (.json)",
    import: "Importieren …",
    shareLink: "Link teilen",
    print: "Drucken",
    printTitle: "Druckansicht des aktiven Bogens",
    menuView: "Ansicht",
    themeToDark: "Dunkles Design",
    themeToLight: "Helles Design",

    newLogTitle: "Neuer Bogen",
    renamePrompt: "Neuer Name für diesen Bogen:",
    deleteConfirm: "Diesen Bogen wirklich löschen? Das lässt sich nicht rückgängig machen.",
    savedNotice: "Automatisch gespeichert",
    exportReminder: "Dieser Bogen enthält Änderungen, die auf diesem Gerät noch nie exportiert wurden. Der Browser-Speicher ist kein sicheres Langzeitarchiv — jetzt eine Sicherung anlegen?",

    chooseCampaignTitle: "Neuer Bogen",
    chooseCampaignHint: "Die Kampagne eines Bogens lässt sich später nicht mehr ändern.",
    chooseCampaignLabel: "Kampagne",
    logTitleLabel: "Name des Bogens",
    create: "Anlegen",
    cancel: "Abbrechen",
    /* "%s" = Anzahl der Szenarien. */

    linkCopied: "Link in die Zwischenablage kopiert.",
    linkCopiedLong: "Link kopiert — er ist allerdings sehr lang. Messenger, Mail-Programme und QR-Codes kürzen solche Links stillschweigend; im Zweifel besser die JSON-Datei weitergeben.",
    linkCopyManual: "Link kopieren:",
    linkLongWarn: "Der Link ist allerdings sehr lang. Messenger, Mail-Programme und QR-Codes kürzen solche Links stillschweigend; im Zweifel besser die JSON-Datei weitergeben.",
    importSuccess: "Bogen importiert.",
    importUpdated: "Bogen aktualisiert.",
    importError: "Die Datei ließ sich nicht lesen. Erwartet wird eine JSON-Datei, die diese App exportiert hat.",
    importQuarantined: "Bogen gespeichert, aber diese Version der App kann ihn nicht anzeigen. Er bleibt unverändert erhalten und lässt sich weiterhin exportieren.",
    /* "%s" = Name des vorhandenen Bogens. */
    importUpdateGuidConfirm: "„%s“ ist schon vorhanden. Mit der importierten Fassung überschreiben?",
    importSameNameConfirm: "Es gibt schon einen Bogen namens „%s“. OK überschreibt ihn, Abbrechen legt einen zweiten daneben an.",
    loadFromLinkConfirm: "Dieser Link enthält einen Kampagnenbogen. Als neuen Bogen übernehmen?",

    futureSchemaWarning: "Dieser Bogen wurde mit einer neueren Version der App gespeichert und kann hier nicht angezeigt werden. Er bleibt unverändert erhalten — lade die Seite neu, um eine neuere Version zu bekommen. Wechseln, Exportieren, Teilen und Löschen funktionieren weiterhin.",
    /* "%s" = Kennung der unbekannten Kampagne. */
    unknownCampaignWarning: "Dieser Bogen gehört zur Kampagne „%s“, die diese Version der App nicht kennt. Er bleibt unverändert erhalten — lade die Seite neu, um eine neuere Version zu bekommen. Wechseln, Exportieren, Teilen und Löschen funktionieren weiterhin.",
    /* "%s" = Kampagnentitel. */
    futureStateWarning: "Dieser Bogen nutzt eine neuere Fassung der Kampagne „%s“ als diese Version der App. Er bleibt unverändert erhalten — lade die Seite neu, um eine neuere Version zu bekommen. Wechseln, Exportieren, Teilen und Löschen funktionieren weiterhin.",

    addEntry: "+ Eintrag",
    removeEntry: "Eintrag entfernen",
    confirmRemoveEntry: "Diesen Eintrag entfernen?",
    dragReorder: "Zum Umsortieren ziehen",

    /* Deck-Verknüpfung im Identitätsfeld. "%s" = die MarvelCDB-Deck-Kennung. */
    deckChip: "Deck %s",
    deckOpen: "Deck %s auf MarvelCDB öffnen (neuer Tab)",
    deckClear: "Verknüpfung zu Deck %s entfernen",
    deckCopy: "Deck-ID %s kopieren",
    deckCopied: "Deck-ID %s kopiert.",
    deckCopyManual: "Deck-ID zum Kopieren:",
    deckPrint: "Deck",
    deckLocksIdentity: "Der Held kommt aus dem verknüpften Deck. Zum Ändern erst die Verknüpfung mit dem × entfernen.",
    deckLookupFailed: "Deck %s konnte nicht abgerufen werden — vielleicht ist es privat, vielleicht fehlt gerade das Netz. Der Link steht trotzdem im Bogen.",

    printedOn: "Gedruckt am",
    printCampaign: "Kampagne",
    printLog: "Bogen",

    helpTitle: "Hilfe",
    helpHeading: "Hilfe – Bedienung",
    helpIntro: "Diese Seite ersetzt den gedruckten Kampagnenbogen. Alles läuft im Browser; der Bogen selbst wird nirgendwohin geschickt. Die einzige Ausnahme steht unter „Deck verknüpfen“.",
    helpStoreH: "Speichern",
    helpStoreP: "Jede Änderung wird nach kurzer Pause automatisch im Speicher dieses Browsers abgelegt. Das ist kein Langzeitarchiv: Browser räumen diesen Speicher unter Platzmangel auf, und iOS-Safari leert ihn nach sieben Tagen ohne Besuch. Für alles, was erhalten bleiben soll, im Menü „Exportieren“ benutzen.",
    helpLogsH: "Mehrere Bögen",
    helpLogsP: "Über die Auswahl oben lässt sich zwischen mehreren Durchläufen wechseln; „Neuer Bogen“ im Menü legt einen weiteren an. Die Kampagne wird beim Anlegen gewählt und bleibt danach fest.",
    helpSheetH: "Der Bogen",
    helpSheetP: "Die Abschnitte entsprechen Feld für Feld dem gedruckten Bogen der Kampagne. Zahlenfelder dürfen leer bleiben; leer heißt „noch nichts eingetragen“, nicht „null“. Wo der Bogen keine gedruckte Liste vorgibt, ist das Feld Freitext — was dort hineingehört, kommt aus dem eigenen Deck oder der eigenen Sammlung. Manche Felder hängen voneinander ab und öffnen erst, wenn ein anderes gesetzt ist; eine solche Sperre schließt aber nie ein bereits gesetztes Häkchen. So bleibt ein Bogen, der sich widerspricht — aus einem Import oder einem alten Link —, immer korrigierbar, und der Bogen benennt den Widerspruch, statt ihn zu verstecken.",
    helpPlayersH: "Spieler",
    helpPlayersP: "„+ Spieler“ legt eine weitere Karte an, das × oben rechts entfernt eine wieder. Mehr als vier kennt das Spiel nicht, und der letzte Spieler bleibt stehen — sonst stünde niemand mehr auf dem Bogen. Ins Identitätsfeld darf ein Held aus der Vorschlagsliste, ein beliebiger Freitext oder ein Deck von MarvelCDB — die Liste ist ein Angebot, keine Auswahl. Passt der Name auf einen bekannten Helden, steht neben den Lebenspunkten sein aufgedruckter Startwert als Erinnerung.",
    helpExpertH: "Expertenmodus",
    helpExpertP: "Der Haken oben im Spielerbereich stellt den Bogen auf die Expertenstufe der Kampagne um: es erscheinen die Felder, die nur dort gebraucht werden — bei den meisten Kampagnen die verbleibenden Lebenspunkte, die von einem Szenario ins nächste mitgehen. Ausblenden ist nicht Löschen: wer zurückschaltet, verliert nichts. Der Wert bleibt im Bogen, im Export und im geteilten Link und steht beim nächsten Einschalten wieder da.",
    helpDeckH: "Deck verknüpfen",
    helpDeckP: "Als Deck zählt die Kennung („1213577“) ebenso wie der ganze Link, den die Seite herausgibt. Der Bogen merkt sich die Kennung, zeigt darunter einen Link auf das Deck und trägt den Helden ein, den er dort findet. Das ⧉ neben dem Link legt die Kennung in die Zwischenablage — nicht die Adresse, die steht ja schon als Link daneben; die Kennung ist das, was dieses Feld auf dem nächsten Bogen und die Suche auf MarvelCDB annehmen. Solange ein Deck verknüpft ist, ist das Feld gesperrt — der Held kommt ja von dort; das × am Link gibt es wieder frei. Das ist der einzige Netzwerkzugriff der App: dabei geht die Deck-Kennung an marvelcdb.com, sonst nichts. Ohne Netz, bei einem privaten Deck oder einer falschen Kennung bleibt der Link trotzdem stehen; den Namen trägt man dann selbst ein, nachdem man die Verknüpfung mit dem × gelöst hat.",
    helpListsH: "Listen",
    helpListsP: "Listeneinträge lassen sich am Griff links umsortieren — mit Maus, Finger oder Stift. „+“ ist gesperrt, solange eine leere Zeile offen ist; eine Zeile, die geleert und verlassen wird, verschwindet von selbst.",
    helpStrikeH: "Erledigt markieren",
    helpStrikeP: "Eine Tilde „~“ am Anfang eines Listeneintrags streicht ihn durch, ohne ihn zu löschen. Beim Hineinklicken erscheint der Rohtext wieder.",
    helpShareH: "Weitergeben",
    helpShareP: "„Exportieren“ legt eine JSON-Datei ab, „Importieren“ liest sie zurück — auch in einem anderen Browser oder auf einem anderen Gerät. „Link teilen“ packt den ganzen Bogen komprimiert in die Adresse; bequem, bei langen Bögen aber unhandlich.",
    helpPrintH: "Drucken",
    helpPrintP: "„Drucken“ erzeugt eine reine Textfassung des aktiven Bogens in Schwarzweiß. Gedruckt wird nicht die Bildschirmansicht, damit nichts abgeschnitten wird.",
    helpLangThemeH: "Sprache und Design",
    helpLangThemeP: "Sprache und hell/dunkel stehen im Menü unter „Ansicht“ und bleiben für diesen Browser gespeichert. Ohne eigene Wahl folgt die Sprache dem Browser und das Design der Systemeinstellung. Ein Link kann die Sprache mitbringen: „/de/“ oder „/en/“ am Ende der Adresse — oder „?lang=de“ bzw. „?lang=en“ — stellt sie beim Aufrufen ein und merkt sie sich.",
    helpLegalH: "Rechtliches",
    helpLegalP: "Inoffizielles Fan-Projekt. Wiedergegeben werden nur Namen und die Feldbezeichnungen des Bogens — keine Logos, Illustrationen oder Kartentexte.",

    contactLead: "Fehler gefunden oder ein Wunsch?",
    contactTitle: "Fehler melden oder einen Änderungswunsch schicken",
    thanks: "Danke sagen",
    thanksTitle: "Auf Ko-fi einen Kaffee spendieren (öffnet in einem neuen Tab)",

    disclaimer: "Dies ist ein inoffizielles, nicht kommerzielles Fan-Projekt. „Marvel Champions: Das Kartenspiel“ sowie alle zugehörigen Szenario-, Karten- und Produktnamen sind urheberrechtlich geschützt durch Fantasy Flight Games / Asmodee; alle Marvel-Charaktere, -Namen und -Logos sind Marken und © MARVEL. Diese Website wird von Fantasy Flight Games, Asmodee und Marvel weder produziert noch unterstützt oder befürwortet und steht in keiner Verbindung zu ihnen. Es werden keine offiziellen Logos, Artworks oder Kartentexte verwendet — die Optik ist lediglich mit eigenen Farben und Schriften nachempfunden.",
  },

  en: {
    htmlLang: "en",
    langSwitch: "DE",
    langSwitchTitle: "Auf Deutsch umschalten",

    appTitle: "Campaign Log",
    appSubtitle: "Marvel Champions",
    appSubtitlePattern: "Marvel Champions · %s",
    unofficial: "unofficial",
    logLabel: "Log",
    untitled: "Untitled",
    newRun: "Start a new campaign",
    menu: "Menu",
    close: "Close",

    menuLog: "Log",
    newLog: "New log …",
    renameLog: "Rename …",
    deleteLog: "Delete …",
    menuData: "Data",
    export: "Export (.json)",
    import: "Import …",
    shareLink: "Share link",
    print: "Print",
    printTitle: "Print view of the active log",
    menuView: "View",
    themeToDark: "Dark theme",
    themeToLight: "Light theme",

    newLogTitle: "New log",
    renamePrompt: "New name for this log:",
    deleteConfirm: "Really delete this log? This cannot be undone.",
    savedNotice: "Saved automatically",
    exportReminder: "This log holds changes that have never been exported on this device. Browser storage is not a safe long-term archive — make a backup now?",

    chooseCampaignTitle: "New log",
    chooseCampaignHint: "The campaign of a log cannot be changed later.",
    chooseCampaignLabel: "Campaign",
    logTitleLabel: "Log name",
    create: "Create",
    cancel: "Cancel",

    linkCopied: "Link copied to the clipboard.",
    linkCopiedLong: "Link copied — but it is very long. Messengers, mail clients and QR codes truncate such links silently; when in doubt, pass on the JSON file instead.",
    linkCopyManual: "Copy this link:",
    linkLongWarn: "The link is very long, though. Messengers, mail clients and QR codes truncate such links silently; when in doubt, pass on the JSON file instead.",
    importSuccess: "Log imported.",
    importUpdated: "Log updated.",
    importError: "That file could not be read. A JSON file exported by this app is expected.",
    importQuarantined: "Log saved, but this version of the app cannot display it. It is kept unchanged and can still be exported.",
    importUpdateGuidConfirm: "“%s” is already here. Overwrite it with the imported version?",
    importSameNameConfirm: "There is already a log named “%s”. OK overwrites it, Cancel adds a second one alongside.",
    loadFromLinkConfirm: "This link carries a campaign log. Take it over as a new log?",

    futureSchemaWarning: "This log was saved by a newer version of the app and cannot be shown here. It is kept unchanged — reload the page to get a newer version. Switching, exporting, sharing and deleting still work.",
    unknownCampaignWarning: "This log belongs to the campaign “%s”, which this version of the app does not know. It is kept unchanged — reload the page to get a newer version. Switching, exporting, sharing and deleting still work.",
    futureStateWarning: "This log uses a newer edition of the “%s” campaign than this version of the app. It is kept unchanged — reload the page to get a newer version. Switching, exporting, sharing and deleting still work.",

    addEntry: "+ Entry",
    removeEntry: "Remove entry",
    confirmRemoveEntry: "Remove this entry?",
    dragReorder: "Drag to reorder",

    /* Deck link in the identity field. "%s" = the MarvelCDB deck id. */
    deckChip: "Deck %s",
    deckOpen: "Open deck %s on MarvelCDB (new tab)",
    deckClear: "Remove the link to deck %s",
    deckCopy: "Copy deck ID %s",
    deckCopied: "Deck ID %s copied.",
    deckCopyManual: "Deck ID to copy:",
    deckPrint: "Deck",
    deckLocksIdentity: "The hero comes from the linked deck. Remove the link with the × to change it.",
    deckLookupFailed: "Deck %s could not be fetched — it may be private, or the network may be away. The link is on the sheet regardless.",

    printedOn: "Printed on",
    printCampaign: "Campaign",
    printLog: "Log",

    helpTitle: "Help",
    helpHeading: "Help – how it works",
    helpIntro: "This page replaces the printed campaign log. Everything runs in the browser; the log itself is never sent anywhere. The one exception is described under “Linking a deck”.",
    helpStoreH: "Saving",
    helpStoreP: "Every change is written to this browser storage after a short pause. That is not an archive: browsers clear it under pressure, and iOS Safari wipes it after seven days without a visit. Use “Export” in the menu for anything you want to keep.",
    helpLogsH: "Several logs",
    helpLogsP: "The picker at the top switches between runs; “New log” in the menu adds another. The campaign is chosen when the log is created and stays fixed afterwards.",
    helpSheetH: "The sheet",
    helpSheetP: "The sections match the printed campaign log field for field. Number fields may stay empty; empty means “nothing recorded yet”, not zero. Where the sheet prints no list to choose from, the field is free text — what belongs there comes out of your own deck or your own collection. Some fields depend on others and open only once something else is set; such a lock never closes a box that is already ticked, though. A sheet that contradicts itself — out of an import, or an old link — therefore stays correctable, and the sheet names the contradiction rather than hiding it.",
    helpPlayersH: "Players",
    helpPlayersP: "“+ Player” adds another card, the × in its top corner takes one away. The game does not go beyond four, and the last player stays — a sheet with nobody on it is not a sheet. The identity field takes a hero from the suggestion list, any free text, or a MarvelCDB deck — the list is an offer, not a menu. When the name matches a hero we know, that hero’s printed starting value sits beside the hit points as a reminder.",
    helpExpertH: "Expert mode",
    helpExpertP: "The tick at the top of the player area switches the sheet to the campaign’s expert difficulty: the fields only needed there appear — for most campaigns the remaining hit points that carry from one scenario into the next. Hiding is not deleting: switching back loses nothing. The value stays in the sheet, in an export and in a shared link, and is there again the next time expert mode goes on.",
    helpDeckH: "Linking a deck",
    helpDeckP: "A deck counts as its id (“1213577”) just as well as the whole link the site hands out. The sheet keeps the id, shows a link to the deck below the field and fills in the hero it finds there. The ⧉ beside the link copies the id — not the address, which is already the link next to it; the id is what this same field takes on the next sheet and what MarvelCDB's own search takes. While a deck is linked the field is locked — the hero comes from there; the × on the link gives it back. This is the only network access the app makes: the deck id goes to marvelcdb.com, nothing else does. Without a network, for a private deck or a wrong id the link still stands; the name is then typed by hand, once the link has been cleared with the ×.",
    helpListsH: "Lists",
    helpListsP: "List entries can be reordered by their grip on the left — with mouse, finger or pen. “+” is disabled while an empty row is open; a row that is emptied and left disappears by itself.",
    helpStrikeH: "Marking things done",
    helpStrikeP: "A leading tilde “~” on a list entry strikes it through without deleting it. Clicking into the field brings the raw text back.",
    helpShareH: "Passing it on",
    helpShareP: "“Export” writes a JSON file, “Import” reads it back — in another browser or on another device too. “Share link” packs the whole log, compressed, into the address; convenient, but unwieldy for a long log.",
    helpPrintH: "Printing",
    helpPrintP: "“Print” builds a plain black-and-white text version of the active log. The screen view is not printed, so nothing gets clipped.",
    helpLangThemeH: "Language and theme",
    helpLangThemeP: "Language and light/dark live in the menu under “View” and are remembered for this browser. Without an explicit choice the language follows the browser and the theme follows the system setting. A link can carry the language along: “/de/” or “/en/” at the end of the address — or “?lang=de” / “?lang=en” — sets it on arrival and is remembered.",
    helpLegalH: "Legal",
    helpLegalP: "Unofficial fan project. Only names and the field labels of the sheet are reproduced — no logos, artwork or card text.",

    contactLead: "Found a bug or have a wish?",
    contactTitle: "Report a bug or send a change request",
    thanks: "Say thanks",
    thanksTitle: "Buy a coffee on Ko-fi (opens in a new tab)",

    disclaimer: "This is an unofficial, non-commercial fan project. “Marvel Champions: The Card Game” and all associated scenario, card and product names are copyrighted by Fantasy Flight Games / Asmodee; all Marvel characters, names and logos are trademarks of and © MARVEL. This website is not produced, endorsed or supported by, nor affiliated with, Fantasy Flight Games, Asmodee or Marvel. No official logos, artwork or card text are used — the look is evoked with our own colours and typography only.",
  },
};

/* Dictionary for a language code, defaulting to German. */
window.t = function (lang) {
  return window.I18N[lang] || window.I18N.de;
};
