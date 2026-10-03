/* =========================================
   SOLARIA APP
========================================= */


/* =========================================
   SCREEN ELEMENTS
========================================= */

const signInScreen =
    document.getElementById("signInScreen");

const loginScreen =
    document.getElementById("loginScreen");

const profileSetupScreen =
    document.getElementById("profileSetupScreen");

const profileSetupDetailsScreen =
    document.getElementById("profileSetupDetailsScreen");

const homeScreen =
    document.getElementById("homeScreen");

const searchScreen =
    document.getElementById("searchScreen");

const playerProfileScreen =
    document.getElementById("playerProfileScreen");


/* =========================================
   GOOGLE PROFILE SETUP USER
========================================= */

let googleSetupUser = null;


/* =========================================
   HIDE ALL SCREENS
========================================= */

function hideAllScreens() {

    const screens = [
        signInScreen,
        loginScreen,
        profileSetupScreen,
        profileSetupDetailsScreen,
        homeScreen,
        searchScreen,
        playerProfileScreen
    ];

    screens.forEach(screen => {

        if (screen) {

            screen.classList.add("hidden");

        }

    });

}


/* =========================================
   SHOW SIGN IN
========================================= */

function showSignIn() {

    hideAllScreens();

    if (signInScreen) {

        signInScreen.classList.remove("hidden");

    }

}


/* =========================================
   SHOW LOGIN
========================================= */

function showLogin() {

    hideAllScreens();

    if (loginScreen) {

        loginScreen.classList.remove("hidden");

    }

}


/* =========================================
   SHOW CREATE ACCOUNT
========================================= */

function showProfileSetup() {

    hideAllScreens();

    if (profileSetupScreen) {

        profileSetupScreen.classList.remove("hidden");

    }

}


/* =========================================
   SHOW PROFILE DETAILS
========================================= */

function showProfileSetupDetails(user = null) {

    if (user) {

        googleSetupUser = user;

    }

    hideAllScreens();

    if (profileSetupDetailsScreen) {

        profileSetupDetailsScreen.classList.remove("hidden");

    }

}


/* =========================================
   ACCOUNT DISPLAYS
========================================= */

function updateAccountDisplays(
    profile,
    user
) {

    const username =
        profile &&
        profile.username
            ? "@" + profile.username
            : (
                user &&
                user.email
                    ? user.email
                    : "@player"
            );

    const displayName =
        profile &&
        profile.display_name
            ? profile.display_name
            : "Player";


    const usernameDisplay =
        document.getElementById(
            "usernameDisplay"
        );

    if (usernameDisplay) {

        usernameDisplay.textContent =
            username;

    }


    const welcomeDisplayName =
        document.getElementById(
            "welcomeDisplayName"
        );

    if (welcomeDisplayName) {

        welcomeDisplayName.textContent =
            displayName;

    }


    const searchUsernameDisplay =
        document.getElementById(
            "searchUsernameDisplay"
        );

    if (searchUsernameDisplay) {

        searchUsernameDisplay.textContent =
            username;

    }


    const profileUsernameDisplay =
        document.getElementById(
            "profileUsernameDisplay"
        );

    if (profileUsernameDisplay) {

        profileUsernameDisplay.textContent =
            username;

    }

}


/* =========================================
   SHOW HOME
========================================= */

