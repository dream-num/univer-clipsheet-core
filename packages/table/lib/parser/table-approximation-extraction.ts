/**
 * Copyright 2023-present DreamNum Inc.
 *
 */

import { ObservableValue } from '@univer-clipsheet-core/shared';
import { ajaxJsonToTable } from './ajax-json-to-table';
import type { IInitialSheet, ISheet_Row, ITableElementAnalyzeRowData, UnknownJson } from './misc';
import { analyzeRowsToSheetRows, deleteRepeatColumn, escapeSpecialCharacters, generateSelector, generateUniqueSelector, getCellData, getElementCompareContent, getElementsAtDepth, getElementText, getImageInAttributes, safeQueryHelper, toResultTable } from './misc';

const MIN_ELEMENT_SIZE_RATIO_LIMIT = 0.01;

const MIN_ELEMENT_SIZE_LIMIT = 1000;

const MIN_ELEMENT_CHILDREN_COUNT_LIMIT = 3;

const MIN_TOP_FIT_ELEMENT_COUNT_LIMIT = 10;

const MIN_CELL_COUNT_LIMIT = 1;

const EXCLUDED_TAGS = ['script', 'img', 'pre', 'meta', 'svg', 'iframe', 'style', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col'];

const EXCLUDED_TAGS_NOT_IMAGE = ['script', 'pre', 'meta', 'svg', 'iframe', 'style', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col'];

const COMPARE_TABLE_ERROR_ROW_RATIO = 0.2;

const ROW_SIMILAR_COUNT_RATIO = 0.6;

const MAX_CELL_DIFF_BETWEEN_MERGED_ROWS = 3;

const MIN_COLUMN_ROW_RATIO_LIMIT = 10;

interface IWorkAroundForEspecialHostItem {
    omitRowElementSelectors: string[];
    forcedAddRowClasses: string[];
    forcedAddCellSelectors: string[];
    // forcedMergeRowSelectors?: string[];
    minElementChildrenCountLimit?: number;
    topElementExceptLimit?: number;
    topElementExceptCheckShape?: boolean;
}

interface IWorkAroundForEspecialHost {
    [key: string]: IWorkAroundForEspecialHostItem;
}

const WORK_AROUND_FOR_ESPECIAL_HOST: IWorkAroundForEspecialHost = {
    'jd.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        topElementExceptCheckShape: false,
    },
    'x.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [
            // 'div.css-175oi2r.r-16y2uox.r-1777fci.r-1iusvr4.r-kzbkwu>div[class="css-175oi2r"]:nth-of-type(2)',
            // 'div.css-175oi2r.r-18u37iz.r-1h0z5md:nth-of-type(1)',
            // 'div.css-175oi2r.r-18u37iz.r-1h0z5md:nth-of-type(2)',
            // 'div.css-175oi2r.r-18u37iz.r-1h0z5md:nth-of-type(3)',
            // 'div.css-175oi2r.r-18u37iz.r-1h0z5md:nth-of-type(4)',
        ],
        topElementExceptCheckShape: false,
    },
    'weibo.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        topElementExceptCheckShape: false,
    },
    'qunar.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        topElementExceptCheckShape: false,
    },
    'ctrip.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        topElementExceptCheckShape: false,
    },
    'linkedin.com': {
        omitRowElementSelectors: [
            'h2.feed-skip-link__container',
            ' div.scaffold-layout__row.scaffold-layout__content.scaffold-layout__content--sidebar-main-aside.scaffold-layout__content--has-sidebar.scaffold-layout__content--has-aside',
            'main.scaffold-layout__main',
            'div.application-outlet:nth-of-type(5)>div.authentication-outlet:nth-of-type(3)>div#voyager-feed>div.self-focused.ember-view>div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--sidebar-main-aside.scaffold-layout--reflow:nth-of-type(2)>div.scaffold-layout__inner.scaffold-layout-container.scaffold-layout-container--reflow>div.scaffold-layout__row.scaffold-layout__content.scaffold-layout__content--sidebar-main-aside.scaffold-layout__content--has-sidebar.scaffold-layout__content--has-aside>main.scaffold-layout__main>div:nth-of-type(3)',
        ],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        topElementExceptCheckShape: false,
    },
    'youtube.com': {
        omitRowElementSelectors: [
            'div#meta.style-scope',
            'div#metadata-line.style-scope',
            'tp-yt-paper-item.style-scope',
            'ytd-app',
            'ytd-masthead#masthead.masthead-finish',
            'div#sections.style-scope.ytd-guide-renderer',
            'ytd-browse.style-scope.ytd-page-manager',
        ],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        // forcedMergeRowSelectors: [
        //     'div#contents.style-scope.ytd-rich-grid-row',
        // ],
        minElementChildrenCountLimit: 5,
    },
    'amz123.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: [],
        minElementChildrenCountLimit: 1,
    },
    'baidu.com': {
        omitRowElementSelectors: [],
        forcedAddRowClasses: [],
        forcedAddCellSelectors: ['imgitem-title'],
    },
    'reddit.com': {
        omitRowElementSelectors: ['hr.border-0.border-b-sm.border-solid.border-b-neutral-border-weak'],
        forcedAddRowClasses: [
            'article.w-full.m-0',
            'shreddit-ad-post.promotedlink.block.relative',
        ],
        forcedAddCellSelectors: [],
    },
};

export function tableApproximationExtraction(bodyList: HTMLBodyElement[]): { resultSheets: IInitialSheet[]; text: string } {
    const fitColumnTables = extractionTablesElementData(bodyList);

    // console.error('resultTables', mergeTableElements, fitColumnTables, tableElements, tables);

    const resultSheets = toResultTable(fitColumnTables.map((table) => table.tableData), fitColumnTables.map((table) => table.selectorString));

    // Comment the following line becuase it unused
    // const innerText = getConsistentInnerTextAndDisposeTableElements(bodyList, tableElements);
    // console.log('resultSheets', resultSheets, innerText);

    const jsonTable = handlePreElementJsonData(bodyList);

    // console.error('tableApproximationExtraction', performance.now() - time);

    return { resultSheets: [...resultSheets, ...jsonTable], text: bodyList[0].innerText };
}

// 多tab采集应该采集更加底层的ITablesElementData，行合并的时候，对应到列的key，这样才能保持格式一致。
export function extractionTablesElementData(bodyList: HTMLBodyElement[]): ITablesElementData[] {
    const tables: ITableApproximationExtractionParam[] = [];

    // const time = performance.now();

    const config = getEspecialConfig();

    bodyList.forEach((body) => {
        tables.push(...findApproximationTables(body, config));
    });

    // tables.sort((a, b) => b.weightedScore - a.weightedScore);

    const tableElements = tables.map((table) => {
        return new TableElementAnalyze(table, config);
    });

    const mergeTableElements = mergeSimilarTables(tableElements, config);

    const fitColumnTables = fitColumnByTable(mergeTableElements).sort((a, b) => b.weightedScore - a.weightedScore).slice(0, MIN_TOP_FIT_ELEMENT_COUNT_LIMIT);

    return fitColumnTables;
}

// 合并table-like的表格数据
export function mergeTablesElementData(tablesElementData: ITablesElementData[]): IInitialSheet[] {
    let result: ITablesElementData[] = [];
    const sheetMap = new Set<ITablesElementData>();

    tablesElementData.forEach((tableElementData) => {
        if (sheetMap.has(tableElementData)) {
            return;
        }

        const tableSelector = tableElementData.selectorString || '';

        if (tableSelector.length === 0) {
            result.push(tableElementData);
        }

        tablesElementData.forEach((mergeTableElementData) => {
            if (sheetMap.has(mergeTableElementData) || tableElementData === mergeTableElementData) {
                return;
            }

            const mergeTableSelector = mergeTableElementData.selectorString || '';

            if (mergeTableSelector.length === 0) {
                return;
            }

            if (mergeTableSelector === tableSelector) {
                sheetMap.add(mergeTableElementData);

                tableElementData.tableData.push(...mergeTableElementData.tableData);

                tableElementData.area += mergeTableElementData.area;

                tableElementData.weightedScore = getWeightedScore(tableElementData.area, tableElementData.tableData.length);
            }
        });

        result.push(tableElementData);
    });

    result = fitColumnByTable(result);

    return toResultTable(result.map((table) => table.tableData), result.map((table) => table.selectorString));
}

