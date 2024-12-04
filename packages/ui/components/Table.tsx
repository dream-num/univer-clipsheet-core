import { clsx } from 'clsx';
import type { TableProps as RCTableProps } from 'rc-table';
import RCTable from 'rc-table';
import React, { useMemo } from 'react';
import './tailwind.css';

const columnClassName = 'border-b border-[#EEEFF1] text-left text-[#5F6574] font-semibold font-xs';

export type { TableProps } from 'rc-table';

export const Table = (props: Omit<RCTableProps, 'scroll'>) => {
    const { columns: _columns, rowClassName, ...restProps } = props;

    const columns = useMemo(() => {
        return _columns?.map((column) => {
            column.className = clsx(column.className, columnClassName);
            column.title = <div className="py-4">{column.title}</div>;
            return column;
        });
    }, [_columns]);

    return (
        <RCTable {...restProps} scroll={{ y: 300 }} columns={columns} rowClassName={clsx(rowClassName, 'border-0 hover:bg-[rgba(46,106,248,0.06)]')} />
    );
};

