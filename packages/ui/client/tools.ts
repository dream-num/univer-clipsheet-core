import type { IInitialSheet } from '@univer-clipsheet-core/table';
import { extractTableFromBody, findElementBySelector, generateUniqueSelectorLastOf, getDrillDownSelector, tableApproximationExtraction } from '@univer-clipsheet-core/table';

export function lookForParent(element: HTMLElement, options: {
    forEach?: (element: HTMLElement) => void;
    until: (element: HTMLElement) => boolean;
}) {
    const { forEach, until } = options;
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        forEach?.(parent);

        const untilResult = until(parent);
        if (untilResult) {
            return parent;
        }
    }
    return null;
}

export function findUpperParent(element: HTMLElement) {
    return lookForParent(element, {
        until: (parent) => {
            const children = Array.from(parent.children);
            if (children.length <= 1 || parent.offsetHeight === 0 || parent.offsetWidth === 0) {
                return false;
            }

            return !isSameSize(element, parent);
        },
    });
}

export function isSameSize(a: HTMLElement, b: HTMLElement | null) {
    if (!b) {
        return false;
    }
    return a.offsetHeight === b.offsetHeight && a.offsetWidth === b.offsetWidth;
}

export function findUniqueSelector(el: HTMLElement) {
    const selectors = [
        getDrillDownSelector(el),
        getDrillDownSelector(el, true),
        generateUniqueSelectorLastOf(el),
    ];

    return selectors.find((s) => findElementBySelector(s) === el);
}

function isEmptyIframe(iframe: HTMLIFrameElement) {
    return !iframe.contentDocument?.body;
}

export function getBodyElements(doc: Document) {
    const iframeBodyList = Array.from(doc.querySelectorAll('iframe'))
        .filter((iframe) => isEmptyIframe(iframe) === false)
        .map((iframe) => iframe.contentDocument!.body)
        .filter((body) => body.checkVisibility());

    const bodyList = [doc.body as HTMLBodyElement].concat(iframeBodyList as HTMLBodyElement[]);

    return bodyList;
}

// Analyze sheets data from document of this page
export function extractSheetsFromPage(doc = window.document) {
    const bodyList = getBodyElements(doc);
    // const emptyIframeList = getEmptyExtractableIframeElements(doc);

    // const iframeTables = await Promise.all(emptyIframeList.map((iframe) => getIframeTables(iframe.src)));
    const extractedTable = bodyList.map<IInitialSheet[]>((bodyElement) => extractTableFromBody(bodyElement)).flat();

    const approximatedTable = tableApproximationExtraction(bodyList);

    const sheets = extractedTable.concat(approximatedTable.resultSheets);

    return {
        text: approximatedTable.text,
        sheets,
    };
}
