import React from 'react';
import { t } from '@univer-clipsheet-core/locale';
import type { IWorkflowFilterRuleItem, WorkflowFilterColumnRule } from '@univer-clipsheet-core/workflow';
import { WorkflowFilterColumnConditionOperator, WorkflowFilterMode, WorkflowFilterRuleItemOperator, WorkflowRuleName } from '@univer-clipsheet-core/workflow';
import { PlusSvg } from '@components/icons';
import { Select } from '@components/select';
import { ScraperInput } from '@components/ScraperInput';
import { useWorkflowPanelContext } from '../context';
import { Collapse } from './Collapse';

const CloseConditionSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
            <path d="M6.71314 6.50614L9.35964 3.85964C9.4074 3.81352 9.44549 3.75835 9.47169 3.69735C9.4979 3.63634 9.51169 3.57073 9.51227 3.50434C9.51285 3.43796 9.5002 3.37212 9.47506 3.31067C9.44991 3.24922 9.41279 3.19339 9.36584 3.14645C9.31889 3.0995 9.26307 3.06237 9.20162 3.03723C9.14017 3.01209 9.07433 2.99944 9.00794 3.00002C8.94155 3.0006 8.87594 3.01439 8.81494 3.04059C8.75394 3.0668 8.69877 3.10489 8.65264 3.15264L6.00614 5.79914L3.35964 3.15264C3.26534 3.06157 3.13904 3.01117 3.00794 3.01231C2.87685 3.01345 2.75144 3.06603 2.65873 3.15873C2.56603 3.25144 2.51345 3.37685 2.51231 3.50794C2.51117 3.63904 2.56157 3.76534 2.65264 3.85964L5.29914 6.50614L2.65264 9.15264C2.60489 9.19877 2.5668 9.25394 2.54059 9.31494C2.51439 9.37594 2.5006 9.44155 2.50002 9.50794C2.49944 9.57433 2.51209 9.64017 2.53723 9.70162C2.56237 9.76307 2.5995 9.81889 2.64645 9.86584C2.69339 9.91279 2.74922 9.94991 2.81067 9.97506C2.87212 10.0002 2.93796 10.0128 3.00434 10.0123C3.07073 10.0117 3.13634 9.9979 3.19735 9.97169C3.25835 9.94549 3.31352 9.9074 3.35964 9.85964L6.00614 7.21314L8.65264 9.85964C8.74694 9.95072 8.87325 10.0011 9.00434 9.99998C9.13544 9.99884 9.26085 9.94626 9.35355 9.85355C9.44626 9.76085 9.49884 9.63544 9.49998 9.50434C9.50112 9.37325 9.45072 9.24694 9.35964 9.15264L6.71314 6.50614Z" fill="currentColor" />
        </svg>
    );
};

const compareOptions = [
    {
        label: t('None'),
        value: WorkflowFilterColumnConditionOperator.None,
    },
    {
        label: t('IsEmpty'),
        value: WorkflowFilterColumnConditionOperator.IsEmpty,
    },
    {
        label: t('IsNotEmpty'),
        value: WorkflowFilterColumnConditionOperator.IsNotEmpty,
    },
    {
        label: t('TextContains'),
        value: WorkflowFilterColumnConditionOperator.TextContains,
    },
    {
        label: t('TextDoesNotContain'),
        value: WorkflowFilterColumnConditionOperator.TextDoesNotContain,
    },
    {
        label: t('TextStartsWith'),
        value: WorkflowFilterColumnConditionOperator.TextStartsWith,
    },
    {
        label: t('TextEndsWith'),
        value: WorkflowFilterColumnConditionOperator.TextEndsWith,
    },
    {
        label: t('TextEquals'),
        value: WorkflowFilterColumnConditionOperator.TextEquals,
    },
    {
        label: t('GreaterThan'),
        value: WorkflowFilterColumnConditionOperator.GreaterThan,
    },
    {
        label: t('GreaterThanOrEqual'),
        value: WorkflowFilterColumnConditionOperator.GreaterThanOrEqual,
    },
    {
        label: t('LessThan'),
        value: WorkflowFilterColumnConditionOperator.LessThan,
    },
    {
        label: t('LessThanOrEqual'),
        value: WorkflowFilterColumnConditionOperator.LessThanOrEqual,
    },
    {
        label: t('NumberEqual'),
        value: WorkflowFilterColumnConditionOperator.NumberEqual,
    },
    {
        label: t('NumberNotEqual'),
        value: WorkflowFilterColumnConditionOperator.NumberNotEqual,
    },
    // {
    //     label: t('NumberBetween'),
    //     value: WorkflowFilterColumnConditionOperator.NumberBetween,
    // },
    // {
    //     label: t('NumberNotBetween'),
    //     value: WorkflowFilterColumnConditionOperator.NumberNotBetween,
    // },
];

