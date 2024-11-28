
import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { InputNumber, LoadingMask, useStorageValue } from '@chrome-extension-boilerplate/shared-client';

// import type { IDrillDownColumn, IDrillDownConfig, IInitialSheet, ISheet_Row_Cell, ITableElementAnalyzeRowDataItem } from '@chrome-extension-boilerplate/shared';
// import { createEmptyInitialSheet, DataSourceKeys, getActiveTab, getActiveTabId, getDataSource, MsgType, PingSignalKeys, startSendSignalInterval, StorageKeys } from '@chrome-extension-boilerplate/shared';
// import type { ScraperData } from '@src/components/hooks';
// import { t } from '../../locale';
import type { IDrillDownColumn, IDrillDownConfig, IScraper } from '@univer-clipsheet-core/scraper';
import type { IInitialSheet, ISheet_Row_Cell, ITableElementAnalyzeRowDataItem } from '@univer-clipsheet-core/table';
import { createEmptyInitialSheet } from '@univer-clipsheet-core/table';
import { generateRandomId, getActiveTab, getActiveTabId, listenPingSignal, pingSignal, PingSignalKeyEnum } from '@univer-clipsheet-core/shared';
import { useStorageValue } from '@lib/hooks';
import { LoadingMask } from '@components/LoadingMask';
import { InputNumber } from '@components/InputNumber';
import { t } from '@univer-clipsheet-core/locale';
import { coverHelper, requestElementInspection, requestUpperElement } from '@views/client';
import { DrillDownColumnFormItem } from './DrillDownColumnFormItem';

const BackArrowSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16.4286 8.84669H6.15849L8.61514 6.17206C8.71747 6.06446 8.79909 5.93575 8.85524 5.79344C8.91139 5.65113 8.94094 5.49807 8.94218 5.3432C8.94342 5.18832 8.91631 5.03472 8.86244 4.89137C8.80857 4.74802 8.72902 4.61779 8.62842 4.50827C8.52783 4.39875 8.40821 4.31214 8.27654 4.25349C8.14487 4.19484 8.0038 4.16532 7.86154 4.16667C7.71929 4.16802 7.5787 4.20019 7.44799 4.26133C7.31728 4.32246 7.19906 4.41132 7.10023 4.52272L2.81476 9.18846C2.71498 9.29681 2.63582 9.42553 2.58181 9.56724C2.5278 9.70895 2.5 9.86087 2.5 10.0143C2.5 10.1677 2.5278 10.3196 2.58181 10.4613C2.63582 10.6031 2.71498 10.7318 2.81476 10.8401L7.10023 15.5059C7.30229 15.7183 7.57292 15.8359 7.85383 15.8332C8.13474 15.8306 8.40345 15.7079 8.60209 15.4917C8.80073 15.2754 8.91341 14.9828 8.91585 14.677C8.91829 14.3712 8.8103 14.0765 8.61514 13.8565L6.15849 11.1796H16.4286C16.7128 11.1796 16.9853 11.0567 17.1862 10.8379C17.3871 10.6192 17.5 10.3225 17.5 10.0131C17.5 9.70377 17.3871 9.40708 17.1862 9.18833C16.9853 8.96958 16.7128 8.84669 16.4286 8.84669Z" fill="currentColor" />
        </svg>
    );
};

export interface IDrillDownColumnProps {
    loadingContent?: React.ReactNode;
    config?: IDrillDownConfig;
    onBack?: () => void;
    onConfirm?: (config: IDrillDownConfig) => void;
    // data: IScraper;
    // onChange?: (data: IScraper) => void;
}

type RuntimeDrillDownColumn = IDrillDownColumn & {
    cellData?: ITableElementAnalyzeRowDataItem;
};

// function finishDrillDown(url: string) {
//     getActiveTab()
//         .then((tab) => {
//             if (tab.id) {
//                 // chrome.tabs.sendMessage(tab.id, { type: MsgType.CloseDrillDownColumnElementInspection });
//                 chrome.tabs.update(tab.id, { url });
//             }
//         });
// }

// const setIntelligenceColumnNames = async (columns: IDrillDownColumn[]) => {
//     const initialSheet: IInitialSheet = createEmptyInitialSheet();
//     initialSheet.rows.push({
//         cells: columns.map((c) => {
//             const cellData = (c as RuntimeDrillDownColumn).cellData;
//             return {
//                 type: c.type,
//                 text: cellData?.text,
//                 url: cellData?.href || cellData?.src,
//             };
//         }) as unknown as ISheet_Row_Cell[],
//     });

