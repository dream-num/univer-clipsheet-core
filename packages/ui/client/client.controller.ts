import type { IMessage, PushStorageMessage, UIOpenTableScrapingDialogMessage } from '@univer-clipsheet-core/shared';
import { ClientMessageTypeEnum, ClipsheetMessageTypeEnum, UIMessageTypeEnum, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { ScrapTablesMessage } from '@univer-clipsheet-core/table';
import { TableMessageTypeEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { Inject, Injector } from '@wendellhu/redi';
import { extractSheetsFromPage } from './tools';
import { WorkflowPanelShadowComponent } from './workflow-panel-shadow-component';
import { ElementInspectService } from './element-inspect';
import { TableScrapingShadowComponent } from './table-scraping';
import { CoverService } from './cover';

export class ClientController {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(WorkflowPanelShadowComponent) private _workflowPanelShadowComponent: WorkflowPanelShadowComponent
    ) {
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: PushStorageMessage | IMessage<ClientMessageTypeEnum.ScrapAllTables> | UIOpenTableScrapingDialogMessage) => {
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
                    const { key, value } = msg.payload;

                    if (key === UIStorageKeyEnum.WorkflowDialogVisible) {
                        const { _workflowPanelShadowComponent } = this;
                        const visible = value as boolean;

                        if (visible) {
                            if (!_workflowPanelShadowComponent.active) {
                                _workflowPanelShadowComponent.activate();
                            }
                        } else {
                            _workflowPanelShadowComponent.deactivate();
                        }
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
