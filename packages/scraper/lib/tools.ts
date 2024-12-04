import type { PushStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, isFunction, promisifyMessage } from '@univer-clipsheet-core/shared';
import { AutoExtractionMode, type IScraper } from './scraper';
import { ScraperStorageKeyEnum } from './scraper-service';

export function createScraper(): IScraper {
    return {
        id: '',
        mode: AutoExtractionMode.None,
        name: '',
        url: '',
        columns: [],
        targetSelector: '',
        createAt: Date.now(),
    };
}

export const setCurrentScraper = (setScraper: IScraper | ((old: IScraper) => IScraper)) => {
    const postMessage = (scraper: IScraper) => {
        chrome.runtime.sendMessage({
            type: ClipsheetMessageTypeEnum.SetStorage,
            payload: {
                key: ScraperStorageKeyEnum.CurrentScraper,
                value: scraper,
            },
        });
    };
    if (isFunction(setScraper)) {
        chrome.runtime.sendMessage({
            type: ClipsheetMessageTypeEnum.GetStorage,
            payload: ScraperStorageKeyEnum.CurrentScraper,
        });

        promisifyMessage<PushStorageMessage<IScraper>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushStorage && msg.payload.key === ScraperStorageKeyEnum.CurrentScraper)
            .then((res) => {
                const oldScraper = res.payload.value;
                if (!oldScraper) {
                    return;
                }
                const newScraper = setScraper(oldScraper);
                postMessage(newScraper);
            });
    } else {
        postMessage(setScraper);
    }
};
