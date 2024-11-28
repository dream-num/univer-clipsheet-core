
import { Inject } from '@wendellhu/redi';
import type { GetDataSourceMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum } from '@univer-clipsheet-core/shared';
import type { ITableRecord, TableRecordTypeEnum } from './table';
import type { DeleteTableRecordMessage, IGetTableRecordsParams, ScrapTablesMessage } from './table.message';
import { TableDataSourceKeyEnum, TableMessageTypeEnum, TableStorageKeysEnum } from './table.message';
import { ITableDataSource } from './table-data-source';
import type { IInitialSheet } from './parser';

// interface ITableManagerParams {
//     page: number;
//     pageSize: number;
//     recordTypes?: TableRecordTypeEnum[];
// }

// async function ensureStorageTasks(key: TableStorageKeysEnum.Table | StorageKeys.AllSheetsTable) {
//     const tasks = await getStorage(key);

//     return (Array.isArray(tasks) ? tasks : []).filter(Boolean);
// }

// interface ITableDataSource {
//     addTask(task: ITask): Promise<void>;
//     deleteTask(taskId: string): Promise<void>;
//     getTable(params: ITableManagerParams): Promise<{
//         tasks: ITask[];
//         total: number;
//     }>;
// }

// class LocalTableDataSource implements ITableDataSource {
//     async addTask(task: ITask): Promise<void> {
//         const storageKey = task.recordType === RecordType.WholeSheet ? StorageKeys.AllSheetsTable : StorageKeys.Table;
//         const Table = await ensureStorageTasks(storageKey);

//         await setStorage(storageKey, [task].concat(Table || []));
//     }

//     async deleteTask(taskId?: string): Promise<void> {
//         const Table = await ensureStorageTasks(StorageKeys.Table);

//         return setStorage(StorageKeys.Table, Table.filter((task) => task.id !== taskId));
//     }

//     async getTable(params: ITableManagerParams): Promise<{ tasks: ITask[]; total: number }> {
//         const storageKey = params.recordTypes?.[0] === RecordType.WholeSheet ? StorageKeys.AllSheetsTable : StorageKeys.Table;
//         const TableResponse = ensureStorageTasks(storageKey);

//         return TableResponse.then((_tasks: ISheetTask[]) => {
//             const tasks = Array.isArray(_tasks) ? _tasks : [];

//             return {
//                 tasks,
//                 total: tasks.length,
//             };
//         });
//     }
// }

// class RemoveTableDataSource {
//     async addTask(task: ITask): Promise<void> {
//     }

//     async deleteTask(taskId: string): Promise<void> {
//         crxRequest.deleteTask(String(taskId));
//     }

//     async getTable(params: ITableManagerParams): Promise<{ tasks: ITask[]; total: number }> {
//         return crxRequest.collectedList(params).then((res) => {
//             return {
//                 tasks: (res.records || []).map((record) => {
//                     const { sheet } = record;
//                     const task: ITask = {
//                         id: record.id,
//                         recordType: record.recordType,
//                         data: {
//                             unitId: sheet.unitId,
//                             originUrl: sheet.originUrl,
//                             title: sheet.title,
//                             status: TaskStatus.Success,
//                             time: sheet.createdAt * 1000,
//                         },
//                     };

//                     return task;
//                 }),
//                 total: res.totalSize || 0,
//             };
//         });
//     }
// }

export class TableService {
    // private local$ = new ObservableValue<boolean>(true);
    // private _deleteTask$ = new ObservableValue<ITask | null>(null);
    // private _tasks: ITask[] = [];
    // private _params: ITableManagerParams = {
    //     page: 1,
    //     pageSize: 20,
    // };

    // private _localDataSource = new LocalTableDataSource();
    // private _remoteDataSource = new RemoveTableDataSource();

    constructor(
        @Inject(ITableDataSource) private _tableDataSource: ITableDataSource
        // @Inject(UserManager) private _userManager: UserManager
    ) {
        // this._subscribeMessages();

        // this.local$.subscribe(() => {
        //     if (this._params) {
        //         this.sendNewTable();
        //     }
        // });

        // this._userManager.onUserChanged((user) => {
        //     this.setLocal(user.anonymous !== false);
        // });
    }

    addTable(record: Omit<ITableRecord, 'createdAt'>) {
        return this._tableDataSource.add(record);
    }

    // addTableBySheets(sheets: IInitialSheet[], text?: string) {

    // }

