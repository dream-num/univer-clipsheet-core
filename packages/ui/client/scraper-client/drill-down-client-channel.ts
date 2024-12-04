import type { ITableElementAnalyzeRowDataItem } from '@univer-clipsheet-core/table';
import { findElementBySelector, getCellData } from '@univer-clipsheet-core/table';
import { drillDownTaskChannel, isDrillDownChannelName } from '@univer-clipsheet-core/scraper';
import type { IClientChannel } from './client-channel';

function resolveShadowRootElement(element: HTMLElement) {
    const shadowRootElement = element.shadowRoot && element.shadowRoot.children[0];
    return (shadowRootElement ?? element) as HTMLElement;
}

function resolveDrillDownElementBySelector(selector: string) {
    const element = findElementBySelector(selector);
    return element && resolveShadowRootElement(element);
}

export class DrillDownClientChannel implements IClientChannel {
    private _port: chrome.runtime.Port | undefined = undefined;

    constructor() {

    }

    test(name: string): boolean {
        return isDrillDownChannelName(name);
    }

    connect(channelName: string) {
        if (this._port) {
            this.disconnect();
        }

        const port = drillDownTaskChannel.connect(channelName);

        this._port = port;

        drillDownTaskChannel.onRequest(port, (msg) => {
            const cache = new Map<string, ITableElementAnalyzeRowDataItem | undefined>();
            const items = msg.selectors.map((selector: string) => {
                if (!cache.has(selector)) {
                    const resolvedElement = resolveDrillDownElementBySelector(selector);
                    const cellData = getCellData(resolvedElement);

                    cache.set(selector, cellData);
                }

                const value = cache.get(selector)!;

                return {
                    selector,
                    value,
                };
            });
            drillDownTaskChannel.sendResponse(port, { items });
        });
    }

    disconnect() {
        this._port?.disconnect();
        this._port = undefined;
    }
}
