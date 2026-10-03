const MUSIC_SETTINGS_KEY =
    "blockworld_music_settings";

const THEME_SETTINGS_KEY =
    "solaria_theme";

let currentProfile = null;


// ============================================================
// THEME SETTINGS
// ============================================================

function getThemeSetting() {

    const saved =
        localStorage.getItem(
            THEME_SETTINGS_KEY
        );

    if (
        saved === "light" ||
        saved === "dark" ||
        saved === "system"
    ) {

        return saved;

    }

    return "system";

}


// ============================================================
// APPLY THEME
// ============================================================

async function applyTheme(
    theme
) {

    const validThemes = [
        "system",
        "light",
        "dark"
    ];

    if (
        !validThemes.includes(theme)
    ) {

        theme = "system";

    }


    /*
        The Electron main process is the
        central Solaria theme controller.

        System:
            Follows Windows.

        Light:
            Always daytime.

        Dark:
            Always nighttime.
    */

    try {

        if (
            window.solariaTheme &&
            typeof window.solariaTheme.set ===
            "function"
        ) {

            const result =
                await window.solariaTheme.set(
                    theme
                );


            if (
                result &&
                result.success
            ) {

                localStorage.setItem(
                    THEME_SETTINGS_KEY,
                    theme
                );


                updateThemeIcon(
                    result.theme ||
                    theme
                );


                return;

            }

        }

    }

    catch (error) {

        console.error(
            "Solaria theme controller error:",
            error
        );

    }


    /*
        Fallback if the Electron theme
        controller is unavailable.
    */

    let resolvedTheme =
        theme;


    if (
        theme === "system"
    ) {

        resolvedTheme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";

    }


    document.documentElement
        .setAttribute(
            "data-theme",
            resolvedTheme
        );


    localStorage.setItem(
        THEME_SETTINGS_KEY,
        theme
    );


    updateThemeIcon(
        resolvedTheme
    );

}


// ============================================================
// THEME ICON
// ============================================================

function updateThemeIcon(
    theme
) {

    const icon =
        document.getElementById(
            "themeIcon"
        );


    if (!icon) {

        return;

    }


    let actualTheme =
        theme;


    /*
        If the supplied value is "system",
        determine what Windows is currently using.
    */

    if (
        actualTheme === "system"
    ) {

        actualTheme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";

    }


    if (
        actualTheme === "dark"
    ) {

        icon.textContent =
            "🌙";

    }

    else {

        icon.textContent =
            "☀️";

    }

}


// ============================================================
// LOAD THEME
// ============================================================

async function loadThemeSettings() {

    let theme =
        getThemeSetting();


    /*
        Ask the Electron main process for
        the actual saved Solaria theme.

        This keeps main.js as the source
        of truth when available.
    */

    try {

        if (
            window.solariaTheme &&
            typeof window.solariaTheme.get ===
            "function"
        ) {

            const result =
                await window.solariaTheme.get();


            if (
                result &&
                result.success
            ) {

                theme =
                    result.preference ||
                    theme;


                localStorage.setItem(
                    THEME_SETTINGS_KEY,
                    theme
                );


                if (
                    result.theme
                ) {

                    document.documentElement
                        .setAttribute(
                            "data-theme",
                            result.theme
                        );

                    updateThemeIcon(
                        result.theme
                    );

                }

            }

        }

    }

    catch (error) {

        console.error(
            "Could not load Solaria theme:",
            error
        );

    }


    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (themeSelect) {

        themeSelect.value =
            theme;

    }


    /*
        Make sure the correct icon is shown
        even if the Electron controller
        was unavailable.
    */

    if (
        !document.documentElement
            .getAttribute("data-theme")
    ) {

        let resolvedTheme =
            theme;


        if (
            theme === "system"
        ) {

            resolvedTheme =
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light";

        }


        document.documentElement
            .setAttribute(
                "data-theme",
                resolvedTheme
            );


        updateThemeIcon(
            resolvedTheme
        );

    }

}


// ============================================================
// CONNECT THEME CONTROLS
// ============================================================

