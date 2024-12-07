/**
 * Copyright 2023-present DreamNum Inc.
 *
 */
import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { IInitialSheet, ISheet_Row, ISheet_Row_Cell } from './misc';
import { convertRelativeToAbsolute, generateSelector, getElementCompareContent, getElementText, Initial_Sheet_Type_Num, isEmptyCell, replaceControlChars, safeQueryHelper, Sheet_Cell_Type_Enum } from './misc';

const MIN_ROW_CELL_AREA_LIMIT = 5 * 2;

interface ITableCell {
    cellType: Sheet_Cell_Type_Enum;
    cellText: string;
    cellUrl: string;
}

export const tableScopeRowsSelector = ':scope > tbody > tr, :scope > thead > tr, :scope > tfoot > tr';
export function queryTableScopeRows(table: Element): HTMLTableRowElement[] {
    return Array.from(safeQueryHelper.querySelectorAll<HTMLTableRowElement>(table, tableScopeRowsSelector));
}

export function extractTableFromBody(body: HTMLBodyElement): IInitialSheet[] {
    const tables = body.querySelectorAll('table');

    if (tables.length === 0) {
        return [];
    }

    const resultSheets: IInitialSheet[] = [];

    tables.forEach((table) => {
        const rawRows = queryTableScopeRows(table);

        const sheet = getSheetRows(rawRows);

        sheet.selectorString = generateSelector(table);

        resultSheets.push(sheet);
    });

    const mergeSheets = mergeResultSheets(resultSheets);

    const deleteMinArea = deleteMinAreaSheets(mergeSheets);

    // console.info('resultSheets', deleteMinArea, resultSheets, mergeSheets);

    return deleteMinArea;
}

export function getExtractTableByElement(element: Element): IInitialSheet {
    const rawRows = queryTableScopeRows(element);

    return getSheetRows(rawRows);
}

function getSheetRows(rawRows: HTMLTableRowElement[]) {
    let cellCount = 0;
    let valueCellCount = 0;

    let columnCount = 0;

    const groupRows = groupTableRows(rawRows);

    const sheet: IInitialSheet = {
        sheetName: 'HtmlTable',
        columnName: [],
        rows: [],
        type: Initial_Sheet_Type_Num.HTML_TABLE,
        density: 0,
        cellCount: 0,
        selectorString: '',
    };

    groupRows.forEach((rows, groupIndex) => {
        const sheetRow: ISheet_Row = {
            cells: [],
        };
        const spanCache: Map<number, Map<number, ISheet_Row_Cell>> = new Map();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td, th');
            const tableTitles = i === 0 ? Array.from(row.querySelectorAll('th')) : [];

            columnCount = Math.max(columnCount, getCellsCountForColSpan(cells));

            let cellIndex = 0;
            for (let j = 0; j < columnCount; j++) {
                if (spanCache.has(i) && spanCache.get(i)?.has(j)) {
                    const cellData = spanCache.get(i)!.get(j)!;

                    if (groupIndex === 0 && i === 0 && tableTitles.length > 0) {
                        sheet.columnName.push(cellData.text);
                    } else {
                        sheetRow.cells.push(cellData);

                        if (!isEmptyCell(cellData)) {
                            valueCellCount++;
                        }

                        cellCount++;
                    }

                    continue;
                }

                const cell = cells[cellIndex];

                if (cell == null) {
                    cellIndex++;
                    continue;
                }

                const colSpan = (cell as HTMLTableCellElement).colSpan || 1;
                const rowSpan = (cell as HTMLTableCellElement).rowSpan || 1;
                const { cellType, cellText, cellUrl } = getCellTypeAndContent(cell as HTMLTableCellElement);
                const cellData = {
                    type: cellType,
                    text: cellText,
                    url: cellUrl,
                };

                setSpan(cellData, i, j, rowSpan, colSpan, spanCache);

                if (groupIndex === 0 && i === 0 && tableTitles.length > 0) {
                    sheet.columnName.push(cellData.text);
                } else {
                    sheetRow.cells.push(cellData);

                    if (!isEmptyCell(cellData)) {
                        valueCellCount++;
                    }

                    cellCount++;
                }

                cellIndex++;
            }
        }

        if (sheetRow.cells.length > 0) {
            sheet.rows.push(sheetRow);
        }
    });

    sheet.cellCount = cellCount;

    sheet.density = valueCellCount / cellCount;

    return sheet;
}

