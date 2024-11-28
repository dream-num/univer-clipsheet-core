import Tooltip from 'rc-tooltip';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IPopupMenu } from './PopupMenus';
import { PopupMenus } from './PopupMenus';
import './index.css';
import 'rc-tooltip/assets/bootstrap.css';

export interface IDropdownMenuProps {
    width?: number;
    visible?: boolean;
    disabled?: boolean;
    placement?: 'top' | 'bottom';
    onVisibleChange?: (visible: boolean) => void;
    onChange?: (value: string) => void;
    onMouseLeave?: () => void;
    onOptionHover?: (option: IPopupMenu) => void;
    menus: Array<IPopupMenu>;
}

export type DropdownMenuItem = IDropdownMenuProps['menus'][number];

export const DropdownMenu: FC<PropsWithChildren<IDropdownMenuProps>> = (props) => {
    const {
        placement = 'bottom',
        children,
        menus,
        width,
        visible: _visible,
        onVisibleChange: _onVisibleChange,
        onMouseLeave,
        onOptionHover,
        onChange,
        disabled = false } = props;

    const [visible, setVisible] = useState(_visible);
    const visibleRef = useRef(visible);
    visibleRef.current = visible;

    const onVisibleChange = useCallback((visible: boolean) => {
        setVisible(visible);
        _onVisibleChange?.(visible);
    }, [_onVisibleChange]);

    const onOutsideClick = useCallback(() => {
        onVisibleChange(false);
    }, [onVisibleChange]);

    const menusContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (visibleRef.current !== _visible) {
            setVisible(_visible);
        }
    }, [_visible]);

    useEffect(() => {
        const menuContainer = menusContainerRef.current;
        const clickListener = (evt: MouseEvent) => {
            if (!evt.target || visibleRef.current === false) {
                return;
            }
            if (menuContainer && !menuContainer.contains(evt.target as Node)) {
                onOutsideClick?.();
            }
        };

        window.addEventListener('click', clickListener);

        return () => {
            window.removeEventListener('click', clickListener);
        };
    }, [onOutsideClick]);

    return (
        <Tooltip
            align={{
                autoArrow: true,
                offset: [0, placement === 'bottom' ? -6 : 6],
            }}
            overlayClassName="white-tooltip"
            overlayInnerStyle={{ padding: 0 }}
            showArrow={false}
            placement={placement}
            trigger="click"
            overlay={(
                <div ref={menusContainerRef} onMouseLeave={onMouseLeave}>
                    <PopupMenus
                        onMenuHover={(_, index) => {
                            onOptionHover?.(menus[index]);
                        }}
                        onMenuClick={(menu) => {
                            onChange?.(menu.key);
                            onVisibleChange(false);
                        }}
                        className="py-1 px-2 max-h-[300px] overflow-y-auto"
                        style={{ width: width ? `${width}px` : undefined }}
                        menus={menus}
                    />
                </div>
            )}
            visible={disabled ? false : visible}
            onVisibleChange={onVisibleChange}
        >
            {/** @ts-ignore */}
            {children}
        </Tooltip>
    );
};
