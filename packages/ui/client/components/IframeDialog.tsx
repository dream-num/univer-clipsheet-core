import { useObservableValue, useStorageValue } from '@lib/hooks';
import type { ObservableValue } from '@univer-clipsheet-core/shared';
import { UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import React, { useEffect } from 'react';

interface Rect {
    width: number;
    height: number;
}

function roundToEven(n: number) {
    return Math.ceil(n / 2) * 2;
}

export interface IframeDialogProps {
    iframeSrc$: ObservableValue<string>;
}

export const IframeDialog = (props: IframeDialogProps) => {
    const { iframeSrc$ } = props;
    const [iframeSrc] = useObservableValue(iframeSrc$);
    const [rect] = useStorageValue<Rect>(UIStorageKeyEnum.IframePanelRect, {
        width: 0,
        height: 0,
    });

    useEffect(() => {
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = oldOverflow;
        };
    }, []);

    const rectH = roundToEven(rect.height);
    const rectW = roundToEven(rect.width);
    console.log('IframeDialog', rectH, rectW, iframeSrc);
    return (
        <div style={{ height: `${rectH}px`, width: `${rectW}px` }}>
            <iframe className="iframe" src={iframeSrc} />
        </div>
    );
};
