
import type { IScraper } from '@lib/scraper';
import { getStorage, setStorage } from '@univer-clipsheet-core/shared';
import { createIdentifier } from '@wendellhu/redi';
import type { IGetScraperListParams } from './scraper.message';
import { ScraperStorageKeyEnum } from './scraper.message';

// export const pushScraperListDataSource = (value: IScraper[]) => {
//     const msg: PushDataSourceMessage = {
//         type: ClipsheetMessageTypeEnum.PushDataSource,
//         payload: {
//             key: ScraperDataSourceKeyEnum.ScraperList,
//             value,
//         },

//     };
//     chrome.runtime.sendMessage(msg);
// };
// export const sendScraperListDataSource = (value: IScraper[]) => sendDataSource(DataSourceKeys.ScraperList, value);

// export interface IGetScraperListParams {
//     pageSize: number;
//     filterRecordIds?: string[];
// }

export interface IScraperDataSource {
    getList(params: IGetScraperListParams): Promise<IScraper[]>;
    add(scraper: IScraper): Promise<IScraper>;
    update(scraper: IScraper): Promise<any>;
    delete(id: string): Promise<any>;
}

export const IScraperDataSource = createIdentifier('scraper-data-source');

const getStorageScraperList = async () => (await getStorage<IScraper[]>(ScraperStorageKeyEnum.ScraperList)) ?? [];

export class ScraperLocaleDataSource implements IScraperDataSource {
    async getList(params: IGetScraperListParams): Promise<IScraper[]> {
        return getStorageScraperList();
    }

    async add(scraper: IScraper): Promise<IScraper> {
        const scraperList = await getStorageScraperList();
        const newScraperList = [scraper].concat(scraperList);
        await setStorage(ScraperStorageKeyEnum.ScraperList, newScraperList);
        // injector.get(StorageManager).setStorage(StorageKeys.ScraperList, newScraperList);

        return scraper;
    }

    async delete(id: string): Promise<void> {
        const scraperList = await getStorageScraperList();
        await setStorage(ScraperStorageKeyEnum.ScraperList, scraperList.filter((s) => s.id !== id));
        // injector.get(StorageManager).setStorage(StorageKeys.ScraperList, scraperList.filter((s) => s.id !== id));
    }

    async update(scraper: IScraper): Promise<void> {
        const scraperList = await getStorageScraperList();
        const index = scraperList.findIndex((s) => s.id === scraper.id);
        if (index === -1) {
            return;
        }

        scraperList[index] = scraper;
        await setStorage(ScraperStorageKeyEnum.ScraperList, scraperList.slice());
        // injector.get(StorageManager).setStorage(StorageKeys.ScraperList, scraperList.slice());
    }
}

// class RemoteScraperDataSource implements IScraperDataSource {
//     getScraperList(params: IGetScraperListParams): Promise<IScraper[]> {
//         return crxRequest.getScraperList(params).then((res) => {
//             return res.records.map((r) => {
//                 const scraper = r.json;
//                 scraper.id = r.recordId;
//                 scraper.createAt = r.createAt;
//                 scraper.updateAt = r.updateAt;

//                 return scraper;
//             });
//         });
//     }

//     async addScraper(scraper: IScraper): Promise<IScraper> {
//         const res = crxRequest.createScraper({
//             title: scraper.name,
//             json_obj: JSON.stringify(scraper),
//         }).then((res) => {
//             scraper.id = res.recordId;

//             return scraper;
//         });

//         return res;
//     }

//     async deleteScraper(id: string) {
//         return crxRequest.deleteScraper({ record_id: id });
//     }

//     async updateScraper(scraper: IScraper) {
//         return crxRequest.updateScraper({
//             record_id: scraper.id,
//             title: scraper.name,
//             json_obj: JSON.stringify(scraper),
//         });
//     }
// }

// export class ScraperDataSource implements IScraperDataSource {
//     private _pageSize = 20;

//     local$ = new ObservableValue(false);
//     private _localDataSource = new LocalScraperDataSource();
//     private _remoteDataSource = new RemoteScraperDataSource();

//     get currentDataSource(): IScraperDataSource {
//         return this.local$.value ? this._localDataSource : this._remoteDataSource;
//     }

//     private _sendNewScraperList() {
//         this.getScraperList({ pageSize: this._pageSize }).then((list) => {
//             sendScraperListDataSource(list);
//         });
//     }

//     async getScraperList(params: IGetScraperListParams): Promise<IScraper[]> {
//         this._pageSize = params.pageSize;
//         return this.currentDataSource.getScraperList(params);
//     }

//     async addScraper(scraper: IScraper): Promise<IScraper> {
//         const res = await this.currentDataSource.addScraper(scraper);
//         this._sendNewScraperList();
//         return res;
//     }

//     async deleteScraper(id: string) {
//         const res = await this.currentDataSource.deleteScraper(id);
//         this._sendNewScraperList();
//         return res;
//     }

//     async updateScraper(scraper: IScraper) {
//         const res = await this.currentDataSource.updateScraper(scraper);
//         this._sendNewScraperList();

//         return res;
//     }
// }
