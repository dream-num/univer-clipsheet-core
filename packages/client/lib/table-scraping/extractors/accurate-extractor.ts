import type { ITableApproximationExtractionParam } from '@univer-clipsheet-core/scraping';
import { checkElementApproximationTable, checkElementTable, getTableApproximationByElement, getTableExtractionParamRows, LazyLoadElements, LazyLoadTableElements } from '@univer-clipsheet-core/scraping';
import { ObservableValue } from '@univer-clipsheet-core/shared';

export type UnionLazyLoadElements = LazyLoadElements | LazyLoadTableElements;

// type LazyElementsListener = (lazyElements: UnionLazyLoadElements | null) => void;
// type TargetElementListener = (el: HTMLElement | null, prevEl?: HTMLElement | null) => void;

function last<T = unknown>(ary: T[]): T | undefined {
    return ary[ary.length - 1];
}

export abstract class IExtractor {
    lazyLoadElements$ = new ObservableValue<UnionLazyLoadElements | null>(null);
    abstract target$: ObservableValue<HTMLElement>;

    abstract get elementRows(): number;

    get lazyLoadElements() {
        return this.lazyLoadElements$.value;
    }

    get target() {
        return this.target$.value;
    }

    // elementRows: number;
    sheetRows() {
        return this.lazyLoadElements$.value?.rows ?? 0;
    }

    abstract buildLazyLoadElements(): UnionLazyLoadElements;
    dispose() {
        this.lazyLoadElements$.value?.dispose();
        this.target$.dispose();
    };
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

    // isGrandchild$: ObservableValue<boolean>;
    target$: ObservableValue<HTMLElement>;

    constructor(params: ITableApproximationExtractionParam) {
        super();
        this._tableExtractionParams$ = new ObservableValue(params);
        this.target$ = new ObservableValue(params.element as HTMLElement);
        // this.isGrandchild$ = new ObservableValue(params.grandChildrenLevel !== undefined);
        this._tableExtractionParams$.subscribe((params) => {
            this.target$.next(params.element as HTMLElement);
            this.lazyLoadElements$.next(null);
        });
        // this.isGrandchild$.subscribe(() => {
        //     const { lazyLoadElements$ } = this;
        //     if (lazyLoadElements$.value) {
        //         this.buildLazyLoadElements();
        //     }
        // });
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
        const lazyLoadElements = new LazyLoadElements([tableExtractionParams], tableExtractionParams.grandChildrenLevel !== undefined);
        this.lazyLoadElements$.next(lazyLoadElements);

        return lazyLoadElements;
    }

    dispose(): void {
        super.dispose();
        this._tableExtractionParams$.dispose();
        // this.isGrandchild$.dispose();
    }
}

