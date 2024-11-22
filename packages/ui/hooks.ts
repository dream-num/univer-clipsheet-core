import { useCallback, useEffect, useState } from 'react';
import type { ObservableValue } from '@univer-clipsheet-core/shared';

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
