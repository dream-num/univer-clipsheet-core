
import type { IScraper } from '@lib/scraper';
import { getStorage, setStorage } from '@univer-clipsheet-core/shared';
import { createIdentifier } from '@wendellhu/redi';
import type { IGetScraperListParams } from './scraper.message';
import { ScraperStorageKeyEnum } from './scraper.message';

export interface IScraperDataSource {
    getList(params: IGetScraperListParams): Promise<IScraper[]>;
    add(scraper: IScraper): Promise<IScraper>;
    update(scraper: IScraper): Promise<any>;
    delete(id: string): Promise<any>;
}

export const IScraperDataSource = createIdentifier('scraper-data-source');

const getStorageScraperList = async () => (await getStorage<IScraper[]>(ScraperStorageKeyEnum.ScraperList)) ?? [];

export class LocaleScraperDataSource implements IScraperDataSource {
    async getList(params: IGetScraperListParams): Promise<IScraper[]> {
        const list = await getStorageScraperList();
        const { filterRecordIds } = params;
        if (filterRecordIds) {
            return list.filter((s) => filterRecordIds.includes(s.id));
        }
        return list;
    }

    async add(scraper: IScraper): Promise<IScraper> {
        const scraperList = await getStorageScraperList();
        const newScraperList = [scraper].concat(scraperList);
        await setStorage(ScraperStorageKeyEnum.ScraperList, newScraperList);

        return scraper;
    }

    async delete(id: string): Promise<void> {
        const scraperList = await getStorageScraperList();
        await setStorage(ScraperStorageKeyEnum.ScraperList, scraperList.filter((s) => s.id !== id));
    }

    async update(scraper: IScraper): Promise<void> {
        const scraperList = await getStorageScraperList();
        const index = scraperList.findIndex((s) => s.id === scraper.id);
        if (index === -1) {
            return;
        }

        scraperList[index] = scraper;
        await setStorage(ScraperStorageKeyEnum.ScraperList, scraperList.slice());
    }
}
