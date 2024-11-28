
import React, { useMemo } from 'react';
import 'rc-select/assets/index.css';
//
import dayjs from 'dayjs';
import clsx from 'clsx';
import { t } from '@univer-clipsheet-core/locale';
import type { ICustomTimerRule } from '@univer-clipsheet-core/workflow';
import { CustomTimerRuleMode } from '@univer-clipsheet-core/workflow';
import { generateRandomId } from '@univer-clipsheet-core/shared';
import { Select } from '@components/select';
import { DatePicker } from '@components/date-picker';

const customTimerRuleModeOptions = [
    {
        label: t('day'),
        value: CustomTimerRuleMode.Day,

    },
    {
        label: t('week'),
        value: CustomTimerRuleMode.Week,

    },
    {
        label: t('month'),
        value: CustomTimerRuleMode.Month,

    },
    {
        label: t('year'),
        value: CustomTimerRuleMode.Year,
    },
];

const weekSelectOptions = [
    {
        label: t('Sun'),
        value: 0,
    },
    {
        label: t('Mon'),
        value: 1,
    },
    {
        label: t('Tue'),
        value: 2,
    },
    {
        label: t('Wed'),
        value: 3,
    },
    {
        label: t('Thu'),
        value: 4,
    },
    {
        label: t('Fri'),
        value: 5,
    },
    {
        label: t('Sat'),
        value: 6,
    },
];

const daySelectOptions = Array.from({ length: 30 }).map((_, i) => ({
    label: String(i + 1),
    value: i + 1,
}));

export const ButtonCheckboxes = (props: {
    options: { label: string; value: number }[];
    value?: number[];
    onChange?: (value: number[]) => void;
    itemClassName?: string;
}) => {
    const { options, value = [], itemClassName, onChange } = props;

    return (
        <ul className="flex flex-wrap gap-1">
            {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                    <li
                        onClick={() => {
                            if (checked) {
                                onChange?.(value.filter((v) => v !== option.value));
                            } else {
                                onChange?.([...value, option.value]);
                            }
                        }}
                        className={clsx('cursor-pointer text-sm py-1 border border-solid box-border rounded text-center', itemClassName, {
                            'bg-white  border-gray-400': !checked,
                            'bg-blue-500 border-blue-500 text-white': checked,
                        })}
                        key={option.value}
                    >
                        {option.label}
                    </li>
                );
            })}
        </ul>
    );
};

export function createCustomTimerRule(): ICustomTimerRule {
    return {
        frequency: 1,
        alwaysControl: true,
        mode: CustomTimerRuleMode.Day,
    };
}

export const CustomTimerForm = (props: {
    rule: ICustomTimerRule;
    onRuleChange?: (rule: ICustomTimerRule) => void;
}) => {
    const {
        rule,
        onRuleChange,
    } = props;

    const componentIds = useMemo(() => ({
        alwaysRadio: generateRandomId(),
        specifiedRadio: generateRandomId(),
    }), []);

    const frequencyOptions = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            label: t('EveryWith', { value: String(i + 1) }),
            value: i + 1,
        }));
    }, []);

    return (
        <div className="flex flex-col gap-2 p-3 border border-solid border-gray-200 rounded-lg mt-2">
            <div>
                <div className="text-sm">{t('Frequency')}</div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="grow">
                        <Select value={rule.frequency} className="w-full" options={frequencyOptions} onChange={(v) => onRuleChange?.({ ...rule, frequency: Number(v) })}>
                        </Select>
                    </div>
                    <div className="grow">
                        <Select value={rule.mode} className="w-full" options={customTimerRuleModeOptions} onChange={(v) => onRuleChange?.({ ...rule, mode: v })}>
                        </Select>
                    </div>
                </div>
            </div>
            <div>
                {rule.mode === CustomTimerRuleMode.Week && (<ButtonCheckboxes itemClassName="px-2.5" value={rule.dates} options={weekSelectOptions} onChange={(v) => onRuleChange?.({ ...rule, dates: v })} />)}
                {rule.mode === CustomTimerRuleMode.Month && (<ButtonCheckboxes itemClassName="w-8" value={rule.dates} options={daySelectOptions} onChange={(v) => onRuleChange?.({ ...rule, dates: v })} />)}
            </div>
            <div>
                <div className="text-sm mb-2">{t('DueDate')}</div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                        <input
                            id={componentIds.alwaysRadio}
                            checked={rule.alwaysControl}
                            type="radio"
                            className="w-4 h-4 mr-2"
                            onChange={(evt) => {
                                if (evt.target.checked) {
                                    onRuleChange?.({
                                        ...rule,
                                        alwaysControl: true,
                                    });
                                    // onIsAlwaysChange?.(true);
                                }
                            }}
                        />
                        <label className="cursor-pointer" htmlFor={componentIds.alwaysRadio}>{t('Always')}</label>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <input
                            id={componentIds.specifiedRadio}
                            checked={!rule.alwaysControl}
                            type="radio"
                            className="w-4 h-4 mr-2"
                            onChange={(evt) => {
                                if (evt.target.checked) {
                                    onRuleChange?.({
                                        ...rule,
                                        alwaysControl: false,
                                    });
                                }
                            }}
                        />
                        <label className="cursor-pointer" htmlFor={componentIds.specifiedRadio}>{t('SpecifiedTime')}</label>
                        <div className="w-[160px] ml-1">
                            <DatePicker
                                defaultValue={rule.deadline !== undefined ? dayjs(rule.deadline) : undefined}
                                onChange={(d: dayjs.Dayjs) => {
                                    onRuleChange?.({
                                        ...rule,
                                        deadline: d.valueOf(),
                                    });
                                }}
                                placeholder={t('SelectDate')}
                                disabled={rule.alwaysControl}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
