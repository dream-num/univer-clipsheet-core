import { createContext, useContext } from 'react';
import type { IMessageRef } from '@components/message';
import type { ITableRecord } from '@univer-clipsheet-core/table';
import type { PopupViewService } from './popup-view.service';

export interface IPopupEvents {
    onTableRecordClick: (record: ITableRecord) => void;
}

export interface IPopupContext {
    showMessage?: IMessageRef['showMessage'];
    service?: PopupViewService<unknown>;
    timeFormat: (timestamp: number) => string;
    searchInput: string;
}

export const PopupContext = createContext<IPopupContext>({
    timeFormat: () => '',
    searchInput: '',
});

export function usePopupContext() {
    return useContext(PopupContext);
}
