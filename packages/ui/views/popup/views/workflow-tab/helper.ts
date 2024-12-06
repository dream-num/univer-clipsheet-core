import type { IWorkflow } from '@univer-clipsheet-core/workflow';
import { WorkflowStorageKeyEnum } from '@univer-clipsheet-core/workflow';
import { ClipsheetMessageTypeEnum, closePopup, IframeDialogKeyEnum, sendSetIframeDialogKeyMessage, SetIframeDialogKeyMessage, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';

export function openWorkflowDialog(workflow?: Partial<IWorkflow>) {
    sendSetIframeDialogKeyMessage(IframeDialogKeyEnum.WorkflowPanel);

    chrome.runtime.sendMessage({
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: WorkflowStorageKeyEnum.CurrentWorkflow,
            value: workflow ?? null,
        },
    });
    closePopup();
}
