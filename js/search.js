/**
 * Client-side site search for bitcoin-akzeptieren.ch
 * Index: /js/search-index.json (regenerate with tools/build_search_index.py)
 */
(function () {
  "use strict";

  var INDEX_URL = "/js/search-index.json";
  var indexPromise = null;
  var placeholders = [
    "Seed Phrase sichern",
    "Bitcoin Steuern Schweiz",
    "Lightning",
    "Hardware Wallet",
    "Nostr",
  ];
  var placeholderTimer = null;
  var activeIdx = -1;
  var navWired = false;
  var pageWired = false;

  var ALIASES = {
    btc: "bitcoin",
    sat: "satoshi",
    sats: "satoshi",
    ln: "lightning",
    hw: "hardware wallet",
    wallet: "wallet",
    seed: "seed",
    kyc: "kyc",
    utxo: "utxo",
    node: "full node",
    kmu: "haendler kmu",
    steuern: "steuern",
  };

  function fold(s) {
    if (!s) return "";
    return String(s)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function tokenize(q) {
    var t = fold(q).replace(/[^\w\s/+-]/g, " ");
    return t.split(/\s+/).filter(function (w) {
      return w.length >= 2;
    });
  }

  function expandTokens(tokens) {
    var out = [];
    tokens.forEach(function (t) {
      out.push(t);
      if (ALIASES[t]) {
        tokenize(ALIASES[t]).forEach(function (a) {
          if (out.indexOf(a) === -1) out.push(a);
        });
      }
    });
    return out;
  }

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch(INDEX_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("index " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data && data.placeholders && data.placeholders.length) {
          placeholders = data.placeholders;
        }
        (data.entries || []).forEach(function (e) {
          e._title = fold(e.title || "");
          e._desc = fold(e.description || "");
          e._kw = fold((e.keywords || []).join(" "));
          e._body = fold(e.body || "");
          e._type = fold(e.type || "");
          e._cat = fold(e.category || "");
          e._all = [e._title, e._desc, e._kw, e._body, e._type, e._cat].join(" ");
        });
        return data;
      })
      .catch(function (err) {
        console.error("[search] index load failed", err);
        indexPromise = null;
        return { entries: [], placeholders: placeholders };
      });
    return indexPromise;
  }

  function scoreEntry(e, tokens, rawFold) {
    if (!tokens.length) return 0;
    var score = 0;
    var title = e._title;
    var allMatch = true;

    if (rawFold && title.indexOf(rawFold) !== -1) {
      score += 120;
      if (title.indexOf(rawFold) === 0) score += 40;
    }

    tokens.forEach(function (tok) {
      var hit = false;
      if (title === tok) {
        score += 100;
        hit = true;
      } else if (title.indexOf(tok) === 0) {
        score += 70;
        hit = true;
      } else if (title.indexOf(tok) !== -1) {
        score += 45;
        hit = true;
      }
      if (e._kw.indexOf(tok) !== -1) {
        score += 32;
        hit = true;
      }
      if (e._type.indexOf(tok) !== -1 || e._cat.indexOf(tok) !== -1) {
        score += 18;
        hit = true;
      }
      if (e._desc.indexOf(tok) !== -1) {
        score += 14;
        hit = true;
      }
      if (e._body.indexOf(tok) !== -1) {
        score += 6;
        hit = true;
      }
      if (!hit) allMatch = false;
    });

    if (allMatch && tokens.length > 1) score += 25 * tokens.length;
    score *= e.boost || 1;
    // Prefer articles over monologue pages slightly when scores close: boost already set
    return score;
  }

  function search(query, limit) {
    limit = limit || 12;
    var raw = (query || "").trim();
    if (raw.length < 2) return Promise.resolve([]);
    var rawFold = fold(raw);
    var tokens = expandTokens(tokenize(raw));
    if (!tokens.length) return Promise.resolve([]);

    return loadIndex().then(function (data) {
      var scored = [];
      (data.entries || []).forEach(function (e) {
        var s = scoreEntry(e, tokens, rawFold);
        if (s >= 14) {
          scored.push({ entry: e, score: s });
        }
      });
      scored.sort(function (a, b) {
        return b.score - a.score;
      });
      return scored.slice(0, limit);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeLabel(t) {
    return t || "Seite";
  }

  function renderList(container, results, query) {
    if (!container) return;
    if (!results.length) {
      container.innerHTML =
        '<div class="search-empty">Keine Treffer für „' +
        escapeHtml(query) +
        "“. Probiere andere Begriffe oder öffne die <a href=\"/suche.html\">Suchseite</a>.</div>";
      container.hidden = false;
      return;
    }
    var html = results
      .map(function (r, i) {
        var e = r.entry;
        var desc = e.description || e.keywords.slice(0, 4).join(" · ") || "";
        return (
          '<a class="search-hit" role="option" id="search-opt-' +
          i +
          '" href="' +
          escapeHtml(e.url) +
          '" data-idx="' +
          i +
          '">' +
          '<span class="search-hit-type">' +
          escapeHtml(typeLabel(e.type)) +
          "</span>" +
          '<span class="search-hit-title">' +
          escapeHtml(e.title) +
          "</span>" +
          (desc
            ? '<span class="search-hit-desc">' + escapeHtml(desc) + "</span>"
            : "") +
          "</a>"
        );
      })
      .join("");
    container.innerHTML =
      html +
      '<a class="search-hit search-hit-all" href="/suche.html?q=' +
      encodeURIComponent(query) +
      '">Alle Ergebnisse auf der Suchseite →</a>';
    container.hidden = false;
    activeIdx = -1;
  }

  function setActive(container, idx) {
    var hits = container.querySelectorAll(".search-hit");
    hits.forEach(function (el, i) {
      el.classList.toggle("is-active", i === idx);
    });
    activeIdx = idx;
    if (idx >= 0 && hits[idx]) {
      hits[idx].scrollIntoView({ block: "nearest" });
    }
  }

  function cyclePlaceholder(input) {
    if (!input || input === document.activeElement) return;
    if (input.value) return;
    var i = Math.floor(Math.random() * placeholders.length);
    input.setAttribute("placeholder", "z.B. " + placeholders[i] + " …");
  }

  function wireNavSearch() {
    if (navWired) return;
    var input = document.getElementById("site-search-input");
    var panel = document.getElementById("site-search-results");
    if (!input || !panel) return;
    navWired = true;

    loadIndex().then(function () {
      cyclePlaceholder(input);
      if (placeholderTimer) clearInterval(placeholderTimer);
      placeholderTimer = setInterval(function () {
        cyclePlaceholder(input);
      }, 4500);
    });

    var debounce = null;
    function run() {
      var q = input.value.trim();
      input.setAttribute("aria-expanded", q.length >= 2 ? "true" : "false");
      if (q.length < 2) {
        panel.hidden = true;
        panel.innerHTML = "";
        return;
      }
      search(q, 8).then(function (results) {
        renderList(panel, results, q);
      });
    }

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(run, 140);
    });

    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2) run();
    });

    input.addEventListener("keydown", function (ev) {
      var hits = panel.querySelectorAll(".search-hit");
      if (ev.key === "ArrowDown" && hits.length) {
        ev.preventDefault();
        setActive(panel, Math.min(activeIdx + 1, hits.length - 1));
      } else if (ev.key === "ArrowUp" && hits.length) {
        ev.preventDefault();
        setActive(panel, Math.max(activeIdx - 1, 0));
      } else if (ev.key === "Enter") {
        if (activeIdx >= 0 && hits[activeIdx]) {
          ev.preventDefault();
          window.location.href = hits[activeIdx].getAttribute("href");
        } else if (input.value.trim().length >= 2) {
          ev.preventDefault();
          window.location.href =
            "/suche.html?q=" + encodeURIComponent(input.value.trim());
        }
      } else if (ev.key === "Escape") {
        panel.hidden = true;
        input.blur();
      }
    });

    document.addEventListener("click", function (ev) {
      if (!panel.contains(ev.target) && ev.target !== input) {
        panel.hidden = true;
      }
    });
  }

  function wireSearchPage() {
    if (pageWired) return;
    var form = document.getElementById("search-page-form");
    var input = document.getElementById("search-page-input");
    var out = document.getElementById("search-page-results");
    var meta = document.getElementById("search-page-meta");
    if (!form || !input || !out) return;
    pageWired = true;

    function paint(q) {
      if (meta) {
        meta.textContent = q.length < 2 ? "Mindestens 2 Zeichen eingeben." : "Suche…";
      }
      if (q.length < 2) {
        out.innerHTML = "";
        return;
      }
      search(q, 40).then(function (results) {
        if (meta) {
          meta.textContent =
            results.length +
            " Treffer für „" +
            q +
            "“ · Artikel, Begriffe, Tools und Seiten";
        }
        if (!results.length) {
          out.innerHTML =
            '<p class="search-empty">Nichts gefunden. Tipps: kürzere Stichworte (Seed, Lightning, Steuern), deutsche Synonyme, oder zum <a href="/wissen.html">Wissen</a> / <a href="/glossar.html">Glossar</a>.</p>';
          return;
        }
        out.innerHTML = results
          .map(function (r) {
            var e = r.entry;
            return (
              '<a class="search-page-card" href="' +
              escapeHtml(e.url) +
              '">' +
              '<span class="search-hit-type">' +
              escapeHtml(typeLabel(e.type)) +
              (e.level ? " · " + escapeHtml(e.level) : "") +
              "</span>" +
              "<h2>" +
              escapeHtml(e.title) +
              "</h2>" +
              (e.description
                ? "<p>" + escapeHtml(e.description) + "</p>"
                : "") +
              "</a>"
            );
          })
          .join("");
      });
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (initial) {
      input.value = initial;
      paint(initial.trim());
    }

    loadIndex().then(function () {
      if (!input.value) {
        input.placeholder = "z.B. " + placeholders[0] + " …";
      }
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = input.value.trim();
      var url = new URL(window.location.href);
      url.searchParams.set("q", q);
      window.history.replaceState({}, "", url);
      paint(q);
    });

    var debounce = null;
    input.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        var q = input.value.trim();
        var url = new URL(window.location.href);
        if (q) url.searchParams.set("q", q);
        else url.searchParams.delete("q");
        window.history.replaceState({}, "", url);
        paint(q);
      }, 180);
    });
  }

  window.BA_SEARCH = {
    search: search,
    loadIndex: loadIndex,
    init: function () {
      wireNavSearch();
      wireSearchPage();
    },
  };
})();
