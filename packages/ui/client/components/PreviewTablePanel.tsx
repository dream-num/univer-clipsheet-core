import React, { useMemo, useRef, useState } from 'react';
import { InitialSheetView } from '@components/initial-sheet-view';
import { useRectResizeEffect, useStorageValue } from '@lib/hooks';
import { UIStorageKeyEnum } from '@univer-clipsheet-core/shared';
import type { IInitialSheet } from '@univer-clipsheet-core/table';
import { TableStorageKeyEnum } from '@univer-clipsheet-core/table';

export interface PreviewTablePanelProps {

}

export const PreviewTablePanel = (props: PreviewTablePanelProps) => {
    const [sheet] = useStorageValue<IInitialSheet | null>(TableStorageKeyEnum.PreviewSheet, null);

    const scroll = useMemo(() => ({ x: 400, y: window.innerHeight - 50 }), []);

    return (
        <div className="w-full h-full bg-white">
            {sheet && <InitialSheetView scroll={scroll} sheet={sheet} />}
        </div>
    );
};
