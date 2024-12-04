import type { IMessage } from './messages';

export enum UIStorageKeyEnum {
    Loading = 'loading',
    ScraperFormTableLoading = 'scraper_form_table_loading',
    WorkflowDialogVisible = 'workflow_dialog_visible',
    ScraperFormReadonly = 'scraper_form_readonly',
    WorkflowPanelRect = 'workflow_panel_rect',
    SidePanelPath = 'side_panel_path',
    RunningWorkflowIds = 'running_workflow_ids',
    RunningScrapingIds = 'running_scraping_ids',
}

export enum UIMessageTypeEnum {
    PopupShowed = 'popup_showed',
    OpenTableScrapingDialog = 'open_table_scraping_dialog',
}

export enum ClientMessageTypeEnum {
    ScrapAllTables = 'scrap_all_tables',
}

export type ClientScrapAllTablesMessage = IMessage<ClientMessageTypeEnum.ScrapAllTables>;
export type UIPopupShowedMessage = IMessage<UIMessageTypeEnum.PopupShowed>;
export type UIOpenTableScrapingDialogMessage = IMessage<UIMessageTypeEnum.OpenTableScrapingDialog>;
