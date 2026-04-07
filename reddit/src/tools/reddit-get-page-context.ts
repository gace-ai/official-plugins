import type { BrowserSDK } from "gace-sdk";
import {
    parsePageType,
    extractPosts,
    extractComments,
    extractSubredditInfo,
} from "../utils/dom-helpers";

export async function redditGetPageContext(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;
    const pageType = parsePageType(tab.url);
    const result: any = { tabId: tab.id, pageType, url: tab.url };

    if (pageType === "feed" || pageType === "search") {
        result.posts = await extractPosts(doc, 5);
        const info = await extractSubredditInfo(doc);
        if (info) result.subreddit = info.subreddit;
    } else if (pageType === "post") {
        const post = doc.querySelector("shreddit-post");
        if (post) {
            const [title, author, score, commentCount, subreddit] =
                await Promise.all([
                    post.getAttribute("post-title"),
                    post.getAttribute("author"),
                    post.getAttribute("score"),
                    post.getAttribute("comment-count"),
                    post.getAttribute("subreddit-prefixed-name"),
                ]);
            result.title = title;
            result.author = author;
            result.score = score ? parseInt(score, 10) : 0;
            result.commentCount = commentCount
                ? parseInt(commentCount, 10)
                : 0;
            result.subreddit = subreddit;

            const comments = await extractComments(doc, 3);
            result.topComments = comments.map((c: any) => ({
                author: c.author,
                body:
                    c.body.length > 200
                        ? c.body.substring(0, 200) + "..."
                        : c.body,
                score: c.score,
            }));
        }
    } else if (pageType === "profile") {
        const displayName = doc.querySelector(
            'h1[data-testid="profile-display-name"]',
        );
        const karma = doc.querySelector(
            'span[data-testid="karma-number"]',
        );
        result.username = displayName
            ? displayName.textContent
            : "unknown";
        result.karma = karma ? karma.textContent : "unknown";
    } else if (pageType === "submit") {
        result.subreddit =
            tab.url.match(/\/r\/([^/]+)/)?.[1] || "unknown";
    }

    return result;
}
