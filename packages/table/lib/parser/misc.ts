/**
 * Copyright 2023-present DreamNum Inc.
 *
 */

export interface UnknownJson {
    [key: string]: string | number | boolean | UnknownJson | UnknownJson[];
}

export const MIN_FORMATION_DENSITY = 0.4; // 信息密度，一个表格必须至少40%的单元格有值。

export enum Initial_Sheet_Type_Num {
    UNDEFINED = 0,
    HTML_TABLE = 1,
    APPROXIMATION_TABLE = 2,
    AJAX_TABLE = 3,
    UNRECOGNIZED = -1,
}

export enum Sheet_Cell_Type_Enum {
    UNDEFINED = 0,
    TEXT = 1,
    URL = 2,
    IMAGE = 3,
    VIDEO = 4,
    UNRECOGNIZED = -1,
}

export interface IInitialSheet {
    sheetName: string;
    columnName: string[];
    rows: ISheet_Row[];
    type: Initial_Sheet_Type_Num;
    density: number;
    cellCount: number;
    // Cached
    weightedScore?: number;
    selectorString?: string;
}

export interface ISheet_Row {
    cells: ISheet_Row_Cell[];
}

export interface ISheet_Row_Cell {
    type: Sheet_Cell_Type_Enum;
    text: string;
    url: string;
}

export const safeQueryHelper = {
    querySelector(el: Element, selector: string) {
        try {
            return el.querySelector(selector);
        } catch (err) {
            try {
                return el.querySelector(selector.replace(/^\d/, '\\3$& '));
            } catch (err) {
                return null;
            }
        }
    },
    querySelectorAll<T extends Element = Element>(el: Element | Document, selector: string): NodeListOf<T> | Array<T> {
        try {
            return el.querySelectorAll(selector);
        } catch (err) {
            try {
                return el.querySelectorAll(selector.replace(/^\d/, '\\3$& '));
            } catch (err) {
                return [];
            }
        }
    },
};

export function convertRelativeToAbsolute(url: string) {
    // 创建一个a元素，用于解析URL
    const a = document.createElement('a');
    a.href = url; // 设置相对URL
    return a.href; // 浏览器会将其转换为绝对URL并返回
}

export interface ITableElementAnalyzeRowDataItem {
    src?: string | null;
    href?: string | null;
    text: string;
}

export interface ITableElementAnalyzeRowData {
    [key: string]: ITableElementAnalyzeRowDataItem;
}

export function isValidUrl(urlStr: string) {
    try {
        const url = new URL(urlStr);
        return !url.protocol.startsWith('javascript');
    } catch (err) {
        return false;
    }
}

export function analyzeRowsToSheetRows(analyzeRows: ITableElementAnalyzeRowData[], onCell?: (cell: ISheet_Row_Cell) => void) {
    return analyzeRows.map((rowData) => {
        const row: ISheet_Row = {
            cells: [],
        };

        Object.keys(rowData).sort().forEach((cellKey) => {
            const cellData = rowData[cellKey];

            const { text, src, href } = cellData;

            let cell: ISheet_Row_Cell;
            if (href != null && href.length > 0 && isValidUrl(href)) {
                cell = {
                    type: Sheet_Cell_Type_Enum.URL,
                    text,
                    url: href,
                };
            } else if (src != null && src.length > 0 && isValidUrl(src)) {
                cell = {
                    type: Sheet_Cell_Type_Enum.IMAGE,
                    text,
                    url: src,
                };
            } else {
                cell = {
                    type: Sheet_Cell_Type_Enum.TEXT,
                    text,
                    url: '',
                };
            }

            onCell?.(cell);

            row.cells.push(cell);
        });

        return row;
    });
}

