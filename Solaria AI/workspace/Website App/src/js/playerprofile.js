/* ==========================================
   SOLARIA
   PLAYER PROFILE JAVASCRIPT
   COMPLETE REPLACEMENT
========================================== */

(function () {

    "use strict";


    /* ==========================================
       ELEMENTS
    ========================================== */

    const profileLogo =
        document.getElementById("profileLogo");

    const homeButton =
        document.getElementById("homeButton");

    const gamesButton =
        document.getElementById("gamesButton");

    const avatarButton =
        document.getElementById("avatarButton");

    const settingsButton =
        document.getElementById("settingsButton");

    const usernameDisplay =
        document.getElementById("usernameDisplay");

    const logoutButton =
        document.getElementById("logoutButton");

    const backButton =
        document.getElementById("backButton");

    const playerProfile =
        document.getElementById("playerProfile");

    const playerAvatar =
        document.getElementById("playerAvatar");

    const displayName =
        document.getElementById("playerDisplayName");

    const username =
        document.getElementById("playerUsername");

    const goldenBlocks =
        document.getElementById("playerGoldenBlocks");

    const playerStatus =
        document.getElementById("playerStatus");

    const message =
        document.getElementById("playerProfileMessage");

    const friendButton =
        document.getElementById("playerFriendButton");


    /* ==========================================
       URL PARAMETERS
    ========================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    let targetUsername =
        params.get("username");


    /* ==========================================
       STATE
    ========================================== */

    let targetProfile = null;

    let friendState = "none";

    let friendBusy = false;

    let viewingOwnProfile = false;


    /* ==========================================
       ONLINE STATUS
    ========================================== */

    function isOnline(lastSeen) {

        if (!lastSeen) {
            return false;
        }

        const time =
            new Date(lastSeen).getTime();

        if (Number.isNaN(time)) {
            return false;
        }

        const ONLINE_WINDOW =
            2 * 60 * 1000;

        const difference =
            Date.now() - time;

        return (
            difference >= 0 &&
            difference <= ONLINE_WINDOW
        );
    }


    /* ==========================================
       MESSAGE
    ========================================== */

    function showMessage(text) {

        if (message) {
            message.textContent =
                text || "";
        }
    }


    /* ==========================================
       LOADING
    ========================================== */

    function setLoading(loading) {

        if (!playerProfile) {
            return;
        }

        if (loading) {

            playerProfile.classList.add(
                "loading"
            );

        } else {

            playerProfile.classList.remove(
                "loading"
            );

        }
    }


    /* ==========================================
       FRIEND BUTTON
    ========================================== */

    function hideFriendButton() {

        if (!friendButton) {
            return;
        }

        friendButton.classList.add(
            "hidden"
        );

        friendButton.disabled =
            true;
    }


    function setFriendButton(state) {

        if (!friendButton) {
            return;
        }

        friendButton.classList.remove(
            "hidden",
            "request-sent",
            "accept",
            "remove"
        );

        friendButton.disabled =
            false;

        friendState =
            state;


        if (state === "none") {

            friendButton.textContent =
                "ADD FRIEND";

        }

        else if (state === "outgoing") {

            friendButton.textContent =
                "REQUEST SENT";

            friendButton.classList.add(
                "request-sent"
            );

            friendButton.disabled =
                true;

        }

        else if (state === "incoming") {

            friendButton.textContent =
                "ACCEPT FRIEND";

            friendButton.classList.add(
                "accept"
            );

        }

        else if (state === "accepted") {

            friendButton.textContent =
                "REMOVE FRIEND";

            friendButton.classList.add(
                "remove"
            );

        }

        else {

            hideFriendButton();

        }
    }


    /* ==========================================
       LOAD FRIEND STATUS
    ========================================== */

    async function loadFriendStatus() {

        if (!friendButton) {
            return;
        }

        if (viewingOwnProfile) {
            hideFriendButton();
            return;
        }

        if (!targetProfile) {
            hideFriendButton();
            return;
        }

        if (!window.blockworldFriends) {
            hideFriendButton();
            return;
        }

        if (
            typeof window.blockworldFriends.getStatus !==
            "function"
        ) {

            hideFriendButton();
            return;
        }


        try {

            const result =
                await window
                    .blockworldFriends
                    .getStatus(
                        targetProfile.username
                    );


            console.log(
                "[Solaria] Friend status:",
                result
            );


            if (
                !result ||
                result.success === false
            ) {

                hideFriendButton();
                return;
            }


            setFriendButton(
                result.status || "none"
            );


        } catch (error) {

            console.error(
                "[Solaria] Friend status error:",
                error
            );

            hideFriendButton();
        }
    }


    /* ==========================================
       FRIEND BUTTON ACTION
    ========================================== */

    async function handleFriendButton() {

        if (
            friendBusy ||
            !targetProfile ||
            viewingOwnProfile
        ) {

            return;
        }


        if (!window.blockworldFriends) {

            showMessage(
                "The friend system is unavailable."
            );

            return;
        }


        friendBusy =
            true;

        friendButton.disabled =
            true;


        try {

            /* ======================================
               SEND REQUEST
            ====================================== */

            if (friendState === "none") {

                showMessage(
                    "Sending friend request..."
                );


                const result =
                    await window
                        .blockworldFriends
                        .sendRequest(
                            targetProfile.username
                        );


                console.log(
                    "[Solaria] Send friend request:",
                    result
                );


                if (
                    !result ||
                    result.success === false
                ) {

                    showMessage(
                        result?.message ||
                        result?.error ||
                        "Could not send friend request."
                    );

                    return;
                }


                setFriendButton(
                    "outgoing"
                );

                showMessage(
                    "Friend request sent."
                );
            }


            /* ======================================
               ACCEPT REQUEST
            ====================================== */

            else if (friendState === "incoming") {

                showMessage(
                    "Accepting friend request..."
                );


                const result =
                    await window
                        .blockworldFriends
                        .acceptRequest(
                            targetProfile.username
                        );


                console.log(
                    "[Solaria] Accept friend request:",
                    result
                );


                if (
                    !result ||
                    result.success === false
                ) {

                    showMessage(
                        result?.message ||
                        result?.error ||
                        "Could not accept friend request."
                    );

                    return;
                }


                setFriendButton(
                    "accepted"
                );

                showMessage(
                    "You are now friends!"
                );
            }


            /* ======================================
               REMOVE FRIEND
            ====================================== */

            else if (friendState === "accepted") {

                showMessage(
                    "Removing friend..."
                );


                const result =
                    await window
                        .blockworldFriends
                        .removeFriend(
                            targetProfile.username
                        );


                console.log(
                    "[Solaria] Remove friend:",
                    result
                );


                if (
                    !result ||
                    result.success === false
                ) {

                    showMessage(
                        result?.message ||
                        result?.error ||
                        "Could not remove friend."
                    );

                    return;
                }


                setFriendButton(
                    "none"
                );

                showMessage(
                    "Friend removed."
                );
            }


        } catch (error) {

            console.error(
                "[Solaria] Friend button error:",
                error
            );

            showMessage(
                error.message ||
                "Something went wrong."
            );


        } finally {

            friendBusy =
                false;


            if (
                friendState !==
                "outgoing"
            ) {

                friendButton.disabled =
                    false;
            }
        }
    }


    /* ==========================================
       NAVIGATION
    ========================================== */

    function goHome() {

        window.location.href =
            "../index.html";
    }


    /*
     * Games page is now the central place
     * for finding games and opening Game Profiles.
     */

    function goGames() {

        window.location.href =
            "./games.html";
    }


    function goAvatar() {

        window.location.href =
            "./avatar.html";
    }


    function goSettings() {

        window.location.href =
            "./settings.html";
    }


    /*
     * Return to the search page.
     */

    function goBack() {

        window.location.href =
            "./search.html";
    }


    /* ==========================================
       LOG OUT
    ========================================== */

    async function performLogout() {

        try {

            if (window.blockworldAuth) {

                await window
                    .blockworldAuth
                    .signOut();
            }

        } catch (error) {

            console.error(
                "[Solaria] Logout error:",
                error
            );
        }


        window.location.href =
            "../index.html";
    }


    /* ==========================================
       LOAD CURRENT USER
    ========================================== */

    async function loadCurrentUser() {

        try {

            if (
                !window.blockworldProfile ||
                typeof window
                    .blockworldProfile
                    .getMine !==
                "function"
            ) {

                return null;
            }


            const result =
                await window
                    .blockworldProfile
                    .getMine();


            console.log(
                "[Solaria] Current user profile:",
                result
            );


            if (
                result &&
                result.success &&
                result.profile
            ) {

                if (usernameDisplay) {

                    usernameDisplay.textContent =
                        "@" +
                        (
                            result.profile.username ||
                            "Player"
                        );
                }


                /*
                 * Keep the current user's
                 * last_seen timestamp fresh.
                 */

                if (
                    window.blockworldProfile &&
                    typeof window
                        .blockworldProfile
                        .updateLastSeen ===
                    "function"
                ) {

                    await window
                        .blockworldProfile
                        .updateLastSeen();
                }


                return result.profile;
            }


        } catch (error) {

            console.error(
                "[Solaria] Current user error:",
                error
            );
        }


        return null;
    }


    /* ==========================================
       DISPLAY PROFILE
    ========================================== */

    function displayPlayerProfile(profile) {

        targetProfile =
            profile;


        if (!targetProfile) {

            showPlayerNotFound(
                targetUsername || "",
                "This player does not exist."
            );

            return;
        }


        if (displayName) {

            displayName.textContent =
                targetProfile.display_name ||
                targetProfile.username ||
                "Player";
        }


        if (username) {

            username.textContent =
                "@" +
                (
                    targetProfile.username ||
                    targetUsername ||
                    "Player"
                );
        }


        const blocks =
            Number(
                targetProfile.golden_blocks ||
                0
            );


        if (goldenBlocks) {

            goldenBlocks.textContent =
                blocks.toLocaleString();
        }


        /* ======================================
           ONLINE STATUS
        ====================================== */

        if (playerStatus) {

            if (
                isOnline(
                    targetProfile.last_seen
                )
            ) {

                playerStatus.textContent =
                    "ONLINE";

            } else {

                playerStatus.textContent =
                    "OFFLINE";
            }
        }


        /*
         * Keep the existing avatar placeholder
         * for now.
         *
         * The full connected Solaria avatar
         * can be plugged into this element
         * without changing the profile system.
         */

        if (playerAvatar) {

            playerAvatar.textContent =
                "👤";
        }


        showMessage("");

        setLoading(false);
    }


    /* ==========================================
       PLAYER NOT FOUND
    ========================================== */

    function showPlayerNotFound(
        requestedUsername,
        errorMessage
    ) {

        setLoading(false);

        hideFriendButton();


        if (displayName) {

            displayName.textContent =
                "Player not found";
        }


        if (username) {

            username.textContent =
                requestedUsername
                    ? "@" + requestedUsername
                    : "";
        }


        if (goldenBlocks) {

            goldenBlocks.textContent =
                "0";
        }


        if (playerStatus) {

            playerStatus.textContent =
                "OFFLINE";
        }


        if (playerAvatar) {

            playerAvatar.textContent =
                "❓";
        }


        showMessage(
            errorMessage ||
            "This player does not exist."
        );
    }


    /* ==========================================
       LOAD PLAYER PROFILE
    ========================================== */

    async function loadPlayerProfile(
        currentUser
    ) {

        /*
         * No username means this is the
         * currently logged-in user's profile.
         */

        if (!targetUsername) {

            console.log(
                "[Solaria] No target username supplied."
            );


            if (!currentUser) {

                showPlayerNotFound(
                    "",
                    "Could not load your Solaria profile."
                );

                return;
            }


            targetUsername =
                currentUser.username;


            viewingOwnProfile =
                true;


            displayPlayerProfile(
                currentUser
            );


            hideFriendButton();

            return;
        }


        if (
            !window.blockworldProfile ||
            typeof window
                .blockworldProfile
                .findByUsername !==
            "function"
        ) {

            showPlayerNotFound(
                targetUsername,
                "The Solaria profile system is unavailable."
            );

            return;
        }


        setLoading(true);

        showMessage(
            "Loading profile..."
        );


        try {

            console.log(
                "[Solaria] Looking up player:",
                targetUsername
            );


            const result =
                await window
                    .blockworldProfile
                    .findByUsername(
                        targetUsername
                    );


            console.log(
                "[Solaria] Player lookup result:",
                result
            );


            if (
                !result ||
                result.success === false ||
                !result.profile
            ) {

                showPlayerNotFound(
                    targetUsername,
                    result?.message ||
                    result?.error ||
                    "This player does not exist."
                );

                return;
            }


            /*
             * Determine whether the profile belongs
             * to the logged-in user.
             */

            if (
                currentUser &&
                currentUser.id &&
                result.profile.id
            ) {

                viewingOwnProfile =
                    currentUser.id ===
                    result.profile.id;

            } else {

                viewingOwnProfile =
                    !!(
                        currentUser &&
                        currentUser.username &&
                        result.profile.username &&
                        currentUser.username
                            .toLowerCase() ===
                        result.profile.username
                            .toLowerCase()
                    );
            }


            displayPlayerProfile(
                result.profile
            );


            await loadFriendStatus();


            console.log(
                "[Solaria] Player profile loaded:",
                result.profile
            );


        } catch (error) {

            console.error(
                "[Solaria] Player profile error:",
                error
            );


            showPlayerNotFound(
                targetUsername,
                error.message ||
                "Could not load this profile."
            );
        }
    }


    /* ==========================================
       REFRESH ONLINE STATUS
    ========================================== */

    async function refreshOnlineStatus() {

        if (!targetProfile) {
            return;
        }


        try {

            /*
             * Our own last_seen is updated
             * separately by loadCurrentUser().
             */

            if (viewingOwnProfile) {
                return;
            }


            if (
                !window.blockworldProfile ||
                typeof window
                    .blockworldProfile
                    .findByUsername !==
                "function"
            ) {

                return;
            }


            const result =
                await window
                    .blockworldProfile
                    .findByUsername(
                        targetProfile.username
                    );


            if (
                result &&
                result.success &&
                result.profile
            ) {

                targetProfile =
                    result.profile;


                if (playerStatus) {

                    playerStatus.textContent =
                        isOnline(
                            targetProfile.last_seen
                        )
                            ? "ONLINE"
                            : "OFFLINE";
                }
            }


        } catch (error) {

            console.error(
                "[Solaria] Online status refresh error:",
                error
            );
        }
    }


    /* ==========================================
       BUTTON EVENTS
    ========================================== */

    if (profileLogo) {

        profileLogo.style.cursor =
            "pointer";

        profileLogo.addEventListener(
            "click",
            goHome
        );
    }


    if (homeButton) {

        homeButton.addEventListener(
            "click",
            goHome
        );
    }


    if (gamesButton) {

        gamesButton.addEventListener(
            "click",
            goGames
        );
    }


    if (avatarButton) {

        avatarButton.addEventListener(
            "click",
            goAvatar
        );
    }


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            goSettings
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            goBack
        );
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            performLogout
        );
    }


    if (friendButton) {

        friendButton.addEventListener(
            "click",
            handleFriendButton
        );
    }


    /* ==========================================
       PUBLIC PROFILE API
    ========================================== */

    /*
     * Other Solaria pages can use this if
     * they need to know which profile is open.
     */

    window.SolariaPlayerProfile = {

        getProfile() {

            return targetProfile;
        },

        getUsername() {

            return targetProfile
                ? targetProfile.username
                : null;
        },

        isOwnProfile() {

            return viewingOwnProfile;
        },

        refresh() {

            return loadPlayerProfile(
                null
            );
        }

    };


    /* ==========================================
       INITIALIZE
    ========================================== */

    async function initialize() {

        console.log(
            "================================"
        );

        console.log(
            "Solaria Player Profile"
        );

        console.log(
            "Target:",
            targetUsername
        );

        console.log(
            "URL:",
            window.location.href
        );

        console.log(
            "================================"
        );


        setLoading(true);


        const currentUser =
            await loadCurrentUser();


        await loadPlayerProfile(
            currentUser
        );


        /*
         * Refresh another player's
         * online status every 30 seconds.
         */

        setInterval(
            refreshOnlineStatus,
            30000
        );
    }


    /* ==========================================
       START
    ========================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }


})();