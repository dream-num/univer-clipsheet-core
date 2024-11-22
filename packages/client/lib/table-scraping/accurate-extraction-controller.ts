import type { IInitialSheet, ITableApproximationExtractionParam } from '@univer-clipsheet-core/scraping';
import { ObservableValue } from '@univer-clipsheet-core/shared';
// import { getElementText, getTableApproximationByElement, MsgType, ObservableValue, RecordType, subscribeMessage } from '@univer-clipsheet-core/shared';
import { RemountObserver } from '@lib/remount-observer';
import { HighlightCover } from '@lib/cover';
// import { RemountObserver } from '@lib/tools/remount-observer';
import { AccurateExtractionDialog } from '@views/AccurateExtractionDialog';
import { Inject } from '@wendellhu/redi';
import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { ShadowComponent } from '../shadow-component';
import { lookForParent } from './tools';
import type { IExtractor } from './extractors';
import { findLazyLoadElementsParams, findUpperTableExtractionParams, TableElementExtractor, TableLikeElementExtractor } from './extractors';

export enum ViewState {
    NoIframe = 'NoIframe',
    NoSelect = 'NoSelect',
    NoData = 'NoData',
    ConfirmSelection = 'ConfirmSelection',
    QuickScraping = 'QuickScraping',
    Loading = 'Loading',
    Success = 'Success',
    Error = 'Error',
}

export enum AutomationType {
    Scroll = 'Scroll',
    Click = 'Click',
}

const rootClassName = '.cs-root';

export class AccurateExtractionController extends ShadowComponent {
    protected override _templateUrl = 'templates/accurate-extraction-dialog-template.html';
    viewState$ = new ObservableValue<ViewState>(ViewState.NoSelect);
    automationTab$ = new ObservableValue<AutomationType>(AutomationType.Scroll);
    automation$ = new ObservableValue<boolean>(false);
    rowsCount$ = new ObservableValue<number>(0);
    sheetLink$ = new ObservableValue<string>('');
    // upperDisabled$ = new ObservableValue<boolean>(false);

    private _renderRoot: Root | null = null;
    extractor$ = new ObservableValue<IExtractor | null>(null);

    private _highlightCover = new HighlightCover({
        onCoverCreated: (cover) => {
            cover.style.pointerEvents = 'none';
        },
    });

    constructor(
        @Inject(RemountObserver) private _remountObserver: RemountObserver
    ) {
        super();

        this._initExtractors();
    }

    private _initExtractors() {
        this.extractor$.subscribe((extractor, prevExtractor) => {
            prevExtractor?.dispose();
            if (!extractor) {
                return;
            }
            this._highlightCover.attach(extractor.target);

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
                            this.highlightCover.attach(newEl);
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

    get highlightCover() {
        return this._highlightCover;
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
            this._renderRoot.render(React.createElement(AccurateExtractionDialog));
        }
    }

    private _unmount() {
        this._renderRoot?.unmount();
        this._renderRoot = null;
    }

    public override async activate(): Promise<void> {
        await super.activate();
        this._mount();
    }

    private _handleEmptyExtraction() {
        this.viewState$.next(ViewState.NoData);
        this.disposeExtractors();
    }

    async extractData(sheets: IInitialSheet[]) {
        const { sheetLink$, viewState$ } = this;

        const filteredSheets = sheets.filter((sheet) => sheet.rows.length > 0);
        if (filteredSheets.length <= 0) {
            this._handleEmptyExtraction();
            return;
        }

        const target = this.extractor?.target;

        sendPageMessage({
            recordType: RecordType.Sheet,
            text: target ? getElementText(target) : '',
            sheets: filteredSheets,
        });

        const response = subscribeMessage<Message[MsgType.NotifyExtractionStatus]>((msg) => msg.type === MsgType.NotifyExtractionStatus && msg.url === location.href);

        response.then((msg) => {
            viewState$.value === ViewState.Loading && viewState$.next(msg.success ? ViewState.Success : ViewState.Error);
            sheetLink$.next(msg.sheetLink);
        });

        viewState$.next(ViewState.Loading);
    }

    disposeExtractors() {
        this._highlightCover.detach();
        this.setExtractor(null);
    }

    inspectElement(element: HTMLElement) {
        const { extractor } = this;
        const params = findLazyLoadElementsParams(element);
        if (!params) {
            this.setExtractor(null);
            return;
        }

        const foundElement = params instanceof Element ? params : params.element;
        if (foundElement === extractor?.target) {
            return;
        }

        const newExtractor = params instanceof Element ? new TableElementExtractor(params as HTMLTableElement) : new TableLikeElementExtractor(params);

        this.setExtractor(newExtractor);
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
        this.extractor$.dispose();
        this._highlightCover.dispose();
        this.automation$.dispose();
        this.rowsCount$.dispose();
        this.viewState$.dispose();
        this.automationTab$.dispose();
    }
}
