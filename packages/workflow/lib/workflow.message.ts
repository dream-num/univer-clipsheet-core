import type { IMessageWithPayload } from '@univer-clipsheet-core/shared';
import type { IWorkflow } from './workflow';

export interface IGetWorkflowListParams {
    pageSize: number;
    filterRecordIds?: string[];
}

export enum WorkflowStorageKeyEnum {
    CurrentWorkflow = 'current_workflow',
    WorkflowList = 'workflow_list',
}

export enum WorkflowDataSourceKeyEnum {
    WorkflowList = 'workflow_list',
    RunningWorkflowIds = 'running_workflow_ids',
}

export interface IGetWorkflowListParams {
    pageSize: number;
};

export enum WorkflowMessageTypeEnum {
    RunWorkflow = 'run_workflow',
    StopWorkflow = 'stop_workflow',
    CreateWorkflow = 'create_workflow',
    UpdateWorkflow = 'update_workflow',
    DeleteWorkflow = 'delete_workflow',
}

export type RunWorkflowMessage = IMessageWithPayload<WorkflowMessageTypeEnum.RunWorkflow, IWorkflow>;
export type StopWorkflowMessage = IMessageWithPayload<WorkflowMessageTypeEnum.StopWorkflow, string>;
export type DeleteWorkflowMessage = IMessageWithPayload<WorkflowMessageTypeEnum.DeleteWorkflow, string>;
export type CreateWorkflowMessage = IMessageWithPayload<WorkflowMessageTypeEnum.CreateWorkflow, {
    workflow: IWorkflow;
    toRun?: boolean;
}>;
export type UpdateWorkflowMessage = IMessageWithPayload<WorkflowMessageTypeEnum.UpdateWorkflow, {
    workflow: IWorkflow;
    toRun?: boolean;
}>;
