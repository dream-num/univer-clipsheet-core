
import type { ITableApproximationExtractionParam } from '@univer-clipsheet-core/scraping';

import { generateRandomId, ObservableValue } from '@univer-clipsheet-core/shared';

import { findApproximationTables, getEspecialConfig, getTableExtractionParamRows, groupTableRows, queryTableScopeRows } from '@univer-clipsheet-core/scraping';
// import { HighlightColor, HighlightCover } from '@univer-clipsheet-core/client';
// import { getTableExtractionParamRows } from '@lib/tools/accurate-extraction-helper';
import { Inject } from '@wendellhu/redi';
import { RemountObserver } from './remount-observer';
import { CoverService } from './cover';
// import { AccurateExtractionController } from './accurate-extraction-controller';
// import { ViewState } from './accurate-extraction-controller/accurate-extraction-controller';
// import { TableElementExtractor, TableLikeElementExtractor } from './accurate-extraction-controller/extractors';

// Controller to detect tables in the page
export class DetectTablesService {
    scrapingTable$ = new ObservableValue<ITableApproximationExtractionParam | HTMLTableElement | undefined>(undefined);
    highlightElement$ = new ObservableValue<HTMLElement | undefined>(undefined);
    tableElements$ = new ObservableValue<HTMLElement[]>([]);
    private _tableMap: Map<string, ITableApproximationExtractionParam | HTMLTableElement> = new Map();
    private _tableRowsCache = new Map<HTMLTableElement, number>();
    private _coverId = generateRandomId();

    // private _highlightCover = new HighlightCover({
    //     onCoverCreated: (cover) => {
    //         cover.style.backgroundColor = HighlightColor.Shallow;
    //     },
    // });

    constructor(
        @Inject(RemountObserver) private _remountObserver: RemountObserver,
        @Inject(CoverService) private _coverService: CoverService
        // @Inject(AccurateExtractionController) private _accurateExtractionController: AccurateExtractionController
    ) {
        // const detectedElementHighlightCover = this._highlightCover;
        this.highlightElement$.subscribe((el) => {
            if (el) {
                _coverService.addCover(this._coverId, el);
                // detectedElementHighlightCover.attach(el);
            } else {
                _coverService.removeCover(this._coverId);
                // detectedElementHighlightCover.detach();
            }
        });
        const unobserveList: Array<(() => void)> = [];
        this.tableElements$.subscribe((elements) => {
            unobserveList.forEach((unobserve) => unobserve());
            unobserveList.length = 0;

            elements.forEach((el, index) => {
                const id = this.getId(el);
                if (!id) {
                    return;
                }
                const unobserveFunc = _remountObserver.observe(el, {
                    onRemount: (newEl) => {
                        const highlightElement = this.highlightElement$.value;
                        const highlightId = highlightElement && this.getId(highlightElement);

                        if (id === highlightId && highlightElement !== newEl) {
                            this.highlightElement$.next(newEl);
                        }
                        elements[index] = newEl;
                        this.updateElement(id, newEl);
                    },
                });

                unobserveFunc && unobserveList.push(unobserveFunc);
            });
        });

        this.scrapingTable$.subscribe((table) => {
            // if (!table) {

            // }
            // _accurateExtractionController.activate();
            // const newExtractor = table instanceof HTMLTableElement
            //     ? new TableElementExtractor(table)
            //     : new TableLikeElementExtractor(table);

            // _accurateExtractionController.setExtractor(newExtractor);

            // _accurateExtractionController.buildLazyLoadElements();

            // _accurateExtractionController.viewState$.next(ViewState.QuickScraping);
        });
    }

    getId(element: HTMLElement) {
        const item = Array.from(this._tableMap.entries()).find(([id, table]) => this._resolveTableElement(table) === element);
        return item?.[0];
    }

    updateElement(id: string, element: HTMLElement) {
        const { _tableMap } = this;
        const originalTable = _tableMap.get(id);
        if (originalTable) {
            const newTable = originalTable instanceof HTMLTableElement ? (element as HTMLTableElement) : { ...originalTable, element };
            _tableMap.set(id, newTable);
            this._sendDetectedTables();
        }
    }

    private _queryTableElementRows(table: HTMLTableElement) {
        const { _tableRowsCache } = this;
        if (_tableRowsCache.has(table)) {
            return _tableRowsCache.get(table)!;
        }
        const rows = groupTableRows(queryTableScopeRows(table)).length;
        _tableRowsCache.set(table, rows);
        return rows;
    }

    detectTables() {
        this._tableMap.clear();
        this._tableRowsCache.clear();

        const detectedTables = Array.from(document.body.querySelectorAll('table'))
            .filter((table) => this._queryTableElementRows(table) > 1)
            .sort((a, b) => this._queryTableElementRows(b) - this._queryTableElementRows(a));

        const detectedTableLikeParams = findApproximationTables(document.body as HTMLBodyElement, getEspecialConfig())
            .filter((table) => {
                const { element } = table;
                const rect = element.getBoundingClientRect();
                if (rect.width <= 0
                    || rect.height <= 0
                    || !element.checkVisibility({ opacityProperty: true, visibilityProperty: true } as unknown as { checkOpacity: boolean; visibilityProperty: boolean })
                    || element instanceof HTMLSelectElement) {
                    return false;
                }
                if (table.weightedScore < 1000000) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => b.weightedScore - a.weightedScore);

        detectedTables.forEach((table) => {
            this._tableMap.set(generateRandomId(), table);
        });
        detectedTableLikeParams.forEach((table) => {
            this._tableMap.set(generateRandomId(), table);
        });

        this.tableElements$.next(Array.from(this._tableMap.values()).map((table) => this._resolveTableElement(table)));
    }

    private _getTableRows(table: ITableApproximationExtractionParam | HTMLTableElement) {
        return table instanceof HTMLTableElement ? this._queryTableElementRows(table) : getTableExtractionParamRows(table);
    }

    private _resolveTableElement(table: ITableApproximationExtractionParam | HTMLTableElement) {
        if (table instanceof HTMLTableElement) {
            return table;
        }
        return table.element as HTMLElement;
    }

    getDetectedTables() {
        const { _tableMap } = this;

        return Array.from(_tableMap.entries())
            .map(([id, table]) => ({ id, rows: this._getTableRows(table) }));
    }

    private _sendDetectedTables() {
        // const msg: Message[MsgType.SendDetectedTables] = {
        //     type: MsgType.SendDetectedTables,
        //     tables: this.getDetectedTables(),
        // };
        // chrome.runtime.sendMessage(msg);
    }

    listenChromeMessages() {
        chrome.runtime.onMessage.addListener((message: any) => {
            const { highlightElement$, _tableMap } = this;
            // if (message.type === MsgType.RequestDetectedTables) {
            //     this.detectTables();
            //     this._sendDetectedTables();
            // }
            // if (message.type === MsgType.HighlightDetectedTable) {
            //     const table = _tableMap.get(message.tableId);

            //     if (table) {
            //         const element = this._resolveTableElement(table);
            //         if (element && element !== highlightElement$.value) {
            //             message.scrollTo !== false && element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            //             highlightElement$.next(element);
            //         }
            //     } else {
            //         highlightElement$.next(undefined);
            //     }
            // }
            // if (message.type === MsgType.ScrapSelectedTable) {
            //     const table = _tableMap.get(message.tableId);
            //     if (table) {
            //         highlightElement$.next(undefined);
            //         this.scrapingTable$.next(table);
            //     }
            // }
            // if (message.type === MsgType.StartAccurateExtraction) {
            //     highlightElement$.next(undefined);
            // }
        });
    }
}
