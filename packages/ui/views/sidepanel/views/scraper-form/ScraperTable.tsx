import React, { useCallback, useMemo } from 'react';
// import type { AutoExtractionFormTab } from '@chrome-extension-boilerplate/shared-client';
import type { TableProps } from 'rc-table';
import Table from 'rc-table';
import './index.css';

// import type { IDrillDownColumn, IDrillDownConfig, IScraperColumn } from '@chrome-extension-boilerplate/shared';
// import { getActiveTab, MsgType, ScraperColumnType, StorageKeys } from '@chrome-extension-boilerplate/shared';
// import type { IPopupMenu } from '@chrome-extension-boilerplate/shared-client';
// import {
//     CollapseIconSvg,
//     ColumnTypeTag,
//     DropdownMenu,
//     ExpandIconSvg,
//     LoadingMask,
//     MoreButton,
    // TableEmpty } from '@chrome-extension-boilerplate/shared-client';
import clsx from 'clsx';
// import { Select } from '@src/components/select';
// import { t } from '../../locale';
import { CollapseIconSvg, ExpandIconSvg } from '@components/icons';
import type { IDrillDownColumn, IDrillDownConfig, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { getActiveTab } from '@univer-clipsheet-core/shared';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import type { IPopupMenu } from '@components/PopupMenus';
import { DropdownMenu } from '@components/DropdownMenu';
import { MoreButton } from '@components/MoreButton';
import { LoadingMask } from '@components/LoadingMask';
import { TableEmpty } from '@components/TableEmpty';
import { t } from '@univer-clipsheet-core/locale';
import { SidePanelViewEnum, useSidePanelContext } from '../../context';
import { ColumnTypeTag } from '../../../../components/ColumnTypeTag';

const DrillDownArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.00282 1.0498C8.52749 1.0498 8.95282 1.47513 8.95282 1.9998V11.2996C8.95282 11.8243 8.52749 12.2496 8.00282 12.2496C7.47815 12.2496 7.05282 11.8243 7.05282 11.2996V1.9998C7.05282 1.47513 7.47815 1.0498 8.00282 1.0498Z" fill="url(#paint0_linear_136_1958)" />
            <path fillRule="evenodd" clipRule="evenodd" d="M3.3283 6.66139C3.6993 6.29039 4.3008 6.29039 4.6718 6.66139L8.00005 9.98964L11.3283 6.66139C11.6993 6.29039 12.3008 6.29039 12.6718 6.66139C13.0428 7.03239 13.0428 7.63389 12.6718 8.00489L8.6718 12.0049C8.3008 12.3759 7.6993 12.3759 7.3283 12.0049L3.3283 8.00489C2.9573 7.63389 2.9573 7.03239 3.3283 6.66139Z" fill="url(#paint1_linear_136_1958)" />
            <path fillRule="evenodd" clipRule="evenodd" d="M1.05005 13.9998C1.05005 13.4751 1.47538 13.0498 2.00005 13.0498H14C14.5247 13.0498 14.95 13.4751 14.95 13.9998C14.95 14.5245 14.5247 14.9498 14 14.9498H2.00005C1.47538 14.9498 1.05005 14.5245 1.05005 13.9998Z" fill="url(#paint2_linear_136_1958)" />
            <defs>
                <linearGradient id="paint0_linear_136_1958" x1="1.05005" y1="7.9998" x2="15.5633" y2="7.9998" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint1_linear_136_1958" x1="1.05005" y1="7.9998" x2="15.5633" y2="7.9998" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
                <linearGradient id="paint2_linear_136_1958" x1="1.05005" y1="7.9998" x2="15.5633" y2="7.9998" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5357ED" />
                    <stop offset="1" stopColor="#40B9FF" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const DrillDownColumnArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M11.3438 8.4693C11.1909 8.32871 10.9834 8.24973 10.7672 8.24973C10.5509 8.24973 10.3435 8.32871 10.1905 8.4693L8.32037 10.1889V2.99995C8.32037 2.80105 8.23444 2.6103 8.08149 2.46965C7.92853 2.32901 7.72108 2.25 7.50477 2.25C7.28846 2.25 7.08101 2.32901 6.92805 2.46965C6.7751 2.6103 6.68917 2.80105 6.68917 2.99995V10.1889L4.819 8.4693C4.74376 8.39768 4.65377 8.34054 4.55426 8.30124C4.45475 8.26194 4.34773 8.24125 4.23944 8.24038C4.13114 8.23952 4.02374 8.25849 3.92351 8.2962C3.82327 8.33391 3.73221 8.38959 3.65563 8.46001C3.57905 8.53042 3.51849 8.61416 3.47748 8.70632C3.43647 8.79849 3.41584 8.89724 3.41678 8.99682C3.41772 9.09639 3.44022 9.1948 3.48296 9.2863C3.52571 9.37779 3.58784 9.46055 3.66574 9.52973L6.92814 12.5295C7.0041 12.5995 7.0945 12.6548 7.19403 12.6923C7.29267 12.7304 7.39859 12.75 7.50559 12.75C7.61258 12.75 7.7185 12.7304 7.81715 12.6923C7.91667 12.6548 8.00707 12.5995 8.08303 12.5295L11.3454 9.52973C11.4981 9.38889 11.5837 9.19806 11.5834 8.99921C11.5831 8.80035 11.4969 8.60974 11.3438 8.4693V8.4693Z" fill="currentColor" />
        </svg>
    );
};

