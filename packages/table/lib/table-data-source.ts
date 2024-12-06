import { getStorage, removeStorage, setStorage } from '@univer-clipsheet-core/shared';
import { createIdentifier } from '@wendellhu/redi';
import type { IInitialSheet } from './parser';
import type { ITableRecord } from './table';
import type { IGetTableRecordsParams, ScrapTablesMessage } from './table.message';
import { TableStorageKeyEnum } from './table.message';

type ScraperTableMessagePayload = ScrapTablesMessage['payload'];
export interface AddTablePayload extends ScraperTableMessagePayload {
    record: ScraperTableMessagePayload['record'] & Pick<ITableRecord, 'id'>;
}

export interface ITableDataSource<T = unknown> {
    add(table: AddTablePayload): Promise<string>;
    delete(taskId: string): Promise<void>;
    getList(params: IGetTableRecordsParams): Promise<{ data: ITableRecord[]; total: number }>;
}

export const ITableDataSource = createIdentifier<ITableDataSource>('table-data-source');

export const getStorageTableRecords = async () => (await getStorage<ITableRecord[]>(TableStorageKeyEnum.TableRecords)) ?? [];

export class LocalTableDataSource implements ITableDataSource {
    async add(payload: AddTablePayload) {
        const list = await getStorageTableRecords();

        const record: ITableRecord = {
            ...payload.record,
            createdAt: Date.now(),
            value: '',
            // value: payload.sheets,
        };

        await setStorage(TableStorageKeyEnum.TableSheetsPrefix + record.id, payload.sheets);
        await setStorage(TableStorageKeyEnum.TableRecords, [record].concat(list));

        return record.id;
    }

    async delete(id?: string): Promise<void> {
        removeStorage(TableStorageKeyEnum.TableSheetsPrefix + id);
        const list = await getStorageTableRecords();

        await setStorage(TableStorageKeyEnum.TableRecords, list.filter((table) => table.id !== id));
    }

    async getList(params: IGetTableRecordsParams): Promise<{ data: ITableRecord[]; total: number }> {
        const list = await getStorageTableRecords();

        return {
            data: list,
            total: list.length,
        };
    }
}
