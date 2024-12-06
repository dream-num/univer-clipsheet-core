import type { DropdownMenuItem } from '@components/DropdownMenu';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { ITableRecord } from '@univer-clipsheet-core/table';

export class PopupViewService<T> {
    private _onTableRecordClick$ = new ObservableValue<ITableRecord | null>(null);
    private _tableRecordMoreMenuClick$ = new ObservableValue<[menu: string, record: ITableRecord] | null>(null);

    tableRecordMoreMenuRender$ = new ObservableValue<(record: ITableRecord) => DropdownMenuItem[]>(() => []);

    triggerTableRecordClick(record: ITableRecord) {
        this._onTableRecordClick$.next(record);
    }

    triggerTableMoreMenuClick(menu: string, record: ITableRecord) {
        this._tableRecordMoreMenuClick$.next([menu, record]);
    }

    onTableRecordClick(callback: (record: ITableRecord) => void) {
        return this._onTableRecordClick$.subscribe((v) => v && callback(v));
    }

    onTableMoreMenuClick(callback: (menu: string, record: ITableRecord) => void) {
        return this._tableRecordMoreMenuClick$.subscribe((args) => args && callback(...args));
    }
}
