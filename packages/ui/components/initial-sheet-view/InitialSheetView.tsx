import { type IInitialSheet, Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { t } from '@univer-clipsheet-core/locale';
import type { TableProps } from '@components/table';
import { Table } from '@components/table';
import { Link } from '../link';

export interface InitialSheetViewProps {
    className?: string;
    scroll?: TableProps['scroll'];
    sheet: IInitialSheet;
    rounded?: boolean;
}

type GetFunction<T> = T extends Function ? T : never;

export const InitialSheetView = (props: InitialSheetViewProps) => {
    const { className, sheet, scroll, rounded = false } = props;

    const columnNames = useMemo(() => {
        const columnLength = Math.max(sheet.columnName.length, sheet.rows[0]?.cells.length);

        return Array.from({ length: columnLength }).map((_, columnIndex) => {
            const title = sheet.columnName[columnIndex] || `Column ${columnIndex + 1}`;
            return title;
        });
    }, [sheet]);

    const columns: TableProps['columns'] = useMemo(() => {
        const _columns: Array<NonNullable<TableProps['columns']>[number]> = columnNames.map((name, columnIndex) => {
            return {
                title: <div className="px-2  line-clamp-3 text-ellipsis">{name}</div>,
                className: 'border-r !border-[#cdd0d8]',
                width: 200,
                key: name,
                render: (value, row: IInitialSheet['rows'][number]) => {
                    const cell = row.cells[columnIndex];
                    if (!cell) {
                        return;
                    }

                    // Render cell content by different types
                    const textContent = cell.type === Sheet_Cell_Type_Enum.URL
                        ? <Link href={cell.url}>{cell.text || cell.url}</Link>
                        : cell.type === Sheet_Cell_Type_Enum.IMAGE
                            ? <img src={cell.url} alt={cell.text} className="w-20 h-20 object-contain" />
                            : cell.text;

                    return <div className="text-sm text-gray-900 px-2 py-2 font-normal">{textContent}</div>;
                },
            };
        });

        _columns.unshift({
            title: <div className="px-2">{t('Index')}</div>,
            width: 100,
            key: 'Index',
            render: (value, row, index) => <div className="text-sm px-2">{String(index + 1)}</div>,
        });

        return _columns;
    }, [columnNames]);

    const rowKey: GetFunction<TableProps['rowKey']> = useCallback((_, i) => String(i), []);
    const onHeaderRow: GetFunction<TableProps['onHeaderRow']> = useCallback((record, index) => {
        return index === 0
            ? {
                style: {
                    backgroundColor: '#F9FAFB',
                },
            }
            : {};
    }, []);

    return (
        <Table
            bordered
            rounded={rounded}
            onHeaderRow={onHeaderRow}
            scroll={scroll}
            className={clsx('!border !border-solid !border-[#cdd0d8]', {
                'rounded-md': rounded,
            }, className)}
            rowKey={rowKey}
            columns={columns}
            data={sheet.rows}
        >
        </Table>
    );
};
