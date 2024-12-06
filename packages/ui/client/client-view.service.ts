import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import type { IInitialSheet, ResponseScrapTablesMessage } from '@univer-clipsheet-core/table';

export class ClientViewService {
    private _onCreateScraper$ = new ObservableValue<[IScraper, IInitialSheet] | null>(null);
    private _onTableScraped$ = new ObservableValue<ResponseScrapTablesMessage['payload'] | null>(null);

    tableLink$ = new ObservableValue<string>('');

    setTableLink(link: string) {
        this.tableLink$.next(link);
    }

    triggerCreateScraper(scraper: IScraper, sheet: IInitialSheet) {
        this._onCreateScraper$.next([scraper, sheet]);
    }

    triggerTableScraped(res: ResponseScrapTablesMessage['payload']) {
        this._onTableScraped$.next(res);
    }

    onCreateScraper(callback: (scraper: IScraper, sheet: IInitialSheet) => void) {
        return this._onCreateScraper$.subscribe((args) => args && callback(...args));
    }

    onTableScraped(callback: (res: ResponseScrapTablesMessage['payload']) => void) {
        return this._onTableScraped$.subscribe((res) => res && callback(res));
    }
}