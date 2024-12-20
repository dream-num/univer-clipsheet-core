import type { IClickAutoExtractionConfig, IScraper, IScrollAutoExtractionConfig, ScraperTaskChannelResponse } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, calculateRandomInterval, isScraperTaskChannelName, scraperTaskChannel } from '@univer-clipsheet-core/scraper';
import type { ISheet_Row, UnionLazyLoadElements } from '@univer-clipsheet-core/table';
import { createLazyLoadElement, findElementBySelector } from '@univer-clipsheet-core/table';
import { ObservableValue, sendActiveTabMessage, waitFor } from '@univer-clipsheet-core/shared';
import type { IClientChannel } from './client-channel';
import { ClickExtractor, ScrollExtractor } from './extractors';
import { getBodyScrollTop } from './extractors/scroll-extractor';

function intervalUntil(duration: number, interval: number, callbacks: {
    onInterval: () => void;
    onTimeout: () => void;
}) {
    const time = Date.now();
    let timer: number;

    function cancel() {
        clearInterval(timer);
    }

    const { onInterval, onTimeout } = callbacks;

    function intervalCallback() {
        onInterval();
        if (Date.now() - time > duration) {
            clearInterval(timer);
            onTimeout();
        }
    }

    timer = setInterval(intervalCallback, interval);

    return cancel;
}

function promisifyIntervalUntil<T = unknown>(duration: number, interval: number, callback: (resolve: (value: T) => void) => void) {
    return new Promise<T | void>((_resolve) => {
        let cancel: () => void;
        const resolve = (value: T | void) => {
            cancel?.();
            _resolve(value);
        };

        cancel = intervalUntil(duration, interval, {
            onInterval: () => {
                const resolve = (value: T) => {
                    cancel();
                    _resolve(value);
                };

                callback(resolve);
            },
            onTimeout: () => resolve(),
        });
    });
}

export class ScraperClientChannel implements IClientChannel {
    constructor() {

    }

    test(name: string): boolean {
        return isScraperTaskChannelName(name);
    }

    private async waitElement(_selectors: string | string[], timeout: number = 10000) {
        const selectors = Array.isArray(_selectors) ? _selectors : [_selectors];

        return promisifyIntervalUntil<HTMLElement[]>(timeout, 500, (resolve) => {
            const elements = selectors.map((selector) => findElementBySelector(selector));
            const success = elements.every(Boolean);
            if (success) {
                resolve(elements as HTMLElement[]);
            }
        });
    }

    private async waitLazyLoadElement(el: HTMLElement) {
        return promisifyIntervalUntil<UnionLazyLoadElements>(5000, 500, (resolve) => {
            const lazyLoadElement = createLazyLoadElement(el);
            if (lazyLoadElement) {
                resolve(lazyLoadElement);
            }
        });
    }

    private async _clickExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        window.scrollTo(0, document.body.scrollHeight);

        const scraperConfig = scraper.config as IClickAutoExtractionConfig;

        const waitTargetElement = this.waitElement(scraper.targetSelector);
        const waitButtonElement = this.waitElement(scraperConfig.buttonSelector);

        const [targetElement, buttonElement] = (await Promise.all([waitTargetElement, waitButtonElement])).flat();

        const lazyLoadElement = targetElement
            ? createLazyLoadElement(targetElement)
            : undefined;

        const pushInitialRows = () => {
            if (!lazyLoadElement) {
                return;
            }
            const sheet = lazyLoadElement.getAllSheets()[0];
            if (!sheet) {
                return;
            }

            handleResponse({
                rows: sheet.rows,
            });
        };

        if (!buttonElement || !lazyLoadElement) {
            setTimeout(() => {
                pushInitialRows();
                handleFail();
            }, calculateRandomInterval(scraperConfig.maxInterval, scraperConfig.minInterval));

            return;
        }

        const clickExtractor = new ClickExtractor({
            minInterval: scraperConfig.minInterval,
            maxInterval: scraperConfig.maxInterval,
            lazyLoadElement,
            button: buttonElement,
        });

