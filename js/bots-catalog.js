/**
 * Renders /bots/catalog.json into the Nostr page.
 * New bots appear after catalog.json is updated (onboarding publish / manual sync).
 */
(function () {
  "use strict";

  const CATALOG_URL = "/bots/catalog.json";

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

  function renderGroup(group) {
    const bots = visibleBots(group);
    if (!bots.length) {
      return "";
    }
    const featured = bots.some((b) => b.featured);
    const gridClass = featured ? "bots-grid bots-grid--featured" : "bots-grid";
    const cards = bots.map((bot) => botCard(bot, !!bot.featured)).join("");
    return (
      `<section class="bot-group" id="group-${escapeHtml(group.id)}" aria-labelledby="title-${escapeHtml(group.id)}">` +
      `<h2 id="title-${escapeHtml(group.id)}">${escapeHtml(group.title)}</h2>` +
      `<p class="section-sub">${escapeHtml(group.description || "")}</p>` +
      `<div class="${gridClass}">${cards}</div>` +
      `</section>`
    );
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
      mount.innerHTML = (catalog.groups || []).map(renderGroup).join("");
      updateStats(catalog);
      revealCards();
    } catch (err) {
      console.error("Bot-Katalog konnte nicht geladen werden:", err);
      mount.innerHTML =
        '<p class="catalog-error">Bot-Liste konnte nicht geladen werden. Bitte Seite neu laden.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
