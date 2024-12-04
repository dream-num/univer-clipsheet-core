import type { IWorkflow } from '@univer-clipsheet-core/workflow';
import { WorkflowStorageKeyEnum } from '@univer-clipsheet-core/workflow';
import { ClipsheetMessageTypeEnum, closePopup, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';

export function openWorkflowDialog(workflow?: Partial<IWorkflow>) {
    chrome.runtime.sendMessage({
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: UIStorageKeyEnum.WorkflowDialogVisible,
            value: true,

        },
    });

    chrome.runtime.sendMessage({
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: WorkflowStorageKeyEnum.CurrentWorkflow,
            value: workflow ?? null,
        },
    });
    closePopup();
}