function connectThemeControls() {

    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (!themeSelect) {

        console.warn(
            "Solaria theme selector was not found."
        );

        return;

    }


    themeSelect.addEventListener(
        "change",
        () => {

            applyTheme(
                themeSelect.value
            );

        }
    );


    /*
        Listen for theme changes coming
        from the Electron main process.

        This is especially important for
        System mode when Windows changes
        between light and dark.
    */

    if (
        window.solariaTheme &&
        typeof window.solariaTheme.onChanged ===
        "function"
    ) {

        window.solariaTheme.onChanged(
            themeData => {

                if (
                    !themeData
                ) {

                    return;

                }


                const resolvedTheme =
                    themeData.theme;


                if (
                    resolvedTheme
                ) {

                    document.documentElement
                        .setAttribute(
                            "data-theme",
                            resolvedTheme
                        );

                    updateThemeIcon(
                        resolvedTheme
                    );

                }


                if (
                    themeData.preference
                ) {

                    localStorage.setItem(
                        THEME_SETTINGS_KEY,
                        themeData.preference
                    );


                    themeSelect.value =
                        themeData.preference;

                }

            }
        );

    }

}


// ============================================================
// SYSTEM THEME CHANGES
// ============================================================

function connectSystemThemeDetection() {

    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    function handleSystemThemeChange() {

        const currentTheme =
            getThemeSetting();


        if (
            currentTheme !== "system"
        ) {

            return;

        }


        /*
            The Electron main process normally
            handles this automatically.

            This fallback keeps the settings page
            synchronized if the renderer notices
            the Windows theme change first.
        */

        let resolvedTheme =
            mediaQuery.matches
                ? "dark"
                : "light";


        document.documentElement
            .setAttribute(
                "data-theme",
                resolvedTheme
            );


        updateThemeIcon(
            resolvedTheme
        );

    }


    if (
        typeof mediaQuery.addEventListener ===
        "function"
    ) {

        mediaQuery.addEventListener(
            "change",
            handleSystemThemeChange
        );

    }

    else if (
        typeof mediaQuery.addListener ===
        "function"
    ) {

        mediaQuery.addListener(
            handleSystemThemeChange
        );

    }

}


// ============================================================
// MUSIC SETTINGS
// ============================================================

function getMusicSettings() {

    const defaults = {
        enabled: true,
        volume: 0.5
    };


    try {

        const saved =
            localStorage.getItem(
                MUSIC_SETTINGS_KEY
            );


        if (!saved) {

            return defaults;

        }


        const parsed =
            JSON.parse(saved);


        return {

            enabled:
                parsed.enabled !== false,

            volume:
                typeof parsed.volume === "number"
                    ? Math.max(
                        0,
                        Math.min(
                            1,
                            parsed.volume
                        )
                    )
                    : 0.5

        };

    }

    catch {

        return defaults;

    }

}


// ============================================================
// SAVE MUSIC SETTINGS
// ============================================================

function saveMusicSettings(
    enabled,
    volume
) {

    localStorage.setItem(
        MUSIC_SETTINGS_KEY,

        JSON.stringify({
            enabled,
            volume
        })
    );

}


// ============================================================
// LOAD MUSIC SETTINGS
// ============================================================

function loadMusicSettings() {

    const settings =
        getMusicSettings();


    const musicEnabled =
        document.getElementById(
            "musicEnabled"
        );


    const musicVolume =
        document.getElementById(
            "musicVolume"
        );


    const volumeText =
        document.getElementById(
            "volumeText"
        );


    if (musicEnabled) {

        musicEnabled.checked =
            settings.enabled;

    }


    if (musicVolume) {

        musicVolume.value =
            Math.round(
                settings.volume * 100
            );

    }


    if (volumeText) {

        volumeText.textContent =
            Math.round(
                settings.volume * 100
            ) + "%";

    }

}


// ============================================================
// LOAD ACCOUNT
// ============================================================