async function showHome(
    user
) {

    hideAllScreens();

    if (homeScreen) {

        homeScreen.classList.remove(
            "hidden"
        );

    }


    let profile = null;


    try {

        if (
            window.blockworldProfile &&
            typeof window.blockworldProfile.getMine ===
            "function"
        ) {

            const result =
                await window.blockworldProfile.getMine();


            if (
                result &&
                result.success &&
                result.profile
            ) {

                profile =
                    result.profile;

            }

        }

    } catch (error) {

        console.error(
            "[Solaria] Could not load profile:",
            error
        );

    }


    updateAccountDisplays(
        profile,
        user
    );


    /* =========================================
       UPDATE PRESENCE
    ========================================= */

    try {

        if (
            window.blockworldProfile &&
            typeof window.blockworldProfile.updateLastSeen ===
            "function"
        ) {

            await window.blockworldProfile.updateLastSeen();

        }

    } catch (error) {

        console.error(
            "[Solaria] Could not update online status:",
            error
        );

    }


    /* =========================================
       LOAD FRIENDS
    ========================================= */

    if (
        typeof window.loadFriends ===
        "function"
    ) {

        window.loadFriends();

    }


    /* =========================================
       START MUSIC
    ========================================= */

    if (
        window.blockWorldMusic &&
        typeof window.blockWorldMusic.start ===
        "function"
    ) {

        window.blockWorldMusic.start();

    }

}


/* =========================================
   OPEN SEARCH
========================================= */

function showSearch(
    query = ""
) {

    const cleanQuery =
        String(query || "").trim();


    const searchUrl =
        "./screens/search.html?q=" +
        encodeURIComponent(
            cleanQuery
        );


    window.location.href =
        searchUrl;

}


/* =========================================
   OPEN SETTINGS
========================================= */

function openSettings() {

    window.location.href =
        "./screens/settings.html";

}


/* =========================================
   OPEN GAMES
========================================= */

function openGames() {

    window.location.href =
        "./screens/games.html";

}


/* =========================================
   OPEN FRIEND SEARCH
========================================= */

function openFriendSearch() {

    window.location.href =
        "./screens/search.html";

}


/* =========================================
   LOG OUT
========================================= */

async function handleLogout() {

    try {

        const result =
            await logout();


        if (
            result &&
            result.success === false
        ) {

            console.error(
                "[Solaria] Logout failed:",
                result.message
            );

            return;

        }


        googleSetupUser = null;

        showSignIn();

    } catch (error) {

        console.error(
            "[Solaria] Logout error:",
            error
        );

    }

}


/* =========================================
   LOGIN
========================================= */

async function handleLogin() {

    const identifierInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const rememberInput =
        document.getElementById(
            "rememberInput"
        );

    const errorElement =
        document.getElementById(
            "loginError"
        );


    const identifier =
        identifierInput
            ? identifierInput.value.trim()
            : "";


    const password =
        passwordInput
            ? passwordInput.value
            : "";


    const rememberMe =
        rememberInput
            ? rememberInput.checked
            : false;


    if (errorElement) {

        errorElement.textContent =
            "";

    }


    /* =========================================
       VALIDATION
    ========================================= */

    if (!identifier) {

        if (errorElement) {

            errorElement.textContent =
                "Enter your username or email.";

        }

        return;

    }


    if (!password) {

        if (errorElement) {

            errorElement.textContent =
                "Enter your password.";

        }

        return;

    }


    /* =========================================
       DISABLE BUTTON WHILE LOGGING IN
    ========================================= */

    const loginButton =
        document.getElementById(
            "loginButton"
        );


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            "LOGGING IN...";

    }


    try {

        /*
         * auth.js now decides whether this
         * is an email login or username login.
         *
         * identifier can therefore be:
         *
         * stefanriv14@gmail.com
         *
         * OR
         *
         * stefanriv14
         */

        const result =
            await login(
                identifier,
                password,
                rememberMe
            );


        if (
            !result ||
            result.success === false
        ) {

            if (errorElement) {

                errorElement.textContent =
                    result &&
                    result.message
                        ? result.message
                        : "Login failed.";

            }

            return;

        }


        if (
            result.needsEmailConfirmation
        ) {

            if (errorElement) {

                errorElement.textContent =
                    "Please confirm your email before logging in.";

            }

            return;

        }


        /*
         * If the account has no profile,
         * send it to profile setup instead
         * of showing Home.
         */

        if (
            !result.profile
        ) {

            showProfileSetupDetails(
                result.user
            );

            return;

        }


        /*
         * Clear the password field after
         * successful authentication.
         */

        if (passwordInput) {

            passwordInput.value =
                "";

        }


        await showHome(
            result.user
        );

    } catch (error) {

        console.error(
            "[Solaria] Login error:",
            error
        );


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Login failed.";

        }

    } finally {

        /*
         * Put the button back unless the
         * screen has changed.
         */

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "LOGIN";

        }

    }

}


