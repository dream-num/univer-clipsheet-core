import { useStorageValue } from '@lib/hooks';
import { UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import { useEffect } from 'react';

interface Rect {
    width: number;
    height: number;
}

function roundToEven(n: number) {
    return Math.ceil(n / 2) * 2;
}

export const WorkflowDialog = () => {
    const [rect] = useStorageValue<Rect>(UIStorageKeyEnum.WorkflowPanelRect, {
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

    return (
        <div style={{ height: `${rectH}px`, width: `${rectW}px` }}>
            <iframe className="iframe" src={chrome.runtime.getURL('/workflow-panel/index.html')} />
        </div>
    );
};
