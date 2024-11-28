// import type { IScraper } from '@univer-clipsheet-core/shared';
// import { AutoExtractionMode, closePopup, Message, MsgType, StorageKeys } from '@univer-clipsheet-core/shared';
// import { clsx } from 'clsx';
// import type { TableProps } from 'rc-table';
// import RCTable from 'rc-table';
// import React, { useCallback, useContext, useMemo } from 'react';
// import { Table } from '@src/components/Table';
// import type { DropdownMenuItem } from '@univer-clipsheet-core/shared-client';
// import { DropdownMenu, MoreButton, separateLineMenu } from '@univer-clipsheet-core/shared-client';
import { FeatureButton, RunButton } from '@components/buttons';
// import { PopupContext } from '@src/context';
import { openWorkflowDialog } from './helper';

export const WorkflowFooter = () => {
    // const { t } = useContext(PopupContext);

    return <FeatureButton className="w-full" onClick={() => openWorkflowDialog()}>{t('WorkflowEmptyAction')}</FeatureButton>;
};
