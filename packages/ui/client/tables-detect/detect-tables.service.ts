
import type { ITableApproximationExtractionParam } from '@univer-clipsheet-core/table';
import { generateRandomId, ObservableValue } from '@univer-clipsheet-core/shared';
import { createLazyLoadElement, findApproximationTables, getEspecialConfig, getTableApproximationByElement, getTableExtractionParamRows, groupTableRows, queryTableScopeRows } from '@univer-clipsheet-core/table';
import { Inject } from '@wendellhu/redi';
import { TableScrapingShadowComponent, ViewState } from '@client/table-scraping';
import { IframeViewController } from '@client/iframe-view';
import { getBodyElements } from '@client/tools';
import { RemountObserver } from '../remount-observer';
import { CoverService } from '../cover';
import { TableElementExtractor, TableLikeElementExtractor } from '../table-scraping/extractors';
import type { HighlightDetectedTableMessage, PushDetectTablesMessage, RequestDetectTablesMessage, ScrapDetectedTableMessage } from './detect-tables.message';
import { DetectTablesMessageTypeEnum } from './detect-tables.message';
// Controller to detect tables in the page
export class DetectTablesService {
    scrapingTable$ = new ObservableValue<ITableApproximationExtractionParam | HTMLTableElement | undefined>(undefined);
    highlightElement$ = new ObservableValue<HTMLElement | undefined>(undefined);
    tableElements$ = new ObservableValue<HTMLElement[]>([]);
    private _tableMap: Map<string, ITableApproximationExtractionParam | HTMLTableElement> = new Map();
    private _tableRowsCache = new Map<HTMLTableElement, number>();
    private _coverId = generateRandomId();

    constructor(
        @Inject(RemountObserver) private _remountObserver: RemountObserver,
        @Inject(CoverService) private _coverService: CoverService,
        @Inject(TableScrapingShadowComponent) private _tableScrapingShadowComponent: TableScrapingShadowComponent,
        @Inject(IframeViewController) private _iframeViewController: IframeViewController
    ) {
        this.highlightElement$.subscribe((el) => {
            _coverService.removeCover(this._coverId);
            if (el) {
                _coverService.addCover(this._coverId, el);
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
    }

    get enableHighlight() {
        return !this._tableScrapingShadowComponent.active && !this._iframeViewController.active;
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

        const bodyElements = getBodyElements(document);

        bodyElements.forEach((bodyElement) => {
            const detectedTables = Array.from(bodyElement.querySelectorAll('table'))
                .filter((table) => this._queryTableElementRows(table) > 1)
                .sort((a, b) => this._queryTableElementRows(b) - this._queryTableElementRows(a));

            const detectedTableLikeParams = findApproximationTables(bodyElement, getEspecialConfig())
                .filter((table) => {
                    const { element } = table;
                    const rect = element.getBoundingClientRect();

                    if (rect.width <= 0
                    || rect.height <= 0
                    || !element.checkVisibility({ opacityProperty: true, visibilityProperty: true } as any)
                    || element instanceof HTMLSelectElement) {
                        return false;
                    }

                    // const rows = getTableExtractionParamRows(table);
                    // console.log('average weight', table.weightedScore / rows);

                    return table.weightedScore >= 1000000;
                })
                .sort((a, b) => {
                    const aAverageWeight = a.weightedScore / getTableExtractionParamRows(a);
                    const bAverageWeight = b.weightedScore / getTableExtractionParamRows(b);
                    return bAverageWeight - aAverageWeight;
                    // return b.weightedScore - a.weightedScore
                });

            detectedTables.forEach((table) => {
                this._tableMap.set(generateRandomId(), table);
            });
            detectedTableLikeParams.forEach((table) => {
                this._tableMap.set(generateRandomId(), table);
            });
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
        const msg: PushDetectTablesMessage = {
            type: DetectTablesMessageTypeEnum.PushDetectTables,
            payload: this.getDetectedTables(),
        };

        chrome.runtime.sendMessage(msg);
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener((message: HighlightDetectedTableMessage | RequestDetectTablesMessage | ScrapDetectedTableMessage) => {
            const { highlightElement$, _tableMap, _tableScrapingShadowComponent } = this;
            if (message.type === DetectTablesMessageTypeEnum.RequestDetectTables) {
                this.detectTables();
                this._sendDetectedTables();
            }

            if (message.type === DetectTablesMessageTypeEnum.ScrapDetectedTable) {
                const table = _tableMap.get(message.payload);

                if (table) {
                    highlightElement$.next(undefined);
                    _tableScrapingShadowComponent.activate();

                    const newExtractor = table instanceof HTMLTableElement
                        ? new TableElementExtractor(table)
                        : new TableLikeElementExtractor(table);

                    _tableScrapingShadowComponent.setExtractor(newExtractor);

                    _tableScrapingShadowComponent.buildLazyLoadElements();

                    _tableScrapingShadowComponent.viewState$.next(ViewState.ConfirmSelection);
                }
            }

            if (message.type === DetectTablesMessageTypeEnum.HighlightDetectedTable) {
                if (!this.enableHighlight) {
                    return;
                }

                const { scrollTo, id } = message.payload;
                const table = _tableMap.get(id);

                if (table) {
                    const element = this._resolveTableElement(table);
                    if (element && element !== highlightElement$.value) {
                        scrollTo === true && element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        highlightElement$.next(element);
                    }
                } else {
                    highlightElement$.next(undefined);
                }
            }
        });
    }
}
