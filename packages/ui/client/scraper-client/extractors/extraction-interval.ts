import { calculateRandomInterval } from '@univer-clipsheet-core/scraper';
import { ObservableValue } from '@univer-clipsheet-core/shared';

export abstract class ExtractionInterval {
    running$ = new ObservableValue(false);

    minInterval$: ObservableValue<number | undefined>;
    maxInterval$: ObservableValue<number | undefined>;
    intervalSeconds$: ObservableValue<number> = new ObservableValue(0);

    private _timeout: number | undefined = undefined;
    private _interval: number | undefined = undefined;

    constructor(option?: {
        minInterval?: number;
        maxInterval?: number;
    }) {
        const { minInterval = 4, maxInterval = 8 } = option || {};
        this.minInterval$ = new ObservableValue(minInterval);
        this.maxInterval$ = new ObservableValue(maxInterval);
    }

    protected startInterval(callback: () => void, immediate = true) {
        const {
            minInterval$,
            maxInterval$,
            running$,
            intervalSeconds$,
        } = this;

        if (this.running$.value) {
            this.stopInterval();
        }

        running$.next(true);

        const run = () => {
            const delay = calculateRandomInterval(minInterval$.value!, maxInterval$.value!);
            this._timeout = setTimeout(() => {
                callback();
                run();
            }, delay) as any;
        };
        immediate && callback();
        run();

        intervalSeconds$.next(0);
        this._interval = setInterval(() => {
            intervalSeconds$.next(intervalSeconds$.value + 1);
        }, 1000) as any;

        return this.stopInterval.bind(this);
    }

    protected stopInterval() {
        this.running$.next(false);
        clearTimeout(this._timeout);
        clearInterval(this._interval);
        this._interval = undefined;
        this._timeout = undefined;
    }

    dispose() {
        this.stopInterval();
        this.minInterval$.dispose();
        this.maxInterval$.dispose();
    }
}
