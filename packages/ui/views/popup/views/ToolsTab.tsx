import { useCallback, useEffect } from 'react';

import {
    captureEvent,
    ClientMessageTypeEnum,
    getActiveTab,
    UIStorageKeyEnum,
} from '@univer-clipsheet-core/shared';

import { CollectEntirePageSvg, LoadingSvg } from '@components/icons';
import { useStorageValue } from '@lib/hooks';
import { t } from '@univer-clipsheet-core/locale';
import { type ITableRecord, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { clsx } from 'clsx';
import { usePopupContext } from '../context';
import { useTableRecords } from './hooks';

enum ToolsKey {
    CollectEntirePage,
}

export const ToolsTab = () => {
    const { service } = usePopupContext();
    const [loading, setLoading] = useStorageValue<boolean>(UIStorageKeyEnum.Loading, false);

    const { state: taskList, getState } = useTableRecords();
    useEffect(() => {
        getState({
            page: 1,
            pageSize: 1,
            recordTypes: [TableRecordTypeEnum.WholeSheet],
        });
    }, []);

    const tableRecord = taskList[0] as ITableRecord;

    const collectSingleTab = useCallback(async (tab: chrome.tabs.Tab) => {
        const tabId = tab.id;
        if (!tabId) {
            return;
        }
        setLoading(true);

        chrome.tabs.sendMessage(tabId, {
            type: ClientMessageTypeEnum.ScrapAllTables,
        });
    }, []);

    const handleClick = useCallback(async (key: ToolsKey) => {
        const activeTab = await getActiveTab();
        switch (key) {
            // case ToolsKey.DrillDownSelectorCopy: {
            //     if (!activeTab?.id) {
            //         return;
            //     }
            //     captureEvent('clipsheet_copy_selector_click', {
            //         url: activeTab.url,
            //     });
            //     chrome.tabs.sendMessage(activeTab.id, {
            //         type: MsgType.StartCopyElementSelector,
            //     });
            //     closePopup();
            //     break;
            // }
            case ToolsKey.CollectEntirePage: {
                if (loading) {
                    return;
                }
                captureEvent('clipsheet_extract_page_click', {
                    url: activeTab?.url,
                });
                collectSingleTab(activeTab!);
                break;
            }
        }
    }, [taskList, loading]);

    return (
        <div className="text-sm py-4  rounded-xl  p-4">
            <ul className="flex flex-col gap-4">
                {/* <li onClick={() => handleClick(ToolsKey.DrillDownSelectorCopy)} className="cursor-pointer rounded-lg border border-solid border-[#E6E8EB] flex items-center p-[14px] pr-[30px] hover:bg-[rgba(46,106,248,0.06)] active:bg-[rgba(46,106,248,0.12)]">
                    <div className="mr-2">
                        <DrillDownGradientIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <div className="text-[#0F172A]">{t('CopyWebElementSelector')}</div>
                        <div className="text-[#878F9B] text-xs">{t('CopyWebElementSelectorSubText')}</div>
                    </div>
                </li> */}
                <li
                    onClick={() => handleClick(ToolsKey.CollectEntirePage)}
                    className={clsx('rounded-lg border border-solid border-[#E6E8EB] flex items-center p-[14px] pr-[30px]', {
                        'cursor-pointer hover:bg-[rgba(46,106,248,0.06)] active:bg-[rgba(46,106,248,0.12)]': !loading,
                    })}
                >
                    <div className="mr-2">
                        <CollectEntirePageSvg className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <div className="text-[#0F172A]">{t('CollectEntireWebPage')}</div>
                        <div className="text-[#878F9B] text-xs">{t('CollectEntireWebPageSubText')}</div>
                    </div>
                </li>
                {tableRecord && (
                    <li className="flex justify-center">
                        <div className="inline-flex items-center">
                            {loading && <LoadingSvg className="mr-[6px] text-[#0B9EFB] animate-spin" />}
                            <a
                                onClick={loading ? undefined : () => service?.triggerTableRecordClick(tableRecord)}
                                className={clsx('text-[#274FEE] underline', {
                                    'cursor-pointer': !loading,
                                })}
                            >
                                {t('RecentlyFile')}
                            </a>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
};
