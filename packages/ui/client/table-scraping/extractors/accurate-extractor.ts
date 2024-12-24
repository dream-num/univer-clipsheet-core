import type { ITableApproximationExtractionParam } from '@univer-clipsheet-core/table';
import { checkElementApproximationTable, checkElementTable, getTableApproximationByElement, getTableExtractionParamRows, LazyLoadElements, LazyLoadTableElements } from '@univer-clipsheet-core/table';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import { IExtractor } from './extractor';

export type UnionLazyLoadElements = LazyLoadElements | LazyLoadTableElements;

function last<T = unknown>(ary: T[]): T | undefined {
    return ary[ary.length - 1];
}

export class TableElementExtractor extends IExtractor {
    target$: ObservableValue<HTMLTableElement>;

    constructor(table: HTMLTableElement) {
        super();
        this.target$ = new ObservableValue(table);
        this.target$.subscribe(() => {
            this.lazyLoadElements$.next(null);
        });
    }

    get target() {
        return this.target$.value;
    }

    setTarget(el: HTMLTableElement) {
        this.target$.next(el);
    }

    override get elementRows() {
        return this.target$.value?.querySelectorAll('tbody')[0]?.querySelectorAll('tr').length ?? 0;
    }

    override buildLazyLoadElements() {
        const lazyLoadElements = new LazyLoadTableElements([this.target]);
        this.lazyLoadElements$.next(lazyLoadElements);
        return lazyLoadElements;
    }
}

export class TableLikeElementExtractor extends IExtractor {
    private _tableExtractionParams$: ObservableValue< ITableApproximationExtractionParam>;

    target$: ObservableValue<HTMLElement>;

    constructor(params: ITableApproximationExtractionParam) {
        super();
        this._tableExtractionParams$ = new ObservableValue(params);
        this.target$ = new ObservableValue(params.element as HTMLElement);
        this._tableExtractionParams$.subscribe((params) => {
            this.target$.next(params.element as HTMLElement);
            this.lazyLoadElements$.next(null);
        });
    }

    get tableExtractionParams() {
        return this._tableExtractionParams$.value;
    }

    setTableExtractionParams(params: ITableApproximationExtractionParam) {
        this._tableExtractionParams$.next(params);
    }

    override get elementRows() {
        return getTableExtractionParamRows(this._tableExtractionParams$.value);
    }

    override buildLazyLoadElements() {
        const tableExtractionParams = this._tableExtractionParams$.value;
        const lazyLoadElements = new LazyLoadElements([tableExtractionParams], { isGrandchild: tableExtractionParams.grandChildrenLevel !== undefined });
        this.lazyLoadElements$.next(lazyLoadElements);

        return lazyLoadElements;
    }

    dispose(): void {
        super.dispose();
        this._tableExtractionParams$.dispose();
    }
}

export function findLazyLoadElementsParams(el: HTMLElement) {
    const tableElement = last(checkElementTable(el));
    const tableExtractionParams = last(checkElementApproximationTable(el));

    const tableLikeElement = tableExtractionParams?.element;
    if (tableLikeElement && tableElement?.contains(tableLikeElement)) {
        return tableExtractionParams;
    } else if (tableElement) {
        return tableElement;
    } else if (tableExtractionParams) {
        return tableExtractionParams;
    } else {
        return null;
    }
}

export function findUpperTableExtractionParams(upperElements: HTMLElement[], isGrandchild: boolean) {
    const params = upperElements
        .map((el) => getTableApproximationByElement(el, isGrandchild))
        .filter((param) => Boolean(param)) as ITableApproximationExtractionParam[];

    if (params.length <= 0) {
        return;
    }

    const tableLikeParam = params.reduce((a, b) => {
        return getTableExtractionParamRows(a) > getTableExtractionParamRows(b) ? a : b;
    });

    return tableLikeParam;
}