// 精准采集当前元素的表格数据
export function getTableApproximationByElement(element: Element, isGrandchild = false): ITableApproximationExtractionParam | undefined {
    const config = getEspecialConfig();
    let table = findApproximationTableAccurate(element, config);
    if (isGrandchild) {
        const grandChild = findApproximationTableAccurateGrand(element, 2, config);
        if (grandChild != null && table != null) {
            table.grandChildrenLevel = grandChild.grandChildrenLevel;
        } else if (grandChild != null) {
            table = getApproximationWithForce(element);
            table.grandChildrenLevel = grandChild.grandChildrenLevel;
        }
    }
    return table;
}

function getMaxCountChidrenElement(element: Element): Element | null {
    let maxCount = 0;
    let maxElement: Element | null = null;
    Array.from(element.children).forEach((child) => {
        const childElement = child as HTMLElement;
        const count = childElement.children.length;
        if (count > maxCount) {
            maxCount = count;
            maxElement = childElement;
        }
    });
    return maxElement;
}

function findApproximationTableAccurateGrand(element: Element, level = 2, config?: IWorkAroundForEspecialHostItem | undefined): ITableApproximationExtractionParam | undefined {
    const firstChild = getMaxCountChidrenElement(element);

    if (firstChild == null) {
        return;
    }

    const table = findApproximationTableAccurate(firstChild, config);

    if (table != null) {
        table.grandChildrenLevel = level;
        return table;
    }

    return findApproximationTableAccurateGrand(firstChild, level + 1, config);
}

function getClosetApproximationTableElement(element: Element, bodyWidth: number, bodyHeight: number): Element | null {
    const config = getEspecialConfig();
    let table = findApproximationTable(element, bodyWidth, bodyHeight, config);
    let parent = element as HTMLElement | null;

    while (table == null && parent != null) {
        parent = parent.parentElement;
        if (parent == null) {
            break;
        }
        table = findApproximationTable(parent, bodyWidth, bodyHeight, config);
    }

    return parent;
}

export function checkElementApproximationTable(element: Element): ITableApproximationExtractionParam[] {
    const body = document.body;
    const bodyWidth = body.offsetWidth;
    const bodyHeight = body.offsetHeight;

    const config = getEspecialConfig();

    const tableApproximations: ITableApproximationExtractionParam[] = [];

    // const tableElement = element.closest('table');
    // if (tableElement != null) {
    //     return [tableElement];
    // }

    let parent = getClosetApproximationTableElement(element, bodyWidth, bodyHeight) as HTMLElement | null;

    if (parent == null) {
        return [];
    }

    let table = findApproximationTable(parent, bodyWidth, bodyHeight, config);

    while (table != null && parent != null) {
        tableApproximations.push(table);
        parent = parent.parentElement;
        if (parent == null) {
            break;
        }
        table = findApproximationTable(parent, bodyWidth, bodyHeight, config);
    }

    return tableApproximations;
}

interface ILazyLoadElements {
    table: ITableApproximationExtractionParam;
    isAdded: boolean;
    rowData: ITableElementAnalyzeRowData[];
}

export class LazyLoadElements {
    private _onRowsUpdated$ = new ObservableValue<ISheet_Row[]>([]);
    private _onChange$ = new ObservableValue<void>(undefined);
    private _cloneTables: ILazyLoadElements[] = [];
    private _observers: MutationObserver[] = [];
    private _existingTexts: Set<string> = new Set();
    // private _existingTextRows: Map<string, Node> = new Map();
    // private _existingRows: Set<Node> = new Set();

    constructor(private _tables: ITableApproximationExtractionParam[], private _isGrandchild = false) {
        this._init();

        this._scrollListener();

        this._onRowsUpdated$.subscribe(() => {
            this._onChange$.next();
        });
    }

    get rows() {
        return this._cloneTables.reduce((rows, table) => rows + table.rowData.length, 0);
    }

    findItemByElement(element: Element) {
        return this._cloneTables.find((cloneTable) => cloneTable.table.element === element);
    }

    updateItemElement(item: ILazyLoadElements, element: Element) {
        item.table.element = element;
        this._handleLazyLoad(item);
    }

    private _init() {
        const config = getEspecialConfig();

        if (this._isGrandchild) {
            this._cloneTables = this._tables.map((table) => {
                const grandChildrenLevel = table.grandChildrenLevel || 2;
                const newTable = {
                    element: table.element,
                    children: [],
                    fitClasses: table.fitClasses,
                    area: table.area,
                    textContent: table.textContent,
                    weightedScore: table.weightedScore,
                    selectorString: table.selectorString,
                } as ITableApproximationExtractionParam;
                if (table.grandChildrenLevel) {
                    newTable.grandChildrenLevel = grandChildrenLevel;
                    newTable.children = getElementsAtDepth(table.element, grandChildrenLevel);
                } else {
                    newTable.children = Array.from(table.element.children);
                }
                this._filterAddedNodes(newTable.children);
                return { table: newTable, isAdded: false, rowData: new TableElementAnalyze(newTable, config).tableData };
            });
        } else {
            this._cloneTables = this._tables.map((table) => {
                this._filterAddedNodes(table.children);
                return { table, isAdded: false, rowData: new TableElementAnalyze(table, config).tableData };
            });
        }

        setTimeout(() => {
            this._onChange$.next();
        });
    }

    private _disposeWithMe(observer: MutationObserver) {
        this._observers.push(observer);
    }

    private _filterAddedNodes(elements: Element[]) {
        return Array.from(elements).filter((node) => {
            if (node.nodeType !== 1) {
                return false;
            }
                // if (node.parentElement !== cloneTable.table.element) {
                //     return false;
                // }
            // if (this._existingRows.has(node)) {
            //     return false;
            // }

            // const isExsiting = this._existingRows.has(node)

            const text = getElementCompareContent(node as HTMLElement);
            if (this._existingTexts.has(text)) {
                return false;
            }
            this._existingTexts.add(text);

            // this._existingRows.add(node);
            return true;
        }) as Element[];
    }

    private _handleLazyLoad(cloneTable: ILazyLoadElements) {
        const tableElement = cloneTable.table.element;

        const config = getEspecialConfig();
        let addedNodes: Element[] = [];

        if (this._isGrandchild) {
            const grandChildrenLevel = cloneTable.table.grandChildrenLevel || 2;

            const elements = getElementsAtDepth(tableElement, grandChildrenLevel);

            addedNodes = this._filterAddedNodes(elements);
        } else {
            addedNodes = this._filterAddedNodes(Array.from(tableElement.children));
        }

        if (addedNodes.length === 0) {
            return;
        }

        cloneTable.isAdded = true;

        const childElements = addedNodes.filter((node) => {
            return node instanceof Element;
        }) as Element[];

        const tableElementAnalyze = new TableElementAnalyze({
            element: tableElement,
            children: childElements,
            fitClasses: cloneTable.table.fitClasses,
            area: cloneTable.table.area,
            textContent: cloneTable.table.textContent,
            weightedScore: cloneTable.table.weightedScore,
            selectorString: cloneTable.table.selectorString,
        }, config);

        cloneTable.rowData = cloneTable.rowData.concat(tableElementAnalyze.tableData);

        this._onRowsUpdated$.next(analyzeRowsToSheetRows(tableElementAnalyze.tableData));
    }

    private _scrollListener() {
        this._cloneTables.forEach((cloneTable) => {
            const observer = new MutationObserver((mutationsList, observer) => {
                this._handleLazyLoad(cloneTable);
            });

            observer.observe(cloneTable.table.element, { childList: true, subtree: true });

            this._disposeWithMe(observer);
        });
    }

    onRowsUpdated(listener: (rows: ISheet_Row[]) => void) {
        return this._onRowsUpdated$.subscribe(listener);
    }

    onChange(listener: () => void) {
        return this._onChange$.subscribe(listener);
    }

    dispose() {
        this._cloneTables = [];

        this._observers.forEach((obs) => {
            obs.disconnect();
        });
        this._observers = [];
        this._onChange$.dispose();
        this._onRowsUpdated$.dispose();
        // this._existingRows.clear();
        this._existingTexts.clear();
    }

