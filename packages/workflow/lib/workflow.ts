import type { IScraperColumn } from '@univer-clipsheet-core/scraper';

interface IWorkflowTrigger<N extends string, P = unknown> {
    name: N;
    payload: P;
}

export enum WorkflowTriggerName {
    EmailNotification = 'EmailNotification',
}

export type WorkflowEmailNotificationTrigger = IWorkflowTrigger<WorkflowTriggerName.EmailNotification, null>;

export type WorkflowTrigger = WorkflowEmailNotificationTrigger;

export enum WorkflowUpdateMode {
    Initial = 1,
    Incremental = 2,
}

export enum WorkflowFilterMode {
    Remove = 1,
    Remain,
}

export enum TimerRepeatMode {
    Once = 1,
    Daily,
    Weekly,
    Monthly,
    Yearly,
    Weekday,
    Custom,
}

export interface IWorkflowRule<N extends string, P> {
    name: N;
    payload: P;
}

export enum WorkflowRuleName {
    RemoveDuplicate = 'RemoveDuplicate',
    FilterColumn = 'FilterColumn',
}
// Remove duplicate Rule
export type WorkflowRemoveDuplicateRule = IWorkflowRule<WorkflowRuleName.RemoveDuplicate, string[]>;

// Filter Rule
export enum WorkflowFilterColumnConditionOperator {
    None = 0,
    IsEmpty,
    IsNotEmpty,
    TextContains,
    TextDoesNotContain,
    TextStartsWith,
    TextEndsWith,
    TextEquals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    NumberEqual,
    NumberNotEqual,
}

export interface IWorkflowFilterColumnCondition {
    operator: WorkflowFilterColumnConditionOperator;
    value: string | number;
}
export enum WorkflowFilterRuleItemOperator {
    And = '&',
    Or = '|',
}
export interface IWorkflowFilterRuleItem {
    workflowColumnId: string;
    leftCondition: IWorkflowFilterColumnCondition;
    rightCondition: IWorkflowFilterColumnCondition;
    operator: WorkflowFilterRuleItemOperator;
}
export type WorkflowFilterColumnRule = IWorkflowRule<WorkflowRuleName.FilterColumn, {
    mode: WorkflowFilterMode;
    rules?: IWorkflowFilterRuleItem[];
}>;

export type WorkflowRule =
 WorkflowRemoveDuplicateRule
| WorkflowFilterColumnRule;

export interface IWorkflowSourceColumn {
    scraperId: string;
    columnId: string;
}

export interface IWorkflowColumn {
    id: string;
    name: string;
    type: IScraperColumn['type'];
    sourceColumns: Array<IWorkflowSourceColumn>;
}

export enum WorkflowScraperSettingMode {
    All = 0,
    Custom,
}

export interface IWorkflowScraperSetting {
    id: string;
    scraperId: string;
    mode: WorkflowScraperSettingMode;
    customValue: number | undefined;
}

export enum CustomTimerRuleMode {
    Day = 1,
    Week,
    Month,
    Year,
}
export interface ICustomTimerRule {
    frequency: number;
    mode: CustomTimerRuleMode;
    alwaysControl: boolean;
    dates?: number[];
    deadline?: number;
}

export interface IWorkflowSchedule {
    startDate: number;
    minute: number;
    repeatMode: TimerRepeatMode;
    customRule?: ICustomTimerRule;
};

export interface IWorkflow {
    id?: string;
    tableId?: string; // reference to a table record
    filterMode: WorkflowFilterMode;
    scraperSettings: IWorkflowScraperSetting[];
    columns: IWorkflowColumn[];
    rules: WorkflowRule[];
    name: string;
    description?: string;
    schedule: IWorkflowSchedule;
    triggers?: WorkflowTrigger[];
}

export interface IWorkflowRecord {
    createAt: number;
    updateAt?: number;
    recordId: string;
    json: IWorkflow;
    title: string;
}

