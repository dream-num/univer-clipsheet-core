import { useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import type { CreateScraperMessage, IClickAutoExtractionConfig, IPageUrlAutoExtractionConfig, IScraper, IScraperColumn, IScrollAutoExtractionConfig } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, ScraperMessageTypeEnum, sendCreateScraperMessage } from '@univer-clipsheet-core/scraper';
import { useStorageValue } from '@lib/hooks';
import { closeSidePanel, generateRandomId, getActiveTab, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { t } from '@univer-clipsheet-core/locale';
import type { IPreviewSheetStorageValue } from '@univer-clipsheet-core/table';
import { Sheet_Cell_Type_Enum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import { Dialog } from '@components/Dialog';
import { ScraperInput } from '@components/ScraperInput';
import { ScraperTextarea } from '@components/ScraperTextarea';
import { useSidePanelContext } from '../../context';
import { AutoExtractionTabsForm, ClickAutoExtractionForm, PageUrlAutoExtractionForm, ScrollAutoExtractionForm } from './components/auto-extraction-form';
import { isDrillDownColumn, ScraperTable } from './ScraperTable';
import type { IScraperTableProps, UnionColumn } from './ScraperTable';
import { EditColumnDialog, type IEditColumnDialogRef } from './components/EditColumnDialog';
import { setStorageScraperData, submitValidate } from './common';
import { PreviewTableButton } from './components/PreviewTableButton';
import type { IScraperFormProps } from './ScraperForm';
import { useAutoExtractionForm } from './hooks';

export interface IScraperCreateFormProps {
    data: IScraper;
    onColumnEdit?: IScraperFormProps['onColumnEdit'];
}

export const ScraperCreateForm = (props: IScraperCreateFormProps) => {
    const { data: scraperData, onColumnEdit } = props;

    const scraperDataRef = useRef(scraperData);
    scraperDataRef.current = scraperData;

    const [loading] = useStorageValue<boolean>(UIStorageKeyEnum.ScraperFormTableLoading, false);
    const editColumnDialogRef = useRef<IEditColumnDialogRef>(null);

    const { message } = useSidePanelContext();
    const toRunRef = useRef(false);

    const [scraperName, setScraperName] = useState('');
    const [scraperDescription, setScraperDescription] = useState('');

    const {
        autoExtractionMode,
        setAutoExtractionMode,

        scrollConfig,
        setScrollConfig,

        clickConfig,
        setClickConfig,

        pageUrlConfig,
        setPageUrlConfig,
    } = useAutoExtractionForm(scraperData);

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

    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const data = useMemo(() => {
        // Filter deleted columns and collapse drill down columns
        const innerColumns: UnionColumn[] = scraperData.columns
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
    }, [expandedIds, scraperData.columns]);

    const [saveDialogVisible, setSaveDialogVisible] = useState(false);

    const getCurrentScraper = () => {
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

        return {
            id: '',
            url: scraperData.url,
            name: scraperName,
            description: scraperDescription,
            mode: autoExtractionMode,
            columns: scraperData.columns,
            targetSelector: scraperData.targetSelector,
            config: getScraperConfig(),
        };
    };

    const handleSaveScraper = () => {
        const validation = submitValidate({ name: scraperName, columns: scraperData.columns }, (msg) => message?.showMessage({
            type: 'error',
            text: msg,
        }));

        if (!validation) {
            return;
        }

        const scraper: IScraper = getCurrentScraper();

        sendCreateScraperMessage({
            toRun: toRunRef.current,
            scraper,
        });

        message?.showMessage({
            type: 'success',
            text: t('ScraperSavedSuccessfully'),
            duration: 2000,
            onClose: () => {
                getActiveTab().then((tab) => {
                    if (tab.id) {
                        closeSidePanel(tab.id);
                    }
                });
            },
        });
    };

    const scraperTableColumn: IScraperTableProps['column'] = useMemo(() => ({
        onDelete: (column) => {
            if (isDrillDownColumn(column)) {
                setStorageScraperData({
                    ...scraperDataRef.current,
                    columns: scraperDataRef.current.columns.map((c) => {
                        if (c.drillDownConfig) {
                            c.drillDownConfig.columns = c.drillDownConfig.columns.filter((d) => d.id !== column.id);
                        }

                        return c;
                    }),
                });
            } else {
                setStorageScraperData({
                    ...scraperDataRef.current,
                    columns: scraperDataRef.current.columns.filter((c) => c.id !== column.id),
                });
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
        <div className="scraper-form bg-white rounded-xl px-4 h-full pb-[116px] overflow-auto">
            <h1 className="text-base text-[#0E111E]  py-3">{t('CreateScraper')}</h1>
            <hr className="border-[#E3E5EA] border-t" />
            <section>
                <div className="py-3  flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded-full bg-[#DEF7EC] text-[#0DA471] ">1</span>
                    <h2 className="text-[#0E111E] text-sm font-medium">{t('ScrapingMorePages')}</h2>
                </div>
                <div className="text-gray-500 mb-1">{t('ConfigurationAutoExecute')}</div>
                <AutoExtractionTabsForm tabs={tabs} activeTab={autoExtractionMode} onTabChange={(tab) => setAutoExtractionMode(Number(tab.key))} />
            </section>
            <section>
                <div className="py-3  flex justify-between">
                    <div className=" flex items-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 mr-1.5 rounded-full bg-[#DEF7EC] text-[#0DA471] ">2</span>
                        <h2 className="text-[#0E111E] text-sm font-medium">{t('FieldsForTable')}</h2>
                        <PreviewTableButton scraper={scraperData} />
                    </div>
                    <div>
                        <span className="text-[#2C53F1] text-sm font-medium">{data.length}</span>
                        <span className="ml-1 text-[#5F6574] text-xs">{t('Columns').toLowerCase()}</span>
                    </div>
                </div>
                <ScraperTable
                    loading={loading}
                    expandedIds={expandedIds}
                    setExpandedIds={setExpandedIds}
                    data={data}
                    column={scraperTableColumn}
                    onColumnDrillDownClick={(c) => onColumnEdit?.(c, getCurrentScraper())}
                />
            </section>
            {!loading && (
                <footer className=" rounded-b  shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.2)]  text-xs font-medium mt-[30px] py-3 px-4  bg-white  fixed left-2 bottom-2 w-[calc(100%-16px)]">
                    <div className="mb-3">
                        <button
                            onClick={() => {
                                toRunRef.current = false;
                                setSaveDialogVisible(true);
                            }}
                            className="w-full py-[7px] border border-gray-200 rounded-full text-center text-gray-900"
                        >
                            {t('SaveScraper')}
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                toRunRef.current = true;
                                setSaveDialogVisible(true);
                            }}
                            className="w-full py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center"
                        >
                            {t('SavetoRunScraper')}
                        </button>
                    </div>
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
            <Dialog visible={saveDialogVisible} closable={false} width={336} classNames={{ wrapper: 'flex items-center justify-center' }} style={{ padding: '12px 12px 16px' }}>
                <div className="mb-2">
                    <div className="text-gray-900 text-sm mb-2">{t('ScraperName')}</div>
                    <ScraperInput type="text" value={scraperName} onChange={setScraperName} closable />
                </div>
                <div className="mb-4">
                    <div className="text-gray-900 text-sm mb-2">{t('Description')}</div>
                    <ScraperTextarea rows={3} value={scraperDescription} onChange={setScraperDescription} closable />
                </div>
                <div className="flex justify-end">
                    <div>
                        <button onClick={() => setSaveDialogVisible(false)} className="mr-3 px-3 py-[7px] border border-gray-200  rounded-full text-center text-gray-900">{t('Cancel')}</button>
                        <button
                            onClick={handleSaveScraper}
                            className="px-3 py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center"
                        >
                            {t('Confirm')}
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};
