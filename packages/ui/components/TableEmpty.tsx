import React from 'react';
import clsx from 'clsx';
import { TableEmptySvg } from './icons';

export interface ITableEmptyProps {
    className?: string;
    size?: number;
    text: string;
}

export const TableEmpty = (props: ITableEmptyProps) => {
    const { className, size = 120, text } = props;

    return (
        <div className={clsx('w-full h-full flex flex-col items-center justify-center', className)}>
            <TableEmptySvg style={{ width: `${size}px`, height: `${size}px` }} />
            <div className="mt-1">
                <span className=" text-gray-500">{text}</span>
            </div>
        </div>
    );
};
