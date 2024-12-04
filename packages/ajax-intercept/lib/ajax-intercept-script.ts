import type { IAjaxInterceptMessage } from './ajax-intercept.message';
import { AJAX_INTERCEPT_MESSAGE_TYPE } from './ajax-intercept.message';

function _interceptRequest(onResponse: (response: any) => void) {
    const XHR = XMLHttpRequest;
    const _fetch = fetch;

    const onReadyStateChange = async function (this: XMLHttpRequest) {
        if (this.readyState === 4) {
            onResponse(this.response);
        }
    };
    // @ts-expect-error
    const innerXHR: typeof XMLHttpRequest = function () {
        const xhr = new XHR();
        xhr.addEventListener('readystatechange', onReadyStateChange.bind(xhr), false);
        return xhr;
    };
    innerXHR.prototype = XHR.prototype;
    Object.entries(XHR).forEach(([key, val]) => {
         // @ts-ignore
        innerXHR[key] = val;
    });

    const innerFetch: typeof _fetch = async (resource, initOptions) => {
        const getOriginalResponse = () => _fetch(resource, initOptions);
        const fetchedResponse = getOriginalResponse();

        fetchedResponse.then((response) => {
            if (response instanceof Response) {
                try {
                    response.clone()
                        .json()
                        .then((res) => onResponse(res))
                        .catch(() => {
                            // Do nothing
                        });
                } catch (err) {}
            }
        });
        return fetchedResponse;
    };
    window.XMLHttpRequest = innerXHR;
    window.fetch = innerFetch;
}

function serializeToJSON(response: unknown) {
    try {
        return JSON.parse(JSON.stringify(response));
    } catch {
        return null;
    }
}

export function interceptRequest() {
    _interceptRequest((res) => {
        const msg: IAjaxInterceptMessage = {
            type: AJAX_INTERCEPT_MESSAGE_TYPE,
            response: serializeToJSON(res),
        };

        postMessage(msg);
    });
}

