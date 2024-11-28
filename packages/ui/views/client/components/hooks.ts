import type { Injector } from '@wendellhu/redi';
import { useDependency } from '@wendellhu/redi/react-bindings';
import { useEffect } from 'react';
import { ElementInspectService } from '../element-inspect';

export function useElementInspect(injector: Injector, callback: (element: HTMLElement) => void, deps: React.DependencyList = []) {
    useEffect(() => {
        const dispose = injector.get(ElementInspectService).controller.onInspectElement(callback);

        return () => {
            dispose();
        };
    }, [injector, ...deps]);
}
