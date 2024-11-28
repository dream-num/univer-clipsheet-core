import { createContext, useContext } from 'react';
import type { IMessageRef } from '@components/message';

export interface IPopupContext {
    showMessage?: IMessageRef['showMessage'];
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
