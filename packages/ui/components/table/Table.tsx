import { clsx } from 'clsx';
import type { TableProps as RCTableProps } from 'rc-table';
import RCTable from 'rc-table';
import React, { useMemo } from 'react';
import 'rc-table/assets/index.css';
import '../tailwind.css';
import './index.css';

const columnClassName = '!border-b !border-gray-200 !text-left !text-[#5F6574] font-semibold font-xs';

export type { TableProps } from 'rc-table';

export const Table = (props: RCTableProps) => {
    const { columns: _columns, className, ...restProps } = props;

    const columns = useMemo(() => {
        return _columns?.map((column) => {
            column.className = clsx(columnClassName, column.className);
            column.title = <div className="py-4">{column.title}</div>;

            return column;
        });
    }, [_columns]);

    return (
        <RCTable {...restProps} className={clsx('clipsheet-table', className)} columns={columns} />
    );
};

