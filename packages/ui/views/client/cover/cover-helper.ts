import type { IMessage } from '@univer-clipsheet-core/shared';
import { getActiveTabId } from '@univer-clipsheet-core/shared';
import type { AddCoverMessage, RemoveCoverMessage, UpdateCoverMessage } from './cover.message';
import { CoverMessageTypeEnum } from './cover.message';

export const coverHelper = {
    async addCover(id: string, selector: string) {
        const tabId = await getActiveTabId();
        if (!tabId) {
            return;
        }
        const msg: AddCoverMessage = {
            type: CoverMessageTypeEnum.AddCover,
            payload: {
                id,
                selector,
            },
        };
        chrome.tabs.sendMessage(tabId, msg);
    },

    async updateCover(id: string, selector: string) {
        const tabId = await getActiveTabId();
        if (!tabId) {
            return;
        }
        const msg: UpdateCoverMessage = {
            type: CoverMessageTypeEnum.UpdateCover,
            payload: {
                id,
                selector,
            },
        };
        chrome.tabs.sendMessage(tabId, msg);
    },

    async removeCover(id: string) {
        const tabId = await getActiveTabId();
        if (!tabId) {
            return;
        }
        const msg: RemoveCoverMessage = {
            type: CoverMessageTypeEnum.RemoveCover,
            payload: id,
        };
        chrome.tabs.sendMessage(tabId, msg);
    },

    async removeAllCovers() {
        const tabId = await getActiveTabId();
        if (!tabId) {
            return;
        }
        const msg: IMessage<CoverMessageTypeEnum.RemoveAllCovers> = {
            type: CoverMessageTypeEnum.RemoveAllCovers,
            // payload: null,
        };
        chrome.tabs.sendMessage(tabId, msg);
    },
};
