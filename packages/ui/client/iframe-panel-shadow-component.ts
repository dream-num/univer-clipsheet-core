import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import React from 'react';
// @ts-expect-error
import htmlContent from '@client/templates/iframe-dialog-template.html';
import { IframeDialog } from '@client/components/IframeDialog';
import { IframeDialogKeyEnum, ObservableValue } from '@univer-clipsheet-core/shared';
import { ShadowComponent } from './shadow-component';

export class IframePanelShadowComponent extends ShadowComponent {
    protected override _template = htmlContent;
    private _renderRoot: Root | null = null;
    private _srcKey$ = new ObservableValue<IframeDialogKeyEnum>(IframeDialogKeyEnum.None);
    private _iframeSrcCollection = new Map<IframeDialogKeyEnum, string>();
    private _iframeSrc$ = new ObservableValue<string>('');

    constructor() {
        super();

        this._srcKey$.subscribe((key) => {
            this._iframeSrc$.next(this._iframeSrcCollection.get(key) || '');
        });
    }

    setSrcKey(key: IframeDialogKeyEnum) {
        this._srcKey$.next(key);
    }

    addIframeSrc(key: IframeDialogKeyEnum, src: string) {
        this._iframeSrcCollection.set(key, src);
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
            this._renderRoot.render(React.createElement(IframeDialog, {
                iframeSrc$: this._iframeSrc$,
            }));
        }
    }

    private _unmount() {
        this._renderRoot?.unmount();
        this._renderRoot = null;
    }

    public override deactivate(): void {
        super.deactivate();
        this._unmount();
    }
}