    getFilterTable() {
        return this._cloneTables.filter((cloneTable) => {
            return cloneTable.isAdded;
        }).map((cloneTable) => {
            return cloneTable;
        });
    }

    getAddedSheets() {
        const table = this.getFilterTable();
        return toResultTable(table.map((cloneTable) => cloneTable.rowData), table.map((cloneTable) => cloneTable.table.selectorString));
    }

    public getAllSheets(): IInitialSheet[] {
        const table = fitColumnByTable(this._toTablesElementData());
        return toResultTable(table.map((cloneTable) => cloneTable.tableData), table.map((cloneTable) => cloneTable.selectorString));
    }

    private _toTablesElementData() {
        return this._cloneTables.map((cloneTable) => {
            return {
                tableData: cloneTable.rowData,
                area: cloneTable.table.area,
                weightedScore: cloneTable.table.weightedScore,
                selectorString: cloneTable.table.selectorString,
            };
        });
    }
}

// console.error('getTableApproximationByElement', getTableApproximationByElement);

// console.error('LazyLoadElements', LazyLoadElements);

export interface ITableApproximationExtractionParam {
    element: Element;
    fitClasses: string[];
    area: number;
    children: Element[];
    textContent: string | null;
    weightedScore: number;
    selectorString: string;
    grandChildrenLevel?: number;
}

function handlePreElementJsonData(bodyList: HTMLBodyElement[]): IInitialSheet[] {
    const jsonList: UnknownJson[] = [];
    bodyList.forEach((body) => {
        const preElements = body.getElementsByTagName('pre');
        Array.from(preElements).forEach((element) => {
            const text = getElementText(element);
            try {
                const json = JSON.parse(text) as UnknownJson;
                jsonList.push(json);
            } catch (e) {

            }
        });
    });

    return ajaxJsonToTable(jsonList);
}

export function getEspecialConfig(): IWorkAroundForEspecialHostItem | undefined {
    const host = window.location.host;
    return WORK_AROUND_FOR_ESPECIAL_HOST[host.split('.').slice(-2).join('.')];
}

export function findApproximationTables(body: HTMLBodyElement, config?: IWorkAroundForEspecialHostItem | undefined): ITableApproximationExtractionParam[] {
    let allHtmlDomElements = Array.from(body.getElementsByTagName('*'));
    const bodyWidth = body.offsetWidth;
    const bodyHeight = body.offsetHeight;

    const tables: ITableApproximationExtractionParam[] = [];

    if (config) {
        config.omitRowElementSelectors?.forEach((selector) => {
            allHtmlDomElements = allHtmlDomElements.filter((child) => {
                const childElement = child as HTMLElement;
                return !childElement.matches(selector);
            });
        });
    }

    Array.from(allHtmlDomElements).forEach((element) => {
        const table = findApproximationTable(element, bodyWidth, bodyHeight, config);

        if (table == null) {
            return;
        }

        tables.push(table);
    });

    return tables;
}

function getApproximationWithForce(element: Element): ITableApproximationExtractionParam {
    const childrenCount = element.children.length;

    const { width: elementWidth, height: elementHeight } = getHiddenElementDimensions(element as HTMLElement);

    const elementArea = elementWidth * elementHeight;

    const weightedScore = getWeightedScore(elementArea, childrenCount);

    const children = Array.from(element.children);

    const classCounts: { [key: string]: number } = {}; // 用于统计每种类名组合出现的次数

    children.forEach((child) => {
        const childElement = child as HTMLElement;
        // 排除特定的元素并且包含文本内容 && childElement.innerText?.trim().length
        if (!EXCLUDED_TAGS.includes(childElement.nodeName.toLowerCase())) {
            const classes = getElementClasses(childElement).sort(); // 获取元素的类名并排序
            let classKey = classes.join(' '); // 将类名数组拼接成字符串
            if (classKey.length === 0) {
                classKey = 'UniverBlankClassKey000'; // 如果类名为空，设置一个默认值
            }
            if (!(classKey in classCounts)) classCounts[classKey] = 0; // 初始化类名组合计数
            classCounts[classKey]++; // 增加类名组合计数
        }
    });

    const fitClasses = Object.keys(classCounts);

    return {
        element,
        fitClasses,
        area: elementArea,
        children: Array.from(element.children) as Element[],
        textContent: getElementText(element as HTMLElement),
        weightedScore,
        selectorString: generateUniqueSelector(element),
    };
}

export function findApproximationTable(element: Element, bodyWidth: number = 0, bodyHeight: number = 0, config?: IWorkAroundForEspecialHostItem | undefined) {
    if (EXCLUDED_TAGS.includes(element.tagName.toLowerCase())) {
        return;
    }

    const { width: elementWidth, height: elementHeight, offsetHeight, offsetWidth } = getHiddenElementDimensions(element as HTMLElement);

    const elementArea = elementWidth * elementHeight;

    if (Number.isNaN(elementArea)) {
        return;
    }

    if (offsetWidth >= bodyWidth * (1 - MIN_ELEMENT_SIZE_RATIO_LIMIT) && offsetHeight >= bodyHeight * (1 - MIN_ELEMENT_SIZE_RATIO_LIMIT)) {
        return;
    }

    const result = analyzeApproximatedTable(element, config);

    if (result == null) {
        return;
    }

    const { children, fitClasses } = result;

    const childrenCount = children.length;

    if (elementArea === 0 && childrenCount < 20) {
        return;
    }

    if (children.length < (config?.minElementChildrenCountLimit || MIN_ELEMENT_CHILDREN_COUNT_LIMIT)) {
        return;
    }

    if (childrenCount === 1) {
        const currentElement = children[0];
        const elementWidth = (currentElement as HTMLElement).offsetWidth;
        const elementHeight = (currentElement as HTMLElement).offsetHeight;

        const bodyRectangle = {
            x: 0,
            y: 0,
            width: bodyWidth,
            height: bodyHeight,
        };

        const currentRectangle = {
            x: (currentElement as HTMLElement).offsetLeft,
            y: (currentElement as HTMLElement).offsetTop,
            width: elementWidth,
            height: elementHeight,
        };

        const areaScore = calculateAreaScore(bodyRectangle, currentRectangle);

        if (areaScore < 60 || Number.isNaN(areaScore)) {
            return;
        }
    }

    if (topElementExcept(children, config) === true) {
        return;
    }

    // if (elementArea / childrenCount > MAX_TABLE_ROW_AREA_LIMIT) {
    //     return;
    // }

    const weightedScore = getWeightedScore(elementArea, childrenCount);

    return {
        element,
        fitClasses,
        area: elementArea,
        children,
        textContent: getElementText(element as HTMLElement),
        weightedScore,
        selectorString: generateUniqueSelector(element),
    };
}

