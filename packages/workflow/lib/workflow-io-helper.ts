import type { IGetScraperListParams, IScraper } from '@univer-clipsheet-core/scraper';
import { ScraperDataSourceKeyEnum, scraperIOHelper } from '@univer-clipsheet-core/scraper';
import { generateRandomId, ObjectValidator, requestDataSource } from '@univer-clipsheet-core/shared';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import type { IWorkflow, IWorkflowColumn } from './workflow';
import { TimerRepeatMode, WorkflowFilterMode } from './workflow';

export interface IWorkflowSnapshot extends IWorkflow {
    __scrapers__: string[];
}

const columnTypes = [
    Sheet_Cell_Type_Enum.TEXT,
    Sheet_Cell_Type_Enum.URL,
    Sheet_Cell_Type_Enum.IMAGE,
    Sheet_Cell_Type_Enum.VIDEO,
];

function validateColumn(columnLike: Record<string, any>): columnLike is IWorkflowColumn {
    const requiredColumnFields = ['name', 'type', 'index'];
    for (const field of requiredColumnFields) {
        if (!(field in columnLike)) {
            return false;
        }
    }

    if (!columnTypes.includes(columnLike.type as number)) {
        return false;
    }

    if (!('sourceColumns' in columnLike) || !Array.isArray(columnLike.sourceColumns)) {
        return false;
    }

    return true;
}

export const workflowValidator = new ObjectValidator<IWorkflowSnapshot>({
    requiredFields: [
        'columns',
        'scraperSettings',
        'filterMode',
        'rules',
        'name',
    ],
    fieldRules: {
        __scrapers__: (value) => Array.isArray(value),
        columns(value) {
            if (!Array.isArray(value)) {
                return false;
            }

            for (const column of value) {
                if (!validateColumn(column)) {
                    return false;
                }
            }

            return true;
        },
        name: (v) => Boolean(v),
        rules: (value) => Array.isArray(value),
        filterMode: (value) => [WorkflowFilterMode.Remain, WorkflowFilterMode.Remove].includes(value),
        schedule: (value) => {
            const fields = ['startDate', 'minute', 'repeatMode'];
            for (const field of fields) {
                if (!(field in value)) {
                    return false;
                }
            }

            if (value.repeatMode < TimerRepeatMode.Once || value.repeatMode > TimerRepeatMode.Custom) {
                return false;
            }

            return true;
        },
    },
});

export const workflowIOHelper = {
    async toJSON(_workflow: IWorkflow) {
        const workflow = { ..._workflow };

        const scraperIds = workflow.columns.reduce((set, column) => {
            column.sourceColumns.forEach((sourceColumn) => {
                set.add(sourceColumn.scraperId);
            });
            return set;
        }, new Set<string>());

        const scrapers = await requestDataSource<IScraper[], IGetScraperListParams>(ScraperDataSourceKeyEnum.ScraperList, {
            pageSize: scraperIds.size,
            filterRecordIds: Array.from(scraperIds),
        });

        const idMap = new Map<string, string>();

        scrapers.forEach((scraper) => {
            const newId = generateRandomId();
            idMap.set(scraper.id, newId);
            scraper.id = newId;
        });

        workflow.columns.forEach((column) => {
            column.sourceColumns.forEach((sourceColumn) => {
                sourceColumn.scraperId = idMap.get(sourceColumn.scraperId)!;
            });
        });

        workflow.scraperSettings.forEach((setting) => {
            setting.scraperId = idMap.get(setting.scraperId)!;
        });

        (workflow as IWorkflowSnapshot).__scrapers__ = scrapers.map((scraper) => scraperIOHelper.toJSON(scraper));

        delete workflow.tableId;

        return JSON.stringify(workflow, null, 2);
    },
    parse(jsonStr: string): IWorkflowSnapshot | null {
        try {
            const workflowLike = JSON.parse(jsonStr);
            const validation = this.validate(workflowLike);
            if (!validation) {
                return null;
            }

            return workflowLike;
        } catch {
            return null;
        }
    },
    validate(workflowLike: Record<string, any>) {
        return workflowValidator.validate(workflowLike);
    },
};
