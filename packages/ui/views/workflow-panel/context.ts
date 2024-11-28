
import type { IWorkflow } from '@univer-clipsheet-core/workflow';
import React from 'react';

export interface IWorkflowPanelContext {
    // user: Partial<AnonymousUser>;
    workflow?: IWorkflow;
    setWorkflow?: React.Dispatch<React.SetStateAction<IWorkflow>>;
    originUnitId: string;
    hasDataSource: boolean;
}

export const WorkflowPanelContext = React.createContext<IWorkflowPanelContext>({
    // user: {},
    originUnitId: '',
    hasDataSource: false,
});

export function useWorkflowPanelContext() {
    return React.useContext(WorkflowPanelContext);
}
