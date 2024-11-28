import type { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';

export const PAGE_URL_SLOT = '{pageNo}' as const;

export enum ScraperErrorCode {
    Stop = 1,
    InvalidURL,
}

export enum AutoExtractionMode {
    None = 0,
    Click,
    Scroll,
    PageUrl,
}

export interface IScrollAutoExtractionConfig {
    minInterval: number;
    maxInterval: number;
    // targetSelector: string;
}

export interface IClickAutoExtractionConfig extends IScrollAutoExtractionConfig {
    buttonSelector: string;

}

export interface IPageUrlAutoExtractionConfig {
    // targetSelector: string;
    templateUrl: string;
    startPage: number;
    endPage: number;
}

export type AutoExtractionConfig = IScrollAutoExtractionConfig | IClickAutoExtractionConfig | IPageUrlAutoExtractionConfig;

// export enum ScraperColumnType {
//     Text = 1,
//     Url,
//     Image,
//     Video,
// }

export interface IDrillDownConfig {
    parentId?: string;
    columns: IDrillDownColumn[];
    minInterval: number;
    maxInterval: number;
}

export interface IScraperColumn {
    id: string;
    name: string;
    type: Sheet_Cell_Type_Enum;
    index: number;
    url?: string;
    drillDownConfig?: IDrillDownConfig;
}

export interface IDrillDownColumn extends Omit<IScraperColumn, 'index'> {
    selector: string;
}

export interface IScraper {
    id: string;
    url: string;
    name: string;
    description?: string;
    // running: boolean;
    targetSelector: string;
    mode: AutoExtractionMode;
    config?: AutoExtractionConfig;
    columns: IScraperColumn[];
    createAt: number;
    updateAt?: number;
}

export interface IScraperRecord {
    createAt: number;
    updateAt?: number;
    recordId: string;
    json: IScraper;
    title: string;
}
