import type { DropdownMenuItem } from '@components/DropdownMenu';
import { DropdownMenu } from '@components/DropdownMenu';
import { MoreButton } from '@components/MoreButton';
import { separateLineMenu } from '@components/PopupMenus';
import { Table } from '@components/table/Table';
import { TableLoading } from '@components/TableLoading';
import { RunButton } from '@components/buttons';
import { CaretDownSvg, TableEmptySvg } from '@components/icons';
import { useDataSource, useImmediateDataSource } from '@lib/hooks';
import type { Translator } from '@univer-clipsheet-core/locale';
import { t } from '@univer-clipsheet-core/locale';
import type { DeleteScraperMessage, IGetScraperListParams, IScraper, RunScraperFailedMessage, RunScraperMessage, StopScraperMessage } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, ScraperDataSourceKeyEnum, scraperIOHelper, ScraperMessageTypeEnum, ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import type {
    OpenSidePanelMessage,
    SetStorageMessage,
} from '@univer-clipsheet-core/shared';
import {
    ClipsheetMessageTypeEnum,
    closePopup,
    defaultPageSize,
    generateRandomId,
    getActiveTabId,
} from '@univer-clipsheet-core/shared';
import { createScraperSetting } from '@univer-clipsheet-core/workflow';
import { usePopupContext } from '@views/popup/context';
import type { TableProps } from 'rc-table';
import { useEffect, useMemo } from 'react';
import { openWorkflowDialog } from '@lib/helper';
import { saveAs } from 'file-saver';

const ScraperGearSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <g clipPath="url(#clip0_161_8781)">
                <path d="M5.40334 2.7388C6.22574 2.27617 7.17469 2.01247 8.18592 2.01247C9.46622 2.01247 10.6463 2.43509 11.5963 3.14867C11.8318 3.32557 12.1661 3.27805 12.343 3.04254C12.5199 2.80702 12.4724 2.4727 12.2369 2.29579C11.1085 1.44824 9.70512 0.945801 8.18592 0.945801C6.92307 0.945801 5.74052 1.29293 4.72938 1.8967C4.67449 1.69883 4.50724 1.54212 4.29096 1.5111C3.99939 1.46929 3.72913 1.67175 3.68731 1.96332L3.57384 2.75456C3.52158 3.11902 3.77466 3.45684 4.13912 3.50911L4.93035 3.62258C5.22192 3.6644 5.49218 3.46193 5.534 3.17036C5.55729 3.00797 5.5048 2.85218 5.40334 2.7388Z" fill="url(#paint0_linear_161_8781)" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12.1475 6.96281H11.755L11.3884 6.07769L11.6658 5.79977C11.763 5.70253 11.8176 5.57067 11.8176 5.43318C11.8176 5.29568 11.763 5.16382 11.6658 5.06658L10.9326 4.3334C10.8354 4.23619 10.7035 4.18158 10.566 4.18158C10.4285 4.18158 10.2967 4.23619 10.1994 4.3334L9.9215 4.61081L9.03639 4.24421V3.85169C9.03639 3.71417 8.98176 3.58229 8.88452 3.48505C8.78728 3.3878 8.65539 3.33318 8.51787 3.33318H7.48084C7.34332 3.33318 7.21143 3.3878 7.11419 3.48505C7.01695 3.58229 6.96232 3.71417 6.96232 3.85169V4.24421L6.07721 4.61081L5.79928 4.3334C5.70204 4.23619 5.57018 4.18158 5.43269 4.18158C5.29519 4.18158 5.16333 4.23619 5.06609 4.3334L4.33291 5.06658C4.2357 5.16382 4.18109 5.29568 4.18109 5.43318C4.18109 5.57067 4.2357 5.70253 4.33291 5.79977L4.61084 6.07769L4.24372 6.96281H3.85121C3.71369 6.96281 3.5818 7.01743 3.48456 7.11468C3.38732 7.21192 3.33269 7.3438 3.33269 7.48132V8.51836C3.33269 8.65588 3.38732 8.78777 3.48456 8.88501C3.5818 8.98225 3.71369 9.03688 3.85121 9.03688H4.24372L4.38006 9.36574C4.44845 9.5306 4.49386 9.64008 4.61032 9.92199L4.33291 10.1999C4.2357 10.2972 4.18109 10.429 4.18109 10.5665C4.18109 10.704 4.2357 10.8359 4.33291 10.9331L5.06609 11.6663C5.16333 11.7635 5.29519 11.8181 5.43269 11.8181C5.57018 11.8181 5.70204 11.7635 5.79928 11.6663L6.07721 11.3889L6.96232 11.7555V12.148C6.96232 12.2855 7.01695 12.4174 7.11419 12.5146C7.21143 12.6119 7.34332 12.6665 7.48084 12.6665H8.51787C8.65539 12.6665 8.78728 12.6119 8.88452 12.5146C8.98176 12.4174 9.03639 12.2855 9.03639 12.148V11.7555L9.9215 11.3884L10.1994 11.6663C10.2967 11.7635 10.4285 11.8181 10.566 11.8181C10.7035 11.8181 10.8354 11.7635 10.9326 11.6663L11.6658 10.9331C11.763 10.8359 11.8176 10.704 11.8176 10.5665C11.8176 10.429 11.763 10.2972 11.6658 10.1999L11.3884 9.92199L11.755 9.03688H12.1475C12.285 9.03688 12.4169 8.98225 12.5141 8.88501C12.6114 8.78777 12.666 8.65588 12.666 8.51836V7.48132C12.666 7.3438 12.6114 7.21192 12.5141 7.11468C12.4169 7.01743 12.285 6.96281 12.1475 6.96281ZM7.99935 10.0739C7.58914 10.0739 7.18814 9.95227 6.84706 9.72437C6.50598 9.49647 6.24014 9.17254 6.08316 8.79356C5.92618 8.41457 5.8851 7.99754 5.96513 7.59521C6.04516 7.19288 6.2427 6.82331 6.53276 6.53325C6.82283 6.24319 7.19239 6.04565 7.59472 5.96562C7.99705 5.88559 8.41408 5.92667 8.79307 6.08365C9.17206 6.24063 9.49598 6.50647 9.72388 6.84755C9.95179 7.18863 10.0734 7.58963 10.0734 7.99984C10.0734 8.54992 9.85491 9.07747 9.46595 9.46643C9.07698 9.8554 8.54943 10.0739 7.99935 10.0739Z" fill="url(#paint1_linear_161_8781)" />
                <path d="M10.5954 13.2609C9.77297 13.7235 8.82402 13.9872 7.81279 13.9872C6.53249 13.9872 5.35244 13.5646 4.40244 12.851C4.16692 12.6741 3.8326 12.7216 3.65569 12.9571C3.47879 13.1927 3.52631 13.527 3.76182 13.7039C4.8902 14.5514 6.29358 15.0539 7.81279 15.0539C9.07564 15.0539 10.2582 14.7067 11.2693 14.103C11.3242 14.3009 11.4915 14.4576 11.7077 14.4886C11.9993 14.5304 12.2696 14.3279 12.3114 14.0364L12.4249 13.2451C12.4771 12.8807 12.224 12.5428 11.8596 12.4906L11.0684 12.3771C10.7768 12.3353 10.5065 12.5378 10.4647 12.8293C10.4414 12.9917 10.4939 13.1475 10.5954 13.2609Z" fill="url(#paint2_linear_161_8781)" />
                <path d="M13.2604 5.40383C13.723 6.22623 13.9867 7.17518 13.9867 8.18641C13.9867 9.46671 13.5641 10.6468 12.8505 11.5968C12.6736 11.8323 12.7211 12.1666 12.9567 12.3435C13.1922 12.5204 13.5265 12.4729 13.7034 12.2374C14.551 11.109 15.0534 9.70561 15.0534 8.18641C15.0534 6.92356 14.7063 5.74101 14.1025 4.72986C14.3004 4.67497 14.4571 4.50772 14.4881 4.29145C14.5299 3.99988 14.3274 3.72962 14.0359 3.6878L13.2446 3.57433C12.8802 3.52206 12.5424 3.77515 12.4901 4.13961L12.3766 4.93084C12.3348 5.22241 12.5373 5.49267 12.8288 5.53449C12.9912 5.55778 13.147 5.50528 13.2604 5.40383Z" fill="url(#paint3_linear_161_8781)" />
                <path d="M2.73831 10.5959C2.27568 9.77345 2.01198 8.82451 2.01198 7.81327C2.01198 6.53298 2.43461 5.35293 3.14818 4.40293C3.32508 4.16741 3.27756 3.83308 3.04205 3.65618C2.80654 3.47928 2.47221 3.5268 2.29531 3.76231C1.44775 4.89068 0.945312 6.29407 0.945312 7.81327C0.945312 9.07613 1.29245 10.2587 1.89621 11.2698C1.69834 11.3247 1.54163 11.492 1.51061 11.7082C1.4688 11.9998 1.67126 12.2701 1.96283 12.3119L2.75407 12.4254C3.11853 12.4776 3.45635 12.2245 3.50862 11.8601L3.62209 11.0688C3.66391 10.7773 3.46144 10.507 3.16987 10.4652C3.00748 10.4419 2.8517 10.4944 2.73831 10.5959Z" fill="url(#paint4_linear_161_8781)" />
            </g>
            <defs>
                <linearGradient id="paint0_linear_161_8781" x1="0.945312" y1="7.99984" x2="15.6758" y2="7.99984" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint1_linear_161_8781" x1="0.945312" y1="7.99984" x2="15.6758" y2="7.99984" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint2_linear_161_8781" x1="0.945312" y1="7.99984" x2="15.6758" y2="7.99984" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint3_linear_161_8781" x1="0.945312" y1="7.99984" x2="15.6758" y2="7.99984" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint4_linear_161_8781" x1="0.945312" y1="7.99984" x2="15.6758" y2="7.99984" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <clipPath id="clip0_161_8781">
                    <rect width="16" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const ScraperTableEmpty = (props: {
    t: Translator;
    onClick?: () => void;
}) => {
    const { t, onClick } = props;
    return (
        <div className="h-full flex justify-center items-center">
            <div>
                <TableEmptySvg />
                <div className="text-sm font-medium mt-2">
                    <span>{t('ScraperEmptyText')}</span>
                    <button onClick={onClick} type="button" className="text-[#2C53F1] cursor-pointer">{t('ScraperEmptyAction')}</button>
                </div>
            </div>
        </div>
    );
};

enum EditMenuKey {
    Edit = 'edit',
    Schedule = 'schedule',
    Delete = 'delete',
    Export = 'export',
}

enum RunMenu {
    Stop = 'stop',
    Save = 'save',
}

export interface IScraperTableProps {
    onEmptyClick: () => void;
}

export const ScraperTable = (props: IScraperTableProps) => {
    const { onEmptyClick } = props;

    const { showMessage, searchInput } = usePopupContext();

    const { state: runningScraperIds = [] } = useImmediateDataSource<string[]>(ScraperDataSourceKeyEnum.RunningScraperIds);

    const { state: innerData = [], getState: getInnerData, loading } = useDataSource<IScraper[], IGetScraperListParams>(ScraperDataSourceKeyEnum.ScraperList);

    useEffect(() => {
        getInnerData({
            pageSize: defaultPageSize,
        });
    }, []);

    useEffect(() => {
        const listener = (msg: RunScraperFailedMessage) => {
            if (msg.type === ScraperMessageTypeEnum.RunScraperFailed) {
                showMessage?.({
                    type: 'error',
                    text: t('ScraperRunFailedNotification', { name: msg.payload.name }),
                });
            }
        };

        chrome.runtime.onMessage.addListener(listener);

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, [showMessage]);

    const data = useMemo(() => {
        if (!searchInput) {
            return innerData;
        }

        const lowerSearchInput = searchInput.toLowerCase();
        return innerData.filter((scraper) => scraper.name.toLowerCase().includes(lowerSearchInput));
    }, [innerData, searchInput]);

    const columns: TableProps['columns'] = [
        { title: <div className="pl-4">{t('Name')}</div>, width: 373, render: (value, record: IScraper) => {
            return (
                <div className="py-3 pl-4">
                    <div className="text-[#0E111E]">
                        <span>{record.name}</span>
                    </div>
                    <div className="mt-2 flex gap-2 items-center">
                        <button type="button" className="hover:underline" onClick={() => chrome.tabs.create({ url: record.url })}>{t('OriginalLink')}</button>
                        <span>
                            {record.columns?.length}
                            {' '}
                            {t('Columns')}
                        </span>
                        {record.mode !== AutoExtractionMode.None && (
                            <ScraperGearSvg />
                        )}
                    </div>
                </div>
            );
        } },
        { title: <div className="text-center">{t('Run')}</div>, width: 110, render: (value, record: IScraper) => {
            const isRunning = runningScraperIds.includes(record.id);
            const menus: DropdownMenuItem[] = [
                {
                    text: t('Stop'),
                    key: RunMenu.Stop,
                },
                {
                    text: t('Save'),
                    key: RunMenu.Save,
                },
            ];

            return (
                <div className="text-center">
                    <DropdownMenu
                        disabled={!isRunning}
                        menus={menus}
                        trigger="hover"
                        onChange={(key) => {
                            const msg: StopScraperMessage = {
                                type: ScraperMessageTypeEnum.StopScraper,
                                payload: {
                                    id: record.id,
                                    toSave: key === RunMenu.Save,
                                },
                            };
                            chrome.runtime.sendMessage(msg);
                        }}
                    >
                        <div>
                            <RunButton
                                running={isRunning}
                                onStart={() => {
                                    const msg: RunScraperMessage = {
                                        type: ScraperMessageTypeEnum.RunScraper,
                                        payload: record,
                                    };
                                    chrome.runtime.sendMessage(msg);
                                }}
                                stopText={(
                                    <div className="inline-flex items-center">
                                        <span>{t('Scraping')}</span>
                                        <CaretDownSvg className="ml-1" />
                                    </div>
                                )}
                            />
                        </div>
                    </DropdownMenu>

                </div>
            );
        } },
        { title: <div className="text-center">{t('More')}</div>, width: 68, render: (value, record: IScraper, index) => {
            const menus: DropdownMenuItem[] = [
                {
                    text: t('Edit'),
                    key: EditMenuKey.Edit,
                },
                {
                    text: t('Export'),
                    key: EditMenuKey.Export,
                },
                {
                    text: t('ScheduleTheWorkflow'),
                    key: EditMenuKey.Schedule,
                },
                separateLineMenu,
                {
                    text: <span className="text-[#F05252]">{t('Delete')}</span>,
                    key: EditMenuKey.Delete,
                },
            ].filter(Boolean) as DropdownMenuItem[];

            return (
                <div className="text-center">
                    <DropdownMenu
                        placement="bottomRight"
                        menus={menus}
                        onChange={async (key) => {
                            if (key === EditMenuKey.Delete) {
                                const msg: DeleteScraperMessage = {
                                    type: ScraperMessageTypeEnum.DeleteScraper,
                                    payload: record.id,
                                };
                                chrome.runtime.sendMessage(msg);
                            }

                            if (key === EditMenuKey.Export) {
                                const jsonBlob = new Blob([scraperIOHelper.toJSON(record)], { type: 'application/json' });

                                saveAs(jsonBlob, `scraper_${record.name}.json`);
                            }

                            if (key === EditMenuKey.Edit) {
                                const tabId = await getActiveTabId();
                                if (!tabId) {
                                    return;
                                }
                                const msg1: SetStorageMessage = {
                                    type: ClipsheetMessageTypeEnum.SetStorage,
                                    payload: {
                                        key: ScraperStorageKeyEnum.CurrentScraper,
                                        value: record,
                                    },
                                };

                                const msg2: OpenSidePanelMessage = {
                                    type: ClipsheetMessageTypeEnum.OpenSidePanel,
                                    payload: tabId,
                                };

                                chrome.runtime.sendMessage(msg1);
                                chrome.runtime.sendMessage(msg2);

                                closePopup();
                            }

                            if (key === EditMenuKey.Schedule) {
                                openWorkflowDialog({
                                    scraperSettings: [createScraperSetting(record)],
                                    columns: record.columns.map((column) => ({
                                        id: generateRandomId(),
                                        name: column.name,
                                        type: column.type,
                                        sourceColumns: [{
                                            scraperId: record.id,
                                            columnId: column.id,
                                        }],
                                    })),
                                });
                            }
                        }}
                    >
                        <MoreButton />
                    </DropdownMenu>
                </div>
            );
        } },
    ];

    if (loading) {
        return (
            <TableLoading text={t('Scraper')} />
        );
    }

    if (data.length <= 0) {
        return <ScraperTableEmpty t={t} onClick={onEmptyClick} />;
    }

    return <Table scroll={{ y: 300 }} data={data} rowKey="id" columns={columns} />;
};