interface DrillDownColumnNameProps {
    name: string;
    expanded: boolean;
    readonly?: boolean;
    onExpandClick?: () => void;
    onDrillDownClick?: () => void;
}
const DrillDownColumnName = (props: DrillDownColumnNameProps) => {
    const { name, readonly = false, expanded, onExpandClick, onDrillDownClick } = props;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button type="button" className="p-1" onClick={onExpandClick}>{expanded ? <CollapseIconSvg /> : <ExpandIconSvg />}</button>
                <span>{name}</span>
            </div>
            {!readonly && (
                <button type="button" className="p-1 hover:bg-gray-100 rounded" onClick={onDrillDownClick}><DrillDownArrowSvg /></button>
            )}
        </div>
    );
};

const moreMenuMap = {
    Edit: 'Edit',
    Delete: 'Delete',
} as const;

export type UnionColumn = IScraperColumn | IDrillDownColumn;

export function isDrillDownColumn(column: UnionColumn): column is IDrillDownColumn {
    return (column as IDrillDownColumn).selector !== undefined;
}

export interface IScraperTableProps {
    data: UnionColumn[];
    readonly?: boolean;
    loading?: boolean;
    // setDeletedIds?: React.Dispatch<React.SetStateAction<string[]>>;
    expandedIds: string[];
    setExpandedIds?: React.Dispatch<React.SetStateAction<string[]>>;
    onColumnDrillDownClick?: (column: IScraperColumn) => void;
    column?: {
        onDelete?(column: UnionColumn): void;
        onEdit?(column: UnionColumn): void;
    };
}

