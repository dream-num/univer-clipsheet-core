import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import React from 'react';
// @ts-expect-error
import htmlContent from '@views/client/templates/workflow-dialog-template.html';
import { WorkflowDialog } from '@views/client/components/WorkflowDialog';
import { ShadowComponent } from './shadow-component';

export class WorkflowPanelController extends ShadowComponent {
    private _active = false;
    protected override _template = htmlContent;
    private _renderRoot: Root | null = null;

    constructor() {
        super();
    }

    get active() {
        return this._active;
    }

    public override activate() {
        this._active = true;
        super.activate();
        this._mount();
    }

    private _mount() {
        const panel = this._shadowRoot?.querySelector('.cs-root');
        if (panel) {
            this._renderRoot = createRoot(panel);
            this._renderRoot.render(React.createElement(WorkflowDialog));
        }
    }

    private _unmount() {
        this._renderRoot?.unmount();
        this._renderRoot = null;
    }

    public override deactivate(): void {
        this._active = false;
        super.deactivate();
        this._unmount();
    }
}