export function toResultTable(mergeTableElements: ITableElementAnalyzeRowData[][], selectors: string[], title = 'TableApproximation', type = Initial_Sheet_Type_Num.APPROXIMATION_TABLE) {
    const resultSheets: IInitialSheet[] = [];

    mergeTableElements.forEach((tableData, index) => {
        const sheet: IInitialSheet = {
            sheetName: `${title}${index}`,
            columnName: [],
            rows: [],
            type,
            density: 0,
            cellCount: 0,
            selectorString: selectors[index] || '',
        };

        const cellCount = tableData.length * (tableData[0] ? Object.keys(tableData[0]).length : 0);
        sheet.cellCount = cellCount;

        let valueCellCount = 0;

        sheet.rows = analyzeRowsToSheetRows(tableData, (cell) => {
            if (!isEmptyCell(cell)) {
                valueCellCount++;
            }
        });
        // tableData.forEach((rowData) => {
        //     const row: ISheet_Row = {
        //         cells: [],
        //     };
        //     Object.keys(rowData).sort().forEach((cellKey) => {
        //         // if (!sheet.columnName.includes(cellKey)) {
        //         //     sheet.columnName.push(cellKey);
        //         // }

        //         const cellData = rowData[cellKey];

        //         const { text, src, href } = cellData;

        //         let cell: ISheet_Row_Cell;
        //         if (href != null && href.length > 0 && isValidUrl(href)) {
        //             cell = {
        //                 type: Sheet_Cell_Type_Enum.URL,
        //                 text,
        //                 url: href,
        //             };
        //         } else if (src != null && src.length > 0 && isValidUrl(src)) {
        //             cell = {
        //                 type: Sheet_Cell_Type_Enum.IMAGE,
        //                 text,
        //                 url: src,
        //             };
        //         } else {
        //             cell = {
        //                 type: Sheet_Cell_Type_Enum.TEXT,
        //                 text,
        //                 url: '',
        //             };
        //         }

        //         if (!isEmptyCell(cell)) {
        //             valueCellCount++;
        //         }

        //         row.cells.push(cell);
        //     });

        //     sheet.rows.push(row);
        // });

        sheet.density = valueCellCount / cellCount;

        resultSheets.push(sheet);
    });

    return resultSheets.filter((sheet) => !Number.isNaN(sheet.density));
}

export function isEmptyCell(cell: ISheet_Row_Cell) {
    return cell.text.trim().length === 0 && cell.url.trim().length === 0;
}

export function replaceControlChars(input: string): string {
    // 正则表达式匹配控制字符
    // [\x00-\x1F\x7F] 匹配ASCII控制字符，包括从0到31的字符和127（删除）
    // [\u0080-\u009F] 匹配C1控制字符（扩展ASCII控制字符）
    const regex = /[\x00-\x1F\x7F-\x9F]/g;

    // 替换为指定的字符，这里是空格，如果要移除这些字符，可以替换为 ''
    return input.replace(regex, ' ');
}

export function isEqualCell(cell1: ITableElementAnalyzeRowDataItem, cell2: ITableElementAnalyzeRowDataItem) {
    if (!cell1 || !cell2) {
        return false;
    }
    return cell1.text === cell2.text && cell1.href === cell2.href && cell1.src === cell2.src;
}

export function isEmptyAnalyzeCell(cell: ITableElementAnalyzeRowDataItem) {
    return cell.text.trim().length === 0 && !cell.src && !cell.href;
}

const MAX_COLUMN_EMPTY_RATIO_LIMITED = 0.9;
export function deleteRepeatColumn(tableData: ITableElementAnalyzeRowData[]) {
    const resultTableData: ITableElementAnalyzeRowData[] = [];

    const allKeys: { [key: string]: boolean } = {};
    const allKeyEmptyCounts = new Map<string, number>();
    tableData.forEach(function (rowData) {
        Object.keys(rowData).forEach(function (key) {
            allKeys[key] = false;
        });
    });

    tableData.forEach((rowData, index) => {
        const keys = Object.keys(rowData);

        const preRowData = tableData[index - 1];

        keys.forEach((key) => {
            const cell = rowData[key];
            if (isEmptyAnalyzeCell(cell)) {
                allKeyEmptyCounts.set(key, (allKeyEmptyCounts.get(key) || 0) + 1);
            }

            if (allKeys[key] === true) {
                return;
            }

            if (preRowData == null) {
                return;
            }

            if (!isEqualCell(cell, preRowData[key])) {
                allKeys[key] = true;
            }
        });
    });

    const rowCount = tableData.length;
    tableData.forEach((rowData) => {
        const keys = Object.keys(rowData);
        const newRowData: ITableElementAnalyzeRowData = {};
        keys.forEach((key) => {
            const empty = allKeyEmptyCounts.get(key) || 0;
            if (allKeys[key] === false || (empty / rowCount) > MAX_COLUMN_EMPTY_RATIO_LIMITED) {
                return;
            }
            const cell = rowData[key];
            newRowData[key] = cell;
        });
        resultTableData.push(newRowData);
    });

    return resultTableData;
}

