import type { OpenSidePanelMessage } from '@lib/common.message';
import { ClipsheetMessageTypeEnum } from '@lib/common.message';
import { createIdentifier } from '@wendellhu/redi';

export interface ISidePanelService {
    listenMessage(): void;
}

export const ISidePanelService = createIdentifier<ISidePanelService>('side-panel-service');

export class SidePanelService {
    constructor(private _sidePanelPath: string) {
        this.listenMessage();
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: OpenSidePanelMessage, sender) => {
            switch (msg.type) {
                case ClipsheetMessageTypeEnum.OpenSidePanel: {
                    const senderTabId = sender.tab?.id;
                    const tabId = msg.payload ?? senderTabId;
                    if (!tabId) {
                        return;
                    }

                    chrome.sidePanel.setOptions({
                        tabId,
                        path: this._sidePanelPath,
                        enabled: true,
                    });

                    chrome.sidePanel.open({ tabId });

                    break;
                }
            }
        });
    }
}
