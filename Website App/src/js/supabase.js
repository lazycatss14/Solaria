const {
    createClient
} = require("@supabase/supabase-js");

const {
    app,
    safeStorage
} = require("electron");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SUPABASE_URL =
    "https://rprqpkcmyuwvqkzfiqbi.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_kTzqdJhND_1X2nmE1_lszQ_1NO5-6vf";

const storageDirectory = () =>
    path.join(
        app.getPath("userData"),
        "SolariaAuth"
    );

function getStoragePath(key) {
    const hash = crypto
        .createHash("sha256")
        .update(String(key))
        .digest("hex");

    return path.join(
        storageDirectory(),
        hash + ".encrypted"
    );
}

// Wait until Electron has finished starting before
// checking Windows secure storage.
async function requireEncryption() {

    await app.whenReady();

    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error(
            "Windows secure session encryption is unavailable."
        );
    }
}

const encryptedStorage = {

    async getItem(key) {

        await requireEncryption();

        const file = getStoragePath(key);

        try {

            const encrypted =
                await fs.promises.readFile(file);

            return safeStorage.decryptString(encrypted);

        } catch (error) {

            if (error.code === "ENOENT") {
                return null;
            }

            throw error;
        }
    },

    async setItem(key, value) {

        await requireEncryption();

        const directory = storageDirectory();

        await fs.promises.mkdir(
            directory,
            { recursive: true }
        );

        const file = getStoragePath(key);

        const encrypted =
            safeStorage.encryptString(
                String(value)
            );

        const temporaryFile =
            file + "." +
            process.pid + "." +
            crypto.randomBytes(6).toString("hex") +
            ".tmp";

        try {

            await fs.promises.writeFile(
                temporaryFile,
                encrypted,
                { mode: 0o600 }
            );

            await fs.promises.rename(
                temporaryFile,
                file
            );

        } catch (error) {

            try {
                await fs.promises.unlink(temporaryFile);
            } catch (_) {}

            throw error;
        }
    },

    async removeItem(key) {

        await app.whenReady();

        const file = getStoragePath(key);

        try {

            await fs.promises.unlink(file);

        } catch (error) {

            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }
};

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            flowType: "pkce",
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            storage: encryptedStorage,
            storageKey: "solaria-auth-session"
        }
    }
);

module.exports = supabase;