export const ScraperTable = (props: IScraperTableProps) => {
    const {
        data,
        loading = false,
        readonly = false,
        expandedIds,
        setExpandedIds,
        onColumnDrillDownClick,
        column } = props;
    // const { setView } = useSidePanelContext();

    // const handleEditDrillDownColumns = useCallback((column: IScraperColumn) => {
        // const { url, id, drillDownConfig } = column;
        // const newDrillDownConfig: IDrillDownConfig = {
        //     parentId: id,
        //     minInterval: 3,
        //     maxInterval: 6,
        //     columns: drillDownConfig?.columns || [],
        //     ...drillDownConfig,
        // };

        // TODO: refactor to use context
        // chrome.runtime.sendMessage({
        //     type: MsgType.SetStorage,
        //     key: StorageKeys.DrillDownConfig,
        //     value: { ...newDrillDownConfig },
        // });

        // async function toDrillDownPage() {
        //     const tab = await getActiveTab();
        //     if (tab.id) {
        //         chrome.tabs.update(tab.id, { url });
        //         setView(SidePanelViewEnum.DrillDownColumnForm);
        //     }
        // }

        // toDrillDownPage();
    // }, [setView]);

    const columns: TableProps['columns'] = useMemo(() => {
        const nameColumnWidth = 166;

        return [
            {
                title: <div className="text-left pl-3 text-[#5F6574] text-xs  font-medium">{t('ColumnName')}</div>,
                dataIndex: 'name',
                key: 'name',
                width: readonly ? nameColumnWidth + 54 : nameColumnWidth,
                render: (value: any, record: UnionColumn) => {
                    const isDrillDown = isDrillDownColumn(record);

                    const handleExpand = () => setExpandedIds?.((ids) => {
                        if (ids.includes(record.id)) {
                            return ids.filter((id) => id !== record.id);
                        }
                        return [...ids, record.id];
                    });

                    return (
                        <div className={clsx('text-gray-900 py-[9.5px] text-xs font-medium  break-all', {
                            'pl-8 pr-2': isDrillDown,
                            'px-3': !isDrillDown,
                        })}
                        >
                            {!isDrillDown && record.type === Sheet_Cell_Type_Enum.URL
                                ? (
                                    <DrillDownColumnName
                                        readonly={readonly}
                                        expanded={expandedIds.includes(record.id)}
                                        onExpandClick={handleExpand}
                                        onDrillDownClick={() => {
                                            onColumnDrillDownClick?.(record);
                                            // handleEditDrillDownColumns(record);
                                        }}
                                        name={value}
                                    />
                                )
                                : value}
                        </div>
                    );
                },
            },
            {
                title: <div className="text-center py-2 text-[#5F6574] text-xs font-medium">{t('Type')}</div>,
                dataIndex: 'type',
                key: 'type',
                width: 91,
                render: (value: any, record: IScraperColumn) => {
                    const isDrillDown = isDrillDownColumn(record);

                    return (
                        <div className="text-center">
                            <ColumnTypeTag type={value} prefix={isDrillDown ? <span className="inline-flex mr-1"><DrillDownColumnArrowSvg /></span> : null} />
                        </div>
                    );
                },
            },
            !readonly && {
                title: <div className="text-center py-2 text-[#5F6574] text-xs font-medium">{t('More')}</div>,
                width: 54,
                key: 'more',
                render: (value: any, record: IScraperColumn, index: number) => {
                    const texts = [moreMenuMap.Edit, moreMenuMap.Delete];
                    const menus = texts.map((text) => {
                        const menu: IPopupMenu = { text, key: text };
                        if (text === moreMenuMap.Delete) {
                            menu.className = '!text-red-500';
                        }

                        return menu;
                    });

                    return (
                        <div className="text-center">
                            <DropdownMenu
                                menus={menus}
                                onChange={(value) => {
                                    if (value === moreMenuMap.Delete) {
                                        column?.onDelete?.(record);
                                    }

                                    if (value === moreMenuMap.Edit) {
                                        column?.onEdit?.(record);
                                    }
                                }}
                            >
                                <MoreButton />
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ].filter(Boolean) as TableProps['columns'];
    }, [onColumnDrillDownClick, expandedIds, readonly]);

    return (
        <div className=" relative">
            {loading && <LoadingMask loadingClassName="w-10 h-10 text-[#0B9EFB]" />}
            <Table
                emptyText={<TableEmpty className="py-2" text={t('NoData')} />}
                rowKey="id"
                rowClassName="hover:bg-[#fafafa]"
                columns={columns}
                data={data}
            />
        </div>
    );
};
