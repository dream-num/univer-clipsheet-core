import { createIdentifier } from '@wendellhu/redi';
import { generateRandomId, getStorage, setStorage } from '@univer-clipsheet-core/shared';
import type { IWorkflow } from './workflow';
import { type IGetWorkflowListParams, WorkflowStorageKeyEnum } from './workflow.message';

export interface IWorkflowDataSource {
    add(workflow: IWorkflow): Promise<IWorkflow>;
    update(workflow: IWorkflow): Promise<any>;
    delete(id: string): Promise<any>;
    getList(params: IGetWorkflowListParams): Promise<IWorkflow[]>;
}

export const IWorkflowDataSource = createIdentifier('workflow-data-source');

const getStorageWorkflowList = async () => (await getStorage<IWorkflow[]>(WorkflowStorageKeyEnum.WorkflowList)) ?? [];

export class LocaleWorkflowDataSource implements IWorkflowDataSource {
    async add(workflow: IWorkflow) {
        const list = await getStorageWorkflowList();
        workflow.id = generateRandomId();
        list.push(workflow);
        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list);

        return workflow;
    }

    async update(workflow: IWorkflow) {
        const list = await getStorageWorkflowList();
        const index = list.findIndex((w) => w.id === workflow.id);
        if (index === -1) {
            return;
        }
        list[index] = workflow;

        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list.slice());
    }

    async delete(id: string) {
        const list = await getStorageWorkflowList();
        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list.filter((w) => w.id !== id));
    }

    getList(params: IGetWorkflowListParams) {
        return getStorageWorkflowList();
    }
}
