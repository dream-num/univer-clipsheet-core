import { Dialog } from '@components/Dialog';
import clsx from 'clsx';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';
import { ScraperInput } from '@components/ScraperInput';
import { Select } from '@components/select';
import { t } from '@univer-clipsheet-core/locale';
import { typeOptions } from '../../../constants';

export interface IEditColumnDialogOpenOption {
    name: string;
    type: Sheet_Cell_Type_Enum;
    onConfirm: (data: {
        name: string;
        type: Sheet_Cell_Type_Enum;
    }) => void;
}

export interface IEditColumnDialogRef {
    open: (option: IEditColumnDialogOpenOption) => void;
}

export const EditColumnDialog = forwardRef<IEditColumnDialogRef>((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState(Sheet_Cell_Type_Enum.TEXT);

    const optionRef = React.useRef<IEditColumnDialogOpenOption>();
    useImperativeHandle(ref, () => ({
        open: (option) => {
            optionRef.current = option;
            setName(option.name);
            setType(option.type);
            setVisible(true);
        },
    }), []);

    return (
        <Dialog visible={visible} closable={false} classNames={{ wrapper: 'flex items-center justify-center', body: '!p-0', content: 'w-[336px]' }}>
            <div className={clsx('flex flex-col gap-2 p-3  rounded-lg')}>
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-gray-800 text-sm">{t('FieldName')}</span>
                    </div>
                    <ScraperInput
                        value={name}
                        onChange={setName}
                        closable
                    />
                </div>
                <div>
                    <div className=" mb-2 text-gray-800 text-sm">{t('Type')}</div>
                    <Select
                        className="!w-full"
                        value={type}
                        options={typeOptions}
                        onChange={setType}
                    >
                    </Select>
                </div>
            </div>
            <footer className="flex justify-end px-3 pb-4 pt-0.5">
                <div>

                    <button
                        onClick={() => {
                            setVisible(false);
                        }}
                        className="grow mr-3 px-3 py-[7px] border border-gray-200  rounded-full text-center text-gray-900"
                    >
                        {t('Cancel')}
                    </button>
                    <button
                        onClick={() => {
                            optionRef.current?.onConfirm({
                                name,
                                type,
                            });
                            setVisible(false);
                        }}
                        className="grow px-3 py-[7px] bg-[linear-gradient(90deg,#5357ED_0%,#40B9FF_104.41%)] text-white rounded-full text-center"
                    >
                        {t('Confirm')}
                    </button>
                </div>
            </footer>
        </Dialog>
    );
});
