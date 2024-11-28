// import type { IDrillDownConfig, IScraper, ISheet_Row_Cell, MessageItem, ScraperTaskChannelResponse } from '@chrome-extension-boilerplate/shared';
// import { createEmptyInitialSheet, DataSourceKeys, defaultPageSize, getScraperTaskChannelName, MsgType, RecordType, requestConnectChannel, ScraperColumnType, ScraperErrorCode, scraperTaskChannel, Sheet_Cell_Type_Enum, StorageKeys, TabKeys } from '@chrome-extension-boilerplate/shared';
import { Inject } from '@wendellhu/redi';
// import { crxRequest } from '../../api';
// import { handleAddTask, sendDataSource } from '../../helper';
// import { DrillDownManger } from '../drill-down-manager';
// import { getStorage, StorageManager } from '../storage-manager';
// import { UserManager } from '../user-manager';
// import type { IGetScraperListParams } from './scraper-data-source';
import type { GetDataSourceMessage, IMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import type { ISheet_Row_Cell } from '@univer-clipsheet-core/table';
import { createEmptyInitialSheet, Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { ClipsheetMessageTypeEnum, getStorage, ObservableValue, pushDataSource, requestConnectChannel } from '@univer-clipsheet-core/shared';
import { type IDrillDownConfig, type IScraper, ScraperErrorCode } from '@lib/scraper';
import { DrillDownService } from '@lib/drill-down-service';
import { IScraperDataSource } from './scraper-data-source';
import { ScraperTab } from './scraper-tab';
import type { CreateScraperMessage, DeleteScraperMessage, IGetScraperListParams, RunScraperFailedMessage, RunScraperMessage, StopScraperMessage, UpdateScraperMessage } from './scraper.message';
import { ScraperDataSourceKeyEnum, ScraperMessageTypeEnum, ScraperStorageKeyEnum } from './scraper.message';
import { getScraperTaskChannelName, scraperTaskChannel, type ScraperTaskChannelResponse } from './scraper-channel';

// const getRunningScraperIds = async () => (await getStorage(ScraperStorageKeyEnum.RunningScraperIds)) || [];

function waitFor(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

export class ScraperService {
    // private _dataSource: IScraperDataSource = n();
    private _runningScraperIds$ = new ObservableValue<string[]>([]);
    private _scraperTabMap: Map<string, ScraperTab> = new Map();
    private _tabToScraperTabMap: Map<number, ScraperTab> = new Map();
    // private _scraperPromise: Promise<IScraper[]> | undefined;

    constructor(
        @Inject(IScraperDataSource) private _dataSource: IScraperDataSource,
        // @Inject(StorageManager) private _storageManager: StorageManager,
        // @Inject(UserManager) private _userManager: UserManager,
        @Inject(DrillDownService) private _drillDownService: DrillDownService
    ) {
        this._runningScraperIds$.subscribe((runningIds) => {
            const msg: PushDataSourceMessage = {
                type: ClipsheetMessageTypeEnum.PushDataSource,
                payload: {
                    key: ScraperDataSourceKeyEnum.RunningScraperIds,
                    value: runningIds,
                },
            };

            chrome.runtime.sendMessage(msg);
        });
        // this._userManager.onUserChanged(async (user) => {
        //     this._dataSource.local$.next(user.anonymous !== false);
        // });
    }

    async queryScrapersByIds(ids: string[]) {
        return this._dataSource.getList({
            pageSize: ids.length,
            filterRecordIds: ids,
        });
        // return this._dataSource.getScraperList({
        //     pageSize: ids.length,
        //     filterRecordIds: ids,
        // });
    }

    async runScraper(runScraperInit: {
        scraper: IScraper;
        windowId?: number;
        onCreated?: (scraperTab: ScraperTab) => void;
    }) {
        const { scraper, windowId, onCreated } = runScraperInit;
        const { _scraperTabMap, _tabToScraperTabMap } = this;
        if (!_scraperTabMap.has(scraper.id)) {
            const newScraperTab = new ScraperTab(scraper, windowId);
            onCreated?.(newScraperTab);

            _scraperTabMap.set(scraper.id, newScraperTab);

            newScraperTab.promise.finally(() => {
                newScraperTab.dispose();
            });

            newScraperTab.tabPromise.then((tab) => {
                const tabId = tab.id;
                if (tabId) {
                    _tabToScraperTabMap.set(tabId, newScraperTab);
                    newScraperTab.onDispose(() => {
                        _tabToScraperTabMap.delete(tabId);
                    });
                }
            });
            newScraperTab.onDispose(() => {
                _scraperTabMap.delete(scraper.id);
            });
        }
        const scraperTab = _scraperTabMap.get(scraper.id)!;

        return scraperTab.promise;
    }

    async stopScraper(scraperId: string) {
        this._removeFromRunningScraperIds(scraperId);
        const scraperTab = this._scraperTabMap.get(scraperId);

        if (scraperTab) {
            scraperTab.reject({
                code: ScraperErrorCode.Stop,
            });
            scraperTab.dispose();
        }
    }

    private async _removeFromRunningScraperIds(scraperId: string) {
        const { _runningScraperIds$ } = this;
        _runningScraperIds$.next(_runningScraperIds$.value.filter((id) => id !== scraperId));
        // const runningScraperIds = await getRunningScraperIds();
        // this._storageManager.setStorage(StorageKeys.RunningScraperIds, runningScraperIds.filter((id) => id !== scraperId));
    }

    async _addRunningScraperId(id: string) {
        const { _runningScraperIds$ } = this;
        const runningIds = _runningScraperIds$.value;
        if (runningIds.includes(id)) {
            return false;
        }
        _runningScraperIds$.next([id].concat(runningIds));
        // this._storageManager.setStorage(StorageKeys.RunningScraperIds, [id].concat(runningIds));

        return true;
    }

    private _createDrillDownTask(scraper: IScraper, rows: ScraperTaskChannelResponse['rows']) {
        function calculateRandomInterval(max: number, min: number) {
            return (Math.random() * (max - min) + min) * 1000;
        }

        let dispose: () => void = () => {};
        let drillDownTabs: chrome.tabs.Tab[] = [];

        const executeDrillDown = async () => {
            const drillDownConfigMap = new Map<number, IDrillDownConfig>();

            scraper.columns.forEach((column, columnIndex) => {
                const drillDownConfig = column.drillDownConfig;
                if (column.type === Sheet_Cell_Type_Enum.URL && drillDownConfig && drillDownConfig.columns.length > 0) {
                    drillDownConfigMap.set(columnIndex, drillDownConfig);
                }
            });

            const drillDownConfigMapEntries = Array.from(drillDownConfigMap.entries());

            drillDownTabs = await Promise.all(drillDownConfigMapEntries.map(() => chrome.tabs.create({ active: false })));

            try {
                for (const row of rows) {
                    const drillDownTasks = drillDownConfigMapEntries.map(async ([columnIndex, drillDownConfig], index) => {
                        const cell = row.cells[columnIndex];
                        if (!cell.url) {
                            return null;
                        }

                        const interval = calculateRandomInterval(drillDownConfig.maxInterval, drillDownConfig.minInterval);

                        const beforeWait = Date.now();
                        const tab = drillDownTabs[index];
                        const res = await this._drillDownService.runDrillDown(cell.url, drillDownConfig.columns.map((c) => c.selector), tab);
                        const waitInterval = interval - (Date.now() - beforeWait);
                        if (waitInterval > 0) {
                            await waitFor(waitInterval);
                        }

                        return {
                            columnIndex,
                            items: res.items,
                        };
                    });
                    const responses = await Promise.all(drillDownTasks);
                    responses.forEach((response) => {
                        if (!response) {
                            return;
                        }

                        const { columnIndex, items } = response;

                        const cells = items.map((item, index) => {
                            const drillDownColumn = scraper.columns[columnIndex].drillDownConfig?.columns[index];
                            const drillDownColumnType = drillDownColumn?.type;
                            const { value: itemValue } = item;

                            const cell: ISheet_Row_Cell = {
                                text: itemValue?.text ?? '',
                                url: itemValue?.href || itemValue?.src || '',
                                type: (drillDownColumnType as unknown as Sheet_Cell_Type_Enum) ?? Sheet_Cell_Type_Enum.TEXT,
                            };

                            return cell;
                        });

                        (row.cells[columnIndex] as unknown as ISheet_Row_Cell[]) = [row.cells[columnIndex]].concat(cells);
                    });
                    row.cells = row.cells.flat();
                }
            } finally {
                drillDownTabs.forEach((tab) => {
                    if (tab.id) {
                        chrome.tabs.remove(tab.id);
                    }
                });
            }
        };

        return {
            response: Promise.race([
                new Promise<void>((resolve) => {
                    dispose = () => {
                        drillDownTabs.forEach((tab) => {
                            const tabId = tab.id;
                            if (!tabId) {
                                return;
                            }
                            chrome.tabs.remove(tabId);
                            this._drillDownService.stopDrillDown(tabId);
                        });
                        resolve();
                    };
                }),
                executeDrillDown(),
            ]),
            dispose,
        };
    }

    async _executeRunScraper(scraper: IScraper) {
        const isAdded = await this._addRunningScraperId(scraper.id);
        if (!isAdded) {
            return;
        }

        const { error, rows } = await this.runScraper({
            scraper,
            onCreated: (scraperTab) => {
                const disposers = new Set<() => void>();
                scraperTab.addResponseInterceptor(async (scraperTab, rows) => {
                    const task = this._createDrillDownTask(scraperTab.scraper, rows);
                    disposers.add(task.dispose);
                    await task.response;

                    return rows;
                });
                scraperTab.onDispose(() => {
                    disposers.forEach((dispose) => dispose());
                });
                scraperTab.onError((error) => {
                    if (error.code === ScraperErrorCode.InvalidURL) {
                        const msg: RunScraperFailedMessage = {
                            type: ScraperMessageTypeEnum.RunScraperFailed,
                            payload: scraper,
                        };
                        chrome.runtime.sendMessage(msg);
                        // chrome.runtime.sendMessage({
                        //     type: MsgType.RunFailedNotification,
                        //     scraper,
                        // });
                    }
                });
            },
        });

        this._removeFromRunningScraperIds(scraper.id);

        if (error || rows.length <= 0) {
            return;
        }

        const initialSheet = createEmptyInitialSheet();

        initialSheet.sheetName = scraper.name;
        initialSheet.rows = rows;
        initialSheet.columnName = scraper.columns.reduce((names, column) => {
            names.push(column.name);

            if (column.drillDownConfig?.columns) {
                names = names.concat(column.drillDownConfig.columns.map((c) => c.name));
            }

            return names;
        }, [] as string[]);

        // handleAddTask({
        //     recordType: RecordType.ScraperSheet,
        //     text: '',
        //     time: Date.now(),
        //     title: scraper.name,
        //     originUrl: scraper.url,
        //     sheets: [initialSheet],
        //     triggerId: scraper.id,
        // });
    }

    listenMessage() {
        chrome.webNavigation.onErrorOccurred.addListener((details) => {
            const scraperTab = this._tabToScraperTabMap.get(details.tabId);

            if (scraperTab && details.frameId === 0) {
                scraperTab.reject({
                    code: ScraperErrorCode.InvalidURL,
                });
                this.stopScraper(scraperTab.scraper.id);
            }
        });

        chrome.runtime.onMessage.addListener(async (msg: IMessage<ClipsheetMessageTypeEnum.Loaded>
            | GetDataSourceMessage<ScraperDataSourceKeyEnum.ScraperList, IGetScraperListParams>
            | GetDataSourceMessage<ScraperDataSourceKeyEnum.RunningScraperIds>
            | RunScraperMessage
            | StopScraperMessage
            | DeleteScraperMessage
            | CreateScraperMessage
            | UpdateScraperMessage, sender) => {
            switch (msg.type) {
                case ClipsheetMessageTypeEnum.Loaded: {
                    const senderTabId = sender.tab?.id;
                    if (!senderTabId) {
                        return;
                    }
                    const scraperTab = this._tabToScraperTabMap.get(senderTabId);
                    if (scraperTab) {
                        const scraperId = scraperTab.scraper.id;

                        const scraper = scraperTab.scraper;

                        if (!scraper) {
                            return;
                        }

                        const channelName = getScraperTaskChannelName(scraperId);

                        scraperTaskChannel.getConnectedPort(channelName).then((port) => {
                            scraperTab.onRequest();
                            scraperTaskChannel.sendRequest(port, { scraper });
                            scraperTaskChannel.onResponse(port, (res) => {
                                if (res.done) {
                                    port.disconnect();
                                }
                                scraperTab.onResponse(res);
                            });
                        });

                        requestConnectChannel(channelName, senderTabId);
                    }

                    break;
                }
                case ScraperMessageTypeEnum.CreateScraper: {
                    const { payload } = msg;
                    // this._storageManager.setStorage(StorageKeys.TabItem, TabKeys.Scraper);

                    const res = await this._dataSource.add(payload.scraper);

                    if (payload.toRun) {
                        this._executeRunScraper(res);
                    }

                    break;
                }
                case ScraperMessageTypeEnum.UpdateScraper: {
                    const { payload } = msg;
                    // this._storageManager.setStorage(StorageKeys.TabItem, TabKeys.Scraper);
                    await this._dataSource.update(payload.scraper);

                    if (payload.toRun) {
                        this._executeRunScraper(payload.scraper);
                    }
                    break;
                }
                case ScraperMessageTypeEnum.DeleteScraper: {
                    const { payload: id } = msg;
                    this.stopScraper(id);

                    this._dataSource.delete(id);
                    break;
                }
                case ScraperMessageTypeEnum.RunScraper: {
                    const { payload } = msg;

                    this._executeRunScraper(payload);
                    break;
                }
                case ClipsheetMessageTypeEnum.GetDataSource: {
                    const { payload } = msg;
                    if (payload.key === ScraperDataSourceKeyEnum.ScraperList) {
                        // if (this._scraperPromise) {
                        //     return;
                        // }

                        // this._scraperPromise = this._dataSource.getList(payload.params);
                        this._dataSource.getList(payload.params)
                            .then((list) => {
                                pushDataSource(ScraperDataSourceKeyEnum.ScraperList, list);
                            }).finally(() => {
                                // this._scraperPromise = undefined;
                            });
                    }
                    if (payload.key === ScraperDataSourceKeyEnum.RunningScraperIds) {
                        pushDataSource(ScraperDataSourceKeyEnum.RunningScraperIds, this._runningScraperIds$.value);
                    }
                    break;
                }

                case ScraperMessageTypeEnum.StopScraper: {
                    this.stopScraper(msg.payload);
                    break;
                }
            }
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            const scraperTab = this._tabToScraperTabMap.get(tabId);
            if (scraperTab) {
                this.stopScraper(scraperTab.scraper.id);
            }
        });
    }
}
