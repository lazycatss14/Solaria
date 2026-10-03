// ============================================================
// SOLARIA PRELOAD
// ============================================================

const {
    contextBridge,
    ipcRenderer
} = require("electron");


// ============================================================
// AUTHENTICATION
// ============================================================

contextBridge.exposeInMainWorld(
    "blockworldAuth",
    {

        // ----------------------------------------------------
        // CREATE ACCOUNT
        // ----------------------------------------------------

        signUp:
            (
                email,
                password
            ) =>
                ipcRenderer.invoke(
                    "auth-sign-up",
                    {
                        email,
                        password
                    }
                ),


        // ----------------------------------------------------
        // LOGIN WITH EMAIL
        // ----------------------------------------------------

        signIn:
            (
                email,
                password
            ) =>
                ipcRenderer.invoke(
                    "auth-sign-in",
                    {
                        email,
                        password
                    }
                ),


        // ----------------------------------------------------
        // LOGIN WITH USERNAME
        // ----------------------------------------------------

        signInWithUsername:
            (
                username,
                password
            ) =>
                ipcRenderer.invoke(
                    "auth-sign-in-username",
                    {
                        username,
                        password
                    }
                ),


        // ----------------------------------------------------
        // GOOGLE LOGIN
        // ----------------------------------------------------

        signInWithGoogle:
            () =>
                ipcRenderer.invoke(
                    "auth-google"
                ),


        // ----------------------------------------------------
        // LOG OUT
        // ----------------------------------------------------

        signOut:
            () =>
                ipcRenderer.invoke(
                    "auth-sign-out"
                ),


        // ----------------------------------------------------
        // GET CURRENT USER
        // ----------------------------------------------------

        getUser:
            () =>
                ipcRenderer.invoke(
                    "auth-get-user"
                ),


        // ----------------------------------------------------
        // GET CURRENT SESSION
        // ----------------------------------------------------

        getSession:
            () =>
                ipcRenderer.invoke(
                    "auth-get-session"
                ),


        // ----------------------------------------------------
        // PASSWORD RECOVERY
        // ----------------------------------------------------

        resetPassword:
            (
                email
            ) =>
                ipcRenderer.invoke(
                    "auth-reset-password",
                    {
                        email
                    }
                ),


        // ----------------------------------------------------
        // CHANGE PASSWORD
        // ----------------------------------------------------

        changePassword:
            (
                password
            ) =>
                ipcRenderer.invoke(
                    "auth-change-password",
                    {
                        password
                    }
                ),


        // ----------------------------------------------------
        // GOOGLE LOGIN SUCCESS
        // ----------------------------------------------------

        onGoogleLoginSuccess:
            callback => {

                ipcRenderer.on(
                    "google-login-success",
                    () => {

                        if (
                            typeof callback ===
                            "function"
                        ) {

                            callback();

                        }

                    }
                );

            },


        // ----------------------------------------------------
        // GOOGLE LOGIN ERROR
        // ----------------------------------------------------

        onGoogleLoginError:
            callback => {

                ipcRenderer.on(
                    "google-login-error",
                    (
                        event,
                        message
                    ) => {

                        if (
                            typeof callback ===
                            "function"
                        ) {

                            callback(
                                message
                            );

                        }

                    }
                );

            }

    }
);


// ============================================================
// PROFILE
// ============================================================

contextBridge.exposeInMainWorld(
    "blockworldProfile",
    {

        // ----------------------------------------------------
        // FIND PROFILE
        // ----------------------------------------------------

        findByUsername:
            username =>
                ipcRenderer.invoke(
                    "profile-find-by-username",
                    {
                        username
                    }
                ),


        // ----------------------------------------------------
        // SEARCH PROFILES
        // ----------------------------------------------------

        search:
            query =>
                ipcRenderer.invoke(
                    "profile-search",
                    {
                        query
                    }
                ),


        searchProfiles:
            query =>
                ipcRenderer.invoke(
                    "profile-search",
                    {
                        query
                    }
                ),


        // ----------------------------------------------------
        // CHECK USERNAME
        // ----------------------------------------------------

        checkUsername:
            username =>
                ipcRenderer.invoke(
                    "profile-check-username",
                    {
                        username
                    }
                ),


        // ----------------------------------------------------
        // CREATE PROFILE
        // ----------------------------------------------------

        create:
            (
                username,
                displayName
            ) =>
                ipcRenderer.invoke(
                    "profile-create",
                    {
                        username,
                        displayName
                    }
                ),


        // ----------------------------------------------------
        // GET MY PROFILE
        // ----------------------------------------------------

        getMine:
            () =>
                ipcRenderer.invoke(
                    "profile-get-mine"
                ),


        // ----------------------------------------------------
        // CHANGE DISPLAY NAME
        // ----------------------------------------------------

        changeDisplayName:
            displayName =>
                ipcRenderer.invoke(
                    "profile-change-display-name",
                    {
                        displayName
                    }
                ),


        // ----------------------------------------------------
        // FRIEND REQUEST SETTING
        // ----------------------------------------------------

        setFriendRequestsEnabled:
            enabled =>
                ipcRenderer.invoke(
                    "profile-set-friend-requests",
                    {
                        enabled
                    }
                ),


        getFriendRequestsEnabled:
            () =>
                ipcRenderer.invoke(
                    "profile-get-friend-requests"
                ),


        // ----------------------------------------------------
        // GOLDEN BLOCKS
        // ----------------------------------------------------

        getGoldenBlocks:
            () =>
                ipcRenderer.invoke(
                    "profile-get-golden-blocks"
                ),


        // ----------------------------------------------------
        // LAST SEEN
        // ----------------------------------------------------

        updateLastSeen:
            () =>
                ipcRenderer.invoke(
                    "profile-update-last-seen"
                )

    }
);


