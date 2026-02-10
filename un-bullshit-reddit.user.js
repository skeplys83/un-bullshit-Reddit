// ==UserScript==
// @name         Un-Bullshit Reddit
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Clean up and enhance your Reddit browsing experience by filtering unwanted content
// @author       skeplys83
// @match        https://www.reddit.com/*
// @match        https://old.reddit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        filterKeywords: GM_getValue('filterKeywords', []),
        hideAwards: GM_getValue('hideAwards', false),
        hidePromotedPosts: GM_getValue('hidePromotedPosts', true),
        cleanUI: GM_getValue('cleanUI', true),
        enableAutoScroll: GM_getValue('enableAutoScroll', false)
    };

    // Add custom styles
    GM_addStyle(`
        .unbullshit-filtered {
            opacity: 0.3;
            pointer-events: none;
        }
        .unbullshit-hidden {
            display: none !important;
        }
        .unbullshit-control-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1a1b;
            border: 1px solid #343536;
            border-radius: 4px;
            padding: 15px;
            z-index: 10000;
            color: #d7dadc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .unbullshit-control-panel h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #ff4500;
        }
        .unbullshit-control-panel label {
            display: block;
            margin: 8px 0;
            cursor: pointer;
        }
        .unbullshit-control-panel input[type="checkbox"] {
            margin-right: 8px;
        }
        .unbullshit-toggle-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ff4500;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s;
        }
        .unbullshit-toggle-btn:hover {
            transform: scale(1.1);
        }
    `);

    // Main filtering function
    function filterContent() {
        // Hide promoted posts
        if (CONFIG.hidePromotedPosts) {
            const promotedPosts = document.querySelectorAll('[data-promoted="true"], [data-adclicklocation], .promotedlink, div[data-testid*="promoted"]');
            promotedPosts.forEach(post => {
                post.classList.add('unbullshit-hidden');
            });
        }

        // Hide awards if enabled
        if (CONFIG.hideAwards) {
            const awards = document.querySelectorAll('[class*="award"], [class*="Award"], [id*="award"]');
            awards.forEach(award => {
                award.classList.add('unbullshit-hidden');
            });
        }

        // Filter by keywords
        if (CONFIG.filterKeywords.length > 0) {
            const posts = document.querySelectorAll('[data-testid="post-container"], .thing, article');
            posts.forEach(post => {
                const text = post.textContent.toLowerCase();
                const shouldFilter = CONFIG.filterKeywords.some(keyword =>
                    text.includes(keyword.toLowerCase())
                );
                if (shouldFilter) {
                    post.classList.add('unbullshit-filtered');
                }
            });
        }

        // Clean UI elements if enabled
        if (CONFIG.cleanUI) {
            // Remove unnecessary UI elements
            const cleanTargets = document.querySelectorAll(
                '[class*="premium"], [class*="Premium"], ' +
                '[class*="banner"], [data-testid*="banner"]'
            );
            cleanTargets.forEach(el => {
                if (!el.closest('[data-testid="post-container"]')) {
                    el.style.opacity = '0.5';
                }
            });
        }
    }

    // Create control panel
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'unbullshit-control-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <h3>🧹 Un-Bullshit Reddit</h3>
            <label>
                <input type="checkbox" id="unbullshit-promoted" ${CONFIG.hidePromotedPosts ? 'checked' : ''}>
                Hide Promoted Posts
            </label>
            <label>
                <input type="checkbox" id="unbullshit-awards" ${CONFIG.hideAwards ? 'checked' : ''}>
                Hide Awards
            </label>
            <label>
                <input type="checkbox" id="unbullshit-clean" ${CONFIG.cleanUI ? 'checked' : ''}>
                Clean UI
            </label>
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'unbullshit-toggle-btn';
        toggleBtn.textContent = '🧹';
        toggleBtn.title = 'Toggle Un-Bullshit Reddit Panel';

        toggleBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // Event listeners for checkboxes
        panel.querySelector('#unbullshit-promoted').addEventListener('change', (e) => {
            CONFIG.hidePromotedPosts = e.target.checked;
            GM_setValue('hidePromotedPosts', e.target.checked);
            filterContent();
        });

        panel.querySelector('#unbullshit-awards').addEventListener('change', (e) => {
            CONFIG.hideAwards = e.target.checked;
            GM_setValue('hideAwards', e.target.checked);
            filterContent();
        });

        panel.querySelector('#unbullshit-clean').addEventListener('change', (e) => {
            CONFIG.cleanUI = e.target.checked;
            GM_setValue('cleanUI', e.target.checked);
            filterContent();
        });

        document.body.appendChild(toggleBtn);
        document.body.appendChild(panel);
    }

    // Initialize the script
    function init() {
        // Wait for the page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Create control panel
        if (document.body) {
            createControlPanel();
        } else {
            setTimeout(init, 100);
            return;
        }

        // Initial filter
        filterContent();

        // Watch for new content (for infinite scroll)
        const observer = new MutationObserver((mutations) => {
            filterContent();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('Un-Bullshit Reddit: Initialized');
    }

    // Start the script
    init();
})();
