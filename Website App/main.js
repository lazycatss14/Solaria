// ============================================================
// SOLARIA MAIN PROCESS
// ============================================================

const {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    nativeTheme,
    dialog
} = require("electron");

const path = require("path");
const fs = require("fs");
const net = require("net");

const {
    spawn
} = require("child_process");

const {
    autoUpdater
} = require("electron-updater");

const supabase =
    require("./src/js/supabase");


// ============================================================
// CONFIGURATION
// ============================================================

const PROTOCOL_NAME =
    "blockworld";

const REDIRECT_URL =
    "blockworld://auth/callback";

let mainWindow = null;

let pendingProtocolUrl = null;


// ============================================================
// SOLARIA ENGINE
// ============================================================

let solariaGameProcess =
    null;

let solariaServerProcess =
    null;

let isAppQuitting =
    false;


/*
    The Electron website lives here:

        Solaria/
        â””â”€â”€ Website App/
            â””â”€â”€ main.js

    The C++ engine lives here:

        Solaria/
        â””â”€â”€ Engine/
            â””â”€â”€ Build/
                â””â”€â”€ Debug/
                    â””â”€â”€ SolariaGame.exe

    Therefore we go one folder upward from __dirname.
*/

const SOLARIA_ENGINE_PATH =
    path.join(
        __dirname,
        "..",
        "Engine",
        "Build-Solaria",
        "Debug",
        "SolariaGame.exe"
    );


const SOLARIA_ENGINE_DIRECTORY =
    path.dirname(
        SOLARIA_ENGINE_PATH
    );

const SOLARIA_SERVER_PATH =
    path.join(
        __dirname,
        "..",
        "Engine",
        "Network",
        "Server",
        "server.js"
    );

const SOLARIA_SERVER_DIRECTORY =
    path.dirname(SOLARIA_SERVER_PATH);


// ============================================================
// SOLARIA THEME
// ============================================================

const THEME_FILE_NAME =
    "solaria-theme.json";

let solariaThemePreference =
    "system";


// ============================================================
// AUTO UPDATER
// ============================================================

let updateDownloadStarted =
    false;

let updateDownloaded =
    false;


/*
    electron-updater gets its GitHub repository information
    from the "publish" section of package.json.

    Development mode is intentionally excluded.

    This means:

        npm.cmd start

    will NOT try to update your development copy.

    A packaged Solaria installation WILL check for updates.
*/

function setupAutoUpdater() {

    if (!app.isPackaged) {

        console.log(
            "[Solaria] Auto updater disabled in development mode."
        );

        return;

    }


    console.log(
        "[Solaria] Auto updater enabled."
    );


    autoUpdater.autoDownload =
        true;

    autoUpdater.autoInstallOnAppQuit =
        true;


    autoUpdater.on(
        "checking-for-update",
        () => {

            console.log(
                "[Solaria] Checking for updates..."
            );

        }
    );


    autoUpdater.on(
        "update-available",
        (info) => {

            console.log(
                "[Solaria] Update available:",
                info.version
            );


            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "solaria-update-available",
                    {
                        version:
                            info.version
                    }
                );

            }


            if (
                updateDownloadStarted
            ) {

                return;

            }


            updateDownloadStarted =
                true;


            console.log(
                "[Solaria] Downloading update..."
            );

        }
    );


    autoUpdater.on(
        "update-not-available",
        (info) => {

            console.log(
                "[Solaria] Solaria is up to date.",
                info?.version || ""
            );


            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "solaria-update-not-available",
                    {
                        version:
                            info?.version ||
                            app.getVersion()
                    }
                );

            }

        }
    );


    autoUpdater.on(
        "download-progress",
        (progress) => {

            console.log(
                "[Solaria] Update download:",
                `${Math.round(progress.percent)}%`
            );


            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "solaria-update-progress",
                    {
                        percent:
                            progress.percent,

                        transferred:
                            progress.transferred,

                        total:
                            progress.total,

                        bytesPerSecond:
                            progress.bytesPerSecond
                    }
                );

            }

        }
    );


    autoUpdater.on(
        "update-downloaded",
        async (info) => {

            updateDownloaded =
                true;


            console.log(
                "[Solaria] Update downloaded:",
                info.version
            );


            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "solaria-update-downloaded",
                    {
                        version:
                            info.version
                    }
                );

            }


            const result =
                await dialog.showMessageBox({

                    type:
                        "info",

                    title:
                        "Solaria Update Ready",

                    message:
                        `Solaria ${info.version} is ready to install.`,

                    detail:
                        "Restart Solaria now to install the update.",

                    buttons: [
                        "Restart and Update",
                        "Later"
                    ],

                    defaultId:
                        0,

                    cancelId:
                        1

                });


            if (
                result.response ===
                0
            ) {

                console.log(
                    "[Solaria] Installing downloaded update..."
                );


                autoUpdater.quitAndInstall(
                    false,
                    true
                );

            }

        }
    );


    autoUpdater.on(
        "error",
        (error) => {

            console.error(
                "[Solaria] Auto updater error:",
                error
            );


            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "solaria-update-error",
                    {
                        message:
                            error?.message ||
                            "Unable to check for updates."
                    }
                );

            }

        }
    );


    /*
        Wait a little after startup before checking.

        This gives the application time to finish loading
        before the updater contacts GitHub.
    */

    setTimeout(
        () => {

            checkForSolariaUpdate();

        },
        10000
    );

}


// ============================================================
// CHECK FOR SOLARIA UPDATE
// ============================================================

async function checkForSolariaUpdate() {

    if (!app.isPackaged) {

        console.log(
            "[Solaria] Update check skipped because Solaria is not packaged."
        );

        return {

            success: false,

            skipped:
                true,

            message:
                "Updates are disabled in development mode."

        };

    }


    try {

        console.log(
            "[Solaria] Starting update check..."
        );


        const result =
            await autoUpdater.checkForUpdates();


        if (
            !result ||
            !result.updateInfo
        ) {

            return {

                success: true,

                updateAvailable:
                    false

            };

        }


        const currentVersion =
            app.getVersion();

        const latestVersion =
            result.updateInfo.version;


        console.log(
            "[Solaria] Current version:",
            currentVersion
        );

        console.log(
            "[Solaria] Latest version:",
            latestVersion
        );


        return {

            success: true,

            updateAvailable:
                latestVersion !== currentVersion,

            currentVersion,

            latestVersion

        };

    }

    catch (error) {

        console.error(
            "[Solaria] Update check failed:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "Unable to check for updates."

        };

    }

}


