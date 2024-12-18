import { DrillDownService } from '@lib/drill-down-service';
import { type IDrillDownConfig, type IScraper, ScraperErrorCode } from '@lib/scraper';
import type { ActiveTabMessage, GetDataSourceMessage, IMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, defaultPageSize, ObservableValue, pushDataSource, requestConnectChannel, waitFor, WindowService } from '@univer-clipsheet-core/shared';
import type { ISheet_Row_Cell } from '@univer-clipsheet-core/table';
import { createEmptyInitialSheet, Sheet_Cell_Type_Enum, TableRecordTypeEnum, TableService } from '@univer-clipsheet-core/table';
import { Inject } from '@wendellhu/redi';
import { calculateRandomInterval } from '@lib/tools';
import { getScraperTaskChannelName, scraperTaskChannel, type ScraperTaskChannelResponse } from './scraper-channel';
import { IScraperDataSource } from './scraper-data-source';
import { ScraperTab } from './scraper-tab';
import type { CreateScraperMessage, DeleteScraperMessage, IGetScraperListParams, RunScraperFailedMessage, RunScraperMessage, StopScraperMessage, UpdateScraperMessage } from './scraper.message';
import { ScraperDataSourceKeyEnum, ScraperMessageTypeEnum } from './scraper.message';

export class ScraperService {
    private _runningScraperIds$ = new ObservableValue<string[]>([]);
    private _scraperTabMap: Map<string, ScraperTab> = new Map();
    private _tabToScraperTabMap: Map<number, ScraperTab> = new Map();

    constructor(
        @Inject(IScraperDataSource) private _dataSource: IScraperDataSource,
        @Inject(TableService) private _tableService: TableService,
        @Inject(DrillDownService) private _drillDownService: DrillDownService,
        @Inject(WindowService) private _windowService: WindowService
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
    }

    async queryScrapersByIds(ids: string[]) {
        return this._dataSource.getList({
            pageSize: ids.length,
            filterRecordIds: ids,
        });
    }

