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

export class ScrollExtractor extends ExtractionInterval {
    done$ = new ObservableValue<void>(undefined);
    scrollElement$ = new ObservableValue<HTMLElement | null>(null);
    private _lazyLoadElement$: ObservableValue<UnionLazyLoadElements>;

    private _disposer: (() => void) | null = null;

    private _callbacks: Set<(originElement: HTMLElement, targetElement: HTMLElement) => void> = new Set();
    private _thresholdCounter = new ThresholdCounter(3);

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

    private _registerCallbacks() {
        const scrollCallback = (originElement: HTMLElement, targetElement: HTMLElement) => {
            if (targetElement instanceof HTMLBodyElement) {
                window.scrollTo({
                    top: getBodyScrollTop(originElement),
                    behavior: 'smooth',
                });
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
        const noChangeCallback = () => {
            const { lazyLoadElement } = this;
            if (!lazyLoadElement) {
                return;
            }
            if (latestRows === lazyLoadElement.rows) {
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
        const oldRows = this.lazyLoadElement?.rows ?? 0;

        elementScrollable && el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth',
        });

        bodyScrollable && window.scrollTo({
            top: getBodyScrollTop(el),
            behavior: 'smooth',
        });

        const duration = 10 * 1000;

        return new Promise<HTMLElement | void>((resolve) => {
            let timer: number;
            const complete = (el: HTMLElement | void) => {
                resolve(el);
                clearInterval(timer);
            };

            timer = setInterval(() => {
                const newElScrollHeight = el.scrollHeight;
                const newBodyScrollHeight = document.body.scrollHeight;
                const newRows = this.lazyLoadElement?.rows ?? 0;
                const rowsIncreased = newRows > oldRows;

                if (elementScrollable && rowsIncreased && newElScrollHeight > oldElScrollHeight) {
                    complete(el);
                }
                if (bodyScrollable && rowsIncreased && newBodyScrollHeight > oldBodyScrollHeight) {
                    complete(document.body);
                }
            }, 1000);
            // Force complete after duration
            setTimeout(() => complete(), duration);
        });
    }

    async startAction(el: HTMLElement) {
        if (this.running$.value) {
            return false;
        }

        const target = await this.detectScrollTarget(el);

        if (!target) {
            return false;
        }

        this.startInterval(() => {
            this._callbacks.forEach((cb) => cb(el, target));
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

