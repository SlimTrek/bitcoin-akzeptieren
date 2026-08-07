/**
 * Renders /bots/catalog.json into the Nostr page.
 * New bots appear after catalog.json is updated (onboarding publish / manual sync).
 */
(function () {
  "use strict";

  const CATALOG_URL = "/bots/catalog.json";
  const CORE_OPEN_BY_DEFAULT = true;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function visibleBots(group) {
    return (group.bots || []).filter((bot) => bot && bot.visible !== false && bot.npub);
  }

  function botCard(bot, featured) {
    const name = escapeHtml(bot.display_name);
    const tag = escapeHtml(bot.tag || "");
    const blurb = escapeHtml(bot.blurb || "");
    const nip05 = escapeHtml(bot.nip05 || "");
    const npub = encodeURIComponent(bot.npub);
    const avatar = escapeHtml(bot.avatar || "");
    const cardClass = featured ? "bot-card bot-card--featured" : "bot-card";

    return (
      `<article class="${cardClass}">` +
      `<img class="bot-avatar" src="${avatar}" alt="${name}" width="72" height="72" loading="lazy" ` +
      `onerror="this.classList.add('is-fallback');this.removeAttribute('src');">` +
      (tag ? `<span class="bot-tag">${tag}</span>` : "") +
      `<h3>${name}</h3>` +
      (nip05 ? `<p class="bot-nip05">${nip05}</p>` : "") +
      `<p class="bot-blurb">${blurb}</p>` +
      `<div class="bot-actions">` +
      `<a class="btn" href="nostr:${npub}">In App öffnen</a>` +
      `<a class="btn-outline" href="https://primal.net/p/${npub}" target="_blank" rel="noopener noreferrer">Web</a>` +
      `</div>` +
      `</article>`
    );
  }

  function renderGroup(group, { open } = {}) {
    const bots = visibleBots(group);
    if (!bots.length) {
      return "";
    }
    const featured = bots.some((b) => b.featured);
    const gridClass = featured ? "bots-grid bots-grid--featured" : "bots-grid";
    const cards = bots.map((bot) => botCard(bot, !!bot.featured)).join("");
    const count = bots.length;
    const openAttr = open ? " open" : "";
    return (
      `<details class="bot-group" id="group-${escapeHtml(group.id)}" data-group-id="${escapeHtml(group.id)}"${openAttr}>` +
      `<summary class="bot-group__summary">` +
      `<span class="bot-group__title" id="title-${escapeHtml(group.id)}">${escapeHtml(group.title)}</span>` +
      `<span class="bot-group__count">${count}</span>` +
      `</summary>` +
      `<p class="section-sub">${escapeHtml(group.description || "")}</p>` +
      `<div class="${gridClass}">${cards}</div>` +
      `</details>`
    );
  }

  function renderFilter(groups) {
    const options = groups
      .filter((g) => visibleBots(g).length)
      .map(
        (g) =>
          `<option value="${escapeHtml(g.id)}">${escapeHtml(g.title)} (${visibleBots(g).length})</option>`
      )
      .join("");
    return (
      `<div class="bots-filter" id="bots-filter">` +
      `<label for="bots-niche-select">Nische wählen</label>` +
      `<select id="bots-niche-select" aria-controls="bots-catalog-groups">` +
      `<option value="all">Alle Nischen</option>` +
      options +
      `</select>` +
      `</div>`
    );
  }

  function applyNicheFilter(selectedId) {
    const groups = document.querySelectorAll(".bot-group[data-group-id]");
    groups.forEach((el) => {
      const id = el.getAttribute("data-group-id");
      const match = selectedId === "all" || id === selectedId;
      el.hidden = !match;
      if (match && selectedId !== "all") {
        el.open = true;
      }
    });
  }

  function bindFilter() {
    const select = document.getElementById("bots-niche-select");
    if (!select) {
      return;
    }

    function syncFromSelect() {
      applyNicheFilter(select.value);
      if (select.value !== "all") {
        const target = document.getElementById("group-" + select.value);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }

    function syncFromHash() {
      const hash = (location.hash || "").replace(/^#group-/, "");
      if (hash && [...select.options].some((o) => o.value === hash)) {
        select.value = hash;
        applyNicheFilter(hash);
        const target = document.getElementById("group-" + hash);
        if (target) {
          target.open = true;
        }
      }
    }

    select.addEventListener("change", syncFromSelect);
    window.addEventListener("hashchange", syncFromHash);
    syncFromHash();
  }

  function updateStats(catalog) {
    const groups = catalog.groups || [];
    let total = 0;
    groups.forEach((g) => {
      total += visibleBots(g).length;
    });
    const totalEl = document.getElementById("stat-bots");
    const groupsEl = document.getElementById("stat-groups");
    if (totalEl) {
      totalEl.textContent = String(total);
    }
    if (groupsEl) {
      groupsEl.textContent = String(groups.filter((g) => visibleBots(g).length).length);
    }
  }

  function renderOperator(operator) {
    const mount = document.getElementById("operator-card");
    if (!mount || !operator || !operator.npub) {
      return;
    }
    const name = escapeHtml(operator.name || "Operator");
    const nip05 = escapeHtml(operator.nip05 || "");
    const npub = encodeURIComponent(operator.npub);
    mount.innerHTML =
      `<article class="operator-card bot-card is-visible">` +
      `<span class="bot-tag">Operator</span>` +
      `<h3>${name}</h3>` +
      (nip05 ? `<p class="bot-nip05">${nip05}</p>` : "") +
      `<p class="bot-blurb">Mensch hinter den Bots — Bildung &amp; Mentoring auf dieser Website, Nostr als Nebenraum.</p>` +
      `<div class="bot-actions">` +
      `<a class="btn" href="nostr:${npub}">In App öffnen</a>` +
      `<a class="btn-outline" href="https://primal.net/p/${npub}" target="_blank" rel="noopener noreferrer">Web</a>` +
      `<a class="btn-outline" href="/about.html">About</a>` +
      `</div>` +
      `</article>`;
  }

  function revealCards() {
    const cards = document.querySelectorAll(".bot-card, .benefit-card, .step-card");
    if (!("IntersectionObserver" in window)) {
      cards.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    cards.forEach((el) => observer.observe(el));
  }

  async function init() {
    const mount = document.getElementById("bots-catalog");
    if (!mount) {
      return;
    }

    try {
      const response = await fetch(CATALOG_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      const catalog = await response.json();
      const groups = catalog.groups || [];
      renderOperator(catalog.operator);
      mount.innerHTML =
        renderFilter(groups) +
        `<div id="bots-catalog-groups">` +
        groups
          .map((g) =>
            renderGroup(g, {
              open: CORE_OPEN_BY_DEFAULT && g.id === "core",
            })
          )
          .join("") +
        `</div>`;
      updateStats(catalog);
      bindFilter();
      revealCards();
    } catch (err) {
      console.error("Bot-Katalog konnte nicht geladen werden:", err);
      mount.innerHTML =
        '<p class="catalog-error">Bot-Liste konnte nicht geladen werden. Bitte Seite neu laden.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
