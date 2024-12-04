import { ArrowGradientSvg, ClickPointSvg } from '@components/icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { DropdownMenu } from '@components/DropdownMenu';
import { closePopup, getActiveTab, promisifyMessage, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { DropdownMenuItem } from '@components/DropdownMenu';
import type { HighlightDetectedTableMessage, IDetectedTableOption, PushDetectTablesMessage, RequestDetectTablesMessage, ScrapDetectedTableMessage } from '@client/index';
import { DetectTablesMessageTypeEnum } from '@client/index';
import { useDebounceCallback, useStorageValue } from 'lib/hooks';
import { t } from '@univer-clipsheet-core/locale';

function useDetectedTableList() {
    const [tableList, setTableList] = useState<IDetectedTableOption[]>([]);

    useEffect(() => {
        getActiveTab().then(async (tab) => {
            const tabId = tab?.id;
            if (!tabId) {
                return;
            }
            const request: RequestDetectTablesMessage = {
                type: DetectTablesMessageTypeEnum.RequestDetectTables,
            };
            chrome.tabs.sendMessage(tabId, request);
            promisifyMessage<PushDetectTablesMessage>((msg) => msg.type === DetectTablesMessageTypeEnum.PushDetectTables)
                .then((msg) => {
                    setTableList(msg.payload);
                });
        });
    }, []);

    return tableList;
}

export interface ICollectDataFooterProps {
    className?: string;
    onManuallySelectClick?: () => void;
}

function sendHighlightTableMessage(tabId: number, payload: HighlightDetectedTableMessage['payload']) {
    const message: HighlightDetectedTableMessage = {
        type: DetectTablesMessageTypeEnum.HighlightDetectedTable,
        payload,
    };
    chrome.tabs.sendMessage(tabId, message);
}

export interface ICollectDataFooterRef {
    scrapSelectedTable: () => void;
}

const InnerCollectDataFooter = forwardRef<ICollectDataFooterRef, ICollectDataFooterProps>((props, ref) => {
    const { className, onManuallySelectClick } = props;

    const [selectOptionsVisible, setSelectOptionsVisible] = useState(false);
    const [loading] = useStorageValue<boolean>(UIStorageKeyEnum.Loading, false);

    const detectedTableList = useDetectedTableList();

    const tableOptions = useMemo(() => detectedTableList.map((table, index) => ({ text: `${t('Table')} ${index + 1} ${t('Rows')}: ${table.rows}`, key: table.id })), [detectedTableList]);
    const [selectedTableId, setSelectedTableId] = useState<string>('');
    const selectedTableIndex = useMemo(() => detectedTableList.findIndex((table) => table.id === selectedTableId), [detectedTableList, selectedTableId]);
    const selectedTable = detectedTableList[selectedTableIndex];
    const scrapButtonDisabled = !selectedTableId;
    const tableSelectButtonDisabled = detectedTableList.length === 0;

    const onOptionHover = useDebounceCallback(async (option: DropdownMenuItem) => {
        const activeTab = await getActiveTab();
        const tabId = activeTab?.id;

        tabId && sendHighlightTableMessage(tabId, {
            id: option.key,
            scrollTo: true,
        });
    }, 800);

    const onSelectVisibleChange = useCallback((visible: boolean) => {
        if (visible === false) {
            setSelectOptionsVisible(false);
        }
    }, []);

    const onScrapingClick = useCallback(async () => {
        const activeTab = await getActiveTab();
        const tabId = activeTab?.id;
        if (tabId) {
            const message: ScrapDetectedTableMessage = {
                type: DetectTablesMessageTypeEnum.ScrapDetectedTable,
                payload: selectedTableId,
            };
            chrome.tabs.sendMessage(tabId, message);
            closePopup();
        }
    }, [selectedTableId]);

    useImperativeHandle(ref, () => ({
        scrapSelectedTable: onScrapingClick,
    }), [onScrapingClick]);

    useEffect(() => {
        const firstTableId = tableOptions[0]?.key;
        if (firstTableId) {
            setSelectedTableId(firstTableId);
        }
    }, [tableOptions]);

    useEffect(() => {
        let tabId: number | undefined;
        getActiveTab().then(async (activeTab) => {
            tabId = activeTab?.id;

            if (selectedTableId) {
                tabId && sendHighlightTableMessage(tabId, {
                    id: selectedTableId,
                    scrollTo: true,
                });
            }
        });

        return () => {
            tabId && sendHighlightTableMessage(tabId, {
                id: '',
                scrollTo: false,
            });
        };
    }, [selectedTableId]);

    useEffect(() => {
        if (!selectOptionsVisible) {
            getActiveTab().then(async (activeTab) => {
                const tabId = activeTab?.id;

                tabId && sendHighlightTableMessage(tabId, {
                    id: selectedTableId,
                    scrollTo: false,
                });
            });
        }
    }, [selectOptionsVisible]);

    const scrapButtonRef = useRef<HTMLDivElement>(null);

    return (
        <footer className={className}>
            <div className="flex items-center justify-between">
                <div className="text-left text-sm">
                    <span className="text-[#474D57]">
                        {t('RowsScraped')}
                        :
                        {' '}
                    </span>
                    <span className="text-[#274FEE] font-medium">{selectedTable?.rows ?? 0}</span>
                </div>
                <div className="flex items-center">
                    <DropdownMenu
                        width={scrapButtonRef?.current?.clientWidth}
                        visible={selectOptionsVisible}
                        menus={tableOptions}
                        onChange={(id) => {
                            setSelectedTableId(id);
                            setSelectOptionsVisible(false);
                        }}
                        onMouseLeave={() => onOptionHover.cancel()}
                        onOptionHover={onOptionHover}
                        onVisibleChange={onSelectVisibleChange}
                        disabled={tableSelectButtonDisabled}
                    >
                        <div
                            ref={scrapButtonRef}
                            onClick={(loading || scrapButtonDisabled) ? undefined : onScrapingClick}
                            className={clsx('grow inline-flex items-center justify-between p-1 rounded-[32px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] cursor-pointer', {
                                'bg-none bg-[rgba(15,23,42,0.20)]': scrapButtonDisabled,
                                'cursor-default': loading || scrapButtonDisabled,
                            })}
                        >
                            <button
                                className={clsx('mx-[11px] font-medium text-sm leading-6 text-white text-nowrap', {
                                    'cursor-default': loading || scrapButtonDisabled,
                                })}
                            >
                                {!scrapButtonDisabled && loading
                                    ? t('Scaping')
                                    : t('QuickScraping')}
                            </button>
                            <button
                                onClickCapture={(evt) => {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    setSelectOptionsVisible(!selectOptionsVisible);
                                }}
                                className={clsx('outline-none box-content h-4 w-[80px] inline-flex justify-center items-center rounded-[32px] bg-white px-1 py-1 font-medium text-xs leading-4 text-nowrap', {
                                    'cursor-default': tableSelectButtonDisabled,
                                })}
                            >
                                <span className={clsx({
                                    'text-transparent bg-clip-text bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)]': !tableSelectButtonDisabled,
                                    'text-[rgba(15,23,42,0.20)]': tableSelectButtonDisabled,
                                })}
                                >
                                    {selectedTable ? `${t('Table')} ${selectedTableIndex + 1}` : t('NotFound')}
                                </span>
                                {!tableSelectButtonDisabled && (
                                    <ArrowGradientSvg className={clsx('w-5 h-5 transition-transform', {
                                        'rotate-180': selectOptionsVisible,
                                    })}
                                    />
                                )}

                            </button>
                        </div>
                    </DropdownMenu>
                    <button onClick={onManuallySelectClick} className="h-8 hover:bg-[rgba(15,23,42,0.05)]  active:bg-[rgba(15,23,42,0.08)] ml-3 inline-flex items-center bg-white rounded-[32px] px-2 text-xs leading-8 text-[#0F172A] border border-solid border-[#E6E8EB] text-nowrap ">
                        <ClickPointSvg className="w-4 h-4 mr-[6px]" />
                        <span>{t('ManualScraping')}</span>
                    </button>
                </div>
            </div>
        </footer>
    );
});

export const CollectDataFooter = React.memo(InnerCollectDataFooter);
