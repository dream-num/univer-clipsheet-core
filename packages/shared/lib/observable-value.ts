
export class ObservableValue<T = unknown> {
    private _value: T;
    private _initialValue: T;
    private _subscribers = new Set<(value: T, previousValue?: T) => void>();
    private _disposers = new Set<() => void>();
    private _previousValue: T | undefined = undefined;

    constructor(value: T) {
        this._initialValue = value;
        this._value = value;
    }

    get value() {
        return this._value;
    }

    next(value: T) {
        if (this._value) {
            this._previousValue = this._value;
        }
        this._value = value;
        this._notify();
    }

    _notify() {
        const value = this._value;
        const previousValue = this._previousValue;
        this._subscribers.forEach((subscriber) => subscriber(value, previousValue));
    }

    subscribe(subscriber: (value: T, previousValue?: T) => void) {
        this._subscribers.add(subscriber);

        return () => this._subscribers.delete(subscriber);
    }

    dispose() {
        this._value = this._initialValue;
        this._disposers.forEach((disposer) => disposer());
        this._disposers.clear();
    }
}
