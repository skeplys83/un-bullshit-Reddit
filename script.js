// ==UserScript==
// @name         Remove Reddit Home feed and side panels
// @namespace    https://tampermonkey.net/
// @version      0.6
// @description  Keeps Reddit’s top header, blanks the homepage feed, hides sidebars on all /r/* pages including posts. Re-applies on SPA navigation.
// @match        https://www.reddit.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
  "use strict";

  const STYLE_ID = "tm-reddit-hide-style";

  const isHome = () => location.pathname === "/";
  const isSubreddit = () => /^\/r\/[^/]+(?:\/.*)?$/.test(location.pathname); // any /r/<name>/...

  const ensureStyle = () => {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    return style;
  };

  const killHomeLink = () => {
    document.querySelectorAll('a[href="/"]').forEach(a => {
      a.removeAttribute("href");
      a.style.pointerEvents = "none";
      a.style.cursor = "default";
    });
  };

  const apply = () => {
    killHomeLink();

    const style = ensureStyle();

    let css = "";

    if (isHome()) {
      // Blank only the home feed (keep header)
      css = `
        .left-sidebar, .right-sidebar, .main { display: none !important; }
      `;
    } else if (isSubreddit()) {
      // Hide sidebars on ALL subreddit pages (listing + comments + anything under /r/)
      css = `
        .left-sidebar, .right-sidebar { display: none !important; }
      `;
    }

    style.textContent = css;
  };

  // SPA navigation: re-run when URL changes
  let lastUrl = location.href;
  const tick = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      apply();
    }
    requestAnimationFrame(tick);
  };

  apply();
  requestAnimationFrame(tick);
  addEventListener("DOMContentLoaded", apply);
  addEventListener("load", apply);
})();