function cleanSheet(sheet: IInitialSheet): IInitialSheet {
    // Determine which columns to keep
    const keepColumnIndices = sheet.rows.length > 0
        ? sheet.rows[0].cells.map((_, colIndex) => {
        // 获取要检查的行数，最多检查前15行
            const rowsToCheck = sheet.rows.slice(0, 15);

        // 检查这些行中的每一行，列的对应单元格是否都为空
            return !rowsToCheck.every((row) => {
                const cell = row.cells[colIndex];
                return !cell || (cell.text.length === 0 && cell.url.length === 0);
            });
        })
        : [];

    // Filter column names
    const newColumnNames = sheet.columnName.filter((_, colIndex) => keepColumnIndices[colIndex]);

    // Filter rows and cells
    const newRows = sheet.rows.map((row) => ({
        cells: row.cells.filter((_, colIndex) => keepColumnIndices[colIndex]),
    }));

    // Calculate new cellCount
    const newCellCount = newRows.reduce((count, row) => count + row.cells.length, 0);

    // Return the updated sheet
    return {
        ...sheet,
        columnName: newColumnNames,
        rows: newRows,
        cellCount: newCellCount,
    };
}

export function checkElementTable(element: Element): Element[] {
    const tableElement = element.closest('table');
    if (tableElement == null) {
        return [];
    }

    const tables: Element[] = [];

    let parent = tableElement as HTMLElement | undefined | null;

    while (parent != null) {
        tables.push(parent);
        parent = parent.parentElement?.closest('table');
    }

    return tables;
}

interface ILazyLoadTableElements {
    table: Element;
    isAdded: boolean;
    sheet: IInitialSheet;
}

export class LazyLoadTableElements {
    private _onRowsUpdated$ = new ObservableValue<ISheet_Row[]>([]);
    private _onChange$ = new ObservableValue<void>(undefined);
    // private _listeners = new Set<() => void>();
    private _lazyLoadTableElements: ILazyLoadTableElements[] = [];
    private _observers: MutationObserver[] = [];
    private _existingRows: Map<string, Node> = new Map();

    constructor(private _tables: Element[]) {
        this._init();

        this._scrollListener();

        this._onRowsUpdated$.subscribe(() => {
            this._onChange$.next();
        });
    }

    get rows() {
        return this._lazyLoadTableElements.map((element) => element.sheet.rows.length).reduce((a, b) => a + b);
    }

    findItemByElement(element: Element) {
        return this._lazyLoadTableElements.find((tableElement) => tableElement.table === element);
    }

    updateItemElement(item: ILazyLoadTableElements, table: Element) {
        item.table = table;
        const rows = queryTableScopeRows(table).filter((node) => this._tableRowFilter(node));
        if (rows.length) {
            this._addRowsToItem(item, rows);
        }
    }

    private _init() {
        this._tables.forEach((table) => {
            const rows = queryTableScopeRows(table);
            rows.forEach((row) => this._addExistingRow(row));

            const sheet = getSheetRows(rows);

            this._lazyLoadTableElements.push({
                table,
                isAdded: false,
                sheet,
            });
        });
    }

    private _addExistingRow(row: Element) {
        const text = getElementCompareContent(row as HTMLElement);
        if (this._existingRows.has(text)) {
            return false;
        }
        this._existingRows.set(text, row);
        return true;
    }

    private _tableRowFilter(node: Element) {
        if (node.tagName === 'TR') {
            return this._addExistingRow(node);
        }

        return false;
    }

