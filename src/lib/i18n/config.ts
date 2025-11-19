import i18nConfig from '../../config/i18n.json';

export type LocaleCode = (typeof i18nConfig.locales)[number];

export const locales: LocaleCode[] = i18nConfig.locales;
export const defaultLocale: LocaleCode = i18nConfig.defaultLocale;

export function isLocale(value: string | undefined): value is LocaleCode {
    return Boolean(value && locales.includes(value as LocaleCode));
}