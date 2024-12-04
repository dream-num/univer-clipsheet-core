import '@views/popup/Popup.css';
import clsx from 'clsx';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';

export function TableRecordItem(props: {
    title: React.ReactNode;
    titleIcon?: React.ReactNode;
    icon: React.ReactNode;
    footer: React.ReactNode;
    borderContainerClass?: clsx.ClassValue;

}) {
    const {
        /** Hide the next task item top border */
        borderContainerClass,
        title,
        titleIcon,
        icon,
        footer,
    } = props;

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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
