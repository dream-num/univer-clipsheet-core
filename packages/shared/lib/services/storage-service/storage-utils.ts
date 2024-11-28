import type { PushStorageMessage } from '@lib/common.message';
import { ClipsheetMessageTypeEnum } from '@lib/common.message';

export function setStorage(key: string, value: any) {
    /**
     * The quota limitation of sync only 100kb
     * And local storage limit is 10MB
     */
    return chrome.storage.local.set({
        [key]: value,
    });
}

export async function removeStorage(key: string | string[]) {
    return chrome.storage.local.remove(key);
}

export async function getStorage<T = any>(key: string) {
    return (await chrome.storage.local.get(key))[key] as T;
}

export function pushStorage(key: string, value: any, tabId?: number) {
    const msg: PushStorageMessage = {
        type: ClipsheetMessageTypeEnum.PushStorage,
        payload: {
            key,
            value,
        },
    };
    return tabId
        ? chrome.tabs.sendMessage(tabId, msg)
        : chrome.runtime.sendMessage(msg);
}