async function loadAccount() {

    try {

        if (
            !window.blockworldProfile ||
            !window.blockworldProfile.getMine
        ) {

            console.error(
                "BlockWorld Profile API is unavailable."
            );

            return;

        }


        const result =
            await window.blockworldProfile.getMine();


        if (
            !result ||
            !result.success
        ) {

            console.error(
                "Could not load account:",
                result?.message
            );

            return;

        }


        const profile =
            result.profile;


        if (!profile) {

            return;

        }


        currentProfile =
            profile;


        // ----------------------------------------------------
        // DISPLAY NAME
        // ----------------------------------------------------

        const displayName =
            document.getElementById(
                "displayName"
            );


        const displayNameInput =
            document.getElementById(
                "displayNameInput"
            );


        if (displayName) {

            displayName.textContent =
                profile.display_name ||
                "Unknown";

        }


        if (displayNameInput) {

            displayNameInput.value =
                profile.display_name ||
                "";

        }


        // ----------------------------------------------------
        // USERNAME
        // ----------------------------------------------------

        const username =
            document.getElementById(
                "username"
            );


        if (username) {

            username.textContent =
                "@" +
                (
                    profile.username ||
                    "unknown"
                );

        }


        // ----------------------------------------------------
        // GOLDEN BLOCKS
        // ----------------------------------------------------

        const goldenBlocks =
            document.getElementById(
                "goldenBlocks"
            );


        if (goldenBlocks) {

            goldenBlocks.textContent =
                profile.golden_blocks ?? 0;

        }


        // ----------------------------------------------------
        // FRIEND REQUEST SETTING
        // ----------------------------------------------------

        const friendRequestsEnabled =
            document.getElementById(
                "friendRequestsEnabled"
            );


        if (friendRequestsEnabled) {

            /*
                If the database does not have the
                setting yet, default to ON.
            */

            friendRequestsEnabled.checked =
                profile.allow_friend_requests !== false;

        }


    }

    catch (error) {

        console.error(
            "Settings account error:",
            error
        );

    }

}


// ============================================================
// SAVE DISPLAY NAME
// ============================================================

async function saveDisplayName() {

    const input =
        document.getElementById(
            "displayNameInput"
        );


    const button =
        document.getElementById(
            "saveDisplayNameButton"
        );


    if (!input || !button) {

        return;

    }


    const displayName =
        input.value.trim();


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!displayName) {

        alert(
            "Please enter a display name."
        );

        input.focus();

        return;

    }


    if (
        displayName.length > 30
    ) {

        alert(
            "Display names can be 30 characters or less."
        );

        input.focus();

        return;

    }


    // --------------------------------------------------------
    // CHECK API
    // --------------------------------------------------------

    if (
        !window.blockworldProfile ||
        typeof
            window.blockworldProfile
                .changeDisplayName !==
            "function"
    ) {

        alert(
            "Display name editing is unavailable."
        );

        return;

    }


    button.disabled =
        true;


    button.textContent =
        "SAVING...";


    try {

        const result =
            await window.blockworldProfile
                .changeDisplayName(
                    displayName
                );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Could not change display name."
            );

        }


        // ----------------------------------------------------
        // UPDATE PAGE
        // ----------------------------------------------------

        const newDisplayName =
            result.profile?.display_name ||
            displayName;


        const displayNameElement =
            document.getElementById(
                "displayName"
            );


        if (displayNameElement) {

            displayNameElement.textContent =
                newDisplayName;

        }


        input.value =
            newDisplayName;


        if (currentProfile) {

            currentProfile.display_name =
                newDisplayName;

        }


        button.textContent =
            "SAVED";


        setTimeout(
            () => {

                button.textContent =
                    "SAVE";

            },
            1200
        );

    }

    catch (error) {

        console.error(
            "Display name error:",
            error
        );


        alert(
            error.message ||
            "Could not change display name."
        );


        button.textContent =
            "SAVE";

    }

    finally {

        button.disabled =
            false;

    }

}


// ============================================================
// FRIEND REQUEST SETTING
// ============================================================

async function saveFriendRequestSetting(
    enabled
) {

    const toggle =
        document.getElementById(
            "friendRequestsEnabled"
        );


    if (!toggle) {

        return;

    }


    try {

        if (
            !window.blockworldProfile ||
            typeof
                window.blockworldProfile
                    .setFriendRequestsEnabled !==
                "function"
        ) {

            throw new Error(
                "Friend request settings are unavailable."
            );

        }


        toggle.disabled =
            true;


        const result =
            await window.blockworldProfile
                .setFriendRequestsEnabled(
                    enabled
                );


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result?.message ||
                "Could not save friend request setting."
            );

        }


        if (currentProfile) {

            currentProfile.allow_friend_requests =
                enabled;

        }


        console.log(
            "Friend requests:",
            enabled
                ? "enabled"
                : "disabled"
        );

    }

    catch (error) {

        console.error(
            "Friend request setting error:",
            error
        );


        /*
            If saving failed, put the switch
            back to its previous state.
        */

        toggle.checked =
            !enabled;


        alert(
            error.message ||
            "Could not save friend request setting."
        );

    }

    finally {

        toggle.disabled =
            false;

    }

}


