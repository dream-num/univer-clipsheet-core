import { ElementInspectController } from '@lib/element-inspect';
import type { Injector } from '@wendellhu/redi';
import { RemountObserver } from '@lib/remount-observer';
import { AccurateExtractionController } from '.';

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

export function isSameSize(a: HTMLElement, b: HTMLElement | null) {
    if (!b) {
        return false;
    }
    return a.offsetHeight === b.offsetHeight && a.offsetWidth === b.offsetWidth;
}

export function disposeAccurateExtraction(injector: Injector) {
    const elementInspectController = injector.get(ElementInspectController);
    const accurateExtractionController = injector.get(AccurateExtractionController);
    const remountObserver = injector.get(RemountObserver);
    remountObserver.clear();
    elementInspectController.deactivate();
    accurateExtractionController.deactivate();
}