        let latestTargetElement = targetElement!;
        clickExtractor.registerCallback(() => {
            const buttonElement2 = findElementBySelector(scraperConfig.buttonSelector);
            const targetElement2 = findElementBySelector(scraper.targetSelector);

            if (!buttonElement2) {
                if (!clickExtractor.button$.value) {
                    clickExtractor.stopAction();
                }
            } else if (buttonElement2 !== clickExtractor.button$.value) {
                clickExtractor.button$.next(buttonElement2);
            }

            if (targetElement2 && latestTargetElement !== targetElement2) {
                const lazyLoadItem = lazyLoadElement.findItemByElement(latestTargetElement);

                if (lazyLoadItem) {
                    latestTargetElement = targetElement2;
                    // @ts-ignore
                    lazyLoadElement.updateItemElement(lazyLoadItem, targetElement2);
                }
            }
        });

        clickExtractor.registerCallback(pushInitialRows);

        clickExtractor.data$.subscribe((data) => {
            handleResponse({
                rows: data,
            });
        });

        clickExtractor.done$.subscribe(() => {
            handleResponse({
                rows: [],
                done: true,
            });
        });

        clickExtractor.startAction(false);
    }

    private async _pageUrlExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        const elements = await this.waitElement(scraper.targetSelector);
        const targetElement = elements?.[0];

        if (!targetElement) {
            return handleFail();
        }
        window.scrollTo({
            top: getBodyScrollTop(targetElement),
            behavior: 'smooth',
        });

        const lazyLoadElement = createLazyLoadElement(targetElement);
        if (!lazyLoadElement) {
            return handleFail();
        }

        waitFor(1500)
            .then(() => {
                const [sheet] = lazyLoadElement.getAllSheets();
                if (sheet) {
                    handleResponse({
                        rows: sheet.rows,
                    });
                }
            });
    }

    private async _scrollExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        const handleScrollResponse = (res: ScraperTaskChannelResponse) => {
            res.merge = false;
            handleResponse(res);
        };
        sendActiveTabMessage();
        const elements = await this.waitElement(scraper.targetSelector);
        const targetElement = elements?.[0];

        const scraperConfig = scraper.config as IScrollAutoExtractionConfig;

        if (!targetElement) {
            return handleFail();
        }

        const lazyLoadElement = await this.waitLazyLoadElement(targetElement);

        if (!lazyLoadElement) {
            return handleFail();
        }

        const rows$ = new ObservableValue<ISheet_Row[]>([]);

        rows$.subscribe((rows) => {
            handleScrollResponse({
                rows,
            });
        });

        lazyLoadElement.onRowsUpdated((newRows) => {
            rows$.next(rows$.value.concat(newRows));
        });

        const scrollExtractor = new ScrollExtractor({
            minInterval: scraperConfig.minInterval,
            maxInterval: scraperConfig.maxInterval,
            lazyLoadElement,
        });

        const sheet = lazyLoadElement.getAllSheets()[0];
        if (sheet) {
            rows$.next(rows$.value.concat(sheet.rows));
        }

        scrollExtractor.done$.subscribe(() => {
            handleScrollResponse({
                rows: rows$.value,
                done: true,
            });
        });

        scrollExtractor.startAction(targetElement)
            .then((success) => {
                if (!success) {
                    handleScrollResponse({
                        rows: rows$.value,
                        done: true,
                    });
                }
            });
    }

    connect(name: string) {
        const port = scraperTaskChannel.connect(name);

        const handleFail = () => {
            scraperTaskChannel.sendResponse(port, {
                rows: [],
                done: true,
            });
        };

        const handleResponse = (res: ScraperTaskChannelResponse) => {
            res.url = window.location.href;
            scraperTaskChannel.sendResponse(port, res);
        };

        scraperTaskChannel.onRequest(port, (msg) => {
            const { scraper } = msg;

            switch (scraper.mode) {
                case AutoExtractionMode.Click: {
                    this._clickExtract(scraper, handleResponse, handleFail);
                    break;
                }
                case AutoExtractionMode.PageUrl: {
                    this._pageUrlExtract(scraper, handleResponse, handleFail);
                    break;
                }
                case AutoExtractionMode.Scroll: {
                    this._scrollExtract(scraper, handleResponse, handleFail);
                    break;
                }
                case AutoExtractionMode.None: {
                    const targetElement = findElementBySelector(scraper.targetSelector);
                    if (!targetElement) {
                        return handleFail();
                    }
                    const lazyLoadElement = createLazyLoadElement(targetElement);
                    if (!lazyLoadElement) {
                        return handleFail();
                    }
                    const [sheet] = lazyLoadElement.getAllSheets();
                    if (sheet) {
                        handleResponse({
                            rows: sheet.rows,
                            done: true,
                        });
                    }

                    break;
                }
            }
        });
    }

    disconnect() {

    }
}
