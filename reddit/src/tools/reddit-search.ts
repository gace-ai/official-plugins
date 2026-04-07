import type { BrowserSDK } from "gace-sdk";
import { waitForElement, extractSearchResults } from "../utils/dom-helpers";

export async function redditSearch(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const { query, sort, timeFilter } = sdk.args;

    let searchUrl: string;
    if (sdk.args.scope === "subreddit") {
        const match = tab.url.match(/\/r\/([^/]+)/);
        const sub = match ? match[1] : "";
        searchUrl = `https://www.reddit.com/r/${sub}/search?q=${encodeURIComponent(query)}`;
    } else {
        searchUrl = `https://www.reddit.com/search?q=${encodeURIComponent(query)}`;
    }

    if (sort) searchUrl += `&sort=${sort}`;
    if (timeFilter) searchUrl += `&t=${timeFilter}`;

    const doc: any = tab.document;
    const link = await doc.createElement("a");
    await link.setAttribute("href", searchUrl);
    await link.click();

    await sdk.time.sleep(2000);

    // Search results use a[data-testid="post-title-text"], not shreddit-post
    const freshDoc: any = tab.document;
    await waitForElement(
        freshDoc,
        'a[data-testid="post-title-text"]',
        sdk,
        10000,
    );

    const results = await extractSearchResults(freshDoc, 15);

    return {
        tabId: tab.id,
        pageType: "search" as const,
        query,
        results,
    };
}
