
/* eslint-disable regexp/no-unused-capturing-group */

/**
 * Copyright 2023-present DreamNum Inc.
 *
 */

import type { IInitialSheet, ITableElementAnalyzeRowData, ITableElementAnalyzeRowDataItem, UnknownJson } from './misc';
import { convertRelativeToAbsolute, deleteRepeatColumn, Initial_Sheet_Type_Num, replaceControlChars, toResultTable } from './misc';

const MIN_JSON_CHILDREN_COUNT_LIMIT = 5;

const CHILDREN_OBJECT_WEIGHT_RATIO = 0.1;

const MIN_CELL_COUNT_LIMIT = 3;

const MIN_TOP_FIT_ELEMENT_COUNT_LIMIT = 3;

const SUB_OBJECT_PERCENTAGE_LIMIT = 0.5;

const IMAGE_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff', '.webp',
    '.ico', '.svg', '.heif', '.heic', '.avif', // 其他一些格式
]);

const AJAX_BLACK_LIST = new Set([
    'cookie',
    'password',
    'token',
    'session',
    'authorization',
    'secret',
    'private',
    'privacy',
]);

interface IFlattenJson {
    current: UnknownJson | UnknownJson[];
    childObjects: Array<UnknownJson | UnknownJson[]>;
    childrenCount: number;
    arrayCount: number;
    objectCount: number;
    weightedScore: number;
    commonKeys: string[];
    childrenFilter: Array<UnknownJson | UnknownJson[]>;
}

export function ajaxJsonToTable(jsonList: UnknownJson[]): IInitialSheet[] {
    const allResultSheets: IInitialSheet[] = [];

    jsonList.forEach((json) => {
        const flattenJsonList = flattenJson(json);

        const analyzeJsonData = flattenJsonList.map((flattenJson) => {
            return analyzeJson(flattenJson);
        }).filter((flattenJson) => flattenJson != null)
            .sort((a, b) => b!.weightedScore - a!.weightedScore).slice(0, MIN_TOP_FIT_ELEMENT_COUNT_LIMIT) as IFlattenJson[];

        const omitParentJsonList = omitParentElement(analyzeJsonData);

        const ajaxTables = omitParentJsonList.map((json) => {
            return new AjaxTableAnalyze(json);
        }).filter((table) => table.isSensitive === false);

        // const mergeTables = mergeSimilarTables(ajaxTables);

        // console.error('ajaxTables', flattenJsonList, analyzeJsonData, omitParentJsonList, ajaxTables);
        const filerTables = ajaxTables.map((table) => table.tableData);

        const weightedScores = ajaxTables.map((table) => table.tableParam.weightedScore);

        const resultSheets = toResultTable(filerTables, [], 'ajaxJsonToTable', Initial_Sheet_Type_Num.AJAX_TABLE);

        resultSheets.forEach((sheet, index) => {
            sheet.weightedScore = weightedScores[index] || 0;
        });

        allResultSheets.push(...resultSheets);
    });

    // console.error('allResultSheets', allResultSheets);

    return allResultSheets;
}

function decodeBase64(base64String: string): string | null {
    try {
        // 使用 atob 函数解码 Base64 字符串
        const decodedString = atob(base64String);
        return decodedString;
    } catch (e) {
        return null;
    }
}

