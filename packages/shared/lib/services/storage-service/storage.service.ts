import type { GetStorageMessage, RemoveStorageMessage, SetStorageMessage } from '@lib/common.message';
import { ClipsheetMessageTypeEnum } from '@lib/common.message';
import { ObservableValue } from '@lib/observable-value';
import { getActiveTabId } from '@lib/tools';
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

        getActiveTabId().then((tabId) => {
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
                    const { key, value } = msg.payload;
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
}
