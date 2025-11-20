import i18nConfig from '../../config/i18n.json';

export type LocaleCode = string;

export const locales = i18nConfig.locales as string[];
export const defaultLocale = i18nConfig.defaultLocale as string;

export function isLocale(value: string | undefined): value is LocaleCode {
    return typeof value === "string" && locales.includes(value);
}