    async runScraper(runScraperInit: {
        scraper: IScraper;
        windowId?: number;
        onCreated?: (scraperTab: ScraperTab) => void;
    }) {
        const { scraper, windowId, onCreated } = runScraperInit;
        const { _scraperTabMap, _tabToScraperTabMap } = this;
        if (!_scraperTabMap.has(scraper.id)) {
            // Create a scraper tab
            const newScraperTab = new ScraperTab(scraper, windowId);
            onCreated?.(newScraperTab);

            _scraperTabMap.set(scraper.id, newScraperTab);

            newScraperTab.promise.finally(() => {
                newScraperTab.dispose();
            });

            // When tab is created, add it to the map
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

    async stopScraper(scraperId: string, toSave: boolean = false) {
        this._removeFromRunningScraperIds(scraperId);
        const scraperTab = this._scraperTabMap.get(scraperId);

        if (!scraperTab) {
            return;
        }

        if (toSave) {
            scraperTab.resolve({
                ...scraperTab.response,
                done: true,
            });
        } else {
            scraperTab.reject({
                code: ScraperErrorCode.Stop,
            });
        }

        scraperTab.dispose();
    }

    private async _removeFromRunningScraperIds(scraperId: string) {
        const { _runningScraperIds$ } = this;
        _runningScraperIds$.next(_runningScraperIds$.value.filter((id) => id !== scraperId));
    }

    async _addRunningScraperId(id: string) {
        const { _runningScraperIds$ } = this;
        const runningIds = _runningScraperIds$.value;
        if (runningIds.includes(id)) {
            return false;
        }
        _runningScraperIds$.next([id].concat(runningIds));

        return true;
    }

    private _createDrillDownTask(scraper: IScraper, rows: ScraperTaskChannelResponse['rows']) {
        let dispose: () => void = () => {};
        let drillDownTabs: chrome.tabs.Tab[] = [];

        const executeDrillDown = async () => {
            // Map of column index to drill down config
            const drillDownConfigMap = new Map<number, IDrillDownConfig>();

            // Find columns that have drill down config
            scraper.columns.forEach((column, columnIndex) => {
                const drillDownConfig = column.drillDownConfig;
                if (column.type === Sheet_Cell_Type_Enum.URL && drillDownConfig && drillDownConfig.columns.length > 0) {
                    drillDownConfigMap.set(columnIndex, drillDownConfig);
                }
            });

            const drillDownConfigMapEntries = Array.from(drillDownConfigMap.entries());

            const windowId = (await this._windowService.ensureWindow()).id;
            // Open tabs for each drill down config
            drillDownTabs = await Promise.all(drillDownConfigMapEntries.map(() => chrome.tabs.create({ windowId, active: false })));

            try {
                // Execute drill down row by row
                for (const row of rows) {
                    const drillDownTasks = drillDownConfigMapEntries.map(async ([columnIndex, drillDownConfig], index) => {
                        const cell = row.cells[columnIndex];
                        if (!cell.url) {
                            return null;
                        }

                        const interval = calculateRandomInterval(drillDownConfig.maxInterval, drillDownConfig.minInterval);

                        const beforeWait = Date.now();
                        // Use tab that created in advance
                        const tab = drillDownTabs[index];

                        const res = await this._drillDownService.runDrillDown(cell.url, drillDownConfig.columns.map((c) => c.selector), tab);

                        const waitInterval = interval - (Date.now() - beforeWait);
                        if (waitInterval > 0) {
                            // Wait for a random interval
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
                            // Generate cell by drill down response
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

                        // Insert drill down result to cells[columnIndex]
                        (row.cells[columnIndex] as unknown as ISheet_Row_Cell[]) = [row.cells[columnIndex]].concat(cells);
                    });
                    // Flatten the cells that contains drill down result
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

        const window = await this._windowService.ensureWindow();

        const { error, rows } = await this.runScraper({
            scraper,
            windowId: window.id,
            onCreated: (scraperTab) => {
                const disposers = new Set<() => void>();
                scraperTab.addResponseInterceptor(async (scraperTab, rows) => {
                    // Tp execute drill down task
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

        this._tableService.addTable({
            record: {
                title: scraper.name,
                sourceUrl: scraper.url,
                recordType: TableRecordTypeEnum.ScraperSheet,
            },
            text: '',
            sheets: [initialSheet],
            triggerId: scraper.id,
        });
    }

    addScraper(scraper: IScraper) {
        return this._dataSource.add(scraper);
    }

    async pushScraperList(params: IGetScraperListParams) {
        return pushDataSource(ScraperDataSourceKeyEnum.ScraperList, await this._dataSource.getList(params));
    }

    listenMessage() {
        chrome.webNavigation.onErrorOccurred.addListener((details) => {
            const scraperTab = this._tabToScraperTabMap.get(details.tabId);
            // Failed to open the target page for the scraper
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
            | UpdateScraperMessage
            | ActiveTabMessage, sender) => {
            switch (msg.type) {
                case ClipsheetMessageTypeEnum.ActiveTab: {
                    const { payload } = msg;
                    const tab = payload ?? sender.tab;

                    if (!tab || !tab.id) {
                        return;
                    }

                    chrome.tabs.update(tab.id, {
                        active: true,
                    });
                    break;
                }
                // When page loaded and if it is created by scraper tab will start to scrape
                case ClipsheetMessageTypeEnum.Loaded: {
                    const senderTabId = sender.tab?.id;
                    if (!senderTabId) {
                        return;
                    }
                    const scraperTab = this._tabToScraperTabMap.get(senderTabId);
                    // This tab is created by scraper
                    if (scraperTab) {
                        const scraperId = scraperTab.scraper.id;

                        const scraper = scraperTab.scraper;

                        if (!scraper) {
                            return;
                        }

                        const channelName = getScraperTaskChannelName(scraperId);

                        // Connect channel with tab content script
                        scraperTaskChannel.getConnectedPort(channelName).then((port) => {
                            // Send request to tab content script
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

                    const res = await this.addScraper(payload.scraper);

                    if (payload.toRun) {
                        this._executeRunScraper(res);
                    }

                    this.pushScraperList({
                        pageSize: defaultPageSize,
                    });
                    break;
                }
                case ScraperMessageTypeEnum.UpdateScraper: {
                    const { payload } = msg;

                    await this._dataSource.update(payload.scraper);

                    if (payload.toRun) {
                        this._executeRunScraper(payload.scraper);
                    }
                    break;
                }
                case ScraperMessageTypeEnum.DeleteScraper: {
                    const { payload: id } = msg;
                    this.stopScraper(id);

                    await this._dataSource.delete(id);

                    this.pushScraperList({
                        pageSize: defaultPageSize,
                    });
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
                    const { toSave, id } = msg.payload;

                    this.stopScraper(id, toSave);
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
