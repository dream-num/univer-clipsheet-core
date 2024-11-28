import { ObservableValue } from '@lib/observable-value';
import { getActiveTab } from '@lib/tools';
import type { GetStorageMessage, RemoveStorageMessage, SetStorageMessage } from '@lib/common.message';
import { ClipsheetMessageTypeEnum } from '@lib/common.message';
import { Inject } from '@wendellhu/redi';
import { getStorage, pushStorage, removeStorage, setStorage } from './storage-utils';

export class StorageService {
    constructor(
    ) {

    }

    storageChange$ = new ObservableValue<{ key: string; value: any }>({ key: '', value: null });

    onStorageChange(callback: (storage: { key: string; value: any }) => void) {
        return this.storageChange$.subscribe(callback);
    }

    setStorage(key: string, value: any) {
        setStorage(key, value);
        pushStorage(key, value);
        // setAndSendStorage(key, value);
        getActiveTab().then((activeTab) => {
            const tabId = activeTab?.id;
            if (tabId) {
                pushStorage(key, value, tabId);
            }
        });

        this.storageChange$.next({ key, value });
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: SetStorageMessage | GetStorageMessage | RemoveStorageMessage, sender) => {
            const senderTabId = sender.tab?.id;
            switch (msg.type) {
                case ClipsheetMessageTypeEnum.GetStorage: {
                    const { payload: key } = msg;

                    const value = await getStorage(key);

                    if (senderTabId) {
                        pushStorage(key, value, senderTabId);
                    }
                    pushStorage(key, value);
                    break;
                }
                case ClipsheetMessageTypeEnum.SetStorage: {
                    const { payload: { key, value } } = msg;
                    this.setStorage(key, value);
                    break;
                }
                case ClipsheetMessageTypeEnum.RemoveStorage: {
                    const { payload: key } = msg;
                    removeStorage(key);
                    pushStorage(String(key), null);
                    break;
                }
            }
        });
    }

    // listenChromeMessage() {
    //     chrome.runtime.onMessage.addListener(async (msg: SetStorageMessage | GetStorageMessage | RemoveStorageMessage, sender) => {
    //         const senderTabId = sender.tab?.id;
    //         switch (msg.type) {
    //             case ClipsheetMessageTypeEnum.GetStorage: {
    //                 const { payload: key } = msg;

    //                 const value = await getStorage(key);

    //                 if (senderTabId) {
    //                     pushStorage(key, value, senderTabId);
    //                 }
    //                 pushStorage(key, value);
    //                 break;
    //             }
    //             case ClipsheetMessageTypeEnum.SetStorage: {
    //                 const { payload: { key, value } } = msg;
    //                 this.setStorage(key, value);
    //                 break;
    //             }
    //             case ClipsheetMessageTypeEnum.RemoveStorage: {
    //                 const { payload: key } = msg;
    //                 removeStorage(key);
    //                 pushStorage(String(key), null);
    //                 break;
    //             }
    //         }
    //     });
    // }
}
