import { ObservableValue } from '@univer-clipsheet-core/shared';

export class ThresholdCounter {
    private _count = 0;
    private _isThresholdReached$ = new ObservableValue<boolean>(false);
    constructor(private readonly _threshold: number) {
        this.onThreshold(() => this.reset());
    }

    count() {
        this._count += 1;
        if (this._count >= this._threshold) {
            this._isThresholdReached$.next(true);
        }
    }

    onThreshold(callback: () => void) {
        this._isThresholdReached$.subscribe((isThresholdReached) => isThresholdReached && callback());
    }

    reset() {
        this._count = 0;
        this._isThresholdReached$.next(false);
    }

    dispose() {
        this._count = 0;
        this._isThresholdReached$.dispose();
    }
}
