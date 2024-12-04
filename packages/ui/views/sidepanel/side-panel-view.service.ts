import type { IDrillDownConfig } from '@univer-clipsheet-core/scraper';

type DrillDownConfigInterceptor = (config: IDrillDownConfig) => IDrillDownConfig | Promise<IDrillDownConfig>;

export class SidePanelViewService {
    private _drillDownConfigInterceptors = new Set<DrillDownConfigInterceptor>();

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
