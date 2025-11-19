import { type AstroIntegration } from "astro";
import fs from "node:fs";
import path from "node:path";

import { contentRoot, ensureGeneratedLocaleDir } from "../src/lib/i18n/paths";
import { defaultLocale, locales } from "../src/lib/i18n/config";

import {
    startLibreTranslate,
    stopLibreTranslate,
    waitUntilReady,
    translateObject
} from "../src/lib/i18n/libretranslate";

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

    startLibreTranslate();
    await waitUntilReady();

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

    stopLibreTranslate();
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
