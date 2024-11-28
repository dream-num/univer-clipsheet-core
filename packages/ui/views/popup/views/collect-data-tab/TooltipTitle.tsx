import type { FC } from 'react';
import React from 'react';
import Tooltip from 'rc-tooltip';
import clsx from 'clsx';

export const TooltipTitle: FC<{
    href?: string;
    title: string;
    className?: string;
    onClick?: () => void;
}> = (props) => {
    const { title, href, className, onClick } = props;

    const textClassName = clsx('text-[#0F172A] inline-block text-ellipsis text-nowrap no-underline overflow-hidden hover:underline cursor-pointer', className);

    return (
        <Tooltip mouseEnterDelay={0.3} placement="top" showArrow={false} overlay={<div className="max-w-[320px]">{title}</div>} trigger="hover" overlayClassName="pointer-events-none">
            {href
                ? <a href={href} className={textClassName} onClick={onClick}>{title}</a>
                : <span className={textClassName} onClick={onClick}>{title}</span>}
        </Tooltip>
    );
};
