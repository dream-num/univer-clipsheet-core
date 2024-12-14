
import type { GetDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, defaultPageSize, ObservableValue, pushDataSource } from '@univer-clipsheet-core/shared';
import type { IInitialSheet, ISheet_Row, ISheet_Row_Cell } from '@univer-clipsheet-core/table';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { Inject } from '@wendellhu/redi';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode, CountThreshold, ScraperService, TimeoutThreshold } from '@univer-clipsheet-core/scraper';
import dayjs from 'dayjs';
import { FilterRuleValidator } from './filter-rule';
import type { IWorkflow, IWorkflowFilterRuleItem, WorkflowFilterColumnRule } from './workflow';
import { WorkflowFilterMode, WorkflowRuleName, WorkflowScraperSettingMode, WorkflowTriggerName } from './workflow';
import { IWorkflowDataSource } from './workflow-data-source';
import type { CreateWorkflowMessage, DeleteWorkflowMessage, IGetWorkflowListParams, RunWorkflowMessage, StopWorkflowMessage, UpdateWorkflowMessage } from './workflow.message';
import { WorkflowDataSourceKeyEnum, WorkflowMessageTypeEnum } from './workflow.message';
import { getRecentTime, validateSchedule } from './workflow-schedule-helper';
import { workflowScheduleIntervalMinutes } from './constants';

function mergeCells(cells: ISheet_Row_Cell[], type: Sheet_Cell_Type_Enum) {
    const mergedCell = cells.reduce((acc, cell) => {
        const { text, url } = cell;
        if (text) {
            acc.text += (acc.text ? `,${text}` : text);
        }
        if (url) {
            acc.url += (acc.url ? `,${url}` : url);
        }

        return acc;
    }, { text: '', url: '', type } as ISheet_Row_Cell);

    // Remove url data if not URL type
    // if (mergedCell.type !== Sheet_Cell_Type_Enum.URL) {
    //     mergedCell.url = '';
    // }

    return mergedCell;
}

export interface IWorkflowDoneContext {
    workflow: IWorkflow;
    url: string;
    rows: ISheet_Row[];
}

export class WorkflowService {
    /**
     * The Path of workflow window page
     */
    private _workflowWindowPath: string = '';
    /**
     * The validator assists the workflow in checking cell text against the filter rule
     */
    filterRuleValidator = new FilterRuleValidator();
    workflowWindow: chrome.windows.Window | undefined = undefined;
    private _runningWorkflowIds$ = new ObservableValue<string[]>([]);
    private _scheduleTimer: number | undefined = undefined;

    /**
     * Callbacks when workflow done
     */
    private _onWorkflowDoneCallbacks = new Set<(ctx: IWorkflowDoneContext) => unknown>();
    /**
     * Map of scraper id to workflow ids
     * Because a scraper can be used by multiple workflows
     */
    private _scraperDependencyListMap = new Map<string, Set<string>>();

    private _workflowTriggerListeners = new Map<WorkflowTriggerName, Set<(workflow: IWorkflow, context: IWorkflowDoneContext) => void>>();

    constructor(
        @Inject(IWorkflowDataSource) private _dataSource: IWorkflowDataSource,
        @Inject(ScraperService) private _scraperService: ScraperService
        // @Inject(TableService) private _tableService: TableService
    ) {
        this._initWorkflowSchedule();
        this._initWorkflowTriggers();

        this._runningWorkflowIds$.subscribe((runningIds) => {
            if (runningIds.length <= 0) {
                this._closeWorkflowWindow();
            }
            pushDataSource(WorkflowDataSourceKeyEnum.RunningWorkflowIds, runningIds);
        });
    }

