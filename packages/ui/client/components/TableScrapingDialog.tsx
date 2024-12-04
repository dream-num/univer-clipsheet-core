import { useObservableValue } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import type { IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, setCurrentScraper } from '@univer-clipsheet-core/scraper';
import { captureEvent, ClipsheetMessageTypeEnum, generateRandomId } from '@univer-clipsheet-core/shared';
import { getDrillDownSelector, getElementAccurateExtractionRows } from '@univer-clipsheet-core/table';
import type { Injector } from '@wendellhu/redi';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDraggable from 'react-draggable';
import { CloseSingleDarkSvg, ErrorSingleSvg, LoadingSvg, SuccessSingleSvg } from '@components/icons';
import { ClientViewService } from '../client-view.service';
import { ElementInspectService } from '../element-inspect';
import { RemountObserver } from '../remount-observer';
import { TableScrapingShadowComponent, ViewState } from '../table-scraping';
import { isSameSize, lookForParent } from '../tools';
import { useElementInspect } from './hooks';

function disposeAccurateExtraction(injector: Injector) {
    const elementInspectService = injector.get(ElementInspectService);
    const tableScrapingShadowComponent = injector.get(TableScrapingShadowComponent);
    const remountObserver = injector.get(RemountObserver);
    remountObserver.clear();
    elementInspectService.shadowComponent.deactivate();
    tableScrapingShadowComponent.deactivate();
}

function shouldShowIcon(viewState: ViewState) {
    return [ViewState.Loading, ViewState.Success, ViewState.Error].includes(viewState);
}

function getIcon(viewState: ViewState, className: string) {
    switch (viewState) {
        case ViewState.Loading: {
            return <LoadingSvg className={className} />;
        }
        case ViewState.Success: {
            return <SuccessSingleSvg className={className} />;
        }
        case ViewState.Error: {
            return <ErrorSingleSvg className={className} />;
        }
        default: {
            return '';
        }
    }
}

