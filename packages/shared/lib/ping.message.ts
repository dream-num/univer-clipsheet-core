import type { IMessageWithPayload } from './messages';

export enum PingSignalKeyEnum {
    PopupShowed = 'popup_showed',
    DrillDownColumnFormShowed = 'drill_down_column_form_showed',
}

export const pingSignalMessageType = 'ping_signal' as const;

export type PingSignalMessage = IMessageWithPayload<typeof pingSignalMessageType, PingSignalKeyEnum>;

const signalIntervals = {
    ping: 500,
    clearPing: 1000,
};

export function listenPingSignal(signalKey: PingSignalKeyEnum, callback: () => void) {
    let timer: number | undefined;

    chrome.runtime.onMessage.addListener((message: PingSignalMessage) => {
        if (message.type === pingSignalMessageType && message.payload === signalKey) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                callback();
            }, signalIntervals.clearPing);
        }
    });
}

export function pingSignal(key: PingSignalKeyEnum, tabId: number) {
    const timer = setInterval(() => {
        const message: PingSignalMessage = {
            type: pingSignalMessageType,
            payload: key,
        };
        chrome.tabs.sendMessage(tabId, message);
    }, signalIntervals.ping);

    return () => {
        clearInterval(timer);
    };
}
