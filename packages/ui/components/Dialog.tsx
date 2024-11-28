import type { DialogProps as RCDialogProps } from 'rc-dialog';
import RCDialog from 'rc-dialog';
import 'rc-dialog/assets/index.css';
import React from 'react';

export interface IDialogProps extends RCDialogProps {
}

export const Dialog = (props: IDialogProps) => {
    return <RCDialog {...props}></RCDialog>;
};
