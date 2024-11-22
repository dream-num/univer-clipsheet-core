import { ElementInspectController } from '@lib/element-inspect';
import type { Injector } from '@wendellhu/redi';
import { useDependency } from '@wendellhu/redi/esm/react-bindings/reactHooks';
import { useEffect } from 'react';

export function useElementInspect(callback: (element: HTMLElement) => void, deps: React.DependencyList = []) {
    const controller = useDependency(ElementInspectController);
    useEffect(() => {
        const dispose = controller.onInspectElement(callback);

        return () => {
            dispose();
        };
    }, [controller, ...deps]);
}