function isValidBase64(str: string) {
    const regex = /^(?:[A-Z0-9+/]{4})*?(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
    return regex.test(str);
}

// function isJSON(str: string) {
//     try {
//         JSON.parse(str);
//         return true;
//     } catch (e) {
//         return false;
//     }
// }

function base64ToJson(value: string | number | boolean | UnknownJson | UnknownJson[]): string | number | boolean | UnknownJson | UnknownJson[] {
    if (typeof value === 'string' && isValidBase64(value)) {
        const decodedValue = decodeBase64(value);
        if (decodedValue && isValidJsonString(decodedValue)) {
            return JSON.parse(decodedValue);
        }
    } else if (isValidJsonString(value)) {
        return JSON.parse(value as string);
    }

    return value;
}

function isValidJsonString(str: string | number | boolean | UnknownJson | UnknownJson[]) {
    // 快速检查字符串是否可能是 JSON 格式
    if (typeof str !== 'string' || str.length === 0) {
        return false;
    }

    str = str.trim();
    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

function flattenJson(jsonParam: UnknownJson | UnknownJson[]): Array<UnknownJson | UnknownJson[]> {
    if (jsonParam == null) {
        return [];
    }
    const flattenJsonList: Array<UnknownJson | UnknownJson[]> = [];

    let childrenCount = 0;

    if (Array.isArray(jsonParam)) {
        jsonParam.forEach((value) => {
            if (value != null && typeof value === 'object' && !Array.isArray(value)) {
                flattenJsonList.push(...flattenJson(value));
            }
            childrenCount++;
        });

        if (childrenCount < MIN_JSON_CHILDREN_COUNT_LIMIT) {
            return [...flattenJsonList];
        }

        return [jsonParam, ...flattenJsonList];
    }

    const keys = Object.keys(jsonParam).sort();
    keys.forEach((key) => {
        if (key == null) {
            return;
        }
        const value = base64ToJson(jsonParam[key]);
        if (value != null && typeof value === 'object') {
            if (Array.isArray(value)) {
                flattenJsonList.push(...flattenJson(value as UnknownJson[]));
            } else {
                flattenJsonList.push(...flattenJson(value));
            }
        }

        childrenCount++;
    });

    if (childrenCount < MIN_JSON_CHILDREN_COUNT_LIMIT) {
        return [...flattenJsonList];
    }

    return [jsonParam, ...flattenJsonList];
}

function analyzeJson(jsonParam: UnknownJson | UnknownJson[]): IFlattenJson | undefined {
    if (jsonParam == null) {
        return;
    }

    let childrenCount = 0;
    let arrayCount = 0;
    let objectCount = 0;

    const currentFlattenJson: IFlattenJson = {
        current: jsonParam,
        childObjects: [],
        childrenCount: 0,
        arrayCount: 0,
        objectCount: 0,
        weightedScore: 0,
        commonKeys: [],
        childrenFilter: [],
    };

    if (Array.isArray(jsonParam)) {
        jsonParam.forEach((value) => {
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    arrayCount++;
                } else {
                    objectCount++;
                }

                currentFlattenJson.childObjects.push(value);
            }
            childrenCount++;
        });
    } else {
        const keys = Object.keys(jsonParam).sort();
        keys.forEach((key) => {
            if (jsonParam[key] == null) {
                return;
            }
            const value = jsonParam[key];
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    arrayCount++;
                } else {
                    objectCount++;
                }

                currentFlattenJson.childObjects.push(value);
            }
            childrenCount++;
        });
    }

    currentFlattenJson.childrenCount = childrenCount;
    currentFlattenJson.arrayCount = arrayCount;
    currentFlattenJson.objectCount = objectCount;

    if ((objectCount + arrayCount) / childrenCount < SUB_OBJECT_PERCENTAGE_LIMIT) {
        return;
    }

    const { commonKeys, childrenFilter } = analyzeChildrenJson(currentFlattenJson);

    if (childrenFilter.length === 0) {
        return;
    }

    currentFlattenJson.commonKeys = commonKeys;
    currentFlattenJson.childrenFilter = childrenFilter;

    currentFlattenJson.weightedScore = childrenFilter.length / childrenCount + (arrayCount / childrenCount + objectCount / childrenCount) * CHILDREN_OBJECT_WEIGHT_RATIO;

    return currentFlattenJson;
}

function getJsonKeys(jsonParam: UnknownJson | UnknownJson[]): string[] {
    if (!jsonParam) {
        return [];
    }
    if (Array.isArray(jsonParam)) {
        return [];
    }

    return Object.keys(jsonParam);
}

function analyzeChildrenJson(flattenJson: IFlattenJson) {
    const commonKeyCounts = new Map<string, number>();
    const individualKeyCounts = new Map<string, number>();
    const flattenChildrenCount = flattenJson.childObjects.length;

    flattenJson.childObjects.forEach((childJson) => {
        const childKeys = getJsonKeys(childJson);
        if (childKeys.length === 0) {
            // fix childJson is object
            if (!Array.isArray(childJson)) {
                return;
            }
            (childJson as UnknownJson[]).forEach((_, index) => {
                const childrenCount = index.toString();
                if (commonKeyCounts.has(childrenCount)) {
                    commonKeyCounts.set(childrenCount, commonKeyCounts.get(childrenCount)! + 1);
                } else {
                    commonKeyCounts.set(childrenCount, 1);
                }
            });
            return;
        }

        const keyGroup = childKeys.join(' ');
        if (commonKeyCounts.has(keyGroup)) {
            commonKeyCounts.set(keyGroup, commonKeyCounts.get(keyGroup)! + 1);
        } else {
            commonKeyCounts.set(keyGroup, 1);
        }
        childKeys.forEach((key) => {
            if (individualKeyCounts.has(key)) {
                individualKeyCounts.set(key, individualKeyCounts.get(key)! + 1);
            } else {
                individualKeyCounts.set(key, 1);
            }
        });
    });

    if (commonKeyCounts.size === 0 && individualKeyCounts.size === 0) {
        return {
            commonKeys: [],
            childrenFilter: [],
        };
    }

    let commonKeys = Array.from(commonKeyCounts.keys()).filter((key) => {
        return (commonKeyCounts.get(key) || 0) >= flattenChildrenCount / 2 - 2; // 找出出现次数较多的类名组合
    });

    if (!commonKeys.length) {
        commonKeys = Array.from(individualKeyCounts.keys()).filter((key) => {
            return (individualKeyCounts.get(key) || 0) >= flattenChildrenCount / 2 - 2; // 找出出现次数较多的单独类名
        });
    }

    const childrenFilter = flattenJson.childObjects.filter((child) => {
        let matched = false;
        // 检查子元素是否包含特定的类名
        commonKeys.forEach((key) => {
            matched = matched || hasKeys(child, key);
        });
        return matched;
    });

    if (childrenFilter.length < MIN_JSON_CHILDREN_COUNT_LIMIT) {
        return {
            commonKeys: [],
            childrenFilter: [],
        };
    }

    return {
        commonKeys,
        childrenFilter,
    };
}

