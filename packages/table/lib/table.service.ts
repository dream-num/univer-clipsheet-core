
import type { GetDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, defaultPageSize, generateRandomId, pushDataSource, setAndPushStorage, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { Inject } from '@wendellhu/redi';
import type { AddTablePayload } from './table-data-source';
import { ITableDataSource } from './table-data-source';
import type { DeleteTableRecordMessage, IGetTableRecordsParams, ResponseScrapTablesMessage, ScrapTablesMessage } from './table.message';
import { inProgressTableRecordId, TableDataSourceKeyEnum, TableMessageTypeEnum, TableStorageKeyEnum } from './table.message';
import type { ITableRecord } from './table';

export class TableService {
    private _latestParams: IGetTableRecordsParams = {
        page: 1,
        pageSize: defaultPageSize,
    };

    constructor(
        @Inject(ITableDataSource) private _tableDataSource: ITableDataSource
    ) {
    }

    addTable(_payload: ScrapTablesMessage['payload']) {
        const payload = _payload as AddTablePayload;
        // Add id to table record
        payload.record.id = generateRandomId();

        const inProgressTableRecord: ITableRecord = {
            ...payload.record,
            id: inProgressTableRecordId,
            createdAt: Date.now(),
            recordType: payload.record.recordType,
            value: '',
        };

        setAndPushStorage(TableStorageKeyEnum.InProgressTableRecord, inProgressTableRecord);

        const response = this._tableDataSource.add(payload).finally(() => {
            setAndPushStorage(TableStorageKeyEnum.InProgressTableRecord, null);
            setAndPushStorage(UIStorageKeyEnum.Loading, false);
        });

        return response;
    }

    deleteTable(id: string) {
        return this._tableDataSource.delete(id);
    }

    async pushTableRecords(_params?: IGetTableRecordsParams) {
        if (_params) {
            this._latestParams = _params;
        }

        return pushDataSource(TableDataSourceKeyEnum.TableRecords, await this._tableDataSource.getList(this._latestParams));
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (req: DeleteTableRecordMessage
            | GetDataSourceMessage<TableDataSourceKeyEnum.TableRecords, IGetTableRecordsParams>
            | ScrapTablesMessage
        , sender) => {
            switch (req.type) {
                case ClipsheetMessageTypeEnum.GetDataSource: {
                    const { payload } = req;
                    if (payload.key === TableDataSourceKeyEnum.TableRecords) {
                        this.pushTableRecords(payload.params);
                    }

                    break;
                }
                case TableMessageTypeEnum.DeleteTableRecord: {
                    await this.deleteTable(req.payload);

                    this.pushTableRecords();
                    break;
                }
                case TableMessageTypeEnum.ScrapTables: {
                    const { payload } = req;

                    const res: ResponseScrapTablesMessage = {
                        type: TableMessageTypeEnum.ResponseScrapTables,
                        payload: {
                            success: false,
                            id: '',
                        },
                    };

                    const senderTabId = sender.tab?.id;

                    this.addTable(payload)
                        .then((id) => {
                            res.payload.success = true;
                            res.payload.id = id;
                            senderTabId && chrome.tabs.sendMessage(senderTabId, res);
                            this.pushTableRecords();
                        })
                        .catch(() => {
                            console.error('TableService:ScrapTables', 'Failed to add table');
                            senderTabId && chrome.tabs.sendMessage(senderTabId, res);
                        });
                    break;
                }
            }
        });
    }
}

