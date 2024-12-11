import { useObservableValue } from '@lib/hooks';
import type { ObservableValue } from '@univer-clipsheet-core/shared';
import React, { useEffect } from 'react';

export interface IframeContainerProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    iframeSrc$: ObservableValue<string>;
}

export const IframeContainer = (props: IframeContainerProps) => {
    const { iframeSrc$, ...restProps } = props;
    const [iframeSrc] = useObservableValue(iframeSrc$);

    useEffect(() => {
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = oldOverflow;
        };
    }, []);

    return (
        <div {...restProps}>
            <iframe className="iframe" src={iframeSrc} />
        </div>
    );
};
