import React from 'react';
import 'rc-select/assets/index.css';

import dayjs from 'dayjs';
import { t } from '@univer-clipsheet-core/locale';
import type { IWorkflowSchedule } from '@univer-clipsheet-core/workflow';
import { minuteOptions, TimerRepeatMode } from '@univer-clipsheet-core/workflow';
import { useWorkflowPanelContext } from '@views/workflow-panel/context';
import { ScraperInput } from '@components/ScraperInput';
import { ScraperTextarea } from '@components/ScraperTextarea';
import { DatePicker } from '@components/date-picker';
import { Select } from '@components/select';
import { useObservableValue } from '@lib/hooks';
import { createCustomTimerRule, CustomTimerForm } from './CustomTimerForm';
import { EmailNotificationTriggerControl } from './EmailNotificationTriggerControl';

export const repeatModeOptions = [
    {
        label: t('Once'),
        value: TimerRepeatMode.Once,
    },
    {
        label: t('RepeatDaily'),
        value: TimerRepeatMode.Daily,
    },
    {
        label: t('RepeatWeekly'),
        value: TimerRepeatMode.Weekly,
    },
    {
        label: t('RepeatMonthly'),
        value: TimerRepeatMode.Monthly,
    },
    {
        label: t('RepeatYearly'),
        value: TimerRepeatMode.Yearly,
    },
    {
        label: t('RepeatWeekday'),
        value: TimerRepeatMode.Weekday,
    },
    {
        label: t('Custom'),
        value: TimerRepeatMode.Custom,
    },
];

export const TimerForm = () => {
    const { workflow: _workflow, service, setWorkflow } = useWorkflowPanelContext();

    const [emailNotificationTriggerControl] = useObservableValue(service?.emailNotificationTriggerControl$);

    const workflow = _workflow!;

    const schedule = workflow?.schedule;

    const customTimerRule = workflow.schedule.customRule ?? createCustomTimerRule();

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="text-sm text-gray-900 mb-2">{t('WorkflowName')}</div>
                <div>
                    <ScraperInput
                        value={workflow?.name}
                        onChange={(v) => setWorkflow?.({
                            ...workflow,
                            name: v,
                        })}
                        closable
                    />
                </div>
            </div>
            <div>
                <div className="text-sm text-gray-900 mb-2">{t('Description')}</div>
                <div>
                    <ScraperTextarea
                        value={workflow?.description}
                        onChange={(v) => setWorkflow?.({
                            ...workflow,
                            description: v,
                        })}
                        closable
                    />
                </div>
            </div>
            <div>
                <div className="text-sm">{t('SetTriggerTime')}</div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-1/3">
                        <DatePicker
                            defaultValue={schedule !== undefined ? dayjs(schedule.startDate) : undefined}
                            onChange={(d: dayjs.Dayjs) => {
                                setWorkflow?.({
                                    ...workflow,
                                    schedule: {
                                        ...workflow?.schedule as IWorkflowSchedule,
                                        startDate: Number(d),
                                    },
                                });
                            }}
                            className="w-full"
                            placeholder={t('SelectDate')}
                        />
                    </div>
                    <div className="w-1/3">
                        <Select
                            value={schedule?.minute}
                            onChange={(v) => {
                                setWorkflow?.({
                                    ...workflow,
                                    schedule: {
                                        ...workflow?.schedule as IWorkflowSchedule,
                                        minute: v,
                                    },
                                });
                            }}
                            className="!w-full"
                            options={minuteOptions}
                        >
                        </Select>
                    </div>
                    <div className="w-1/3">
                        <Select
                            value={schedule?.repeatMode}
                            onChange={(v) => {
                                const newWorkflow = {
                                    ...workflow,
                                    schedule: {
                                        ...workflow?.schedule as IWorkflowSchedule,
                                        repeatMode: v,
                                    },
                                };
                                newWorkflow.schedule.customRule = v === TimerRepeatMode.Custom
                                    ? createCustomTimerRule()
                                    : undefined;

                                setWorkflow?.(newWorkflow);
                            }}
                            className="!w-full"
                            options={repeatModeOptions}
                        >
                        </Select>
                    </div>
                </div>
                {schedule.repeatMode === TimerRepeatMode.Custom && (
                    <CustomTimerForm
                        rule={customTimerRule}
                        onRuleChange={(r) => setWorkflow?.({
                            ...workflow,
                            schedule: {
                                ...workflow.schedule,
                                customRule: r,
                            },
                        })}
                    />
                )}
            </div>
            {emailNotificationTriggerControl && <EmailNotificationTriggerControl workflow={workflow} onChange={setWorkflow} />}
        </div>
    );
};
