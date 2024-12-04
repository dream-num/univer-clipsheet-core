
export const AJAX_INTERCEPT_MESSAGE_TYPE = 'CLIPSHEET_AJAX_INTERCEPT_MESSAGE';

export interface IAjaxInterceptMessage {
    type: typeof AJAX_INTERCEPT_MESSAGE_TYPE;
    response: any;
}

