import { InitialSheetView } from '@components/initial-sheet-view';
import { useStorageValue } from '@lib/hooks';
import type { IScraper, IScraperColumn } from '@univer-clipsheet-core/scraper';
import { ScraperStorageKeyEnum } from '@univer-clipsheet-core/scraper';
import type { IInitialSheet, IPreviewSheetStorageValue, ISheet_Row } from '@univer-clipsheet-core/table';
import { PreviewSheetFromEnum, TableStorageKeyEnum } from '@univer-clipsheet-core/table';
import { useMemo } from 'react';

export interface PreviewTablePanelProps {

}

export const PreviewTablePanel = (props: PreviewTablePanelProps) => {
    const [previewSheet] = useStorageValue<IPreviewSheetStorageValue | null>(TableStorageKeyEnum.PreviewSheet, null);
    const [currentScraper] = useStorageValue<IScraper | null>(ScraperStorageKeyEnum.CurrentScraper, null);

    const scroll = useMemo(() => ({ x: 400, y: window.innerHeight - 50 }), []);
    const sheetValue: IInitialSheet | null = useMemo(() => {
        if (!previewSheet) {
            return null;
        }

        if (previewSheet.from === PreviewSheetFromEnum.TableScrapingDialog) {
            return previewSheet.sheet;
        }

        const scraperColumns = currentScraper?.columns;
        if (!scraperColumns) {
            return previewSheet.sheet;
        }

        previewSheet.sheet.columnName = scraperColumns.map((column) => column.name);
        const columnMap = new Map<number, IScraperColumn>();

        scraperColumns.forEach((column) => {
            columnMap.set(column.index, column);
        });

        const rows = previewSheet.sheet.rows.map((r) => {
            return {
                ...r,
                cells: r.cells
                    .map((cell, index) => {
                        const column = columnMap.get(index);
                        if (!column) {
                            return null;
                        }

                        return {
                            ...cell,
                            type: column?.type ?? cell.type,
                        };
                    })
                    .filter(Boolean) as ISheet_Row['cells'],
            };
        });

        return { ...previewSheet.sheet, rows };
    }, [previewSheet, currentScraper]);

    return (
        <div className="w-full h-full bg-white">
            {sheetValue && <InitialSheetView scroll={scroll} sheet={sheetValue} />}
        </div>
    );
};
