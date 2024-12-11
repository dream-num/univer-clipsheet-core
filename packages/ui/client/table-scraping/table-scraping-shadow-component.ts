import type { IInitialSheet, ITableApproximationExtractionParam, ResponseScrapTablesMessage, ScrapTablesMessage } from '@univer-clipsheet-core/table';
import { generateRandomId, ObservableValue, promisifyMessage } from '@univer-clipsheet-core/shared';
import { getElementText, getTableApproximationByElement, TableMessageTypeEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { Inject, Injector } from '@wendellhu/redi';
import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { ClientViewService } from '@client/client-view.service';
import { CoverService } from '../cover';
import { RemountObserver } from '../remount-observer';
import { lookForParent } from '../tools';
import { ShadowComponent } from '../shadow-component';
import { TableScrapingDialog } from './components/TableScrapingDialog';
// @ts-expect-error
import htmlContent from './accurate-extraction-dialog-template.html';

import type { IExtractor } from './extractors';
import { findLazyLoadElementsParams, findUpperTableExtractionParams, TableElementExtractor, TableLikeElementExtractor } from './extractors';

export enum ViewState {
    NoIframe = 'NoIframe',
    Selecting = 'Selecting',
    NoData = 'NoData',
    PreviewSelection = 'PreviewSelection',
    ConfirmSelection = 'ConfirmSelection',
    Loading = 'Loading',
    Success = 'Success',
    Error = 'Error',
}

export enum AutomationType {
    Scroll = 'Scroll',
    Click = 'Click',
}

const rootClassName = '.cs-root';

export class TableScrapingShadowComponent extends ShadowComponent {
    override _template = htmlContent;
    viewState$ = new ObservableValue<ViewState>(ViewState.Selecting);
    automationTab$ = new ObservableValue<AutomationType>(AutomationType.Scroll);
    automation$ = new ObservableValue<boolean>(false);
    rowsCount$ = new ObservableValue<number>(0);

    private _renderRoot: Root | null = null;
    extractor$ = new ObservableValue<IExtractor | null>(null);

    private _coverId = generateRandomId();

    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(CoverService) private _coverService: CoverService,
        @Inject(ClientViewService) private _clientViewService: ClientViewService,
        @Inject(RemountObserver) private _remountObserver: RemountObserver
    ) {
        super();

        this._initExtractors();
    }

    get highlightCover() {
        const { _coverService, _coverId } = this;
        return {
            attach: (el: HTMLElement) => {
                if (_coverService.hasCover(_coverId)) {
                    _coverService.updateCover(_coverId, el);
                    return;
                }

                _coverService.addCover(_coverId, el);
            },
            detach: () => {
                _coverService.removeCover(_coverId);
            },
        };
    }

    private _initExtractors() {
        const { _coverService, _coverId } = this;
        this.extractor$.subscribe((extractor, prevExtractor) => {
            prevExtractor?.dispose();
            if (!extractor) {
                return;
            }

            _coverService.removeCover(this._coverId);
            _coverService.addCover(this._coverId, extractor.target);

            extractor.lazyLoadElements$.subscribe((lazyElements) => {
                if (lazyElements) {
                    this.rowsCount$.next(lazyElements.rows);
                    lazyElements.onChange(() => this.rowsCount$.next(lazyElements.rows));
                } else {
                    this.rowsCount$.next(0);
                }
            });

            let unobserve: (() => void) | undefined;
            extractor.lazyLoadElements$.subscribe((lazyElements) => {
                unobserve?.();

                if (!lazyElements) {
                    return;
                }

                const target = extractor.target$.value;

                const item = target && lazyElements.findItemByElement(target);

                if (target && item) {
                    unobserve = this._remountObserver.observe(target, {
                        onRemount: (newEl) => {
                            if (_coverService.hasCover(_coverId)) {
                                _coverService.updateCover(_coverId, newEl);
                            } else {
                                _coverService.addCover(_coverId, newEl);
                            }
                            // @ts-ignore
                            lazyElements.updateItemElement(item, newEl);
                        },
                    });
                }
            });
        });
    }

    setExtractor(extractor: IExtractor | null) {
        this.extractor$.next(extractor);
    }

    get extractor() {
        return this.extractor$.value;
    }

    get viewState() {
        return this.viewState$.value;
    }

    get rows() {
        return this.extractor$.value?.sheetRows;
    }

    buildLazyLoadElements() {
        this.extractor$.value?.buildLazyLoadElements();
    }

    private _mount() {
        const rootNode = this._shadowRoot?.querySelector(rootClassName);
        if (rootNode && !this._renderRoot) {
            this._renderRoot = createRoot(rootNode);
            this._renderRoot.render(React.createElement(TableScrapingDialog, { injector: this._injector }));
        }
    }

    private _unmount() {
        this._renderRoot?.unmount();
        this._renderRoot = null;
    }

    public override activate() {
        super.activate();
        this._mount();
    }

    private _handleEmptyExtraction() {
        this.viewState$.next(ViewState.NoData);
        this.disposeExtractors();
    }

    async extractData(sheets: IInitialSheet[]) {
        const { viewState$ } = this;

        const filteredSheets = sheets.filter((sheet) => sheet.rows.length > 0);
        if (filteredSheets.length <= 0) {
            this._handleEmptyExtraction();
            return;
        }

        const target = this.extractor?.target;

        const ScrapTablesMessage: ScrapTablesMessage = {
            type: TableMessageTypeEnum.ScrapTables,
            payload: {
                text: target ? getElementText(target) : '',
                sheets: filteredSheets,
                record: {
                    recordType: TableRecordTypeEnum.Sheet,
                    title: document.title,
                    sourceUrl: location.href,
                },
            },
        };
        chrome.runtime.sendMessage(ScrapTablesMessage);

        viewState$.next(ViewState.Loading);

        promisifyMessage<ResponseScrapTablesMessage>((msg) => msg.type === TableMessageTypeEnum.ResponseScrapTables)
            .then((msg) => {
                const { success } = msg.payload;
                if (viewState$.value === ViewState.Loading) {
                    viewState$.next(success ? ViewState.Success : ViewState.Error);
                }

                this._clientViewService.triggerTableScraped(msg.payload);
            });
    }

    disposeExtractors() {
        this._coverService.removeCover(this._coverId);

        this.setExtractor(null);
    }

    inspectElement(element: HTMLElement) {
        const { extractor } = this;
        const params = findLazyLoadElementsParams(element);

        if (!params) {
            this.setExtractor(null);
            return false;
        }

        const foundElement = params instanceof Element ? params : params.element;
        if (foundElement === extractor?.target) {
            return false;
        }

        const newExtractor = params instanceof Element ? new TableElementExtractor(params as HTMLTableElement) : new TableLikeElementExtractor(params);

        this.setExtractor(newExtractor);

        return true;
    }

    getSheets() {
        return this.extractor?.lazyLoadElements?.getAllSheets() ?? [];
    }

    handleUpperFloor(isGrandchild: boolean) {
        const extractor = this.extractor$.value;
        const target = extractor?.target;
        if (!target) {
            return false;
        }

        const parents: HTMLElement[] = [];

        let params: ITableApproximationExtractionParam | undefined;

        lookForParent(target, {
            forEach: (el) => parents.push(el),
            until: (el) => {
                params = getTableApproximationByElement(el, isGrandchild);
                return !!params;
            },
        });

        const newTableExtractionParams = findUpperTableExtractionParams(parents, isGrandchild);

        if (!newTableExtractionParams) {
            return false;
        }

        this.setExtractor(new TableLikeElementExtractor(newTableExtractionParams));

        return true;
    }

    public override deactivate(): void {
        super.deactivate();
        this._unmount();

        this.highlightCover.detach();
        this.extractor$.dispose();
        this.automation$.dispose();
        this.rowsCount$.dispose();
        this.viewState$.dispose();
        this.automationTab$.dispose();
    }
}
