import type { IMessageRef } from '@components/message';
import type { IScraperColumn } from '@univer-clipsheet-core/scraper';
import { createContext, useContext } from 'react';
import type { SidePanelViewService } from './side-panel-view.service';

export enum SidePanelViewEnum {
    ScraperForm = 1,
    DrillDownColumnForm,
}

export interface ISidePanelContext {
    service?: SidePanelViewService;
    editingColumn?: IScraperColumn;
    message?: IMessageRef | null;
}

export const SidePanelContext = createContext<ISidePanelContext>({});

export function useSidePanelContext() {
    return useContext(SidePanelContext);
}
