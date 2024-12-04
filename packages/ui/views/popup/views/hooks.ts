import { useDataSource, useStorageValue } from '@lib/hooks';
import type { IGetTableRecordsParams, ITableRecord } from '@univer-clipsheet-core/table';
import { TableDataSourceKeyEnum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import { useMemo } from 'react';

export function useTableRecords() {
    const [inProgressTask] = useStorageValue<null | ITableRecord>(TableStorageKeyEnum.InProgressTableRecord, null);

    const { state = {
        data: [],
        total: 0,
    }, getState, loading } = useDataSource<{ data: ITableRecord[]; total: number }, IGetTableRecordsParams>(TableDataSourceKeyEnum.TableRecords);

    const combinedState = useMemo(() => {
        return inProgressTask ? [inProgressTask].concat(state.data) : state.data;
    }, [state, inProgressTask]);

    return {
        state: combinedState,
        loading,
        getState,
    };
}
