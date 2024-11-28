// import type { DrillDownTaskChannelResponse, Message, MessageItem } from '@chrome-extension-boilerplate/shared';
import { requestConnectChannel } from '@univer-clipsheet-core/shared';
import { Inject } from '@wendellhu/redi';
import { drillDownTaskChannel, getDrillDownTaskChannelName } from './drill-down-channel';

import type { DrillDownTaskChannelResponse } from './drill-down-channel';

interface IDrillDownTab {
    url: string;
    resolve: (values: DrillDownTaskChannelResponse) => void;
    selectors: string[];
}

export class DrillDownService {
    // drill down tab use tabId as key
    private _drillDownTabMap = new Map<number, IDrillDownTab>();

    async runDrillDown(url: string, selectors: string[], tab?: chrome.tabs.Tab) {
        // We need to close tab if it's not provided
        let shouldCloseTab = false;
        if (!tab) {
            shouldCloseTab = true;
            tab = await chrome.tabs.create({ url, active: false });
        } else {
            chrome.tabs.update(tab.id!, { url, active: false });
        }

        const innerTabId = tab.id;

        const asyncResult = new Promise<DrillDownTaskChannelResponse>((resolve) => {
            if (innerTabId) {
                this._drillDownTabMap.set(innerTabId, { url, resolve, selectors });
            }
        });

        asyncResult.finally(() => {
            if (!innerTabId) {
                return;
            }
            if (shouldCloseTab) {
                chrome.tabs.remove(innerTabId);
            }
            this._drillDownTabMap.delete(innerTabId);
        });

        return asyncResult;
    }

    stopDrillDown(tabId: number) {
        const { _drillDownTabMap } = this;
        const drillDownContext = _drillDownTabMap.get(tabId);
        if (!drillDownContext) {
            return;
        }

        drillDownContext.resolve({
            items: [],
        });
    }

    getContext(tabId: number) {
        return this._drillDownTabMap.get(tabId);
    }

    listenMessage() {
        // const { _drillDownService } = this;
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                const drillDownContext = this.getContext(tabId);
                if (!drillDownContext) {
                    return;
                }

                const channelName = getDrillDownTaskChannelName(String(tabId));

                drillDownTaskChannel.getConnectedPort(channelName).then((port) => {
                    drillDownTaskChannel.sendRequest(port, {
                        selectors: drillDownContext.selectors,
                    });
                    drillDownTaskChannel.onResponse(port, (response) => {
                        port.disconnect();
                        drillDownContext.resolve(response);
                    });
                });

                requestConnectChannel(channelName, tabId);
            }
        });

        // chrome.runtime.onMessage.addListener(async (msg: RequestDrillDownMessage, sender) => {
        //     const senderTabId = sender.tab?.id;
        //     if (!senderTabId) {
        //         return;
        //     }

        //     switch (msg.type) {
        //         case DrillDownMessageTypeEnum.RequestDrillDown: {
        //             const { payload } = msg;
        //             const result = await _drillDownService.runDrillDown(payload.url, payload.selectors);

        //             const response: ResponseDrillDownMessage = {
        //                 type: DrillDownMessageTypeEnum.ResponseDrillDown,
        //                 payload: result.items,
        //             };

        //             chrome.tabs.sendMessage(senderTabId, response);
        //         }
        //     }
        // });
    }
}
