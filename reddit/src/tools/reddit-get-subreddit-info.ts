import type { BrowserSDK } from "gace-sdk";
import { extractSubredditInfo } from "../utils/dom-helpers";

export async function redditGetSubredditInfo(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;

    const info = await extractSubredditInfo(doc);
    if (!info) {
        throw new Error(
            "No subreddit info found. Make sure you're on a subreddit page.",
        );
    }

    return {
        tabId: tab.id,
        pageType: "subreddit_info" as const,
        ...info,
    };
}
