import { useStorageValue } from '@lib/hooks';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { createScraper, ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';

export function useCurrentScraper() {
    return useStorageValue<IScraper>(ScraperStorageKeyEnum.CurrentScraper, createScraper());
}