function findApproximationTableAccurate(element: Element, config?: IWorkAroundForEspecialHostItem | undefined): ITableApproximationExtractionParam | undefined {
    if (EXCLUDED_TAGS.includes(element.tagName.toLowerCase())) {
        return;
    }

    const result = analyzeApproximatedTable(element, config);

    if (result == null) {
        return;
    }

    const { children, fitClasses } = result;

    if (children.length === 0) {
        return;
    }

    const childrenCount = children.length;

    const { width: elementWidth, height: elementHeight } = getHiddenElementDimensions(element as HTMLElement);

    const elementArea = elementWidth * elementHeight;

    const weightedScore = getWeightedScore(elementArea, childrenCount);

    return {
        element,
        fitClasses,
        area: elementArea,
        children,
        textContent: getElementText(element as HTMLElement),
        weightedScore,
        selectorString: generateUniqueSelector(element),
    };
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

function calculateAreaScore(rect1: Rectangle, rect2: Rectangle): number {
    const area1 = rect1.width * rect1.height;
    const area2 = rect2.width * rect2.height;

    // 差异越小，得分越低
    const diff = Math.abs(area1 - area2);
    const maxArea = Math.max(area1, area2);

    return (diff / maxArea) * 100;
}

// function calculateShapeScore(rect1: Rectangle, rect2: Rectangle): number {
//     let aspectRatio1 = rect1.width / rect1.height;
//     let aspectRatio2 = rect2.width / rect2.height;

//     if (rect1.width > rect1.height) {
//         aspectRatio1 = rect1.height / rect1.width;
//         aspectRatio2 = rect2.height / rect2.width;
//     }

//     // 差异越小，得分越低
//     const diff = Math.abs(aspectRatio1 - aspectRatio2);

//     // 计算差异分数，从0到100
//     // 这里我们假设最大差异值是一个合理的值，比如2（即宽高比差异达到2）
//     const maxDiff = 2;
//     const score = (diff / maxDiff) * 100;

//     // 确保分数在0到100之间
//     return Math.min(score, 100);
// }

function calculateDiffScore(num1: number, num2: number): number {
    // 差异越小，得分越低
    const diff = Math.abs(num1 - num2);
    const maxArea = Math.max(num1, num2);

    return (diff / maxArea) * 100;
}

function checkInValidSize(width: number, height: number) {
    return width * height > 100000 * (window.devicePixelRatio || 1);
}

function topElementExcept(children: Element[], config: IWorkAroundForEspecialHostItem | undefined) {
    const childrenCount = children.length;

    if (childrenCount > (config?.topElementExceptLimit || 10)) {
        return false;
    }
    let preRectangle: Rectangle | null = null;
    let exceptCount = 0;
    for (let i = 0; i < childrenCount; i++) {
        const child = children[i];

        const elementWidth = (child as HTMLElement).offsetWidth;
        const elementHeight = (child as HTMLElement).offsetHeight;

        const currentRectangle = {
            x: (child as HTMLElement).offsetLeft,
            y: (child as HTMLElement).offsetTop,
            width: elementWidth,
            height: elementHeight,
        };

        if (preRectangle == null) {
            preRectangle = currentRectangle;
            continue;
        }

        const widthScore = calculateDiffScore(currentRectangle.width, preRectangle!.width);

        const heightScore = calculateDiffScore(currentRectangle.height, preRectangle!.height);

        const isSkip = config?.topElementExceptCheckShape !== false;

        if ((isSkip && (widthScore + heightScore) > 40)
            || (isSkip && checkInValidSize(currentRectangle.width, currentRectangle.height))
            || Number.isNaN(widthScore) || Number.isNaN(heightScore)) {
            exceptCount++;
        }

        preRectangle = currentRectangle;
    }

    if (exceptCount > Math.max(childrenCount / 2 - 2, 0)) {
        return true;
    }

    return false;
}

// 获取隐藏元素的宽高
function getHiddenElementDimensions(element: HTMLElement): { width: number; height: number; offsetWidth: number; offsetHeight: number } {
    let width = element.scrollWidth; // 获取元素的宽度
    let height = element.scrollHeight; // 获取元素的高度
    let offsetWidth = element.offsetWidth; // 获取元素的宽度
    let offsetHeight = element.offsetHeight; // 获取元素的高度

    if (width !== 0 && height !== 0) {
        return { width, height, offsetWidth, offsetHeight }; // 返回宽高
    }

    // 如果元素的宽高为0，可能是因为元素是隐藏的，需要获取元素的当前样式
    if (element.style.display !== 'none' && element.style.visibility !== 'hidden' && element.style.opacity !== '0') {
        return { width, height, offsetWidth, offsetHeight }; // 返回宽高
    }

    // 获取元素的当前样式
    const originalDisplay = element.style.display;
    const originalVisibility = element.style.visibility;
    const originalPosition = element.style.position;

    // 临时显示元素以测量其宽高
    element.style.display = 'block';
    element.style.visibility = 'hidden';
    element.style.position = 'absolute';

    // 获取元素的宽高
    width = element.scrollWidth;
    height = element.scrollHeight;
    offsetWidth = element.offsetWidth;
    offsetHeight = element.offsetHeight;

    // 恢复元素的原始样式
    element.style.display = originalDisplay;
    element.style.visibility = originalVisibility;
    element.style.position = originalPosition;

    return { width, height, offsetWidth, offsetHeight }; // 返回宽高
}

function getConsistentInnerTextAndDisposeTableElements(elements: HTMLElement[], tableElements: TableElementAnalyze[]): string {
    let innerText = '';

    elements.forEach((element) => {
        // 克隆传入的元素，深度克隆（包括所有子节点）
        const clone = element.cloneNode(true) as HTMLElement;

        // 创建一个临时的容器来存放克隆的元素
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed'; // 使容器脱离文档流
        tempContainer.style.top = '0'; // 放在可见区域外
        tempContainer.style.left = '-9999px'; // 放在可见区域外
        tempContainer.style.height = 'auto'; // 自动高度
        tempContainer.style.width = 'auto'; // 自动宽度
        tempContainer.style.overflow = 'hidden'; // 防止溢出

        tempContainer.appendChild(clone); // 将克隆的元素添加到临时容器中
        document.body.appendChild(tempContainer); // 将临时容器添加到文档中

        // 移除所有表格元素和分析过的表格元素
        removeBodyElementsAndDisposeTableElementAnalyze(tableElements, clone);
        safeQueryHelper.querySelectorAll(clone, 'table').forEach((table) => {
            table.remove();
        });

        // 获取克隆元素的 innerText
        innerText += getElementText(clone);

        try {
            // 从文档中移除临时容器
            document.body.removeChild(tempContainer);
        } catch (e) {
            // 如果移除失败，不做任何操作
        }
    });

    return innerText; // 返回一致的 innerText
}

function removeBodyElementsAndDisposeTableElementAnalyze(tableElements: TableElementAnalyze[], body: HTMLElement) {
    tableElements.forEach((tableElement) => {
        const selector = tableElement.getSelectorString();
        const element = selector ? findElementBySelectorByDom(selector, body) : null;
        element?.remove();

        tableElement.dispose();
    });
}

function compareTableRowKeys(cellKeys1: string[], cellKeys2: string[]) {
    const rowKey1Length = cellKeys1.length;
    const rowKey2Length = cellKeys2.length;

    const diff = Math.abs(rowKey1Length - rowKey2Length);

    if (diff >= MAX_CELL_DIFF_BETWEEN_MERGED_ROWS) {
        return false;
    }

    let shortKeys = cellKeys1;
    let longKeys = cellKeys2;

    if (rowKey1Length > rowKey2Length) {
        shortKeys = cellKeys2;
        longKeys = cellKeys1;
    }

    let longIndex = 0;
    let errorLimit = Math.ceil(shortKeys.length * COMPARE_TABLE_ERROR_ROW_RATIO);
    for (let shortIndex = 0; shortIndex < shortKeys.length; shortIndex++) {
        const short = shortKeys[shortIndex];
        const long = longKeys[longIndex];

        if (short !== long) {
            let isMatchAlong = false;
            for (let i = longIndex + 1; i < longKeys.length; i++) {
                if (longKeys[i] === short) {
                    longIndex = i + 1;
                    isMatchAlong = true;
                    break;
                }
            }
            if (!isMatchAlong) {
                if (errorLimit === 0) {
                    return false;
                } else {
                    errorLimit--;
                }
            }
        } else {
            longIndex++;
        }
    }

    return true;
}

export function fitColumnByTable(tablesElements: ITablesElementData[]) {
    const resultTableData: ITablesElementData[] = [];
    tablesElements.forEach((tablesElement) => {
        const columnDataKeys: ITableElementAnalyzeRowData = {};
        const tableData = tablesElement.tableData;
        tableData.forEach((rowData) => {
            Object.keys(rowData).forEach((cellKey) => {
                columnDataKeys[cellKey] = { text: '' };
            });
        });

        const newTableData: ITableElementAnalyzeRowData[] = [];
        tableData.forEach((rowData) => {
            const newRowTemplate = { ...columnDataKeys };
            Object.keys(rowData).forEach((cellKey) => {
                const cellData = rowData[cellKey];
                newRowTemplate[cellKey] = cellData;
            });
            newTableData.push(newRowTemplate);
        });
        if (newTableData.length === 0) {
            return;
        }
        const rowCount = newTableData.length;
        const colCount = Object.keys(newTableData[0]).length;
        if (colCount / rowCount > MIN_COLUMN_ROW_RATIO_LIMIT) {
            return;
        }
        resultTableData.push({
            tableData: deleteRepeatColumn(newTableData),
            area: tablesElement.area,
            weightedScore: tablesElement.weightedScore,
            selectorString: tablesElement.selectorString,
        });
    });
    return resultTableData;
}

export interface ITablesElementData {
    tableData: ITableElementAnalyzeRowData[];
    area: number;
    weightedScore: number;
    selectorString: string;
}

/**
 * 检查 dom1 是否是 dom2 的任意层级的孙子节点元素
 * @param dom1 - 要检查的元素
 * @param dom2 - 父元素
 * @returns 如果 dom1 是 dom2 的任意层级的孙子节点元素，则返回 true；否则返回 false
 */
function isDescendant(dom1: HTMLElement, dom2: HTMLElement): boolean {
    // 使用递归函数检查子节点
    function checkDescendants(parent: HTMLElement): boolean {
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i] as HTMLElement;
            if (child === dom1) {
                return true;
            }
            if (checkDescendants(child)) {
                return true;
            }
        }
        return false;
    }

    return checkDescendants(dom2);
}