/* =========================================
   SIGN UP
========================================= */

async function handleSignUp() {

    const emailInput =
        document.getElementById(
            "signUpUsername"
        );

    const usernameInput =
        document.getElementById(
            "signUpBlockWorldUsername"
        );

    const displayNameInput =
        document.getElementById(
            "signUpDisplayName"
        );

    const passwordInput =
        document.getElementById(
            "signUpPassword"
        );

    const confirmPasswordInput =
        document.getElementById(
            "signUpPasswordConfirm"
        );

    const errorElement =
        document.getElementById(
            "signUpError"
        );


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    const username =
        usernameInput
            ? usernameInput.value.trim()
            : "";


    const displayName =
        displayNameInput
            ? displayNameInput.value.trim()
            : "";


    const password =
        passwordInput
            ? passwordInput.value
            : "";


    const confirmPassword =
        confirmPasswordInput
            ? confirmPasswordInput.value
            : "";


    if (errorElement) {

        errorElement.textContent =
            "";

    }


    if (!email) {

        if (errorElement) {

            errorElement.textContent =
                "Enter your email.";

        }

        return;

    }


    if (!username) {

        if (errorElement) {

            errorElement.textContent =
                "Enter a Solaria username.";

        }

        return;

    }


    if (!displayName) {

        if (errorElement) {

            errorElement.textContent =
                "Enter a display name.";

        }

        return;

    }


    if (!password) {

        if (errorElement) {

            errorElement.textContent =
                "Enter a password.";

        }

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Passwords do not match.";

        }

        return;

    }


    if (
        !/^[A-Za-z0-9_]+$/.test(
            username
        )
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Username can only contain letters, numbers, and underscores.";

        }

        return;

    }


    if (
        username.length < 3 ||
        username.length > 20
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Username must be between 3 and 20 characters.";

        }

        return;

    }


    try {

        if (
            window.blockworldProfile &&
            typeof window.blockworldProfile.checkUsername ===
            "function"
        ) {

            const usernameCheck =
                await window.blockworldProfile.checkUsername(
                    username
                );


            if (
                usernameCheck &&
                (
                    usernameCheck.exists === true ||
                    usernameCheck.available === false
                )
            ) {

                if (errorElement) {

                    errorElement.textContent =
                        "That username is already taken.";

                }

                return;

            }

        }

    } catch (error) {

        console.error(
            "[Solaria] Username check error:",
            error
        );

    }


    try {

        const result =
            await createAccount(
                email,
                password,
                username,
                displayName
            );


        if (
            !result ||
            result.success === false
        ) {

            if (errorElement) {

                errorElement.textContent =
                    result &&
                    result.message
                        ? result.message
                        : "Could not create account.";

            }

            return;

        }


        if (
            result.needsEmailConfirmation
        ) {

            if (errorElement) {

                errorElement.textContent =
                    "Account created. Check your email to confirm your account.";

            }

            return;

        }


        if (result.user) {

            await showHome(
                result.user
            );

        }

    } catch (error) {

        console.error(
            "[Solaria] Sign up error:",
            error
        );


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Could not create account.";

        }

    }

}


/* =========================================
   GOOGLE LOGIN
========================================= */

async function handleGoogleLogin() {

    try {

        const result =
            await loginWithGoogle();


        if (
            result &&
            result.success === false
        ) {

            console.error(
                "[Solaria] Google login failed:",
                result.message
            );

        }

    } catch (error) {

        console.error(
            "[Solaria] Google login error:",
            error
        );

    }

}


/* =========================================
   GOOGLE SUCCESS
========================================= */

