import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';
import type { IScraper } from '../scraper';

export enum ScraperDataSourceKeyEnum {
    ScraperList = 'scraper_list',
    RunningScraperIds = 'running_scraper_ids',
}

export interface IGetScraperListParams {
    pageSize: number;
    filterRecordIds?: string[];
};

export enum ScraperStorageKeyEnum {
    CurrentScraper = 'current_scraper',
    ScraperList = 'scraper_list',
}

export enum ScraperMessageTypeEnum {
    RunScraper = 'run_scraper',
    StopScraper = 'stop_scraper',
    DeleteScraper = 'delete_scraper',
    CreateScraper = 'create_scraper',
    UpdateScraper = 'update_scraper',
    RunScraperFailed = 'run_scraper_failed',
    PreviewScraperTable = 'preview_scraper_table',
}

export type RunScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.RunScraper, IScraper>;
export type CreateScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.CreateScraper, {
    scraper: IScraper;
    toRun?: boolean;
}>;
export type UpdateScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.UpdateScraper, {
    scraper: IScraper;
    toRun?: boolean;
}>;
export type StopScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.StopScraper, {
    id: string;
    toSave: boolean;
}>;
export type DeleteScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.DeleteScraper, string>;

export type RunScraperFailedMessage = IMessageWithPayload<ScraperMessageTypeEnum.RunScraperFailed, IScraper>;
export type PreviewScraperTableMessage = IMessageWithPayload<ScraperMessageTypeEnum.PreviewScraperTable, {
    selector: string;
    columnNames: string[];
}>;

export function sendCreateScraperMessage(payload: CreateScraperMessage['payload']) {
    const msg: CreateScraperMessage = {
        type: ScraperMessageTypeEnum.CreateScraper,
        payload,
    };
    chrome.runtime.sendMessage(msg);
}
