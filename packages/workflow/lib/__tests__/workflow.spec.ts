import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { getRecentTime, validateCustomTimerRule, validateSchedule } from '@lib/workflow-schedule-helper';
import { CustomTimerRuleMode, TimerRepeatMode } from '@lib/workflow';

describe('Workflow timing execution', () => {
    it('Workflow schedule validate', () => {
        // Comparison minute not equal to startDate minute
        const validation0 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 20 * 60 + 10,
            repeatMode: TimerRepeatMode.Once,
        }, dayjs('2025-01-01 20:15:00'));

        expect(validation0).toBe(false);

        // Comparison lesser than startDate
        const validation1 = validateSchedule({
            startDate: Number(dayjs('2025-01-02 00:00:00')),
            minute: 20 * 60 + 10,
            repeatMode: TimerRepeatMode.Once,
        }, dayjs('2025-01-01 20:10:00'));

        expect(validation1).toBe(false);

        // Once mode: Comparison greater than startDate
        const validation2 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 20 * 60 + 10,
            repeatMode: TimerRepeatMode.Once,
        }, dayjs('2025-01-01 20:10:00'));

        expect(validation2).toBe(true);

        // Once mode: Comparison greater than startDate exceed 1 day
        const validation3 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 30,
            repeatMode: TimerRepeatMode.Once,
        }, dayjs('2025-01-02 00:30:01'));

        expect(validation3).toBe(false);

        // Daily mode: Comparison time equal to startDate time
        const validation4 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Daily,
        }, dayjs('2025-01-01 00:00:01'));

        expect(validation4).toBe(true);

        const validation5 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Daily,
        }, dayjs('2025-01-02 00:00:01'));

        expect(validation5).toBe(true);

        // Weekday mode: Comparison on a weekday
        const validation6 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')), // Wednesday
            minute: 0,
            repeatMode: TimerRepeatMode.Weekday,
        }, dayjs('2025-01-01 00:00:01'));

        expect(validation6).toBe(true);

        // Weekday mode: Comparison on a weekend
        const validation7 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')), // Wednesday
            minute: 0,
            repeatMode: TimerRepeatMode.Weekday,
        }, dayjs('2025-01-04 00:00:01')); // Saturday

        expect(validation7).toBe(false);

        // Monthly mode: Comparison on the same date
        const validation8 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Monthly,
        }, dayjs('2025-02-01 00:00:01'));

        expect(validation8).toBe(true);

        // Monthly mode: Comparison on a different date
        const validation9 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Monthly,
        }, dayjs('2025-02-02 00:00:01'));

        expect(validation9).toBe(false);

        // Weekly mode: Comparison on the same day of the week
        const validation10 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')), // Wednesday
            minute: 0,
            repeatMode: TimerRepeatMode.Weekly,
        }, dayjs('2025-01-08 00:00:01')); // Next Wednesday

        expect(validation10).toBe(true);

        // Weekly mode: Comparison on a different day of the week
        const validation11 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')), // Wednesday
            minute: 0,
            repeatMode: TimerRepeatMode.Weekly,
        }, dayjs('2025-01-09 00:00:01')); // Thursday

        expect(validation11).toBe(false);

        // Yearly mode: Comparison on the same date next year
        const validation12 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Yearly,
        }, dayjs('2026-01-01 00:00:01'));

        expect(validation12).toBe(true);

        // Yearly mode: Comparison on a different date next year
        const validation13 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 0,
            repeatMode: TimerRepeatMode.Yearly,
        }, dayjs('2026-01-02 00:00:01'));

        expect(validation13).toBe(false);

        const validation14 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:09:12')),
            minute: 0,
            repeatMode: TimerRepeatMode.Once,
        }, dayjs('2025-01-01 00:00:01'));

        expect(validation14).toBe(true);

        const validation15 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:09:12')),
            minute: 0,
            repeatMode: TimerRepeatMode.Custom,
            customRule: {
                frequency: 1,
                mode: CustomTimerRuleMode.Day,
                alwaysControl: false,
                deadline: dayjs('2025-01-02 00:00:00').valueOf(),
            },
        }, dayjs('2025-01-03 00:00:01'));

        expect(validation15).toBe(false);

        const validation16 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:09:12')),
            minute: 0,
            repeatMode: TimerRepeatMode.Custom,
            customRule: {
                frequency: 1,
                mode: CustomTimerRuleMode.Day,
                alwaysControl: false,
                deadline: dayjs('2025-01-04 00:00:00').valueOf(),
            },
        }, dayjs('2025-01-03 00:00:01'));

        expect(validation16).toBe(true);

        const validation17 = validateSchedule({
            startDate: Number(dayjs('2025-01-01 00:00:00')),
            minute: 640,
            repeatMode: TimerRepeatMode.Custom,
            customRule: {
                frequency: 1,
                mode: CustomTimerRuleMode.Day,
                alwaysControl: true,
                // deadline: dayjs('2025-01-20 11:4:00').valueOf(),
            },
        }, dayjs('2025-01-02 11:40:01'));

        expect(validation17).toBe(true);

        const validation18 = validateSchedule({
            startDate: dayjs('2025-01-01 00:00:00').valueOf(),
            minute: 20 * 60 + 35,
            repeatMode: TimerRepeatMode.Custom,
            customRule: {
                frequency: 1,
                mode: CustomTimerRuleMode.Day,
                alwaysControl: true,
                // deadline: dayjs('2025-01-02 00:00:00').valueOf(),
            },
        }, dayjs('2025-01-01 20:35:01'));

        expect(validation18).toBe(true);

        const validation19 = validateSchedule({
            startDate: dayjs('2025-01-01 00:00:00').valueOf(),
            minute: 20 * 60 + 35,
            repeatMode: TimerRepeatMode.Custom,
            customRule: {
                frequency: 1,
                mode: CustomTimerRuleMode.Day,
                alwaysControl: true,
                // deadline: dayjs('2025-01-02 00:00:00').valueOf(),
            },
        }, dayjs('2025-01-01 20:34:01'));

        expect(validation19).toBe(false);
    });

    it('Workflow get recent schedule time', () => {
        const recentTime1 = getRecentTime(dayjs('2025-01-01 00:01:00'), 30);

        expect(recentTime1.valueOf()).toBe(dayjs('2025-01-01 00:30:00').valueOf());

        const recentTime2 = getRecentTime(dayjs('2025-01-01 00:31:00'), 30);

        expect(recentTime2.valueOf()).toBe(dayjs('2025-01-01 01:00:00').valueOf());

        const recentTime3 = getRecentTime(dayjs('2025-01-01 00:31:00'), 5);

        expect(recentTime3.valueOf()).toBe(dayjs('2025-01-01 00:35:00').valueOf());
    });

    it('Workflow custom timer rule validate', () => {
        const dayValidation1 = validateCustomTimerRule({
            frequency: 1,
            mode: CustomTimerRuleMode.Day,
            alwaysControl: true,
        }, dayjs('2025-11-19 20:35:00'), dayjs('2025-11-19 20:35:30'));

        expect(dayValidation1).toBe(true);

        const dayValidation2 = validateCustomTimerRule({
            frequency: 5,
            mode: CustomTimerRuleMode.Day,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-06 00:00:01'));

        expect(dayValidation2).toBe(true);

        const dayValidation3 = validateCustomTimerRule({
            frequency: 2,
            mode: CustomTimerRuleMode.Day,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-02 00:00:01'));

        expect(dayValidation3).toBe(false);

        const weekValidation1 = validateCustomTimerRule({
            frequency: 1,
            dates: [1],
            mode: CustomTimerRuleMode.Week,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-08 00:00:01'));

        expect(weekValidation1).toBe(false);

        const weekValidation2 = validateCustomTimerRule({
            frequency: 1,
            dates: [3],
            mode: CustomTimerRuleMode.Week,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-08 00:00:01'));

        expect(weekValidation2).toBe(true);

        const weekValidation3 = validateCustomTimerRule({
            frequency: 1,
            dates: [3],
            mode: CustomTimerRuleMode.Week,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-15 00:00:01'));

        expect(weekValidation3).toBe(true);

        const weekValidation4 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 3, 5],
            mode: CustomTimerRuleMode.Week,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-08 00:00:01'));

        expect(weekValidation4).toBe(true);

        const weekValidation5 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 3, 5],
            mode: CustomTimerRuleMode.Week,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-01-10 00:00:01'));

        expect(weekValidation5).toBe(true);

        const monthValidation1 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-02-1 00:00:01'));

        expect(monthValidation1).toBe(true);

        const monthValidation2 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-02-15 00:00:01'));

        expect(monthValidation2).toBe(true);

        const monthValidation3 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-02-28 00:00:01'));

        expect(monthValidation3).toBe(false);

        const monthValidation4 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-03-01 00:00:01'));

        expect(monthValidation4).toBe(true);

        const monthValidation5 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-03-15 00:00:01'));

        expect(monthValidation5).toBe(true);

        const monthValidation6 = validateCustomTimerRule({
            frequency: 1,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-03-30 00:00:01'));

        expect(monthValidation6).toBe(true);

        const monthValidation7 = validateCustomTimerRule({
            frequency: 2,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-02-01 00:00:01'));

        expect(monthValidation7).toBe(false);

        const monthValidation8 = validateCustomTimerRule({
            frequency: 2,
            dates: [1, 15, 30],
            mode: CustomTimerRuleMode.Month,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2025-03-01 00:00:01'));

        expect(monthValidation8).toBe(true);

        const yearValidation1 = validateCustomTimerRule({
            frequency: 1,
            mode: CustomTimerRuleMode.Year,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2026-01-01 00:00:01'));

        expect(yearValidation1).toBe(true);

        const yearValidation2 = validateCustomTimerRule({
            frequency: 2,
            mode: CustomTimerRuleMode.Year,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2027-01-01 00:00:01'));

        expect(yearValidation2).toBe(true);

        const yearValidation3 = validateCustomTimerRule({
            frequency: 1,
            mode: CustomTimerRuleMode.Year,
            alwaysControl: true,
        }, dayjs('2025-01-01 00:00:00'), dayjs('2026-01-02 00:00:01'));

        expect(yearValidation3).toBe(false);
    });
});
