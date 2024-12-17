import type { IPageUrlAutoExtractionConfig, IScraper, IScraperColumn, ScraperErrorCode } from '@lib/scraper';
import { AutoExtractionMode, PAGE_URL_SLOT } from '@lib/scraper';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { calculateRandomInterval } from '@lib/tools';
import type { ScraperTaskChannelResponse } from './scraper-channel';

export interface ScraperTabResponseError {
    code: ScraperErrorCode;
};
export interface ScraperTabResponse extends ScraperTaskChannelResponse {
    error?: ScraperTabResponseError;
};

export type ResponseCallback = (scraper: IScraper, response: ScraperTabResponse) => void;

export type ResponseInterceptor = (scraperTab: ScraperTab, rows: ScraperTabResponse['rows']) => ScraperTabResponse['rows'] | Promise<ScraperTabResponse['rows']>;

function generateScraperPageUrl(scraper: IScraper, pageNo: number) {
    const config = scraper.config as IPageUrlAutoExtractionConfig;
    return config.templateUrl.replace(PAGE_URL_SLOT, pageNo.toString());
}

const columnFilterInterceptor: ResponseInterceptor = async (scraperTab, rows) => {
    const { scraper } = scraperTab;
    // console.log('columnFilterInterceptor', scraper.columns);
    const columnIndexMap = scraper.columns.reduce((map, c) => {
        map.set(c.index, c);
        return map;
    }, new Map<number, IScraperColumn>());

    // Only selected columns will be returned
    rows.forEach((row) => {
        row.cells = row.cells.filter((_, index) => columnIndexMap.has(index));

        row.cells.forEach((cell, cellIndex) => {
            const column = columnIndexMap.get(cellIndex);
            if (column) {
                cell.type = column.type as unknown as Sheet_Cell_Type_Enum;
            }
        });
    });

    return rows;
};

export class ScraperTab {
    private _dispose$ = new ObservableValue<boolean>(false);
    private _onError$ = new ObservableValue<ScraperTabResponseError | undefined>(undefined);
    private _tab: chrome.tabs.Tab | undefined = undefined;
    private _tabPromise!: Promise<chrome.tabs.Tab>;
    private _resolve!: (res: ScraperTabResponse) => void;
    private _currentPage$ = new ObservableValue(0);
    private _promise: Promise<ScraperTabResponse>;
    private _responseCallbacks = new Set<ResponseCallback>();
    private _requestCallbacks = new Set<() => void>();
    private _response: ScraperTabResponse = {
        done: false,
        rows: [],
    };

    private _responseInterceptors = new Set<ResponseInterceptor>();

    constructor(private _scraper: IScraper, windowId?: number) {
        this._initResponseCallbacks();
        this.addResponseInterceptor(columnFilterInterceptor);

        if (_scraper.mode === AutoExtractionMode.PageUrl) {
            this._currentPage$.next((_scraper.config as IPageUrlAutoExtractionConfig).startPage);
        }
        // Notify the response through a promise
        this._promise = new Promise<ScraperTabResponse>((_resolve) => {
            let resolved = false;
            this._resolve = async (res: ScraperTabResponse) => {
                if (resolved) {
                    return;
                }

                resolved = true;

                if (res.error) {
                    _resolve(res);
                    return;
                }
                // Apply response interceptors
                const interceptors = Array.from(this._responseInterceptors);
                let rows = res.rows;
                for (const interceptor of interceptors) {
                    rows = await interceptor(this, rows);
                }

                _resolve({
                    rows,
                    done: true,
                });
            };

            const url = _scraper.mode === AutoExtractionMode.PageUrl
                ? generateScraperPageUrl(_scraper, this._currentPage$.value)
                : _scraper.url;

            this._tabPromise = chrome.tabs.create({ url, windowId, active: false });
            this._tabPromise.then((tab) => {
                if (!tab.id) {
                    return;
                }
                this._tab = tab;
            });
        });
    }

    addResponseInterceptor(interceptor: ResponseInterceptor) {
        const { _responseInterceptors } = this;
        _responseInterceptors.add(interceptor);

        return () => {
            _responseInterceptors.delete(interceptor);
        };
    }

    private _initResponseCallbacks() {
        const { _responseCallbacks } = this;
        // Callback for merge response
        const responseCallback = (scraper: IScraper, res: ScraperTabResponse) => {
            // Merge response default
            this._response = {
                rows: res.merge === false
                    ? res.rows
                    : this._response.rows.concat(res.rows),
                done: this._response.done || res.done,
            };

            if (this._response.done) {
                this._resolve(this._response);
            }
        };

        // PageUrl scraper callback
        const pageUrlScraperCallback = (scraper: IScraper) => {
            const tabId = this._tab?.id;
            if (!tabId || scraper.mode !== AutoExtractionMode.PageUrl) {
                return;
            }

            const { _currentPage$ } = this;

            // Achieve the end page
            if (_currentPage$.value >= (scraper.config as IPageUrlAutoExtractionConfig).endPage) {
                this._resolve(this._response);
                return;
            }

            setTimeout(() => {
                this._currentPage$.next(_currentPage$.value + 1);

                const nextPageUrl = generateScraperPageUrl(scraper, this._currentPage$.value);
                chrome.tabs.update(tabId, { url: nextPageUrl });
            }, calculateRandomInterval(4, 1));
        };

        _responseCallbacks.add(responseCallback);
        _responseCallbacks.add(pageUrlScraperCallback);
    }

    resolve(res: ScraperTabResponse) {
        this._resolve(res);
    }

    reject(error: ScraperTabResponseError) {
        this._onError$.next(error);
        this._resolve({
            error,
            rows: [],
            done: true,
        });
    }

    get tab() {
        return this._tab;
    }

    get promise() {
        return this._promise;
    }

    get tabPromise() {
        return this._tabPromise;
    }

    get scraper() {
        return this._scraper;
    }

    get response() {
        return this._response;
    }

    registerRequestCallback(callback: () => void) {
        this._requestCallbacks.add(callback);
    }

    onError(callback: (error: ScraperTabResponseError) => void) {
        this._onError$.subscribe((err) => err && callback(err));
    }

    onPageChange(callback: (page: number) => void) {
        this._currentPage$.subscribe(callback);
    }

    onResponse(res: ScraperTabResponse) {
        this._responseCallbacks.forEach((callback) => callback(this._scraper, res));
    }

    onRequest() {
        this._requestCallbacks.forEach((callback) => callback());
    }

    onDispose(callback: () => void) {
        this._dispose$.subscribe(callback);
    }

    dispose() {
        if (this._dispose$.value) {
            return;
        }

        this._dispose$.next(true);
        this._dispose$.dispose();
        this._onError$.dispose();

        const tabId = this._tab?.id;

        if (tabId) {
            chrome.tabs.remove(tabId);
        }
        this._responseInterceptors.clear();
        this._responseCallbacks.clear();
    }
}