// ============================================================
// UPDATE IPC
// ============================================================

ipcMain.handle(
    "solaria-update-check",
    async () => {

        return await checkForSolariaUpdate();

    }
);


ipcMain.handle(
    "solaria-update-install",
    async () => {

        if (
            !app.isPackaged
        ) {

            return {

                success: false,

                message:
                    "Updates are disabled in development mode."

            };

        }


        if (
            !updateDownloaded
        ) {

            return {

                success: false,

                message:
                    "No downloaded update is ready."

            };

        }


        console.log(
            "[Solaria] Installing update..."
        );


        autoUpdater.quitAndInstall(
            false,
            true
        );


        return {

            success: true

        };

    }
);


// ============================================================
// THEME FILE PATH
// ============================================================

function getThemeFilePath() {

    return path.join(
        app.getPath("userData"),
        THEME_FILE_NAME
    );

}


// ============================================================
// LOAD SAVED THEME
// ============================================================

function loadSolariaTheme() {

    try {

        const filePath =
            getThemeFilePath();


        if (
            !fs.existsSync(
                filePath
            )
        ) {

            solariaThemePreference =
                "system";

            return;

        }


        const file =
            fs.readFileSync(
                filePath,
                "utf8"
            );


        const data =
            JSON.parse(
                file
            );


        if (
            data &&
            (
                data.theme === "light" ||
                data.theme === "dark" ||
                data.theme === "system"
            )
        ) {

            solariaThemePreference =
                data.theme;

        }

        else {

            solariaThemePreference =
                "system";

        }

    }

    catch (error) {

        console.error(
            "[Solaria] Could not load theme:",
            error
        );


        solariaThemePreference =
            "system";

    }

}


// ============================================================
// SAVE THEME
// ============================================================

function saveSolariaTheme(
    theme
) {

    try {

        const filePath =
            getThemeFilePath();


        fs.writeFileSync(
            filePath,

            JSON.stringify(
                {
                    theme
                },
                null,
                4
            ),

            "utf8"
        );

    }

    catch (error) {

        console.error(
            "[Solaria] Could not save theme:",
            error
        );

    }

}


// ============================================================
// GET ACTUAL THEME
// ============================================================

function getSolariaTheme() {

    if (
        solariaThemePreference ===
        "dark"
    ) {

        return "dark";

    }


    if (
        solariaThemePreference ===
        "light"
    ) {

        return "light";

    }


    return nativeTheme.shouldUseDarkColors
        ? "dark"
        : "light";

}


// ============================================================
// APPLY ELECTRON THEME
// ============================================================

function applySolariaTheme() {

    nativeTheme.themeSource =
        solariaThemePreference;


    console.log(
        "[Solaria] Theme:",
        solariaThemePreference,
        "â†’",
        getSolariaTheme()
    );

}


// ============================================================
// SEND THEME TO RENDERER
// ============================================================

function sendThemeToWindow() {

    if (
        !mainWindow ||
        mainWindow.isDestroyed()
    ) {

        return;

    }


    mainWindow.webContents.send(
        "solaria-theme-changed",

        {

            preference:
                solariaThemePreference,

            theme:
                getSolariaTheme()

        }
    );

}


// ============================================================
// LOG
// ============================================================

console.log(
    "[Solaria] Main process loaded."
);


// ============================================================
// SINGLE INSTANCE
// ============================================================

const gotLock =
    app.requestSingleInstanceLock();


if (!gotLock) {

    console.log(
        "[Solaria] Another Solaria instance is already running."
    );

    app.quit();

}

else {

    app.on(
        "second-instance",
        (
            event,
            commandLine,
            workingDirectory
        ) => {

            console.log(
                "[Solaria] Second instance detected."
            );


            const protocolUrl =
                commandLine.find(
                    argument =>
                        typeof argument === "string" &&
                        argument.startsWith(
                            `${PROTOCOL_NAME}://`
                        )
                );


            if (protocolUrl) {

                console.log(
                    "[Solaria] Protocol URL received from second instance:"
                );

                console.log(
                    protocolUrl
                );


                handleProtocolUrl(
                    protocolUrl
                );

            }


            if (mainWindow) {

                if (
                    mainWindow.isMinimized()
                ) {

                    mainWindow.restore();

                }


                mainWindow.show();

                mainWindow.focus();

            }

        }
    );

}


// ============================================================
// CREATE WINDOW
// ============================================================

function createWindow() {

    mainWindow =
        new BrowserWindow({
            fullscreen: false,

            width: 1200,

            height: 750,

            minWidth: 900,

            minHeight: 600,

            backgroundColor:
                "#fff9ed",

            webPreferences: {

                preload:
                    path.join(
                        __dirname,
                        "preload.js"
                    ),

                contextIsolation:
                    true,

                nodeIntegration:
                    false

            }

        });

    // Start as a full desktop window, not immersive fullscreen.
    mainWindow.maximize();


    mainWindow.loadFile(
        path.join(
            __dirname,
            "src",
            "index.html"
        )
    );


    mainWindow.setMenu(
        null
    );


    mainWindow.webContents.on(
        "did-finish-load",
        () => {

            sendThemeToWindow();

        }
    );


    mainWindow.on(
        "closed",
        () => {

            mainWindow =
                null;

        }
    );


    console.log(
        "[Solaria] Main window created."
    );

}


// ============================================================
// GOOGLE AUTHENTICATION
// ============================================================

async function startGoogleLogin() {

    try {

        console.log(
            "[Solaria] Starting Google login..."
        );


        const {
            data,
            error
        } =
            await supabase.auth.signInWithOAuth({

                provider:
                    "google",

                options: {

                    redirectTo:
                        REDIRECT_URL,

                    skipBrowserRedirect:
                        true

                }

            });


        if (error) {

            console.error(
                "[Solaria] Google OAuth error:",
                error.message
            );


            return {

                success: false,

                message:
                    error.message

            };

        }


        if (
            !data ||
            !data.url
        ) {

            console.error(
                "[Solaria] Google OAuth did not return a URL."
            );


            return {

                success: false,

                message:
                    "Google did not provide a login URL."

            };

        }


        console.log(
            "[Solaria] Opening Google login..."
        );


        await shell.openExternal(
            data.url
        );


        return {

            success: true

        };


    }

    catch (error) {

        console.error(
            "[Solaria] Google login exception:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "Unable to start Google login."

        };

    }

}


