import React, { useCallback, useContext } from 'react';

// import type { ISheetTask, Message } from '@univer-clipsheet-core/shared';
import type {
    ClientScrapAllTablesMessage } from '@univer-clipsheet-core/shared';
import {
    captureEvent,
    ClientMessageTypeEnum,
    closePopup,
    getActiveTab,
    // joinUnitUrl,
    // MsgType,
    // StorageKeys,
    // TelemetryEvents,
    UIStorageKeyEnum,
} from '@univer-clipsheet-core/shared';
// import { useStorageValue } from '@univer-clipsheet-core/shared-client';
import { clsx } from 'clsx';
// import type { ITab } from '@src/components/TabList';
import { t } from '@univer-clipsheet-core/locale';
import { type ITableRecord, TableMessageTypeEnum } from '@univer-clipsheet-core/table';
import { useStorageValue } from '@lib/hooks';
import { CollectEntirePageSvg, LoadingSvg } from '@components/icons';
// import { PopupContext } from '../context';
// import { CollectEntirePageSvg, DrillDownGradientIcon, LoadingSvg, useTaskList } from '../components';
import { useTableRecords } from './hooks';

enum ToolsKey {
    // DrillDownSelectorCopy,
    CollectEntirePage,
}

export const ToolsTab = () => {
    // const {  baseUrl } = useContext(PopupContext);
    const [loading, setLoading] = useStorageValue<boolean>(UIStorageKeyEnum.Loading, false);
    const { state: taskList } = useTableRecords();
    // const { tasks: taskList } = useTaskList({ page: 1, pageSize: 1, recordTypes: [RecordType.WholeSheet] });
    const allSheetsTask = taskList[0] as ITableRecord;

    const collectSingleTab = useCallback(async (tab: chrome.tabs.Tab) => {
        const tabId = tab.id;
        if (!tabId) {
            return;
        }
        setLoading(true);
        // const time = Date.now();

        // const msg: Message[MsgType.RequestAllSheets] = {
        //     type: MsgType.RequestAllSheets,
        //     windowId: tab.windowId,
        //     tabId,
        //     time,
        // };
        chrome.tabs.sendMessage(tabId, {
            type: ClientMessageTypeEnum.ScrapAllTables,
            // payload: null,
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

    const recentlyFileClick = useCallback(() => {
        const task = taskList[0];
        if (task) {
            // chrome.tabs.create({ url: joinUnitUrl(baseUrl, task.data.unitId) });
        }
    }, [taskList]);

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
                {allSheetsTask && (
                    <li className="flex justify-center">
                        <div className="inline-flex items-center">
                            {loading && <LoadingSvg className="mr-[6px] text-[#0B9EFB] animate-spin" />}
                            <a
                                onClick={loading ? undefined : recentlyFileClick}
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
