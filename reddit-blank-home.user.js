// ==UserScript==
// @name         Remove Reddit Home feed and side panels
// @namespace    https://github.com/skeplys83/un-bullshit-Reddit
// @version      0.8
// @description  Removes the home feed + left/right side panels across Reddit (subreddits, posts, profiles). SPA-safe (no infinite loading).
// @match        https://www.reddit.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
  "use strict";

  const STYLE_ID = "tm-reddit-layout-fix-style";
  const HOME_PLACEHOLDER_ID = "tm-home-placeholder";

  const isHome = () => location.pathname === "/";
  const isSubreddit = () => /^\/r\/[^/]+(?:\/.*)?$/.test(location.pathname);       // /r/<name>/...
  const isProfile = () => /^\/(user|u)\/[^/]+(?:\/.*)?$/.test(location.pathname);  // /user/<name> or /u/<name>

  // ---- Selectors (redundant on purpose; Reddit changes markup often) ----
  const LEFT_SIDEBAR_SELECTORS = [
    ".left-sidebar",
    "[data-testid='left-sidebar']",
    "#left-sidebar",
    "nav[aria-label='Primary']",
    "nav[aria-label='Primary navigation']",
    // NOTE: Avoid removing ALL nav[role='navigation'] — too broad.
  ];

  const RIGHT_SIDEBAR_SELECTORS = [
    "recent-posts",
    // NOTE: Do NOT use "aside" — it's too broad and can break app layout/loading.
  ];

  // ---- Helpers ----
  const ensureStyle = () => {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    return style;
  };

  // Layout fix only (not hiding content): helps center column expand after removals
  const applyLayoutFixCSS = () => {
    const style = ensureStyle();
    // Avoid rewriting if identical to reduce needless mutations
    const css = `
  /* Center the remaining column after rails are removed */
  main, #AppRouter-main-content {
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* Remove leftover gutter that was reserved for the left rail */
  main, #AppRouter-main-content, [class*="Layout"], [class*="layout"] {
    padding-left: 0 !important;
    margin-left: 0 !important;
  }

  /* Don’t force full-width; let Reddit’s own max-width keep things nicely centered */
`;
    if (style.textContent !== css) style.textContent = css;
  };

  const removeAll = (selectors) => {
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        // Very defensive: don't delete anything inside the top header area
        if (el.closest("header")) return;
        el.remove();
      });
    }
  };

  const nukeHomeFeed = () => {
    const main = document.querySelector("main");
    if (!main) return;

    // If we've already nuked it, don't keep re-mutating
    if (document.getElementById(HOME_PLACEHOLDER_ID)) return;

    while (main.firstChild) main.firstChild.remove();

    const ph = document.createElement("div");
    ph.id = HOME_PLACEHOLDER_ID;
    ph.style.padding = "24px";
    ph.style.fontSize = "14px";
    ph.style.opacity = "0.8";
    ph.textContent = "Home feed removed by userscript.";
    main.appendChild(ph);
  };

  // ---- SPA navigation hooks ----
  const hookHistory = () => {
    const wrap = (fnName) => {
      const orig = history[fnName];
      history[fnName] = function (...args) {
        const ret = orig.apply(this, args);
        queueApply();
        return ret;
      };
    };
    wrap("pushState");
    wrap("replaceState");
    addEventListener("popstate", queueApply, { passive: true });
  };

  // ---- Mutation observer (throttled + ignores our own changes) ----
  let mo = null;
  let applyTimer = null;
  let isApplying = false;

  const queueApply = () => {
    if (applyTimer) return;
    applyTimer = setTimeout(() => {
      applyTimer = null;
      apply();
    }, 200);
  };

  const observe = () => {
    mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const t = m.target;

        // Ignore mutations caused by our own nodes
        if (t && (t.id === STYLE_ID || t.id === HOME_PLACEHOLDER_ID)) continue;

        // If anything meaningful changed, re-apply (throttled)
        if ((m.addedNodes && m.addedNodes.length) || (m.removedNodes && m.removedNodes.length)) {
          queueApply();
          return;
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  };

  // ---- Apply changes (disconnect observer while we mutate DOM) ----
  const apply = () => {
    if (isApplying) return;
    isApplying = true;

    try {
      if (mo) mo.disconnect();

      applyLayoutFixCSS();

      // Remove sidebars everywhere (including profiles and posts)
      removeAll(LEFT_SIDEBAR_SELECTORS);
      removeAll(RIGHT_SIDEBAR_SELECTORS);

      // Home: remove feed contents (not just hide)
      if (isHome()) nukeHomeFeed();

      // Extra pass for routes that often re-inject rails
      if (isProfile() || isSubreddit()) {
        removeAll(LEFT_SIDEBAR_SELECTORS);
        removeAll(RIGHT_SIDEBAR_SELECTORS);
      }
    } finally {
      if (mo) mo.observe(document.documentElement, { childList: true, subtree: true });
      isApplying = false;
    }
  };

  // ---- Kickoff ----
  hookHistory();
  observe();
  apply();

  addEventListener("DOMContentLoaded", apply, { passive: true });
  addEventListener("load", apply, { passive: true });
})();
