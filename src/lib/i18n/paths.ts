import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { defaultLocale, isLocale, locales, type LocaleCode } from './config';
import type { AstroGlobal } from 'astro';

export function localizedPath(locale: LocaleCode, pathname = '/'): string {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}/${locale}${normalizedPath}`.replace(/\/+/g, '/');
}

export function localizedSiteUrl(Astro: AstroGlobal, locale: LocaleCode, pathname = '/') {
    const href = localizedPath(locale, pathname);
    return new URL(href, Astro.site).toString();
}

export function resolveLocaleFromParams(params: Record<string, string | undefined>): LocaleCode {
    const requested = params.lang;
    return isLocale(requested) ? requested : defaultLocale;
}

export function getLocaleStaticPaths() {
    return locales.map((locale) => ({ params: { lang: locale } }));
}

export const contentRoot = fileURLToPath(new URL('../../../content/', import.meta.url));
export const generatedContentRoot = path.join(process.cwd(), '.generated', 'content');

export function ensureGeneratedLocaleDir(locale: LocaleCode) {
    const dir = path.join(generatedContentRoot, locale);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}