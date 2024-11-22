import type { IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, setCurrentScraper } from '@univer-clipsheet-core/scraper';
import { getDrillDownSelector, getElementAccurateExtractionRows } from '@univer-clipsheet-core/scraping';
import { captureEvent, ClipSheetMessageTypeEnum, generateRandomId } from '@univer-clipsheet-core/shared';
import { UIStorageKeyEnum, useObservableValue } from '@univer-clipsheet-core/ui';
import { AccurateExtractionController, ViewState } from '@lib/table-scraping';
import { ElementInspectController } from '@lib/element-inspect';
import { t } from '@univer-clipsheet-core/locale';
import { disposeAccurateExtraction, isSameSize, lookForParent } from '@lib/table-scraping/tools';
// import { useDependency, useInjector } from '@wendellhu/redi/react-bindings';
// import { getElementAccurateExtractionRows } from '@lib/tools/accurate-extraction-helper';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDraggable from 'react-draggable';
import type { Injector } from '@wendellhu/redi';
import { useElementInspect } from './hooks';

const resource = {
    successSingleSvg: chrome.runtime.getURL('popup/success-single.svg'),
    errorSingleSvg: chrome.runtime.getURL('popup/error-single.svg'),
    loadingSvg: chrome.runtime.getURL('popup/loading.svg'),
    colorTargetSvg: chrome.runtime.getURL('content/icons/color-target.svg'),
    closeSingleDarkSvg: chrome.runtime.getURL('popup/close-single-dark.svg'),
    upperFloorSingleSvg: chrome.runtime.getURL('content/icons/upper-floor-single.svg'),
};

function shouldShowIcon(viewState: ViewState) {
    return [ViewState.Loading, ViewState.Success, ViewState.Error].includes(viewState);
}

function getIcon(viewState: ViewState) {
    switch (viewState) {
        case ViewState.Loading: {
            return resource.loadingSvg;
        }
        case ViewState.Success: {
            return resource.successSingleSvg;
        }
        case ViewState.Error: {
            return resource.errorSingleSvg;
        }
        default: {
            return '';
        }
    }
}

function ConfirmSelectionFooter(props: {
    disabled?: boolean;
    upperDisabled?: boolean;
    onUpper?: () => void;
    onConfirm?: () => void;
}) {
    const {
        disabled = false,
        upperDisabled = false,
        onUpper,
        onConfirm,
    } = props;

    return (
        <div className="cs-panel-footer" id="select-footer">
            <button
                className={clsx('btn cs-default-btn', {
                    'btn--disabled': upperDisabled,
                })}
                disabled={upperDisabled}
                id="upper-btn"
                onClick={onUpper}
            >
                {t('UpperLevel')}
            </button>
            <button
                className={clsx('btn cs-feature-btn', {
                    'btn--disabled': disabled,
                })}
                id="confirm-selection-btn"
                disabled={disabled}
                onClick={onConfirm}
            >
                {t('ConfirmSelection')}
            </button>
        </div>
    );
}

function ScrapingFooter(props: {
    disabled?: boolean;
    loading?: boolean;
    onReselect?: () => void;
    onCreateScraper?: () => void;
    onConfirm?: () => void;
}) {
    const {
        disabled = false,
        onReselect,
        onCreateScraper,
        // loading,
        onConfirm: _onConfirm,
    } = props;

    const onConfirm = useCallback(() => {
        if (disabled) {
            return;
        }
        _onConfirm?.();
    }, [_onConfirm, disabled]);

    return (
        <div className="cs-panel-footer" id="extract-footer">
            <div>
                <button className="btn cs-text-btn" id="reselect-btn" onClick={onReselect}>{t('Reselect')}</button>
            </div>
            <div className="cs-flex cs-items-center">
                <button className="btn cs-default-btn cs-inline-flex cs-items-center" onClick={onCreateScraper}>
                    {/* {loading && (
                        <span className="cs-inline-flex cs-loading-icon cs-animate-spin cs-mr-1"><LoadingSvg /></span>
                    )} */}
                    <span>{t('CreateScraper')}</span>
                </button>
                <button
                    className={clsx('btn cs-feature-btn', {
                        'btn--disabled': disabled,
                    })}
                    id="confirm-btn"
                    onClick={onConfirm}
                >
                    {t('Confirm')}
                </button>
            </div>
        </div>
    );
}

function ErrorFooter(props: {
    onCancel?: () => void;
    onRetry?: () => void;
}) {
    const {
        onCancel,
        onRetry } = props;
    return (
        <div className="cs-panel-footer">
            <div></div>
            <div>
                <button className="btn cs-default-btn" id="cancel-btn" onClick={onCancel}>{t('Cancel')}</button>
                <button className="btn cs-feature-btn" onClick={onRetry}>{t('Retry')}</button>
            </div>
        </div>
    );
}

