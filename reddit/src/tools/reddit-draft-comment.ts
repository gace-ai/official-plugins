import type { BrowserSDK } from "gace-sdk";
import { waitForElement } from "../utils/dom-helpers";

export async function redditDraftComment(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;
    let replyingTo: string;

    if (sdk.args.commentId) {
        const comment = doc.querySelector(
            `shreddit-comment[thingid="${sdk.args.commentId}"]`,
        );
        if (!comment) {
            throw new Error(
                `Comment with ID "${sdk.args.commentId}" not found on the page. It may have been collapsed or the page may have changed.`,
            );
        }

        await comment.scrollIntoView();
        await sdk.time.sleep(500);

        const replyBtn = comment.querySelector(
            'faceplate-tracker[slot="comment-reply"] button',
        );
        if (!replyBtn) {
            throw new Error(
                "Reply button not found on this comment. You may need to be logged in.",
            );
        }

        await replyBtn.click();
        await sdk.time.sleep(1000);

        await waitForElement(
            doc,
            `comment-composer-host[parent-id="${sdk.args.commentId}"]`,
            sdk,
            5000,
        );

        const author = comment.getAttribute("author");
        replyingTo = `u/${author} (${sdk.args.commentId})`;
    } else {
        const trigger = doc.querySelector(
            'faceplate-textarea-input[data-testid="trigger-button"]',
        );
        if (!trigger) {
            throw new Error(
                "Top-level comment box not found. You may need to be logged in.",
            );
        }

        await trigger.click();
        await sdk.time.sleep(1000);

        await waitForElement(
            doc,
            "comment-composer-host:not([parent-id])",
            sdk,
            5000,
        );

        replyingTo = "the post";
    }

    const composerSelector = sdk.args.commentId
        ? `comment-composer-host[parent-id="${sdk.args.commentId}"]`
        : "comment-composer-host:not([parent-id])";

    const composerHost = doc.querySelector(composerSelector);
    const editor = composerHost.querySelector(
        'div[contenteditable="true"]',
    );

    if (!editor) {
        throw new Error(
            "Could not find the comment editor. The reply form may not have loaded.",
        );
    }

    await editor.focus();
    await doc.execCommand("selectAll", false, "");
    await doc.execCommand("insertText", false, sdk.args.body);

    return {
        tabId: tab.id,
        status: "draft_ready",
        replyingTo,
        message:
            "Comment draft is ready. Review the text above, then click Comment when ready.",
    };
}