function isSimilarTableRow(currentElementDom: Element, compareElementDom: Element): boolean {
    const selector = generateSelector(currentElementDom);
    const compareSelector = generateSelector(compareElementDom);
    return selector === compareSelector;
}

function getMaxColumnCount(rows: ITableElementAnalyzeRowData[]): number {
    let maxCount = 0;
    rows.forEach((row) => {
        const count = Object.keys(row).length;
        if (count > maxCount) {
            maxCount = count;
        }
    });

    return maxCount;
}

function mergeSimilarTables(tablesElements: TableElementAnalyze[], config?: IWorkAroundForEspecialHostItem | undefined): ITablesElementData[] {
    const resultTableData: ITablesElementData[] = [];

    const comparedTableCache = new Map<string, string[]>();
    const skipTableCache = new Set<string>();

    for (let i = 0; i < tablesElements.length; i++) {
        const tableElement = tablesElements[i];
        const tableData = tableElement.tableData;
        const currentElementDom = tableElement.tableParam?.element;

        const selector = tableElement.getSelectorString();

        if (!selector || skipTableCache.has(selector)) {
            continue;
        }

        if (tableData.length === 0 || currentElementDom == null) {
            continue;
        }

        const shouldMergeTableData: ITableElementAnalyzeRowData[] = [];

        const tableColumnCount = getMaxColumnCount(tableData);

        for (let j = 0; j < tablesElements.length; j++) {
            const compareTableElement = tablesElements[j];
            const compareSelector = compareTableElement.getSelectorString();
            const compareElementDom = compareTableElement.tableParam?.element;

            if (!compareSelector || !compareElementDom || tableElement === compareTableElement || comparedTableCache.get(selector)?.includes(compareSelector) || skipTableCache.has(compareSelector)) {
                continue;
            }

            if (isDescendant(compareElementDom as HTMLElement, currentElementDom as HTMLElement)) {
                continue;
            }

            if (isDescendant(currentElementDom as HTMLElement, compareElementDom as HTMLElement)) {
                continue;
            }

            const compareTableData = compareTableElement.tableData;

            const rowDataCount = Math.min(tableData.length, compareTableData.length);

            const compareColumnCount = getMaxColumnCount(compareTableData);

            let isSimilar = true;

            if (!isSimilarTableRow(currentElementDom, compareElementDom)) {
                if (compareColumnCount === 1 && tableColumnCount !== compareColumnCount) {
                    isSimilar = false;
                } else {
                    let rowSimilarCountLimit = Math.floor(rowDataCount * ROW_SIMILAR_COUNT_RATIO);
                    for (let k = 0; k < rowDataCount; k++) {
                        const rowData = tableData[k];
                        const cellDataKeys = Object.keys(rowData);
                        const compareRowData = compareTableData[k];
                        const compareCellDataKeys = Object.keys(compareRowData);

                        if (!compareTableRowKeys(cellDataKeys, compareCellDataKeys)) {
                            if (rowSimilarCountLimit === 0) {
                                isSimilar = false;
                                break;
                            } else {
                                rowSimilarCountLimit--;
                            }
                        }
                    }
                }
            }

            addComparedTableCache(comparedTableCache, selector, compareSelector);
            addComparedTableCache(comparedTableCache, compareSelector, selector);

            if (!isSimilar) {
                continue;
            }

            skipTableCache.add(compareSelector);

            shouldMergeTableData.push(...compareTableData);
        }

        resultTableData.push({
            tableData: [...tableData, ...shouldMergeTableData],
            area: tableElement.tableParam?.area || 0,
            weightedScore: tableElement.tableParam?.weightedScore || 0,
            selectorString: generateSelector(tableElement.getElement()),
        });
    }

    return resultTableData;
}

function addComparedTableCache(comparedTableCache: Map<string, string[]>, tableSelector: string, compareSelector: string) {
    if (!comparedTableCache.has(tableSelector)) {
        comparedTableCache.set(tableSelector, []);
    }

    const compareSelectors = comparedTableCache.get(tableSelector);

    compareSelectors!.push(compareSelector);
}

function omitParentElement(tables: ITableApproximationExtractionParam[]) {
    const filterTables: ITableApproximationExtractionParam[] = [];
    if (tables.length === 0) {
        return [];
    }

    tables.forEach((table) => {
        // if(table.fitClasses.length > 0) {
        //     filterTables.push(table);
        //     return;
        // }
        // let isParent = false;
        for (let i = 0; i < tables.length; i++) {
            const compareTable = tables[i];
            if (compareTable === table) {
                continue;
            }

            if (table.children.includes(compareTable.element)) {
                return;
            }
        }

        filterTables.push(table);
    });

    return filterTables;
}

export function getWeightedScore(elementArea: number, childrenCount: number): number {
    return elementArea * childrenCount * childrenCount;
}

const eventMouseLeave = new Event('mouseleave');
const eventBlur = new Event('blur');
const eventMouseout = new Event('mouseout');

// 生成单元格的选择器
function generateCellSelector(element: Element, parentElement: Element): string {
    // 触发鼠标离开事件和失焦事件

    element.dispatchEvent(eventMouseLeave);
    element.dispatchEvent(eventBlur);
    element.dispatchEvent(eventMouseout);

    // 获取元素及其所有祖先元素
    const elements = [];
    let currentElement: Element | null = element;
    while (currentElement && currentElement.tagName.toLowerCase() !== 'html' && currentElement.tagName.toLowerCase() !== 'body' && currentElement !== parentElement) {
        elements.push(currentElement);
        currentElement = currentElement.parentElement;
    }

    if (currentElement != null && currentElement !== parentElement) {
        elements.push(currentElement);
    }

    // 生成唯一选择器字符串
    const selector: string[] = [];
    elements.reverse().forEach((el) => {
        let tag = el.tagName.toLowerCase();

        if (typeof el.className === 'string' && el.className.trim()) { // 如果元素有类名
            tag += escapeSpecialCharacters(el.className).replace(/\s+/g, '.'); // 将类名添加到标签名后面
        }

        if (safeQueryHelper.querySelectorAll(parentElement, tag).length > 1) {
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
        }

        selector.push(tag); // 返回标签名
    }); // 将所有标签名拼接成选择器字符串

    return selector.join('>');
}

interface IAnalyzeApproximatedTableParam {
    children: Element[];
    fitClasses: string[];
}

// 获取元素的类名数组
function getElementClasses(element: Element): string[] {
    // 获取元素的类名，去除首尾空格，按空格分割成数组，过滤掉空字符串
    if (!element.className) return [];
    const className = (element.className.trim && element.className.trim()) || '';
    return className.split(/\s+/).filter(function (className) {
        return className.length > 0; // 过滤掉空字符串
    });
}

// 判断元素是否包含指定的类名
function hasClasses(element: Element, classNames: string): boolean {
    const classArray = classNames.split(' '); // 将类名字符串分割成数组
    for (let i = 0; i < classArray.length; i++) {
        if (!element.classList.contains(classArray[i])) return false; // 如果元素不包含某个类名，则返回false
    }
    return true; // 如果元素包含所有类名，则返回true
}

