import type { BrowserSDK } from "gace-sdk";
import {
    waitForElement,
    extractPosts,
    extractSubredditInfo,
} from "../utils/dom-helpers";

export async function redditGoToSubreddit(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const sort = sdk.args.sort || "hot";
    const doc: any = tab.document;

    const link = await doc.createElement("a");
    await link.setAttribute(
        "href",
        `https://www.reddit.com/r/${sdk.args.subreddit}/${sort}/`,
    );
    await link.click();

    await sdk.time.sleep(2000);
    await waitForElement(doc, "shreddit-post", sdk, 8000);

    const posts = await extractPosts(doc, 10);
    const info = await extractSubredditInfo(doc);

    return {
        tabId: tab.id,
        pageType: "subreddit_feed" as const,
        subreddit: `r/${sdk.args.subreddit}`,
        sort,
        posts,
        subredditInfo: info,
    };
}
