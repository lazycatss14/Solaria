// ============================================================
// SOLARIA THEME SYSTEM
// ============================================================
// Light / Dark / System theme controller
//
// Works with the existing Solaria CSS variables:
//
//     data-theme="light"
//     data-theme="dark"
//     data-theme="system"
//
// Saves the user's choice in localStorage.
//
// ============================================================

(() => {
    "use strict";

    const STORAGE_KEY = "solaria-theme";

    const VALID_THEMES = [
        "light",
        "dark",
        "system"
    ];

    let currentTheme = "system";
    let systemThemeWatcher = null;

    // ========================================================
    // GET SYSTEM THEME
    // ========================================================

    function getSystemTheme() {
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return "dark";
        }

        return "light";
    }

    // ========================================================
    // GET ACTUAL THEME
    // ========================================================

    function getActualTheme(theme) {
        if (theme === "dark") {
            return "dark";
        }

        if (theme === "light") {
            return "light";
        }

        return getSystemTheme();
    }

    // ========================================================
    // CHECK THEME
    // ========================================================

    function isValidTheme(theme) {
        return VALID_THEMES.includes(theme);
    }

    // ========================================================
    // APPLY THEME
    // ========================================================

    function applyTheme(theme) {
        if (!isValidTheme(theme)) {
            theme = "system";
        }

        currentTheme = theme;

        const html = document.documentElement;
        const body = document.body;

        // This is the important part.
        //
        // Your existing CSS already listens for:
        //
        // html[data-theme="dark"]
        // html[data-theme="system"]
        //
        // So we only need to change this attribute.

        html.setAttribute("data-theme", theme);

        // Keep body synchronized too.
        //
        // This is useful because some existing Solaria CSS
        // checks body[data-theme="dark"].

        if (body) {
            body.setAttribute("data-theme", theme);
        }

        // Tell the browser which color scheme Solaria is using.
        //
        // "system" needs the actual system appearance.

        const actualTheme = getActualTheme(theme);

        html.style.colorScheme = actualTheme;

        if (body) {
            body.style.colorScheme = actualTheme;
        }

        // Update any theme controls currently on the page.

        updateThemeControls(theme);

        // Notify anything else in Solaria that wants to know
        // that the theme changed.

        window.dispatchEvent(
            new CustomEvent("solaria-theme-changed", {
                detail: {
                    theme: theme,
                    actualTheme: actualTheme
                }
            })
        );
    }

    // ========================================================
    // SAVE THEME
    // ========================================================

    function saveTheme(theme) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                theme
            );
        } catch (error) {
            console.warn(
                "[Solaria Theme] Could not save theme.",
                error
            );
        }
    }

    // ========================================================
    // LOAD THEME
    // ========================================================

    function loadTheme() {
        let savedTheme = null;

        try {
            savedTheme = localStorage.getItem(
                STORAGE_KEY
            );
        } catch (error) {
            console.warn(
                "[Solaria Theme] Could not read saved theme.",
                error
            );
        }

        if (!isValidTheme(savedTheme)) {
            savedTheme = "system";
        }

        currentTheme = savedTheme;

        applyTheme(savedTheme);
    }

    // ========================================================
    // SET THEME
    // ========================================================

    function setTheme(theme) {
        if (!isValidTheme(theme)) {
            console.warn(
                "[Solaria Theme] Invalid theme:",
                theme
            );

            theme = "system";
        }

        currentTheme = theme;

        saveTheme(theme);
        applyTheme(theme);
    }

    // ========================================================
    // GET SELECTED THEME
    // ========================================================

    function getTheme() {
        return currentTheme;
    }

    // ========================================================
    // GET ACTUAL THEME
    // ========================================================

    function getCurrentAppearance() {
        return getActualTheme(currentTheme);
    }

    // ========================================================
    // UPDATE THEME CONTROLS
    // ========================================================

    function updateThemeControls(theme) {
        // ----------------------------------------------------
        // Controls using:
        //
        // data-theme-option="light"
        // data-theme-option="dark"
        // data-theme-option="system"
        // ----------------------------------------------------

        const controls = document.querySelectorAll(
            "[data-theme-option]"
        );

        controls.forEach((control) => {
            const option =
                control.getAttribute(
                    "data-theme-option"
                );

            const selected =
                option === theme;

            control.classList.toggle(
                "active",
                selected
            );

            control.classList.toggle(
                "selected",
                selected
            );

            control.setAttribute(
                "aria-selected",
                selected ? "true" : "false"
            );

            // If this happens to be a radio input,
            // synchronize it automatically.

            if (
                control instanceof HTMLInputElement &&
                control.type === "radio"
            ) {
                control.checked = selected;
            }
        });

        // ----------------------------------------------------
        // Existing Solaria IDs
        // ----------------------------------------------------

        const lightButton =
            document.getElementById(
                "themeLight"
            );

        const darkButton =
            document.getElementById(
                "themeDark"
            );

        const systemButton =
            document.getElementById(
                "themeSystem"
            );

        if (lightButton) {
            lightButton.classList.toggle(
                "active",
                theme === "light"
            );

            lightButton.classList.toggle(
                "selected",
                theme === "light"
            );
        }

        if (darkButton) {
            darkButton.classList.toggle(
                "active",
                theme === "dark"
            );

            darkButton.classList.toggle(
                "selected",
                theme === "dark"
            );
        }

        if (systemButton) {
            systemButton.classList.toggle(
                "active",
                theme === "system"
            );

            systemButton.classList.toggle(
                "selected",
                theme === "system"
            );
        }

        // ----------------------------------------------------
        // Existing dropdown support
        //
        // If your Settings page has:
        //
        // <select id="themeSelect">
        //
        // this will automatically synchronize it.
        // ----------------------------------------------------

        const select =
            document.getElementById(
                "themeSelect"
            );

        if (select) {
            select.value = theme;
        }
    }

    // ========================================================
    // THEME CONTROL CLICK HANDLER
    // ========================================================

    function setupThemeControls() {
        document.addEventListener(
            "click",
            (event) => {
                const target =
                    event.target.closest(
                        "[data-theme-option]"
                    );

                if (!target) {
                    return;
                }

                const theme =
                    target.getAttribute(
                        "data-theme-option"
                    );

                if (!isValidTheme(theme)) {
                    return;
                }

                setTheme(theme);
            }
        );

        // ----------------------------------------------------
        // Existing button IDs
        // ----------------------------------------------------

        const lightButton =
            document.getElementById(
                "themeLight"
            );

        const darkButton =
            document.getElementById(
                "themeDark"
            );

        const systemButton =
            document.getElementById(
                "themeSystem"
            );

        if (lightButton) {
            lightButton.addEventListener(
                "click",
                () => {
                    setTheme("light");
                }
            );
        }

        if (darkButton) {
            darkButton.addEventListener(
                "click",
                () => {
                    setTheme("dark");
                }
            );
        }

        if (systemButton) {
            systemButton.addEventListener(
                "click",
                () => {
                    setTheme("system");
                }
            );
        }

        // ----------------------------------------------------
        // Existing dropdown
        // ----------------------------------------------------

        const select =
            document.getElementById(
                "themeSelect"
            );

        if (select) {
            select.addEventListener(
                "change",
                () => {
                    setTheme(select.value);
                }
            );
        }
    }

    // ========================================================
    // WATCH WINDOWS / SYSTEM THEME
    // ========================================================

    function setupSystemThemeWatcher() {
        if (!window.matchMedia) {
            return;
        }

        systemThemeWatcher =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        const handleSystemThemeChange = () => {
            // Only react to Windows/system changes if
            // the user selected "System".

            if (currentTheme !== "system") {
                return;
            }

            applyTheme("system");
        };

        // Modern browsers / Electron

        if (
            typeof systemThemeWatcher.addEventListener ===
            "function"
        ) {
            systemThemeWatcher.addEventListener(
                "change",
                handleSystemThemeChange
            );
        }

        // Older Electron compatibility

        else if (
            typeof systemThemeWatcher.addListener ===
            "function"
        ) {
            systemThemeWatcher.addListener(
                handleSystemThemeChange
            );
        }
    }

    // ========================================================
    // PUBLIC SOLARIA THEME API
    // ========================================================

    window.SolariaTheme = {

        // Get selected preference:
        // "light", "dark", or "system"

        getTheme: () => {
            return currentTheme;
        },

        // Get actual appearance:
        // "light" or "dark"

        getAppearance: () => {
            return getActualTheme(
                currentTheme
            );
        },

        // Change theme

        setTheme: (theme) => {
            setTheme(theme);
        },

        // Re-apply current theme

        refresh: () => {
            applyTheme(
                currentTheme
            );
        }
    };

    // ========================================================
    // START
    // ========================================================

    function initializeTheme() {
        // Apply System immediately.
        //
        // This prevents an unthemed flash while the saved
        // preference is being loaded.

        applyTheme("system");

        // Set up controls

        setupThemeControls();

        // Watch Windows appearance

        setupSystemThemeWatcher();

        // Finally load saved preference

        loadTheme();
    }

    // ========================================================
    // INITIALIZATION
    // ========================================================

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeTheme,
            {
                once: true
            }
        );
    } else {
        initializeTheme();
    }

})();