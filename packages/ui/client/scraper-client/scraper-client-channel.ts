import type { IClickAutoExtractionConfig, IScraper, IScraperColumn, IScrollAutoExtractionConfig, ScraperTaskChannelResponse } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, calculateRandomInterval, isScraperTaskChannelName, scraperTaskChannel } from '@univer-clipsheet-core/scraper';
import type { CreateLazyLoadElementOptions, ISheet_Row, UnionLazyLoadElements } from '@univer-clipsheet-core/table';
import { createLazyLoadElement, findElementBySelector } from '@univer-clipsheet-core/table';
import { ObservableValue, sendActiveTabMessage, waitFor } from '@univer-clipsheet-core/shared';
import type { IClientChannel } from './client-channel';
import { ClickExtractor, ScrollExtractor } from './extractors';
import { getBodyScrollTop } from './extractors/scroll-extractor';
import { ThresholdCounter } from './extractors/threshold-counter';

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

export function createLazyLoadElementsOptions(columns: IScraperColumn[]): CreateLazyLoadElementOptions | undefined {
    const classes = columns.map((c) => c.selector).filter(Boolean) as string[];
    const options: CreateLazyLoadElementOptions = {
        columnIndexes: columns.map((c) => c.index),
    };

    if (classes.length > 0) {
        options.classes = classes;
    }

    return options;
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

    private async waitLazyLoadElement(el: HTMLElement, scraper: IScraper) {
        return promisifyIntervalUntil<UnionLazyLoadElements>(5000, 500, (resolve) => {
            const lazyLoadElement = createLazyLoadElement(el, createLazyLoadElementsOptions(scraper.columns));

            if (lazyLoadElement) {
                resolve(lazyLoadElement);
            }
        });
    }

    private async _clickExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        sendActiveTabMessage();

        const scraperConfig = scraper.config as IClickAutoExtractionConfig;

        const clickExtractor = new ClickExtractor({
            minInterval: scraperConfig.minInterval,
            maxInterval: scraperConfig.maxInterval,
        });

        const rowSet = new Set<string>();
        const thresholdCounter = new ThresholdCounter(3);

        thresholdCounter.onThreshold(() => {
            clickExtractor.dispose();
            handleFail();
        });

        clickExtractor.onInterval(() => {
            const targetElement = findElementBySelector(scraper.targetSelector);
            const buttonElement = findElementBySelector(scraperConfig.buttonSelector);

            if (targetElement) {
                const lazyLoadElement = createLazyLoadElement(targetElement, createLazyLoadElementsOptions(scraper.columns));

                const sheet = lazyLoadElement?.getAllSheets()[0];

                if (sheet) {
                    const filteredRows = sheet.rows.filter((row) => {
                        const key = JSON.stringify(row.cells);
                        if (rowSet.has(key)) {
                            return false;
                        }
                        rowSet.add(key);
                        return true;
                    });

                    if (filteredRows.length > 0) {
                        thresholdCounter.reset();
                        handleResponse({
                            rows: sheet.rows,
                        });
                    } else {
                        thresholdCounter.count();
                    }
                }
            }

            if (!buttonElement || !targetElement) {
                thresholdCounter.count();
                return;
            }

            sendActiveTabMessage();
            ClickExtractor.dispatchClick(buttonElement);
        });

        clickExtractor.startAction();
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

        const lazyLoadElement = createLazyLoadElement(targetElement, createLazyLoadElementsOptions(scraper.columns));

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
            // Scroll response always override the previous response
            res.merge = false;
            handleResponse(res);
        };
        // Active current tab
        sendActiveTabMessage();
        const elements = await this.waitElement(scraper.targetSelector);
        const targetElement = elements?.[0];

        const scraperConfig = scraper.config as IScrollAutoExtractionConfig;

        if (!targetElement) {
            return handleFail();
        }

        const lazyLoadElement = await this.waitLazyLoadElement(targetElement, scraper);

        if (!lazyLoadElement) {
            return handleFail();
        }

        const rows$ = new ObservableValue<ISheet_Row[]>([]);

        // Push initial rows
        const initialRows = lazyLoadElement.getAllSheets()[0]?.rows;
        if (initialRows) {
            rows$.next(initialRows);
        }

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

        scrollExtractor.onInterval(sendActiveTabMessage);

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
                    sendActiveTabMessage();
                    setTimeout(() => {
                        const targetElement = findElementBySelector(scraper.targetSelector);
                        if (!targetElement) {
                            return handleFail();
                        }

                        const lazyLoadElement = createLazyLoadElement(targetElement, createLazyLoadElementsOptions(scraper.columns));
                        if (!lazyLoadElement) {
                            return handleFail();
                        }

                        const sheet = lazyLoadElement.getAllSheets()[0];
                        if (sheet) {
                            handleResponse({
                                rows: sheet.rows,
                                done: true,
                            });
                        }
                    }, calculateRandomInterval(3, 1));

                    break;
                }
            }
        });
    }

    disconnect() {

    }
}
