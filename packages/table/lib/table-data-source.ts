import { createIdentifier } from '@wendellhu/redi';
import { getStorage, setStorage } from '@univer-clipsheet-core/shared';
import type { IGetTableRecordsParams } from './table.message';
import { TableStorageKeysEnum } from './table.message';
import type { ITableRecord } from './table';
import { TableRecordTypeEnum } from './table';

export interface ITableDataSource {
    add(table: Omit<ITableRecord, 'createdAt'>): Promise<void>;
    delete(taskId: string): Promise<void>;
    getList(params: IGetTableRecordsParams): Promise<{ data: ITableRecord[]; total: number }>;
}

export const ITableDataSource = createIdentifier<ITableDataSource>('table-data-source');

export const getStorageTableRecords = async () => (await getStorage<ITableRecord[]>(TableStorageKeysEnum.TableRecords)) ?? [];

export class LocalTableDataSource implements ITableDataSource {
    async add(table: Omit<ITableRecord, 'createdAt'>): Promise<void> {
        const list = await getStorageTableRecords();

        const record: ITableRecord = {
            ...table,
            createdAt: Date.now(),
        };
        await setStorage(TableStorageKeysEnum.TableRecords, [record].concat(list));
    }

    async delete(taskId?: string): Promise<void> {
        const list = await getStorageTableRecords();

        await setStorage(TableStorageKeysEnum.TableRecords, list.filter((table) => table.id !== taskId));
    }

    async getList(params: IGetTableRecordsParams): Promise<{ data: ITableRecord[]; total: number }> {
        const list = await getStorageTableRecords();

        return {
            data: list,
            total: list.length,
        };
    }
}
