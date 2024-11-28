import type { LazyLoadElements, LazyLoadTableElements } from './parser';

export type UnionLazyLoadElements = LazyLoadTableElements | LazyLoadElements;

export enum TableRecordStatusEnum {
    InProgress = 0,
    Success = 1,
    Error = 2,
    Loading = 3,
}

export enum TableRecordTypeEnum {
    Sheet = 'sheet',
    WholeSheet = 'wholeSheet',
    ScraperSheet = 'scraperSheet',
    WorkflowSheet = 'workflowSheet',
}

export interface ITableRecord {
    id: string;
    // status: TableRecordStatusEnum;
    recordType: TableRecordTypeEnum;
    createdAt: number;
    updateAt?: number;
    title: string;
    sourceUrl: string;
    // sheet: {
    // };
    // sheet: {
        // triggerId?: string;
        // unitId: string;
        // unitId: string;
    // };
}