// ============================================================
// FRIENDS
// ============================================================

contextBridge.exposeInMainWorld(
    "blockworldFriends",
    {

        // ----------------------------------------------------
        // GET FRIEND STATUS
        // ----------------------------------------------------

        getStatus:
            username =>
                ipcRenderer.invoke(
                    "friends-get-status",
                    {
                        username
                    }
                ),


        // ----------------------------------------------------
        // SEND FRIEND REQUEST
        // ----------------------------------------------------

        sendRequest:
            username =>
                ipcRenderer.invoke(
                    "friends-send-request",
                    {
                        username
                    }
                ),


        // ----------------------------------------------------
        // ACCEPT FRIEND REQUEST
        // ----------------------------------------------------

        acceptRequest:
            username =>
                ipcRenderer.invoke(
                    "friends-accept-request",
                    {
                        username
                    }
                ),


        // ----------------------------------------------------
        // GET FRIENDS
        // ----------------------------------------------------

        getFriends:
            () =>
                ipcRenderer.invoke(
                    "friends-get-friends"
                ),


        // ----------------------------------------------------
        // GET INCOMING REQUESTS
        // ----------------------------------------------------

        getIncoming:
            () =>
                ipcRenderer.invoke(
                    "friends-get-incoming"
                ),


        // ----------------------------------------------------
        // GET OUTGOING REQUESTS
        // ----------------------------------------------------

        getOutgoing:
            () =>
                ipcRenderer.invoke(
                    "friends-get-outgoing"
                ),


        // ----------------------------------------------------
        // RESPOND TO REQUEST
        // ----------------------------------------------------

        respond:
            (
                friendshipId,
                action
            ) =>
                ipcRenderer.invoke(
                    "friends-respond",
                    {
                        friendshipId,
                        action
                    }
                ),


        // ----------------------------------------------------
        // REMOVE FRIEND
        // ----------------------------------------------------

        remove:
            friendshipId =>
                ipcRenderer.invoke(
                    "friends-remove",
                    {
                        friendshipId
                    }
                ),


        removeFriend:
            username =>
                ipcRenderer.invoke(
                    "friends-remove",
                    {
                        username
                    }
                )

    }
);


// ============================================================
// SOLARIA THEME
// ============================================================

contextBridge.exposeInMainWorld(
    "solariaTheme",
    {

        // ----------------------------------------------------
        // GET THEME
        // ----------------------------------------------------

        get:
            () =>
                ipcRenderer.invoke(
                    "theme-get"
                ),


        // ----------------------------------------------------
        // SET THEME
        // ----------------------------------------------------

        set:
            theme =>
                ipcRenderer.invoke(
                    "theme-set",
                    {
                        theme
                    }
                ),


        // ----------------------------------------------------
        // THEME CHANGED
        // ----------------------------------------------------

        onChanged:
            callback => {

                ipcRenderer.on(
                    "solaria-theme-changed",
                    (
                        event,
                        themeData
                    ) => {

                        if (
                            typeof callback ===
                            "function"
                        ) {

                            callback(
                                themeData
                            );

                        }

                    }
                );

            }

    }
);


// ============================================================
// SOLARIA ENGINE
// ============================================================

contextBridge.exposeInMainWorld(
    "solariaEngine",
    {

        // ----------------------------------------------------
        // LAUNCH GAME
        // ----------------------------------------------------

        launch:
            gameId =>
                ipcRenderer.invoke(
                    "solaria-engine-launch",
                    {
                        gameId
                    }
                ),


        // ----------------------------------------------------
        // CHECK IF ENGINE IS RUNNING
        // ----------------------------------------------------

        isRunning:
            () =>
                ipcRenderer.invoke(
                    "solaria-engine-is-running"
                ),


        // ----------------------------------------------------
        // STOP ENGINE
        // ----------------------------------------------------

        stop:
            () =>
                ipcRenderer.invoke(
                    "solaria-engine-stop"
                )

    }
);


// ============================================================
// READY
// ============================================================

console.log(
    "[Solaria] Preload API loaded."
);