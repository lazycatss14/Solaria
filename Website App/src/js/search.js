/* ==========================================
   SOLARIA
   SEARCH PAGE JAVASCRIPT
========================================== */

(function () {

    "use strict";


    /* ==========================================
       ELEMENTS
    ========================================== */

    const logo =
        document.getElementById(
            "searchLogo"
        );


    const homeButton =
        document.getElementById(
            "searchHomeButton"
        );


    const gamesButton =
        document.getElementById(
            "searchGamesButton"
        );


    const avatarButton =
        document.getElementById(
            "searchAvatarButton"
        );


    const settingsButton =
        document.getElementById(
            "searchSettingsButton"
        );


    const logoutButton =
        document.getElementById(
            "searchLogoutButton"
        );


    const backButton =
        document.getElementById(
            "backFromSearchButton"
        );


    const usernameDisplay =
        document.getElementById(
            "searchUsernameDisplay"
        );


    const searchInput =
        document.getElementById(
            "playerSearchInput"
        );


    const searchButton =
        document.getElementById(
            "playerSearchButton"
        );


    /* ==========================================
       NAVIGATION
    ========================================== */

    function goHome() {

        console.log(
            "Solaria: Going Home"
        );


        window.location.href =
            "../index.html";

    }


    function goGames() {

        console.log(
            "Solaria: Going to Games"
        );


        window.location.href =
            "./games.html";

    }


    function goAvatar() {

        console.log(
            "Solaria: Going to Avatar"
        );


        window.location.href =
            "./avatar.html";

    }


    function goSettings() {

        console.log(
            "Solaria: Going to Settings"
        );


        window.location.href =
            "./settings.html";

    }


    /* ==========================================
       LOGO
    ========================================== */

    if (logo) {

        logo.addEventListener(
            "click",
            goHome
        );

    }


    /* ==========================================
       HOME BUTTON
    ========================================== */

    if (homeButton) {

        homeButton.addEventListener(
            "click",
            goHome
        );

    }


    /* ==========================================
       BACK BUTTON
    ========================================== */

    if (backButton) {

        backButton.addEventListener(
            "click",
            goHome
        );

    }


    /* ==========================================
       GAMES BUTTON
    ========================================== */

    if (gamesButton) {

        gamesButton.addEventListener(
            "click",
            goGames
        );

    }


    /* ==========================================
       AVATAR BUTTON
    ========================================== */

    if (avatarButton) {

        avatarButton.addEventListener(
            "click",
            goAvatar
        );

    }


    /* ==========================================
       SETTINGS BUTTON
    ========================================== */

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            goSettings
        );

    }


    /* ==========================================
       LOAD ACCOUNT
    ========================================== */

    async function loadAccount() {

        try {

            /* ------------------------------------------
               CHECK AUTH
            ------------------------------------------ */

            if (
                !window.blockworldAuth
            ) {

                console.warn(
                    "Solaria Auth API not found."
                );

                return;

            }


            if (
                typeof window.blockworldAuth.getUser !==
                "function"
            ) {

                console.warn(
                    "Solaria getUser() not found."
                );

                return;

            }


            /* ------------------------------------------
               GET CURRENT USER
            ------------------------------------------ */

            const userResult =
                await window.blockworldAuth.getUser();


            if (
                !userResult ||
                !userResult.success ||
                !userResult.user
            ) {

                console.warn(
                    "No logged-in Solaria user."
                );

                return;

            }


            /* ------------------------------------------
               CHECK PROFILE API
            ------------------------------------------ */

            if (
                !window.blockworldProfile
            ) {

                console.warn(
                    "Solaria Profile API not found."
                );

                return;

            }


            if (
                typeof window.blockworldProfile.getMine !==
                "function"
            ) {

                console.warn(
                    "Solaria getMine() not found."
                );

                return;

            }


            /* ------------------------------------------
               GET PROFILE
            ------------------------------------------ */

            const profileResult =
                await window.blockworldProfile.getMine();


            if (
                profileResult &&
                profileResult.success &&
                profileResult.profile
            ) {

                if (
                    usernameDisplay
                ) {

                    usernameDisplay.textContent =
                        "@" +
                        profileResult.profile.username;

                }

            }

        }

        catch (
            error
        ) {

            console.error(
                "Solaria account loading error:",
                error
            );

        }

    }


    /* ==========================================
       LOG OUT
    ========================================== */

    async function performLogout() {

        console.log(
            "Solaria: Logging out"
        );


        try {

            if (
                window.blockworldAuth &&
                typeof window.blockworldAuth.signOut ===
                "function"
            ) {

                await window.blockworldAuth.signOut();

            }

            else if (
                typeof window.logout ===
                "function"
            ) {

                await window.logout();

            }

            else {

                console.warn(
                    "No Solaria logout function found."
                );

            }

        }

        catch (
            error
        ) {

            console.error(
                "Solaria logout error:",
                error
            );

        }


        window.location.href =
            "../index.html";

    }


    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            performLogout
        );

    }


    /* ==========================================
       PLAYER SEARCH
    ========================================== */

    async function performSearch() {

        if (
            !searchInput
        ) {

            return;

        }


        const query =
            searchInput.value.trim();


        /* ------------------------------------------
           EMPTY SEARCH
        ------------------------------------------ */

        if (
            !query
        ) {

            if (
                window.blockworldPlayerSearch &&
                typeof window.blockworldPlayerSearch.clear ===
                "function"
            ) {

                window.blockworldPlayerSearch.clear();

            }

            /*
             * Remove the old search query from
             * the URL when the box is empty.
             */

            window.history.replaceState(
                {},
                "",
                "./search.html"
            );

            return;

        }


        console.log(
            "Solaria player search:",
            query
        );


        /* ------------------------------------------
           UPDATE URL
        ------------------------------------------ */

        const newUrl =
            "./search.html?q=" +
            encodeURIComponent(
                query
            );


        window.history.replaceState(
            {},
            "",
            newUrl
        );


        /* ------------------------------------------
           RUN PLAYER SEARCH
        ------------------------------------------ */

        if (
            window.blockworldPlayerSearch &&
            typeof window.blockworldPlayerSearch.search ===
            "function"
        ) {

            try {

                await window.blockworldPlayerSearch.search(
                    query
                );

            }

            catch (
                error
            ) {

                console.error(
                    "Solaria player search failed:",
                    error
                );

            }

        }

        else {

            console.error(
                "Solaria Player Search API not found."
            );

        }

    }


    /* ==========================================
       SEARCH BUTTON
    ========================================== */

    if (
        searchButton
    ) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    /* ==========================================
       ENTER KEY
    ========================================== */

    if (
        searchInput
    ) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch();

                }

            }
        );

    }


    /* ==========================================
       LOAD QUERY FROM URL
    ========================================== */

    async function loadQuery() {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const query =
            params.get(
                "q"
            );


        if (
            !query
        ) {

            return;

        }


        /* ------------------------------------------
           PUT QUERY INTO SEARCH BOX
        ------------------------------------------ */

        if (
            searchInput
        ) {

            searchInput.value =
                query;

        }


        /* ------------------------------------------
           RUN SEARCH
        ------------------------------------------ */

        if (
            window.blockworldPlayerSearch &&
            typeof window.blockworldPlayerSearch.search ===
            "function"
        ) {

            try {

                await window.blockworldPlayerSearch.search(
                    query
                );

            }

            catch (
                error
            ) {

                console.error(
                    "Solaria URL search failed:",
                    error
                );

            }

        }

        else {

            console.error(
                "Solaria Player Search API not found while loading URL query."
            );

        }

    }


    /* ==========================================
       INITIALIZE
    ========================================== */

    async function initializeSearchPage() {

        console.log(
            "Solaria Search page loaded."
        );


        await loadAccount();

        await loadQuery();

    }


    /* ==========================================
       START AFTER HTML LOADS
    ========================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeSearchPage
        );

    }

    else {

        initializeSearchPage();

    }

})();