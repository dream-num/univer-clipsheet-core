import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { UnionLazyLoadElements } from '@univer-clipsheet-core/table';
import { ExtractionInterval } from './extraction-interval';

import { ThresholdCounter } from './threshold-counter';

export enum ScrollTargetDetectStatus {
    Detecting = 'Detecting',
    Completed = 'Completed',
}

function getBodyScrollTop(el: HTMLElement) {
    const rect = el.getBoundingClientRect();

    // 200 is a threshold to make sure we scroll to the bottom
    return window.scrollY + rect.top + rect.height - window.innerHeight + 200;
}

export type ScrollExtractorCallback = (oldRect: DOMRect, targetElement: HTMLElement) => void;

export class ScrollExtractor extends ExtractionInterval {
    done$ = new ObservableValue<void>(undefined);
    scrollElement$ = new ObservableValue<HTMLElement | null>(null);
    private _lazyLoadElement$: ObservableValue<UnionLazyLoadElements>;

    private _disposer: (() => void) | null = null;
    private _startElement: HTMLElement | null = null;
    private _callbacks: Set<ScrollExtractorCallback> = new Set();
    private _thresholdCounter = new ThresholdCounter(5);

    constructor(options: {
        minInterval: number;
        maxInterval: number;
        lazyLoadElement: UnionLazyLoadElements;
    }) {
        super();

        const {
            minInterval,
            maxInterval,
            lazyLoadElement,
        } = options;

        this.minInterval$.next(minInterval);
        this.maxInterval$.next(maxInterval);
        this._lazyLoadElement$ = new ObservableValue(lazyLoadElement);

        this._registerCallbacks();
    }

    static scrollToTopOfElement(el: HTMLElement) {
        window.scrollTo({
            top: getBodyScrollTop(el),
            behavior: 'smooth',
        });
    }

    private _registerCallbacks() {
        const scrollCallback: ScrollExtractorCallback = (oldRect, targetElement: HTMLElement) => {
            if (targetElement instanceof HTMLBodyElement) {
                ScrollExtractor.scrollToTopOfElement(this._startElement!);
            } else {
                targetElement.scrollTo(0, targetElement.scrollHeight);
            }
        };

        let latestRows = 0;
        const thresholdCounter = this._thresholdCounter;
        thresholdCounter.onThreshold(() => {
            this.stopAction();
            this.done$.next();
        });
        const noChangeCallback: ScrollExtractorCallback = (oldRect, targetElement: HTMLElement) => {
            const { lazyLoadElement } = this;
            if (!lazyLoadElement) {
                return;
            }
            const newRect = targetElement.getBoundingClientRect();

            if (latestRows === lazyLoadElement.rows && newRect.height === oldRect.height) {
                thresholdCounter.count();
            } else {
                latestRows = lazyLoadElement.rows;
                thresholdCounter.reset();
            }
        };

        this._callbacks.add(scrollCallback);
        this._callbacks.add(noChangeCallback);
    }

    get lazyLoadElement() {
        return this._lazyLoadElement$.value;
    }

    async detectScrollTarget(el: HTMLElement) {
        const elementScrollable = el.scrollHeight > el.offsetHeight;
        const bodyScrollable = document.body.scrollHeight > window.scrollY;

        if (!elementScrollable && !bodyScrollable) {
            return;
        }

        const oldElScrollHeight = el.scrollHeight;
        const oldBodyScrollHeight = document.body.scrollHeight;

        let rowsUpdated = false;
        const dispose = this.lazyLoadElement.onRowsUpdated(() => {
            rowsUpdated = true;
            dispose();
        });

        const scrollTo = () => {
            elementScrollable && el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth',
            });

            bodyScrollable && window.scrollTo({
                top: getBodyScrollTop(el),
                behavior: 'smooth',
            });
        };

        scrollTo();

        const duration = 10 * 1000;

        return new Promise<HTMLElement | void>((resolve) => {
            let timer: number;
            const emit = (el: HTMLElement | void) => {
                resolve(el);
                clearInterval(timer);
            };

            timer = setInterval(() => {
                const newElScrollHeight = el.scrollHeight;
                const newBodyScrollHeight = document.body.scrollHeight;

                if (elementScrollable && rowsUpdated && newElScrollHeight > oldElScrollHeight) {
                    emit(el);
                }
                if (bodyScrollable && rowsUpdated && newBodyScrollHeight > oldBodyScrollHeight) {
                    emit(document.body);
                }
            }, 1000);
            // Force complete after duration
            setTimeout(() => emit(), duration);
        });
    }

    async startAction(el: HTMLElement) {
        if (this.running$.value) {
            return false;
        }

        this._startElement = el;
        const target = await this.detectScrollTarget(el);

        if (!target) {
            return false;
        }

        let prevRect = target.getBoundingClientRect();
        this.startInterval(() => {
            this._callbacks.forEach((cb) => cb(prevRect, target));
            prevRect = target.getBoundingClientRect();
        });

        return true;
    }

    stopAction() {
        if (!this.running$.value) {
            return;
        }
        this._disposer?.();
        this._disposer = null;
        this.stopInterval();
    }

    dispose() {
        super.dispose();
        this._callbacks.clear();
        this._thresholdCounter.dispose();

        this.done$.dispose();
        this.scrollElement$.dispose();
        this._lazyLoadElement$.dispose();
    }
}

