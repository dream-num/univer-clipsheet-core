import React, { useMemo } from 'react';
import { useImmediateDataSource } from '@lib/hooks';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, ScraperDataSourceKeyEnum } from '@univer-clipsheet-core/scraper';
import { t } from '@univer-clipsheet-core/locale';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { defaultPageSize, generateRandomId } from '@univer-clipsheet-core/shared';
import type { IWorkflowColumn, IWorkflowScraperSetting, WorkflowRemoveDuplicateRule } from '@univer-clipsheet-core/workflow';
import { createScraperSetting, WorkflowRuleName, WorkflowScraperSettingMode } from '@univer-clipsheet-core/workflow';
import { CloseSvg, PlusSvg } from '@components/icons';
import { InputNumber } from '@components/input-number/InputNumber';
import { ScraperInput } from '@components/ScraperInput';
import { Select } from '@components/select';
import { ScraperDropdownMenu } from '../components/ScraperDropdownMenu';
import { useWorkflowPanelContext } from '../context';
import { ScraperColumnDropdownMenu } from '../components/scraper-column-dropdown-menu';
import { Collapse } from './Collapse';

const TrashSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M13.3333 4.64039H10.6667V3.23688C10.6667 2.86465 10.5262 2.50766 10.2761 2.24445C10.0261 1.98124 9.68696 1.83337 9.33333 1.83337H6.66667C6.31305 1.83337 5.97391 1.98124 5.72386 2.24445C5.47381 2.50766 5.33333 2.86465 5.33333 3.23688V4.64039H2.66667C2.48986 4.64039 2.32029 4.71433 2.19526 4.84593C2.07024 4.97754 2 5.15603 2 5.34215C2 5.52826 2.07024 5.70676 2.19526 5.83836C2.32029 5.96997 2.48986 6.0439 2.66667 6.0439H3.33333V13.7632C3.33333 14.1354 3.47381 14.4924 3.72386 14.7556C3.97391 15.0188 4.31304 15.1667 4.66667 15.1667H11.3333C11.687 15.1667 12.0261 15.0188 12.2761 14.7556C12.5262 14.4924 12.6667 14.1354 12.6667 13.7632V6.0439H13.3333C13.5101 6.0439 13.6797 5.96997 13.8047 5.83836C13.9298 5.70676 14 5.52826 14 5.34215C14 5.15603 13.9298 4.97754 13.8047 4.84593C13.6797 4.71433 13.5101 4.64039 13.3333 4.64039ZM6.66667 3.23688H9.33333V4.64039H6.66667V3.23688ZM11.3333 13.7632H4.66667V6.0439H11.3333V13.7632Z" fill="currentColor" />
            <path d="M6.66667 6.74565C6.48986 6.74565 6.32029 6.81959 6.19526 6.95119C6.07024 7.0828 6 7.26129 6 7.44741V12.3597C6 12.5458 6.07024 12.7243 6.19526 12.8559C6.32029 12.9875 6.48986 13.0614 6.66667 13.0614C6.84348 13.0614 7.01305 12.9875 7.13807 12.8559C7.2631 12.7243 7.33333 12.5458 7.33333 12.3597V7.44741C7.33333 7.26129 7.2631 7.0828 7.13807 6.95119C7.01305 6.81959 6.84348 6.74565 6.66667 6.74565Z" fill="currentColor" />
            <path d="M9.33333 6.74565C9.15652 6.74565 8.98695 6.81959 8.86193 6.95119C8.73691 7.0828 8.66667 7.26129 8.66667 7.44741V12.3597C8.66667 12.5458 8.73691 12.7243 8.86193 12.8559C8.98695 12.9875 9.15652 13.0614 9.33333 13.0614C9.51014 13.0614 9.67971 12.9875 9.80474 12.8559C9.92976 12.7243 10 12.5458 10 12.3597V7.44741C10 7.26129 9.92976 7.0828 9.80474 6.95119C9.67971 6.81959 9.51014 6.74565 9.33333 6.74565Z" fill="currentColor" />
        </svg>
    );
};