export const AccurateExtractionDialog = (props: {
    injector: Injector;
}) => {
    const { injector } = props;
    const accurateExtractionController = useMemo(() => injector.get(AccurateExtractionController), [injector]);
    const elementInspectController = useMemo(() => injector.get(ElementInspectController), [injector]);
    // const { injector } = props;
    // const accurateExtractionController = useDependency(AccurateExtractionController);
    // const elementInspectController = useDependency(ElementInspectController);
    // const injector = useInjector();
    // const  accurateExtractionCongtroller = useDependency(AccurateExtractionController)
    const [viewState, setViewState] = useObservableValue<ViewState>(accurateExtractionController.viewState$);
    const selectableViewStates = useMemo(() => [ViewState.NoSelect, ViewState.NoData], []);
    const [content, setContent] = useState('');
    const [sheetLink] = useObservableValue(accurateExtractionController.sheetLink$);
    const iframeUrlRef = React.useRef<string | null>(null);
    const isShowIcon = shouldShowIcon(viewState);

    const [extractor] = useObservableValue(accurateExtractionController.extractor$);

    const [isGrandchild, setIsGrandchild] = useState(false);
    const [upperDisabled, setUpperDisabled] = useState(false);
    const [selectionRows, setSelectionRows] = useState(0);

    const [rowsCount] = useObservableValue(accurateExtractionController.rowsCount$);
    // const [createScraperLoading, setCreateScraperLoading] = useState(false);
    const panelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getContentHtml = () => {
            switch (viewState) {
                case ViewState.NoSelect:
                    return t('PleaseSelectElement');
                case ViewState.NoData:
                    return t('AccurateExtractionNoDataMessage');
                case ViewState.NoIframe:
                    return t('NoIframeMessage', { url: `<a class="cs-link" href="${iframeUrlRef.current}" target="_blank">Iframe link</a>` });
                case ViewState.Loading:
                    return t('AccurateExtractionLoadingMessage');
                case ViewState.Success:
                    return t('AccurateExtractionSuccessMessage');
                case ViewState.Error:
                    return t('AccurateExtractionErrorMessage');
                case ViewState.QuickScraping: {
                    return t('SelectedElementRows', {
                        rows: String(rowsCount),
                    });
                }
                default:
                    return '';
            }
        };

        setContent(getContentHtml());
    }, [viewState, rowsCount]);

    useEffect(() => {
        let dispose: () => void;
        if (extractor) {
            if (selectableViewStates.includes(accurateExtractionController.viewState)) {
                setViewState(ViewState.ConfirmSelection);
            }

            dispose = extractor.target$.subscribe((el, prevEl) => {
                if (el !== prevEl) {
                    setUpperDisabled(false);
                }
            });
        }

        setSelectionRows(extractor?.elementRows ?? 0);

        return () => {
            dispose?.();
        };
    }, [extractor]);

    useElementInspect((element) => {
        if (viewState === ViewState.QuickScraping) {
            return;
        }

        const isIframe = element instanceof HTMLIFrameElement;
        if (isIframe) {
            accurateExtractionController.highlightCover.attach(element);
            iframeUrlRef.current = element.src;
            setViewState(ViewState.NoIframe);
            return;
        }

        const rows = getElementAccurateExtractionRows(element);
        const resolvedElement = lookForParent(element, {
            until: (parent) => getElementAccurateExtractionRows(parent) > rows && isSameSize(element, parent),
        });

        accurateExtractionController.inspectElement(resolvedElement ?? element);
    }, [viewState]);

    const handleScrapingConfirm = () => {
        captureEvent('clipsheet_accurate_extraction_confirm', {
            url: location.href,
        });
        accurateExtractionController.extractData(accurateExtractionController.getSheets());
    };

    const handleReselect = () => {
        accurateExtractionController.disposeExtractors();
        elementInspectController.activate();
        setViewState(ViewState.NoSelect);
    };

    const handleClose = () => {
        disposeAccurateExtraction(injector);
        // disposeAccurateExtraction();
    };

    const handleUpper = () => {
        const result = accurateExtractionController.handleUpperFloor(isGrandchild);

        setUpperDisabled(!result);
    };

    const handleConfirmSelection = () => {
        setViewState(ViewState.QuickScraping);
        elementInspectController.deactivate();
        extractor?.buildLazyLoadElements();
    };

    const handleCreateScraper = async () => {
        const lazyElements = extractor?.lazyLoadElements;
        const _sheet = lazyElements?.getAllSheets()[0];

        if (!_sheet || !extractor?.target) {
            return;
        }

        const sheet = { ..._sheet, rows: _sheet.rows.slice(0, 10) };

        const setColumnToScraper = (cols: IScraperColumn[]) => {
            setCurrentScraper({
                url: window.location.href ?? '',
                targetSelector: getDrillDownSelector(extractor.target) ?? '',
                columns: cols,
                createAt: Date.now(),
                id: '',
                name: '',
                mode: AutoExtractionMode.None,
            });
            // chrome.runtime.sendMessage({
            //     type: MsgType.SetStorage,
            //     key: StorageKeys.CurrentScraper,
            //     value: {
            //         url: window.location.href ?? '',
            //         targetSelector: getDrillDownSelector(extractor.target) ?? '',
            //         columns: cols,
            //     },
            // });
        };

        chrome.runtime.sendMessage({
            type: ClipSheetMessageTypeEnum.OpenSidePanel,
        });

        const rowCells = sheet.rows[0].cells;
        const columnNames = sheet.columnName.length > 0
            ? sheet.columnName
            : rowCells.map((cell) => cell.text);

        setColumnToScraper(columnNames.map((name, index) => ({
            id: generateRandomId(),
            name,
            index,
            type: rowCells[index].type,
        })));

        chrome.runtime.sendMessage({
            type: ClipSheetMessageTypeEnum.SetStorage,
            payload: {
                key: UIStorageKeyEnum.IntelligenceColumnsLoading,
                value: true,
            },
        });
        // Request columns AI generated by sheet rows data
        // getDataSource(DataSourceKeys.IntelligenceColumns, {
        //     innerText: extractor.target.innerText,
        //     initialSheets: [sheet],
        // }).then((columns: Array<{ name: string; index: number }>) => {
        //     const scraperColumns: IScraper['columns'] = columns.map((c, index) => {
        //         const name = sheet.columnName[index] ?? c.name;
        //         const cell = sheet.rows[0].cells[index];
        //         const column: IScraperColumn = {
        //             name,
        //             index,
        //             id: generateRandomId(),
        //             type: cell.type as unknown as Sheet_Cell_Type_Enum ?? Sheet_Cell_Type_Enum.TEXT,
        //         };

        //         if (cell.url) {
        //             column.url = cell.url;
        //         }

        //         return column;
        //     });

        //     setColumnToScraper(scraperColumns);
        // }).finally(() => {
        //     chrome.runtime.sendMessage({
        //         type: ClipSheetMessageTypeEnum.SetStorage,
        //         payload: {
        //             key: StorageKeys.IntelligenceColumnsLoading,
        //             value: false,
        //         },
        //     });
        // });

        chrome.runtime.sendMessage({
            type: ClipSheetMessageTypeEnum.SetStorage,
            payload: {
                key: UIStorageKeyEnum.IntelligenceColumnsLoading,
                value: false,
            },
        });

        accurateExtractionController.deactivate();
    };

    const handleLowerLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checkedValue = e.target.checked;
        accurateExtractionController.highlightCover.detach();
        setIsGrandchild(checkedValue);
        const extractorTarget = extractor?.target;
        extractorTarget && accurateExtractionController.highlightCover.attach(extractorTarget);
    };

    return (
        <ReactDraggable axis="both" onStart={() => elementInspectController.start()} onStop={() => elementInspectController.stop()}>
            <div className="cs-panel" ref={panelRef}>
                <div className="cs-panel-inner">
                    <div className="cs-panel-header" data-cs-draggable="true">
                        <div className="cs-panel-header-main">
                            <span className="cs-panel-title">{t('QuickScraping')}</span>
                        </div>
                        <img className="cs-close-icon" src={resource.closeSingleDarkSvg} onClick={handleClose} />
                    </div>

                    <div className={clsx({
                        'cs-panel-content': !isShowIcon,
                        'cs-message': isShowIcon,
                    })}
                    >
                        {isShowIcon && (
                            <img
                                className={clsx('status-icon', {
                                    'cs-loading-icon': viewState === ViewState.Loading,
                                    'cs-success-icon': viewState === ViewState.Success,
                                    'cs-error-icon': viewState === ViewState.Error,
                                })}
                                src={getIcon(viewState)}
                                alt=""
                            />
                        ) }
                        {viewState === ViewState.ConfirmSelection
                            ? (
                                <>
                                    <div style={{ color: '#474D57' }}>{t('SelectedElementDetectedMessage')}</div>
                                    <div style={{ marginTop: '4px' }}>{t('SelectedElementDetectedRows', { rows: String(selectionRows) })}</div>
                                </>
                            )
                            : (
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                                    {viewState === ViewState.Success && <div className="cs-success-footer"><a className="cs-active-color cs-underline cs-cursor-pointer" target="_blank" href={sheetLink}>{t('ViewScrapedTableData')}</a></div>}
                                </div>
                            )}

                    </div>
                    {viewState === ViewState.ConfirmSelection && <ConfirmSelectionFooter upperDisabled={upperDisabled} onUpper={handleUpper} onConfirm={handleConfirmSelection} disabled={(extractor?.elementRows ?? 0) <= 0} />}
                    {viewState === ViewState.QuickScraping && <ScrapingFooter onCreateScraper={handleCreateScraper} onReselect={handleReselect} onConfirm={handleScrapingConfirm} disabled={rowsCount <= 0} />}
                    {viewState === ViewState.Error && <ErrorFooter onCancel={handleClose} />}
                    {viewState === ViewState.ConfirmSelection && (
                        <footer className="cs-extra-footer">
                            <input checked={isGrandchild} onChange={handleLowerLevel} className="cs-checkbox" id="cs-lower-level-checkbox" type="checkbox" />
                            <label className="cs-checkbox-label cs-cursor-pointer" htmlFor="cs-lower-level-checkbox">{t('CollectLowerLevelNodes')}</label>
                        </footer>
                    )}
                </div>
            </div>
        </ReactDraggable>
    );
};