// 分析DOM结构中的元素，获取符合条件的子元素及类名
function analyzeApproximatedTable(element: Element, config?: IWorkAroundForEspecialHostItem): IAnalyzeApproximatedTableParam | undefined {
    let children = Array.from(element.children); // 获取元素的所有子元素

    if (children.length < (config?.minElementChildrenCountLimit || MIN_ELEMENT_CHILDREN_COUNT_LIMIT)) {
        return;
    }

    if (config) {
        config.omitRowElementSelectors?.forEach((selector) => {
            children = children.filter((child) => {
                const childElement = child as HTMLElement;
                return !childElement.matches(selector);
            });
        });
    }

    const classCounts: { [key: string]: number } = {}; // 用于统计每种类名组合出现的次数
    const individualClassCounts: { [key: string]: number } = {}; // 用于统计每个单独类名出现的次数

    children.forEach((child) => {
        const childElement = child as HTMLElement;
        // 排除特定的元素并且包含文本内容 && childElement.innerText?.trim().length
        if (!EXCLUDED_TAGS.includes(childElement.nodeName.toLowerCase())) {
            const classes = getElementClasses(childElement).sort(); // 获取元素的类名并排序
            let classKey = classes.join(' '); // 将类名数组拼接成字符串
            if (classKey.length === 0) {
                classKey = 'UniverBlankClassKey000'; // 如果类名为空，设置一个默认值
            }
            if (!(classKey in classCounts)) classCounts[classKey] = 0; // 初始化类名组合计数
            classCounts[classKey]++; // 增加类名组合计数
            classes.forEach((className) => {
                if (!(className in individualClassCounts)) individualClassCounts[className] = 0; // 初始化单独类名计数
                individualClassCounts[className]++; // 增加单独类名计数
            });
        }
    });

    let commonClasses = Object.keys(classCounts).filter((key) => {
        return classCounts[key] >= children.length / 2 - 2; // 找出出现次数较多的类名组合
    });

    if (!commonClasses.length) {
        commonClasses = Object.keys(individualClassCounts).filter((key) => {
            return individualClassCounts[key] >= children.length / 2 - 2; // 找出出现次数较多的单独类名
        });
    } else {
        // 找出出现次数较少的类名组合，并逐个判断，弥补因为加入独立样式而缺少的行
        const notCommonClasses = Object.keys(classCounts).filter((key) => {
            return classCounts[key] < children.length / 2 - 2; // 找出出现次数较少的类名组合
        });

        const additionalClasses: string[] = [];
        notCommonClasses.forEach((key) => {
            const classes = key.split(' ');
            for (let i = 0; i < classes.length; i++) {
                const className = classes[i];
                if (individualClassCounts[className] >= children.length / 2 - 2) {
                    additionalClasses.push(className);
                    break;
                }
            }
        });
        commonClasses.push(...additionalClasses);
    }

    if (config) {
        config.forcedAddRowClasses?.forEach((classes) => {
            if (!commonClasses.includes(classes)) {
                commonClasses.push(classes);
            }
        });
    }

    // 检查元素大小和子元素数量
    const elementWidth = (element as HTMLElement).scrollWidth;
    const elementHeight = (element as HTMLElement).scrollHeight;
    if (elementWidth * elementHeight > 50000 && children.length) {
        if (!commonClasses.length || (commonClasses.length === 1 && commonClasses[0] === '')) {
            return {
                children: children.filter((child) => {
                    const childElement = child as HTMLElement;
                    // 过滤掉特定的元素，保留有文本内容的元素
                    return childElement.nodeName ? !EXCLUDED_TAGS.includes(childElement.nodeName.toLowerCase()) && !!getElementText(childElement).trim().length : false;
                }),
                fitClasses: [],
            };
        }
    }

    const childrenFilter = children.filter((child) => {
        let matched = false;
        const currentElement = child as HTMLElement;
        // 检查子元素是否包含特定的类名
        commonClasses.forEach((className) => {
            if (className === 'UniverBlankClassKey000' && (!currentElement.className || currentElement.className.length === 0)) {
                matched = matched || true;
                return;
            }
            matched = matched || hasClasses(currentElement, className);
        });
        return matched;
    });

    if (childrenFilter.length < (config?.minElementChildrenCountLimit || MIN_ELEMENT_CHILDREN_COUNT_LIMIT)) {
        return;
    }

    // 返回符合条件的子元素及类名
    return {
        children: childrenFilter,
        fitClasses: commonClasses,
    };
}

// function generateHash(str: string): string {
//     let hash = 0;

//     for (let i = 0; i < str.length; i++) {
//         hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
//     }

//     // Convert it to an unsigned 32-bit integer.
//     return (hash >>> 0).toString();
// }

// // 检查元素是否已经被访问过
// function hasElementBeenVisited(text: string): boolean {
//     const visited = localStorage.getItem("visited");
//     if (visited === null) return false; // 如果没有访问记录，返回false
//     const hash = generateHash(text); // 生成文本的哈希值
//     const visitedList = JSON.parse(visited); // 获取访问记录
//     return visitedList[visitedList.length - 1] === hash || visitedList[visitedList.length - 2] === hash; // 检查哈希值是否在最近两次访问记录中
// }

// // 记录访问过的元素
// function markElementAsVisited(text: string): void {
//     let visited = localStorage.getItem("visited");
//     if (visited === null) {
//         localStorage.setItem("visited", JSON.stringify([])); // 如果没有访问记录，初始化访问记录
//         visited = "[]";
//     }
//     const visitedList = JSON.parse(visited); // 获取访问记录
//     visitedList.push(generateHash(text)); // 将哈希值添加到访问记录中
//     localStorage.setItem("visited", JSON.stringify(visitedList)); // 更新访问记录
// }

// 通过选择器查找元素
export function findElementBySelector(selector: string): HTMLElement | null {
    return findElementBySelectorByDom(selector);
}

// 通过选择器查找元素
function findElementBySelectorByDom(selector: string, body?: HTMLElement): HTMLElement | null {
    if (body == null) {
        body = document.body;
    }
    let element: HTMLElement | null = null;
    while (selector.length) { // 循环直到选择器为空
        element = safeQueryHelper.querySelector(body, selector) as HTMLElement;
        if (element) return element; // 如果找到元素，返回该元素
        selector = selector.split('>').slice(1).join('>'); // 否则去掉选择器的第一个部分，继续查找
    }
    return null; // 如果没有找到元素，返回null
}

function getCombinations(arr: string[]): string[][] {
    const result: string[][] = [];

    function helper(start: number, combo: string[]) {
        for (let i = start; i < arr.length; i++) {
            const newCombo = [...combo, arr[i]];
            result.push(newCombo);
            helper(i + 1, newCombo);
        }
    }

    helper(1, [arr[0]]); // 启动递归，从第二个元素开始

    return result;
}

class TableElementAnalyze {
    private _tableData: ITableElementAnalyzeRowData[] = [];

    constructor(private _tableParam: ITableApproximationExtractionParam | undefined, config?: IWorkAroundForEspecialHostItem | undefined) {
        this._forcedAddCellSelectors = config?.forcedAddCellSelectors || [];

        // this.refreshParam();

        this._tableData = this.getTableData();
    }

    getElement() {
        return this._tableParam?.element;
    }

    getSelectorString() {
        return this._tableParam?.selectorString;
    }

    get tableParam() {
        return this._tableParam;
    }

    get tableData() {
        return this._tableData;
    }

    dispose() {
        this._tableParam = null as unknown as ITableApproximationExtractionParam;
        this._rowDataCache = {};
        this._selectors = [];
        this._tableData = [];
        this._classes = [];
        this._classesCounts.clear();
        this._selectorsCount.clear();
        // this._partOfLongClassByDom.clear();
    }

    getRowText(children: HTMLElement[]): string {
        return Array.from(children).map((child) => getElementText(child)).join(' ');
    }

    refreshParam() {
        if (!this._tableParam) {
            return;
        }

        const tableElement = findElementBySelector(this._tableParam.selectorString);
        if (!tableElement) {
            return;
        }

        const analysis = analyzeApproximatedTable(tableElement);
        if (!analysis) {
            return;
        }
        const children = analysis.children;
        this._tableParam.element = tableElement;
        this._tableParam.children = children;
        this._tableParam.fitClasses = analysis.fitClasses;
        this._tableParam.textContent = this.getRowText(children as HTMLElement[]);
    }

    private _rowDataCache: ITableElementAnalyzeRowData = {};

    private _selectors: string[] = [];

    private _selectorsCount = new Map<string, number>();

    private _classesCounts = new Map<string, number>();

    private _classes: string[] = [];

