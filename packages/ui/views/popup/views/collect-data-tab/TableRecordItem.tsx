import type {
    ITableRecord } from '@univer-clipsheet-core/table';
import {
    TableRecordStatusEnum,
    TableRecordTypeEnum,
} from '@univer-clipsheet-core/table';
import {
    // isConversationTask,
    isZhCN,
    // StorageKeys,
    // TableRecordStatusEnum,
} from '@univer-clipsheet-core/locale';
import '@views/popup/Popup.css';
import clsx from 'clsx';
import dayjs from 'dayjs';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React, { useCallback, useContext, useState } from 'react';
// import { useStorageValue } from '@lib/hooks';
// import { PopupContext } from '@views/popup/context';
// import { StatusIcon } from './StatusIcon';
// import { CloseSvg, MessageSingleSvg, WarningSingleSvg, XLSXSvg } from '@components/icons';

// import { TooltipTitle } from './TooltipTitle';

export function TableRecordItem(props: {
    title: React.ReactNode;
    titleIcon?: React.ReactNode;
    icon: React.ReactNode;
    footer: React.ReactNode;
    // time: number;
    borderContainerClass?: clsx.ClassValue;
    // deleteTooltip?: {
    //     visible?: boolean;
    //     onConfirm?: () => void;
    //     onCancel?: () => void;
    // };
    // deletable?: boolean;
    // onDeleteClick?: () => void;
    // onMouseLeave?: React.MouseEventHandler<HTMLLIElement>;
    // onMouseEnter?: React.MouseEventHandler<HTMLLIElement>;
}) {
    // const { t, timeFormat } = useContext(PopupContext);
    // const [user] = useStorageValue<Partial<AnonymousUser>>(StorageKeys.UserInfo, {});

    const {
        /** Hide the next task item top border */
        borderContainerClass,
        // onDeleteClick,
        // deleteTooltip,
        // onMouseLeave,
        // onMouseEnter,
        // time,
        title,
        titleIcon,
        icon,
        footer,
        // deletable,
    } = props;

    // const { visible: deleteTooltipVisible, onConfirm: onDeleteConfirm, onCancel: onDeleteCancel } = deleteTooltip || {};

    // const deleteTooltipComponent = (
    //     <Tooltip
    //         visible={deleteTooltipVisible}
    //         placement="topRight"
    //         overlayClassName="!opacity-100 white-tooltip !text-[#1E222B]"
    //         overlay={(
    //             <div>
    //                 <div className="flex items-center">
    //                     <WarningSingleIcon className=" mr-1" />
    //                     <span>{t('AskDelete')}</span>
    //                 </div>
    //                 <div className="mt-[10px] text-right">
    //                     <button className="hover:bg-[rgba(30,34,43,0.06)] active:bg-[rgba(30,34,43,0.09)] mr-2 h-6 px-2 line-flex items-center rounded-3xl box-border border-solid border border-[#E5E5E5]" onClick={onDeleteCancel}>{t('Cancel')}</button>
    //                     <button
    //                         className="hover:bg-[#3A60F7] active:bg-[#143EE3] h-6 px-2 line-flex items-center rounded-3xl bg-[#274FEE] text-white"
    //                         onClick={onDeleteConfirm}
    //                     >
    //                         {t('Confirm')}
    //                     </button>
    //                 </div>
    //             </div>
    //         )}
    //         trigger="click"
    //     >
    //         <div className="w-[20px] h-[20px] text-right flex flex-col justify-between">
    //             <div className={clsx('group-hover:flex w-full h-full justify-end rounded hover:bg-[rgba(15,23,42,0.06)]', !deleteTooltipVisible && 'hidden')} onClick={onDeleteClick}>
    //                 <button className="p-1">
    //                     <CloseIcon className="cursor-pointer" />
    //                 </button>
    //             </div>
    //         </div>
    //     </Tooltip>
    // );

    // const localeTimeFormat = isZhCN() ? 'YYYY-MM-DD HH:mm' : 'MMMM D, YYYY h:mm A';

    // const taskTimeFormat = user.anonymous === false
    //     ? timeFormat(time)
    //     : t('RemainingDays', {
    //         day: String(7 - dayjs().diff(dayjs(time), 'day')),
    //     });

    return (
        <div className="group [&>div]:last:border-b-0 border-[#E8E9EE] rounded-lg">
            <div className={clsx('flex py-3 justify-between border-b-[1px] mx-4 group-hover:border-b-[transparent]', borderContainerClass)}>
                <div className="flex items-center text-left w-3/4">
                    {icon}
                    <div className="ml-2">
                        <div className="flex items-center relative font-medium text-sm text-[#0F172A] overflow-hidden">
                            {title}
                            {titleIcon}
                        </div>
                        <div className="mt-2">
                            {footer}
                            {/* <Tooltip trigger="hover" placement="top" overlay={dayjs(time).format(localeTimeFormat)} showArrow={false}>
                                <span className="ml-2 cursor-default">{taskTimeFormat}</span>
                            </Tooltip> */}
                        </div>
                    </div>
                </div>
                {/** Delete confirm tooltip, hidden in task that is in progress status  */}
                {/* {deletable && deleteTooltipComponent} */}
            </div>
        </div>
    );
}