//     const intelligenceColumns: Array<{ name: string; index: number }> = await getDataSource(DataSourceKeys.IntelligenceColumns, {
//         innerText: '',
//         initialSheets: [initialSheet],
//     });

//     intelligenceColumns.forEach((column, index) => {
//         const drillDownColumn = columns[index];
//         drillDownColumn.name = column.name;
//     });
// };

function createDrillDownConfig(): IDrillDownConfig {
    return {
        columns: [],
        minInterval: 0,
        maxInterval: 0,
    };
}

// function createDrillDownColumn(): IDrillDownColumn {
//     return {
//         id: '',
//         name: '',
//         selector: '',
//         type
        // type: 'text',
    // };
// }

export const DrillDownColumnForm = (props: IDrillDownColumnProps) => {
    const { loadingContent, config, onBack, onConfirm } = props;
    // const { setView } = useSidePanelContext();
    const [drillDownConfig, setDrillDownConfig] = useState<IDrillDownConfig>(config || createDrillDownConfig());

    useEffect(() => {
        if (config) {
            setDrillDownConfig(config);
        }
    }, [config]);
    // const [drillDownConfig, _setDrillDownConfig, setStorageDrillDownConfig] = useStorageValue<IDrillDownConfig>(StorageKeys.DrillDownConfig, {
    //     columns: [],
    //     minInterval: 0,
    //     maxInterval: 0,
    // });
    const [inspectingColumnId, setInspectingColumnId] = useState('');
    const inspectingColumnIdRef = useRef(inspectingColumnId);
    // const [inspectingColumnId, _setinspectingColumnId, setStorageinspectingColumnId] = useStorageValue(StorageKeys.inspectingColumnId, '');
    // const [loading, setLoading] = useState(false);

    useEffect(() => {
        // setStorageinspectingColumnId('');

        let dispose: () => void;
        getActiveTab().then(async (tab) => {
            const tabId = tab.id;
            if (!tabId) {
                return;
            }

            // requestElementInspection()
            // if (tab.status === 'loading') {
            //     await ensureTabComplete(tab);
            // }
            // chrome.tabs.sendMessage(tabId, { type: MsgType.RequestDrillDownColumnElementInspection });
            dispose = pingSignal(PingSignalKeyEnum.DrillDownColumnFormShowed, tabId);
        });

        return () => {
            dispose?.();
        };
    }, []);

    useEffect(() => {
        function doElementInspection() {
            return requestElementInspection()
                .then((data) => {
                    if (inspectingColumnIdRef.current) {
                        setInspectingColumnId('');
                        setDrillDownConfig((c) => ({
                            ...c,
                            columns: c.columns.map((column) => {
                                if (column.id === inspectingColumnIdRef.current) {
                                    column.selector = data.selector;
                                    column.type = data.type;
                                    column.name = data.cellData?.text || '';
                                }

                                return column;
                            }),
                        }));
                        coverHelper.updateCover(inspectingColumnIdRef.current, data.selector);
                    } else {
                        const newColumn = {
                            id: generateRandomId(),
                            name: data.cellData?.text || '',
                            selector: data.selector,
                            type: data.type,
                        };
                        setDrillDownConfig((c) => {
                            return {
                                ...c,
                                columns: c.columns.concat([newColumn]),
                            };
                        });
                        coverHelper.addCover(newColumn.id, data.selector);
                    }
                });
        }

        doElementInspection().then(doElementInspection);
    }, []);

    // const handleBack = useCallback(() => {
    //     finishDrillDown(scraperData.url);
    //     setView(SidePanelViewEnum.ScraperForm);
    // }, [setView, scraperData]);

    // const saveColumns = async () => {
    //     const newDrillDownColumns = drillDownConfig.columns.filter((c) => {
    //         return (c as RuntimeDrillDownColumn).cellData;
    //     });

    //     if (newDrillDownColumns.length > 0) {
    //         await setIntelligenceColumnNames(newDrillDownColumns);
    //     }

    //     newDrillDownColumns.forEach(((c) => {
    //         delete (c as RuntimeDrillDownColumn).cellData;
    //     }));

        // onChange?.({
        //     ...scraperData,
        //     columns: scraperData.columns.map((c) => {
        //         if (c.id === drillDownConfig.parentId) {
        //             drillDownConfig.columns.map((c) => ({

        //             }));
        //             return {
        //                 ...c,
        //                 drillDownConfig: { ...drillDownConfig },
        //             };
        //         }
        //         return c;
        //     }),
        // });
    // };

    // const handleSave = async () => {
    //     if (loading) {
    //         return;
    //     }
    //     setLoading(true);

    //     await saveColumns().finally(() => {
    //         setLoading(false);
    //     });

        // finishDrillDown(scraperData.url);
    // };

    const content = drillDownConfig.columns.length === 0
        ? (
            <div className="flex flex-col items-center justify-center h-full">
                <img className="w-[240px] h-[120px] mb-2" src={chrome.runtime.getURL('content/icons/no_data.svg')} alt="" />
                <div className="w-[208px] text-gray-400 text-sm text-[13px]">{t('NoDrillDownElements')}</div>
            </div>
        )
        : (
            <section>
                <ul className="flex flex-col gap-4">
                    {drillDownConfig.columns.map((item, index) => {
                        const inspecting = inspectingColumnId === item.id;
                        return (
                            <li key={index}>
                                <DrillDownColumnFormItem
                                    disabled={{
                                        name: Boolean((item as RuntimeDrillDownColumn).cellData),
                                    }}
                                    border
                                    deletable
                                    data={item}
                                    inspecting={inspecting}
                                    onChange={(key, value) => {
                                        item[key] = value;
                                        setDrillDownConfig({ ...drillDownConfig, columns: drillDownConfig.columns.slice() });
                                        // setStorageDrillDownConfig({ ...drillDownConfig, columns: drillDownConfig.columns.slice() });
                                    }}
                                    onUpperClick={() => {
                                        requestUpperElement(item.selector).then((selector) => {
                                            if (selector) {
                                                item.selector = selector;
                                                setDrillDownConfig({ ...drillDownConfig, columns: drillDownConfig.columns.slice() });
                                                // coverHelper.updateCover(item.id, selector);
                                            }
                                        });
                                        // const tabId = await getActiveTabId();
                                        // if (!tabId) {
                                        //     return;
                                        // }
                                        // chrome.tabs.sendMessage(tabId, {
                                        //     type: MsgType.UpperDrillDownColumnElement,
                                        //     columnId: item.id,
                                        // });
                                    }}
                                    onInspectClick={() => {
                                        setInspectingColumnId(item.id);
                                        // setStorageinspectingColumnId(item.id);
                                    }}
                                    onDelete={() => {
                                        setDrillDownConfig({ ...drillDownConfig, columns: drillDownConfig.columns.filter((c) => c.id !== item.id) });

                                        // setStorageDrillDownConfig({ ...drillDownConfig, columns: drillDownConfig.columns.filter((c) => c.id !== item.id) });
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </section>
        );

    return (
        <div className="scraper-form relative bg-white rounded-xl px-4 h-full pb-[206px] overflow-auto ">
            {loadingContent}
            {/** Loading content */}
            {/* {loading && (
                <LoadingMask className="z-10 text-[#0B9EFB]" loadingClassName="w-10 h-10" text={<div className="mt-2">{t('IntelligenceColumnNamesGenerated')}</div>} />
            )} */}
            <h1 className="flex items-center text-base text-[#0E111E] py-3">
                <button type="button" onClick={onBack}>
                    <BackArrowSvg />
                </button>
                <span className="ml-2">{t('SetDrillDownCols')}</span>
            </h1>
            {content}
            <footer className="rounded-b  shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.2)]  text-xs font-medium mt-[30px] py-3 px-4  bg-white  fixed left-2 bottom-2 w-[calc(100%-16px)]">
                <div className="p-3 border-gray-200 border rounded-lg flex flex-col gap-3 mb-3">
                    <h1>{t('DrillDownScrapingConfig')}</h1>
                    <div className="flex items-center text-gray-500 justify-between">
                        <span>{t('MinInterval')}</span>
                        <InputNumber min={0} value={drillDownConfig.minInterval} onChange={(v) => setDrillDownConfig({ ...drillDownConfig, minInterval: v as number })} />
                    </div>
                    <div className="flex items-center text-gray-500 justify-between">
                        <span>{t('MaxInterval')}</span>
                        <InputNumber min={0} value={drillDownConfig.maxInterval} onChange={(v) => setDrillDownConfig({ ...drillDownConfig, maxInterval: v as number })} />
                    </div>

                </div>
                <div className="flex">
                    <button onClick={onBack} className="grow mr-3 px-3 py-[7px] border border-gray-200  rounded-full text-center text-gray-900">{t('Cancel')}</button>
                    <button onClick={() => onConfirm?.(drillDownConfig)} className="grow px-3 py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center">{t('Save')}</button>
                </div>
            </footer>
        </div>
    );
};