export function findLazyLoadElementsParams(el: HTMLElement) {
    const tableElement = last(checkElementTable(el));
    const tableExtractionParams = last(checkElementApproximationTable(el));

    const tableLikeElement = tableExtractionParams?.element;
    if (tableLikeElement && tableElement?.contains(tableLikeElement)) {
        return tableExtractionParams;
        // return new TableLikeElementExtractor(tableExtractionParams);
    } else if (tableElement) {
        return tableElement;
        // return new TableElementExtractor(tableElement as HTMLTableElement);
    } else if (tableExtractionParams) {
        return tableExtractionParams;
        // return new TableLikeElementExtractor(tableExtractionParams);
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

// To help accurate extraction element between table or non-table element
// export class AccurateExtractor {
//     private _extractor: IExtractor<HTMLElement> | null = null;

//     lazyElements$ = new ObservableValue<UnionLazyLoadElements | null>(null);
//     private $table: HTMLTableElement | null = null;
//     private $el: HTMLElement | null = null;
//     private _tableExtractionParams$: ITableApproximationExtractionParam[] = [];
//     private target$ = new ObservableValue<HTMLElement | null>(null);
//     public isGrandchild$ = new ObservableValue<boolean>(false);
//     private _upperPath: HTMLElement[] = []; // Contained $el

//     constructor() {
//         this.onLazyElementsChange((lazyElements) => {
//             if (!lazyElements) {
//                 return;
//             }
//             const dispose = lazyElements.onChange(() => {
//                 captureEvent(TelemetryEvents.clipsheet_elements_lazy_load, {
//                     url: location.href,
//                 });
//                 dispose();
//             });
//         });

//         this.isGrandchild$.subscribe((isGrandchild) => {
//             const { $el, $table } = this;

//             if (!$table && $el) {
//                 const params = (this._upperPath.length > 0 ? this._upperPath : [$el])
//                     .map((el) => getTableApproximationByElement(el, isGrandchild))
//                     .filter((param) => Boolean(param)) as ITableApproximationExtractionParam[];

//                 if (params.length <= 0) {
//                     return;
//                 }

//                 // To select the params full of most rows data
//                 const tableLikeParam = params.reduce((a, b) => {
//                     return getTableExtractionParamRows(a) > getTableExtractionParamRows(b) ? a : b;
//                 });

//                 this._tableExtractionParams$ = tableLikeParam ? [tableLikeParam] : [];
//                 this.target$.next(this.target);
//             }
//         });
//     }

//     get tableExtractionParams() {
//         return this._tableExtractionParams$;
//     }

//     get lazyElements() {
//         return this.lazyElements$.value;
//     }

//     get target() {
//         return this.$table || this.$el;
//     }

//     get isGrandchild() {
//         return this.isGrandchild$.value;
//     }

//     setUpperPath(path: HTMLElement[]) {
//         this._upperPath = path;
//     }

//     private _setByTableExtractionParams(params: ITableApproximationExtractionParam) {
//         this.$el = params.element as HTMLElement;
//         this.$table = null;
//         this._tableExtractionParams$ = [params];
//     }

//     // Try parse table -> table like param -> empty
//     inspectElement(el: HTMLElement) {
//         const tableElement = last(checkElementTable(el));
//         const tableExtractionParams = last(checkElementApproximationTable(el));

//         const setByEmpty = (element: HTMLElement) => {
//             this.$el = element;
//             this.$table = null;
//             this._tableExtractionParams$ = [];
//         };

//         const tableExtractionElement = tableExtractionParams?.element;
//         if (tableExtractionElement && tableElement?.contains(tableExtractionElement)) {

//             // this._extractor = new TableLikeElementExtractor();
//             // this._extractor.
//             // this.inspectTableLikeParam(tableExtractionParams);
//         } else if (tableElement) {
//             // this.inspectTable(tableElement as HTMLTableElement);
//         } else if (tableExtractionParams) {
//             // this.inspectTableLikeParam(tableExtractionParams);
//         } else {
//             setByEmpty(el);
//             this.target$.next(this.target);
//         }
//     }

//     inspectTable(table: HTMLTableElement) {
//         this.$table = table;
//         this.$el = table;
//         this._tableExtractionParams$ = [];
//         this.target$.next(this.target);
//     }

//     inspectTableLikeParam(param: ITableApproximationExtractionParam) {
//         this._setByTableExtractionParams(param);
//         this.isGrandchild$.next(param.grandChildrenLevel !== undefined);
//         this.target$.next(this.target);
//     }

//     buildLazyElements() {
//         const { $table, _tableExtractionParams$ } = this;
//         this.lazyElements?.dispose();

//         if (_tableExtractionParams$.length > 0) {
//             this.lazyElements$.next(new LazyLoadElements(_tableExtractionParams$, this.isGrandchild));
//         } else if ($table) {
//             this.lazyElements$.next(new LazyLoadTableElements([$table]));
//         }

//         return this.lazyElements;
//     }

//     extractElement(el: HTMLElement, isGrandchild: boolean = this.isGrandchild) {
//         isGrandchild !== this.isGrandchild && this.isGrandchild$.next(isGrandchild);
//         this.inspectElement(el);
//         this.buildLazyElements();
//     }

//     onTargetChange(listener: TargetElementListener) {
//         return this.target$.subscribe(listener);
//     }

//     onLazyElementsChange(listener: LazyElementsListener) {
//         return this.lazyElements$.subscribe(listener);
//     }

//     // get hasData() {
//     //     return this.selectionRows > 0;
//     // }

//     get selectionRows() {
//         const tableExtractionParam = last(this._tableExtractionParams$);
//         if (tableExtractionParam) {
//             return getTableExtractionParamRows(tableExtractionParam);
//         }

//         const selectionRows = tableExtractionParam
//             ? getTableExtractionParamRows(tableExtractionParam)
//             : (this.$table?.querySelectorAll('tbody')[0]?.querySelectorAll('tr').length ?? 0);

//         return selectionRows;
//     }

//     get rows() {
//         return this.lazyElements?.rows ?? 0;
//     }

//     output() {
//         const sheets = this.lazyElements?.getAllSheets();
//         return sheets ?? [];
//     }

//     destroyLazyElements() {
//         this.lazyElements$.value?.dispose();
//         this.lazyElements$.dispose();
//     }

//     dispose() {
//         this.lazyElements$.value?.dispose();
//         this.lazyElements$.dispose();
//         this.isGrandchild$.dispose();
//         this.target$.dispose();
//         this.$el = null;
//         this.$table = null;
//         this._tableExtractionParams$ = [];
//     }
// }
