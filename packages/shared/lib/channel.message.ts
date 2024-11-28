import type { IMessageWithPayload } from './messages';

export enum ChannelMessageTypeEnum {
    ConnectChannel = 'connect_channel',
    ChannelConnected = 'channel_connected',
}
export type ConnectChannelMessage = IMessageWithPayload<ChannelMessageTypeEnum.ConnectChannel, string>;
export type ChannelConnectedMessage = IMessageWithPayload<ChannelMessageTypeEnum.ChannelConnected, string>;
