import { useObservableValue } from '@lib/hooks';
import type { ObservableValue } from '@univer-clipsheet-core/shared';
import React, { useEffect } from 'react';

export interface IframeContainerProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    iframeSrc$: ObservableValue<string>;
    scrollable?: boolean;
}

export const IframeContainer = (props: IframeContainerProps) => {
    const { iframeSrc$, scrollable = false, ...restProps } = props;
    const [iframeSrc] = useObservableValue(iframeSrc$);

    useEffect(() => {
        if (scrollable) {
            return;
        }

        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = oldOverflow;
        };
    }, [scrollable]);

    return (
        <div {...restProps}>
            <iframe className="iframe" src={iframeSrc} />
        </div>
    );
};
