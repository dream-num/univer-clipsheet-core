import type {
    UIOpenTableScrapingDialogMessage,
    UIPopupShowedMessage } from '@univer-clipsheet-core/shared';
import {
    captureEvent,
    closePopup,
    getActiveTab,
    pingSignal,
    PingSignalKeyEnum,
    UIMessageTypeEnum,
} from '@univer-clipsheet-core/shared';

import type { IMessageRef } from '@components/message';
import { Message as MessageComponent } from '@components/message';
import { SearchInput } from '@components/SearchInput';

import '@views/popup/Popup.css';
import clsx from 'clsx';
import dayjs from 'dayjs';
import 'rc-tooltip/assets/bootstrap.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t } from '@univer-clipsheet-core/locale';
import {
    DataTabSvg,
    ScraperSvg,
    ToolsSvg,
    UniverLogoSvg,
    WorkflowSvg } from '@components/icons';

import { useThrottle } from '@lib/hooks';
import type { IPopupContext } from './context';
import { PopupContext, usePopupContext } from './context';

import type { ICollectDataFooterRef } from './views/collect-data-tab';
import { CollectDataFooter, CollectDataTable } from './views/collect-data-tab';

import { ScraperTable } from './views/scraper-tab';
import { ToolsTab } from './views/ToolsTab';
import { WorkflowFooter, WorkflowTable } from './views/workflow-tab';

enum TabKeys {
    Data = 'data',
    Scraper = 'scraper',
    Workflow = 'workflow',
    Tools = 'tools',
}

function Layout(props: {
    className?: string;
    title: string;
    headerSide: React.ReactNode;
    content: React.ReactNode;
    footer?: React.ReactNode;
}) {
    const {
        className,
        title,
        headerSide,
        content,
        footer } = props;

    return (
        <div className={clsx(className, 'h-[444px] flex flex-col')}>
            <div className="py-1 flex flex-col shadow rounded-xl bg-white grow">
                <header className="px-4 py-1.5 flex  justify-between items-center">
                    <div className="text-base text-[#0E111E]  font-semibold">{title}</div>
                    <div>{headerSide}</div>
                </header>
                <div style={{ scrollbarColor: '#73737366 transparent', scrollbarWidth: 'thin' }} className="grow px-1 overflow-auto">{content}</div>
            </div>
            {footer && (
                <footer className="mt-2">
                    {footer}
                </footer>
            )}
        </div>
    );
}

function formatTimeAgo(timestamp: number): string {
    const inputDate = dayjs(timestamp);
    const now = dayjs();
    const diffMonths = now.diff(inputDate, 'month');
    const diffYears = now.diff(inputDate, 'year');

    if (diffYears >= 1) {
        // 超过1年，显示完整日期时间
        return inputDate.format('YYYY-MM-DD HH:mm');
    } else if (diffMonths >= 1) {
        // 超过1个月，显示月日时间
        return inputDate.format('MM-DD HH:mm');
    } else {
        // 小于1个月，使用相对时间
        const diffDays = now.diff(inputDate, 'day');
        const diffHours = now.diff(inputDate, 'hour');
        const diffMinutes = now.diff(inputDate, 'minute');
        const diffSeconds = now.diff(inputDate, 'second');

        if (diffDays >= 1) {
            return `${diffDays}${t('daysAgo')}`;
        } else if (diffHours >= 1) {
            return `${diffHours}${t('hoursAgo')}`;
        } else if (diffMinutes >= 1) {
            return `${diffMinutes}${t('minutesAgo')}`;
        } else if (diffSeconds >= 5) {
            return `${diffSeconds}${t('secondsAgo')}`;
        } else {
            return `${t('justNow')}`;
        }
    }
}