// ============================================================
// HANDLE GOOGLE CALLBACK
// ============================================================

async function handleProtocolUrl(
    protocolUrl
) {

    if (
        !protocolUrl ||
        typeof protocolUrl !== "string"
    ) {

        return;

    }


    console.log(
        "[Solaria] Google callback received:"
    );

    console.log(
        protocolUrl
    );


    try {

        const url =
            new URL(
                protocolUrl
            );


        if (
            url.protocol !==
            `${PROTOCOL_NAME}:`
        ) {

            console.error(
                "[Solaria] Invalid protocol."
            );

            return;

        }


        if (
            url.hostname !==
            "auth"
        ) {

            console.error(
                "[Solaria] Invalid callback hostname."
            );

            return;

        }


        const errorParam =
            url.searchParams.get(
                "error"
            );


        const errorDescription =
            url.searchParams.get(
                "error_description"
            );


        if (errorParam) {

            console.error(
                "[Solaria] Google returned an authentication error:",
                errorParam,
                errorDescription || ""
            );


            if (mainWindow) {

                mainWindow.webContents.send(
                    "google-login-error",
                    errorDescription ||
                    errorParam ||
                    "Google login failed."
                );

            }


            return;

        }


        const code =
            url.searchParams.get(
                "code"
            );


        if (!code) {

            console.error(
                "[Solaria] No authorization code was found."
            );


            if (mainWindow) {

                mainWindow.webContents.send(
                    "google-login-error",
                    "Google did not return an authorization code."
                );

            }


            return;

        }


        console.log(
            "[Solaria] Exchanging Google authorization code..."
        );


        const {
            data,
            error
        } =
            await supabase.auth.exchangeCodeForSession(
                code
            );


        if (error) {

            console.error(
                "[Solaria] Failed to exchange Google code:",
                error.message
            );


            if (mainWindow) {

                mainWindow.webContents.send(
                    "google-login-error",
                    error.message
                );

            }


            return;

        }


        console.log(
            "[Solaria] Google session successfully created."
        );


        if (
            data &&
            data.user
        ) {

            console.log(
                "[Solaria] Logged in as:",
                data.user.email
            );

        }


        if (mainWindow) {

            mainWindow.webContents.send(
                "google-login-success"
            );

        }

    }

    catch (error) {

        console.error(
            "[Solaria] Google callback processing error:",
            error
        );


        if (mainWindow) {

            mainWindow.webContents.send(
                "google-login-error",
                error.message ||
                "Google callback failed."
            );

        }

    }

}


// ============================================================
// WINDOWS PROTOCOL REGISTRATION
// ============================================================

function registerProtocol() {

    if (
        process.platform !==
        "win32"
    ) {

        return;

    }


    if (
        process.defaultApp
    ) {

        const entryPoint =
            path.resolve(
                process.argv[1]
            );


        const registered =
            app.setAsDefaultProtocolClient(
                PROTOCOL_NAME,
                process.execPath,
                [
                    entryPoint
                ]
            );


        console.log(
            "[Solaria] Development protocol registration:",
            registered
        );

    }

    else {

        const registered =
            app.setAsDefaultProtocolClient(
                PROTOCOL_NAME
            );


        console.log(
            "[Solaria] Packaged protocol registration:",
            registered
        );

    }

}


// ============================================================
// SOLARIA ENGINE LAUNCHER
// ============================================================

function isSolariaGameRunning() {

    return (
        solariaGameProcess !== null &&
        !solariaGameProcess.killed &&
        solariaGameProcess.exitCode === null
    );

}


function isLocalGameServerListening() {

    return new Promise((resolve) => {

        const socket = net.createConnection({
            host: "127.0.0.1",
            port: 8787
        });

        const finish = (result) => {
            socket.destroy();
            resolve(result);
        };

        socket.once("connect", () => finish(true));
        socket.once("error", () => finish(false));
        socket.once("timeout", () => finish(false));
        socket.setTimeout(350);

    });

}


async function waitForLocalGameServer(timeoutMs = 8000, processToWatch = solariaServerProcess) {

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {

        if (await isLocalGameServerListening()) {
            return true;
        }

        if (processToWatch && processToWatch.exitCode !== null) {
            throw new Error("The Solaria multiplayer server stopped before it became ready.");
        }

        await new Promise(resolve => setTimeout(resolve, 150));

    }

    throw new Error("The Solaria multiplayer server did not start listening on port 8787.");

}


async function startSolariaServer() {

    if (await isLocalGameServerListening()) {
        console.log("[Solaria] Multiplayer server is already running.");
        return;
    }

    if (!fs.existsSync(SOLARIA_SERVER_PATH)) {
        throw new Error("The multiplayer server file was not found: " + SOLARIA_SERVER_PATH);
    }

    if (solariaServerProcess && solariaServerProcess.exitCode === null) {
        await waitForLocalGameServer(8000, solariaServerProcess);
        return;
    }

    console.log("[Solaria] Starting multiplayer server:", SOLARIA_SERVER_PATH);

    const child = spawn(
        process.execPath,
        [SOLARIA_SERVER_PATH],
        {
            cwd: SOLARIA_SERVER_DIRECTORY,
            detached: false,
            stdio: "inherit",
            windowsHide: true,
            env: {
                ...process.env,
                ELECTRON_RUN_AS_NODE: "1"
            }
        }
    );

    solariaServerProcess = child;

    child.once("exit", (code, signal) => {
        console.log("[Solaria] Multiplayer server stopped.", code, signal);
        if (solariaServerProcess === child) {
            solariaServerProcess = null;
        }
    });

    await new Promise((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
    });

    await waitForLocalGameServer(8000, child);
    console.log("[Solaria] Multiplayer server is ready.");

}


function stopSolariaServer() {

    if (!solariaServerProcess) {
        return;
    }

    if (solariaServerProcess.exitCode === null && !solariaServerProcess.killed) {
        console.log("[Solaria] Stopping multiplayer server...");
        solariaServerProcess.kill();
    }

}


// ============================================================
// LAUNCH GAME ENGINE
// ============================================================