    private _addRowsToItem(element: ILazyLoadTableElements, rows: HTMLTableRowElement[]) {
        const sheet = getSheetRows(rows);

        element.sheet.rows.push(...sheet.rows);

        element.sheet.cellCount += sheet.cellCount;

        element.sheet.density = element.sheet.cellCount / element.sheet.rows.length;

        element.isAdded = true;

        this._onRowsUpdated$.next(sheet.rows);
    }

    private _scrollListener() {
        /**
         * https://zjj.sz.gov.cn/zfxx/bzflh/?path=main/#/lhmc?waittype=2 页面中 table 更新了，但是没有触发 mutationObserver
         * 加个 timeout 在 mutationObserver 后对 table 进行检查
         */
        let timer: ReturnType<typeof setTimeout> | null;
        const timeoutReviewTable = (element: ILazyLoadTableElements): void => {
            if (!timer) {
                timer = setTimeout(() => {
                    const rows = queryTableScopeRows(element.table).filter((node) => this._tableRowFilter(node));
                    if (rows.length > 0) {
                        this._addRowsToItem(element, rows);
                    }
                });
                timer = null;
            }
        };

        this._lazyLoadTableElements.forEach((element) => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    const rows = Array.from(mutation.addedNodes).filter((node) => this._tableRowFilter(node as Element)) as HTMLTableRowElement[];

                    this._addRowsToItem(element, rows);

                    timeoutReviewTable(element);
                });
            });

            observer.observe(element.table, {
                childList: true,
                subtree: true,
            });

            this._disposeWithMe(observer);
        });
    }

    onRowsUpdated(listener: (rows: ISheet_Row[]) => void) {
        return this._onRowsUpdated$.subscribe(listener);
    }

    onChange(listener: () => void) {
        return this._onChange$.subscribe(listener);
    }

    private _disposeWithMe(observer: MutationObserver) {
        this._observers.push(observer);
    }

    dispose() {
        this._lazyLoadTableElements = [];

        this._observers.forEach((observer) => {
            observer.disconnect();
        });

        this._observers = [];

        this._onChange$.dispose();
        this._onRowsUpdated$.dispose();

        this._existingRows.clear();
    }

    public getAddedSheets(): IInitialSheet[] {
        return this._lazyLoadTableElements.map((element) => element.sheet);
    }

    public getAllSheets(): IInitialSheet[] {
        return this.getAddedSheets();
    }
}

// console.error('checkElementTable.ts', checkElementTable, LazyLoadTableElements);

export function groupTableRows(rows: HTMLTableRowElement[]): (HTMLTableRowElement[] | HTMLTableRowElement[])[] {
    const n = rows.length;

    if (n === 0) return [];

    // Function to check if two subarrays are the same based on className and children count
    const isSamePattern = (start1: number, start2: number, length: number): boolean => {
        for (let i = 0; i < length; i++) {
            const row1 = rows[start1 + i];
            const row2 = rows[start2 + i];
            if (
                row1?.className !== row2?.className &&
                row1?.children.length !== row2?.children.length
            ) {
                return false;
            }
        }
        return true;
    };

    // Function to find the maximum repeating pattern length that covers at least 80% of the rows
    const findMaxPatternLength = (): number => {
        for (let patternLength = 1; patternLength <= n / 2; patternLength++) {
            let matchCount = 0;
            for (let i = 0; i <= n - patternLength; i++) {
                if (i + patternLength < n && isSamePattern(i, i + patternLength, patternLength)) {
                    matchCount += patternLength;
                }
            }
            if (matchCount >= 0.8 * n) {
                return patternLength;
            }
        }
        return 1; // Default to pattern length 1 (no significant repeating pattern found)
    };

    const maxPatternLength = findMaxPatternLength();
    const result: (HTMLTableRowElement[] | HTMLTableRowElement[])[] = [];
    let i = 0;

    while (i < n) {
        const segment: HTMLTableRowElement[] = rows.slice(i, i + maxPatternLength);
        if (segment.length < maxPatternLength || !isSamePattern(0, i, maxPatternLength)) {
            // If the segment is not a perfect pattern match, add as a single item array
            result.push([rows[i]]);
            i += 1; // Move to the next row
        } else {
            result.push(segment);
            i += maxPatternLength;
        }
    }

    return result;
}

