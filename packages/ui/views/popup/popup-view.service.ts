import type { DropdownMenuItem } from '@components/DropdownMenu';
import { ObservableValue } from '@univer-clipsheet-core/shared';
import type { ITableRecord } from '@univer-clipsheet-core/table';

export class PopupViewService<T> {
    private _onTableRecordClick$ = new ObservableValue<ITableRecord<T> | null>(null);
    private _tableRecordMoreMenuClick$ = new ObservableValue<[menu: string, record: ITableRecord<T>] | null>(null);

    tableRecordMoreMenuRender$ = new ObservableValue<(record: ITableRecord<T>) => DropdownMenuItem[]>(() => []);

    triggerTableRecordClick(record: ITableRecord<T>) {
        this._onTableRecordClick$.next(record);
    }

    triggerTableMoreMenuClick(menu: string, record: ITableRecord<T>) {
        this._tableRecordMoreMenuClick$.next([menu, record]);
    }

    onTableRecordClick(callback: (record: ITableRecord<T>) => void) {
        return this._onTableRecordClick$.subscribe((v) => v && callback(v));
    }

    onTableMoreMenuClick(callback: (menu: string, record: ITableRecord<T>) => void) {
        return this._tableRecordMoreMenuClick$.subscribe((args) => args && callback(...args));
    }
}
