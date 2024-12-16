import { useStorageValue } from '@lib/hooks';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import { createScraper, ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import { useEffect, useState } from 'react';

export function useCurrentScraper() {
    const [scraper, setScraper] = useState<IScraper>(createScraper());
    const [remoteScraper, setRemoteScraper] = useStorageValue<IScraper>(ScraperStorageKeyEnum.CurrentScraper, scraper);

    useEffect(() => {
        if (JSON.stringify(remoteScraper) !== JSON.stringify(scraper)) {
            setScraper(remoteScraper);
        }
    }, [remoteScraper]);

    return [scraper, setRemoteScraper] as const;
}