function getCellsCountForColSpan(cells: NodeListOf<Element>): number {
    let count = 0;
    cells.forEach((cell) => {
        count += (cell as HTMLTableCellElement).colSpan || 1;
    });
    return count;
}

function setSpan(cell: ISheet_Row_Cell, rowIndex: number, cellIndex: number, rowSpan: number, colSpan: number, spanCache: Map<number, Map<number, ISheet_Row_Cell>>) {
    if (rowSpan === 1 && colSpan === 1) {
        return;
    }

    for (let i = 0; i < rowSpan; i++) {
        if (!spanCache.has(rowIndex + i)) {
            spanCache.set(rowIndex + i, new Map());
        }
        for (let j = 0; j < colSpan; j++) {
            spanCache.get(rowIndex + i)?.set(cellIndex + j, cell);
        }
    }
}

function deleteMinAreaSheets(sheets: IInitialSheet[]): IInitialSheet[] {
    return sheets.filter((sheet) => {
        const cellArea = sheet.rows.length * checkMaxCellCount(sheet.rows);
        return cellArea > MIN_ROW_CELL_AREA_LIMIT;
    }).map(cleanSheet);
}

const MAX_MERGE_CELL_COUNT = 10;
function mergeResultSheets(sheets: IInitialSheet[]): IInitialSheet[] {
    const resultSheets: IInitialSheet[] = [];

    const existingAdded = new Set<number>();

    sheets.forEach((sheet, index) => {
        if (sheet.rows.length === 0 || existingAdded.has(index)) {
            return;
        }

        const mergeSheets: IInitialSheet = { ...sheet, rows: [...sheet.rows] };
        const maxCellCount = checkMaxCellCount(sheet.rows);

        if (sheet.rows.length < MAX_MERGE_CELL_COUNT) {
            sheets.forEach((mergeSheet, mergeIndex) => {
                if (mergeSheet.rows.length > MAX_MERGE_CELL_COUNT || index === mergeIndex || existingAdded.has(mergeIndex)) {
                    return;
                }

                const maxMergeCellCount = checkMaxCellCount(mergeSheet.rows);

                if (maxCellCount === maxMergeCellCount) {
                    mergeSheets.rows.push(...mergeSheet.rows);
                    existingAdded.add(mergeIndex);
                }
            });
        }

        resultSheets.push(mergeSheets);
        existingAdded.add(index);
    });

    return resultSheets;
}

function checkMaxCellCount(rows: ISheet_Row[]) {
    let maxCellCount = 0;
    rows.forEach((row) => {
        maxCellCount = Math.max(maxCellCount, row.cells.length);
    });
    return maxCellCount;
}

function getCellTypeAndContent(cell: HTMLTableCellElement): ITableCell {
    const cellText = replaceControlChars(getElementText(cell) || '');
    const cellUrl = cell.querySelector('a')?.href || '';
    const cellImage = cell.querySelector('img')?.src || '';

    if (cellImage && cellImage.length > 0) {
        return {
            cellType: Sheet_Cell_Type_Enum.IMAGE,
            cellText,
            cellUrl: convertRelativeToAbsolute(cellImage),
        };
    } else if (cellUrl && cellUrl.length > 0) {
        return {
            cellType: Sheet_Cell_Type_Enum.URL,
            cellText,
            cellUrl: convertRelativeToAbsolute(cellUrl),
        };
    } else {
        return {
            cellType: Sheet_Cell_Type_Enum.TEXT,
            cellText,
            cellUrl: '',
        };
    }
}

