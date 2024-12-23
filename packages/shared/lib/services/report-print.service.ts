import type { ReportPrintInfoMessage } from '@lib/common.message';
import { ClipsheetMessageTypeEnum } from '@lib/common.message';

export class ReportPrintService {
    constructor() {
        this.listenMessage();
    }

    printReport(...infos: any[]) {
        // eslint-disable-next-line no-console
        console.log('[ReportPrintService message]:', ...infos);
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener(async (msg: ReportPrintInfoMessage) => {
            switch (msg.type) {
                case ClipsheetMessageTypeEnum.ReportPrintInfo: {
                    const { payload } = msg;
                    this.printReport(...payload);
                    break;
                }
            }
        });
    }
}
