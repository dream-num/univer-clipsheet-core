import React from 'react';
import clsx from 'clsx';
import { Sheet_Cell_Type_Enum } from '@univer-clipsheet-core/table';

export interface IColumnTypeTagProps {
    type: Sheet_Cell_Type_Enum;
    prefix?: React.ReactNode;
}

const typeClassNameMap = {
    [Sheet_Cell_Type_Enum.TEXT]: 'text-[#0E111E] bg-[#EEEFF1]',
    [Sheet_Cell_Type_Enum.IMAGE]: 'text-[#D61F69] bg-[#FCE8F3]',
    [Sheet_Cell_Type_Enum.URL]: 'text-[#2C53F1] bg-[#E9EDFF]',
    [Sheet_Cell_Type_Enum.VIDEO]: 'text-[#7E3AF2] bg-[#EDEBFE]',
};

const typeLabelMap = {
    [Sheet_Cell_Type_Enum.TEXT]: 'text',
    [Sheet_Cell_Type_Enum.IMAGE]: 'img',
    [Sheet_Cell_Type_Enum.URL]: 'url',
    [Sheet_Cell_Type_Enum.VIDEO]: 'video',
};

export const ColumnTypeTag = (props: IColumnTypeTagProps) => {
    const { type, prefix } = props;

    return (
        <div className={clsx('inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-md', (typeClassNameMap as any)[type])}>
            {prefix}
            {(typeLabelMap as any)[type]}
        </div>
    );
};
