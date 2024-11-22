import { ClipSheetMessageTypeEnum } from '@univer-clipsheet-core/shared';
import type { IScraper } from './scraper';

export enum StorageKeysEnum {
    CurrentScraper = 'current_scraper',
}

export const setCurrentScraper = (scraper: IScraper) => {
    chrome.runtime.sendMessage({
        type: ClipSheetMessageTypeEnum.SetStorage,
        payload: {
            key: StorageKeysEnum.CurrentScraper,
            value: scraper,
        },
    });
};
