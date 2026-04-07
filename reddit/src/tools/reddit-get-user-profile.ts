import type { BrowserSDK } from "gace-sdk";
import { waitForElement, extractCommentBody } from "../utils/dom-helpers";

export async function redditGetUserProfile(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;

    const link = await doc.createElement("a");
    await link.setAttribute(
        "href",
        `https://www.reddit.com/user/${sdk.args.username}/`,
    );
    await link.click();

    await sdk.time.sleep(2000);
    await waitForElement(doc, '[data-testid="profile-main"]', sdk, 8000);

    const displayName = await doc.querySelector(
        'h1[data-testid="profile-display-name"]',
    );
    const karmaEl = await doc.querySelector(
        'span[data-testid="karma-number"]',
    );

    const username = displayName
        ? await displayName.textContent
        : sdk.args.username;
    const karma = karmaEl ? await karmaEl.textContent : "unknown";

    const postElements = await doc.querySelectorAll("shreddit-post");
    const postCount = Math.min(await postElements.length, 5);
    const recentPosts = [];

    for (let i = 0; i < postCount; i++) {
        const el = await postElements.item(i);
        if (!el) continue;
        const [title, subreddit, score] = await Promise.all([
            el.getAttribute("post-title"),
            el.getAttribute("subreddit-prefixed-name"),
            el.getAttribute("score"),
        ]);
        recentPosts.push({
            title,
            subreddit,
            score: score ? parseInt(score, 10) : 0,
        });
    }

    const commentElements = await doc.querySelectorAll(
        "shreddit-profile-comment",
    );
    const commentCount = Math.min(await commentElements.length, 5);
    const recentComments = [];

    for (let i = 0; i < commentCount; i++) {
        const el = await commentElements.item(i);
        if (!el) continue;
        const commentId = await el.getAttribute("comment-id");
        const body = commentId
            ? await extractCommentBody(doc, commentId)
            : "";

        recentComments.push({
            body: body.length > 200 ? body.substring(0, 200) + "..." : body,
        });
    }

    return {
        tabId: tab.id,
        pageType: "profile" as const,
        username,
        karma,
        recentPosts,
        recentComments,
    };
}
