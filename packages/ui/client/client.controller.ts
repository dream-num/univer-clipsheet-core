import type { IframeViewTypeEnum, IMessage, PushStorageMessage, UIOpenTableScrapingDialogMessage } from '@univer-clipsheet-core/shared';
import { ClientMessageTypeEnum, ClipsheetMessageTypeEnum, UIMessageTypeEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { ScrapTablesMessage } from '@univer-clipsheet-core/table';
import { TableMessageTypeEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { Inject, Injector } from '@wendellhu/redi';
import { CoverService } from './cover';
import { ElementInspectService } from './element-inspect';
import { IframeViewController } from './iframe-view';
import { TableScrapingShadowComponent } from './table-scraping';
import { extractSheetsFromPage } from './tools';

export class ClientController {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(IframeViewController) private _iframeViewController: IframeViewController
    ) {
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg:
            PushStorageMessage<IframeViewTypeEnum>
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
                    if (payload.key === UIStorageKeyEnum.IframeView) {
                        this._iframeViewController.setView(payload.value);
                    }

                    break;
                }

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