// 转义特殊字符并返回处理后的字符串
export function escapeSpecialCharacters(str: string, prefix: string = '.'): string {
    // 处理字符串前加上前缀（默认是"."），然后替换字符串中的特殊字符，去除首尾空格
    return prefix + str.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&').trim();
}

// 生成元素的唯一选择器
export function generateUniqueSelector(element: Element): string {
    // 触发鼠标离开事件和失焦事件
    const eventMouseLeave = new Event('mouseleave');
    const eventBlur = new Event('blur');
    const eventMouseout = new Event('mouseout');
    element.dispatchEvent(eventMouseLeave);
    element.dispatchEvent(eventBlur);
    element.dispatchEvent(eventMouseout);

    // 获取元素及其所有祖先元素
    const elements = [];
    let currentElement: Element | null = element;
    while (currentElement && currentElement.tagName.toLowerCase() !== 'html' && currentElement.tagName.toLowerCase() !== 'body') {
        elements.push(currentElement);
        currentElement = currentElement.parentElement;
    }

    // 生成唯一选择器字符串
    const selector = elements.reverse().map((el) => {
        let tag = el.tagName.toLowerCase();

        if (typeof el.id === 'string' && el.id.trim() && !el.id.match(/\d+/g)) { // 如果元素有ID
            tag += escapeSpecialCharacters(el.id, '#'); // 将ID添加到标签名后面
        } else if (typeof el.className === 'string' && el.className.trim()) { // 如果元素有类名
            tag += escapeSpecialCharacters(el.className).replace(/\s+/g, '.'); // 将类名添加到标签名后面
        }

        // 获取兄弟节点中的索引
        let siblingIndex = 0;
        let sibling: Element | null = el.previousElementSibling;
        while (sibling) {
            if (sibling.tagName.toLowerCase() === el.tagName.toLowerCase()) {
                siblingIndex++;
            }
            sibling = sibling.previousElementSibling;
        }

        // 添加索引信息
        if (siblingIndex > 0) {
            tag += `:nth-of-type(${siblingIndex + 1})`;
        }

        return tag; // 返回标签名
    }).join('>'); // 将所有标签名拼接成选择器字符串

    return selector;
}

export function generateUniqueSelectorLastOf(element: Element): string {
    // 触发鼠标离开事件和失焦事件
    const eventMouseLeave = new Event('mouseleave');
    const eventBlur = new Event('blur');
    const eventMouseout = new Event('mouseout');
    element.dispatchEvent(eventMouseLeave);
    element.dispatchEvent(eventBlur);
    element.dispatchEvent(eventMouseout);

    // 获取元素及其所有祖先元素
    const elements = [];
    let currentElement: Element | null = element;
    while (currentElement && currentElement.tagName.toLowerCase() !== 'html' && currentElement.tagName.toLowerCase() !== 'body') {
        elements.push(currentElement);
        currentElement = currentElement.parentElement;
    }

    // 生成唯一选择器字符串
    const selector = elements.reverse().map((el) => {
        let tag = el.tagName.toLowerCase();

        if (typeof el.id === 'string' && el.id.trim() && !el.id.match(/\d+/g)) { // 如果元素有ID
            tag += escapeSpecialCharacters(el.id, '#'); // 将ID添加到标签名后面
        } else if (typeof el.className === 'string' && el.className.trim()) { // 如果元素有类名
            tag += escapeSpecialCharacters(el.className).replace(/\s+/g, '.'); // 将类名添加到标签名后面
        }

        // 使用 nth-last-of-type 获取兄弟节点中的索引
        let siblingIndex = 0;
        let sibling = el.nextElementSibling;
        while (sibling) {
            if (sibling.tagName.toLowerCase() === el.tagName.toLowerCase()) {
                siblingIndex++;
            }
            sibling = sibling.nextElementSibling;
        }

    // 添加索引信息，始终添加 nth-last-of-type 以确保唯一性
        tag += `:nth-last-of-type(${siblingIndex + 1})`;

        return tag; // 返回标签名
    }).join('>'); // 将所有标签名拼接成选择器字符串

    return selector;
}