function PreviewSelectionFooter(props: {
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

export const TableScrapingDialog = (props: {
    injector: Injector;
}) => {
    const { injector } = props;
    const tableScrapingShadowComponent = useMemo(() => injector.get(TableScrapingShadowComponent), [injector]);
    const elementInspectService = useMemo(() => injector.get(ElementInspectService), [injector]);
    const clientViewService = useMemo(() => injector.get(ClientViewService), [injector]);

    const [viewState, setViewState] = useObservableValue<ViewState>(tableScrapingShadowComponent.viewState$);
    const selectableViewStates = useMemo(() => [ViewState.Selecting, ViewState.NoData], []);
    const [content, setContent] = useState('');
    const [tableLink] = useObservableValue(clientViewService.tableLink$);
    const iframeUrlRef = React.useRef<string | null>(null);
    const isShowIcon = shouldShowIcon(viewState);

    const [extractor] = useObservableValue(tableScrapingShadowComponent.extractor$);

    const [isGrandchild, setIsGrandchild] = useState(false);
    const [upperDisabled, setUpperDisabled] = useState(false);
    const [selectionRows, setSelectionRows] = useState(0);

    const [rowsCount] = useObservableValue(tableScrapingShadowComponent.rowsCount$);

    const panelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getContentHtml = () => {
            switch (viewState) {
                case ViewState.Selecting:
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
                case ViewState.ConfirmSelection: {
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
            if (selectableViewStates.includes(tableScrapingShadowComponent.viewState)) {
                setViewState(ViewState.PreviewSelection);
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

    useElementInspect(injector, (element) => {
        if (viewState === ViewState.ConfirmSelection) {
            return;
        }

        const isIframe = element instanceof HTMLIFrameElement;
        if (isIframe) {
            tableScrapingShadowComponent.highlightCover.attach(element);
            iframeUrlRef.current = element.src;
            setViewState(ViewState.NoIframe);
            return;
        }

        const rows = getElementAccurateExtractionRows(element);
        const resolvedElement = lookForParent(element, {
            until: (parent) => getElementAccurateExtractionRows(parent) > rows && isSameSize(element, parent),
        });

        tableScrapingShadowComponent.inspectElement(resolvedElement ?? element);
    }, [viewState]);

    const scrapSelectedTable = () => {
        tableScrapingShadowComponent.extractData(tableScrapingShadowComponent.getSheets());
    };

    const handleReselect = () => {
        tableScrapingShadowComponent.disposeExtractors();
        elementInspectService.shadowComponent.activate();
        setViewState(ViewState.Selecting);
    };

    const handleClose = () => {
        disposeAccurateExtraction(injector);
    };

    const handleUpper = () => {
        const result = tableScrapingShadowComponent.handleUpperFloor(isGrandchild);

        setUpperDisabled(!result);
    };

    const handlePreviewSelection = () => {
        setViewState(ViewState.ConfirmSelection);
        elementInspectService.shadowComponent.deactivate();
        extractor?.buildLazyLoadElements();
    };

    const handleCreateScraper = () => {
        const lazyElements = extractor?.lazyLoadElements;
        const _sheet = lazyElements?.getAllSheets()[0];

        if (!_sheet || !extractor?.target) {
            return;
        }

        const sheet = { ..._sheet, rows: _sheet.rows.slice(0, 10) };

        const rowCells = sheet.rows[0].cells;
        const columns: IScraperColumn[] = rowCells.map((cell, index) => {
            const name = sheet.columnName[index] ?? `${t('Column')} ${index + 1}`;

            return {
                id: generateRandomId(),
                name,
                index,
                type: cell.type,
                url: cell.url,
            };
        });

        const scraper: IScraper = {
            url: window.location.href ?? '',
            targetSelector: getDrillDownSelector(extractor.target) ?? '',
            columns,
            createAt: Date.now(),
            id: '',
            name: '',
            mode: AutoExtractionMode.None,
        };

        setCurrentScraper(scraper);

        chrome.runtime.sendMessage({
            type: ClipsheetMessageTypeEnum.OpenSidePanel,
        });

        tableScrapingShadowComponent.deactivate();
        // client view service trigger create scraper
        clientViewService.triggerCreateScraper(scraper, sheet);
    };

    const handleLowerLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checkedValue = e.target.checked;
        tableScrapingShadowComponent.highlightCover.detach();
        setIsGrandchild(checkedValue);
        const extractorTarget = extractor?.target;
        extractorTarget && tableScrapingShadowComponent.highlightCover.attach(extractorTarget);
    };

    return (
        <ReactDraggable axis="both" onStart={() => elementInspectService.shadowComponent.activate()} onStop={() => elementInspectService.shadowComponent.deactivate()}>
            <div className="cs-panel" ref={panelRef}>
                <div className="cs-panel-inner">
                    <div className="cs-panel-header" data-cs-draggable="true">
                        <div className="cs-panel-header-main">
                            <span className="cs-panel-title">{t('ConfirmSelection')}</span>
                        </div>
                        <CloseSingleDarkSvg className="cs-close-icon" onClick={handleClose} />
                    </div>

                    <div className={clsx({
                        'cs-panel-content': !isShowIcon,
                        'cs-message': isShowIcon,
                    })}
                    >
                        {isShowIcon && (
                            getIcon(viewState, clsx('status-icon', {
                                'cs-loading-icon': viewState === ViewState.Loading,
                                'cs-success-icon': viewState === ViewState.Success,
                                'cs-error-icon': viewState === ViewState.Error,
                            }))
                        ) }
                        {viewState === ViewState.PreviewSelection
                            ? (
                                <>
                                    <div style={{ color: '#474D57' }}>{t('SelectedElementDetectedMessage')}</div>
                                    <div style={{ marginTop: '4px' }}>{t('SelectedElementDetectedRows', { rows: String(selectionRows) })}</div>
                                </>
                            )
                            : (
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: content }}></div>
                                    {(viewState === ViewState.Success && tableLink) && <div className="cs-success-footer"><a className="cs-active-color cs-underline cs-cursor-pointer" target="_blank" href={tableLink}>{t('ViewScrapedTableData')}</a></div>}
                                </div>
                            )}
                    </div>
                    {viewState === ViewState.PreviewSelection && (
                        <>
                            <PreviewSelectionFooter upperDisabled={upperDisabled} onUpper={handleUpper} onConfirm={handlePreviewSelection} disabled={(extractor?.elementRows ?? 0) <= 0} />
                            <footer className="cs-extra-footer">
                                <input checked={isGrandchild} onChange={handleLowerLevel} className="cs-checkbox" id="cs-lower-level-checkbox" type="checkbox" />
                                <label className="cs-checkbox-label cs-cursor-pointer" htmlFor="cs-lower-level-checkbox">{t('CollectLowerLevelNodes')}</label>
                            </footer>
                        </>
                    )}
                    {viewState === ViewState.ConfirmSelection && (
                        <ScrapingFooter
                            onCreateScraper={handleCreateScraper}
                            onReselect={handleReselect}
                            onConfirm={() => {
                                captureEvent('clipsheet_accurate_extraction_confirm', {
                                    url: location.href,
                                });
                                scrapSelectedTable();
                            }}
                            disabled={rowsCount <= 0}
                        />
                    )}
                    {viewState === ViewState.Error && (
                        <ErrorFooter
                            onRetry={() => {
                                captureEvent('clipsheet_accurate_extraction_retry', {
                                    url: location.href,
                                });
                                scrapSelectedTable();
                            }}
                            onCancel={handleClose}
                        />
                    )}
                </div>
            </div>
        </ReactDraggable>
    );
};
