import React from 'react';
import clsx from 'clsx';

export interface ColumnListItem<T> {
    header: React.ReactNode;
    columnClassName?: string;
    render: (data: T, index: number) => React.ReactNode;
}

export interface IColumnListProps<DataItem = unknown> {
    className?: string;
    columns: ColumnListItem<DataItem>[];
    rowClassName?: string;
    headerClassName?: string;
    data: DataItem[];
    border?: boolean;
    listClassName?: string;
}

export function ColumnList<T = unknown>(props: IColumnListProps<T>) {
    const {
        className,
        columns,
        data,
        rowClassName,
        headerClassName,
        listClassName,
        border,
    } = props;

    return (
        <div className={clsx('rounded border border-solid border-gray-300', className)}>
            <div className={clsx('flex items-center bg-gray-50', headerClassName, {
                'border-solid border-b border-gray-300': border,
            })}
            >
                {columns.map((column, index) => {
                    return (
                        <div
                            key={index}
                            className={clsx({
                                'border-solid border-l border-gray-300': index !== 0 && border,
                            }, column.columnClassName)}
                        >
                            {column.header}
                        </div>
                    );
                })}
            </div>
            <ul
                className={listClassName}
            >
                {data.map((item, index) => {
                    return (
                        <li
                            key={index}
                            className={clsx('flex items-center', rowClassName, {
                                'border-b border-gray-300 border-solid': index !== columns.length - 1 && border,
                            })}
                        >
                            {columns.map((column, subIndex) => {
                                return <div key={`${index}-${subIndex}`} className={column.columnClassName}>{column.render(item, index)}</div>;
                            })}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