    /**
     * Set the timeout interval to check if workflows should run as scheduled.
     */
    private _initWorkflowSchedule() {
        const runWorkflows = async () => {
            const scheduleComparison = dayjs();
            const workflows = await this._dataSource.getList({ pageSize: defaultPageSize });

            const validatedWorkflows = workflows.filter((workflow) => validateSchedule(workflow.schedule, scheduleComparison));

            // validatedWorkflows.forEach((workflow) => {
            //     const { schedule } = workflow;
            //     if (!schedule) {
            //         return;
            //     }
            //     const scheduleMinutes = schedule.minute % 60;
            //     const scheduleHours = (schedule.minute - scheduleMinutes) / 60;

            //     const startDay = dayjs(schedule.startDate)
            //         .set('minute', scheduleMinutes)
            //         .set('hour', scheduleHours)
            //         .set('second', 0)
            //         .set('millisecond', 0);

                // console.log('validated workflow schedule', workflow);
                // console.log('validated workflow startDay:', startDay.format('YYYY-MM-DD HH:mm:ss'), ', now:', dayjs().format('YYYY-MM-DD HH:mm:ss'));
            // });

            if (validatedWorkflows.length > 0) {
                await this._ensureWindow();
                validatedWorkflows.forEach((workflow) => this._executeRunWorkflow(workflow));
            }
        };

        const setRecentTimeout = () => {
            clearTimeout(this._scheduleTimer);
            const now = dayjs();

            let running = false;
            this._scheduleTimer = setTimeout(() => {
                if (running) {
                    return;
                }

                running = true;
                runWorkflows().finally(() => {
                    running = false;
                });
                // Recursive set timeout to check every 30 minutes
                setRecentTimeout();
            }, getRecentTime(now).valueOf() - now.valueOf()) as unknown as number;
        };

        // Meeting every 30 minutes
        const current = dayjs();
        const currentMinutes = current.get('minute');
        if (currentMinutes % workflowScheduleIntervalMinutes === 0) {
            runWorkflows();
        }
        // Set timeout to next 30 minutes
        setRecentTimeout();
    }

    private _initWorkflowTriggers() {
        // Emit notification of trigger when workflow done
        this.onWorkflowDone((ctx) => {
            const { workflow } = ctx;
            const emailTrigger = workflow.triggers?.find((trigger) => trigger.name === WorkflowTriggerName.EmailNotification);

            if (emailTrigger && workflow.tableId) {
                const listeners = this._workflowTriggerListeners.get(WorkflowTriggerName.EmailNotification);
                if (listeners) {
                    listeners.forEach((listener) => listener(workflow, ctx));
                }
            }
        });
    }

    private async _ensureWindow() {
        if (!this.workflowWindow) {
            const window = await chrome.windows.create({
                url: this._workflowWindowPath,
                width: 800,
                height: 600,
                focused: false,
            });
            this.workflowWindow = window;
        }

        return this.workflowWindow;
    }

    setWorkflowWindowPath(path: string) {
        this._workflowWindowPath = path;
    }

    /**
     * Create dependency list for scraper if not exist
     * @param scraperId
     * @returns
     */
    private _ensureScraperDependencyList(scraperId: string) {
        if (!this._scraperDependencyListMap.has(scraperId)) {
            this._scraperDependencyListMap.set(scraperId, new Set());
        }

        return this._scraperDependencyListMap.get(scraperId)!;
    }

    // Apply filter rule to filter the row that does not meet the condition
    private _applyFilterRule(data: IInitialSheet['rows'], workflow: IWorkflow) {
        const filterRule = workflow.rules.find((rule) => rule.name === WorkflowRuleName.FilterColumn) as WorkflowFilterColumnRule;

        if (!filterRule) {
            return data;
        }

        const workflowColumns = workflow.columns;
        const columnFilterRuleMap = filterRule.payload.rules?.reduce((map, rule) => {
            map.set(rule.workflowColumnId, rule);

            return map;
        }, new Map<string, IWorkflowFilterRuleItem>());

        if (!columnFilterRuleMap) {
            return data;
        }

        return data.filter((row) => {
            const validationCollection = row.cells.map((cell, columnIndex) => {
                const workflowColumn = workflowColumns[columnIndex];
                const filterRule = columnFilterRuleMap.get(workflowColumn.id);
                if (!filterRule) {
                    return true;
                }

                return this.filterRuleValidator.validate(cell.text, filterRule);
            });

            const rowValidation = validationCollection.every((v) => v);

            return filterRule.payload.mode === WorkflowFilterMode.Remain
                ? rowValidation
                : !rowValidation;
        });
    }

