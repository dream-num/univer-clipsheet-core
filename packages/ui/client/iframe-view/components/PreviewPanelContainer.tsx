import type { ObservableValue } from '@univer-clipsheet-core/shared';
import React from 'react';
import { IframeContainer } from './IframeContainer';

export interface IframeContainerProps {
    iframeSrc$: ObservableValue<string>;
}

export const PreviewPanelContainer = (props: IframeContainerProps) => {
    return <IframeContainer scrollable className="iframe-container" iframeSrc$={props.iframeSrc$} />;
};
