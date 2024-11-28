import type { IMessageRef } from '@components/message';
import type { IScraperColumn } from '@univer-clipsheet-core/scraper';
import { createContext, useContext } from 'react';

export enum SidePanelViewEnum {
    ScraperForm = 1,
    DrillDownColumnForm,
}

export interface ISidePanelContext {
    // view: SidePanelViewEnum;
    // setView: (view: SidePanelViewEnum) => void;
    editingColumn?: IScraperColumn;
    message?: IMessageRef | null;
}

export const SidePanelContext = createContext<ISidePanelContext>({
    // view: SidePanelViewEnum.ScraperForm,
    // setView: (view: SidePanelViewEnum) => {},
});

export function useSidePanelContext() {
    return useContext(SidePanelContext);
}
