import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';
import { getActiveTab } from '@univer-clipsheet-core/shared';
import type { ITableElementAnalyzeRowDataItem, Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';

export enum ElementInspectMessageTypeEnum {
    RequestElementInspection = 'request_element_inspection',
    ResponseElementInspection = 'response_element_inspection',
    ConnectElementInspection = 'connect_element_inspection',
    StopElementInspection = 'stop_element_inspection',
    RequestUpperElement = 'request_upper_element',
    ResponseUpperElement = 'response_upper_element',
}

export type ResponseElementInspectionMessage = IMessageWithPayload<ElementInspectMessageTypeEnum.ResponseElementInspection, {
    selector: string;
    lastOfSelector: string;
    cellData: ITableElementAnalyzeRowDataItem | undefined;
    type: Sheet_Cell_Type_Enum;
}>;

export type RequestUpperElementMessage = IMessageWithPayload<ElementInspectMessageTypeEnum.RequestUpperElement, string>;
export type ResponseUpperElementMessage = IMessageWithPayload<ElementInspectMessageTypeEnum.ResponseUpperElement, string | null>;

function waitTabComplete(tabId?: number) {
    return new Promise<void>((resolve) => {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };

        chrome.tabs.onUpdated.addListener(listener);
    });
}

export async function requestElementInspection() {
    const { id: tabId, status } = await getActiveTab();

    if (status !== 'complete') {
        await waitTabComplete(tabId);
    }

    if (tabId) {
        chrome.tabs.sendMessage(tabId, {
            type: ElementInspectMessageTypeEnum.RequestElementInspection,
        });
    }

    return new Promise<ResponseElementInspectionMessage['payload']>((resolve) => {
        const listener = (message: ResponseElementInspectionMessage) => {
            if (message.type === ElementInspectMessageTypeEnum.ResponseElementInspection) {
                const { payload } = message;
                resolve(payload);
                chrome.runtime.onMessage.removeListener(listener);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
    });
}

export function connectElementInspection(callback: (message: ResponseElementInspectionMessage['payload']) => void) {
    const listener = (message: ResponseElementInspectionMessage) => {
        if (message.type === ElementInspectMessageTypeEnum.ResponseElementInspection) {
            callback(message.payload);
        }
    };

    getActiveTab().then(async (tab) => {
        const { id: tabId, status } = tab;
        if (!tabId) {
            return;
        }

        if (status !== 'complete') {
            await waitTabComplete(tabId);
        }

        chrome.tabs.sendMessage(tabId, {
            type: ElementInspectMessageTypeEnum.ConnectElementInspection,
        });

        chrome.runtime.onMessage.addListener(listener);
    });

    return () => {
        chrome.runtime.sendMessage({
            type: ElementInspectMessageTypeEnum.StopElementInspection,
        });
        chrome.runtime.onMessage.removeListener(listener);
    };
}

export async function requestUpperElement(selector: string) {
    const { id: tabId, status } = await getActiveTab();

    if (status !== 'complete') {
        await waitTabComplete(tabId);
    }

    if (tabId) {
        const msg: RequestUpperElementMessage = {
            type: ElementInspectMessageTypeEnum.RequestUpperElement,
            payload: selector,
        };
        chrome.tabs.sendMessage(tabId, msg);
    }

    return new Promise<string | null>((resolve) => {
        const listener = (message: ResponseUpperElementMessage) => {
            if (message.type === ElementInspectMessageTypeEnum.ResponseUpperElement) {
                resolve(message.payload);
                chrome.runtime.onMessage.removeListener(listener);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
    });
}
