import { AutoExtractionMode, type IScraper } from './scraper';

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
