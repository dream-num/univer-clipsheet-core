// import type { IClickAutoExtractionConfig, IPageUrlAutoExtractionConfig, IScraper, IScrollAutoExtractionConfig } from '@chrome-extension-boilerplate/shared';
// import { AutoExtractionMode, closeSidePanel, getActiveTab, MsgType, ScraperColumnType } from '@chrome-extension-boilerplate/shared';
// import { ScraperInput, ScraperTextarea } from '@chrome-extension-boilerplate/shared-client';

// import { AutoExtractionTabsForm, ClickAutoExtractionForm, PageUrlAutoExtractionForm, ScrollAutoExtractionForm } from '@src/components/auto-extraction-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

import dayjs from 'dayjs';
// import { t } from '../../locale';
import type { IClickAutoExtractionConfig, IPageUrlAutoExtractionConfig, IScraper, IScraperColumn, IScrollAutoExtractionConfig, UpdateScraperMessage } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, ScraperMessageTypeEnum } from '@univer-clipsheet-core/scraper';
import { t } from '@univer-clipsheet-core/locale';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { closeSidePanel, getActiveTab } from '@univer-clipsheet-core/shared';
import { ScraperInput } from '@components/ScraperInput';
import { ScraperTextarea } from '@components/ScraperTextarea';
import { useSidePanelContext } from '../../context';
import { setStorageScraperData, submitValidate } from './common';
import type { IEditColumnDialogRef } from './components/EditColumnDialog';
import { EditColumnDialog } from './components/EditColumnDialog';
import type { IScraperTableProps, UnionColumn } from './ScraperTable';
import { isDrillDownColumn, ScraperTable } from './ScraperTable';
import { AutoExtractionTabsForm, ClickAutoExtractionForm, PageUrlAutoExtractionForm, ScrollAutoExtractionForm } from './components/auto-extraction-form';

export interface IScraperEditFormProps {
    readonly?: boolean;
    data: IScraper;
    onColumnEdit?: (column: IScraperColumn) => void;
    // onDrillDownColumnEdit?: (column:) => void;
}

