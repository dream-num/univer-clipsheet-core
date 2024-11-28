import { nanoid } from 'nanoid';
import type { ChannelConnectedMessage, ConnectChannelMessage } from './channel.message';
import { ChannelMessageTypeEnum } from './channel.message';
import type { PushDataSourceMessage } from './common.message';
import { ClipsheetMessageTypeEnum } from './common.message';

export const generateRandomId = () => nanoid();

export const captureEvent = (...args: any[]) => {
    // Do nothing
};

export const closePopup = () => {
    chrome.extension.getViews({ type: 'popup' }).forEach((view) => view.close());
};

export async function getActiveTab() {
    return (await chrome.tabs.query({ currentWindow: true, active: true }))[0];
}

export async function getActiveTabId() {
    return (await getActiveTab()).id;
}

export function openSidePanel(tabId: number, path: string = chrome.runtime.getURL('sidepanel/index.html')) {
    chrome.sidePanel.setOptions({
        tabId,
        path,
        enabled: true,
    });
    chrome.sidePanel.open({ tabId });
}

export function closeSidePanel(tabId: number) {
    chrome.sidePanel.setOptions({ tabId, enabled: false });
}

export function requestConnectChannel(channelName: string, tabId: number) {
    const timer = setInterval(() => {
        const msg: ConnectChannelMessage = {
            type: ChannelMessageTypeEnum.ConnectChannel,
            payload: channelName,
        };
        chrome.tabs.sendMessage(tabId, msg);
    }, 1000);

    return new Promise<void>((resolve) => {
        const listener = (msg: ChannelConnectedMessage, sender: chrome.runtime.MessageSender) => {
            if (msg.type === ChannelMessageTypeEnum.ChannelConnected
                && sender.tab?.id === tabId
                && msg.payload === channelName) {
                resolve();
                clearInterval(timer);
                chrome.runtime.onMessage.removeListener(listener);
            }
        };

        chrome.runtime.onMessage.addListener(listener);
    });
}

export function pushDataSource(key: string, value: any, tabId?: number) {
    const msg: PushDataSourceMessage = {
        type: ClipsheetMessageTypeEnum.PushDataSource,
        payload: {
            key,
            value,
        },
    };

    return tabId
        ? chrome.tabs.sendMessage(tabId, msg)
        : chrome.runtime.sendMessage(msg);
}

export function promisifyMessage<T = any>(filter: (message: T) => boolean): Promise<T> {
    return new Promise<T>((resolve) => {
        const listener = (message: T) => {
            if (filter(message)) {
                resolve(message);
                chrome.runtime.onMessage.removeListener(listener);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
    });
}

