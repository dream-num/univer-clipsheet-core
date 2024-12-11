import { useObservableValue, useStorageValue } from '@lib/hooks';
import type { ObservableValue } from '@univer-clipsheet-core/shared';
import { UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import React, { useEffect, useRef } from 'react';
import { IframeContainer } from './IframeContainer';

interface Rect {
    width: number;
    height: number;
}

function roundToEven(n: number) {
    return Math.ceil(n / 2) * 2;
}

export interface IframeContainerProps {
    iframeSrc$: ObservableValue<string>;
}

export const WorkflowPanelContainer = (props: IframeContainerProps) => {
    const { iframeSrc$ } = props;

    const [rect] = useStorageValue<Rect>(UIStorageKeyEnum.IframePanelRect, {
        width: 0,
        height: 0,
    });
    const containerRef = useRef<HTMLDivElement>(null);

    const roundedWidth = roundToEven(rect.width);
    const roundedHeight = roundToEven(rect.height);

    return <IframeContainer ref={containerRef} iframeSrc$={iframeSrc$} style={{ width: `${roundedWidth}px`, height: `${roundedHeight}px` }} />;
};