    private _forcedAddCellSelectors: string[] = [];

    getTableData() {
        this._tableParam?.children?.forEach((rowElement) => {
            this._analyzeRow(rowElement);
        });

        this._clearSelectors();

        if (this._selectors.length === 0 && this._classes.length === 0) {
            return [];
        }

        const data = this._getCellBySelector();

        return data;
    }

    private _checkIsRichText(cellElement: HTMLElement) {
        const childTextNodes = Array.from(cellElement.childNodes).filter((node) =>
            node.nodeType === Node.TEXT_NODE && (!/^\s*$/.test(node?.textContent || ''))
        );
        const childElement = cellElement.children;

        if (childElement.length > 0 && childTextNodes.length > 0) {
            return true;
        }

        return false;
    }

    private _cellFilterRuler(cellElement: HTMLElement) {
        const cellElementTagName = cellElement.tagName.toLowerCase();
        if (EXCLUDED_TAGS_NOT_IMAGE.includes(cellElementTagName)) {
            return false;
        }

        const cellElementInnerText = getElementText(cellElement);
        if (cellElementInnerText.trim().length > 0 && cellElement.children.length === 0) {
            return true;
        }

        if (this._imageOrLinkFilterRuler(cellElement)) {
            return true;
        }

        if (this._checkIsRichText(cellElement)) {
            return true;
        }

        return false;
    }

    private _imageOrLinkFilterRuler(cellElement: HTMLElement) {
        const cellElementTagName = cellElement.tagName.toLowerCase();
        if (
            cellElementTagName === 'a' && cellElement.getAttribute('href')
        ) {
            return true;
        }

        if (
            cellElementTagName === 'video' && cellElement.getAttribute('src')
        ) {
            return true;
        }

        if (
            cellElementTagName === 'audio' && cellElement.getAttribute('src')
        ) {
            return true;
        }

        if (
            cellElementTagName === 'img' && cellElement.getAttribute('src')
        ) {
            return true;
        }

        if (getImageInAttributes(cellElement)) {
            return true;
        }

        return false;
    }

    private _analyzeRow(rowElement: Element) {
        const allCellElements = Array.from(rowElement.getElementsByTagName('*')) || [];
        allCellElements.forEach((cell, index) => {
            if (cell == null) {
                return;
            }

            const cellElement = cell as HTMLElement;
            const cellElementTagName = cellElement.tagName.toLowerCase();

            if (!this._cellFilterRuler(cellElement)) {
                return;
            }

            // const cellSelector = generateCellSelector(cellElement, rowElement);
            // this._selectorsCount.set(cellSelector, (this._selectorsCount.get(cellSelector) || 0) + 1);

            // if (!this._selectors.includes(cellSelector)) {
            //     this._selectors.splice(index, 0, cellSelector);
            // }

            const classText = getElementClasses(cellElement).sort().map((cls) => escapeSpecialCharacters(cls)).join('');

            let cellClasses = `${cellElementTagName}${classText}`;

            const queryList = safeQueryHelper.querySelectorAll(rowElement, cellClasses);
            if (classText.length === 0 || queryList.length > 1) {
                cellClasses = generateCellSelector(cellElement, rowElement);
            }

            this._classesCounts.set(cellClasses, (this._classesCounts.get(cellClasses) || 0) + 1);

            if (!this._classes.includes(cellClasses)) {
                this._classes.splice(index, 0, cellClasses);
            }
        });
    }

    private _clearSelectors() {
        const rowCount = this._tableParam?.children?.length || 0;

        // this._selectors = this._selectors.filter((selector) => {
        //     return this._selectorsCount.get(selector) && this._selectorsCount.get(selector)! >= (rowCount / 2 - 2);
        // });

        const validClassNames: string[] = [];
        const invalidClassNames: string[] = [];
        let limitClassCount = rowCount / 3;
        if (limitClassCount < 1) {
            limitClassCount = 1;
        }
        this._classes.forEach((classes) => {
            const classCount = this._classesCounts.get(classes);
            if (classCount && classCount > limitClassCount) {
                validClassNames.push(classes);
            } else {
                invalidClassNames.push(classes);
            }
        });

        // 合并父选择器相同的对象
        const mergeParentClasses = this._getMergeParentClasses(invalidClassNames, rowCount);

        const partOfClasses = this._getPartOfClasses(invalidClassNames, rowCount);

        const rebirthClasses = [...mergeParentClasses, ...partOfClasses];
        this._clearSelectorsForParentClass(rebirthClasses, [...validClassNames, ...rebirthClasses]).forEach((classes) => {
            if (!validClassNames.includes(classes)) {
                validClassNames.push(classes);
            }
        });

        // 当列太少的时候，需要补充更多采集列
        if (validClassNames.length < 4) {
            rebirthClasses.forEach((classes) => {
                if (!validClassNames.includes(classes)) {
                    validClassNames.push(classes);
                }
            });
        }

        this._forcedAddCellSelectors.forEach((classes) => {
            if (!validClassNames.includes(classes)) {
                validClassNames.push(classes);
            }
        });

        this._classes = this._clearSelectorsForParentClassSelf(validClassNames);

        // this._classes = this._classes.filter((classes) => {
        //     const classCount = this._classesCounts.get(classes);
        //     return classCount && classCount >= (rowCount / 3);
        // });
    }

    private _getMergeParentClasses(invalidClassNames: string[], rowCount: number) {
        const validClassNames: string[] = [];
        const classesCount = new Map<string, number>();
        invalidClassNames.forEach((invalidClasses) => {
            const invalidClassesArray = invalidClasses.split('>');
            const count = this._classesCounts.get(invalidClasses) || 0;
            if (invalidClassesArray.length <= 0) {
                return;
            }

            const invalidClassesArrayCount = Math.min(invalidClassesArray.length, 3);

            let validClassEndIndex = invalidClassesArray.length - 1;
            for (let i = 0; i < invalidClassesArrayCount; i++) {
                const classes = invalidClassesArray.slice(0, validClassEndIndex).join('>');
                classesCount.set(classes, (classesCount.get(classes) || 0) + count);
                validClassEndIndex--;
            }
        });

        classesCount.forEach((count, classes) => {
            if (classes.trim().length > 0 && count >= (rowCount / 3)) {
                validClassNames.push(classes);
            }
        });

        return validClassNames;
    }

    private _getPartOfClasses(invalidClassNames: string[], rowCount: number) {
        const validClassNames: string[] = [];
        const classesCount = new Map<string, number>();
        invalidClassNames.forEach((invalidClasses) => {
            const invalidClassesArray = invalidClasses.split('>');

            if (invalidClassesArray.length !== 1) {
                return;
            }

            const classesCountCache = new Map<string, number>();
            this._getMergeClasses(invalidClasses, classesCountCache);

            classesCountCache.forEach((count, classes) => {
                classesCount.set(classes, Math.max((classesCount.get(classes) || 0), count));
            });
        });

        classesCount.forEach((count, classes) => {
            if (classes.trim().length > 0 && count >= (rowCount / 3)) {
                validClassNames.push(classes);
            }
        });

        return validClassNames;
    }

    private _getMergeClasses(invalidClass: string, classesCount: Map<string, number>) {
        const invalidClasses = invalidClass.split('.');
        const invalidClassesCount = invalidClasses.length;

        if (invalidClassesCount <= 2 || invalidClassesCount >= 6) {
            return;
        }

        // invalidClasses.forEach((_, index) => {
        //     if (index === 0 || index === invalidClassesCount - 1) {
        //         return;
        //     }

        //     const validClasses = invalidClasses.slice(0, index + 1).join('.');
        //     this._tableParam?.children?.forEach((rowElement) => {
        //         const cellElements = (rowElement as HTMLElement).querySelectorAll(validClasses) || [];
        //         if (cellElements.length === 0) {
        //             return;
        //         }
        //         classesCount.set(validClasses, (classesCount.get(validClasses) || 0) + cellElements.length);
        //     });
        // });

        const combinations = getCombinations(invalidClasses);
        combinations.forEach((combination) => {
            const validClasses = combination.join('.');
            this._tableParam?.children?.forEach((rowElement) => {
                const cellElements = safeQueryHelper.querySelector(rowElement, validClasses);
                if (cellElements === null || EXCLUDED_TAGS_NOT_IMAGE.includes(cellElements.tagName.toLowerCase())) {
                    return;
                }
                classesCount.set(validClasses, (classesCount.get(validClasses) || 0) + 1);
            });
        });
    }

