
export const workflowScheduleIntervalMinutes = 5;

export const minuteOptions = (() => {
    const steps = 60 / workflowScheduleIntervalMinutes;
    return Array.from({ length: 24 * steps }, (_, i) => {
        const totalMinutes = i * workflowScheduleIntervalMinutes;
        const minutes = totalMinutes % 60;
        const hours = totalMinutes / 60 | 0;

        return {
            value: i * workflowScheduleIntervalMinutes,
            label: `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`,
        };
    });
})();
