import type { IAjaxInterceptMessage } from './ajax-intercept.message';
import { AJAX_INTERCEPT_MESSAGE_TYPE } from './ajax-intercept.message';

export function startAjaxIntercept(scriptSrc: string, onMessage: (message: any) => void) {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', scriptSrc);
    document.documentElement.appendChild(script);

    const listener = (event: MessageEvent) => {
        const message = event.data as IAjaxInterceptMessage;
        if (message.type === AJAX_INTERCEPT_MESSAGE_TYPE) {
            onMessage(message.response);
        }
    };

    window.addEventListener('message', listener);

    return () => [
        window.removeEventListener('message', listener),
        document.documentElement.removeChild(script),
    ];
}
