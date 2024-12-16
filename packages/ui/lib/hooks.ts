import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { GetDataSourceMessage, GetStorageMessage, ObservableValue, PushDataSourceMessage, PushStorageMessage, SetStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, debounce, generateRandomId, getActiveTab, isFunction, UIStorageKeyEnum } from '@univer-clipsheet-core/shared';

export function useObservableValue<T>(observable: ObservableValue<T>): [T, (value: T) => void];
export function useObservableValue<T>(observable?: ObservableValue<T>): [T | undefined, (value: T) => void];
export function useObservableValue<T>(observable?: ObservableValue<T>): [T | undefined, (value: T) => void] {
    const [value, innerSetValue] = useState<T | undefined>(observable
        ? isFunction(observable.value) ? () => observable.value : observable.value
        : undefined);

    useEffect(() => {
        if (!observable) {
            return;
        }

        const unsubscribe = observable.subscribe((newValue) => innerSetValue(isFunction(newValue) ? () => newValue : newValue));

        return () => {
            unsubscribe();
        };
    }, [observable]);

    const setValue = useCallback((value: T) => {
        observable?.next(value);
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
            const { payload, type } = message;

            if (type === ClipsheetMessageTypeEnum.PushStorage
                && payload.key === key
                && payload.value !== undefined
            ) {
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

export function useImmediateDataSource<V = unknown>(key: string, payloadInit?: Record<string, any>) {
    const ctx = useDataSource<V>(key);

    useEffect(() => {
        ctx.getState(payloadInit);
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

export function useRectResizeEffect(ref: React.RefObject<HTMLElement>, callback: (rect: DOMRect) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        let resizeObserver: ResizeObserver;

        if (ref.current) {
            callbackRef.current(ref.current.getBoundingClientRect());
            resizeObserver = new ResizeObserver(() => {
                if (ref.current) {
                    callbackRef.current(ref.current.getBoundingClientRect());
                }
            });
            resizeObserver.observe(ref.current);
        }

        return () => {
            resizeObserver?.disconnect();
        };
    }, [ref.current]);
}

export function useSyncIframeRectEffect(ref: React.RefObject<HTMLElement>) {
    const [rect, setRect] = useStorageValue(UIStorageKeyEnum.IframePanelRect, {
        width: 0,
        height: 0,
    });

    const rectRef = useRef(rect);
    rectRef.current = rect;

    useRectResizeEffect(ref, (newRect) => {
        const { width: oldWidth, height: oldHeight } = rectRef.current;
        const { width: newWidth, height: newHeight } = newRect;
        if (oldWidth === newWidth && oldHeight === newHeight) {
            return;
        }

        setRect(newRect);
    });
}

export function usePromise<T>(promise: Promise<T> | (() => Promise<T>), deps: React.DependencyList = []): T | undefined {
    const [state, setState] = useState<T>();

    useEffect(() => {
        const promiseValue = typeof promise === 'function' ? promise() : promise;

        promiseValue.then((newValue) => setState(newValue));
    }, deps);

    return state;
}

export function useActiveTab() {
    const [tab, setTab] = useState<chrome.tabs.Tab | undefined>(undefined);
    useEffect(() => {
        getActiveTab().then((activeTab) => {
            setTab(activeTab);
        });

        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            if (tab.active) {
                setTab(tab);
            }
        };

        chrome.tabs.onUpdated.addListener(listener);

        return () => {
            chrome.tabs.onUpdated.removeListener(listener);
        };
    }, []);

    return tab;
}
