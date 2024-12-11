import type { IGetScraperListParams, IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { ScraperDataSourceKeyEnum } from '@univer-clipsheet-core/scraper';
import type { GetDataSourceMessage, PushDataSourceMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, closePopup, generateRandomId, IframeViewTypeEnum, promisifyMessage, sendSetIframeViewMessage } from '@univer-clipsheet-core/shared';
import type { ITableRecord } from '@univer-clipsheet-core/table';
import { TableRecordTypeEnum } from '@univer-clipsheet-core/table';
import type { IGetWorkflowListParams, IWorkflow, IWorkflowColumn } from '@univer-clipsheet-core/workflow';
import { WorkflowDataSourceKeyEnum, WorkflowStorageKeyEnum } from '@univer-clipsheet-core/workflow';

function toColumn(column: IScraperColumn | IWorkflowColumn): IWorkflowColumn {
    return {
        id: generateRandomId(),
        name: column.name,
        type: column.type,
        sourceColumns: [],
    };
}

export async function getWorkflowColumnsByTable(tableRecord: ITableRecord) {
    const triggerId = tableRecord.triggerId;

    switch (tableRecord.recordType) {
        case TableRecordTypeEnum.ScraperSheet: {
            const msg: GetDataSourceMessage<ScraperDataSourceKeyEnum.ScraperList, IGetScraperListParams> = {
                type: ClipsheetMessageTypeEnum.GetDataSource,
                payload: {
                    key: ScraperDataSourceKeyEnum.ScraperList,
                    params: {
                        pageSize: 1,
                        filterRecordIds: [triggerId!],
                    },
                },
            };

            chrome.runtime.sendMessage(msg);

            const response = promisifyMessage<PushDataSourceMessage<IScraper[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === ScraperDataSourceKeyEnum.ScraperList);
            return response.then((res) => {
                const [scraper] = res.payload.value;

                return scraper
                    ? scraper.columns.map(toColumn)
                    : [];
            });
        }
        case TableRecordTypeEnum.WorkflowSheet: {
            const msg: GetDataSourceMessage<WorkflowDataSourceKeyEnum.WorkflowList, IGetWorkflowListParams> = {
                type: ClipsheetMessageTypeEnum.GetDataSource,
                payload: {
                    key: WorkflowDataSourceKeyEnum.WorkflowList,
                    params: {
                        pageSize: 1,
                        filterRecordIds: [triggerId!],
                    },
                },
            };

            chrome.runtime.sendMessage(msg);

            const response = promisifyMessage<PushDataSourceMessage<IWorkflow[]>>((msg) => msg.type === ClipsheetMessageTypeEnum.PushDataSource && msg.payload.key === WorkflowDataSourceKeyEnum.WorkflowList);
            return response.then((res) => {
                const [workflow] = res.payload.value;

                return workflow
                    ? workflow.columns.map(toColumn)
                    : [];
            });
        }
        default: {
            return [];
        }
    }
}

export function openWorkflowDialog(workflow?: Partial<IWorkflow>) {
    sendSetIframeViewMessage(IframeViewTypeEnum.WorkflowPanel);

    chrome.runtime.sendMessage({
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: WorkflowStorageKeyEnum.CurrentWorkflow,
            value: workflow ?? null,
        },
    });
    closePopup();
}
