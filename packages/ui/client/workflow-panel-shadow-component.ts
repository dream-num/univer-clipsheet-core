import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import React from 'react';
// @ts-expect-error
import htmlContent from '@client/templates/workflow-dialog-template.html';
import { WorkflowDialog } from '@client/components/WorkflowDialog';
import { ShadowComponent } from './shadow-component';

export class WorkflowPanelShadowComponent extends ShadowComponent {
    protected override _template = htmlContent;
    private _renderRoot: Root | null = null;
    private _workflowPanelSrc: string = '';

    constructor() {
        super();
    }

    setWorkflowPanelSrc(src: string) {
        this._workflowPanelSrc = src;
    }

    public override activate() {
        super.activate();
        this._mount();
    }

    private _mount() {
        const panel = this._shadowRoot?.querySelector('.cs-root');
        if (panel) {
            this._renderRoot = createRoot(panel);
            this._renderRoot.render(React.createElement(WorkflowDialog, {
                workflowPanelSrc: this._workflowPanelSrc,
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
