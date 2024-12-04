
import { Table } from '@components/Table';
import type {
    ITableRecord,
} from '@univer-clipsheet-core/table';
import {
    inProgressTableRecordId,
    TableRecordStatusEnum,
    TableRecordTypeEnum,
    triggerRecordTypes,
} from '@univer-clipsheet-core/table';
import type { TableProps } from 'rc-table';
import { useEffect, useMemo } from 'react';

import { DropdownMenu } from '@components/DropdownMenu';
import { TableEmptySvg, XLSXSvg } from '@components/icons';
import { TableLoading } from '@components/TableLoading';
import { Tooltip } from '@components/tooltip';
import { useObservableValue } from '@lib/hooks';
import { isZhCN, t } from '@univer-clipsheet-core/locale';
import { defaultPageSize } from '@univer-clipsheet-core/shared';
import dayjs from 'dayjs';
import { MoreButton } from '@components/MoreButton';
import { usePopupContext } from '../../context';
import { useTableRecords } from '../hooks';
import { StatusIcon } from './StatusIcon';
import { TableRecordItem } from './TableRecordItem';
import { TooltipTitle } from './TooltipTitle';

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

export const CollectDataTable = (props: ICollectDataTableProps) => {
    const { onEmptyClick } = props;

    const { searchInput, timeFormat, service: popupViewService } = usePopupContext();
    const { state: innerData, getState: getInnerData, loading } = useTableRecords();

    useEffect(() => {
        getInnerData({
            page: 1,
            pageSize: defaultPageSize,
            recordTypes: [
                TableRecordTypeEnum.Sheet,
                TableRecordTypeEnum.ScraperSheet,
                TableRecordTypeEnum.WorkflowSheet,
            ],
        });
    }, []);

    const [tableRecordMoreMenuRender] = useObservableValue(popupViewService ? popupViewService.tableRecordMoreMenuRender$ : undefined);

    const taskList = useMemo(() => {
        if (!searchInput) {
            return innerData;
        }

        const lowerSearchInput = searchInput.toLowerCase();
        const filteredTaskList = innerData.filter((record) => {
            const title = record.title.toLowerCase();

            return title.includes(lowerSearchInput);
        });
        return filteredTaskList;
    }, [innerData, searchInput]);

    const localeTimeFormat = isZhCN() ? 'YYYY-MM-DD HH:mm' : 'MMMM D, YYYY h:mm A';

    const columns: TableProps['columns'] = [
        { title: <span className="pl-4">Name</span>, width: 480, render: (value, record: ITableRecord<unknown>) => {
            const inProgress = record.id === inProgressTableRecordId;

            const title = record.title || record.sourceUrl;
            const time = record.createdAt;

            const taskTimeFormat = timeFormat(time);

            const titleComponent = !inProgress
                ? <TooltipTitle onClick={() => popupViewService?.triggerTableRecordClick(record)} className="max-w-[208px]" title={title} />
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
                    titleIcon={<StatusIcon className="ml-2" status={inProgress ? TableRecordStatusEnum.InProgress : TableRecordStatusEnum.Success} />}
                    footer={footer}
                />
            );
        } },
        { title: <div className="text-center">{t('More')}</div>, width: 68, render: (value, record: ITableRecord, index) => {
            const menus = tableRecordMoreMenuRender?.(record) ?? [];

            return (
                <div className="text-center">
                    <DropdownMenu
                        placement="bottomRight"
                        menus={menus}
                        onChange={(key) => {
                            popupViewService?.triggerTableMoreMenuClick(key, record);
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
