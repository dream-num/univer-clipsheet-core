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

export const triggerRecordTypes = [TableRecordTypeEnum.ScraperSheet, TableRecordTypeEnum.WorkflowSheet];

export interface ITableRecord<V = string> {
    id: string;
    recordType: TableRecordTypeEnum;
    title: string;
    sourceUrl: string;
    createdAt: number;
    updateAt?: number;
    triggerId?: string;
    value: V;
}

