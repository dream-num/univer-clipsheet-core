
import dayjs from 'dayjs';
import { workflowScheduleIntervalMinutes } from './constants';
import type { ICustomTimerRule, IWorkflow } from './workflow';
import { CustomTimerRuleMode, TimerRepeatMode } from './workflow';

export function getRecentTime(moment = dayjs(), intervalMinutes: number = workflowScheduleIntervalMinutes) {
    const nowHour = moment.get('hour');
    const roundedMinutes = (Math.floor(moment.get('minute') / intervalMinutes) + 1) * intervalMinutes;
    const meetOneHour = roundedMinutes === 60;

    return moment
        .set('hour', meetOneHour ? nowHour + 1 : nowHour)
        .set('minute', meetOneHour ? 0 : roundedMinutes)
        .set('second', 0)
        .set('millisecond', 0);
}

export const validateCustomTimerRule = (customRule: ICustomTimerRule, startDay = dayjs(), comparison = dayjs()) => {
    switch (customRule.mode) {
        case CustomTimerRuleMode.Day: {
            const days = comparison.diff(startDay, 'day');
            return days % customRule.frequency === 0;
        }
        case CustomTimerRuleMode.Week: {
            const { dates } = customRule;
            if (!dates || dates.length <= 0) {
                return false;
            }

            const weeks = comparison.diff(startDay, 'week');
            return (weeks % customRule.frequency === 0) && dates.includes(comparison.get('day'));
        }
        case CustomTimerRuleMode.Month: {
            const { dates } = customRule;
            if (!dates || dates.length <= 0) {
                return false;
            }

            const months = comparison.diff(startDay, 'month');
            return months % customRule.frequency === 0 && dates.includes(comparison.get('date'));
        }

        case CustomTimerRuleMode.Year: {
            return comparison.get('year') >= startDay.get('year')
            && comparison.get('month') === startDay.get('month')
            && comparison.get('date') === startDay.get('date');
        }
    }
};

export const validateSchedule = (schedule: IWorkflow['schedule'], comparison = dayjs()) => {
    const scheduleMinutes = schedule.minute % 60;
    const scheduleHours = (schedule.minute - scheduleMinutes) / 60;

    const startDay = dayjs(schedule.startDate)
        .set('minute', scheduleMinutes)
        .set('hour', scheduleHours)
        .set('second', 0)
        .set('millisecond', 0);

    const minutesDiff = comparison.get('minute') - startDay.get('minute');

    if (startDay.isAfter(comparison)
    || comparison.get('hour') !== startDay.get('hour')
    || Math.abs(minutesDiff) >= (workflowScheduleIntervalMinutes / 2)
    ) {
        return false;
    }

    switch (schedule.repeatMode) {
        case TimerRepeatMode.Once: {
            return comparison.get('year') === startDay.get('year')
            && comparison.get('month') === startDay.get('month')
            && comparison.get('date') === startDay.get('date');
        }
        case TimerRepeatMode.Daily: {
            return true;
        }
        case TimerRepeatMode.Weekday: {
            const weekday = comparison.day();
            return weekday !== 0 && weekday !== 6;
        }
        case TimerRepeatMode.Monthly: {
            return comparison.get('date') === startDay.get('date') && Number(comparison) > Number(startDay);
        }
        case TimerRepeatMode.Weekly: {
            return comparison.get('day') === startDay.get('day') && comparison.get('date') >= startDay.get('date');
        }
        case TimerRepeatMode.Yearly: {
            return comparison.get('year') >= startDay.get('year')
            && comparison.get('month') === startDay.get('month')
            && comparison.get('date') === startDay.get('date');
        }
        case TimerRepeatMode.Custom: {
            const customRule = schedule.customRule;
            if (!customRule) {
                return false;
            }

            if (!customRule.alwaysControl) {
                const { deadline } = customRule;
                if (deadline && comparison.isAfter(dayjs(deadline))) {
                    return false;
                }
            }

            return validateCustomTimerRule(customRule, startDay, comparison);
        }
        default: {
            return false;
        }
    }
};

