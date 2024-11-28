import { useDataSource, useStorageValue } from '@lib/hooks';
import type { PushStorageMessage } from '@univer-clipsheet-core/shared';
import { ClipsheetMessageTypeEnum, defaultPageSize } from '@univer-clipsheet-core/shared';
import type { ITableRecord, RequestTableRecordsMessage } from '@univer-clipsheet-core/table';
import { TableDataSourceKeyEnum, TableMessageTypeEnum, TableStorageKeysEnum } from '@univer-clipsheet-core/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useTableRecords() {
    const [inProgressTask] = useStorageValue<null | ITableRecord>(TableStorageKeysEnum.InProgressTableRecord, null);

    const { state = [], loading } = useDataSource<ITableRecord[]>(TableDataSourceKeyEnum.TableRecords);
    // const [state, setState] = useState<ITableRecord[]>([]);
    // const [loading, setLoading] = useState(true);

    const getState = useCallback((payload: RequestTableRecordsMessage['payload'] = null) => {
        const msg: RequestTableRecordsMessage = {
            type: TableMessageTypeEnum.RequestTableRecords,
            payload,
        };
        chrome.runtime.sendMessage(msg);
    }, []);

    // useEffect(() => {
        // setLoading(true);
        // getState({
        //     page: 1,
        //     pageSize: defaultPageSize,
        // });

        // const listener = (msg: PushStorageMessage) => {
        //     if (msg.type !== ClipsheetMessageTypeEnum.PushStorage && msg.payload.key !== TableStorageKeysEnum.TableRecords) {
        //         return;
        //     }
        //     setState(msg.payload.value as ITableRecord[]);
        //     setLoading(false);
        // };

        // chrome.runtime.onMessage.addListener(listener);

        // return () => {
        //     chrome.runtime.onMessage.removeListener(listener);
        // };
    // }, []);

    const combinedState = useMemo(() => {
        return inProgressTask ? [inProgressTask].concat(state) : state;
    }, [state, inProgressTask]);

    return {
        state: combinedState,
        loading,
        getState,
    };
}
