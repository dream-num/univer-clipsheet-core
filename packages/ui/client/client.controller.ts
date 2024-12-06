import type { IMessage, PushStorageMessage, UIOpenTableScrapingDialogMessage } from '@univer-clipsheet-core/shared';
import { ClientMessageTypeEnum, ClipsheetMessageTypeEnum, IframeDialogKeyEnum, UIMessageTypeEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { ScrapTablesMessage } from '@univer-clipsheet-core/table';
import { TableMessageTypeEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { Inject, Injector } from '@wendellhu/redi';
import { CoverService } from './cover';
import { ElementInspectService } from './element-inspect';
import { IframePanelShadowComponent } from './iframe-panel-shadow-component';
import { TableScrapingShadowComponent } from './table-scraping';
import { extractSheetsFromPage } from './tools';

export class ClientController {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(IframePanelShadowComponent) private _iframePanelShadowComponent: IframePanelShadowComponent
    ) {
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg:
            PushStorageMessage<IframeDialogKeyEnum>
            | IMessage<ClientMessageTypeEnum.ScrapAllTables>
            | UIOpenTableScrapingDialogMessage) => {
            switch (msg.type) {
                case ClientMessageTypeEnum.ScrapAllTables: {
                    const ret = extractSheetsFromPage(document);

                    const msg: ScrapTablesMessage = {
                        type: TableMessageTypeEnum.ScrapTables,
                        payload: {
                            ...ret,
                            record: {
                                title: document.title,
                                sourceUrl: location.href,
                                recordType: TableRecordTypeEnum.WholeSheet,
                            },
                        },
                    };

                    chrome.runtime.sendMessage(msg);

                    break;
                }
                case ClipsheetMessageTypeEnum.PushStorage: {
                    const { payload } = msg;
                    if (payload.key === UIStorageKeyEnum.IframeDialogKey) {
                        const { _iframePanelShadowComponent } = this;
                        // this._iframePanelShadowComponent.deactivate();
                        if (payload.value === IframeDialogKeyEnum.None) {
                            _iframePanelShadowComponent.deactivate();
                            return;
                        }

                        // console.log('OpenIframeDialog', _iframePanelShadowComponent.active, payload.value);
                        _iframePanelShadowComponent.setSrcKey(payload.value);
                        _iframePanelShadowComponent.activate();
                    }

                    break;
                }
                // case UIMessageTypeEnum.OpenIframeDialog: {
                //     this._iframePanelShadowComponent.setSrcKey(msg.payload);
                //     this._iframePanelShadowComponent.activate();
                //     break;
                // }
                case UIMessageTypeEnum.OpenTableScrapingDialog: {
                    const injector = this._injector;

                    injector.get(CoverService).removeAllCovers();
                    injector.get(ElementInspectService).shadowComponent.activate();
                    injector.get(TableScrapingShadowComponent).activate();
                    break;
                }
            }
        });
    }
}