export function getElementSelfSelector(element: Element) {
    let tag = element.tagName.toLowerCase();

    if (typeof element.id === 'string' && element.id.trim() && !element.id.match(/\d+/g)) { // 如果元素有ID
        tag += escapeSpecialCharacters(element.id, '#'); // 将ID添加到标签名后面
    } else if (typeof element.className === 'string' && element.className.trim()) { // 如果元素有类名
        tag += escapeSpecialCharacters(element.className).replace(/\s+/g, '.'); // 将类名添加到标签名后面
    }

    return tag;
}
// 生成元素的选择器
export function generateSelector(element: Element | undefined): string {
    if (element == null) {
        return '';
    }

    // 触发鼠标离开事件和失焦事件
    const eventMouseLeave = new Event('mouseleave');
    const eventBlur = new Event('blur');
    const eventMouseout = new Event('mouseout');
    element.dispatchEvent(eventMouseLeave);
    element.dispatchEvent(eventBlur);
    element.dispatchEvent(eventMouseout);

    // 获取元素及其所有祖先元素
    const elements = [];
    let currentElement: Element | null = element;
    while (currentElement && currentElement.tagName.toLowerCase() !== 'html' && currentElement.tagName.toLowerCase() !== 'body') {
        elements.push(currentElement);
        currentElement = currentElement.parentElement;
    }

    // 生成选择器字符串
    const selector = elements.reverse().map(getElementSelfSelector).join('>'); // 将所有标签名拼接成选择器字符串

    return selector;
}

export function getDrillDownSelector(element: Element | undefined, isLast = false): string {
    if (element == null) {
        return '';
    }

    const selector = generateSelector(element);
    const dom = safeQueryHelper.querySelectorAll(document, selector);

    if (dom.length === 1) {
        return selector;
    }

    return isLast ? generateUniqueSelectorLastOf(element) : generateUniqueSelector(element);
}

const MIN_TOP_AJAX_JSON_TABLE_COUNT_LIMIT = 3;
export function filterAndSortAllInitialSheet(tables: IInitialSheet[]) {
    const approximationTables = tables.filter((table) => table.type === Initial_Sheet_Type_Num.APPROXIMATION_TABLE && (table.density >= MIN_FORMATION_DENSITY && table.cellCount >= 20));
    const htmlTables = tables.filter((table) => table.type === Initial_Sheet_Type_Num.HTML_TABLE).slice(0, 10);
    const ajaxJsonTables = tables.filter((table) => table.type === Initial_Sheet_Type_Num.AJAX_TABLE).sort((a, b) => (b!.weightedScore || 0) - (a!.weightedScore || 0)).slice(0, MIN_TOP_AJAX_JSON_TABLE_COUNT_LIMIT);
    // console.error('approximationTables', approximationTables);
    // console.error('htmlTables', htmlTables);
    // console.error('ajaxJsonTables', ajaxJsonTables);
    const results = [...htmlTables, ...ajaxJsonTables].filter((table) => {
        return table.density >= MIN_FORMATION_DENSITY;
    }).sort((a, b) => b.density * b.density * b.cellCount - a.density * a.density * a.cellCount);
    return [...approximationTables, ...results];
}

export function mergeMultiTabInitialSheet(tables: IInitialSheet[]) {
    const result: IInitialSheet[] = [];
    const sheetMap = new Set<IInitialSheet>();
    tables.forEach((table) => {
        if (sheetMap.has(table)) {
            return;
        }

        const tableSelector = table.selectorString || '';

        if (table.type !== Initial_Sheet_Type_Num.HTML_TABLE || tableSelector.length === 0) {
            result.push(table);
            return;
        }

        tables.forEach((mergeTable) => {
            if (sheetMap.has(mergeTable) || table === mergeTable) {
                return;
            }

            const mergeTableSelector = mergeTable.selectorString || '';

            if (mergeTable.type !== Initial_Sheet_Type_Num.HTML_TABLE || mergeTableSelector.length === 0) {
                return;
            }

            if (mergeTableSelector === tableSelector && table.type === mergeTable.type) {
                sheetMap.add(mergeTable);
                table.rows.push(...mergeTable.rows);
                table.cellCount += mergeTable.cellCount;
                table.density = table.cellCount > 0 ? table.rows.length * table.rows[0].cells.length / table.cellCount : 0;
                table.weightedScore = table.density * table.density * table.cellCount;
            }
        });

        result.push(table);
    });

    sheetMap.clear();

    return result;
}