if (
    window.blockworldAuth &&
    typeof window.blockworldAuth.onGoogleLoginSuccess ===
    "function"
) {

    window.blockworldAuth.onGoogleLoginSuccess(
        async () => {

            try {

                const user =
                    await getCurrentUser();


                if (!user) {

                    console.error(
                        "[Solaria] Google login succeeded but no user was found."
                    );

                    return;

                }


                let profileResult = null;


                if (
                    window.blockworldProfile &&
                    typeof window.blockworldProfile.getMine ===
                    "function"
                ) {

                    profileResult =
                        await window.blockworldProfile.getMine();

                }


                /*
                 * Existing Google user
                 * already has a profile.
                 */

                if (
                    profileResult &&
                    profileResult.success &&
                    profileResult.profile
                ) {

                    googleSetupUser = null;

                    await showHome(
                        user
                    );

                    return;

                }


                /*
                 * First-time Google user.
                 */

                console.log(
                    "[Solaria] New Google account detected. Opening profile setup."
                );


                showProfileSetupDetails(
                    user
                );

            } catch (error) {

                console.error(
                    "[Solaria] Google profile setup error:",
                    error
                );

            }

        }
    );

}


/* =========================================
   GOOGLE ERROR
========================================= */

if (
    window.blockworldAuth &&
    typeof window.blockworldAuth.onGoogleLoginError ===
    "function"
) {

    window.blockworldAuth.onGoogleLoginError(
        message => {

            const errorMessage =
                message ||
                "Google login failed.";

            console.error(
                "[Solaria] Google login error:",
                errorMessage
            );


            const errorElement =
                document.getElementById(
                    "loginError"
                );


            if (errorElement) {

                errorElement.textContent =
                    errorMessage;

            }

        }
    );

}


/* =========================================
   PROFILE SETUP
========================================= */

async function handleProfileSetup() {

    const usernameInput =
        document.getElementById(
            "profileSetupUsername"
        );

    const displayNameInput =
        document.getElementById(
            "profileSetupDisplayName"
        );

    const errorElement =
        document.getElementById(
            "profileSetupError"
        );

    const statusElement =
        document.getElementById(
            "profileUsernameStatus"
        );


    const username =
        usernameInput
            ? usernameInput.value.trim()
            : "";


    const displayName =
        displayNameInput
            ? displayNameInput.value.trim()
            : "";


    if (errorElement) {

        errorElement.textContent =
            "";

    }


    if (statusElement) {

        statusElement.textContent =
            "";

    }


    /* =========================================
       USERNAME VALIDATION
    ========================================= */

    if (!username) {

        if (errorElement) {

            errorElement.textContent =
                "Please choose a username.";

        }

        return;

    }


    if (
        username.length < 3 ||
        username.length > 20
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Username must be between 3 and 20 characters.";

        }

        return;

    }


    if (
        !/^[A-Za-z0-9_]+$/.test(
            username
        )
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Username can only contain letters, numbers, and underscores.";

        }

        return;

    }


    /* =========================================
       DISPLAY NAME VALIDATION
    ========================================= */

    if (!displayName) {

        if (errorElement) {

            errorElement.textContent =
                "Please choose a display name.";

        }

        return;

    }


    if (
        displayName.length < 1 ||
        displayName.length > 30
    ) {

        if (errorElement) {

            errorElement.textContent =
                "Display name must be between 1 and 30 characters.";

        }

        return;

    }


    /* =========================================
       CHECK USERNAME
    ========================================= */

    try {

        if (
            window.blockworldProfile &&
            typeof window.blockworldProfile.checkUsername ===
            "function"
        ) {

            const usernameCheck =
                await window.blockworldProfile.checkUsername(
                    username
                );


            if (
                usernameCheck &&
                (
                    usernameCheck.exists === true ||
                    usernameCheck.available === false
                )
            ) {

                if (errorElement) {

                    errorElement.textContent =
                        "That username is already taken.";

                }

                return;

            }

        }

    } catch (error) {

        console.error(
            "[Solaria] Profile username check error:",
            error
        );

    }


    /* =========================================
       CREATE PROFILE
    ========================================= */

    try {

        const result =
            await window.blockworldProfile.create(
                username,
                displayName
            );


        if (
            !result ||
            result.success === false
        ) {

            if (errorElement) {

                errorElement.textContent =
                    result &&
                    result.message
                        ? result.message
                        : "Could not create your profile.";

            }

            console.error(
                "[Solaria] Profile creation failed:",
                result
            );

            return;

        }


        console.log(
            "[Solaria] Profile created successfully."
        );


        googleSetupUser = null;


        const user =
            await getCurrentUser();


        if (!user) {

            if (errorElement) {

                errorElement.textContent =
                    "Profile created, but your account could not be loaded.";

            }

            return;

        }


        await showHome(
            user
        );

    } catch (error) {

        console.error(
            "[Solaria] Profile setup error:",
            error
        );


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Could not create your profile.";

        }

    }

}