    private _clearWorkflow(workflowId: string) {
        const shouldDeleteScraperIds = new Set<string>();
        this._scraperDependencyListMap.forEach((references, scraperId) => {
            if (references.has(workflowId)) {
                references.delete(workflowId);
            }

            if (references.size <= 0) {
                shouldDeleteScraperIds.add(scraperId);
            }
        });

        shouldDeleteScraperIds.forEach((scraperId) => {
            this._scraperService.stopScraper(scraperId);
            this._scraperDependencyListMap.delete(scraperId);
        });
    }

    /**
     * Run workflow
     * @param workflow
     * @returns
     */
    async runWorkflow(workflow: IWorkflow) {
        const workflowId = workflow.id!;

        const executeWorkflow = async () => {
            const window = await this._ensureWindow();

            const scraperIds = new Set<string>();

            const runScraperCallbacks: Array<(scraperMap: Map<string, IScraper>) => void> = [];

            const rawResult: ISheet_Row_Cell[][][] = [];

            function ensureCellCollection(r: number) {
                if (!rawResult[r]) {
                    rawResult[r] = [];
                }

                if (rawResult[r].length < workflow.columns.length) {
                    workflow.columns.forEach((c, columnIndex) => {
                        rawResult[r][columnIndex] = [];
                    });
                }

                return rawResult[r];
            }

            // Iterate over each column and run the scraper
            workflow.columns.forEach((column, columnIndex) => {
                column.sourceColumns.forEach((sourceColumn, sourceColumnIndex) => {
                    // Record the scraper id
                    scraperIds.add(sourceColumn.scraperId);
                    // the callback will run after all scraper done to generate column cells from the scraper response
                    runScraperCallbacks.push(async (scraperMap) => {
                        const scraper = scraperMap.get(sourceColumn.scraperId);
                        if (!scraper) {
                            return;
                        }
                        // Record scraper id with workflow id dependency list
                        this._ensureScraperDependencyList(scraper.id).add(workflowId);

                        // To run scraper
                        const scraperResponse = await this._scraperService.runScraper({
                            scraper,
                            windowId: window.id!,
                            onCreated(scraperTab) {
                                // Find scraper setting from workflow
                                const scraperSetting = workflow.scraperSettings.find((setting) => setting.scraperId === scraper.id);
                                if (!scraperSetting) {
                                    return;
                                }
                                const { mode, customValue } = scraperSetting;
                                // To timeout or count threshold to stop scraper
                                const threshold = mode === WorkflowScraperSettingMode.Custom && customValue
                                    ? scraper.mode === AutoExtractionMode.PageUrl
                                        ? new CountThreshold(customValue)
                                        : new TimeoutThreshold(customValue)
                                    : undefined;

                                if (!threshold) {
                                    return;
                                }
                                // For workflow scraper setting, to stop scraper when threshold is reached
                                threshold.onDone(() => {
                                    scraperTab.resolve(scraperTab.response);
                                });

                                if (threshold instanceof CountThreshold) {
                                    scraperTab.onPageChange(() => {
                                        threshold.count();
                                    });
                                }
                                if (threshold instanceof TimeoutThreshold) {
                                    scraperTab.registerRequestCallback(() => {
                                        threshold.start();
                                    });
                                }
                            },
                        });
                        // Workflow A column will reference to source column B column, we find the column index of source column B
                        const cellColumnIndex = scraper.columns.findIndex((c) => c.id === sourceColumn.columnId);

                        scraperResponse.rows.forEach((row, rowIndex) => {
                            // Get the cell value from the source column by column index
                            const cell = row.cells[cellColumnIndex];
                            // A workflow column maybe have multiple source columns, At first, we create a collection to store scraper cells
                            const cellCollection = ensureCellCollection(rowIndex)[columnIndex];

                            if (!cell) {
                                cellCollection[sourceColumnIndex] = { text: '', url: '', type: Sheet_Cell_Type_Enum.TEXT };
                            } else {
                                cellCollection[sourceColumnIndex] = cell;
                            }
                        });
                    });
                });
            });

            // Query scraper list of workflow required
            const scraperList = await this._scraperService.queryScrapersByIds(Array.from(scraperIds));

            const scraperMap = scraperList.reduce((map, scraper) => {
                map.set(scraper.id, scraper);
                return map;
            }, new Map<string, IScraper>());

            const runScraperPromises = runScraperCallbacks.map((callback) => callback(scraperMap));
            // Wait for all scraper done
            await Promise.all(runScraperPromises);

            const result = rawResult.map((rows) => {
                return {
                    cells: rows.map((cells, columnIndex) => {
                        const column = workflow.columns[columnIndex];
                        const mergedCell = mergeCells(cells, column.type as unknown as Sheet_Cell_Type_Enum);

                        return mergedCell;
                    }),
                };
            });

            return {
                url: scraperList[0].url,
                rows: this._applyFilterRule(result, workflow),
            };
        };

        const response = executeWorkflow();

        response.finally(() => {
            this.stopWorkflow(workflowId);
        });

        return response;
    }

