import type { IMessageWithPayload } from './messages';

export enum ClipsheetMessageTypeEnum {
    DomContentLoaded = 'dom_content_loaded',
    Loaded = 'loaded',
    SetStorage = 'set_storage',
    GetStorage = 'get_storage',
    RemoveStorage = 'remove_storage',
    PushStorage = 'push_storage',
    OpenSidePanel = 'open_side_panel',
    GetDataSource = 'get_data_source',
    PushDataSource = 'push_data_source',
    ActiveTab = 'active_tab',
    ReportPrintInfo = 'report_print_info',
}

export type OpenSidePanelMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.OpenSidePanel, number>;
export type GetStorageMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.GetStorage, string>;
export type SetStorageMessage<T = unknown, K = string> = IMessageWithPayload<ClipsheetMessageTypeEnum.SetStorage, { key: K; value: T }>;
export type PushStorageMessage<T = unknown, K = string> = IMessageWithPayload<ClipsheetMessageTypeEnum.PushStorage, { key: K; value: T }>;
export type RemoveStorageMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.RemoveStorage, string>;

export type GetDataSourceMessage<K extends string, T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.GetDataSource, {
    key: K;
    params: T;
}>;

export type PushDataSourceMessage<T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.PushDataSource, { key: string; value: T }>;
export type ActiveTabMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.ActiveTab, chrome.tabs.Tab | undefined>;
export type ReportPrintInfoMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.ReportPrintInfo, any[]>;

export function sendActiveTabMessage(tab?: chrome.tabs.Tab) {
    const message: ActiveTabMessage = {
        type: ClipsheetMessageTypeEnum.ActiveTab,
        payload: tab,
    };
    chrome.runtime.sendMessage(message);
}

export function sendReportPrintInfoMessage(...infos: any[]) {
    const message: ReportPrintInfoMessage = {
        type: ClipsheetMessageTypeEnum.ReportPrintInfo,
        payload: infos,
    };
    chrome.runtime.sendMessage(message);
}
