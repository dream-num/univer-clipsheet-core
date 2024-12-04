import { ObservableValue } from '@lib/observable-value';
import { getStorage, setAndPushStorage } from './storage-utils';

export class StorageProxy<T = unknown> {
    private _value$ = new ObservableValue<T | null>(null);

    constructor(private _storageKey: string) {
        // Load initial value
        this.get().then((value) => {
            this._value$.next(value);
        });

        this._value$.subscribe((value) => {
            setAndPushStorage(this._storageKey, value);
        });
    }

    get value() {
        return this._value$.value;
    }

    async set(value: T) {
        this._value$.next(value);
    }

    get() {
        return getStorage<T>(this._storageKey);
    }

    onChange(callback: (value: T) => void) {
        return this._value$.subscribe((v) => v && callback(v));
    }
}
