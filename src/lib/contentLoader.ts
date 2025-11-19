import fs from 'node:fs';
import path from 'node:path';
import { contentRoot, generatedContentRoot } from './i18n/paths';
import { defaultLocale, type LocaleCode } from './i18n/config';

function readJsonFile(filePath: string) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}

function tryLoadLocaleFile(locale: LocaleCode, relativePath: string) {
    const generatedPath = path.join(generatedContentRoot, locale, relativePath);
    
    console.log("Trying to load " + generatedPath);
    
    if (fs.existsSync(generatedPath)) {
        return readJsonFile(generatedPath);
    }

    const localizedPath = path.join(contentRoot, locale, relativePath);

    console.log("Trying to load localized " + generatedPath);
    
    if (fs.existsSync(localizedPath)) {
        return readJsonFile(localizedPath);
    }

    return undefined;
}

export function loadContent<T = unknown>(locale: LocaleCode, filename: string): T {
    const normalizedFilename = filename.replace(/^\//, '');
    const fallbackPath = path.join(contentRoot, normalizedFilename);

    if (locale !== defaultLocale) {
        const localized = tryLoadLocaleFile(locale, normalizedFilename);
        if (localized) {
            return localized as T;
        }
    }
    
    console.log("Using fallback: " + fallbackPath);

    return readJsonFile(fallbackPath) as T;
}