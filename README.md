# Reddit Blank Home & No Sidebars

A small Tampermonkey userscript that customizes Reddit’s UI:

- Blanks the home feed (`/`) while keeping the top header
- Hides left and right sidebars on all subreddit pages (`/r/*`), including posts
- Works with Reddit’s single-page app navigation (no refresh required)

## Installation

1. [Go to the script on greasyfork](https://greasyfork.org/en/scripts/565877-remove-reddit-home-feed-and-side-panels)
1. Press Install
2. Enjoy

Alternatively, copy the script manually into a new Tampermonkey script.

## Updating

Updates are automatic as long as you installed from the raw GitHub URL.  
When the `@version` number changes, Tampermonkey will offer the update.

## Notes

This script hides elements using CSS instead of removing DOM nodes, which makes it resilient to Reddit’s frequent UI re-renders.

Selectors may need adjustment if Reddit changes its layout or class names.

## License

MIT
