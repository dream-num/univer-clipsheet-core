
import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';
import type { IInitialSheet } from './parser';
import type { ITableRecord, TableRecordTypeEnum } from './table';

export const inProgressTableRecordId = 'IN_PROGRESS_TABLE_RECORD';

export interface ITableRecordsResponse {
    data: ITableRecord[];
    total: number;
}

export interface IGetTableRecordsParams {
    page: number;
    pageSize: number;
    ids?: string[];
    recordTypes?: TableRecordTypeEnum[];
}

export enum TableMessageTypeEnum {
    ScrapTables = 'scrap_tables',
    ResponseScrapTables = 'response_scrap_tables',
    DeleteTableRecord = 'delete_table_record',
}

export enum TableDataSourceKeyEnum {
    TableRecords = 'table_records',
}

export enum TableStorageKeyEnum {
    TableRecords = 'table_records',
    InProgressTableRecord = 'in_progress_table_record',
    CurrentTableRecord = 'current_table_record',
    TableSheetsPrefix = 'table_sheets_',
}

// Table Messages
export type ScrapTablesMessage = IMessageWithPayload<TableMessageTypeEnum.ScrapTables, {
    text: string;
    sheets: IInitialSheet[];
    record: Omit<ITableRecord, 'createdAt' | 'value' | 'id'>;
    triggerId?: string;
}>;

export type ResponseScrapTablesMessage = IMessageWithPayload<TableMessageTypeEnum.ResponseScrapTables, {
    success: boolean;
    id: string;
}>;

export type DeleteTableRecordMessage = IMessageWithPayload<TableMessageTypeEnum.DeleteTableRecord, string>;

// Util methods
export function deleteTaskRecord(id: string) {
    const msg: DeleteTableRecordMessage = {
        type: TableMessageTypeEnum.DeleteTableRecord,
        payload: id,
    };
    chrome.runtime.sendMessage(msg);
}

