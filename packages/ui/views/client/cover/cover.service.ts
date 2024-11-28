import type { IMessage } from '@univer-clipsheet-core/shared';
import { findElementBySelector } from '@univer-clipsheet-core/table';
import { HighlightCover } from './cover';
import type { AddCoverMessage, RemoveCoverMessage, UpdateCoverMessage } from './cover.message';
import { CoverMessageTypeEnum } from './cover.message';

export class CoverService {
    private _coverMap: Map<string, HighlightCover> = new Map();

    addCover(id: string, element: HTMLElement) {
        const cover = new HighlightCover();
        cover.attach(element);
        this._coverMap.set(id, cover);
    }

    updateCover(id: string, element: HTMLElement) {
        const cover = this._coverMap.get(id);
        cover?.attach(element);
    }

    removeCover(id: string) {
        const cover = this._coverMap.get(id);
        cover?.dispose();
        this._coverMap.delete(id);
    }

    removeAllCovers() {
        this._coverMap.forEach((cover) => {
            cover.dispose();
        });
        this._coverMap.clear();
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: AddCoverMessage
            | RemoveCoverMessage
            | UpdateCoverMessage
        | IMessage<CoverMessageTypeEnum.RemoveAllCovers>) => {
            switch (msg.type) {
                case CoverMessageTypeEnum.AddCover: {
                    const { payload } = msg;
                    const el = findElementBySelector(payload.selector);
                    if (el) {
                        this.addCover(payload.id, el);
                    }
                    break;
                }
                case CoverMessageTypeEnum.UpdateCover: {
                    const { payload } = msg;
                    const el = findElementBySelector(payload.selector);
                    if (el) {
                        this.updateCover(payload.id, el);
                    }
                    break;
                }
                case CoverMessageTypeEnum.RemoveCover: {
                    const { payload } = msg;
                    this.removeCover(payload);
                    break;
                }
                case CoverMessageTypeEnum.RemoveAllCovers: {
                    this.removeAllCovers();
                    break;
                }
            }
        });
    }
}
