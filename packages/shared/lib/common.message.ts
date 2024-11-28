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
}

export type GetStorageMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.GetStorage, string>;
export type SetStorageMessage<T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.SetStorage, { key: string; value: T }>;
export type PushStorageMessage<T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.PushStorage, { key: string; value: T }>;
export type RemoveStorageMessage = IMessageWithPayload<ClipsheetMessageTypeEnum.RemoveStorage, string>;

export type GetDataSourceMessage<K extends string, T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.GetDataSource, {
    key: K;
    params: T;
}>;
export type PushDataSourceMessage<T = unknown> = IMessageWithPayload<ClipsheetMessageTypeEnum.PushDataSource, { key: string; value: T }>;