const typeOptions = [
    { label: 'Image', value: Sheet_Cell_Type_Enum.IMAGE },
    { label: 'Text', value: Sheet_Cell_Type_Enum.TEXT },
    { label: 'Url', value: Sheet_Cell_Type_Enum.URL },
    { label: 'Video', value: Sheet_Cell_Type_Enum.VIDEO },
];

function createEmptyColumn(type: Sheet_Cell_Type_Enum = Sheet_Cell_Type_Enum.TEXT): IWorkflowColumn {
    return {
        id: generateRandomId(),
        name: '',
        type,
        sourceColumns: [],
    };
}
export const DataMergeForm = () => {
    const { workflow: _workflow, setWorkflow, hasDataSource } = useWorkflowPanelContext();

    const workflow = _workflow!;

    const { state: scraperList = [] } = useImmediateDataSource<IScraper[]>(ScraperDataSourceKeyEnum.ScraperList, {
        pageSize: defaultPageSize,
    });

    const scraperMap = useMemo(() => {
        const map = new Map<string, IScraper>();
        scraperList.forEach((scraper) => {
            map.set(scraper.id, scraper);
        });
        return map;
    }, [scraperList]);

    const columns = workflow?.columns ?? [];

    const setColumns = (columns: IWorkflowColumn[]) => {
        setWorkflow?.({
            ...workflow,
            columns,
        });
    };

    const scraperSettings = workflow?.scraperSettings ?? [];
    const setScraperSettings = (settings: IWorkflowScraperSetting[]) => {
        /** When a scraperSetting will be removed and that we need to remove related columns in sourceColumns */
        setWorkflow?.({
            ...workflow,
            scraperSettings: settings,
        });
    };

    const settingScraperIds = useMemo(() => {
        return scraperSettings.map((setting) => setting.scraperId);
    }, [scraperSettings]);

    const selectableScraperList = useMemo(() => {
        return scraperSettings
            .map((setting) => {
                return scraperMap.get(setting.scraperId);
            })
            .filter(Boolean) as IScraper[];
    }, [scraperSettings, scraperMap]);

    function handleDeleteColumn(column: IWorkflowColumn) {
        const removeDuplicateRule = workflow.rules.find((rule) => rule.name === WorkflowRuleName.RemoveDuplicate) as WorkflowRemoveDuplicateRule;
        if (removeDuplicateRule) {
            removeDuplicateRule.payload = removeDuplicateRule.payload.filter((id) => id !== column.id);
        }
        workflow.columns = workflow.columns.filter((c) => c.id !== column.id);
        setWorkflow?.({ ...workflow });
    }

    const ensureWorkflowColumn = (index: number, type: Sheet_Cell_Type_Enum) => {
        if (!workflow.columns[index]) {
            workflow.columns[index] = createEmptyColumn(type);
        }
        return workflow.columns[index];
    };

    const handleDeleteScraper = (scraperId: string) => {
        workflow.columns.forEach((column) => {
            column.sourceColumns = column.sourceColumns.filter((sourceColumn) => sourceColumn.scraperId !== scraperId);
        });
        workflow.columns = workflow.columns.filter((column) => Boolean(column.sourceColumns.length > 0 || column.name));
    };

    return (
        <div className="min-h-[360px] max-h-[480px] overflow-y-auto">
            <div className="flex justify-between">
                <span className="text-gray-900 text-sm font-medium">
                    {t('SelectedScraper')}
                    :
                </span>
                <ScraperDropdownMenu
                    value={settingScraperIds}
                    onChange={(ids) => {
                        const addedIds = ids.filter((id) => !settingScraperIds.includes(id));
                        const removedIds = settingScraperIds.filter((id) => !ids.includes(id));

                        const addedScraperSettings = addedIds.map((id) => {
                            const scraper = scraperMap.get(id);

                            return createScraperSetting(scraper!);
                        });

                        const newScraperSettings = scraperSettings
                            .filter((setting) => !removedIds.includes(setting.scraperId))
                            .concat(addedScraperSettings);

                        removedIds.forEach((id) => {
                            handleDeleteScraper(id);
                        });

                        addedScraperSettings.forEach((setting) => {
                            // Add new scraper column to corresponding workflow column with same index
                            const scraper = scraperMap.get(setting.scraperId);
                            scraper?.columns.forEach((column, columnIndex) => {
                                const workflowColumn = ensureWorkflowColumn(columnIndex, column.type);

                                workflowColumn.sourceColumns.push({
                                    scraperId: setting.scraperId,
                                    columnId: column.id,
                                });
                            });
                        });

                        setWorkflow?.({
                            ...workflow,
                            scraperSettings: newScraperSettings,
                        });
                    }}
                    options={scraperList}
                >
                    <button type="button" className="text-indigo-600 p-1 rounded inline-flex items-center bg-transparent cursor-pointer hover:bg-gray-100">
                        <span className="mr-1.5 inline-flex"><PlusSvg /></span>
                        <span className=" text-xs">{t('AddScraper')}</span>
                    </button>
                </ScraperDropdownMenu>
            </div>
            <div className="mt-3 flex flex-col gap-2">
                {scraperSettings.map((setting, index) => {
                    const scraper = scraperMap.get(setting.scraperId);

                    const isNoneMode = scraper?.mode === AutoExtractionMode.None;

                    const leftHeader = (
                        <div className="mr-[30px]">
                            <span className="text-gray-500 mr-1 whitespace-nowrap">
                                {t('ScraperSetting')}
                                :
                            </span>
                            <span className="font-medium whitespace-nowrap">
                                {setting.mode === WorkflowScraperSettingMode.All || isNoneMode
                                    ? t('ScrapingAllPages')
                                    : `${t('Scraping')} ${setting.customValue ?? 0} ${scraper?.mode === AutoExtractionMode.PageUrl ? t('pages') : t('seconds')}`}
                            </span>
                        </div>

                    );

                    return (
                        <Collapse height={113} key={index} title={scraper?.name ?? ''} leftHeader={leftHeader} defaultExpanded>
                            <div>
                                <div className="p-3">
                                    <div className="text-sm font-medium">
                                        {t('ScraperSetting')}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                checked={setting.mode === WorkflowScraperSettingMode.All || isNoneMode}
                                                onChange={(evt) => {
                                                    if (evt.target.checked) {
                                                        setting.mode = WorkflowScraperSettingMode.All;
                                                        setScraperSettings(scraperSettings.slice());
                                                    }
                                                }}
                                            />
                                            <label className="cursor-pointer mx-2" htmlFor="">{t('ScrapingAllPages')}</label>
                                        </span>
                                        {!isNoneMode && (
                                            <span className="inline-flex items-center ml-1">
                                                <input
                                                    type="radio"
                                                    checked={setting.mode === WorkflowScraperSettingMode.Custom}
                                                    onChange={(evt) => {
                                                        if (evt.target.checked) {
                                                            setting.mode = WorkflowScraperSettingMode.Custom;
                                                            setScraperSettings(scraperSettings.slice());
                                                        }
                                                    }}
                                                />
                                                <label className="cursor-pointer mx-2" htmlFor="">{t('CustomScraping')}</label>
                                                <InputNumber
                                                    disabled={setting.mode !== WorkflowScraperSettingMode.Custom}
                                                    value={setting.customValue}
                                                    min={0}
                                                    onChange={(value) => {
                                                        setting.customValue = value;
                                                        setScraperSettings(scraperSettings.slice());
                                                    }}
                                                />
                                                <span className="ml-1">{scraper?.mode === AutoExtractionMode.PageUrl ? t('pages') : t('seconds')}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-[18px]">
                                        <button
                                            onClick={() => {
                                                const filteredScraperSettings = scraperSettings.filter((s) => s.id !== setting.id);
                                                handleDeleteScraper(setting.scraperId);

                                                setWorkflow?.({
                                                    ...workflow,
                                                    scraperSettings: filteredScraperSettings,
                                                });
                                            }}
                                            type="button"
                                            className="h-6 bg-transparent border border-solid cursor-pointer border-red-500 text-red-500 px-2 rounded-md"
                                        >
                                            {t('Delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Collapse>
                    );
                })}
            </div>
            <div>
                {columns.map((column, index) => {
                    const sourceColumns = column.sourceColumns;

                    return (
                        <div key={index} className="border p-2 mt-4">
                            <div className="flex items-center justify-between">
                                <span>{t('Title')}</span>
                                {!hasDataSource && (
                                    <button onClick={() => handleDeleteColumn(column)} type="button" className="text-red-500 text-[0px] p-1 rounded hover:bg-gray-100 cursor-pointer">
                                        <TrashSvg />
                                    </button>
                                )}
                            </div>
                            <div className="my-3  flex gap-4">
                                <div className="flex items-center grow">
                                    <span className="text-nowrap text-sm mr-2">{t('ColumnName')}</span>
                                    <ScraperInput
                                        disabled={hasDataSource}
                                        value={column.name}
                                        onChange={(v) => {
                                            columns[index].name = v;
                                            setColumns(columns.slice());
                                        }}
                                        closable
                                        wrapClassName="h-8"
                                        className="py-[5.5px]"
                                        closeIconClassName="bg-transparent cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center grow">
                                    <span className="text-nowrap text-sm mr-2">{t('Type')}</span>
                                    <Select
                                        disabled={hasDataSource}
                                        value={column.type}
                                        onChange={(v) => {
                                            columns[index].type = v;
                                            setColumns(columns.slice());
                                        }}
                                        className="w-full"
                                        options={typeOptions}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <ScraperColumnDropdownMenu
                                    value={sourceColumns}
                                    options={selectableScraperList}
                                    onChange={(checked, scraperId, columnId) => {
                                        if (checked) {
                                            columns[index].sourceColumns = [{ scraperId, columnId }].concat(columns[index].sourceColumns);
                                        } else {
                                            columns[index].sourceColumns = columns[index].sourceColumns.filter((sourceColumn) => !(sourceColumn.scraperId === scraperId && sourceColumn.columnId === columnId));
                                        }
                                        setColumns(columns.slice());
                                    }}
                                >
                                    <button className="text-[0px] cursor-pointer p-[2px] rounded-md border border-solid border-gray-200 bg-white hover:bg-gray-100">
                                        <PlusSvg />
                                    </button>
                                </ScraperColumnDropdownMenu>
                                {sourceColumns.map((sourceColumn, sourceIndex) => {
                                    const scraper = scraperMap.get(sourceColumn.scraperId);
                                    const column = scraper?.columns.find((c) => c.id === sourceColumn.columnId);

                                    const name = `${scraper?.name ?? ''} - ${column?.name ?? ''}`;

                                    return (
                                        <div key={`${sourceColumn.scraperId}_${sourceColumn.columnId}`} className="max-w-[662px] h-[25px] inline-flex items-center px-3 py-0.5 text-indigo-600 bg-indigo-100 rounded-md">
                                            <span className=" text-ellipsis overflow-hidden whitespace-nowrap">{name}</span>
                                            <button
                                                onClick={() => {
                                                    columns[index].sourceColumns = sourceColumns.filter((_, i) => i !== sourceIndex);
                                                    setColumns(columns.slice());
                                                }}
                                                type="button"
                                                className="cursor-pointer ml-1 inline-flex "
                                            >
                                                <CloseSvg />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {!hasDataSource && (
                <div className="mt-4">
                    <button
                        onClick={() => {
                            setColumns(columns.concat([createEmptyColumn()]));
                        }}
                        type="button"
                        className="text-indigo-600 p-1 rounded inline-flex items-center bg-transparent cursor-pointer hover:bg-gray-100"
                    >
                        <span className=" mr-1.5 inline-flex"><PlusSvg /></span>
                        <span className=" text-xs">{t('AddColumn')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