    async _removeRunningWorkflowId(workflowId: string) {
        const runningIds = this._runningWorkflowIds$.value;
        if (!runningIds?.includes(workflowId)) {
            return;
        }

        const newRunningIds = runningIds.filter((runningId) => runningId !== workflowId);
        this._runningWorkflowIds$.next(newRunningIds);
    }

    async stopWorkflow(workflowId: string) {
        this._removeRunningWorkflowId(workflowId);
        this._clearWorkflow(workflowId);
    }

    async _addRunningWorkflowId(id: string) {
        const runningIds = this._runningWorkflowIds$.value;

        if (runningIds.includes(id)) {
            return false;
        }
        this._runningWorkflowIds$.next([id].concat(runningIds));

        return true;
    }

    private _closeWorkflowWindow() {
        const windowId = this.workflowWindow?.id;
        if (windowId) {
            chrome.windows.remove(windowId);
        }
        this.workflowWindow = undefined;

        this._scraperDependencyListMap.forEach((references, scraperId) => {
            this._scraperService.stopScraper(scraperId);
        });
        this._scraperDependencyListMap.clear();
    }

    updateWorkflow(workflow: IWorkflow) {
        return this._dataSource.update(workflow);
    }

    /**
     * Handle request to run workflow
     * @param workflow
     * @returns
     */
    private async _executeRunWorkflow(workflow: IWorkflow) {
        const workflowId = workflow.id!;

        const isAdded = await this._addRunningWorkflowId(workflowId);

        if (!isAdded) {
            return;
        }

        const res = await this.runWorkflow(workflow);

        // console.log('workflow done', workflow, res);
        if (res.rows.length <= 0) {
            return;
        }

        const callbacks = Array.from(this._onWorkflowDoneCallbacks);

        await Promise.all(callbacks.map((callback) => callback({ ...res, workflow })));

        // if (workflow.unitId) { // Workflow add incremental rows data to existing unit
        //     this._tableService.appendWorkflowRows(workflow.unitId, {
        //         workflow,
        //         rows: res.rows,
        //     });
        //     // const removeDuplicatesColumnIds = workflow.rules.find((rule) => rule.name === WorkflowRuleName.RemoveDuplicate)?.payload;
        //     // const columnIndexes = removeDuplicatesColumnIds && removeDuplicatesColumnIds.length > 0
        //     //     ? removeDuplicatesColumnIds.map((columnId) => workflow.columns.findIndex((column) => column.id === columnId))
        //     //     : undefined;

        //     // const apiResponse = await crxRequest.addRowCells({
        //     //     unitId: workflow.unitId,
        //     //     rows: res.rows,
        //     //     columnIndexes,
        //     // });
        //     // Add row cells failed
        //     // if (apiResponse.error.code !== 1) {
        //     //     return;
        //     // }
        // } else { // Workflow create new unit
        //     const initialSheet = createEmptyInitialSheet();

        //     initialSheet.sheetName = workflow.name;
        //     initialSheet.rows = res.rows;
        //     initialSheet.columnName = workflow.columns.map((c) => c.name);

        //     this._tableService.addTable({
        //         record: {
        //             // id: generateRandomId(),
        //             recordType: TableRecordTypeEnum.WorkflowSheet,
        //             title: workflow.name,
        //             sourceUrl: res.url,
        //         },
        //         sheets: [initialSheet],
        //         text: '',
        //         triggerId: workflowId,
        //     });

        //     // const task = await handleAddTask({
        //     //     recordType: RecordType.WorkflowSheet,
        //     //     text: '',
        //     //     time: Date.now(),
        //     //     title: workflow.name,
        //     //     originUrl: res.url,
        //     //     sheets: [initialSheet],
        //     //     triggerId: workflowId,
        //     // });

        //     // const unitId = task?.data.unitId;
        //     const unitId = '';
        //     if (unitId) {
        //         workflow.unitId = unitId;
        //         this._dataSource.update({ ...workflow, unitId });
        //     }
        // }

        // this._onWorkflowDone$.next({ workflow, rows: res.rows });
    }

