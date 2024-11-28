import { TableRecordStatusEnum } from '@univer-clipsheet-core/table';
import React from 'react';
import clsx from 'clsx';
import { ErrorSingleSvg, LoadingSvg, SuccessSingleSvg } from '@components/icons';

export const StatusIcon: React.FC<{
    className?: string;
    status: TableRecordStatusEnum;
}> = (props) => {
    const { status, className } = props;
    if (status === TableRecordStatusEnum.InProgress) {
        return <LoadingSvg className={clsx(className, 'text-[#0B9EFB] animate-spin')} />;
    }

    return status === TableRecordStatusEnum.Success
        ? <SuccessSingleSvg className={className} />
        : <ErrorSingleSvg className={className} />;
};