    deleteTable(id: string) {
        return this._tableDataSource.delete(id);
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener((req: DeleteTableRecordMessage
            | GetDataSourceMessage<TableDataSourceKeyEnum.TableRecords, IGetTableRecordsParams>
            | ScrapTablesMessage
        ) => {
            switch (req.type) {
                case ClipsheetMessageTypeEnum.GetDataSource: {
                    const { payload } = req;
                    if (payload.key === TableDataSourceKeyEnum.TableRecords) {
                        const msg: PushDataSourceMessage = {
                            type: ClipsheetMessageTypeEnum.PushDataSource,
                            payload: {
                                key: TableDataSourceKeyEnum.TableRecords,
                                value: this._tableDataSource.getList(payload.params),
                            },
                        };

                        chrome.runtime.sendMessage(msg);
                    }

                    break;
                }
                case TableMessageTypeEnum.DeleteTableRecord: {
                    this.deleteTable(req.payload);

                    break;
                }
                case TableMessageTypeEnum.ScrapTables: {
                    const { payload } = req;

                    this.addTable(payload.record);
                    break;
                }
            }
        });
    }

    // listenMessage() {
    //     chrome.runtime.onMessage.addListener(async (req: DeleteTableRecordMessage
    //         | GetDataSourceMessage<TableDataSourceKeyEnum.TableRecords, IGetTableRecordsParams>) => {
    //         switch (req.type) {
    //             case ClipsheetMessageTypeEnum.GetDataSource: {
    //                 const { payload } = req;
    //                 if (payload.key === TableDataSourceKeyEnum.TableRecords) {
    //                     const msg: PushDataSourceMessage = {
    //                         type: ClipsheetMessageTypeEnum.PushDataSource,
    //                         payload: {
    //                             key: TableDataSourceKeyEnum.TableRecords,
    //                             value: this._tableDataSource.getList(payload.params),
    //                         },
    //                     };

    //                     chrome.runtime.sendMessage(msg);
    //                 }

    //                 break;
    //             }
    //             case TableMessageTypeEnum.DeleteTableRecord: {
    //                 this.deleteTable(req.payload);

    //                 break;
    //             }
    //         }
    //     });
    // }

    // get currentDataSource() {
    //     return this.local ? this._localDataSource : this._remoteDataSource;
    // }

    // get local() {
    //     return this.local$.value;
    // }

    // setLocal(local: boolean) {
    //     this.local$.next(local);
    // }

    // sendTable(params: {
    //     tasks: ITask[];
    //     total: number;
    //     recordTypes?: RecordType[];
    // }) {
    //     const { tasks, total, recordTypes = [] } = params;
    //     this._tasks = tasks;
    //     const msg: Message[MsgType.SendTable] = {
    //         type: MsgType.SendTable,
    //         tasks,
    //         total,
    //         recordTypes,
    //     };
    //     chrome.runtime.sendMessage(msg);
    // }

    // private _getVisibleStorageTasks(localTasks: ITask[]) {
    //     const { page, pageSize } = this._params;
    //     // slice tasks by page
    //     return localTasks.slice((page - 1) * pageSize, page * pageSize);
    // }

    // async getTable(params: ITableManagerParams) {
    //     this._params = params;

    //     const res = await this.currentDataSource.getTable(params);
    //     if (this.local) {
    //         res.tasks = this._getVisibleStorageTasks(res.tasks);
    //     }

    //     return res;
    // }

    // async sendNewTable() {
    //     const params = this._params;
    //     const taskParam = await this.getTable(params);
    //     this.sendTable({ ...taskParam, recordTypes: params.recordTypes });
    // }

    // async deleteTask(index, _taskId?: string) {
    //     if (this.local) {
    //         return this._localDataSource.deleteTask(_taskId);
    //     } else {
    //         const taskId = _taskId || this._tasks[index].id;
    //         return this._remoteDataSource.deleteTask(String(taskId));
    //     }
    // }

    // async addTask(task: ITask) {
    //     this.currentDataSource.addTask(task);
    // }

    // onDeleteTask(callback: Parameters<typeof this._deleteTask$.subscribe>[0]) {
    //     return this._deleteTask$.subscribe(callback);
    // }

    // listenChromeMessage() {
    //     chrome.runtime.onMessage.addListener(async (msg: MessageItem) => {
            // switch (msg.type) {
            //     case MsgType.RequestTable: {
            //         const taskParam = await this.getTable(msg);
            //         this.sendTable({ ...taskParam, recordTypes: msg.recordTypes });
            //         break;
            //     }
            //     case MsgType.DeleteTask: {
            //         await this.deleteTask(msg.index, msg.taskId);
            //         this.sendNewTable();
            //         break;
            //     }
            //     case MsgType.GetData: {
            //         if (msg.key === DataSourceKeys.DataSourceSheets) {
            //             const res = await crxRequest.collectedList({
            //                 page: 1,
            //                 pageSize: defaultPageSize,
            //                 recordTypes: [RecordType.ScraperSheet, RecordType.WorkflowSheet],
            //             });

            //             sendDataSource(DataSourceKeys.DataSourceSheets, res.records);
            //         }
            //         break;
            //     }
            // }
    //     });
    // }
}

