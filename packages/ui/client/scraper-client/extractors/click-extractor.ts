import type { ISheet_Row } from '@univer-clipsheet-core/table';
import { getSheetsRowsData } from '@univer-clipsheet-core/table';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import { ThresholdCounter } from '../../scraper-client/extractors/threshold-counter';
import type { UnionLazyLoadElements } from '../../table-scraping/extractors/accurate-extractor';
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
    private lazyLoadElement$ = new ObservableValue<UnionLazyLoadElements | null>(null);
    private _thresholdCounter = new ThresholdCounter(3);
    private _callbacks: Set<(buttonElement: HTMLElement) => void> = new Set();

    button$ = new ObservableValue<HTMLElement | null>(null);

    done$ = new ObservableValue<void>(undefined);

    data$ = new ObservableValue<ISheet_Row[]>([]);

    private _disposer: (() => void) | null = null;

    constructor(options: {
        minInterval: number;
        maxInterval: number;
        lazyLoadElement: UnionLazyLoadElements;
        button: HTMLElement;
    }) {
        super();

        const {
            minInterval,
            maxInterval,
            lazyLoadElement,
            button,
        } = options;

        this.minInterval$.next(minInterval);
        this.maxInterval$.next(maxInterval);
        this.button$.next(button);

        this.setLazyLoadElement(lazyLoadElement);
        this._registerCallbacks();
    }

    registerCallback(cb: (buttonElement: HTMLElement) => void) {
        this._callbacks.add(cb);
        return () => this._callbacks.delete(cb);
    }

    private _registerCallbacks() {
        const triggerClickCallback = (buttonElement: HTMLElement) => {
            dispatchClick(buttonElement);
        };

        const latestRecord = {
            rows: 0,
            href: '',
        };

        const thresholdCounter = this._thresholdCounter;

        thresholdCounter.onThreshold(() => {
            this.stopAction();
        });

        const noChangeCallback = () => {
            const { lazyLoadElement } = this;
            if (!lazyLoadElement) {
                return;
            }

            if (latestRecord.rows === lazyLoadElement.rows && latestRecord.href === location.href) {
                thresholdCounter.count();
            } else {
                thresholdCounter.reset();
                latestRecord.href = location.href;
                latestRecord.rows = lazyLoadElement.rows;
            }
        };

        this._callbacks.add(noChangeCallback);
        this._callbacks.add(triggerClickCallback);
    }

    get lazyLoadElement() {
        return this.lazyLoadElement$.value;
    }

    setLazyLoadElement(lazyLoadElement: UnionLazyLoadElements | null) {
        this.lazyLoadElement$.next(lazyLoadElement);
    }

    startAction(immediate = true) {
        const { lazyLoadElement } = this;
        if (lazyLoadElement) {
            this._disposer = lazyLoadElement.onChange(() => {
                const rowsData = getSheetsRowsData(this.lazyLoadElement)?.[0];

                if (rowsData) {
                    this.data$.next(rowsData);
                }
            });
        }

        this.startInterval(() => {
            const btn = this.button$.value;
            if (btn) {
                this._callbacks.forEach((cb) => cb(btn));
            }
        }, immediate);
    }

    stopAction() {
        this._disposer?.();
        this._disposer = null;

        this.done$.next();
        this.stopInterval();
    }

    dispose() {
        this.stopAction();
        this._callbacks.clear();
        this._thresholdCounter.dispose();
        this.lazyLoadElement$.dispose();
        this.button$.dispose();
        this.done$.dispose();
        this.data$.dispose();
    }
}
