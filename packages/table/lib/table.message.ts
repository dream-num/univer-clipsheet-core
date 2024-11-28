
import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';
import type { IInitialSheet } from './parser';
import type { ITableRecord, TableRecordTypeEnum } from './table';

export interface IGetTableRecordsParams {
    page: number;
    pageSize: number;
    recordTypes?: TableRecordTypeEnum[];
}

export enum TableMessageTypeEnum {
    ScrapTables = 'scrap_tables',
    ResponseScrapTables = 'response_scrap_tables',
    DeleteTableRecord = 'delete_table_record',
    // RequestTableRecords = 'request_table_records',
    // ScrapAllTables = 'scrap_all_tables',
}

export enum TableDataSourceKeyEnum {
    TableRecords = 'table_records',
}

export enum TableStorageKeysEnum {
    // TableRecords = 'table_records',
    TableRecords = 'table_records',
    InProgressTableRecord = 'in_progress_table_record',
}

// Table Messages
export type ScrapTablesMessage = IMessageWithPayload<TableMessageTypeEnum.ScrapTables, {
    text: string;
    sheets: IInitialSheet[];
    record: Omit<ITableRecord, 'createdAt'>;
}>;

export type ResponseScrapTablesMessage = IMessageWithPayload<TableMessageTypeEnum.ResponseScrapTables, {
    success: boolean;
    id: string;
    // link: string;
}>;

export type DeleteTableRecordMessage = IMessageWithPayload<TableMessageTypeEnum.DeleteTableRecord, string>;

// export type RequestTableRecordsMessage = IMessageWithPayload<TableMessageTypeEnum.RequestTableRecords, null | {
//     page: number;
//     pageSize: number;
// }>;

// Util methods
export function deleteTaskRecord(id: string) {
    const msg: DeleteTableRecordMessage = {
        type: TableMessageTypeEnum.DeleteTableRecord,
        payload: id,
        // payload: {
        //     id,
        //     index,
        // },
    };
    chrome.runtime.sendMessage(msg);
}

