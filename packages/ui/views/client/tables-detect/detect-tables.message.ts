import type { IMessage, IMessageWithPayload } from '@univer-clipsheet-core/shared';

export interface IDetectedTableOption {
    id: string;
    rows: number;
}

export enum DetectTablesMessageTypeEnum {
    RequestDetectTables = 'request_detect_tables',
    PushDetectTables = 'push_detect_tables',
    ScrapDetectedTable = 'scrap_detected_table',
    HighlightDetectedTable = 'highlight_detected_table',
}

export type RequestDetectTablesMessage = IMessage<DetectTablesMessageTypeEnum.RequestDetectTables>;
export type PushDetectTablesMessage = IMessageWithPayload<
    DetectTablesMessageTypeEnum.PushDetectTables,
    Array<{
        id: string;
        rows: number;
    }>>;
export type ScrapDetectedTableMessage = IMessageWithPayload<DetectTablesMessageTypeEnum.ScrapDetectedTable, string>;
export type HighlightDetectedTableMessage = IMessageWithPayload<DetectTablesMessageTypeEnum.HighlightDetectedTable, {
    scrollTo?: boolean;
    id: string;
}>;