// ============================================================
// CONNECT MUSIC CONTROLS
// ============================================================

function connectMusicControls() {

    const musicEnabled =
        document.getElementById(
            "musicEnabled"
        );


    const musicVolume =
        document.getElementById(
            "musicVolume"
        );


    const volumeText =
        document.getElementById(
            "volumeText"
        );


    if (
        musicEnabled
    ) {

        musicEnabled.addEventListener(
            "change",
            () => {

                const settings =
                    getMusicSettings();


                saveMusicSettings(
                    musicEnabled.checked,
                    settings.volume
                );


                if (
                    window.blockWorldMusic
                ) {

                    if (
                        musicEnabled.checked
                    ) {

                        window.blockWorldMusic.start();

                    }

                    else {

                        window.blockWorldMusic.stop();

                    }

                }

            }
        );

    }


    if (
        musicVolume
    ) {

        musicVolume.addEventListener(
            "input",
            () => {

                const volume =
                    Number(
                        musicVolume.value
                    ) / 100;


                if (volumeText) {

                    volumeText.textContent =
                        Math.round(
                            volume * 100
                        ) + "%";

                }


                const settings =
                    getMusicSettings();


                saveMusicSettings(
                    settings.enabled,
                    volume
                );


                if (
                    window.blockWorldMusic
                ) {

                    window.blockWorldMusic.setVolume(
                        volume
                    );

                }

            }
        );

    }

}


// ============================================================
// CONNECT ACCOUNT CONTROLS
// ============================================================

function connectAccountControls() {

    const saveButton =
        document.getElementById(
            "saveDisplayNameButton"
        );


    const displayNameInput =
        document.getElementById(
            "displayNameInput"
        );


    const friendRequestsEnabled =
        document.getElementById(
            "friendRequestsEnabled"
        );


    if (
        saveButton
    ) {

        saveButton.addEventListener(
            "click",
            saveDisplayName
        );

    }


    if (
        displayNameInput
    ) {

        displayNameInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    saveDisplayName();

                }

            }
        );

    }


    if (
        friendRequestsEnabled
    ) {

        friendRequestsEnabled.addEventListener(
            "change",
            () => {

                saveFriendRequestSetting(
                    friendRequestsEnabled.checked
                );

            }
        );

    }

}


// ============================================================
// NAVIGATION
// ============================================================

function connectNavigation() {

    const backButton =
        document.getElementById(
            "backButton"
        );


    if (!backButton) {

        return;

    }


    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../index.html";

        }
    );

}


// ============================================================
// GAME BUTTONS
// ============================================================

function connectGameButtons() {

    const graphicsButton =
        document.getElementById(
            "graphicsButton"
        );


    const soundButton =
        document.getElementById(
            "soundButton"
        );


    const controlsButton =
        document.getElementById(
            "controlsButton"
        );


    if (graphicsButton) {

        graphicsButton.addEventListener(
            "click",
            () => {

                console.log(
                    "Graphics settings coming soon."
                );

            }
        );

    }


    if (soundButton) {

        soundButton.addEventListener(
            "click",
            () => {

                console.log(
                    "Sound effects settings coming soon."
                );

            }
        );

    }


    if (controlsButton) {

        controlsButton.addEventListener(
            "click",
            () => {

                console.log(
                    "Controls settings coming soon."
                );

            }
        );

    }

}


// ============================================================
// INITIALIZE SETTINGS
// ============================================================

async function initializeSettings() {

    /*
        Theme loads FIRST.

        The global Solaria theme system controls
        the entire application.
    */

    await loadThemeSettings();

    connectThemeControls();

    connectSystemThemeDetection();


    // Existing systems

    loadMusicSettings();

    loadAccount();

    connectMusicControls();

    connectAccountControls();

    connectNavigation();

    connectGameButtons();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);