import { type AstroIntegration } from "astro";
import fs from "node:fs";
import path from "node:path";

import { contentRoot, ensureGeneratedLocaleDir } from "../src/lib/i18n/paths";
import { defaultLocale, locales } from "../src/lib/i18n/config";

import {TranslationServiceClient} from '@google-cloud/translate';


//Google translate api stuff
const translationClient = new TranslationServiceClient();

const projectId = 'translatetest-478703';
const location = 'global';
//

export async function translateObject(input: any, locale: string): Promise<any> {
    if (typeof input === "string") {
        return translateText(input, locale);
    }
    if (Array.isArray(input)) {
        return Promise.all(input.map((x) => translateObject(x, locale)));
    }
    if (input && typeof input === "object") {
        const out: any = {};
        for (const k of Object.keys(input)) {
            out[k] = await translateObject(input[k], locale);
        }
        return out;
    }
    return input;
}

async function translateText(text: string, locale: string): Promise<string> {
    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain', // mime types: text/plain, text/html
        sourceLanguageCode: 'en',
        targetLanguageCode: locale,
    };
    const [response] = await translationClient.translateText(request);
    if(response.translations.length < 0) {
        //This probably won't happen I will address it if it ever does
        throw new Error("No translations in response for text: " + text + " to " + locale);
    }
    return response.translations[0].translatedText;
}



function walkJson(dir: string, base = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.flatMap((e) => {
        const full = path.join(dir, e.name);
        const rel = path.join(base, e.name);

        if (e.isDirectory()) return walkJson(full, rel);
        if (rel.endsWith(".json")) return [rel];
        return [];
    });
}

function readJson(file: string) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function writeJson(file: string, data: unknown) {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2));
}

async function doTranslate(logger: any) {
    const files = walkJson(contentRoot);
    const targets = locales.filter((l) => l !== defaultLocale);

    if (targets.length === 0) {
        logger.info("[autoTranslate] No translation locales.");
        return;
    }

    for (const locale of targets) {
        logger.info(`[autoTranslate] Translating locale ${locale}…`);

        const localeDir = ensureGeneratedLocaleDir(locale);

        for (const rel of files) {
            const src = path.join(contentRoot, rel);
            const dest = path.join(localeDir, rel);

            const json = readJson(src);
            const translated = await translateObject(json, locale);

            await writeJson(dest, translated);
        }

        logger.info(`[autoTranslate] Done ${locale}.`);
    }
}

export default function autoTranslate(): AstroIntegration {
    return {
        name: "auto-translate-content",
        hooks: {
            "astro:build:start": async ({ logger }) => {
                await doTranslate(logger);
            },
            "astro:server:start": async ({ logger }) => {
                await doTranslate(logger);
            }
        }
    };
}
