import { locale as zhCN } from './locales/ZH-CN';
import { locale as enUS } from './locales/EN-US';

export function isZhCN() {
    return chrome.i18n.getUILanguage() === 'zh-CN';
}

export function createTranslator<K extends string = string>(i18mMap: Record<K, string>) {
    return (key: K, params?: Record<string, string>) => {
        const text = i18mMap[key];
        if (params) {
            return Object.keys(params).reduce((acc, prop) => {
                return acc.replace(`{${prop}}`, params[prop]);
            }, text);
        }

        return text;
    };
}

export const t = createTranslator(isZhCN() ? zhCN : enUS);
export type Translator = typeof t;
