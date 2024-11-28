// import type { ISheetTask } from '@univer-clipsheet-core/shared';
// import { joinUnitUrl, TableRecordTypeEnum, TableRecordStatusEnum } from '@univer-clipsheet-core/shared';
import type {
    ITableRecord } from '@univer-clipsheet-core/table';
import {
    deleteTaskRecord,
    TableRecordStatusEnum,
    TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { Table } from '@components/Table';
import type { TableProps } from 'rc-table';
import { useCallback, useMemo } from 'react';

import 'rc-tooltip/assets/bootstrap.css';
// import { CollectButton } from '@src/components/CollectButton';
// import type { DropdownMenuItem } from '@univer-clipsheet-core/shared-client';
import type { DropdownMenuItem } from '@components/DropdownMenu';
import { DropdownMenu } from '@components/DropdownMenu';
import { separateLineMenu } from '@components/PopupMenus';
import { TableEmptySvg, XLSXSvg } from '@components/icons';
import { TableLoading } from '@components/TableLoading';
import dayjs from 'dayjs';
import Tooltip from 'rc-tooltip';
// import type { DropdownMenuItem } from '@src/components/DropdownMenu';
import { isZhCN, t } from '@univer-clipsheet-core/locale';
import { useTableRecords } from '../hooks';
import { usePopupContext } from '../../context';
import { openWorkflowDialog } from '../workflow-tab/helper';
import { MoreButton } from '../../../../components/MoreButton';
import { TableRecordItem } from './TableRecordItem';
import { TooltipTitle } from './TooltipTitle';
import { StatusIcon } from './StatusIcon';

// type TableRecordSheet = ITableRecord['sheet'];

const DataTableEmpty = (props: {
    onClick?: () => void;
}) => {
    const { onClick } = props;
    return (
        <div className="h-full flex justify-center items-center">
            <div>
                <TableEmptySvg />
                <div className="text-sm font-medium mt-2 text-gray-400">
                    <span>{t ('DataEmptyText')}</span>
                    <button onClick={onClick} type="button" className="text-[#2C53F1] cursor-pointer">{t('ScraperEmptyAction')}</button>
                </div>
            </div>
        </div>
    );
};

export interface ICollectDataTableProps {
    onEmptyClick: () => void;
}

const triggerRecordTypes = [TableRecordTypeEnum.ScraperSheet, TableRecordTypeEnum.WorkflowSheet];

enum MoreMenuKey {
    Api = 'api',
    Schedule = 'schedule',
    Delete = 'delete',
}

export const CollectDataTable = (props: ICollectDataTableProps) => {
    const { onEmptyClick } = props;

    const { searchInput, timeFormat } = usePopupContext();
    const { state: innerData, loading } = useTableRecords();
    // const [inProgressTask] = useStorageValue<null | ITask>(StorageKeys.InProgressTask, null);
    // const [innerData, setInnerData] = useState<ISheetTask[]>([]);
    // const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     setLoading(true);
    //     chrome.runtime.sendMessage({
    //         type: MsgType.RequestTaskList,
    //         page: 1,
    //         pageSize: 2000,
    //     });

    //     const listener = (msg: Message[MsgType.SendTaskList]) => {
    //         if (msg.type !== MsgType.SendTaskList) {
    //             return;
    //         }
    //         setInnerData(msg.tasks);
    //         setLoading(false);
    //     };

    //     chrome.runtime.onMessage.addListener(listener);

    //     return () => {
    //         chrome.runtime.onMessage.removeListener(listener);
    //     };
    // }, []);

    const taskList = useMemo(() => {
        if (!searchInput) {
            return innerData;
        }

        const lowerSearchInput = searchInput.toLowerCase();
        const filteredTaskList = innerData.filter((task) => {
            const title = task.sheet.title.toLowerCase();

            return title.includes(lowerSearchInput);
        });
        return filteredTaskList;
    }, [innerData, searchInput]);

    const sheetClick = useCallback((task: ITableRecord) => {
        if (task.status !== TableRecordStatusEnum.Success) {
            // do something
        }

        // chrome.tabs.create({ url: joinUnitUrl(baseUrl, task.unitId) });
    }, []);
    const localeTimeFormat = isZhCN() ? 'YYYY-MM-DD HH:mm' : 'MMMM D, YYYY h:mm A';

    const columns: TableProps['columns'] = [
        { title: <span className="pl-4">Name</span>, width: 480, render: (value, record: ITableRecord) => {
            const { sheet } = record;
            const title = sheet.title || sheet.originUrl;
            const time = sheet.createdAt;

            const taskTimeFormat = timeFormat(time);
                // : t('RemainingDays', {
                //     day: String(7 - dayjs().diff(dayjs(time), 'day')),
                // });

            const titleComponent = record.status === TableRecordStatusEnum.Success
                ? <TooltipTitle onClick={() => sheetClick(record)} className="max-w-[208px]" title={title} />
                : <span className="max-w-[208px] inline-block text-ellipsis text-nowrap overflow-hidden">{title}</span>;

            const footer = (
                <div className="flex items-center gap-2">
                    {triggerRecordTypes.includes(record.recordType) && <span>{t('CreateByWith', { author: record.recordType === TableRecordTypeEnum.ScraperSheet ? t('Scraper') : t('Workflow') })}</span>}
                    <Tooltip trigger="hover" placement="top" overlay={dayjs(time).format(localeTimeFormat)} showArrow={false}>
                        <span>{taskTimeFormat}</span>
                    </Tooltip>
                    {/* <ApiIcon /> */}
                </div>
            );

            return (
                <TableRecordItem
                    title={titleComponent}
                    icon={<XLSXSvg />}
                    titleIcon={<StatusIcon className="ml-2" status={record.status} />}
                    footer={footer}
                />
            );
        } },
        { title: <div className="text-center">{t('More')}</div>, width: 68, render: (value, record: ITableRecord, index) => {
            const isTriggerRecord = triggerRecordTypes.includes(record.recordType);
            const showSchedule = isTriggerRecord;
            const menus: DropdownMenuItem[] = [
                // {
                //     text: t('GenerateAPI'),
                //     key: MoreMenuKey.Api,
                // },
                showSchedule && {
                    text: t('ScheduleDataUpdate'),
                    key: MoreMenuKey.Schedule,
                },
                showSchedule && separateLineMenu,
                {
                    text: <span className="text-[#F05252]">{t('Delete')}</span>,
                    key: MoreMenuKey.Delete,
                },
            ].filter(Boolean) as DropdownMenuItem[];

            return (
                <div className="text-center">
                    <DropdownMenu
                        menus={menus}
                        onChange={(key) => {
                            if (key === MoreMenuKey.Delete) {
                                deleteTaskRecord(record.id, index);
                            }
                            if (key === MoreMenuKey.Schedule) {
                                openWorkflowDialog({
                                    unitId: record.sheet.unitId,
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
            <TableLoading text={t('Data')} />
        );
    }

    if (taskList.length <= 0) {
        return <DataTableEmpty onClick={onEmptyClick} />;
    }

    return <Table data={taskList} columns={columns} rowKey="id" />;
};
