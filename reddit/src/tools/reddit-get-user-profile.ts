import type { BrowserSDK } from "gace-sdk";
import { waitForElement, extractCommentBody } from "../utils/dom-helpers";

export async function redditGetUserProfile(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;

    const link = doc.createElement("a");
    link.setAttribute(
        "href",
        `https://www.reddit.com/user/${sdk.args.username}/`,
    );
    await link.click();

    await sdk.time.sleep(2000);
    await waitForElement(doc, '[data-testid="profile-main"]', sdk, 8000);

    const displayName = doc.querySelector(
        'h1[data-testid="profile-display-name"]',
    );
    const karmaEl = doc.querySelector(
        'span[data-testid="karma-number"]',
    );

    const username = displayName
        ? displayName.textContent
        : sdk.args.username;
    const karma = karmaEl ? karmaEl.textContent : "unknown";

    const postElements = doc.querySelectorAll("shreddit-post");
    const postCount = Math.min(postElements.length, 5);
    const recentPosts = [];

    for (let i = 0; i < postCount; i++) {
        const el = postElements.item(i);
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

    const commentElements = doc.querySelectorAll(
        "shreddit-profile-comment",
    );
    const commentCount = Math.min(commentElements.length, 5);
    const recentComments = [];

    for (let i = 0; i < commentCount; i++) {
        const el = commentElements.item(i);
        if (!el) continue;
        const commentId = el.getAttribute("comment-id");
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