const filterOptions = [
    {
        text: t('removed'),
        value: WorkflowFilterMode.Remove,
    },
    {
        text: t('remained'),
        value: WorkflowFilterMode.Remain,
    },
];

function createColumnRuleItem(columnId: string): IWorkflowFilterRuleItem {
    return {
        workflowColumnId: columnId,
        leftCondition: {
            operator: WorkflowFilterColumnConditionOperator.None,
            value: '',
        },
        rightCondition: {
            operator: WorkflowFilterColumnConditionOperator.None,
            value: '',
        },
        operator: WorkflowFilterRuleItemOperator.And,
    };
}

export const DataFilterForm = () => {
    const { workflow: _workflow, setWorkflow } = useWorkflowPanelContext();
    const workflow = _workflow!;
    const rules = workflow.rules ?? [];
    const ruleIndex = rules.findIndex((r) => r.name === WorkflowRuleName.FilterColumn);
    const filterRule = rules[ruleIndex] as WorkflowFilterColumnRule | undefined;

    const filterMode = filterRule?.payload.mode ?? WorkflowFilterMode.Remove;

    const columns = workflow?.columns;

    function setRuleValue<K extends keyof WorkflowFilterColumnRule['payload'] = keyof WorkflowFilterColumnRule['payload']>(key: K, value: WorkflowFilterColumnRule['payload'][K]) {
        const oldPayload = filterRule?.payload;
        const newRule = {
            name: WorkflowRuleName.FilterColumn as const,
            payload: {
                ...oldPayload,
                mode: filterMode,
                [key]: value,
            },
        };

        if (ruleIndex < 0) {
            setWorkflow?.({
                ...workflow,
                rules: rules.concat([newRule]),
            });
        } else {
            rules[ruleIndex] = newRule;
            setWorkflow?.({
                ...workflow,
                rules: rules.slice(),
            });
        }
    }

    const columnRules = filterRule?.payload.rules ?? [];

    return (
        <div>
            <div>
                <div>{t('FilterRules')}</div>
                <div className="flex flex-col gap-3 mt-2 text-sm">
                    {filterOptions.map((option) => (
                        <div className="flex items-center" key={option.value}>
                            <input
                                checked={filterMode === option.value}
                                onChange={(evt) => {
                                    if (evt.target.checked) {
                                        setRuleValue('mode', option.value);
                                    }
                                }}
                                type="radio"
                                className="w-4 h-4 mr-2"
                            />
                            <label>
                                <span className="text-gray-500">{t('FilterRuleText')}</span>
                                <span>&nbsp;</span>
                                <span className="text-gray-900">{option.text}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-[360px]">
                {columns?.map((column, index) => {
                    const columnRuleItem = columnRules.find((r) => r.workflowColumnId === column.id);

                    const andRadioId = `and-radio-${column.id}`;
                    const orRadioId = `or-radio-${column.id}`;

                    const collapseContent = !columnRuleItem
                        ? (
                            <div className="p-3">
                                <button
                                    onClick={() => {
                                        setRuleValue('rules', [createColumnRuleItem(column.id)].concat(columnRules));
                                    }}
                                    type="button"
                                    className="p-1 rounded text-indigo-600 cursor-pointer inline-flex items-center hover:bg-gray-100"
                                >
                                    <PlusSvg />
                                    <span>{t('AddCondition')}</span>
                                </button>
                            </div>
                        )
                        : (
                            <div className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className="grow">
                                        <Select
                                            onChange={(v) => {
                                                columnRuleItem.leftCondition.operator = v;
                                                setRuleValue('rules', columnRules.slice());
                                            }}
                                            value={columnRuleItem.leftCondition.operator}
                                            className="w-full"
                                            options={compareOptions}
                                        >
                                        </Select>
                                    </div>
                                    <div className="grow">
                                        <ScraperInput
                                            onChange={(v) => {
                                                columnRuleItem.leftCondition.value = v;
                                                setRuleValue('rules', columnRules.slice());
                                            }}
                                            value={columnRuleItem.leftCondition.value}
                                            className="grow"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center text-xs gap-4 my-3">
                                    <div className="inline-flex items-center gap-2">
                                        <input
                                            onChange={(evt) => {
                                                if (evt.target.checked) {
                                                    columnRuleItem.operator = WorkflowFilterRuleItemOperator.And;
                                                    setRuleValue('rules', columnRules.slice());
                                                }
                                            }}
                                            id={andRadioId}
                                            type="radio"
                                            className="w-4 h-4"
                                            checked={columnRuleItem.operator === WorkflowFilterRuleItemOperator.And}
                                        >
                                        </input>
                                        <label htmlFor={andRadioId}>{t('And')}</label>
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                        <input
                                            onChange={(evt) => {
                                                if (evt.target.checked) {
                                                    columnRuleItem.operator = WorkflowFilterRuleItemOperator.Or;
                                                    setRuleValue('rules', columnRules.slice());
                                                }
                                            }}
                                            id={orRadioId}
                                            type="radio"
                                            className="w-4 h-4"
                                            checked={columnRuleItem.operator === WorkflowFilterRuleItemOperator.Or}
                                        >
                                        </input>
                                        <label htmlFor={orRadioId}>{t('Or')}</label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="grow">
                                        <Select
                                            onChange={(v) => {
                                                columnRuleItem.rightCondition.operator = v;
                                                setRuleValue('rules', columnRules.slice());
                                            }}
                                            value={columnRuleItem.rightCondition.operator}
                                            className="w-full"
                                            options={compareOptions}
                                        >
                                        </Select>
                                    </div>
                                    <div className="grow">
                                        <ScraperInput
                                            onChange={(v) => {
                                                columnRuleItem.rightCondition.value = v;
                                                setRuleValue('rules', columnRules.slice());
                                            }}
                                            value={columnRuleItem.rightCondition.value}
                                            className="grow"
                                        />
                                    </div>
                                </div>
                                <div className="text-gray-500 text-xs mt-3">{t('FilterRuleTipText')}</div>
                            </div>
                        );

                    const leftHeader = (
                        <div className="h-[22px] px-2.5 bg-gray-100 rounded-md inline-flex items-center">
                            <span className="text-gray-500">
                                {t('Condition')}
                                :
                            </span>
                            <span className="text-gray-900">{t('Custom')}</span>
                            <button
                                onClick={() => {
                                    setRuleValue('rules', columnRules.filter((r) => r.workflowColumnId !== column.id));
                                }}
                                type="button"
                                className="ml-1 inline-flex  cursor-pointer text-xs hover:bg-gray-200"
                            >
                                <CloseConditionSvg />
                            </button>
                        </div>
                    );

                    return (
                        <div key={column.id}>
                            <Collapse title={column.name} leftHeader={!columnRuleItem ? null : leftHeader} height={!columnRuleItem ? 48 : 152} defaultExpanded>
                                {collapseContent}
                            </Collapse>
                        </div>
                    );
                })}

            </div>
        </div>
    );
};