function launchSolariaGame(
    gameId,
    playerData = {}
) {

    return new Promise(
        async (
            resolve
        ) => {

            console.log(
                "[Solaria] Game launch requested:",
                gameId
            );


            if (
                gameId !== "test"
            ) {

                resolve({

                    success: false,

                    message:
                        "That game is not available yet."

                });

                return;

            }


            if (
                isSolariaGameRunning()
            ) {

                console.log(
                    "[Solaria] SolariaGame is already running."
                );


                resolve({

                    success: true,

                    alreadyRunning:
                        true

                });

                return;

            }


            if (
                !fs.existsSync(
                    SOLARIA_ENGINE_PATH
                )
            ) {

                console.error(
                    "[Solaria] Engine executable not found:"
                );

                console.error(
                    SOLARIA_ENGINE_PATH
                );


                resolve({

                    success: false,

                    message:
                        "The Solaria game engine could not be found. Build the C++ engine first."

                });

                return;

            }


            console.log(
                "[Solaria] Starting engine:"
            );

            console.log(
                SOLARIA_ENGINE_PATH
            );


            console.log(
                "[Solaria] Engine working directory:"
            );

            console.log(
                SOLARIA_ENGINE_DIRECTORY
            );


            try {

            // The native client connects to localhost:8787, so make sure its
            // WebSocket server is ready before launching the game process.
            await startSolariaServer();

            const avatar = playerData && playerData.avatar ? playerData.avatar : {};
            const colors = avatar.colors || {};

            const safeLine = value => String(value || "")
                .replace(/[\r\n=]/g, " ")
                .trim();

            const safeColor = value =>
                /^#[0-9a-fA-F]{6}$/.test(String(value || ""))
                    ? String(value)
                    : "";

            const playerDataFile = path.join(
                app.getPath("userData"),
                "solaria-player-session.ini"
            );

            const playerLines = [
                "displayName=" + safeLine(playerData.displayName || playerData.username || "Guest"),
                "username=" + safeLine(playerData.username || ""),
                "renderMode=" + safeLine(avatar.renderMode || "ball"),
                "head=" + safeColor(colors.head),
                "torso=" + safeColor(colors.torso),
                "leftArm=" + safeColor(colors.leftArm),
                "rightArm=" + safeColor(colors.rightArm),
                "leftLeg=" + safeColor(colors.leftLeg),
                "rightLeg=" + safeColor(colors.rightLeg)
            ];

            fs.writeFileSync(playerDataFile, playerLines.join("\n"), "utf8");

                solariaGameProcess =
                    spawn(
                        SOLARIA_ENGINE_PATH,
                        [
                            gameId,
                            "--player-data",
                            playerDataFile
                        ],
                        {

                            cwd:
                                SOLARIA_ENGINE_DIRECTORY,

                            detached:
                                false,

                            stdio:
                                "inherit",

                            windowsHide:
                                false

                        }
                    );


                solariaGameProcess.once(
                    "spawn",
                    () => {

                        console.log(
                            "[Solaria] C++ game engine started."
                        );
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.hide();
                        }


                        resolve({

                            success: true,

                            alreadyRunning:
                                false

                        });

                    }
                );


                solariaGameProcess.once(
                    "error",
                    (
                        error
                    ) => {

                        console.error(
                            "[Solaria] Failed to start game engine:",
                            error
                        );


                        solariaGameProcess =
                            null;

                        stopSolariaServer();

                        resolve({

                            success: false,

                            message:
                                error.message ||
                                "The game engine could not be started."

                        });

                    }
                );


                solariaGameProcess.once(
                    "exit",
                    (
                        code,
                        signal
                    ) => {

                        console.log(
                            "[Solaria] Game engine closed."
                        );


                        console.log(
                            "[Solaria] Exit code:",
                            code
                        );


                        console.log(
                            "[Solaria] Signal:",
                            signal
                        );


                        solariaGameProcess =
                            null;

                        stopSolariaServer();

                        // Exit Game returns to the launcher. Only a real app
                        // quit (for example, the launcher's X button) exits Solaria.
                        if (!isAppQuitting && mainWindow && !mainWindow.isDestroyed()) {
                            if (mainWindow.isMinimized()) {
                                mainWindow.restore();
                            }

                            mainWindow.show();
                            mainWindow.focus();
                        }

                    }
                );

            }

            catch (error) {

                console.error(
                    "[Solaria] Engine launch exception:",
                    error
                );


                solariaGameProcess =
                    null;

                stopSolariaServer();

                resolve({

                    success: false,

                    message:
                        error.message ||
                        "Unable to launch the game engine."

                });

            }

        }
    );

}


// ============================================================
// ENGINE IPC
// ============================================================

ipcMain.handle(
    "solaria-engine-launch",
    async (
        event,
        {
            gameId,
            playerData
        }
    ) => {

        return await launchSolariaGame(
            gameId,
            playerData
        );

    }
);


ipcMain.handle(
    "solaria-engine-is-running",
    async () => {

        return {

            success: true,

            running:
                isSolariaGameRunning()

        };

    }
);


ipcMain.handle(
    "solaria-engine-stop",
    async () => {

        if (
            !isSolariaGameRunning()
        ) {

            return {

                success: true,

                running: false

            };

        }


        try {

            console.log(
                "[Solaria] Stopping game engine..."
            );


            solariaGameProcess.kill();


            return {

                success: true,

                running: false

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Could not stop game engine:",
                error
            );


            return {

                success: false,

                running:
                    isSolariaGameRunning(),

                message:
                    error.message ||
                    "Unable to stop the game."

            };

        }

    }
);


// ============================================================
// STARTUP
// ============================================================

app.whenReady()
    .then(
        async () => {

            console.log(
                "[Solaria] Electron is ready."
            );


            loadSolariaTheme();

            applySolariaTheme();


            registerProtocol();


            if (
                process.platform ===
                "win32"
            ) {

                const protocolUrl =
                    process.argv.find(
                        argument =>
                            typeof argument === "string" &&
                            argument.startsWith(
                                `${PROTOCOL_NAME}://`
                            )
                    );


                if (protocolUrl) {

                    console.log(
                        "[Solaria] Startup protocol URL found:"
                    );

                    console.log(
                        protocolUrl
                    );


                    pendingProtocolUrl =
                        protocolUrl;

                }

            }


            createWindow();


            /*
                Start the updater only after the window exists.
            */

            setupAutoUpdater();


            if (
                pendingProtocolUrl
            ) {

                const url =
                    pendingProtocolUrl;


                pendingProtocolUrl =
                    null;


                setTimeout(
                    () => {

                        handleProtocolUrl(
                            url
                        );

                    },
                    1000
                );

            }

        }
    );


