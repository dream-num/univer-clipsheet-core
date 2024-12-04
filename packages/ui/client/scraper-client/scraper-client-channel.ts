import type { IClickAutoExtractionConfig, IScraper, IScraperColumn, IScrollAutoExtractionConfig, ScraperTaskChannelResponse } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, isScraperTaskChannelName, scraperTaskChannel } from '@univer-clipsheet-core/scraper';
import type { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { createLazyLoadElement, findElementBySelector } from '@univer-clipsheet-core/table';
import type { IClientChannel } from './client-channel';
import { ClickExtractor, ScrollExtractor } from './extractors';

export class ScraperClientChannel implements IClientChannel {
    constructor() {

    }

    test(name: string): boolean {
        return isScraperTaskChannelName(name);
    }

    private async waitElement(_selectors: string | string[], timeout: number = 10000) {
        const selectors = Array.isArray(_selectors) ? _selectors : [_selectors];

        let timer: number;
        const startTime = Date.now();
        return new Promise<HTMLElement[] | void>((resolve) => {
            findElements();

            function resolveInterval(value: HTMLElement[] | void) {
                clearInterval(timer);
                resolve(value);
            }

            function findElements() {
                if (Date.now() - startTime > timeout) {
                    resolveInterval();
                    return;
                }

                const elements = selectors.map((selector) => findElementBySelector(selector));
                const success = elements.every(Boolean);

                if (success) {
                    resolveInterval(elements as HTMLElement[]);
                }
            }

            timer = setInterval(findElements, 500);
        });
    }

    private async _clickExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        const scraperConfig = scraper.config as IClickAutoExtractionConfig;
        const elements = await this.waitElement([scraper.targetSelector, scraperConfig.buttonSelector]);
        if (!elements) {
            return handleFail();
        }
        const [targetElement, buttonElement] = elements;

        const lazyLoadElement = createLazyLoadElement(targetElement);
        if (!lazyLoadElement) {
            return handleFail();
        }

        const clickExtractor = new ClickExtractor({
            minInterval: scraperConfig.minInterval,
            maxInterval: scraperConfig.maxInterval,
            lazyLoadElement,
            button: buttonElement,
        });

        let latestTargetElement = targetElement;
        clickExtractor.registerCallback((btn) => {
            const buttonElement2 = findElementBySelector(scraperConfig.buttonSelector);
            const targetElement2 = findElementBySelector(scraper.targetSelector);

            if (!buttonElement2) {
                clickExtractor.stopAction();
            } else if (btn !== buttonElement2) {
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

        const initialRows = lazyLoadElement.getAllSheets()[0]?.rows;
        if (initialRows?.length > 0) {
            handleResponse({
                rows: initialRows,
            });
        }
        clickExtractor.startAction(false);
    }

    private async _pageUrlExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        const elements = await this.waitElement(scraper.targetSelector);
        const targetElement = elements?.[0];

        if (!targetElement) {
            return handleFail();
        }

        const lazyLoadElement = createLazyLoadElement(targetElement);
        if (!lazyLoadElement) {
            return handleFail();
        }

        const [sheet] = lazyLoadElement.getAllSheets();
        if (!sheet) {
            return handleFail();
        }
        handleResponse({
            rows: sheet.rows,
        });
    }

    private async _scrollExtract(scraper: IScraper, handleResponse: (res: ScraperTaskChannelResponse) => void, handleFail: () => void) {
        const elements = await this.waitElement(scraper.targetSelector);
        const targetElement = elements?.[0];

        const scraperConfig = scraper.config as IScrollAutoExtractionConfig;

        if (!targetElement) {
            return handleFail();
        }
        const lazyLoadElement = createLazyLoadElement(targetElement);
        if (!lazyLoadElement) {
            return handleFail();
        }

        const scrollExtractor = new ScrollExtractor({
            minInterval: scraperConfig.minInterval,
            maxInterval: scraperConfig.maxInterval,
            lazyLoadElement,
        });

        scrollExtractor.done$.subscribe(() => {
            const [sheet] = scrollExtractor.lazyLoadElement.getAllSheets();
            handleResponse({
                rows: sheet.rows,
                done: true,
            });
        });

        scrollExtractor.startAction(targetElement)
            .then((success) => {
                if (!success) {
                    const [sheet] = scrollExtractor.lazyLoadElement.getAllSheets();
                    handleResponse({
                        rows: sheet.rows,
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

        function createResponseHandler(scraper: IScraper) {
            return (res: ScraperTaskChannelResponse) => {
                const columnIndexMap = scraper.columns.reduce((map, c) => {
                    map.set(c.index, c);
                    return map;
                }, new Map<number, IScraperColumn>());

                // Only selected columns will be returned
                res.rows.forEach((row) => {
                    row.cells = row.cells.filter((_, index) => columnIndexMap.has(index));

                    row.cells.forEach((cell, cellIndex) => {
                        const column = columnIndexMap.get(cellIndex);
                        if (column) {
                            cell.type = column.type as unknown as Sheet_Cell_Type_Enum;
                        }
                    });
                });
                scraperTaskChannel.sendResponse(port, res);
            };
        }

        scraperTaskChannel.onRequest(port, (msg) => {
            const { scraper } = msg;
            const handleResponse = createResponseHandler(scraper);
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
