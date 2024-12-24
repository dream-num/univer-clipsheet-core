import { ExtractionInterval } from './extraction-interval';

function dispatchClick(element: HTMLElement) {
    const mousedownEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    const mouseupEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    // trigger click in sequence
    element.dispatchEvent(mousedownEvent);
    element.dispatchEvent(mouseupEvent);
    element.dispatchEvent(clickEvent);
}

export class ClickExtractor extends ExtractionInterval {
    static dispatchClick(element: HTMLElement) {
        dispatchClick(element);
    }

    startAction() {
        this.startInterval(() => {});
    }

    stopAction() {
        this.stopInterval();
    }

    dispose() {
        this.stopAction();
    }
}
