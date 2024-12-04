import React from 'react';
import RCTooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import './index.css';
import clsx from 'clsx';

type InferProps<T> = T extends React.ForwardRefExoticComponent<infer P> ? P : never;

export interface ITooltipProps extends InferProps<typeof RCTooltip> {
    white?: boolean;
}

export const Tooltip = (props: ITooltipProps) => {
    const { white, overlayClassName, ...restProps } = props;
    return (
        <RCTooltip
            {...restProps}
            overlayClassName={clsx(overlayClassName, {
                'white-tooltip': white,
            })}
        />
    );
};