/* =========================================
   BUTTON CONNECTIONS
========================================= */

function connectButtons() {


    /* =========================================
       SIGN IN
    ========================================= */

    const showLoginButton =
        document.getElementById(
            "showLoginButton"
        );

    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            showLogin
        );

    }


    const showSignUpButton =
        document.getElementById(
            "showSignUpButton"
        );

    if (showSignUpButton) {

        showSignUpButton.addEventListener(
            "click",
            showProfileSetup
        );

    }


    /* =========================================
       LOGIN
    ========================================= */

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    if (loginButton) {

        loginButton.addEventListener(
            "click",
            handleLogin
        );

    }


    const loginIdentifierInput =
        document.getElementById(
            "loginUsername"
        );

    if (loginIdentifierInput) {

        loginIdentifierInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    handleLogin();

                }

            }
        );

    }


    const loginPasswordInput =
        document.getElementById(
            "loginPassword"
        );

    if (loginPasswordInput) {

        loginPasswordInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    handleLogin();

                }

            }
        );

    }


    /* =========================================
       REMEMBER ME
    ========================================= */

    const rememberInput =
        document.getElementById(
            "rememberInput"
        );


    if (rememberInput) {

        try {

            if (
                window.solariaAuth &&
                typeof window.solariaAuth.getRememberMe ===
                "function"
            ) {

                rememberInput.checked =
                    window.solariaAuth.getRememberMe();

            }

        } catch (error) {

            console.warn(
                "[Solaria] Could not load Remember Me setting:",
                error
            );

        }


        rememberInput.addEventListener(
            "change",
            () => {

                try {

                    if (
                        window.solariaAuth &&
                        typeof window.solariaAuth.setRememberMe ===
                        "function"
                    ) {

                        window.solariaAuth.setRememberMe(
                            rememberInput.checked
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[Solaria] Could not save Remember Me setting:",
                        error
                    );

                }

            }
        );

    }


    const backToSignInButton =
        document.getElementById(
            "backToSignInButton"
        );

    if (backToSignInButton) {

        backToSignInButton.addEventListener(
            "click",
            showSignIn
        );

    }


    const googleLoginButton =
        document.getElementById(
            "googleLoginButton"
        );

    if (googleLoginButton) {

        googleLoginButton.addEventListener(
            "click",
            handleGoogleLogin
        );

    }


    /* =========================================
       SIGN UP
    ========================================= */

    const signUpButton =
        document.getElementById(
            "signUpButton"
        );

    if (signUpButton) {

        signUpButton.addEventListener(
            "click",
            handleSignUp
        );

    }


    const googleSignUpButton =
        document.getElementById(
            "googleSignUpButton"
        );

    if (googleSignUpButton) {

        googleSignUpButton.addEventListener(
            "click",
            handleGoogleLogin
        );

    }


    const backFromSignUpButton =
        document.getElementById(
            "backFromSignUpButton"
        );

    if (backFromSignUpButton) {

        backFromSignUpButton.addEventListener(
            "click",
            showSignIn
        );

    }


    /* =========================================
       PROFILE SETUP DETAILS
    ========================================= */

    const profileSetupButton =
        document.getElementById(
            "profileSetupButton"
        );

    if (profileSetupButton) {

        profileSetupButton.addEventListener(
            "click",
            handleProfileSetup
        );

    }


    /* =========================================
       PROFILE SETUP ENTER KEY
    ========================================= */

    const profileSetupUsername =
        document.getElementById(
            "profileSetupUsername"
        );

    const profileSetupDisplayName =
        document.getElementById(
            "profileSetupDisplayName"
        );


    [
        profileSetupUsername,
        profileSetupDisplayName
    ].forEach(input => {

        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        handleProfileSetup();

                    }

                }
            );

        }

    });


    /* =========================================
       HOME SEARCH
    ========================================= */

    const topbarSearchInput =
        document.getElementById(
            "topbarSearchInput"
        );

    const topbarSearchButton =
        document.getElementById(
            "topbarSearchButton"
        );


    function submitTopbarSearch() {

        const query =
            topbarSearchInput
                ? topbarSearchInput.value.trim()
                : "";


        showSearch(
            query
        );

    }


    if (topbarSearchButton) {

        topbarSearchButton.addEventListener(
            "click",
            submitTopbarSearch
        );

    }


    if (topbarSearchInput) {

        topbarSearchInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    submitTopbarSearch();

                }

            }
        );

    }


    /* =========================================
       HOME
    ========================================= */

    const homeButton =
        document.getElementById(
            "homeButton"
        );

    if (homeButton) {

        homeButton.addEventListener(
            "click",
            async () => {

                const user =
                    await getCurrentUser();


                if (user) {

                    await showHome(
                        user
                    );

                }

            }
        );

    }


    /* =========================================
       ADD FRIEND
    ========================================= */

    const addFriendButton =
        document.getElementById(
            "addFriendButton"
        );

    if (addFriendButton) {

        addFriendButton.addEventListener(
            "click",
            openFriendSearch
        );

    }


    const addFriendEmptyButton =
        document.getElementById(
            "addFriendEmptyButton"
        );

    if (addFriendEmptyButton) {

        addFriendEmptyButton.addEventListener(
            "click",
            openFriendSearch
        );

    }


    /* =========================================
       LOGOUT
    ========================================= */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    /* =========================================
       GAMES
    ========================================= */

    const gamesButton =
        document.getElementById(
            "gamesButton"
        );

    if (gamesButton) {

        gamesButton.addEventListener(
            "click",
            openGames
        );

    }


    /* =========================================
       AVATAR
    ========================================= */

    const avatarButton =
        document.getElementById(
            "avatarButton"
        );

    if (avatarButton) {

        avatarButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./screens/avatar.html";

            }
        );

    }


    /* =========================================
       SETTINGS
    ========================================= */

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            openSettings
        );

    }


    /* =========================================
       OLD SEARCH COMPATIBILITY
    ========================================= */

    const backFromSearchButton =
        document.getElementById(
            "backFromSearchButton"
        );

    if (backFromSearchButton) {

        backFromSearchButton.addEventListener(
            "click",
            async () => {

                const user =
                    await getCurrentUser();


                if (user) {

                    await showHome(
                        user
                    );

                }

            }
        );

    }


    const searchHomeButton =
        document.getElementById(
            "searchHomeButton"
        );

    if (searchHomeButton) {

        searchHomeButton.addEventListener(
            "click",
            async () => {

                const user =
                    await getCurrentUser();


                if (user) {

                    await showHome(
                        user
                    );

                }

            }
        );

    }


    /* =========================================
       SEARCH GAMES
    ========================================= */

    const searchGamesButton =
        document.getElementById(
            "searchGamesButton"
        );

    if (searchGamesButton) {

        searchGamesButton.addEventListener(
            "click",
            openGames
        );

    }


    const searchAvatarButton =
        document.getElementById(
            "searchAvatarButton"
        );

    if (searchAvatarButton) {

        searchAvatarButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./avatar.html";

            }

        );

    }


    const searchSettingsButton =
        document.getElementById(
            "searchSettingsButton"
        );

    if (searchSettingsButton) {

        searchSettingsButton.addEventListener(
            "click",
            openSettings
        );

    }


    const playerSearchInput =
        document.getElementById(
            "playerSearchInput"
        );

    const playerSearchButton =
        document.getElementById(
            "playerSearchButton"
        );


    function submitSearchScreenSearch() {

        const query =
            playerSearchInput
                ? playerSearchInput.value.trim()
                : "";


        showSearch(
            query
        );

    }


    if (playerSearchButton) {

        playerSearchButton.addEventListener(
            "click",
            submitSearchScreenSearch
        );

    }


    if (playerSearchInput) {

        playerSearchInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    submitSearchScreenSearch();

                }

            }
        );

    }


    const searchLogoutButton =
        document.getElementById(
            "searchLogoutButton"
        );

    if (searchLogoutButton) {

        searchLogoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    /* =========================================
       PLAYER PROFILE
    ========================================= */

    const profileHomeButton =
        document.getElementById(
            "profileHomeButton"
        );

    if (profileHomeButton) {

        profileHomeButton.addEventListener(
            "click",
            async () => {

                const user =
                    await getCurrentUser();


                if (user) {

                    await showHome(
                        user
                    );

                }

            }
        );

    }


    /* =========================================
       PROFILE GAMES
    ========================================= */

    const profileGamesButton =
        document.getElementById(
            "profileGamesButton"
        );

    if (profileGamesButton) {

        profileGamesButton.addEventListener(
            "click",
            openGames
        );

    }


    const profileAvatarButton =
        document.getElementById(
            "profileAvatarButton"
        );

    if (profileAvatarButton) {

        profileAvatarButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./avatar.html";

            }

        );

    }


    const profileSettingsButton =
        document.getElementById(
            "profileSettingsButton"
        );

    if (profileSettingsButton) {

        profileSettingsButton.addEventListener(
            "click",
            openSettings
        );

    }


    const profileLogoutButton =
        document.getElementById(
            "profileLogoutButton"
        );

    if (profileLogoutButton) {

        profileLogoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    const backToSearchFromProfileButton =
        document.getElementById(
            "backToSearchFromProfileButton"
        );

    if (backToSearchFromProfileButton) {

        backToSearchFromProfileButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./search.html";

            }
        );

    }


    /* =========================================
       FEATURED GAME
    ========================================= */

    const playFeaturedButton =
        document.getElementById(
            "playFeaturedButton"
        );

    if (playFeaturedButton) {

        playFeaturedButton.addEventListener(
            "click",
            openGames
        );

    }


    /* =========================================
       DEVELOPER
    ========================================= */

    const developerButton =
        document.getElementById(
            "developerButton"
        );

    if (developerButton) {

        developerButton.addEventListener(
            "click",
            () => {

                console.log(
                    "[Solaria] Developer tools coming soon."
                );

            }

        );

    }

}


/* =========================================
   INITIALIZE
========================================= */

async function initializeApp() {

    connectButtons();


    try {

        const user =
            await getCurrentUser();


        if (!user) {

            showSignIn();

            return;

        }


        let profileResult =
            null;


        try {

            if (
                window.blockworldProfile &&
                typeof window.blockworldProfile.getMine ===
                "function"
            ) {

                profileResult =
                    await window.blockworldProfile.getMine();

            }

        } catch (error) {

            console.error(
                "[Solaria] Profile lookup error:",
                error
            );

        }


        if (
            profileResult &&
            profileResult.success &&
            profileResult.profile
        ) {

            await showHome(
                user
            );

            return;

        }


        /*
         * Logged in, but no profile.
         *
         * This is also useful for Google
         * accounts that were previously
         * created without finishing setup.
         */

        showProfileSetupDetails(
            user
        );

    } catch (error) {

        console.error(
            "[Solaria] Initialization error:",
            error
        );


        showSignIn();

    }

}


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);