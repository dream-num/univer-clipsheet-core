import type { PropsWithChildren } from 'react';
import React from 'react';
import clsx from 'clsx';

const ArrowUpSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M12.4871 10.042L8.9364 6.23137C8.44107 5.70071 7.55907 5.70071 7.06307 6.23137L3.5124 10.0414C3.26107 10.3107 3.27573 10.734 3.5444 10.986C3.81373 11.2387 4.23507 11.224 4.48707 10.954L7.99973 7.18471L11.5124 10.9547C11.6437 11.0954 11.8217 11.1667 11.9997 11.1667C12.1631 11.1667 12.3264 11.1074 12.4551 10.9867C12.7237 10.734 12.7384 10.3114 12.4871 10.042Z" fill="currentColor" />
        </svg>
    );
};

export interface ICollapseProps {
    title: string;
    defaultExpanded?: boolean;
    height?: number;
    leftHeader?: React.ReactNode;
}

export const Collapse = (props: PropsWithChildren<ICollapseProps>) => {
    const { title, height = 0, leftHeader, children, defaultExpanded = false } = props;
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    return (
        <div className="border border-solid border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-3 h-9 bg-gray-50">
                <div className="text-sm text-ellipsis whitespace-nowrap overflow-hidden">{title}</div>
                <div className="flex items-center text-xs">
                    {leftHeader}
                    <button
                        type="button"
                        className={clsx('cursor-pointer bg-transparent', {
                            'transition-all rotate-180': !expanded,
                        })}
                        onClick={() => {
                            setExpanded(!expanded);
                        }}
                    >
                        <ArrowUpSvg />
                    </button>
                </div>
            </div>
            <div className={clsx('transition-all overflow-hidden')} style={{ height: `${expanded ? height : 0}px` }}>
                {children}
            </div>
        </div>
    );
};
