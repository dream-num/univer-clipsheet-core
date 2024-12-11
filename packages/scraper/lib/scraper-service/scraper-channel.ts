import type { IScraper } from '@lib/scraper';
import { Channel } from '@univer-clipsheet-core/shared';
import type { ISheet_Row } from '@univer-clipsheet-core/table';

export interface ScraperTaskChannelRequest {
    scraper: IScraper;
}
export interface ScraperTaskChannelResponse {
    rows: ISheet_Row[];
    url?: string;
    done?: boolean;
}

export const getScraperTaskChannelName = (id: string) => `ScraperTaskChannel-${id}`;
export const isScraperTaskChannelName = (name: string) => name.startsWith('ScraperTaskChannel-');
export const scraperTaskChannel = new Channel<ScraperTaskChannelRequest, ScraperTaskChannelResponse>();