// ============================================================
// MACOS PROTOCOL SUPPORT
// ============================================================

app.on(
    "open-url",
    (
        event,
        url
    ) => {

        event.preventDefault();


        console.log(
            "[Solaria] macOS protocol URL received:"
        );

        console.log(
            url
        );


        handleProtocolUrl(
            url
        );

    }
);


// ============================================================
// SYSTEM THEME CHANGES
// ============================================================

nativeTheme.on(
    "updated",
    () => {

        if (
            solariaThemePreference !==
            "system"
        ) {

            return;

        }


        console.log(
            "[Solaria] Windows theme changed:",
            getSolariaTheme()
        );


        sendThemeToWindow();

    }
);


// ============================================================
// THEME IPC
// ============================================================

ipcMain.handle(
    "theme-get",
    async () => {

        return {

            success: true,

            preference:
                solariaThemePreference,

            theme:
                getSolariaTheme()

        };

    }
);


ipcMain.handle(
    "theme-set",
    async (
        event,
        {
            theme
        }
    ) => {

        const validThemes = [
            "system",
            "light",
            "dark"
        ];


        if (
            !validThemes.includes(
                theme
            )
        ) {

            theme =
                "system";

        }


        solariaThemePreference =
            theme;


        saveSolariaTheme(
            theme
        );


        applySolariaTheme();


        sendThemeToWindow();


        return {

            success: true,

            preference:
                solariaThemePreference,

            theme:
                getSolariaTheme()

        };

    }
);


// ============================================================
// AUTH IPC
// ============================================================

ipcMain.handle(
    "auth-sign-up",
    async (
        event,
        {
            email,
            password
        }
    ) => {

        try {

            const {
                data,
                error
            } =
                await supabase.auth.signUp({

                    email,

                    password

                });


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                user:
                    data.user ||
                    null,

                session:
                    data.session ||
                    null

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message ||
                    "Unable to create account."

            };

        }

    }
);


ipcMain.handle(
    "auth-sign-in",
    async (
        event,
        {
            email,
            password
        }
    ) => {

        try {

            const {
                data,
                error
            } =
                await supabase.auth.signInWithPassword({

                    email,

                    password

                });


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                user:
                    data.user ||
                    null,

                session:
                    data.session ||
                    null

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message ||
                    "Unable to log in."

            };

        }

    }
);


ipcMain.handle(
    "auth-google",
    async () => {

        return await startGoogleLogin();

    }
);


ipcMain.handle(
    "auth-sign-out",
    async () => {

        try {

            const {
                error
            } =
                await supabase.auth.signOut();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message ||
                    "Unable to log out."

            };

        }

    }
);


