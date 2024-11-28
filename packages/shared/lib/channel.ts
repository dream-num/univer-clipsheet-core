
export enum ChannelMessageType {
    Request = 'Request',
    Response = 'Response',
}

export type WithMessageType<T> = T & {
    type: ChannelMessageType;
};

export class Channel<RequestMessage, ResponseMessage> {
    constructor() {}

    connect(name: string) {
        return chrome.runtime.connect({ name });
    }

    getConnectedPort(name: string) {
        return new Promise<chrome.runtime.Port>((resolve) => {
            const listener = (p: chrome.runtime.Port) => {
                if (p.name === name) {
                    chrome.runtime.onConnect.removeListener(listener);
                    resolve(p);
                }
            };

            chrome.runtime.onConnect.addListener(listener);
        });
    }

    onResponse(port: chrome.runtime.Port, callback: (message: ResponseMessage) => void) {
        const handler = (message: WithMessageType<ResponseMessage>) => {
            if (message.type === ChannelMessageType.Response) {
                callback(message);
            }
        };
        port.onMessage.addListener(handler);
        return () => port.onMessage.removeListener(handler);
    }

    onRequest(port: chrome.runtime.Port, callback: (message: RequestMessage) => void) {
        const handler = (message: WithMessageType<RequestMessage>) => {
            if (message.type === ChannelMessageType.Request) {
                callback(message);
            }
        };
        port.onMessage.addListener(handler);
        return () => port.onMessage.removeListener(handler);
    }

    sendResponse(port: chrome.runtime.Port, message: ResponseMessage) {
        (message as WithMessageType<ResponseMessage>).type = ChannelMessageType.Response;
        port.postMessage(message);
    }

    sendRequest(port: chrome.runtime.Port, message: RequestMessage) {
        (message as WithMessageType<RequestMessage>).type = ChannelMessageType.Request;
        port.postMessage(message);
    }
}
