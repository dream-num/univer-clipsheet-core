import type { IScraper } from '@univer-clipsheet-core/scraper';
import { AutoExtractionMode } from '@univer-clipsheet-core/scraper';
import { generateRandomId } from '@univer-clipsheet-core/shared';
import type { IWorkflowScraperSetting } from './workflow';
import { WorkflowScraperSettingMode } from './workflow';

export function createScraperSetting(scraper: IScraper): IWorkflowScraperSetting {
    return {
        id: generateRandomId(),
        scraperId: scraper.id,
        mode: WorkflowScraperSettingMode.All,
        customValue: scraper.mode === AutoExtractionMode.PageUrl ? 5 : 20,
    };
}
