
import type { IWorkflow } from '@univer-clipsheet-core/workflow';
import React from 'react';
import type { WorkflowPanelViewService } from './workflow-panel-view.service';

export interface IWorkflowPanelContext {
    workflow?: IWorkflow;
    setWorkflow?: React.Dispatch<React.SetStateAction<IWorkflow>>;
    service?: WorkflowPanelViewService;
    originTableId: string;
    hasDataSource: boolean;
}

export const WorkflowPanelContext = React.createContext<IWorkflowPanelContext>({
    originTableId: '',
    hasDataSource: false,
});

export function useWorkflowPanelContext() {
    return React.useContext(WorkflowPanelContext);
}
