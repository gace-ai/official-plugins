import type { BrowserSDK } from "gace-sdk";
import { extractPostBody, extractComments } from "../utils/dom-helpers";

export async function redditGetPostContent(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;
    const limit = Math.min(sdk.args.commentLimit || 20, 50);

    const post = await doc.querySelector("shreddit-post");
    if (!post) {
        throw new Error(
            "No post found on this page. Navigate to a Reddit post first.",
        );
    }

    const [postId, title, author, score, commentCount, subreddit, created] =
        await Promise.all([
            post.getAttribute("id"),
            post.getAttribute("post-title"),
            post.getAttribute("author"),
            post.getAttribute("score"),
            post.getAttribute("comment-count"),
            post.getAttribute("subreddit-prefixed-name"),
            post.getAttribute("created-timestamp"),
        ]);

    const body = await extractPostBody(doc, postId);
    const comments = await extractComments(doc, limit);

    return {
        tabId: tab.id,
        pageType: "post" as const,
        postId,
        title,
        author,
        subreddit,
        body,
        score: score ? parseInt(score, 10) : 0,
        commentCount: commentCount ? parseInt(commentCount, 10) : 0,
        created,
        comments,
    };
}
