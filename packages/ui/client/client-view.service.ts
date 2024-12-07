import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { IScraper } from '@univer-clipsheet-core/scraper';
import type { IInitialSheet, ResponseScrapTablesMessage } from '@univer-clipsheet-core/table';

export class ClientViewService {
    private _scrapedTableId: string | null = null;

    private _onCreateScraper$ = new ObservableValue<[IScraper, IInitialSheet] | null>(null);
    private _onTableScraped$ = new ObservableValue<ResponseScrapTablesMessage['payload'] | null>(null);
    private _onViewScrapedDataClick$ = new ObservableValue<string | null>(null);

    constructor() {
        this.triggerViewScrapedDataClick = this.triggerViewScrapedDataClick.bind(this);
    }

    triggerViewScrapedDataClick() {
        // console.log('triggerViewScrapedDataClick', this._scrapedTableId);
        this._onViewScrapedDataClick$.next(this._scrapedTableId);
    }

    triggerCreateScraper(scraper: IScraper, sheet: IInitialSheet) {
        this._onCreateScraper$.next([scraper, sheet]);
    }

    triggerTableScraped(res: ResponseScrapTablesMessage['payload']) {
        this._scrapedTableId = res.id;
        this._onTableScraped$.next(res);
    }

    onViewScrapedDataClick(callback: (tableId: string) => void) {
        return this._onViewScrapedDataClick$.subscribe((tableId) => tableId && callback(tableId));
    }

    onCreateScraper(callback: (scraper: IScraper, sheet: IInitialSheet) => void) {
        return this._onCreateScraper$.subscribe((args) => args && callback(...args));
    }

    onTableScraped(callback: (res: ResponseScrapTablesMessage['payload']) => void) {
        return this._onTableScraped$.subscribe((res) => res && callback(res));
    }
}
