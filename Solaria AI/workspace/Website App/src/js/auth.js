/* =========================================================
   SOLARIA
   AUTHENTICATION
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       HELPERS
    ===================================================== */

    function clean(value) {

        return String(value || "").trim();

    }


    function isEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            clean(value)
        );

    }


    function isUsername(value) {

        return /^[A-Za-z0-9_]{3,20}$/.test(
            clean(value)
        );

    }


    /* =====================================================
       CREATE ACCOUNT
    ===================================================== */

    async function createAccount(
        email,
        password,
        username,
        displayName
    ) {

        email =
            clean(email).toLowerCase();

        password =
            String(password || "");

        username =
            clean(username);

        displayName =
            clean(displayName);


        if (!isEmail(email)) {

            return {
                success: false,
                message: "Please enter a valid email address."
            };

        }


        if (password.length < 6) {

            return {
                success: false,
                message: "Password must be at least 6 characters."
            };

        }


        if (!isUsername(username)) {

            return {
                success: false,
                message:
                    "Username must be 3-20 characters and contain only letters, numbers, and underscores."
            };

        }


        if (
            displayName.length < 1 ||
            displayName.length > 30
        ) {

            return {
                success: false,
                message: "Display name must be 1-30 characters."
            };

        }


        try {

            /* ---------------------------------------------
               CHECK USERNAME
            --------------------------------------------- */

            const usernameCheck =
                await window.blockworldProfile.checkUsername(
                    username
                );


            if (
                !usernameCheck ||
                usernameCheck.success === false
            ) {

                return {
                    success: false,
                    message:
                        usernameCheck?.message ||
                        "Unable to check username."
                };

            }


            if (
                usernameCheck.available === false
            ) {

                return {
                    success: false,
                    message: "That username is already taken."
                };

            }


            /* ---------------------------------------------
               CREATE SUPABASE AUTH ACCOUNT
            --------------------------------------------- */

            const result =
                await window.blockworldAuth.signUp(
                    email,
                    password
                );


            if (
                !result ||
                result.success === false
            ) {

                return {
                    success: false,
                    message:
                        result?.message ||
                        "Unable to create account."
                };

            }


            /* ---------------------------------------------
               EMAIL CONFIRMATION
            --------------------------------------------- */

            if (
                result.needsEmailConfirmation
            ) {

                return {

                    success: true,

                    needsEmailConfirmation: true,

                    message:
                        "Your account was created. Check your email to confirm your account."

                };

            }


            /* ---------------------------------------------
               CREATE SOLARIA PROFILE
            --------------------------------------------- */

            const profile =
                await window.blockworldProfile.create(
                    username,
                    displayName
                );


            if (
                !profile ||
                profile.success === false
            ) {

                return {

                    success: false,

                    message:
                        profile?.message ||
                        "Your account was created, but your Solaria profile could not be created."

                };

            }


            return {

                success: true,

                user:
                    result.user ||
                    null,

                session:
                    result.session ||
                    null,

                profile:
                    profile.profile ||
                    null

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Create account error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to create account."

            };

        }

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    async function login(
        identifier,
        password,
        rememberMe
    ) {

        identifier =
            clean(identifier);

        password =
            String(password || "");


        if (!identifier) {

            return {

                success: false,

                message:
                    "Enter your username or email."

            };

        }


        if (!password) {

            return {

                success: false,

                message:
                    "Enter your password."

            };

        }


        try {

            let result;


            /* ---------------------------------------------
               EMAIL LOGIN
            --------------------------------------------- */

            if (
                isEmail(identifier)
            ) {

                result =
                    await window.blockworldAuth.signIn(
                        identifier.toLowerCase(),
                        password
                    );

            }


            /* ---------------------------------------------
               USERNAME LOGIN
            --------------------------------------------- */

            else {

                if (
                    !isUsername(identifier)
                ) {

                    return {

                        success: false,

                        message:
                            "Enter a valid username or email."

                    };

                }


                result =
                    await window.blockworldAuth.signInWithUsername(
                        identifier,
                        password
                    );

            }


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    message:
                        result?.message ||
                        "Login failed."

                };

            }


            /* ---------------------------------------------
               REMEMBER ME
            --------------------------------------------- */

            try {

                localStorage.setItem(
                    "solaria_remember_me",
                    rememberMe === true
                        ? "true"
                        : "false"
                );

            }

            catch (error) {

                console.warn(
                    "[Solaria] Could not save Remember Me preference:",
                    error
                );

            }


            /* ---------------------------------------------
               LOAD PROFILE
            --------------------------------------------- */

            const profileResult =
                await window.blockworldProfile.getMine();


            return {

                success: true,

                user:
                    result.user ||
                    null,

                session:
                    result.session ||
                    null,

                profile:
                    profileResult?.profile ||
                    null

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Login error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to log in."

            };

        }

    }


    /* =====================================================
       GOOGLE LOGIN
    ===================================================== */

    async function loginWithGoogle() {

        try {

            const result =
                await window.blockworldAuth.signInWithGoogle();


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    message:
                        result?.message ||
                        "Unable to start Google login."

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Google login error:",
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


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            const result =
                await window.blockworldAuth.signOut();


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    message:
                        result?.message ||
                        "Unable to log out."

                };

            }


            return {

                success: true

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Logout error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to log out."

            };

        }

    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    async function getCurrentUser() {

        try {

            const result =
                await window.blockworldAuth.getUser();


            if (
                !result ||
                result.success === false
            ) {

                return null;

            }


            return result.user || null;

        }

        catch (error) {

            console.error(
                "[Solaria] Get current user error:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       GET CURRENT SESSION
    ===================================================== */

    async function getCurrentSession() {

        try {

            const result =
                await window.blockworldAuth.getSession();


            if (
                !result ||
                result.success === false
            ) {

                return null;

            }


            return result.session || null;

        }

        catch (error) {

            console.error(
                "[Solaria] Get current session error:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       SEND PASSWORD RESET EMAIL
    ===================================================== */

    async function resetPassword(
        email
    ) {

        email =
            clean(email).toLowerCase();


        if (!isEmail(email)) {

            return {

                success: false,

                message:
                    "Please enter a valid email address."

            };

        }


        try {

            const result =
                await window.blockworldAuth.resetPassword(
                    email
                );


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    message:
                        result?.message ||
                        "Unable to send password recovery email."

                };

            }


            return {

                success: true,

                message:
                    result.message ||
                    "Password recovery email sent."

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Password reset error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to send password recovery email."

            };

        }

    }


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    async function changePassword(
        password,
        confirmPassword
    ) {

        password =
            String(password || "");

        confirmPassword =
            String(confirmPassword || "");


        if (password.length < 6) {

            return {

                success: false,

                message:
                    "Password must be at least 6 characters."

            };

        }


        if (
            password !==
            confirmPassword
        ) {

            return {

                success: false,

                message:
                    "The passwords do not match."

            };

        }


        try {

            const result =
                await window.blockworldAuth.changePassword(
                    password
                );


            if (
                !result ||
                result.success === false
            ) {

                return {

                    success: false,

                    message:
                        result?.message ||
                        "Unable to change password."

                };

            }


            return {

                success: true,

                user:
                    result.user ||
                    null

            };

        }

        catch (error) {

            console.error(
                "[Solaria] Change password error:",
                error
            );


            return {

                success: false,

                message:
                    error.message ||
                    "Unable to change password."

            };

        }

    }


    /* =====================================================
       REMEMBER ME
    ===================================================== */

    function getRememberMe() {

        try {

            return (
                localStorage.getItem(
                    "solaria_remember_me"
                ) === "true"
            );

        }

        catch (error) {

            return false;

        }

    }


    function setRememberMe(
        enabled
    ) {

        try {

            localStorage.setItem(
                "solaria_remember_me",
                enabled === true
                    ? "true"
                    : "false"
            );

        }

        catch (error) {

            console.warn(
                "[Solaria] Could not save Remember Me setting:",
                error
            );

        }

    }


    /* =====================================================
       EXPORTS
    ===================================================== */

    window.solariaAuth = {

        createAccount,

        login,

        loginWithGoogle,

        logout,

        getCurrentUser,

        getCurrentSession,

        resetPassword,

        changePassword,

        getRememberMe,

        setRememberMe

    };


    /*
       These aliases keep older Solaria code working.
    */

    window.createAccount =
        createAccount;

    window.login =
        login;

    window.loginWithGoogle =
        loginWithGoogle;

    window.logout =
        logout;

    window.getCurrentUser =
        getCurrentUser;


    /* =====================================================
       GOOGLE LOGIN EVENTS
    ===================================================== */

    if (
        window.blockworldAuth
    ) {

        window.blockworldAuth.onGoogleLoginSuccess(
            () => {

                window.dispatchEvent(
                    new CustomEvent(
                        "solaria-google-login-success"
                    )
                );

            }
        );


        window.blockworldAuth.onGoogleLoginError(
            message => {

                window.dispatchEvent(
                    new CustomEvent(
                        "solaria-google-login-error",
                        {
                            detail: {
                                message:
                                    message ||
                                    "Google login failed."
                            }
                        }
                    )
                );

            }
        );

    }


    /* =====================================================
       READY
    ===================================================== */

    console.log(
        "[Solaria] Authentication system loaded."
    );

})();