export function Popup() {
    const messageRef = useRef<IMessageRef>(null);
    const [tabKey, setTabKey] = useState<TabKeys>(TabKeys.Scraper);

    useEffect(() => {
        const showPopupMessage: UIPopupShowedMessage = {
            type: UIMessageTypeEnum.PopupShowed,
        };
        // Notify popup is showing
        chrome.runtime.sendMessage(showPopupMessage);

        getActiveTab()
            .then((tab) => {
                const tabId = tab.id;
                if (tabId) {
                    chrome.tabs.sendMessage(tabId, showPopupMessage);
                    pingSignal(PingSignalKeyEnum.PopupShowed, tabId);
                }
            });

        window.addEventListener('contextmenu', (e) => {
            if (e.target instanceof HTMLDivElement) {
                e.preventDefault();
            }
        });
    }, []);

    const handleManuallySelect = useCallback(async () => {
        // if (!activeTab) {
        //     return;
        // }

        const activeTab = await getActiveTab();

        captureEvent('clipsheet_accurate_extraction_click', {
            url: activeTab.url,
        });
        const message: UIOpenTableScrapingDialogMessage = {
            type: UIMessageTypeEnum.OpenTableScrapingDialog,
            // payload: null,
        };

        chrome.tabs.sendMessage(activeTab.id!, message);
        closePopup();
    }, []);

    // useEffect(() => {
    //     const html = document.querySelector('html');
    //     if (html) {
    //         if (tabKey === TabKeys.ProSearch) {
    //             html.style.height = '600px';
    //         } else {
    //             const designHtmlHeight = contextConnected ? 544 : 568;
    //             const alertHeight = 32;

    //             html.style.height = `${alertVisible ? designHtmlHeight + alertHeight : designHtmlHeight}px`;
    //         }
    //     }
    // }, [alertVisible, contextConnected, tabKey]);

    // const [baseUrl] = useStorageValue(StorageKeys.BaseUrl, '');

    const [searchInput, setSearchInput] = useState('');
    const throttledSearchInput = useThrottle(searchInput, 400);

    const contextValue: IPopupContext = useMemo(() => {
        const showMessage: IMessageRef['showMessage'] = (option) => messageRef.current?.showMessage(option);
        return {
            t,
            // user,
            searchInput: throttledSearchInput,
            // alertVisible,
            // contextConnected,
            // activeTab,
            showMessage,
            // baseUrl,
            timeFormat: formatTimeAgo,
        };
    }, [throttledSearchInput]);

    const collectDataFooterRef = useRef<ICollectDataFooterRef>(null);

    const tabs = useMemo(() => {
        const scrapSelectedTable = () => collectDataFooterRef.current?.scrapSelectedTable();

        return [
            {
                id: TabKeys.Scraper,
                title: t('Scraper'),
                icon: <ScraperSvg />,
                component: <ScraperTable onEmptyClick={scrapSelectedTable} />,
            },
            {
                id: TabKeys.Data,
                title: t('Data'),
                icon: <DataTabSvg />,
                component: <CollectDataTable onEmptyClick={scrapSelectedTable} />,
            },
            {
                id: TabKeys.Workflow,
                title: t('Workflow'),
                icon: <WorkflowSvg />,
                component: <WorkflowTable />,
            },
            {
                id: TabKeys.Tools,
                title: t('Tools'),
                icon: <ToolsSvg />,
                component: <ToolsTab />,
            },
        ];
    }, []);

    const footerComponent = useMemo(() => {
        if ([TabKeys.Scraper, TabKeys.Data].includes(tabKey)) {
            return <CollectDataFooter onManuallySelectClick={handleManuallySelect} ref={collectDataFooterRef} />;
        }

        if (tabKey === TabKeys.Workflow) {
            return <WorkflowFooter />;
        }

        return null;
    }, [tabKey]);

    const currentTabItem = tabs.find((tab) => tab.id === tabKey);

    return (
        <div
            className="App"
        >
            <PopupContext.Provider value={contextValue}>
                <div className="flex p-3">
                    <aside className="flex-shrink-0 h-[444px] bg-white rounded-xl shadow px-2 pt-4 pb-3 flex flex-col justify-between items-center">
                        <div>
                            <UniverLogoSvg onClick={() => chrome.tabs.create({ url: 'https://univer.ai' })} />
                            <ul className="flex flex-col  gap-0.5">
                                {tabs.map((tab) => (
                                    <li
                                        className={clsx('flex flex-col items-center text-xs font-medium w-[64px] py-3 rounded-lg hover:bg-[#eeeff1] cursor-pointer', {
                                            'text-[#5F6574] ': tab.id !== tabKey,
                                            'text-[#0e111e] bg-[#eeeff1]': tab.id === tabKey,
                                        })}
                                        key={tab.id}
                                        onClick={() => {
                                            setSearchInput('');
                                            setTabKey(tab.id);
                                        }}
                                    >
                                        {tab.icon}
                                        <div>
                                            {tab.title}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* <UserProfile></UserProfile> */}
                    </aside>
                    <main className="grow ml-3">
                        <Layout
                            title={currentTabItem?.title ?? ''}
                            headerSide={<SearchInput placeholder={t('Search')} value={searchInput} onChange={(evt) => setSearchInput(evt.target.value)} />}
                            content={currentTabItem?.component}
                            footer={footerComponent}
                        />
                    </main>
                </div>
                <MessageComponent ref={messageRef} />
            </PopupContext.Provider>
        </div>
    );
}
