// import type { IWorkflow } from '@chrome-extension-boilerplate/shared';
// import { DataSourceKeys } from '@chrome-extension-boilerplate/shared';
// import { sendDataSource } from '../../helper';
// import { crxRequest } from '../../api';

import { createIdentifier } from '@wendellhu/redi';
import { getStorage, setStorage } from '@univer-clipsheet-core/shared';
import type { IWorkflow } from './workflow';
import { type IGetWorkflowListParams, WorkflowStorageKeyEnum } from './workflow.message';

// export const sendWorkflowListDataSource = (value: IWorkflow[]) => sendDataSource(DataSourceKeys.WorkflowList, value);

export interface IWorkflowDataSource {
    add(workflow: IWorkflow): Promise<IWorkflow>;
    update(workflow: IWorkflow): Promise<any>;
    delete(id: string): Promise<any>;
    getList(params: IGetWorkflowListParams): Promise<IWorkflow[]>;
}

export const IWorkflowDataSource = createIdentifier('workflow-data-source');

const getStorageWorkflowList = async () => (await getStorage<IWorkflow[]>(WorkflowStorageKeyEnum.WorkflowList)) ?? [];

export class WorkflowLocaleDataSource implements IWorkflowDataSource {
    // private _pageSize = 20;

    async add(workflow: IWorkflow) {
        const list = await getStorageWorkflowList();
        list.push(workflow);
        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list);

        return workflow;
        // const res = await crxRequest.createWorkflow({
        //     title: workflow.name,
        //     json_obj: JSON.stringify(workflow),
        // });
        // workflow.id = res.recordId;
        // this._sendNewWorkflowList();

        // return workflow;
    }

    // private _sendNewWorkflowList() {
        // this.getWorkflowList({ pageSize: this._pageSize }).then((list) => {
        //     sendWorkflowListDataSource(list);
        // });
    // }

    async update(workflow: IWorkflow) {
        const list = await getStorageWorkflowList();
        const index = list.findIndex((w) => w.id === workflow.id);
        if (index === -1) {
            return;
        }
        list[index] = workflow;
        // list.push(workflow);
        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list.slice());
        // await crxRequest.updateWorkflow({
        //     title: workflow.name,
        //     json_obj: JSON.stringify(workflow),
        //     record_id: workflow.id!,
        // });

        // this._sendNewWorkflowList();
    }

    async delete(id: string) {
        const list = await getStorageWorkflowList();
        await setStorage(WorkflowStorageKeyEnum.WorkflowList, list.filter((w) => w.id !== id));
        // await crxRequest.deleteWorkflow({
        //     record_id: id,
        // });

        // this._sendNewWorkflowList();
    }

    getList(params: IGetWorkflowListParams) {
        return getStorageWorkflowList();
        // this._pageSize = params.pageSize;
        // return crxRequest.getWorkflowList(params).then(((res) => {
        //     return res.records.map((r) => {
        //         const workflow = r.json;
        //         workflow.id = r.recordId;

        //         return workflow;
        //     });
        // }));
    }
}