export const ScraperEditForm = (props: IScraperEditFormProps) => {
    const { data: scraperData, readonly = false, onColumnEdit } = props;
    const scraperDataRef = useRef(scraperData);
    scraperDataRef.current = scraperData;

    const { message } = useSidePanelContext();
    const toRunRef = useRef(false);
    const editColumnDialogRef = useRef<IEditColumnDialogRef>(null);

    function setScraperDataProperty<K extends keyof IScraper>(key: K, value: IScraper[K]) {
        setStorageScraperData({
            ...scraperData,
            [key]: value,
        });
    }

    // const [editDrillDownColumn, setEditDrillDownColumn] = useState<IDrillDownColumn | null>(null);

    const [autoExtractionMode, setAutoExtractionMode] = useState(scraperData.mode);

    const [scrollConfig, setScrollConfig] = useState<IScrollAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.Scroll ? scraperData.config as IScrollAutoExtractionConfig : { minInterval: 3, maxInterval: 6 });
    const [clickConfig, setClickConfig] = useState<IClickAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.Click ? scraperData.config as IClickAutoExtractionConfig : { minInterval: 3, maxInterval: 6, buttonSelector: '' });
    const [pageUrlConfig, setPageUrlConfig] = useState<IPageUrlAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.PageUrl ? scraperData.config as IPageUrlAutoExtractionConfig : { startPage: 1, endPage: 10, templateUrl: '' });

    useEffect(() => {
        setAutoExtractionMode(scraperData.mode);
        switch (scraperData.mode) {
            case AutoExtractionMode.Scroll:
                setScrollConfig(scraperData.config as IScrollAutoExtractionConfig);
                break;
            case AutoExtractionMode.Click:
                setClickConfig(scraperData.config as IClickAutoExtractionConfig);
                break;
            case AutoExtractionMode.PageUrl:
                setPageUrlConfig(scraperData.config as IPageUrlAutoExtractionConfig);
                break;
        }
    }, [scraperData]);

    const tabs = [
        {
            text: t('None'),
            key: AutoExtractionMode.None,
            component: null,
        },
        {
            text: t('Scroll'),
            key: AutoExtractionMode.Scroll,
            component: (
                <ScrollAutoExtractionForm
                    disabled={readonly}
                    minInterval={scrollConfig.minInterval}
                    maxInterval={scrollConfig.maxInterval}
                    onChange={(key, value) => {
                        setScrollConfig((config) => ({ ...config, [key]: value }));
                    }}
                />
            ),
        },
        {
            text: t('Click'),
            key: AutoExtractionMode.Click,
            component: (
                <ClickAutoExtractionForm
                    disabled={readonly}
                    selector={clickConfig.buttonSelector}
                    minInterval={clickConfig.minInterval}
                    maxInterval={clickConfig.maxInterval}
                    onSelectorChange={(selector) => {
                        setClickConfig((config) => ({ ...config, buttonSelector: selector }));
                    }}
                    onChange={(key, value) => {
                        setClickConfig((config) => ({ ...config, [key]: value }));
                    }}
                />
            ),
        },
        {
            text: t('ToPage'),
            key: AutoExtractionMode.PageUrl,
            component: (
                <PageUrlAutoExtractionForm
                    disabled={readonly}
                    endPage={pageUrlConfig.endPage}
                    startPage={pageUrlConfig.startPage}
                    templateUrl={pageUrlConfig.templateUrl}
                    onTemplateUrlChange={(value) => setPageUrlConfig((config) => ({ ...config, templateUrl: value }))}
                    onChange={(key, value) => {
                        setPageUrlConfig((config) => ({ ...config, [key]: value }));
                    }}
                />
            ),
        },
    ];

    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const data = useMemo(() => {
        // Filter deleted columns and collapse drill down columns
        const innerColumns: UnionColumn[] = scraperData.columns
            .filter((c) => !deletedIds.includes(c.id))
            .reduce((acc, column) => {
                if (column.type !== Sheet_Cell_Type_Enum.URL) {
                    return acc.concat(column);
                }
                const columns: UnionColumn[] = expandedIds.includes(column.id)
                    ? [column, ...(column.drillDownConfig?.columns || [])]
                    : [column];

                return acc.concat(columns);
            }, [] as UnionColumn[]);

        return innerColumns;
    }, [deletedIds, expandedIds, scraperData.columns]);

    const getFilteredColumns = () => {
        return scraperData.columns.filter((c) => !deletedIds.includes(c.id));
    };

    const handleSaveScraper = () => {
        const filteredColumns = getFilteredColumns();
        const validation = submitValidate({ name: scraperData.name, columns: filteredColumns }, (msg) => message?.showMessage({
            type: 'error',
            text: msg,
        }));
        if (!validation) {
            return;
        }

        function getScraperConfig() {
            if (autoExtractionMode === AutoExtractionMode.Scroll) {
                return scrollConfig;
            }
            if (autoExtractionMode === AutoExtractionMode.Click) {
                return clickConfig;
            }
            if (autoExtractionMode === AutoExtractionMode.PageUrl) {
                return pageUrlConfig;
            }
            return undefined;
        }

        const msg: UpdateScraperMessage = {
            type: ScraperMessageTypeEnum.UpdateScraper,
            payload: {
                toRun: toRunRef.current,
                scraper: {
                    ...scraperData,
                    columns: filteredColumns,
                    mode: autoExtractionMode,
                    config: getScraperConfig(),
                },
            },

        };

        chrome.runtime.sendMessage(msg);

        const duration = 2000;
        message?.showMessage({
            type: 'success',
            text: t('ScraperSavedSuccessfully'),
            duration,
        });

        setTimeout(() => {
            getActiveTab().then((tab) => {
                if (tab.id) {
                    closeSidePanel(tab.id);
                }
            });
        }, duration);
    };

    const [name, setName] = useState(scraperData.name);
    const [desc, setDesc] = useState(scraperData.description);
    const [url, setUrl] = useState(scraperData.url);

    const scraperTableColumn: IScraperTableProps['column'] = useMemo(() => ({
        onDelete: (column) => {
            if (isDrillDownColumn(column)) {
                setStorageScraperData({
                    ...scraperData,
                    columns: scraperData.columns.map((c) => {
                        if (c.drillDownConfig) {
                            c.drillDownConfig.columns = c.drillDownConfig.columns.filter((d) => d.id !== column.id);
                        }

                        return c;
                    }),
                });
            } else {
                setDeletedIds((ids) => ids.concat([column.id]));
            }
        },
        onEdit: (column) => {
            if (isDrillDownColumn(column)) {
                editColumnDialogRef.current?.open({
                    name: column.name,
                    type: column.type,
                    onConfirm: (data) => {
                        column.name = data.name;
                        column.type = data.type;
                        setStorageScraperData({
                            ...scraperDataRef.current,
                        });
                    },
                });
            } else {
                editColumnDialogRef.current?.open({
                    name: column.name,
                    type: column.type,
                    onConfirm: (data) => {
                        column.name = data.name;
                        column.type = data.type;
                        if (data.type !== Sheet_Cell_Type_Enum.URL) {
                            delete column.drillDownConfig;
                        }

                        setStorageScraperData({
                            ...scraperDataRef.current,
                        });
                    },
                });
            }
        },
    }), []);

    return (
        <div className="scraper-form bg-white rounded-xl px-4 pb-[116px] h-full overflow-auto">
            <header className="pt-3">
                <h1 className="text-base font-medium mb-1">{scraperData.name}</h1>
                <div className="text-gray-500 text-xs">
                    {`${t('Created')}: ${dayjs(scraperData.createAt ?? Date.now()).format('YYYY/MM/DD HH:mm')}`}
                    {scraperData.updateAt && (
                        `${t('Updated')}:${dayjs(scraperData.updateAt).format('YYYY/MM/DD HH:mm')}`
                    )}
                </div>
            </header>
            <hr className="border-[#E3E5EA] border-t my-3" />
            <div className="mb-3">
                <div className="text-gray-900 text-sm mb-2">{t('ScraperName')}</div>
                <ScraperInput disabled={readonly} value={name} onBlur={() => setScraperDataProperty('name', name)} onChange={(v) => setName(v)} type="text" closable />
            </div>
            <div className="mb-3">
                <div className="text-gray-900 text-sm mb-2">{t('Description')}</div>
                <ScraperTextarea disabled={readonly} value={desc} onBlur={() => setScraperDataProperty('description', desc)} onChange={(v) => setDesc(v)} rows={3} closable />
            </div>
            {autoExtractionMode !== AutoExtractionMode.PageUrl && (
                <div className="mb-3">
                    <div className="text-gray-900 text-sm mb-2">{t('WebpageUrl')}</div>
                    <ScraperInput disabled={readonly} value={url} onBlur={() => setScraperDataProperty('url', url)} onChange={(v) => setUrl(v)} type="text" closable />
                </div>
            )}
            <section>
                <div className="text-gray-900 text-sm mb-2">
                    <span>
                        {' '}
                        {t('ScrapingMorePages')}
                    </span>
                </div>
                <div className="text-gray-500 mb-1">{t('ConfigurationAutoExecute')}</div>
                <AutoExtractionTabsForm
                    tabs={tabs}
                    activeTab={autoExtractionMode}
                    onTabChange={(tab) => {
                        if (readonly) {
                            return;
                        }
                        setAutoExtractionMode(tab.key as AutoExtractionMode);
                    }}
                />
            </section>
            <section>
                <div className="py-3  flex justify-between">
                    <div className="text-gray-900 text-sm mb-2">{t('ConfigurationFieldForTable')}</div>
                    <div>
                        <span className="text-[#2C53F1] text-sm font-medium mr-1">{data.length}</span>
                        <span className="text-[#5F6574] text-xs">{t('Columns').toLowerCase()}</span>
                    </div>
                </div>
                <ScraperTable
                    onColumnDrillDownClick={onColumnEdit}
                    readonly={readonly}
                    expandedIds={expandedIds}
                    setExpandedIds={setExpandedIds}
                    column={scraperTableColumn}
                    data={data}
                />
            </section>
            {!readonly && (
                <footer className="rounded-b  shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.2)] py-3 px-4 bg-white  fixed left-2 bottom-2 w-[calc(100%-16px)] text-xs font-medium mt-[30px]">
                    <div className="mb-3">
                        <button
                            onClick={() => {
                                toRunRef.current = false;
                                handleSaveScraper();
                            }}
                            className="w-full py-[7px] border border-gray-200 rounded-full text-center text-gray-900"
                        >
                            {t('SaveScraper')}
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            toRunRef.current = true;
                            handleSaveScraper();
                        }}
                        className="w-full py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center"
                    >
                        {t('SavetoRunScraper')}
                    </button>
                </footer>
            )}
            <EditColumnDialog ref={editColumnDialogRef} />
            {/* {editDrillDownColumn && (
                <DrillDownColumnDialog
                    visible
                    data={editDrillDownColumn}
                    onChange={(newColumn) => {
                        setStorageScraperData({
                            ...scraperData,
                            columns: scraperData.columns.map((column) => {
                                if (column.drillDownConfig?.columns) {
                                    const index = column.drillDownConfig.columns.findIndex((c) => c.id === newColumn.id);
                                    column.drillDownConfig.columns[index] = newColumn;
                                    return column;
                                }
                                return column;
                            }),
                        });
                        setEditDrillDownColumn(null);
                    }}
                    onCancel={() => setEditDrillDownColumn(null)}
                >
                </DrillDownColumnDialog>
            ) } */}
        </div>
    );
};
