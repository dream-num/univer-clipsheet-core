import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetDataSourceMessage, GetStorageMessage, ObservableValue, PushDataSourceMessage, PushStorageMessage, SetStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, debounce } from '@univer-clipsheet-core/shared';

export function useObservableValue<T>(observable: ObservableValue<T>) {
    const [value, innerSetValue] = useState<T>(observable.value);

    useEffect(() => {
        innerSetValue(observable.value);

        const unsubscribe = observable.subscribe((newValue) => innerSetValue(newValue));

        return () => {
            unsubscribe();
        };
    }, [observable]);

    const setValue = useCallback((value: T) => {
        observable.next(value);
    }, [observable]);

    return [value, setValue] as const;
}

export function useStorageValue<T = unknown>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(defaultValue);

    const setStorageValue = useCallback((value: T) => {
        const msg: SetStorageMessage = {
            type: ClipsheetMessageTypeEnum.SetStorage,
            payload: {
                key,
                value,
            },
        };

        chrome.runtime.sendMessage(msg);
    }, [key]);

    useEffect(() => {
        const requestMessage: GetStorageMessage = {
            type: ClipsheetMessageTypeEnum.GetStorage,
            payload: key,
        };
        chrome.runtime.sendMessage(requestMessage);

        const listener = (message: PushStorageMessage) => {
            if (message.type === ClipsheetMessageTypeEnum.PushStorage && message.payload.key === key) {
                setValue(message.payload.value as T);
            }
        };
        chrome.runtime.onMessage.addListener(listener);

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, [key]);

    return [value, setStorageValue] as const;
}

export function useDataSource<V = unknown, P = unknown>(key: string) {
    const [state, setState] = useState<V | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const getState = useCallback((params?: P) => {
        const msg: GetDataSourceMessage<typeof key, P | null> = {
            type: ClipsheetMessageTypeEnum.GetDataSource,
            payload: {
                key,
                params: params || null,
            },
        };
        chrome.runtime.sendMessage(msg);
    }, []);

    useEffect(() => {
        setLoading(true);

        const listener = (msg: PushDataSourceMessage) => {
            if (msg.type === ClipsheetMessageTypeEnum.PushDataSource) {
                const { payload } = msg;
                if (payload.key === key && payload.value !== undefined) {
                    setState(payload.value as V);
                    setLoading(false);
                }
            }
        };

        chrome.runtime.onMessage.addListener(listener);

        return () => chrome.runtime.onMessage.removeListener(listener);
    }, [key]);

    return {
        state,
        loading,
        getState,
    } as const;
}

export function useImmediateDataSource<V = unknown>(key: string) {
    const ctx = useDataSource<V>(key);

    useEffect(() => {
        ctx.getState();
    }, []);

    return ctx;
}

export function useDebounceCallback<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const func = useMemo(() => {
        return debounce<T>(delay, ((...args) => callbackRef.current?.(...args)) as T);
    }, []);

    return func;
}

export function useThrottle<T>(value: T, ms: number = 200) {
    const [state, setState] = useState<T>(value);
    const timeout = useRef<ReturnType<typeof setTimeout>>();
    const nextValue = useRef(null) as any;
    const hasNextValue = useRef(0) as any;

    useEffect(() => {
        if (!timeout.current) {
            setState(value);
            const timeoutCallback = () => {
                if (hasNextValue.current) {
                    hasNextValue.current = false;
                    setState(nextValue.current);
                    timeout.current = setTimeout(timeoutCallback, ms);
                } else {
                    timeout.current = undefined;
                }
            };
            timeout.current = setTimeout(timeoutCallback, ms);
        } else {
            nextValue.current = value;
            hasNextValue.current = true;
        }
    }, [value]);

    useEffect(() => {
        return () => {
            timeout.current && clearTimeout(timeout.current);
        };
    }, []);

    return state;
}
