import type { IClickAutoExtractionConfig, IPageUrlAutoExtractionConfig, IScraper, IScrollAutoExtractionConfig } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode } from '@univer-clipsheet-core/scraper';
import { useEffect, useState } from 'react';
import { setStorageScraperData } from './common';

export function useAutoExtractionForm(scraperData: IScraper) {
    const [autoExtractionMode, setAutoExtractionMode] = useState<AutoExtractionMode>(scraperData.mode ?? AutoExtractionMode.None);

    const [scrollConfig, setScrollConfig] = useState<IScrollAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.Scroll ? scraperData.config as IScrollAutoExtractionConfig : { minInterval: 3, maxInterval: 6 });
    const [clickConfig, setClickConfig] = useState<IClickAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.Click ? scraperData.config as IClickAutoExtractionConfig : { minInterval: 3, maxInterval: 6, buttonSelector: '' });
    const [pageUrlConfig, setPageUrlConfig] = useState<IPageUrlAutoExtractionConfig>(scraperData.mode === AutoExtractionMode.PageUrl ? scraperData.config as IPageUrlAutoExtractionConfig : { startPage: 1, endPage: 10, templateUrl: '' });

    useEffect(() => {
        setAutoExtractionMode(scraperData.mode);

        if (!scraperData.config) {
            return;
        }

        switch (scraperData.mode) {
            case AutoExtractionMode.Scroll:
                setScrollConfig(scraperData.config as IScrollAutoExtractionConfig);
                break;
            case AutoExtractionMode.Click:
                setClickConfig(scraperData.config as IClickAutoExtractionConfig);
                break;
            case AutoExtractionMode.PageUrl:
                setPageUrlConfig(scraperData.config as IPageUrlAutoExtractionConfig);
                break;
        }
    }, [scraperData]);

    return {
        autoExtractionMode,
        setAutoExtractionMode,

        scrollConfig,
        setScrollConfig,

        clickConfig,
        setClickConfig,

        pageUrlConfig,
        setPageUrlConfig,
    };
}
