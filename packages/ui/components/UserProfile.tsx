import type { FC } from 'react';
import React from 'react';
import { t } from '@univer-clipsheet-core/locale';
import { type IPopupMenu, PopupMenus } from './PopupMenus';
import { Tooltip } from './tooltip';
import './tailwind.css';

export interface IUserProfileProps {
    user: {
        avatar: string;
        name: string;
        anonymous: boolean;
    };
    menus: IPopupMenu[];
    onLogInClick?: () => void;
    onMenuClick?: (menu: IPopupMenu) => void;

}

export const UserProfile: FC<IUserProfileProps> = (props) => {
    const { user, menus, onLogInClick, onMenuClick } = props;

    if (user.anonymous === false) {
        const userPopup = (
            <div className="p-2 text-[#1E222B]">
                <div className="flex items-center px-3 py-2">
                    <div className="h-10 w-10 ">
                        {user.avatar && (
                            <img src={user.avatar} className="w-full h-full rounded-full" />
                        )}
                    </div>
                    <div className={`
              ml-2 max-w-[144px] overflow-hidden text-ellipsis whitespace-nowrap text-base
            `}
                    >
                        {user.name}
                    </div>
                </div>

                <div className="mx-3 my-2 h-[1px] bg-[#e5e5e5]"></div>
                <PopupMenus menus={menus} onMenuClick={onMenuClick} />
            </div>
        );

        return (
            <div className="inline-flex items-center cursor-pointer">
                <Tooltip
                    showArrow={false}
                    overlayClassName="white-tooltip !text-[#1E222B] user-tooltip"
                    placement="bottomRight"
                    overlay={userPopup}
                >
                    <img className="h-8  w-8 flex-none rounded-full bg-gray-50  cursor-pointer" src={user.avatar} alt="" />
                </Tooltip>
            </div>
        );
    }

    return (
        <button onClick={onLogInClick} className="text-sm rounded-[32px] font-medium px-4 h-[32px] text-center border border-[#E6E8EB] bg-white hover:bg-[rgba(30,34,43,0.06)] active:bg-[rgba(30,34,43,0.09)]">
            {t('LogIn')}
        </button>
    );
};
