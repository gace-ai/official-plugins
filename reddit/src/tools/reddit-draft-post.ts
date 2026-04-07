import type { BrowserSDK } from "gace-sdk";
import { waitForElement, randomDelay } from "../utils/dom-helpers";

export async function redditDraftPost(sdk: BrowserSDK) {
    const tab = sdk.tabs.getById(sdk.args.tabId);
    const doc: any = tab.document;

    // Navigate to submit page
    const link = doc.createElement("a");
    await link.setAttribute(
        "href",
        `https://www.reddit.com/r/${sdk.args.subreddit}/submit`,
    );
    await link.click();

    await sdk.time.sleep(2000);
    const titleInput = await waitForElement(
        doc,
        'faceplate-textarea-input[name="title"]',
        sdk,
        8000,
    );

    // Fill title
    await titleInput.setAttribute("value", sdk.args.title);
    const innerTitle = titleInput.querySelector("textarea, input");
    if (innerTitle) {
        await innerTitle.focus();
        (innerTitle as any).value = sdk.args.title;
        // Use execCommand to trigger framework reactivity (dispatchEvent can't
        // pass DOM objects through the sandbox proxy bridge)
        await doc.execCommand("selectAll", false, "");
        await doc.execCommand("insertText", false, sdk.args.title);
    }

    await randomDelay(sdk);

    // Fill body - find the contenteditable editor
    const composer = await waitForElement(
        doc,
        "#post-composer_bodytext",
        sdk,
        5000,
    );
    const editor = composer.querySelector(
        'div[contenteditable="true"]',
    );

    if (editor) {
        await editor.focus();
        // Use execCommand to insert text — this triggers Lexical's input
        // handling properly, unlike setting textContent + dispatchEvent
        await doc.execCommand("selectAll", false, "");
        await doc.execCommand("insertText", false, sdk.args.body);
    } else {
        return {
            tabId: tab.id,
            status: "partial",
            pageType: "submit" as const,
            titleFilled: true,
            bodyFilled: false,
            message:
                "Title was filled but could not find the body editor. You may need to type the body manually.",
        };
    }

    return {
        tabId: tab.id,
        status: "draft_ready",
        pageType: "submit" as const,
        titleFilled: true,
        bodyFilled: true,
        message:
            "Post draft is ready. Review the title and body, then click Post when ready.",
    };
}