    addTriggerListener(triggerName: WorkflowTriggerName, callback: (workflow: IWorkflow, context: IWorkflowDoneContext) => void) {
        const { _workflowTriggerListeners } = this;
        if (!_workflowTriggerListeners.has(triggerName)) {
            _workflowTriggerListeners.set(triggerName, new Set());
        }

        _workflowTriggerListeners.get(triggerName)!.add(callback);
    }

    onWorkflowDone(callback: (ctx: IWorkflowDoneContext) => void) {
        this._onWorkflowDoneCallbacks.add(callback);

        return () => {
            this._onWorkflowDoneCallbacks.delete(callback);
        };
    }

    async pushWorkflowList(params: IGetWorkflowListParams) {
        return pushDataSource(WorkflowDataSourceKeyEnum.WorkflowList, await this._dataSource.getList(params));
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (req: RunWorkflowMessage
            | StopWorkflowMessage
            | DeleteWorkflowMessage
            | CreateWorkflowMessage
            | UpdateWorkflowMessage
            | GetDataSourceMessage<WorkflowDataSourceKeyEnum.WorkflowList, IGetWorkflowListParams>
            | GetDataSourceMessage<WorkflowDataSourceKeyEnum.RunningWorkflowIds>, sender) => {
            switch (req.type) {
                case WorkflowMessageTypeEnum.CreateWorkflow: {
                    const { payload } = req;

                    const workflow = await this._dataSource.add(payload.workflow);

                    if (payload.toRun) {
                        this._executeRunWorkflow(workflow);
                    }

                    this.pushWorkflowList({ pageSize: defaultPageSize });
                    break;
                }
                case WorkflowMessageTypeEnum.RunWorkflow: {
                    this._executeRunWorkflow(req.payload);

                    break;
                }
                case WorkflowMessageTypeEnum.DeleteWorkflow: {
                    await this._dataSource.delete(req.payload);

                    this.pushWorkflowList({ pageSize: defaultPageSize });
                    break;
                }

                case WorkflowMessageTypeEnum.UpdateWorkflow: {
                    const { payload } = req;

                    this._dataSource.update(payload.workflow);

                    if (payload.toRun) {
                        this._executeRunWorkflow(payload.workflow);
                    }
                    break;
                }

                case WorkflowMessageTypeEnum.StopWorkflow: {
                    this.stopWorkflow(req.payload);
                    break;
                }

                case ClipsheetMessageTypeEnum.GetDataSource: {
                    const { payload } = req;
                    if (payload.key === WorkflowDataSourceKeyEnum.WorkflowList) {
                        const list = await this._dataSource.getList(payload.params);

                        pushDataSource(WorkflowDataSourceKeyEnum.WorkflowList, list);
                    }
                    if (payload.key === WorkflowDataSourceKeyEnum.RunningWorkflowIds) {
                        pushDataSource(WorkflowDataSourceKeyEnum.RunningWorkflowIds, this._runningWorkflowIds$.value);
                    }
                }
            }
        });

        chrome.windows.onRemoved.addListener((windowId) => {
            if (windowId === this.workflowWindow?.id) {
                this._runningWorkflowIds$.next([]);
            }
        });
    }
}

