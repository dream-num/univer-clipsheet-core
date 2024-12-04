import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';

export enum CoverMessageTypeEnum {
    AddCover = 'AddCover',
    UpdateCover = 'UpdateCover',
    RemoveCover = 'RemoveCover',
    RemoveAllCovers = 'RemoveAllCovers',
}

export type AddCoverMessage = IMessageWithPayload<CoverMessageTypeEnum.AddCover, {
    id: string;
    selector: string;
}>;
export type UpdateCoverMessage = IMessageWithPayload<CoverMessageTypeEnum.UpdateCover, {
    id: string;
    selector: string;
}>;

export type RemoveCoverMessage = IMessageWithPayload<CoverMessageTypeEnum.RemoveCover, string>;
