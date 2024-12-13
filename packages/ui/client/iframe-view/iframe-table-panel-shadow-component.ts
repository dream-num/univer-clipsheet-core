import { ObservableValue } from '@univer-clipsheet-core/shared';
import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { ShadowComponent } from '../shadow-component';
import { TablePanelContainer } from './components/TablePanelContainer';
// @ts-expect-error
import htmlContent from './templates/iframe-table-panel.template.html';
import type { IframeViewShadowComponent } from './iframe-view-shadow-component';

export class IframeTablePanelShadowComponent extends ShadowComponent implements IframeViewShadowComponent {
    protected override _template = htmlContent;
    private _renderRoot: Root | null = null;
    private _iframeSrc$ = new ObservableValue<string>('');

    constructor() {
        super();
    }

    setSrc(src: string) {
        this._iframeSrc$.next(src);
    }

    public override activate() {
        if (this.active) {
            return;
        }

        super.activate();
        this._mount();
    }

    private _mount() {
        const panel = this._shadowRoot?.querySelector('.cs-root');

        if (panel) {
            this._renderRoot = createRoot(panel);
            this._renderRoot.render(React.createElement(TablePanelContainer, {
                iframeSrc$: this._iframeSrc$,
            }));
        }
    }

    private _unmount() {
        this._renderRoot?.unmount();
        this._renderRoot = null;
    }

    public override deactivate(): void {
        this._unmount();
        super.deactivate();
    }
}
