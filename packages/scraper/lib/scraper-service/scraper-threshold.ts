import { ObservableValue } from '@univer-clipsheet-core/shared';

export function intervalUntil(seconds: number, callback: () => void) {
    let count = 0;
    const interval = setInterval(() => {
        count += 1;
        if (count >= seconds) {
            clearInterval(interval);
            callback();
        }
    }, 1000);

    return interval as unknown as number;
}
// Set the threshold of count to control the number of times the callback is called
export class CountThreshold {
    private _done$ = new ObservableValue<boolean>(false);
    private _count = 0;

    constructor(private _threshold: number) {
    }

    count() {
        this._count += 1;
        if (this._count >= this._threshold) {
            const { _done$ } = this;
            if (!_done$.value) {
                _done$.next(true);
            }
        }
    }

    onDone(callback: (done: boolean) => void) {
        this._done$.subscribe(callback);
    }
}
// Set the threshold of timeout to control the time of the callback
export class TimeoutThreshold {
    private _done$ = new ObservableValue<boolean>(false);
    private _timer: number | undefined = undefined;

    constructor(private _timeout: number) {
        this.onDone(() => {
            this._done$.dispose();
            clearInterval(this._timer);
            this._timer = undefined;
        });
    }

    start() {
        if (this._timer) {
            return;
        }
        this._timer = intervalUntil(this._timeout, () => {
            const { _done$ } = this;

            if (!_done$.value) {
                _done$.next(true);
            }
        });
    }

    onDone(callback: (done: boolean) => void) {
        this._done$.subscribe(callback);
    }
}
