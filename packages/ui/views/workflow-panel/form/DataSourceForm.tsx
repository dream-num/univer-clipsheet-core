// import type { IScraperColumn, ISheetCollectionRecord, IWorkflowColumn, Message } from '@chrome-extension-boilerplate/shared';
// import { DataSourceKeys, generateRandomId, MsgType, RecordType, subscribeMessage } from '@chrome-extension-boilerplate/shared';
// import { ColumnTypeTag, Select, TableEmpty, useDataSource } from '@chrome-extension-boilerplate/shared-client';
// import { useWorkflowPanelContext } from '@src/context';
// import { t } from '@src/locale';
import { Select } from '@components/select';
import { t } from '@univer-clipsheet-core/locale';
import type { IGetScraperListParams, IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { ScraperDataSourceKeyEnum } from '@univer-clipsheet-core/scraper';
import type { GetDataSourceMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, generateRandomId, promisifyMessage } from '@univer-clipsheet-core/shared';
import type { ITableRecord } from '@univer-clipsheet-core/table';
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
import { useWorkflowPanelContext } from '../context';

// const updateWayOptions = [
//     {
//         label: t('InitialUpdateWayText'),
//         value: WorkflowUpdateMode.Initial,
//     },
//     {
//         label: t('IncrementalUpdateWayText'),
//         value: WorkflowUpdateMode.Incremental,
//     },
// ];

function toColumn(column: IScraperColumn | IWorkflowColumn): IWorkflowColumn {
    return {
        id: generateRandomId(),
        name: column.name,
        type: column.type,
        sourceColumns: [],
    };
}

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
                        <img className="w-5 h-5 mr-1" src={chrome.runtime.getURL('/popup/xlsx.svg')} />
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

async function getWorkflowColumnsByDataSource(dataSourceSheet: ITableRecord) {
    const triggerId = dataSourceSheet.sheet.triggerId;

    switch (dataSourceSheet.recordType) {
        case TableRecordTypeEnum.ScraperSheet: {
            const msg: GetDataSourceMessage<ScraperDataSourceKeyEnum.ScraperList, IGetScraperListParams> = {
                type: ClipsheetMessageTypeEnum.GetDataSource,
                payload: {
                    key: ScraperDataSourceKeyEnum.ScraperList,
                    params: {
                        pageSize: 1,
                        filterRecordIds: [triggerId!],
                    },
                },
            };

            chrome.runtime.sendMessage(msg);

            const response = promisifyMessage<PushDataSourceMessage<IScraper[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === ScraperDataSourceKeyEnum.ScraperList);
            return response.then((res) => {
                const [scraper] = res.payload.value;
                if (scraper) {
                    return scraper.columns.map(toColumn);
                }
            });
        }
        case TableRecordTypeEnum.WorkflowSheet: {
            const msg: GetDataSourceMessage<WorkflowDataSourceKeyEnum.WorkflowList, IGetWorkflowListParams> = {
                type: ClipsheetMessageTypeEnum.GetDataSource,
                payload: {
                    key: WorkflowDataSourceKeyEnum.WorkflowList,
                    params: {
                        pageSize: 1,
                        filterRecordIds: [triggerId!],
                    },
                },
            };

            chrome.runtime.sendMessage(msg);

            const response = promisifyMessage<PushDataSourceMessage<IWorkflow[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === WorkflowDataSourceKeyEnum.WorkflowList);
            return response.then((res) => {
                const [workflow] = res.payload.value;
                if (workflow) {
                    return workflow.columns.map(toColumn);
                }
            });
        }
    }
}

export const DataSourceForm = memo(() => {
    const {
        workflow: _workflow,
        setWorkflow,
        originUnitId,
        hasDataSource,
    } = useWorkflowPanelContext();

    const workflow = _workflow!;

    const unitId = workflow.unitId;

    const { state: dataSourceSheets = [] } = useImmediateDataSource<ITableRecord[]>(TableDataSourceKeyEnum.TableRecords);

    const dataSourceExisted = useMemo(() => {
        if (originUnitId && dataSourceSheets.length > 0) {
            return dataSourceSheets.some((record) => record.sheet.unitId === originUnitId);
        }
        // Assume the unit is existed
        return true;
    }, [originUnitId, dataSourceSheets]);

    const disabled = hasDataSource && dataSourceExisted;

    const sheetOptions = useMemo(() => {
        return dataSourceSheets.map((record) => {
            return {
                label: record.sheet.title,
                value: record.sheet.unitId,
                recordType: record.recordType,
                createdAt: record.sheet.createdAt,
            };
        });
    }, [dataSourceSheets]);

    const columns = workflow.columns ?? [];

    const handleUnitIdChange = async (unitId: string) => {
        workflow.unitId = unitId;
        const dataSourceSheet = dataSourceSheets.find((record) => record.sheet.unitId === unitId);

        if (!dataSourceSheet) {
            setWorkflow?.({
                ...workflow,
                columns: [],
            });
            return;
        }

        const newColumns = await getWorkflowColumnsByDataSource(dataSourceSheet);

        if (newColumns) {
            workflow.columns = newColumns;
        }

        setWorkflow?.({ ...workflow });
    };

    return (
        <div>
            <section className="mb-4">
                <div className="text-gray-900 text-sm mb-2">{t('IncrementalUpdateConfiguration')}</div>
                {/* <div className="flex flex-col gap-3">
                    {updateWayOptions.map((option) => {
                        const idStr = String(option.value);
                        return (
                            <div className="flex items-center" key={option.value}>
                                <input
                                    disabled={hasDataSource}
                                    type="radio"
                                    className="mr-2 w-4 h-4"
                                    id={idStr}
                                    value={option.value}
                                    checked={updateWay === option.value}
                                    onChange={() => {
                                        setUpdateWay(option.value);

                                        if (option.value === WorkflowUpdateMode.Initial) {
                                            setUnit('');
                                            setColumns([]);
                                        }
                                    }}
                                >
                                </input>
                                <label htmlFor={idStr} className="text-gray-500 text-sm cursor-pointer">{option.label}</label>
                            </div>
                        );
                    })}
                </div> */}
                <div className="text-gray-600 text-sm">
                    {t('DataSourceFormSubTitle')}
                </div>
                <div className="mt-2">
                    <DataSourceSheetsSelect
                        disabled={disabled}
                        notFoundContent={hasDataSource && (<span className="text-red-500">{t('DataSourceNoLongerExist')}</span>)}
                        className="w-full"
                        value={unitId}
                        options={sheetOptions}
                        onClear={() => {
                            setWorkflow?.({
                                ...workflow,
                                unitId: '',
                                columns: [],
                            });
                        }}
                        onChange={handleUnitIdChange}
                    />
                </div>
            </section>
            {/* {columns && columns.length > 0 && ( */}
            <section>
                <div className="text-gray-900 text-sm mb-2">{t('ColumnInformation')}</div>
                <div className="rounded border border-solid border-gray-300">
                    <div className="h-10 flex items-center bg-gray-50 border-solid border-b border-gray-300 ">
                        {/* <div
                                className="px-4 "
                            >
                                <input
                                    disabled={hasDataSource}
                                    className="cursor-pointer"
                                    type="checkbox"
                                    size={16}
                                    id="check-all"
                                    value="check-all"
                                    checked={columns ? selectedColumnIds.length === columns.length : false}
                                    onChange={(evt) => {
                                        const checked = evt.target.checked;
                                        if (checked) {
                                            columns && setSelectedColumnIds(columns.map((c) => c.id));
                                        } else {
                                            setSelectedColumnIds([]);
                                        }
                                    }}
                                >
                                </input>
                            </div> */}
                        <div className="w-[560px] border-box flex items-center px-3  text-xs text-gray-500 h-full">{t('ColumnName')}</div>
                        <div className="grow flex items-center justify-center text-xs text-gray-500 border-solid border-box px-3 border-l h-full border-gray-300">{t('Type')}</div>
                    </div>
                    {!unitId || columns.length <= 0
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
                                            {/* <div
                                            className="px-4"
                                        >
                                            <input
                                                disabled={hasDataSource}
                                                className="cursor-pointer"
                                                type="checkbox"
                                                size={16}
                                                id={column.id}
                                                checked={selectedColumnIds.includes(column.id)}
                                                onChange={(evt) => {
                                                    const checked = evt.target.checked;
                                                    if (checked) {
                                                        setSelectedColumnIds(selectedColumnIds.concat([column.id]));
                                                    } else {
                                                        setSelectedColumnIds(selectedColumnIds.filter((id) => id !== column.id));
                                                    }
                                                }}
                                            >
                                            </input>
                                        </div> */}
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
