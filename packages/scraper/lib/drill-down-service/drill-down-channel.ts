
import type { ITableElementAnalyzeRowDataItem } from '@univer-clipsheet-core/table';
import { Channel } from '@univer-clipsheet-core/shared';

export interface DrillDownTaskChannelRequest {
    selectors: string[];
}
export interface DrillDownTaskChannelResponse {
    items: Array<{
        selector: string;
        value: ITableElementAnalyzeRowDataItem | undefined;
    }>;
}

const channelPrefix = 'DrillDownTaskChannel-';

export const isDrillDownChannelName = (name: string) => name.startsWith(channelPrefix);

export const getDrillDownTaskChannelName = (id: string) => `${channelPrefix}${id}`;
export const drillDownTaskChannel = new Channel<DrillDownTaskChannelRequest, DrillDownTaskChannelResponse>();