function cleanContent(content: string) {
    // 去除引号
    if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
    } else if (content.startsWith("'") && content.endsWith("'")) {
        content = content.slice(1, -1);
    }

    // 处理异常值
    if (content === 'none' || content === 'normal' || content === 'initial' || content === 'inherit') {
        return '';
    }

    return content;
}

export function getDrillDownElementText(node: Node): string {
    const styleBefore = getComputedStyle(node as HTMLElement, '::before');

    const styleAfter = getComputedStyle(node as HTMLElement, '::after');

    const contentBefore = cleanContent(styleBefore.getPropertyValue('content'));

    const contentAfter = cleanContent(styleAfter.getPropertyValue('content'));

    let text: string = contentBefore;
    // 遍历所有子节点
    node.childNodes.forEach((child: Node) => {
        if (child.nodeType === Node.TEXT_NODE) {
            // 如果是文本节点，直接添加文本
            text += `${child.textContent?.trim()} `;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            // 如果是元素节点，递归调用此函数

            const style = getComputedStyle(child as HTMLElement);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return;
            }

            text += `${getDrillDownElementText(child)} `;
        }
    });

    return text.trim() + contentAfter; // 返回处理后的文本，去掉首尾多余的空格
}

export function getImageInAttributes(element: HTMLElement) {
    // 获取元素的style属性中的background-image值
    const style = element.style;
    if (style && style.backgroundImage) {
    // 正则表达式匹配URL
        const urlMatch = style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }
    }
    return null;
}

export function getElementText(element: HTMLElement): string {
    const innerText = element.innerText || '';
    if (innerText.length > 0) {
        return innerText;
    }

    return element.textContent || '';
}

export function getElementCompareContent(node: Node): string {
    let text: string = '';
    // 遍历所有子节点
    node.childNodes.forEach((child: Node) => {
        if (child.nodeType === Node.TEXT_NODE) {
            // 如果是文本节点，直接添加文本
            text += `${child.textContent?.trim()} `;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            if (tagName === 'img' || tagName === 'a') {
                const cellData = getCellData(element, false);
                if (cellData) {
                    text += `${cellData.text}${cellData.href}${cellData.src}`;
                } else {
                    text += `${getElementCompareContent(child)} `;
                }
            } else {
                text += `${getElementCompareContent(child)} `;
            }
        }
    });
    return text.trim(); // 返回处理后的文本，去掉首尾多余的空格
}

export function getElementTextWithoutChildren(element: Element): string {
    const clonedElement = element.cloneNode(true) as HTMLElement;
    const childNodes = clonedElement.childNodes;

    for (let i = childNodes.length - 1; i >= 0; i--) {
        if (childNodes[i].nodeType === Node.ELEMENT_NODE) { // 仅移除元素节点（排除文本节点）
            clonedElement.removeChild(childNodes[i]); // 移除子节点
        }
    }

    return getElementText(clonedElement);
}

export function getCellData(element: Element | null, isConvert = true): ITableElementAnalyzeRowDataItem | undefined {
    if (!element) {
        return;
    }
    let text = replaceControlChars(getElementText(element as HTMLElement).trim());
    let href = element.getAttribute('href');
    let src = element.getAttribute('src');

    if (src == null) {
        src = getImageInAttributes(element as HTMLElement);
    }

    if (!text?.length && !href?.length && !src?.length) {
        return;
    }

    // if (text && text.length === 1 && containsSpecialCharacters(text)) {
    //     return;
    // }

    if (src != null) {
        if (isConvert) {
            src = convertRelativeToAbsolute(src);
        }

        if (text.length === 0) {
            text = element.getAttribute('alt') || element.getAttribute('title') || '';
        }
    }

    if (href != null) {
        if (isConvert) {
            href = convertRelativeToAbsolute(href);
        }

        if (text.length === 0) {
            text = element.getAttribute('aria-label') || element.getAttribute('title') || '';
        }
    }

    return {
        text,
        href,
        src,
    };
}

export function getElementsAtDepth(element: Element, depth: number): Element[] {
    const childElements: Element[] = [];

    function traverse(node: Element, currentDepth: number): void {
        if (currentDepth === depth) {
            childElements.push(node);
        } else if (currentDepth < depth) {
            Array.from(node.children).forEach((child) => traverse(child, currentDepth + 1));
        }
    }

    traverse(element, 0);
    return childElements;
}
