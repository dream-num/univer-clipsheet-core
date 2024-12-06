
import type { IInitialSheet, ITableApproximationExtractionParam } from './parser';
import { getElementsAtDepth, getTableApproximationByElement, groupTableRows, Initial_Sheet_Type_Num, LazyLoadElements, LazyLoadTableElements, queryTableScopeRows, Sheet_Cell_Type_Enum } from './parser';
import type { UnionLazyLoadElements } from './table';

export function createEmptyInitialSheet(): IInitialSheet {
    return {
        sheetName: '',
        columnName: [],
        rows: [],
        type: Initial_Sheet_Type_Num.APPROXIMATION_TABLE,
        density: 0,
        cellCount: 0,
    };
}

export function getTableExtractionParamRows(param: ITableApproximationExtractionParam) {
    return param.grandChildrenLevel
        ? getElementsAtDepth(param.element, param.grandChildrenLevel).length
        : param.children.length;
}

export function getElementAccurateExtractionRows(element: HTMLElement) {
    if (element instanceof HTMLTableElement) {
        return groupTableRows(queryTableScopeRows(element)).length;
    }
    const tableLikeParam = getTableApproximationByElement(element);

    return tableLikeParam ? getTableExtractionParamRows(tableLikeParam) : 0;
}

export function createLazyLoadElement(element: HTMLElement) {
    if (element instanceof HTMLTableElement) {
        return new LazyLoadTableElements([element]);
    }
    const tableLikeParam = getTableApproximationByElement(element);
    if (!tableLikeParam) {
        return;
    }
    return new LazyLoadElements([tableLikeParam]);
}

export function getSheetsRowsData(lazyLoadElement: UnionLazyLoadElements | null) {
    return lazyLoadElement?.getAllSheets().map((sheet) => sheet.rows);
}

export function resolveTypeByElement(element: HTMLElement) {
    if (element instanceof HTMLImageElement) {
        return Sheet_Cell_Type_Enum.IMAGE;
    }
    if (element instanceof HTMLAnchorElement) {
        return Sheet_Cell_Type_Enum.URL;
    }
    if (element instanceof HTMLVideoElement) {
        return Sheet_Cell_Type_Enum.VIDEO;
    }

    return Sheet_Cell_Type_Enum.TEXT;
}

export function getCellValue(cell: IInitialSheet['rows'][number]['cells'][number]) {
    if (cell.type === Sheet_Cell_Type_Enum.URL) {
        return cell.url;
    }

    return cell.text;
}
