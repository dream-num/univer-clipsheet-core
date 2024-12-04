import type { Injector } from '@wendellhu/redi';
import { useEffect } from 'react';
import { ElementInspectService } from '../element-inspect';

export function useElementInspect(injector: Injector, callback: (element: HTMLElement) => void, deps: React.DependencyList = []) {
    useEffect(() => {
        const dispose = injector.get(ElementInspectService).shadowComponent.onInspectElement(callback);

        return () => {
            dispose();
        };
    }, [injector, ...deps]);
}