function hasKeys(flattenJson: UnknownJson | UnknownJson[], key: string): boolean {
    if (Array.isArray(flattenJson) && !Number.isNaN(Number(key))) {
        return flattenJson[Number(key)] != null;
    }

    const keys = getJsonKeys(flattenJson);
    if (keys.length === 0) {
        return false;
    }

    if (keys.join(' ') === key) {
        return true;
    } else {
        return Object.keys(flattenJson).some((childKey) => {
            if (childKey === key) {
                return true;
            }
            return false;
        });
    }
}

function omitParentElement(flattenJsonList: IFlattenJson[]): IFlattenJson[] {
    const filterJsonList: IFlattenJson[] = [];
    if (flattenJsonList.length === 0) {
        return [];
    }

    flattenJsonList.forEach((flattenJson) => {
        for (let i = 0; i < flattenJsonList.length; i++) {
            const compareJson = flattenJsonList[i];
            if (compareJson === flattenJson) {
                continue;
            }

            if (flattenJson.childObjects.includes(compareJson.current)) {
                return;
            }
        }

        filterJsonList.push(flattenJson);
    });

    return filterJsonList;
}

function isImageFile(filename: string) {
    const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();

    // 检查扩展名是否在支持的列表中
    return IMAGE_EXTENSIONS.has(extension);
}

function isHyperlink(url: string) {
    const urlPattern = /^(http|https):\/\/.+$/;
    return urlPattern.test(url);
}

function isValidUrl(url: string): boolean {
    const urlPattern1 = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i;
    const urlPattern2 = /^(\/[a-z0-9.-]+)*(\/[a-z0-9.-]*)*(#[a-z0-9.-]*)?$/i;
    return (urlPattern1.test(url) || urlPattern2.test(url)) && !(url.startsWith('#') && url.length > 0);
}

function getAllTextContent(json: string | number | boolean | UnknownJson | UnknownJson[]): string {
    if (json == null) {
        return '';
    }

    if (Array.isArray(json)) {
        return json.map((value) => getAllTextContent(value)).join(' ');
    }

    if (typeof json === 'object') {
        return Object.values(json).map((value) => getAllTextContent(value)).join(' ');
    }

    if (isValidJsonString(json)) {
        return getAllTextContent(JSON.parse(json as string));
    }

    return json.toString();
}

class AjaxTableAnalyze {
    private _tableData: ITableElementAnalyzeRowData[] = [];

    private _isSensitive = false;

    constructor(private _tableParam: IFlattenJson) {
        this._tableData = this.getTableData();
    }

    get tableData() {
        return this._tableData;
    }

    get isSensitive() {
        return this._isSensitive;
    }

    dispose() {
        this._tableParam = null as unknown as IFlattenJson;
        this._rowDataCache = {};
        this._tableData = [];
    }

    private _rowDataCache: ITableElementAnalyzeRowData = {};

    getTableData() {
        const tableData: ITableElementAnalyzeRowData[] = [];
        this._tableParam?.childrenFilter?.forEach((rowElement) => {
            this._rowDataCache = {};
            this._addDataToRow(rowElement);
            if (Object.keys(this._rowDataCache).length >= MIN_CELL_COUNT_LIMIT) {
                tableData.push(this._rowDataCache);
            };
        });

        return deleteRepeatColumn(tableData);
    }

    get tableParam() {
        return this._tableParam;
    }

    private _addDataToRow(childJson: UnknownJson | UnknownJson[]): void {
        if (!childJson) {
            return;
        }

        if (Array.isArray(childJson)) {
            childJson.forEach((value, index) => {
                const key = `array${index}`;
                this._rowDataCache[key] = this._getCellValue(value);
            });
            return;
        }

        Object.keys(childJson).forEach((key) => {
            const value = childJson[key];
            this._rowDataCache[key] = this._getCellValue(value);
        });
    }

    private _getCellValue(value: string | number | boolean | UnknownJson | UnknownJson[]): ITableElementAnalyzeRowDataItem {
        const val = replaceControlChars(getAllTextContent(value));
        let href = '';
        let src = '';
        let text = '';

        if (isHyperlink(val) || isValidUrl(val)) {
            const hyperlink = convertRelativeToAbsolute(val);
            if (isImageFile(val)) {
                src = hyperlink;
            } else {
                href = hyperlink;
            }
        } else {
            text = val;
        }

        this._checkSensitive(text);

        return {
            text,
            href,
            src,
        };
    }

    private _checkSensitive(text: string) {
        if (this._isSensitive) {
            return;
        }

        const lowerText = text.toLowerCase();
        for (const sensitiveWord of AJAX_BLACK_LIST) {
            if (lowerText.includes(sensitiveWord)) {
                this._isSensitive = true;
                break;
            }
        }
    }
}
