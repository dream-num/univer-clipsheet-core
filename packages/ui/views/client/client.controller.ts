import type { IMessage, PushStorageMessage } from '@univer-clipsheet-core/shared';
import { ClientMessageTypeEnum, ClipsheetMessageTypeEnum, generateRandomId, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { ScrapTablesMessage } from '@univer-clipsheet-core/table';
import { TableMessageTypeEnum, TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import { extractSheetsFromPage } from './tools';
import { WorkflowPanelController } from './workflow-panel.controller';

export class ClientController {
    private _workflowPanelController = new WorkflowPanelController();
    constructor() {
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: PushStorageMessage | IMessage<ClientMessageTypeEnum.ScrapAllTables>) => {
            switch (msg.type) {
                case ClientMessageTypeEnum.ScrapAllTables: {
                    const ret = extractSheetsFromPage(document);

                    const msg: ScrapTablesMessage = {
                        type: TableMessageTypeEnum.ScrapTables,
                        payload: {
                            ...ret,
                            record: {
                                id: generateRandomId(),
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
                        const { _workflowPanelController } = this;
                        const visible = value as boolean;
                        if (visible) {
                            if (_workflowPanelController.active) {
                                _workflowPanelController.deactivate();
                            }
                        } else {
                            _workflowPanelController.deactivate();
                        }
                    }
                    break;
                }
            }
        });
    }
}
