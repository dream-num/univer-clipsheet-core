import type { IWorkflowFilterRuleItem } from './workflow';
import { WorkflowFilterColumnConditionOperator, WorkflowFilterRuleItemOperator } from './workflow';

function isEmpty(a: string) {
    return a === '' || a === undefined;
}

function isContains(a: string, b: string) {
    return a.includes(b);
}

function isNumberEqual(a: string, b: string) {
    return Number(a) === Number(b);
}

function isNumberGreaterThan(a: string, b: string) {
    return Number(a) > Number(b);
}

function isNumberLessThan(a: string, b: string) {
    return Number(a) < Number(b);
}

export type Validator = (base: string, comparison: string) => boolean;

// Support for multiple operators to validate cell text
export class FilterRuleValidator {
    private _operatorValidators: Map<WorkflowFilterColumnConditionOperator, Validator> = new Map();

    constructor() {
        this.registerOperator(WorkflowFilterColumnConditionOperator.None, () => true);
        this.registerOperator(WorkflowFilterColumnConditionOperator.IsEmpty, isEmpty);
        this.registerOperator(WorkflowFilterColumnConditionOperator.IsNotEmpty, (value) => !isEmpty(value));
        this.registerOperator(WorkflowFilterColumnConditionOperator.TextContains, isContains);
        this.registerOperator(WorkflowFilterColumnConditionOperator.TextDoesNotContain, (base: string, comparison: string) => !isContains(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.TextStartsWith, (base: string, comparison: string) => base.startsWith(comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.TextEndsWith, (base: string, comparison: string) => base.endsWith(comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.TextEquals, (base: string, comparison: string) => base === comparison);
        this.registerOperator(WorkflowFilterColumnConditionOperator.GreaterThan, (base: string, comparison: string) => isNumberGreaterThan(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.GreaterThanOrEqual, (base: string, comparison: string) => isNumberGreaterThan(base, comparison) || isNumberEqual(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.LessThan, (base: string, comparison: string) => isNumberLessThan(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.LessThanOrEqual, (base: string, comparison: string) => isNumberLessThan(base, comparison) || isNumberEqual(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.NumberEqual, (base: string, comparison: string) => isNumberEqual(base, comparison));
        this.registerOperator(WorkflowFilterColumnConditionOperator.NumberNotEqual, (base: string, comparison: string) => !isNumberEqual(base, comparison));
    }

    registerOperator(operator: WorkflowFilterColumnConditionOperator, validator: Validator) {
        this._operatorValidators.set(operator, validator);
    }

    validate(text: string, rule: IWorkflowFilterRuleItem) {
        const { leftCondition, rightCondition } = rule;
        const leftOperator = this._operatorValidators.get(leftCondition.operator)!;
        const rightOperator = this._operatorValidators.get(rightCondition.operator)!;

        const leftValidation = leftOperator(text, leftCondition.value as string);
        const rightValidation = rightOperator(text, rightCondition.value as string);

        return rule.operator === WorkflowFilterRuleItemOperator.And
            ? leftValidation && rightValidation
            : leftValidation || rightValidation;
    }
}
