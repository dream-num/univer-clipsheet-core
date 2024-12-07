
import { Select } from '@components/select';
import { t } from '@univer-clipsheet-core/locale';
import type { IGetScraperListParams, IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { ScraperDataSourceKeyEnum } from '@univer-clipsheet-core/scraper';
import type { GetDataSourceMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, generateRandomId, promisifyMessage } from '@univer-clipsheet-core/shared';
import type { ITableRecord, ITableRecordsResponse } from '@univer-clipsheet-core/table';
import { TableDataSourceKeyEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import type { IGetWorkflowListParams, IWorkflow, IWorkflowColumn } from '@univer-clipsheet-core/workflow';
import { WorkflowDataSourceKeyEnum } from '@univer-clipsheet-core/workflow';
import clsx from 'clsx';
import dayjs from 'dayjs';
import type { DefaultOptionType } from 'rc-select/lib/Select';
import React, { memo, useMemo } from 'react';
import { useImmediateDataSource } from '@lib/hooks';
import { TableEmpty } from '@components/TableEmpty';
import { ColumnTypeTag } from '@components/ColumnTypeTag';
import { XLSXSvg } from '@components/icons';
import { getWorkflowColumnsByTable } from '@lib/helper';
import { useWorkflowPanelContext } from '../context';

// function toColumn(column: IScraperColumn | IWorkflowColumn): IWorkflowColumn {
//     return {
//         id: generateRandomId(),
//         name: column.name,
//         type: column.type,
//         sourceColumns: [],
//     };
// }

interface DataSourceSheetsSelectProps {
    className?: string;
    value?: any;
    options: DefaultOptionType[];
    onChange?: (value: any) => void;
    onClear?: () => void;
    notFoundContent?: React.ReactNode;
    disabled?: boolean;

}
const DataSourceSheetsSelect = (props: DataSourceSheetsSelectProps) => {
    const { className, options, value, onChange, onClear, notFoundContent, disabled = false } = props;

    return (
        <Select
            allowClear
            className={className}
            disabled={disabled}
            showSearch
            filterOption
            optionFilterProp="label"
            value={value}
            virtual={false}
            onChange={onChange}
            onClear={onClear}
            placeholder={t('SelectDataSource')}
            notFoundContent={<div className="text-gray-500 text-center p-2">{t('NoData')}</div>}
            labelRender={(props) => {
                const propsValue = props.value;
                const selectedOption = options.find((option) => option.value === propsValue);

                if (!selectedOption && propsValue && notFoundContent) {
                    // Has value but not found the selected option will show the not found content
                    return notFoundContent;
                }

                return <span>{selectedOption?.label}</span>;
            }}
            options={options}
            optionRender={(option: any) => {
                const { data } = option;

                return (
                    <div className="flex items-center">
                        <XLSXSvg className="w-5 h-5 mr-1" />
                        <div>
                            <div className="text-gray-900 text-sm font-medium">{option.label}</div>
                            <div className="text-gray-400 text-xs mt-2">
                                <span>{t('CreateByWith', { author: data.recordType === TableRecordTypeEnum.ScraperSheet ? t('Scraper') : t('Workflow') })}</span>
                                <span className="ml-1">{dayjs.unix(data.createdAt).format('MM/DD/YYYY HH:mm')}</span>
                            </div>
                        </div>
                    </div>
                );
            }}
        >
        </Select>
    );
};

// async function getWorkflowColumnsByTable(tableRecord: ITableRecord) {
//     const triggerId = tableRecord.triggerId;

//     switch (tableRecord.recordType) {
//         case TableRecordTypeEnum.ScraperSheet: {
//             const msg: GetDataSourceMessage<ScraperDataSourceKeyEnum.ScraperList, IGetScraperListParams> = {
//                 type: ClipsheetMessageTypeEnum.GetDataSource,
//                 payload: {
//                     key: ScraperDataSourceKeyEnum.ScraperList,
//                     params: {
//                         pageSize: 1,
//                         filterRecordIds: [triggerId!],
//                     },
//                 },
//             };

//             chrome.runtime.sendMessage(msg);

//             const response = promisifyMessage<PushDataSourceMessage<IScraper[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === ScraperDataSourceKeyEnum.ScraperList);
//             return response.then((res) => {
//                 const [scraper] = res.payload.value;
//                 if (scraper) {
//                     return scraper.columns.map(toColumn);
//                 }
//             });
//         }
//         case TableRecordTypeEnum.WorkflowSheet: {
//             const msg: GetDataSourceMessage<WorkflowDataSourceKeyEnum.WorkflowList, IGetWorkflowListParams> = {
//                 type: ClipsheetMessageTypeEnum.GetDataSource,
//                 payload: {
//                     key: WorkflowDataSourceKeyEnum.WorkflowList,
//                     params: {
//                         pageSize: 1,
//                         filterRecordIds: [triggerId!],
//                     },
//                 },
//             };

//             chrome.runtime.sendMessage(msg);

//             const response = promisifyMessage<PushDataSourceMessage<IWorkflow[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === WorkflowDataSourceKeyEnum.WorkflowList);
//             return response.then((res) => {
//                 const [workflow] = res.payload.value;
//                 if (workflow) {
//                     return workflow.columns.map(toColumn);
//                 }
//             });
//         }
//     }
// }

export const DataSourceForm = memo(() => {
    const {
        workflow: _workflow,
        setWorkflow,
        originTableId,
        boundDataSource,
    } = useWorkflowPanelContext();

    const workflow = _workflow!;

    const tableId = workflow.tableId;

    const { state: tableRecordsSource = {
        data: [],
        total: 0,
    } } = useImmediateDataSource<ITableRecordsResponse>(TableDataSourceKeyEnum.TableRecords);
    const tableRecords = tableRecordsSource.data;

    const tableExisted = useMemo(() => {
        if (originTableId && tableRecords.length > 0) {
            return tableRecords.some((record) => record.id === originTableId);
        }
        // Assume the unit is existed
        return true;
    }, [originTableId, tableRecords]);

    const disabled = boundDataSource && tableExisted;

    const sheetOptions = useMemo(() => {
        return tableRecords.map((record) => {
            return {
                label: record.title,
                value: record.id,
                recordType: record.recordType,
                createdAt: record.createdAt,
            };
        });
    }, [tableRecords]);

    const columns = workflow.columns ?? [];

    const handleTableIdChange = async (tableId: string) => {
        workflow.tableId = tableId;
        const tableRecord = tableRecords.find((record) => record.id === tableId);

        if (!tableRecord) {
            if (!boundDataSource) {
                // Only clear the columns when the table is not bound
                setWorkflow?.({
                    ...workflow,
                    columns: [],
                });
            }
            return;
        }

        const newColumns = await getWorkflowColumnsByTable(tableRecord);
        // console.log('newColumns', newColumns);
        workflow.columns = newColumns ?? [];

        setWorkflow?.({ ...workflow });
    };

    return (
        <div>
            <section className="mb-4">
                <div className="text-gray-900 text-sm mb-2">{t('IncrementalUpdateConfiguration')}</div>

                <div className="text-gray-600 text-sm">
                    {t('DataSourceFormSubTitle')}
                </div>
                <div className="mt-2">
                    <DataSourceSheetsSelect
                        disabled={disabled}
                        notFoundContent={boundDataSource && (<span className="text-red-500">{t('DataSourceNoLongerExist')}</span>)}
                        className="!w-full"
                        value={tableId}
                        options={sheetOptions}
                        onClear={() => {
                            setWorkflow?.({
                                ...workflow,
                                tableId: '',
                                columns: [],
                            });
                        }}
                        onChange={handleTableIdChange}
                    />
                </div>
            </section>
            <section>
                <div className="text-gray-900 text-sm mb-2">{t('ColumnInformation')}</div>
                <div className="rounded border border-solid border-gray-300">
                    <div className="h-10 flex items-center bg-gray-50 border-solid border-b border-gray-300 ">

                        <div className="w-[560px] border-box flex items-center px-3  text-xs text-gray-500 h-full">{t('ColumnName')}</div>
                        <div className="grow flex items-center justify-center text-xs text-gray-500 border-solid border-box px-3 border-l h-full border-gray-300">{t('Type')}</div>
                    </div>
                    {!tableId || columns.length <= 0
                        ? <TableEmpty className="py-3" text="No data" />
                        : (
                            <ul className="max-h-[240px] overflow-y-auto">
                                {columns.map((column, index) => {
                                    return (
                                        <li
                                            key={column.id}
                                            className={clsx('h-10 flex items-center ', {
                                                'border-b border-gray-300 border-solid': index !== columns.length - 1,
                                            })}
                                        >
                                            <div className=" w-[560px] border-box flex items-center px-3  text-gray-900 text-xs h-full">
                                                <span className="whitespace-nowrap text-ellipsis overflow-hidden">
                                                    {column.name}
                                                </span>
                                            </div>
                                            <div className="grow flex items-center justify-center  px-3 border-solid border-l h-full border-gray-300">
                                                <ColumnTypeTag type={column.type} />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                </div>
            </section>
            {/* )} */}
        </div>
    );
});
