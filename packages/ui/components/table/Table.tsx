import { clsx } from 'clsx';
import type { TableProps as RCTableProps } from 'rc-table';
import RCTable from 'rc-table';
import React, { useMemo } from 'react';
import 'rc-table/assets/index.css';
import '../tailwind.css';
import './index.css';

const columnClassName = '!border-b !border-gray-200 !text-left !text-[#5F6574] font-semibold font-xs';

export interface TableProps extends RCTableProps {
    rounded?: boolean;
    bordered?: boolean;
}

// export type { TableProps } from 'rc-table';

export const Table = (props: TableProps) => {
    const { columns: _columns, bordered = false, rounded = false, className, ...restProps } = props;

    const columns = useMemo(() => {
        return _columns?.map((column) => {
            column.className = clsx(columnClassName, column.className);
            column.title = <div className="py-4">{column.title}</div>;

            return column;
        });
    }, [_columns]);

    return (
        <RCTable
            {...restProps}
            className={clsx('clipsheet-table', {
                'clipsheet-table-rounded': rounded,
                'clipsheet-table-bordered': bordered,
            }, className)}
            columns={columns}
        />
    );
};

