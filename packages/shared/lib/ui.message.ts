import type { SetStorageMessage } from './common.message';
import { ClipsheetMessageTypeEnum } from './common.message';
import type { IMessage } from './messages';

export enum UIStorageKeyEnum {
    Loading = 'loading',
    ScraperFormTableLoading = 'scraper_form_table_loading',
    // WorkflowDialogVisible = 'workflow_dialog_visible',
    ScraperFormReadonly = 'scraper_form_readonly',
    IframePanelRect = 'iframe_panel_rect',
    SidePanelPath = 'side_panel_path',
    RunningWorkflowIds = 'running_workflow_ids',
    RunningScrapingIds = 'running_scraping_ids',
    IframeView = 'iframe_view',
}

export enum UIMessageTypeEnum {
    PopupShowed = 'popup_showed',
    OpenTableScrapingDialog = 'open_table_scraping_dialog',
}

export enum ClientMessageTypeEnum {
    ScrapAllTables = 'scrap_all_tables',
}

export enum IframeViewTypeEnum {
    None = 'none',
    WorkflowPanel = 'workflow_panel',
    TablePanel = 'table_panel',
    PreviewTablePanel = 'preview_table_panel',
}

export type ClientScrapAllTablesMessage = IMessage<ClientMessageTypeEnum.ScrapAllTables>;
export type UIPopupShowedMessage = IMessage<UIMessageTypeEnum.PopupShowed>;
export type UIOpenTableScrapingDialogMessage = IMessage<UIMessageTypeEnum.OpenTableScrapingDialog>;
export type SetIframeViewMessage = SetStorageMessage<IframeViewTypeEnum, UIStorageKeyEnum.IframeView>;

export function sendSetIframeViewMessage(key: IframeViewTypeEnum) {
    const msg: SetIframeViewMessage = {
        type: ClipsheetMessageTypeEnum.SetStorage,
        payload: {
            key: UIStorageKeyEnum.IframeView,
            value: key,
        },
    };

    chrome.runtime.sendMessage(msg);
}
