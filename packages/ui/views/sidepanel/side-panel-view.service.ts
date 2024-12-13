import type { IDrillDownConfig } from '@univer-clipsheet-core/scraper';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { IDrillDownColumnFormProps, RuntimeDrillDownColumn } from './views/drill-down-column-form';

type DrillDownConfigInterceptor = (config: IDrillDownConfig) => IDrillDownConfig | Promise<IDrillDownConfig>;

export class SidePanelViewService {
    private _drillDownConfigInterceptors = new Set<DrillDownConfigInterceptor>();
    getDrillDownColumnDisabled$ = new ObservableValue<(column: RuntimeDrillDownColumn) => IDrillDownColumnFormProps['disabled']>(() => undefined);

    interceptDrillDownConfig(interceptor: DrillDownConfigInterceptor) {
        this._drillDownConfigInterceptors.add(interceptor);
    }

    async generateDrillDownConfig(config: IDrillDownConfig) {
        for (const interceptor of this._drillDownConfigInterceptors) {
            config = await interceptor(config);
        }
        return config;
    }
}
