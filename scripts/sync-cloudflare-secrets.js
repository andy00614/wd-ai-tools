#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");

const DEV_VARS_FILE = ".dev.vars";

const parseDevVars = () => {
    if (!existsSync(DEV_VARS_FILE)) {
        throw new Error(
            `Missing ${DEV_VARS_FILE}. Run cp .dev.vars.example .dev.vars to create it.`,
        );
    }

    const records = {};
    const content = readFileSync(DEV_VARS_FILE, "utf-8");

    for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (!match) continue;

        const [, key, value] = match;
        records[key.trim()] = value.trim();
    }

    return records;
};

const ensureWrangler = () => {
    const result = spawnSync("npx", ["wrangler", "--version"], {
        stdio: ["ignore", "ignore", "pipe"],
    });

    if (result.error || result.status !== 0) {
        const message =
            result.stderr?.toString().trim() || "Wrangler CLI not available";
        throw new Error(`${message}. Install it with npm install -g wrangler.`);
    }
};

const syncSecret = (key, value) => {
    const result = spawnSync("npx", ["wrangler", "secret", "put", key], {
        input: `${value}`,
        stdio: ["pipe", "inherit", "inherit"],
        encoding: "utf-8",
    });

    if (result.error || result.status !== 0) {
        throw new Error(`Failed to sync ${key}`);
    }
};

const main = () => {
    console.log("🔐 Syncing Cloudflare secrets...");
    ensureWrangler();
    const secrets = parseDevVars();

    const secretKeys = Object.keys(secrets);
    if (secretKeys.length === 0) {
        throw new Error(
            `No secrets found in ${DEV_VARS_FILE}. Please add environment variables.`,
        );
    }

    console.log(`Found ${secretKeys.length} secret(s) to sync:\n`);

    for (const key of secretKeys) {
        process.stdout.write(`→ ${key}... `);
        syncSecret(key, secrets[key]);
        console.log("✓");
    }

    console.log(`\n✅ Synced ${secretKeys.length} Cloudflare secret(s)`);
};

try {
    main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${message}`);
    process.exit(1);
}
