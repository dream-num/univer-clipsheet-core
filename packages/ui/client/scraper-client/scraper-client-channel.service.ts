import type { ChannelConnectedMessage, ConnectChannelMessage } from '@univer-clipsheet-core/shared';
import { ChannelMessageTypeEnum } from '@univer-clipsheet-core/shared';
import type { IClientChannel } from './client-channel';
import { DrillDownClientChannel } from './drill-down-client-channel';
import { ScraperClientChannel } from './scraper-client-channel';

export class ScraperClientChannelService {
    clientChannels = new Set<IClientChannel>();

    constructor() {
        this.addChannel(new DrillDownClientChannel());
        this.addChannel(new ScraperClientChannel());
    }

    addChannel(channel: IClientChannel) {
        this.clientChannels.add(channel);
    }

    listenMessage() {
        chrome.runtime.onMessage.addListener((message: ConnectChannelMessage, sender, sendResponse) => {
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
            }
        });
    }
}
