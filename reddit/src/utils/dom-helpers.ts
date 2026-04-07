import type { BrowserSDK, BrowserTab } from "gace-sdk";

/**
 * Polls for an element matching `selector` until it appears or timeout is reached.
 * Returns the element or throws an error.
 */
export async function waitForElement(
    doc: any,
    selector: string,
    sdk: BrowserSDK,
    timeout = 5000,
): Promise<any> {
    const interval = 500;
    const maxAttempts = Math.ceil(timeout / interval);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const el = doc.querySelector(selector);
        if (el) return el;
        await sdk.time.sleep(interval);
    }

    throw new Error(
        `Element "${selector}" not found after ${timeout}ms. The page may not have loaded or Reddit's UI may have changed.`,
    );
}

/**
 * Determines the Reddit page type from the current URL.
 */
export function parsePageType(
    url: string,
): "feed" | "post" | "profile" | "submit" | "search" | "unknown" {
    // QuickJS sandbox doesn't have global URL, so parse manually
    const withoutProtocol = url.replace(/^https?:\/\//, "");
    const pathStart = withoutProtocol.indexOf("/");
    const path = pathStart === -1 ? "/" : withoutProtocol.slice(pathStart).split("?")[0];

    if (path.includes("/submit")) return "submit";
    if (path.includes("/search")) return "search";
    if (path.match(/\/r\/[^/]+\/comments\//)) return "post";
    if (path.match(/\/user\/[^/]+/)) return "profile";
    if (
        path.match(/\/r\/[^/]+\/?$/) ||
        path.match(/\/r\/[^/]+\/(hot|new|top|rising)\/?$/) ||
        path === "/" ||
        path === ""
    )
        return "feed";

    return "unknown";
}

/**
 * Extracts structured post data from all shreddit-post elements on the page.
 */
export async function extractPosts(doc: any, limit = 15): Promise<any[]> {
    const postElements = doc.querySelectorAll("shreddit-post");
    const count = Math.min(postElements.length, limit);
    const posts = [];

    for (let i = 0; i < count; i++) {
        const el = postElements.item(i);
        if (!el) continue;

        const [title, author, score, commentCount, permalink, flair, created, subreddit] =
            await Promise.all([
                el.getAttribute("post-title"),
                el.getAttribute("author"),
                el.getAttribute("score"),
                el.getAttribute("comment-count"),
                el.getAttribute("permalink"),
                el.getAttribute("flair"),
                el.getAttribute("created-timestamp"),
                el.getAttribute("subreddit-prefixed-name"),
            ]);

        posts.push({
            title,
            author,
            score: score ? parseInt(score, 10) : 0,
            commentCount: commentCount ? parseInt(commentCount, 10) : 0,
            permalink,
            flair: flair || null,
            timePosted: created,
            subreddit,
        });
    }

    return posts;
}

/**
 * Extracts search result posts from Reddit's search page.
 * Search results don't use shreddit-post — they use search-telemetry-tracker
 * with JSON metadata in data-faceplate-tracking-context.
 */
export async function extractSearchResults(doc: any, limit = 15): Promise<any[]> {
    const cards = doc.querySelectorAll(
        'a[data-testid="post-title-text"]',
    );
    const count = Math.min(cards.length, limit);
    const results = [];

    for (let i = 0; i < count; i++) {
        const titleLink = cards.item(i);
        if (!titleLink) continue;

        const title = (titleLink.textContent || "").trim();
        const permalink = titleLink.getAttribute("href");

        // Walk up to the card container (the div with the flex class)
        const sduiUnit = titleLink.closest('[data-testid="sdui-post-unit"]');

        let subreddit: string | null = null;
        let timePosted: string | null = null;
        let score = 0;
        let commentCount = 0;

        if (sduiUnit) {
            // Subreddit link
            const subLink = sduiUnit.querySelector('a[href^="/r/"]');
            if (subLink) {
                subreddit = (subLink.textContent || "").trim();
            }

            // Timestamp
            const timeEl = sduiUnit.querySelector("faceplate-timeago");
            if (timeEl) {
                timePosted = timeEl.getAttribute("ts");
            }

            // Votes and comments from the counter row
            const counterRow = sduiUnit.querySelector('[data-testid="search-counter-row"]');
            if (counterRow) {
                const numbers = counterRow.querySelectorAll("faceplate-number");
                const numCount = numbers.length;
                if (numCount >= 1) {
                    const votesEl = numbers.item(0);
                    const votesStr = votesEl.getAttribute("number");
                    score = votesStr ? parseInt(votesStr, 10) : 0;
                }
                if (numCount >= 2) {
                    const commentsEl = numbers.item(1);
                    const commentsStr = commentsEl.getAttribute("number");
                    commentCount = commentsStr ? parseInt(commentsStr, 10) : 0;
                }
            }
        }

        results.push({
            title,
            permalink,
            subreddit,
            score,
            commentCount,
            timePosted,
        });
    }

    return results;
}

/**
 * Extracts text content from a comment body div.
 */
export async function extractCommentBody(doc: any, thingId: string): Promise<string> {
    const bodyEl = doc.querySelector(
        `div[id="${thingId}-comment-rtjson-content"]`,
    );
    if (!bodyEl) return "";
    const text = bodyEl.textContent;
    return (text || "").trim();
}

/**
 * Extracts structured comment data from shreddit-comment elements on the page.
 */
export async function extractComments(doc: any, limit = 20): Promise<any[]> {
    const commentElements = doc.querySelectorAll("shreddit-comment");
    const count = Math.min(commentElements.length, limit);
    const comments = [];

    for (let i = 0; i < count; i++) {
        const el = commentElements.item(i);
        if (!el) continue;

        const [thingId, author, score, depth, parentId, created] =
            await Promise.all([
                el.getAttribute("thingid"),
                el.getAttribute("author"),
                el.getAttribute("score"),
                el.getAttribute("depth"),
                el.getAttribute("parentid"),
                el.getAttribute("created"),
            ]);

        const body = await extractCommentBody(doc, thingId);

        comments.push({
            commentId: thingId,
            author,
            body,
            score: score ? parseInt(score, 10) : 0,
            depth: depth ? parseInt(depth, 10) : 0,
            parentId: parentId || null,
            timePosted: created,
        });
    }

    return comments;
}

/**
 * Extracts the post body text from the current post page.
 */
export async function extractPostBody(doc: any, postId: string): Promise<string> {
    const bodyEl = doc.querySelector(
        `div[id="${postId}-post-rtjson-content"]`,
    );
    if (!bodyEl) return "";
    const text = bodyEl.textContent;
    return (text || "").trim();
}

/**
 * Reads subreddit info from the shreddit-subreddit-header element.
 */
export async function extractSubredditInfo(doc: any): Promise<any> {
    const header = doc.querySelector("shreddit-subreddit-header");
    if (!header) return null;

    const [name, prefixedName, description, activeUsers, contributions] =
        await Promise.all([
            header.getAttribute("name"),
            header.getAttribute("prefixed-name"),
            header.getAttribute("description"),
            header.getAttribute("weekly-active-users"),
            header.getAttribute("weekly-contributions"),
        ]);

    return {
        subreddit: prefixedName || name,
        name,
        description: description || "",
        weeklyActiveUsers: activeUsers ? parseInt(activeUsers, 10) : 0,
        weeklyContributions: contributions ? parseInt(contributions, 10) : 0,
    };
}

/**
 * Sleep for a random duration between min and max ms. Anti-bot measure.
 */
export async function randomDelay(sdk: BrowserSDK, min = 500, max = 2000): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    await sdk.time.sleep(ms);
}
