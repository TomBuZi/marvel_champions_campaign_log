/* Marvel Champions hero roster — suggestions for the "Identity" fields.

   Generated from marvelsdb-json-data (pack/*.json, type_code "hero") plus the
   German names from its translations/de. Hero names are identical in the German
   edition apart from a single entry, so `de` is only set where it differs.

   `health` is the hero's printed starting hit points; the app shows it as a
   reminder next to the remaining-hit-points field. It is null where the value
   is not in that data set — the Fear No Evil heroes are too new for it, and an
   invented number would be worse than none.

   The list is only a suggestion list: the identity fields accept free text, so
   a hero missing here can still be typed in.

   Loaded as a plain script (no ES module) so the app also works via file://. */
window.HEROES = [
  { slug: "adam-warlock",          en: "Adam Warlock",            de: null,          health:   11 },
  { slug: "angel",                 en: "Angel",                   de: null,          health:   12 },
  { slug: "ant-man",               en: "Ant-Man",                 de: null,          health:   12 },
  { slug: "archangel",             en: "Archangel",               de: null,          health:   12 },
  { slug: "bishop",                en: "Bishop",                  de: null,          health:   12 },
  { slug: "black-panther",         en: "Black Panther",           de: null,          health:   11 },
  { slug: "black-widow",           en: "Black Widow",             de: null,          health:    9 },
  { slug: "cable",                 en: "Cable",                   de: null,          health:   12 },
  { slug: "captain-america",       en: "Captain America",         de: null,          health:   11 },
  { slug: "captain-marvel",        en: "Captain Marvel",          de: null,          health:   12 },
  { slug: "colossus",              en: "Colossus",                de: null,          health:   14 },
  { slug: "cyclops",               en: "Cyclops",                 de: null,          health:   10 },
  { slug: "daredevil",             en: "Daredevil",               de: null,          health:   10 },
  { slug: "deadpool",              en: "Deadpool",                de: null,          health:    9 },
  { slug: "doctor-strange",        en: "Doctor Strange",          de: null,          health:   10 },
  { slug: "domino",                en: "Domino",                  de: null,          health:    9 },
  { slug: "drax",                  en: "Drax",                    de: null,          health:   14 },
  { slug: "echo",                  en: "Echo",                    de: null,          health:    9 },
  { slug: "falcon",                en: "Falcon",                  de: null,          health:   10 },
  { slug: "gambit",                en: "Gambit",                  de: null,          health:    9 },
  { slug: "gamora",                en: "Gamora",                  de: null,          health:   10 },
  { slug: "ghost-spider",          en: "Ghost-Spider",            de: null,          health:   10 },
  { slug: "groot",                 en: "Groot",                   de: null,          health:   10 },
  { slug: "hawkeye",               en: "Hawkeye",                 de: null,          health:    9 },
  { slug: "hercules",              en: "Hercules",                de: null,          health:   14 },
  { slug: "hulk",                  en: "Hulk",                    de: null,          health:   18 },
  { slug: "hulkling",              en: "Hulkling",                de: null,          health:   13 },
  { slug: "iceman",                en: "Iceman",                  de: null,          health:   11 },
  { slug: "iron-man",              en: "Iron Man",                de: null,          health:    9 },
  { slug: "ironheart",             en: "Ironheart",               de: null,          health:   10 },
  { slug: "jubilee",               en: "Jubilee",                 de: null,          health:    9 },
  { slug: "magik",                 en: "Magik",                   de: null,          health:   10 },
  { slug: "magneto",               en: "Magneto",                 de: null,          health:   10 },
  { slug: "maria-hill",            en: "Maria Hill",              de: null,          health:    9 },
  { slug: "ms-marvel",             en: "Ms. Marvel",              de: null,          health:   10 },
  { slug: "nebula",                en: "Nebula",                  de: null,          health:    9 },
  { slug: "nick-fury",             en: "Nick Fury",               de: null,          health:   10 },
  { slug: "nightcrawler",          en: "Nightcrawler",            de: null,          health:    9 },
  { slug: "nova",                  en: "Nova",                    de: null,          health:   10 },
  { slug: "phoenix",               en: "Phoenix",                 de: null,          health:    9 },
  { slug: "psylocke",              en: "Psylocke",                de: null,          health:   10 },
  { slug: "quicksilver",           en: "Quicksilver",             de: null,          health:    9 },
  { slug: "rocket-raccoon",        en: "Rocket Raccoon",          de: null,          health:    9 },
  { slug: "rogue",                 en: "Rogue",                   de: null,          health:   11 },
  { slug: "scarlet-witch",         en: "Scarlet Witch",           de: null,          health:   10 },
  { slug: "shadowcat",             en: "Shadowcat",               de: null,          health:    9 },
  { slug: "she-hulk",              en: "She-Hulk",                de: null,          health:   15 },
  { slug: "silk",                  en: "Silk",                    de: null,          health:   10 },
  { slug: "sp-dr",                 en: "SP//dr",                  de: null,          health:   14 },
  { slug: "spectrum",              en: "Spectrum",                de: null,          health:   11 },
  { slug: "spider-ham",            en: "Spider-Ham",              de: null,          health:   12 },
  { slug: "spider-man-mm",         en: "Spider-Man * Miles Morales", de: null,          health:   9 },
  { slug: "spider-man-pp",         en: "Spider-Man * Peter Parker", de: null,          health:   10 },
  { slug: "spider-woman",          en: "Spider-Woman",            de: null,          health:   11 },
  { slug: "star-lord",             en: "Star-Lord",               de: null,          health:   10 },
  { slug: "storm",                 en: "Storm",                   de: null,          health:   10 },
  { slug: "thor",                  en: "Thor",                    de: null,          health:   14 },
  { slug: "tigra",                 en: "Tigra",                   de: null,          health:   10 },
  { slug: "valkyrie",              en: "Valkyrie",                de: null,          health:   12 },
  { slug: "venom",                 en: "Venom",                   de: null,          health:   12 },
  { slug: "vision",                en: "Vision",                  de: null,          health:   11 },
  { slug: "war-machine",           en: "War Machine",             de: null,          health:   10 },
  { slug: "wasp",                  en: "Wasp",                    de: null,          health:   11 },
  { slug: "winter-soldier",        en: "Winter Soldier",          de: null,          health:   11 },
  { slug: "wolverine",             en: "Wolverine",               de: null,          health:   10 },
  { slug: "wonder-man",            en: "Wonder Man",              de: null,          health:   12 },
  { slug: "x-23",                  en: "X-23",                    de: null,          health:   10 },
];