ipcMain.handle(
    "auth-get-user",
    async () => {

        try {

            const {
                data,
                error
            } =
                await supabase.auth.getUser();


            if (error) {

                return {

                    success: false,

                    user: null,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                user:
                    data.user ||
                    null

            };

        }

        catch (error) {

            return {

                success: false,

                user: null,

                message:
                    error.message ||
                    "Unable to get user."

            };

        }

    }
);


// ============================================================

// ============================================================
// GET CURRENT AUTH SESSION
// ============================================================

ipcMain.handle(
    "auth-get-session",
    async () => {

        try {

            const {
                data,
                error
            } = await supabase.auth.getSession();

            if (error) {

                return {
                    success: false,
                    session: null,
                    user: null,
                    message: error.message
                };

            }

            const session = data.session || null;

            return {
                success: true,
                session,
                user: session ? session.user : null
            };

        } catch (error) {

            return {
                success: false,
                session: null,
                user: null,
                message: error.message || "Unable to restore session."
            };

        }

    }
);

// PROFILE BACKEND
// ============================================================

console.log(
    "[Solaria] Profile backend loaded."
);


// ============================================================
// FIND PROFILE
// ============================================================

ipcMain.handle(
    "profile-find-by-username",
    async (
        event,
        {
            username
        }
    ) => {

        try {

            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            if (!cleanUsername) {

                return {

                    success: false,

                    message:
                        "Please enter a username."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select("*")
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                profile:
                    data ||
                    null

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// PROFILE SEARCH
// ============================================================

ipcMain.handle(
    "profile-search",
    async (
        event,
        {
            query
        }
    ) => {

        try {

            const cleanQuery =
                String(
                    query || ""
                )
                .trim();


            if (!cleanQuery) {

                return {

                    success: true,

                    profiles: []

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, display_name, golden_blocks, last_seen"
                    )
                    .or(
                        `username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`
                    )
                    .limit(25);


            if (error) {

                return {

                    success: false,

                    profiles: [],

                    message:
                        error.message

                };

            }


            return {

                success: true,

                profiles:
                    data ||
                    []

            };

        }

        catch (error) {

            return {

                success: false,

                profiles: [],

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// CHECK USERNAME
// ============================================================

ipcMain.handle(
    "profile-check-username",
    async (
        event,
        {
            username
        }
    ) => {

        try {

            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select("id")
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (error) {

                return {

                    success: false,

                    available: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                available:
                    !data

            };

        }

        catch (error) {

            return {

                success: false,

                available: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// CREATE PROFILE
// ============================================================

ipcMain.handle(
    "profile-create",
    async (
        event,
        {
            username,
            displayName
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData ||
                !userData.user
            ) {

                return {

                    success: false,

                    message:
                        "You must be logged in to create a profile."

                };

            }


            const user =
                userData.user;


            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            const cleanDisplayName =
                String(
                    displayName || ""
                )
                .trim();


            if (
                !/^[A-Za-z0-9_]{3,20}$/.test(
                    cleanUsername
                )
            ) {

                return {

                    success: false,

                    message:
                        "Username must be 3-20 characters and contain only letters, numbers, and underscores."

                };

            }


            if (
                cleanDisplayName.length < 1 ||
                cleanDisplayName.length > 30
            ) {

                return {

                    success: false,

                    message:
                        "Display name must be 1-30 characters."

                };

            }


            const {
                data: existing
            } =
                await supabase
                    .from("profiles")
                    .select("id")
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (existing) {

                return {

                    success: false,

                    message:
                        "That username is already taken."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .insert({

                        id:
                            user.id,

                        username:
                            cleanUsername,

                        display_name:
                            cleanDisplayName,

                        golden_blocks:
                            0,

                        allow_friend_requests:
                            true

                    })
                    .select()
                    .single();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                profile:
                    data

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// GET MY PROFILE
// ============================================================

ipcMain.handle(
    "profile-get-mine",
    async () => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData ||
                !userData.user
            ) {

                return {

                    success: false,

                    profile: null,

                    message:
                        "Not logged in."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        userData.user.id
                    )
                    .maybeSingle();


            if (error) {

                return {

                    success: false,

                    profile: null,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                profile:
                    data ||
                    null

            };

        }

        catch (error) {

            return {

                success: false,

                profile: null,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// CHANGE DISPLAY NAME
// ============================================================

ipcMain.handle(
    "profile-change-display-name",
    async (
        event,
        {
            displayName
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData ||
                !userData.user
            ) {

                return {

                    success: false,

                    message:
                        "Not logged in."

                };

            }


            const cleanName =
                String(
                    displayName || ""
                )
                .trim();


            if (
                cleanName.length < 1 ||
                cleanName.length > 30
            ) {

                return {

                    success: false,

                    message:
                        "Display name must be 1-30 characters."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .update({

                        display_name:
                            cleanName

                    })
                    .eq(
                        "id",
                        userData.user.id
                    )
                    .select()
                    .single();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                profile:
                    data

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// GET FRIEND REQUEST SETTING
// ============================================================

ipcMain.handle(
    "profile-get-friend-requests",
    async () => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    enabled: true,

                    message:
                        "Not logged in."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "allow_friend_requests"
                    )
                    .eq(
                        "id",
                        userData.user.id
                    )
                    .maybeSingle();


            if (error) {

                return {

                    success: false,

                    enabled: true,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                enabled:
                    data?.allow_friend_requests !== false

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Get friend request setting error:",
                error
            );


            return {

                success: false,

                enabled: true,

                message:
                    error.message ||
                    "Unable to load friend request setting."

            };

        }

    }
);


// ============================================================
// SET FRIEND REQUEST SETTING
// ============================================================

ipcMain.handle(
    "profile-set-friend-requests",
    async (
        event,
        {
            enabled
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    message:
                        "Not logged in."

                };

            }


            const allowFriendRequests =
                enabled === true;


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .update({

                        allow_friend_requests:
                            allowFriendRequests

                    })
                    .eq(
                        "id",
                        userData.user.id
                    )
                    .select(
                        "id, allow_friend_requests"
                    )
                    .single();


            if (error) {

                console.error(
                    "[Solaria] Set friend request setting error:",
                    error
                );


                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                enabled:
                    data.allow_friend_requests

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Set friend request setting exception:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to save friend request setting."

            };

        }

    }
);


// ============================================================
// GOLDEN BLOCKS
// ============================================================

ipcMain.handle(
    "profile-get-golden-blocks",
    async () => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData ||
                !userData.user
            ) {

                return {

                    success: false,

                    goldenBlocks:
                        0

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "golden_blocks"
                    )
                    .eq(
                        "id",
                        userData.user.id
                    )
                    .maybeSingle();


            if (error) {

                return {

                    success: false,

                    goldenBlocks:
                        0,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                goldenBlocks:
                    data?.golden_blocks ||
                    0

            };

        }

        catch (error) {

            return {

                success: false,

                goldenBlocks:
                    0,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// UPDATE LAST SEEN
// ============================================================

ipcMain.handle(
    "profile-update-last-seen",
    async () => {

        try {

            const {
                data,
                error
            } =
                await supabase.rpc(
                    "update_last_seen"
                );


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// FRIENDS BACKEND
// ============================================================

console.log(
    "[Solaria] Friends backend loaded."
);


// ============================================================
// SEND FRIEND REQUEST
// ============================================================

ipcMain.handle(
    "friends-send-request",
    async (
        event,
        {
            username
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    message:
                        "You must be logged in."

                };

            }


            const currentUser =
                userData.user;


            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            if (!cleanUsername) {

                return {

                    success: false,

                    message:
                        "Username is required."

                };

            }


            const {
                data: targetProfile,
                error: targetError
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, display_name, last_seen, allow_friend_requests"
                    )
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (targetError) {

                return {

                    success: false,

                    message:
                        targetError.message

                };

            }


            if (!targetProfile) {

                return {

                    success: false,

                    message:
                        "User not found."

                };

            }


            if (
                targetProfile.id ===
                currentUser.id
            ) {

                return {

                    success: false,

                    message:
                        "You cannot add yourself."

                };

            }


            if (
                targetProfile.allow_friend_requests ===
                false
            ) {

                return {

                    success: false,

                    message:
                        "This user is not accepting friend requests."

                };

            }


            const {
                data: existingFriendships,
                error: existingError
            } =
                await supabase
                    .from("friendships")
                    .select("*")
                    .or(
                        `and(requester_id.eq.${currentUser.id},receiver_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},receiver_id.eq.${currentUser.id})`
                    );


            if (existingError) {

                return {

                    success: false,

                    message:
                        existingError.message

                };

            }


            const existing =
                existingFriendships &&
                existingFriendships.length > 0
                    ? existingFriendships[0]
                    : null;


            if (existing) {

                if (
                    existing.status ===
                    "accepted"
                ) {

                    return {

                        success: false,

                        message:
                            "You are already friends."

                    };

                }


                if (
                    existing.requester_id ===
                    currentUser.id
                ) {

                    return {

                        success: false,

                        message:
                            "A friend request has already been sent."

                    };

                }


                return {

                    success: false,

                    message:
                        "This user has already sent you a friend request. Accept it instead."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("friendships")
                    .insert({

                        requester_id:
                            currentUser.id,

                        receiver_id:
                            targetProfile.id,

                        status:
                            "pending"

                    })
                    .select()
                    .single();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                friendship:
                    data

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Send friend request error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to send friend request."

            };

        }

    }
);


// ============================================================
// GET FRIEND STATUS
// ============================================================

ipcMain.handle(
    "friends-get-status",
    async (
        event,
        {
            username
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    status:
                        "none",

                    message:
                        "You must be logged in."

                };

            }


            const currentUser =
                userData.user;


            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            if (!cleanUsername) {

                return {

                    success: false,

                    status:
                        "none",

                    message:
                        "Username is required."

                };

            }


            const {
                data: targetProfile,
                error: targetError
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username"
                    )
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (targetError) {

                return {

                    success: false,

                    status:
                        "none",

                    message:
                        targetError.message

                };

            }


            if (!targetProfile) {

                return {

                    success: false,

                    status:
                        "none",

                    message:
                        "User not found."

                };

            }


            if (
                targetProfile.id ===
                currentUser.id
            ) {

                return {

                    success: true,

                    status:
                        "none"

                };

            }


            const {
                data: friendships,
                error: friendshipError
            } =
                await supabase
                    .from("friendships")
                    .select("*")
                    .or(
                        `and(requester_id.eq.${currentUser.id},receiver_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},receiver_id.eq.${currentUser.id})`
                    );


            if (friendshipError) {

                return {

                    success: false,

                    status:
                        "none",

                    message:
                        friendshipError.message

                };

            }


            const friendship =
                friendships &&
                friendships.length > 0
                    ? friendships[0]
                    : null;


            if (!friendship) {

                return {

                    success: true,

                    status:
                        "none"

                };

            }


            if (
                friendship.status ===
                "accepted"
            ) {

                return {

                    success: true,

                    status:
                        "accepted",

                    friendshipId:
                        friendship.id

                };

            }


            if (
                friendship.requester_id ===
                currentUser.id
            ) {

                return {

                    success: true,

                    status:
                        "outgoing",

                    friendshipId:
                        friendship.id

                };

            }


            if (
                friendship.receiver_id ===
                currentUser.id
            ) {

                return {

                    success: true,

                    status:
                        "incoming",

                    friendshipId:
                        friendship.id

                };

            }


            return {

                success: true,

                status:
                    "none"

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Get friend status error:",
                error
            );


            return {

                success: false,

                status:
                    "none",

                message:
                    error.message ||
                    "Unable to get friend status."

            };

        }

    }
);


// ============================================================
// ACCEPT FRIEND REQUEST
// ============================================================

ipcMain.handle(
    "friends-accept-request",
    async (
        event,
        {
            username
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    message:
                        "You must be logged in."

                };

            }


            const currentUser =
                userData.user;


            const cleanUsername =
                String(
                    username || ""
                )
                .trim();


            if (!cleanUsername) {

                return {

                    success: false,

                    message:
                        "Username is required."

                };

            }


            const {
                data: targetProfile,
                error: targetError
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username"
                    )
                    .ilike(
                        "username",
                        cleanUsername
                    )
                    .maybeSingle();


            if (targetError) {

                return {

                    success: false,

                    message:
                        targetError.message

                };

            }


            if (!targetProfile) {

                return {

                    success: false,

                    message:
                        "User not found."

                };

            }


            if (
                targetProfile.id ===
                currentUser.id
            ) {

                return {

                    success: false,

                    message:
                        "You cannot accept your own request."

                };

            }


            const {
                data: friendship,
                error: friendshipError
            } =
                await supabase
                    .from("friendships")
                    .select("*")
                    .eq(
                        "requester_id",
                        targetProfile.id
                    )
                    .eq(
                        "receiver_id",
                        currentUser.id
                    )
                    .eq(
                        "status",
                        "pending"
                    )
                    .maybeSingle();


            if (friendshipError) {

                return {

                    success: false,

                    message:
                        friendshipError.message

                };

            }


            if (!friendship) {

                return {

                    success: false,

                    message:
                        "No pending friend request was found."

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("friendships")
                    .update({

                        status:
                            "accepted"

                    })
                    .eq(
                        "id",
                        friendship.id
                    )
                    .select()
                    .single();


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true,

                friendship:
                    data

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Accept friend request error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to accept friend request."

            };

        }

    }
);


// ============================================================
// GET INCOMING REQUESTS
// ============================================================

ipcMain.handle(
    "friends-get-incoming",
    async () => {

        try {

            const {
                data: userData
            } =
                await supabase.auth.getUser();


            if (!userData?.user) {

                return {

                    success: false,

                    requests: []

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("friendships")
                    .select(
                        `
                        id,
                        requester_id,
                        receiver_id,
                        status,
                        created_at,
                        profiles:requester_id (
                            id,
                            username,
                            display_name,
                            last_seen
                        )
                        `
                    )
                    .eq(
                        "receiver_id",
                        userData.user.id
                    )
                    .eq(
                        "status",
                        "pending"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                return {

                    success: false,

                    requests: [],

                    message:
                        error.message

                };

            }


            return {

                success: true,

                requests:
                    data ||
                    []

            };

        }

        catch (error) {

            return {

                success: false,

                requests: [],

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// GET OUTGOING REQUESTS
// ============================================================

ipcMain.handle(
    "friends-get-outgoing",
    async () => {

        try {

            const {
                data: userData
            } =
                await supabase.auth.getUser();


            if (!userData?.user) {

                return {

                    success: false,

                    requests: []

                };

            }


            const {
                data,
                error
            } =
                await supabase
                    .from("friendships")
                    .select(
                        `
                        id,
                        requester_id,
                        receiver_id,
                        status,
                        created_at,
                        profiles:receiver_id (
                            id,
                            username,
                            display_name,
                            last_seen
                        )
                        `
                    )
                    .eq(
                        "requester_id",
                        userData.user.id
                    )
                    .eq(
                        "status",
                        "pending"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                return {

                    success: false,

                    requests: [],

                    message:
                        error.message

                };

            }


            return {

                success: true,

                requests:
                    data ||
                    []

            };

        }

        catch (error) {

            return {

                success: false,

                requests: [],

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// GET FRIENDS
// ============================================================

ipcMain.handle(
    "friends-get-friends",
    async () => {

        try {

            const {
                data: userData
            } =
                await supabase.auth.getUser();


            if (!userData?.user) {

                return {

                    success: false,

                    friends: []

                };

            }


            const userId =
                userData.user.id;


            const {
                data,
                error
            } =
                await supabase
                    .from("friendships")
                    .select(
                        `
                        id,
                        requester_id,
                        receiver_id,
                        status,
                        created_at
                        `
                    )
                    .eq(
                        "status",
                        "accepted"
                    )
                    .or(
                        `requester_id.eq.${userId},receiver_id.eq.${userId}`
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                return {

                    success: false,

                    friends: [],

                    message:
                        error.message

                };

            }


            const friendIds =
                (data || [])
                    .map(
                        friendship => {

                            return (
                                friendship.requester_id ===
                                userId

                                    ? friendship.receiver_id

                                    : friendship.requester_id
                            );

                        }
                    );


            if (
                friendIds.length ===
                0
            ) {

                return {

                    success: true,

                    friends: []

                };

            }


            const {
                data: profiles,
                error: profileError
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, username, display_name, golden_blocks, last_seen"
                    )
                    .in(
                        "id",
                        friendIds
                    );


            if (profileError) {

                return {

                    success: false,

                    friends: [],

                    message:
                        profileError.message

                };

            }


            const profileMap =
                new Map(
                    (profiles || [])
                        .map(
                            profile => [
                                profile.id,
                                profile
                            ]
                        )
                );


            const friends =
                (data || [])
                    .map(
                        friendship => {

                            const friendId =
                                friendship.requester_id ===
                                userId

                                    ? friendship.receiver_id
                                    : friendship.requester_id;


                            return {

                                friendshipId:
                                    friendship.id,

                                ...(
                                    profileMap.get(
                                        friendId
                                    ) || {}
                                )

                            };

                        }
                    );


            return {

                success: true,

                friends

            };

        }

        catch (error) {

            return {

                success: false,

                friends: [],

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// RESPOND TO FRIEND REQUEST
// ============================================================

ipcMain.handle(
    "friends-respond",
    async (
        event,
        {
            friendshipId,
            action
        }
    ) => {

        try {

            const {
                data: userData
            } =
                await supabase.auth.getUser();


            if (!userData?.user) {

                return {

                    success: false,

                    message:
                        "You must be logged in."

                };

            }


            if (
                ![
                    "accept",
                    "decline"
                ].includes(
                    action
                )
            ) {

                return {

                    success: false,

                    message:
                        "Invalid action."

                };

            }


            const {
                data: friendship,
                error: findError
            } =
                await supabase
                    .from("friendships")
                    .select("*")
                    .eq(
                        "id",
                        friendshipId
                    )
                    .maybeSingle();


            if (findError) {

                return {

                    success: false,

                    message:
                        findError.message

                };

            }


            if (!friendship) {

                return {

                    success: false,

                    message:
                        "Friend request not found."

                };

            }


            if (
                friendship.receiver_id !==
                userData.user.id
            ) {

                return {

                    success: false,

                    message:
                        "You cannot respond to this request."

                };

            }


            if (
                friendship.status !==
                "pending"
            ) {

                return {

                    success: false,

                    message:
                        "This request is no longer pending."

                };

            }


            if (
                action ===
                "accept"
            ) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("friendships")
                        .update({
                            status:
                                "accepted"
                        })
                        .eq(
                            "id",
                            friendshipId
                        )
                        .select()
                        .single();


                if (error) {

                    return {

                        success: false,

                        message:
                            error.message

                    };

                }


                return {

                    success: true,

                    friendship:
                        data

                };

            }


            const {
                error
            } =
                await supabase
                    .from("friendships")
                    .delete()
                    .eq(
                        "id",
                        friendshipId
                    );


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            return {

                success: false,

                message:
                    error.message

            };

        }

    }
);


// ============================================================
// REMOVE FRIEND / CANCEL REQUEST
// ============================================================

ipcMain.handle(
    "friends-remove",
    async (
        event,
        {
            username,
            friendshipId
        }
    ) => {

        try {

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.getUser();


            if (
                userError ||
                !userData?.user
            ) {

                return {

                    success: false,

                    message:
                        "You must be logged in."

                };

            }


            const currentUser =
                userData.user;


            let friendship = null;


            if (friendshipId) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("friendships")
                        .select("*")
                        .eq(
                            "id",
                            friendshipId
                        )
                        .maybeSingle();


                if (error) {

                    return {

                        success: false,

                        message:
                            error.message

                    };

                }


                friendship =
                    data ||
                    null;

            }


            if (
                !friendship &&
                username
            ) {

                const cleanUsername =
                    String(
                        username
                    )
                    .trim();


                const {
                    data: targetProfile,
                    error: targetError
                } =
                    await supabase
                        .from("profiles")
                        .select(
                            "id, username"
                        )
                        .ilike(
                            "username",
                            cleanUsername
                        )
                        .maybeSingle();


                if (targetError) {

                    return {

                        success: false,

                        message:
                            targetError.message

                    };

                }


                if (!targetProfile) {

                    return {

                        success: false,

                        message:
                            "User not found."

                    };

                }


                const {
                    data: friendships,
                    error: friendshipError
                } =
                    await supabase
                        .from("friendships")
                        .select("*")
                        .or(
                            `and(requester_id.eq.${currentUser.id},receiver_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},receiver_id.eq.${currentUser.id})`
                        );


                if (friendshipError) {

                    return {

                        success: false,

                        message:
                            friendshipError.message

                    };

                }


                friendship =
                    friendships &&
                    friendships.length > 0
                        ? friendships[0]
                        : null;

            }


            if (!friendship) {

                return {

                    success: false,

                    message:
                        "Friendship not found."

                };

            }


            if (
                friendship.requester_id !==
                    currentUser.id &&
                friendship.receiver_id !==
                    currentUser.id
            ) {

                return {

                    success: false,

                    message:
                        "You cannot remove this friendship."

                };

            }


            const {
                error
            } =
                await supabase
                    .from("friendships")
                    .delete()
                    .eq(
                        "id",
                        friendship.id
                    );


            if (error) {

                return {

                    success: false,

                    message:
                        error.message

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Remove friend error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to remove friend."

            };

        }

    }
);


// ============================================================
app.on(
    "window-all-closed",
    () => {
        console.log("[Solaria] All windows closed. Exiting.");
        app.quit();
    }
);


// ============================================================
// CLEAN UP GAME ENGINE
// ============================================================

app.on(
    "before-quit",
    () => {

        isAppQuitting = true;
        stopSolariaServer();

        if (
            isSolariaGameRunning()
        ) {

            console.log(
                "[Solaria] Closing game engine..."
            );


            try {

                solariaGameProcess.kill();

            }

            catch (error) {

                console.error(
                    "[Solaria] Could not close game engine:",
                    error
                );

            }

        }

    }
);


// ============================================================
// READY
// ============================================================

console.log(
    "[Solaria] Google PKCE authentication loaded."
);

console.log(
    "[Solaria] Engine path:",
    SOLARIA_ENGINE_PATH
);


