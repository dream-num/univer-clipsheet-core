import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { UnionLazyLoadElements } from '@univer-clipsheet-core/table';

export abstract class IExtractor {
    lazyLoadElements$ = new ObservableValue<UnionLazyLoadElements | null>(null);
    abstract target$: ObservableValue<HTMLElement>;

    abstract get elementRows(): number;

    get lazyLoadElements() {
        return this.lazyLoadElements$.value;
    }

    get target() {
        return this.target$.value;
    }

    sheetRows() {
        return this.lazyLoadElements$.value?.rows ?? 0;
    }

    abstract buildLazyLoadElements(): UnionLazyLoadElements;
    dispose() {
        this.lazyLoadElements$.value?.dispose();
        this.target$.dispose();
    };
}
