import { execSync } from 'node:child_process';

const IMAGE = "libretranslate/libretranslate:v1.3.12";
const CONTAINER = "pureplant_libretranslate";
const PORT = 5000;

/** Start container */
export function startLibreTranslate() {
    console.log("[autoTranslate] Starting LibreTranslate container…");

    execSync(`docker pull ${IMAGE}`, { stdio: "inherit" });
    

    execSync(
        `docker run -d -p ${PORT}:5000 --name ${CONTAINER} ${IMAGE}`,
        { stdio: "inherit" }
    );
}

/** Stop container */
export function stopLibreTranslate() {
    console.log("[autoTranslate] Stopping LibreTranslate container…");
    try {
        execSync(`docker rm -f ${CONTAINER}`, { stdio: "inherit" });
    } catch {}
}

/**
 * Wait until the /languages endpoint returns a valid non-empty JSON array.
 * No timeouts. If LT must download models: let it.
 */
export async function waitUntilReady() {
    console.log("[autoTranslate] Waiting for /languages to respond…");

    while (true) {
        try {
            const res = await fetch(`http://localhost:${PORT}/languages`);

            if (res.ok) {
                const text = await res.text();
                if (text.trim().startsWith("[")) {
                    console.log("Languages response:", text);
                    console.log("[autoTranslate] LibreTranslate is ready.");
                    return;
                }
            }
        } catch (err) {
            // silent retry
        }

        await new Promise(r => setTimeout(r, 1000));
    }
}

/** Actual translation */
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
    const res = await fetch(`http://localhost:${PORT}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            q: text,
            source: "en",
            target: locale,
            format: "text",
            api_key: null
        })
    });

    if (!res.ok) {
        throw new Error(`Translation FAILED: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.translatedText;
}
