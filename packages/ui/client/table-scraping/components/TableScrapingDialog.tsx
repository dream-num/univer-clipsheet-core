import { ClientViewService } from '@client/client-view.service';
import { useElementInspect } from '@client/components/hooks';
import { ElementInspectService } from '@client/element-inspect';
import { IframeViewController } from '@client/iframe-view';
import { RemountObserver } from '@client/remount-observer';
import { isSameSize, lookForParent } from '@client/tools';
import { CloseSingleDarkSvg, ErrorSingleSvg, EyelashSvg, EyeSvg, LoadingSvg, SuccessSingleSvg } from '@components/icons';
import { openPreviewTablePanel } from '@lib/helper';
import { useObservableValue, useStorageValue } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import type { IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, setCurrentScraper } from '@univer-clipsheet-core/scraper';
import { captureEvent, ClipsheetMessageTypeEnum, generateRandomId, IframeViewTypeEnum, sendSetIframeViewMessage, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { IPreviewSheetStorageValue } from '@univer-clipsheet-core/table';
import { getDrillDownSelector, getElementAccurateExtractionRows, PreviewSheetFromEnum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import type { Injector } from '@wendellhu/redi';
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDraggable from 'react-draggable';
import { TableScrapingShadowComponent, ViewState } from '../table-scraping-shadow-component';

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

const TextButton = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    const { className, ...restProps } = props;
    return <button {...restProps} className={clsx('btn cs-text-btn', className)} />;
};

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
                <TextButton onClick={onReselect}>{t('Reselect')}</TextButton>
            </div>
            <div className="cs-flex cs-items-center">
                <button
                    className={clsx('btn cs-default-btn cs-inline-flex cs-items-center', {
                        'btn--disabled': disabled,
                    })}
                    disabled={disabled}
                    onClick={onCreateScraper}
                >
                    <span>{t('CreateScraper')}</span>
                </button>
                <button
                    className={clsx('btn cs-feature-btn', {
                        'btn--disabled': disabled,
                    })}
                    id="confirm-btn"
                    onClick={onConfirm}
                    disabled={disabled}
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
    const iframeViewController = useMemo(() => injector.get(IframeViewController), [injector]);

    const [viewState, setViewState] = useObservableValue<ViewState>(tableScrapingShadowComponent.viewState$);
    const selectableViewStates = useMemo(() => [ViewState.Selecting, ViewState.NoData], []);
    const [content, setContent] = useState('');
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
        const disposes = [
            tableScrapingShadowComponent.active$.subscribe((active) => {
                if (!active && iframeViewController.view === IframeViewTypeEnum.PreviewTablePanel) {
                    sendSetIframeViewMessage(IframeViewTypeEnum.None);
                }
            }),
            tableScrapingShadowComponent.viewState$.subscribe((state) => {
                if (state !== ViewState.ConfirmSelection && iframeViewController.view === IframeViewTypeEnum.PreviewTablePanel) {
                    sendSetIframeViewMessage(IframeViewTypeEnum.None);
                }
            }),
        ];

        return () => {
            disposes.forEach((dispose) => dispose());
        };
    }, [tableScrapingShadowComponent]);

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
            until: (parent) => {
                const currentRows = getElementAccurateExtractionRows(parent);

                return currentRows > rows && isSameSize(element, parent);
            },
        });

        const inspectedElement = resolvedElement ?? element;

        tableScrapingShadowComponent.inspectElement(inspectedElement);
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

    const [previewSheet, setPreviewSheet] = useStorageValue<IPreviewSheetStorageValue | null>(TableStorageKeyEnum.PreviewSheet, null);

    const previewing = iframeViewController.view === IframeViewTypeEnum.PreviewTablePanel && previewSheet?.from === PreviewSheetFromEnum.TableScrapingDialog;

    const handlePreviewTable = () => {
        if (previewing) {
            sendSetIframeViewMessage(IframeViewTypeEnum.None);
            setPreviewSheet(null);
        } else {
            const sheet = tableScrapingShadowComponent.getSheets()[0];

            if (sheet) {
                openPreviewTablePanel(sheet, PreviewSheetFromEnum.TableScrapingDialog);
            }
        }
    };

    const footer = (() => {
        switch (viewState) {
            case ViewState.PreviewSelection: {
                return (
                    <>
                        <PreviewSelectionFooter upperDisabled={upperDisabled} onUpper={handleUpper} onConfirm={handlePreviewSelection} disabled={(extractor?.elementRows ?? 0) <= 0} />
                        <footer className="cs-extra-footer">
                            <input checked={isGrandchild} onChange={handleLowerLevel} className="cs-checkbox" id="cs-lower-level-checkbox" type="checkbox" />
                            <label className="cs-checkbox-label cs-cursor-pointer" htmlFor="cs-lower-level-checkbox">{t('CollectLowerLevelNodes')}</label>
                        </footer>
                    </>
                );
            }
            case ViewState.ConfirmSelection: {
                return (
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
                );
            }
            case ViewState.Error : {
                return (
                    <ErrorFooter
                        onRetry={() => {
                            captureEvent('clipsheet_accurate_extraction_retry', {
                                url: location.href,
                            });
                            scrapSelectedTable();
                        }}
                        onCancel={handleClose}
                    />
                );
            }
            default: {
                return null;
            }
        }
    })();

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

                                    <div>
                                        <span dangerouslySetInnerHTML={{ __html: content }}></span>
                                        {viewState === ViewState.ConfirmSelection
                                        && (
                                            <TextButton className="cs-inline-flex cs-items-center" onClick={handlePreviewTable}>
                                                {previewing ? <EyelashSvg /> : <EyeSvg />}
                                                <span className="cs-ml-0.5">
                                                    {t(previewing ? 'HideView' : 'ViewTable')}
                                                </span>
                                            </TextButton>
                                        )}
                                    </div>
                                    {(viewState === ViewState.Success) && <div className="cs-success-footer"><span className="cs-active-color cs-underline cs-cursor-pointer" onClick={clientViewService.triggerViewScrapedDataClick}>{t('ViewScrapedTableData')}</span></div>}
                                </div>
                            )}
                    </div>
                    {footer}
                </div>
            </div>
        </ReactDraggable>
    );
};
