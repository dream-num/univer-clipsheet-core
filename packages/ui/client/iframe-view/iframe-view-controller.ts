import { IframeViewTypeEnum, ObservableValue } from '@univer-clipsheet-core/shared';
import { IframeWorkflowPanelShadowComponent } from './iframe-workflow-panel-shadow-component';
import { IframeTablePanelShadowComponent } from './iframe-table-panel-shadow-component';
import { IframePreviewTablePanelShadowComponent } from './iframe-preview-table-panel-shadow-component';
import type { IframeViewShadowComponent } from './iframe-view-shadow-component';

export class IframeViewController {
    private _iframeShadowComponents = new Map<IframeViewTypeEnum, IframeViewShadowComponent>();

    private _iframeSrcCollection = new Map<IframeViewTypeEnum, string>();
    private _view$ = new ObservableValue<IframeViewTypeEnum>(IframeViewTypeEnum.None);

    constructor() {
        const { _iframeShadowComponents } = this;

        _iframeShadowComponents.set(IframeViewTypeEnum.WorkflowPanel, new IframeWorkflowPanelShadowComponent());
        _iframeShadowComponents.set(IframeViewTypeEnum.TablePanel, new IframeTablePanelShadowComponent());
        _iframeShadowComponents.set(IframeViewTypeEnum.PreviewTablePanel, new IframePreviewTablePanelShadowComponent());

        this._view$.subscribe((view) => {
            if (view === IframeViewTypeEnum.None) {
                this._iframeShadowComponents.forEach((component) => component.deactivate());
                return;
            }
            this._iframeShadowComponents.forEach((component, viewType) => {
                if (viewType === view) {
                    const src = this._iframeSrcCollection.get(view) || '';
                    component.setSrc(src);
                    component.activate();
                } else {
                    component.deactivate();
                }
            });
        });
    }

    get view() {
        return this._view$.value;
    }

    get active() {
        return Array.from(this._iframeShadowComponents.values()).some((component) => component.active);
    }

    onViewChange(callback: (view: IframeViewTypeEnum) => void) {
        this._view$.subscribe(callback);
    }

    setView(view: IframeViewTypeEnum) {
        this._view$.next(view);
    }

    registerIframeView(type: IframeViewTypeEnum, src: string) {
        this._iframeSrcCollection.set(type, src);
    }
}
