
import { groupTableRows, LazyLoadTableElements, queryTableScopeRows } from './html-table-extraction';
import { getElementsAtDepth } from './misc';
import { getTableApproximationByElement, type ITableApproximationExtractionParam, LazyLoadElements } from './table-approximation-extraction';

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
