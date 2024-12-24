import type { ChannelConnectedMessage, ConnectChannelMessage } from '@univer-clipsheet-core/shared';
import { ChannelMessageTypeEnum } from '@univer-clipsheet-core/shared';
import type { PreviewScraperTableMessage } from '@univer-clipsheet-core/scraper';
import { ScraperMessageTypeEnum } from '@univer-clipsheet-core/scraper';
import { createLazyLoadElement, findElementBySelector, PreviewSheetFromEnum } from '@univer-clipsheet-core/table';
import { openPreviewTablePanel } from '@lib/helper';
import type { IClientChannel } from './client-channel';
import { DrillDownClientChannel } from './drill-down-client-channel';
import { createLazyLoadElementsOptions, ScraperClientChannel } from './scraper-client-channel';

export class ScraperClientService {
    clientChannels = new Set<IClientChannel>();

    constructor() {
        this.addChannel(new DrillDownClientChannel());
        this.addChannel(new ScraperClientChannel());
    }

    addChannel(channel: IClientChannel) {
        this.clientChannels.add(channel);
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener((message: ConnectChannelMessage | PreviewScraperTableMessage, sender, sendResponse) => {
            switch (message.type) {
                case ChannelMessageTypeEnum.ConnectChannel: {
                    const channelName = message.payload;

                    const channel = Array.from(this.clientChannels).find((c) => c.test(channelName));
                    if (!channel) {
                        return;
                    }

                    channel.connect(channelName);

                    const response: ChannelConnectedMessage = {
                        type: ChannelMessageTypeEnum.ChannelConnected,
                        payload: channelName,
                    };
                    chrome.runtime.sendMessage(response);
                    break;
                }
                case ScraperMessageTypeEnum.PreviewScraperTable: {
                    const { selector, columns } = message.payload;
                    const el = findElementBySelector(selector);

                    if (!el) {
                        return;
                    }
                    const lazyLoadElement = createLazyLoadElement(el, createLazyLoadElementsOptions(columns));

                    if (!lazyLoadElement) {
                        return;
                    }

                    const sheet = lazyLoadElement.getAllSheets()[0];
                    if (!sheet) {
                        return;
                    }

                    sheet.columnName = columns.map((c) => c.name);
                    openPreviewTablePanel(sheet, PreviewSheetFromEnum.ScraperForm);
                }
            }
        });
    }
}
