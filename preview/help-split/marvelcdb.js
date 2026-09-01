/* MarvelCDB deck references — recognising them, linking to them, looking them up.

   The identity fields take a hero name as free text. They also take a deck: a
   bare MarvelCDB deck id ("1213577") or a full link to one. From the id the
   link is built, and the hero behind the deck is fetched so the name does not
   have to be typed a second time.

   This is the only place in the app that touches the network, and it is the
   only place that may: everything else works offline and from file://. The
   lookup is therefore strictly optional. It never throws, it resolves to null
   on any kind of failure, and the id — and with it the link — is kept by the
   caller whether the lookup succeeds or not. Without a network the sheet loses
   the convenience of the hero name, nothing else.

   No DOM, no storage: test/lint.js runs this file headless.

   Loaded as a plain script (no ES module) so the app also works via file://. */
(function (global) {
  "use strict";

  var HOST = "https://marvelcdb.com";

  /* A deck link, in the shapes the site hands out. The host has to be
     marvelcdb.com itself — a path that merely looks like one ("/deck/view/1"
     on somebody else's domain) is not a deck reference, or an imported sheet
     could carry a link to anywhere. The action segment is left open ("view",
     "edit", "compare", …) because the id sits behind all of them. */
  var LINK_RE =
    /^(?:https?:\/\/)?(?:www\.)?marvelcdb\.com(?::\d+)?(\/[^\s]*)$/i;
  var PATH_RE = /^\/(?:deck|decklist)\/[a-z_-]+\/(\d{1,12})(?:[\/?#]|$)/i;

  /* A bare id. Safe to treat as one: no hero is named in digits, so a field
     holding nothing but a number cannot be a name someone meant to type. */
  var ID_RE = /^\d{1,12}$/;

  /* Two heroes can carry the same printed name, and the API reports only that
     name: "Spider-Man" is both Peter Parker and Miles Morales, "Black Panther"
     is both T'Challa and Shuri. Only hero_code tells them apart, so the four
     codes that need it are spelled out. Everything else is matched by name —
     the roster in heroes.js and the API both come from marvelsdb-json-data, so
     the strings are the same on both sides. Getting this wrong would be quiet:
     the sheet would show a plausible name with the other hero's hit points. */
  var BY_CODE = {
    "01001a": "Spider-Man * Peter Parker",
    "27030a": "Spider-Man * Miles Morales",
    "01040a": "Black Panther * T'Challa",
    "51001a": "Black Panther * Shuri",
  };

  /* The id out of whatever was typed, or null if this is ordinary free text.
     Leading zeros are dropped so the same deck always yields the same string —
     the id is what gets stored, and "01" and "1" must not become two decks. */
  function parseRef(raw) {
    var text = String(raw == null ? "" : raw).trim();
    if (!text) return null;
    var id = null;
    if (ID_RE.test(text)) {
      id = text;
    } else {
      var host = text.match(LINK_RE);
      var path = host && host[1].match(PATH_RE);
      if (path) id = path[1];
    }
    if (id == null) return null;
    id = String(Number(id));
    return id === "0" ? null : id;      // there is no deck 0
  }

  /* Only ever built from a stored id, never stored as typed. */
  function deckUrl(id) {
    return HOST + "/deck/view/" + String(id);
  }

  /* The same address without the scheme, for the printout: it has to be short
     enough to sit under a player line and still be typeable off paper. */
  function shortUrl(id) {
    return "marvelcdb.com/deck/view/" + String(id);
  }

  /* The hero behind a deck, in the language of the interface, or null.

     Two endpoints, because the site keeps personal decks and published
     decklists apart and the same number can be either. A missing or private
     deck answers with a redirect to the login page, so the response is HTML
     with a perfectly fine status — the failure shows up as JSON that does not
     parse, or as a body without hero_name, never as a bad status code. */
  function lookup(id, lang) {
    return fetchHero("deck", id)
      .then(function (found) { return found || fetchHero("decklist", id); })
      .then(function (found) { return found ? rosterName(found, lang) : null; });
  }

  function fetchHero(kind, id) {
    /* No network at all (an old browser, a stubbed test): not an error, just
       nothing to report. */
    if (typeof global.fetch !== "function") return Promise.resolve(null);
    /* A plain GET with no headers of our own on purpose: any custom header
       turns this into a preflighted request, and the server answers OPTIONS
       with 405. The plain form is allowed by its Access-Control-Allow-Origin. */
    return global.fetch(HOST + "/api/public/" + kind + "/" + String(id) + ".json")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || typeof data.hero_name !== "string" || !data.hero_name) return null;
        return { code: data.hero_code, name: data.hero_name };
      })
      .catch(function () { return null; });
  }

  /* Map the API's hero onto the roster, so the German interface gets the
     German name and the hit point hint finds its entry. A hero the roster has
     not caught up with yet keeps the API's name: showing it is better than
     showing nothing, and the field is free text anyway. */
  function rosterName(found, lang) {
    var wanted = BY_CODE[found.code] || found.name;
    var roster = global.HEROES || [];
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].en === wanted) {
        return (lang === "de" && roster[i].de) ? roster[i].de : roster[i].en;
      }
    }
    return wanted;
  }

  global.MCDB = {
    parseRef: parseRef,
    deckUrl: deckUrl,
    shortUrl: shortUrl,
    lookup: lookup,
  };
})(window);
