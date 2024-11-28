import type { GetDataSourceMessage, IMessage, IMessageWithPayload, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum } from '@univer-clipsheet-core/shared';
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
    // RunningScraperIds = 'running_scraper_ids',
    ScraperList = 'scraper_list',
}

export enum ScraperMessageTypeEnum {
    RunScraper = 'run_scraper',
    StopScraper = 'stop_scraper',
    DeleteScraper = 'delete_scraper',
    CreateScraper = 'create_scraper',
    UpdateScraper = 'update_scraper',
    RunScraperFailed = 'run_scraper_failed',
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
export type StopScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.StopScraper, string>;
export type DeleteScraperMessage = IMessageWithPayload<ScraperMessageTypeEnum.DeleteScraper, string>;

export type RunScraperFailedMessage = IMessageWithPayload<ScraperMessageTypeEnum.RunScraperFailed, IScraper>;

export const setCurrentScraper = (scraper: IScraper) => {
    chrome.runtime.sendMessage({
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: ScraperStorageKeyEnum.CurrentScraper,
            value: scraper,
        },
    });
};
