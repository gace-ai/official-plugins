import { BrowserTool } from "gace-sdk";
import type { BrowserSDK } from "gace-sdk";
import { z } from "zod";
import { redditOpen as _redditOpen } from "./tools/reddit-open";
import { redditGoToSubreddit as _redditGoToSubreddit } from "./tools/reddit-go-to-subreddit";
import { redditSearch as _redditSearch } from "./tools/reddit-search";
import { redditGetPageContext as _redditGetPageContext } from "./tools/reddit-get-page-context";
import { redditGetPostContent as _redditGetPostContent } from "./tools/reddit-get-post-content";
import { redditGetSubredditInfo as _redditGetSubredditInfo } from "./tools/reddit-get-subreddit-info";
import { redditGetFeedPosts as _redditGetFeedPosts } from "./tools/reddit-get-feed-posts";
import { redditGetUserProfile as _redditGetUserProfile } from "./tools/reddit-get-user-profile";
import { redditDraftPost as _redditDraftPost } from "./tools/reddit-draft-post";
import { redditDraftComment as _redditDraftComment } from "./tools/reddit-draft-comment";

// ─── Navigation ───

@BrowserTool({
    name: "reddit_open",
    description:
        "Open Reddit in a new tab, optionally navigating to a specific Reddit URL. Returns info about the loaded page.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        url: z
            .string()
            .optional()
            .describe(
                "A Reddit URL to navigate to. If omitted, opens reddit.com",
            ),
    }),
})
export async function redditOpen(sdk: BrowserSDK) {
    return _redditOpen(sdk);
}

@BrowserTool({
    name: "reddit_go_to_subreddit",
    description:
        "Navigate the current tab to a subreddit with an optional sort order. Returns the first posts visible on the page.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to navigate"),
        subreddit: z
            .string()
            .describe("Subreddit name without r/ prefix, e.g. 'SideProject'"),
        sort: z
            .enum(["hot", "new", "top", "rising"])
            .optional()
            .describe("Sort order. Defaults to hot"),
    }),
})
export async function redditGoToSubreddit(sdk: BrowserSDK) {
    return _redditGoToSubreddit(sdk);
}

@BrowserTool({
    name: "reddit_search",
    description:
        "Search Reddit for posts or subreddits. Navigates to the search results page and returns the results found.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to search in"),
        query: z.string().describe("The search query"),
        scope: z
            .enum(["all", "subreddit"])
            .optional()
            .describe(
                "Search scope: 'all' searches all of Reddit, 'subreddit' searches the current subreddit only",
            ),
        sort: z
            .enum(["relevance", "hot", "new", "top"])
            .optional()
            .describe("Sort results by"),
        timeFilter: z
            .enum(["hour", "day", "week", "month", "year", "all"])
            .optional()
            .describe("Time filter for results"),
    }),
})
export async function redditSearch(sdk: BrowserSDK) {
    return _redditSearch(sdk);
}

// ─── Reading ───

@BrowserTool({
    name: "reddit_get_page_context",
    description:
        "Read the current page and return structured info about what's visible. Use this as a fallback when you need to re-orient — to understand what page you're on and what's shown.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to read"),
    }),
})
export async function redditGetPageContext(sdk: BrowserSDK) {
    return _redditGetPageContext(sdk);
}

@BrowserTool({
    name: "reddit_get_post_content",
    description:
        "Read the full content of the currently open Reddit post, including body text and comments with their IDs. Use the commentId values with reddit_draft_comment to reply to specific comments.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID (must be on a post page)"),
        commentLimit: z
            .number()
            .optional()
            .describe(
                "Max comments to read (default 20, max 50). Reads what's currently rendered — does not expand collapsed threads.",
            ),
    }),
})
export async function redditGetPostContent(sdk: BrowserSDK) {
    return _redditGetPostContent(sdk);
}

@BrowserTool({
    name: "reddit_get_subreddit_info",
    description:
        "Read subreddit sidebar information: description, weekly active users, and weekly contributions. Must be on a subreddit page.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID (must be on a subreddit page)"),
    }),
})
export async function redditGetSubredditInfo(sdk: BrowserSDK) {
    return _redditGetSubredditInfo(sdk);
}

@BrowserTool({
    name: "reddit_get_feed_posts",
    description:
        "Read posts from the current feed view (subreddit, home, or search results). Can scroll down to load more posts.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to read posts from"),
        scrollForMore: z
            .boolean()
            .optional()
            .describe("Scroll down to load more posts before reading"),
        maxScrolls: z
            .number()
            .optional()
            .describe(
                "Number of times to scroll (default 1, max 3). Only used if scrollForMore is true.",
            ),
    }),
})
export async function redditGetFeedPosts(sdk: BrowserSDK) {
    return _redditGetFeedPosts(sdk);
}

// ─── Navigation & Reading ───

@BrowserTool({
    name: "reddit_get_user_profile",
    description:
        "Navigate to a Reddit user's profile and read their public info: karma, recent posts, and recent comments. This changes the current page.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to navigate"),
        username: z
            .string()
            .describe("Reddit username (without u/ prefix)"),
    }),
})
export async function redditGetUserProfile(sdk: BrowserSDK) {
    return _redditGetUserProfile(sdk);
}

// ─── Engagement ───

@BrowserTool({
    name: "reddit_draft_post",
    description:
        "Navigate to a subreddit's post creation page and fill in the title and body text. Does NOT submit — the user must click Post themselves. The body is typed as plain text into Reddit's rich text editor.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z.number().describe("The tab ID to use"),
        subreddit: z
            .string()
            .describe("Subreddit name without r/ prefix"),
        title: z.string().describe("Post title (max 300 characters)"),
        body: z.string().describe("Post body text"),
    }),
})
export async function redditDraftPost(sdk: BrowserSDK) {
    return _redditDraftPost(sdk);
}

@BrowserTool({
    name: "reddit_draft_comment",
    description:
        "Open the reply form for a specific comment (or the post itself) and fill in the comment text. Does NOT submit — the user must click the Comment button themselves. Use commentId from reddit_get_post_content to reply to a specific comment.",
    permissions: { tabs: true, document: true, url: "reddit.com/*" },
    args: z.object({
        tabId: z
            .number()
            .describe("The tab ID (must be on a post page)"),
        commentId: z
            .string()
            .optional()
            .describe(
                "The thingid of the comment to reply to (e.g. 't1_abc123'). If omitted, replies to the post itself using the top-level comment box.",
            ),
        body: z.string().describe("The comment text to draft"),
    }),
})
export async function redditDraftComment(sdk: BrowserSDK) {
    return _redditDraftComment(sdk);
}
