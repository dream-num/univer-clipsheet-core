import type { IScraper } from '@lib/scraper';
import { Channel } from '@univer-clipsheet-core/shared';
import type { ISheet_Row } from '@univer-clipsheet-core/table';

export interface ScraperTaskChannelRequest {
    scraper: IScraper;
}
export interface ScraperTaskChannelResponse {
    rows: ISheet_Row[];
    done?: boolean;
}

export const getScraperTaskChannelName = (id: string) => `ScraperTaskChannel-${id}`;
export const scraperTaskChannel = new Channel<ScraperTaskChannelRequest, ScraperTaskChannelResponse>();
