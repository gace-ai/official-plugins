import type { BrowserSDK } from "gace-sdk";
import {
    waitForElement,
    parsePageType,
    extractPosts,
} from "../utils/dom-helpers";

export async function redditOpen(sdk: BrowserSDK) {
    const url = sdk.args.url || "https://www.reddit.com";
    const { tab } = await sdk.tabs.open(url);
    const doc: any = tab.document;

    await waitForElement(
        doc,
        "shreddit-post, [data-testid='profile-main'], r-post-composer-form",
        sdk,
        8000,
    );

    const pageType = parsePageType(tab.url);
    const result: any = { tabId: tab.id, pageType, url: tab.url };

    if (pageType === "feed") {
        const posts = await extractPosts(doc, 5);
        result.posts = posts;
        const header = await doc.querySelector("shreddit-subreddit-header");
        if (header) {
            result.subreddit = await header.getAttribute("prefixed-name");
        }
    }

    return result;
}
