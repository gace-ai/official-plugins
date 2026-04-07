import type { BrowserSDK } from "gace-sdk";
import { extractPosts, extractSubredditInfo } from "../utils/dom-helpers";

export async function redditGetFeedPosts(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;

    if (sdk.args.scrollForMore) {
        const scrollCount = Math.min(sdk.args.maxScrolls || 1, 3);
        for (let i = 0; i < scrollCount; i++) {
            const scrollEl = doc.scrollingElement;
            if (scrollEl) {
                const currentHeight = await scrollEl.scrollHeight;
                await scrollEl.scrollTo(0, currentHeight);
                await sdk.time.sleep(2000);
            }
        }
    }

    const posts = await extractPosts(doc, 20);
    const info = await extractSubredditInfo(doc);

    return {
        tabId: tab.id,
        pageType: "feed" as const,
        subreddit: info?.subreddit || null,
        posts,
    };
}