    private _clearSelectorsForParentClassSelf(validClassNames: string[]) {
        const newValidClassNames = new Set<string>();

        // this._partOfLongClassByDom.clear();
        const repeatClasses = new Set<string>();
        for (let i = 0; i < validClassNames.length; i++) {
            const classes = validClassNames[i];

            if (classes.length === 0 || repeatClasses.has(classes)) {
                continue;
            }

            for (let j = 0; j < validClassNames.length; j++) {
                const compareClasses = validClassNames[j];

                if (classes === compareClasses || compareClasses.length === 0 || repeatClasses.has(compareClasses)) {
                    continue;
                }

                const [shortClassName, longClassName] = [classes, compareClasses].sort((a, b) => a.length - b.length);
                if (this._isPartOfLongClassByDom(shortClassName, longClassName)) {
                    repeatClasses.add(longClassName);
                }
            }
        }

        for (let i = 0; i < validClassNames.length; i++) {
            const classes = validClassNames[i];
            if (repeatClasses.has(classes)) {
                continue;
            }

            newValidClassNames.add(classes);
        }

        return Array.from(newValidClassNames);
    }

    // private _partOfLongClassByDom = new Map<Element, string[]>();

    // getUniqueStrings(): string[] {
    //     const uniqueStrings = new Set<string>();

    //     this._partOfLongClassByDom.forEach((strings) => {
    //         uniqueStrings.add(strings[0]);
    //     });

    //     return Array.from(uniqueStrings);
    // }

    // private _isPartOfLongClassByDomSelf(classes: string, longClasses: string) {
    //     const children = this._tableParam?.children || [];

    //     const childrenCount = children.length;
    //     for (let i = 0; i < childrenCount; i++) {
    //         const rowElement = children[i];
    //         const cellEle1 = rowElement.querySelector(classes);
    //         const cellEle2 = rowElement.querySelector(longClasses);

    //         if (cellEle1 && cellEle1 === cellEle2) {
    //             if (!this._partOfLongClassByDom.has(cellEle1)) {
    //                 this._partOfLongClassByDom.set(cellEle1, []);
    //             }
    //             this._partOfLongClassByDom.get(cellEle1)!.push(classes, longClasses);
    //             return true;
    //         }

    //         if (cellEle1) {
    //             if (!this._partOfLongClassByDom.has(cellEle1)) {
    //                 this._partOfLongClassByDom.set(cellEle1, []);
    //             }
    //             this._partOfLongClassByDom.get(cellEle1)!.push(classes);
    //         }

    //         if (cellEle2) {
    //             if (!this._partOfLongClassByDom.has(cellEle2)) {
    //                 this._partOfLongClassByDom.set(cellEle2, []);
    //             }
    //             this._partOfLongClassByDom.get(cellEle2)!.push(longClasses);
    //         }
    //     }
    //     return false;
    // }

    private _clearSelectorsForParentClass(validClassNames: string[], matchClassNames?: string[]) {
        const newValidClassNames: string[] = [];

        if (matchClassNames == null) {
            matchClassNames = validClassNames;
        }

        for (let i = 0; i < validClassNames.length; i++) {
            const classes = validClassNames[i];
            const classesArray = classes.split('>');
            if (classesArray.length > 1) {
                continue;
            }

            if (classes.length === 0) {
                continue;
            }

            let isSkip = false;
            for (let j = 0; j < matchClassNames.length; j++) {
                const compareClasses = matchClassNames[j];
                const compareClassesArray = compareClasses.split('>');
                if (compareClassesArray.length > 1 || classes === compareClasses || compareClasses.length === 0) {
                    continue;
                }

                if (this._isPartOfLongClass(classes, compareClasses) || this._isPartOfLongClassByDom(classes, compareClasses)) {
                    isSkip = true;
                    break;
                }
            }

            if (isSkip) {
                continue;
            }

            newValidClassNames.push(classes);
        }

        return newValidClassNames;
    }

    private _isPartOfLongClassByDom(classes: string, longClasses: string) {
        const children = this._tableParam?.children || [];

        const childrenCount = Math.min(children.length, 3);
        for (let i = 0; i < childrenCount; i++) {
            const rowElement = children[i];
            const cellEle1 = safeQueryHelper.querySelector(rowElement, classes);
            const cellEle2 = safeQueryHelper.querySelector(rowElement, longClasses);

            if (cellEle1 && EXCLUDED_TAGS_NOT_IMAGE.includes(cellEle1.tagName.toLowerCase())) {
                return false;
            }

            if (cellEle1 && cellEle1 === cellEle2) {
                return true;
            }
        }
        return false;
    }

    private _isPartOfLongClass(classes: string, longClasses: string) {
        const classesArray = classes.split('.');
        const longClassesArray = longClasses.split('.');

        if (classesArray.length === 1 || longClassesArray.length === 1) {
            return false;
        }

        if (classesArray.length > longClassesArray.length) {
            return false;
        }

        for (let i = 0; i < classesArray.length; i++) {
            if (classesArray[i] !== longClassesArray[i]) {
                return false;
            }
        }

        return true;
    }

    private _getCellBySelector() {
        const tableData: ITableElementAnalyzeRowData[] = [];
        this._tableParam?.children?.forEach((rowElement) => {
            const rowDataCache: ITableElementAnalyzeRowData = {};

            // if (this._selectors.length === 0 || this._selectors.length < (this._classes.length / 2 + 2)) {
            this._classes.forEach((classes) => {
                if (classes.length === 0) {
                    return;
                }
                const cellElement = findElementBySelectorByDom(classes, rowElement as HTMLElement);
                rowDataCache[classes] = getCellData(cellElement) || { text: '' };
            });

            if (this._imageOrLinkFilterRuler(rowElement as HTMLElement)) {
                rowDataCache['000rowSelf__Univer__especial'] = getCellData(rowElement as HTMLElement) || { text: '' };
            }

            // } else {
            //     this._selectors.forEach((selector) => {
            //         const cellElement = findElementBySelectorByDom(selector, rowElement as HTMLElement);
            //         rowDataCache[selector] = getCellData(cellElement) || { text: '' };
            //     });
            // }

            tableData.push(rowDataCache);
        });

        return tableData;
    }

    // private _analyzeRow(rowElement: Element, baseSelector: string): void {
    //     if (rowElement.nodeName) {
    //         const rowSelector = `${rowElement.nodeName.toLowerCase()}${getElementClasses(rowElement).map((cls) => `.${cls}`).join('')}`;
    //         this._selectors.push(rowSelector);
    //         this._addDataToRow(rowElement, rowSelector);
    //         // this._getDataToRow(getElementTextWithoutChildren(element).trim(), rowSelector);
    //         // this._addDataToRow(element.getAttribute("href"), rowSelector, "href");
    //         // this._addDataToRow(element.getAttribute("src"), rowSelector, "src");
    //         Array.from(rowElement.children).forEach((child) => {
    //             this._analyzeRow(child, rowSelector);
    //         });
    //     } else {
    //         console.error('errorElement:', rowElement);
    //     }
    // }

    // private _addDataToRow(element: Element, selector: string): void {
    //     if (!element) {
    //         return;
    //     }

    //     let key = selector;
    //     const tempKey = key;
    //     let count = 0;
    //     this._selectors.forEach((sel) => {
    //         if (sel === selector) {
    //             count++;
    //         };
    //     });

    //     if (count > 1) {
    //         key = `${tempKey} ${count}`;
    //     }

    //     const text = replaceControlChars(getElementTextWithoutChildren(element).trim());
    //     let href = element.getAttribute('href');
    //     let src = element.getAttribute('src');

    //     if (!text?.length && !href?.length && !src?.length) {
    //         return;
    //     }

    //     if (text && text.length === 1 && containsSpecialCharacters(text)) {
    //         return;
    //     }

    //     if (src != null) {
    //         src = convertRelativeToAbsolute(src);
    //     }

    //     if (href != null) {
    //         href = convertRelativeToAbsolute(href);
    //     }

    //     this._rowDataCache[key] = {
    //         text,
    //         href,
    //         src,
    //     };
    // }
}
