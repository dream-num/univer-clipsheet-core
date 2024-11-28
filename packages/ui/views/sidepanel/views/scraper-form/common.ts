import { t } from '@univer-clipsheet-core/locale';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import type { SetStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum } from '@univer-clipsheet-core/shared';

export function submitValidate(scraper: Pick<IScraper, 'name' | 'columns'>, handleFail: (message: string) => void) {
    if (scraper.name.trim() === '') {
        handleFail(t('ScraperNameCannotBeEmpty'));
        return false;
    }
    if (scraper.columns.length <= 0) {
        handleFail(t('ScraperNeedsAtLeastOneColumn'));
        return false;
    }

    return true;
}

export const setStorageScraperData = (scraper: IScraper) => {
    const msg: SetStorageMessage = {
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: ScraperStorageKeyEnum.CurrentScraper,
            value: scraper,
        },
    };
    chrome.runtime.sendMessage(msg);
};
