import clsx from 'clsx';
import type { FC } from 'react';
import React from 'react';
import './tailwind.css';

const separateLineKey = 'separate-line' as const;

export const separateLineMenu: IPopupMenu = {
    key: separateLineKey,
    text: <hr className="my-1 border-t border-[#E3E5EA]" />,
};

export interface IPopupMenu {
    text: React.ReactNode | string;
    key: string;
    disabled?: boolean;
    className?: string;
}

export interface PopupMenusProps {
    className?: string;
    style?: React.CSSProperties;
    menus: Array<IPopupMenu>;
    onMenuClick?: (menu: IPopupMenu, index: number) => void;
    onMenuHover?: (menu: IPopupMenu, index: number) => void;
}

export const PopupMenus: FC<PopupMenusProps> = (props) => {
    const { menus, style, className, onMenuClick, onMenuHover } = props;

    return (
        <ul style={style} className={className}>
            {menus.map((menu, index) => {
                if (menu.key === separateLineKey) {
                    return <li key={index}>{menu.text}</li>;
                } else {
                    return (
                        <li
                            key={menu.key}
                            className={clsx('rounded-md text-gray-900 text-sm px-3 flex items-center h-8 cursor-pointer hover:bg-gray-100', menu.className)}
                            onMouseEnter={menu.disabled ? undefined : () => onMenuHover?.(menu, index)}
                            onClick={(evt) => {
                                evt.stopPropagation();
                                if (!menu.disabled) {
                                    onMenuClick?.(menu, index);
                                }
                            }}
                        >
                            {menu.text}
                        </li>
                    );
                }
            })}
        </ul>
    );
};

