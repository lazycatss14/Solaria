/* =========================================================
   SOLARIA WEBSITE
   MAIN JAVASCRIPT
   SUPABASE AUTHENTICATION
========================================================= */

"use strict";


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "https://rprqpkcmyuwvqkzfiqbi.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_kTzqdJhND_1X2nmE1_lszQ_1NO5-6vf";


let supabase = null;


/* =========================================================
   LOAD SUPABASE
========================================================= */

async function loadSupabase() {

    if (supabase) {
        return supabase;
    }

    try {

        const module =
            await import(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
            );


        supabase =
            module.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );


        return supabase;

    }
    catch (error) {

        console.error(
            "[Solaria] Could not load Supabase:",
            error
        );

        return null;
    }
}


/* =========================================================
   HELPERS
========================================================= */

function clean(value) {

    return String(
        value || ""
    ).trim();

}


function isEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        clean(value)
    );

}


function showMessage(
    element,
    message,
    success = false
) {

    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    if (success) {

        element.style.color =
            "#247024";

    }
    else {

        element.style.color =
            "#c00000";

    }

}


/* =========================================================
   BUTTON EFFECTS
========================================================= */

function setupButtons() {

    const buttons =
        document.querySelectorAll(
            ".button"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "mousedown",
                function () {

                    button.classList.add(
                        "pressed"
                    );

                }
            );


            button.addEventListener(
                "mouseup",
                function () {

                    button.classList.remove(
                        "pressed"
                    );

                }
            );


            button.addEventListener(
                "mouseleave",
                function () {

                    button.classList.remove(
                        "pressed"
                    );

                }
            );

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    const navigationLinks =
        document.querySelectorAll(
            ".navigation a"
        );


    navigationLinks.forEach(
        function (link) {

            const href =
                link.getAttribute(
                    "href"
                );


            if (!href) {
                return;
            }


            const linkPage =
                href
                    .split("/")
                    .pop()
                    .toLowerCase();


            if (
                currentPage === linkPage ||
                (
                    currentPage === "" &&
                    linkPage === "index.html"
                )
            ) {

                link.classList.add(
                    "current"
                );

            }

        }
    );

}


/* =========================================================
   SIGN IN
========================================================= */

async function handleSignIn(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const emailInput =
        document.getElementById(
            "username"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const message =
        document.getElementById(
            "signInMessage"
        );


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    const email =
        clean(
            emailInput?.value
        );


    const password =
        String(
            passwordInput?.value || ""
        );


    if (!email) {

        showMessage(
            message,
            "Please enter your email address."
        );

        return;
    }


    if (!isEmail(email)) {

        showMessage(
            message,
            "Please enter a valid email address."
        );

        return;
    }


    if (!password) {

        showMessage(
            message,
            "Please enter your password."
        );

        return;
    }


    const client =
        await loadSupabase();


    if (!client) {

        showMessage(
            message,
            "Unable to connect to Solaria."
        );

        return;
    }


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "SIGNING IN...";
    }


    showMessage(
        message,
        ""
    );


    try {

        const result =
            await client.auth.signInWithPassword(
                {
                    email: email.toLowerCase(),
                    password: password
                }
            );


        if (result.error) {

            console.error(
                "[Solaria] Sign in failed:",
                result.error
            );


            showMessage(
                message,
                result.error.message ||
                    "Sign in failed."
            );

            return;
        }


        if (!result.data?.session) {

            showMessage(
                message,
                "Sign in completed, but no session was created."
            );

            return;
        }


        showMessage(
            message,
            "Signed in successfully!",
            true
        );


        /*
         * Give Supabase a moment to finish
         * saving the session before leaving.
         */

        setTimeout(
            function () {

                window.location.href =
                    "./index.html";

            },
            500
        );

    }
    catch (error) {

        console.error(
            "[Solaria] Sign in error:",
            error
        );


        showMessage(
            message,
            error.message ||
                "Unable to sign in."
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "SIGN IN";

        }

    }

}


/* =========================================================
   GOOGLE SIGN IN
========================================================= */

async function handleGoogleSignIn() {

    const message =
        document.getElementById(
            "signInMessage"
        );


    const button =
        document.getElementById(
            "googleSignInButton"
        );


    const client =
        await loadSupabase();


    if (!client) {

        showMessage(
            message,
            "Unable to connect to Solaria."
        );

        return;
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "CONNECTING...";
    }


    try {

        const result =
            await client.auth.signInWithOAuth(
                {
                    provider: "google",

                    options: {
                        redirectTo:
                            window.location.href
                    }
                }
            );


        if (result.error) {

            console.error(
                "[Solaria] Google sign in failed:",
                result.error
            );


            showMessage(
                message,
                result.error.message ||
                    "Unable to start Google sign in."
            );


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "SIGN IN WITH GOOGLE";

            }

        }

    }
    catch (error) {

        console.error(
            "[Solaria] Google sign in error:",
            error
        );


        showMessage(
            message,
            error.message ||
                "Unable to start Google sign in."
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "SIGN IN WITH GOOGLE";

        }

    }

}


/* =========================================================
   SIGN UP
========================================================= */

async function handleSignUp(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const email =
        clean(
            document.getElementById(
                "email"
            )?.value
        );


    const password =
        String(
            document.getElementById(
                "password"
            )?.value || ""
        );


    const confirmPassword =
        String(
            document.getElementById(
                "confirmPassword"
            )?.value || ""
        );


    const message =
        document.getElementById(
            "signUpMessage"
        );


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (!isEmail(email)) {

        showMessage(
            message,
            "Please enter a valid email address."
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            message,
            "Password must be at least 6 characters."
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            message,
            "The passwords do not match."
        );

        return;
    }


    const client =
        await loadSupabase();


    if (!client) {

        showMessage(
            message,
            "Unable to connect to Solaria."
        );

        return;
    }


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "CREATING ACCOUNT...";
    }


    try {

        const result =
            await client.auth.signUp(
                {
                    email:
                        email.toLowerCase(),

                    password:
                        password
                }
            );


        if (result.error) {

            console.error(
                "[Solaria] Sign up failed:",
                result.error
            );


            showMessage(
                message,
                result.error.message ||
                    "Unable to create account."
            );

            return;
        }


        /*
         * Supabase can require email confirmation.
         */

        if (
            result.data?.user &&
            !result.data?.session
        ) {

            showMessage(
                message,
                "Account created! Check your email to confirm your account.",
                true
            );

            return;
        }


        showMessage(
            message,
            "Account created successfully!",
            true
        );


        setTimeout(
            function () {

                window.location.href =
                    "./index.html";

            },
            700
        );

    }
    catch (error) {

        console.error(
            "[Solaria] Sign up error:",
            error
        );


        showMessage(
            message,
            error.message ||
                "Unable to create account."
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "CREATE ACCOUNT";

        }

    }

}


/* =========================================================
   GOOGLE SIGN UP
========================================================= */

async function handleGoogleSignUp() {

    const message =
        document.getElementById(
            "signUpMessage"
        );


    const button =
        document.getElementById(
            "googleSignUpButton"
        );


    const client =
        await loadSupabase();


    if (!client) {

        showMessage(
            message,
            "Unable to connect to Solaria."
        );

        return;
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "CONNECTING...";
    }


    try {

        const result =
            await client.auth.signInWithOAuth(
                {
                    provider: "google",

                    options: {
                        redirectTo:
                            window.location.href
                    }
                }
            );


        if (result.error) {

            console.error(
                "[Solaria] Google sign up failed:",
                result.error
            );


            showMessage(
                message,
                result.error.message ||
                    "Unable to start Google sign up."
            );


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "SIGN UP WITH GOOGLE";

            }

        }

    }
    catch (error) {

        console.error(
            "[Solaria] Google sign up error:",
            error
        );


        showMessage(
            message,
            error.message ||
                "Unable to start Google sign up."
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "SIGN UP WITH GOOGLE";

        }

    }

}


/* =========================================================
   SIGN OUT
========================================================= */

async function signOut() {

    const client =
        await loadSupabase();


    if (!client) {
        return false;
    }


    try {

        const result =
            await client.auth.signOut();


        if (result.error) {

            console.error(
                "[Solaria] Sign out failed:",
                result.error
            );

            return false;
        }


        return true;

    }
    catch (error) {

        console.error(
            "[Solaria] Sign out error:",
            error
        );

        return false;
    }

}


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCurrentUser() {

    const client =
        await loadSupabase();


    if (!client) {
        return null;
    }


    try {

        const result =
            await client.auth.getUser();


        if (result.error) {
            return null;
        }


        return result.data?.user ||
            null;

    }
    catch (error) {

        console.error(
            "[Solaria] Get user error:",
            error
        );

        return null;
    }

}


/* =========================================================
   GET CURRENT SESSION
========================================================= */

async function getCurrentSession() {

    const client =
        await loadSupabase();


    if (!client) {
        return null;
    }


    try {

        const result =
            await client.auth.getSession();


        if (result.error) {
            return null;
        }


        return result.data?.session ||
            null;

    }
    catch (error) {

        console.error(
            "[Solaria] Get session error:",
            error
        );

        return null;
    }

}


/* =========================================================
   PASSWORD RESET
========================================================= */

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


    const client =
        await loadSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Unable to connect to Solaria."
        };

    }


    try {

        const result =
            await client.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        window.location.origin +
                        window.location.pathname
                }
            );


        if (result.error) {

            return {
                success: false,
                message:
                    result.error.message
            };

        }


        return {
            success: true,
            message:
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


/* =========================================================
   PAGE SETUP
========================================================= */

async function setupAuthentication() {

    const signInForm =
        document.getElementById(
            "signInForm"
        );


    const signUpForm =
        document.getElementById(
            "signUpForm"
        );


    const googleSignInButton =
        document.getElementById(
            "googleSignInButton"
        );


    const googleSignUpButton =
        document.getElementById(
            "googleSignUpButton"
        );


    if (signInForm) {

        signInForm.addEventListener(
            "submit",
            handleSignIn
        );

    }


    if (signUpForm) {

        signUpForm.addEventListener(
            "submit",
            handleSignUp
        );

    }


    if (googleSignInButton) {

        googleSignInButton.addEventListener(
            "click",
            handleGoogleSignIn
        );

    }


    if (googleSignUpButton) {

        googleSignUpButton.addEventListener(
            "click",
            handleGoogleSignUp
        );

    }


    /*
     * Load Supabase on authentication pages.
     */

    if (
        signInForm ||
        signUpForm ||
        googleSignInButton ||
        googleSignUpButton
    ) {

        await loadSupabase();

    }

}


/* =========================================================
   SUPABASE AUTH STATE
========================================================= */

async function setupAuthState() {

    const client =
        await loadSupabase();


    if (!client) {
        return;
    }


    client.auth.onAuthStateChange(
        function (
            event,
            session
        ) {

            console.log(
                "[Solaria] Auth state:",
                event,
                session
                    ? "SIGNED IN"
                    : "SIGNED OUT"
            );

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "[Solaria] Website loaded."
        );


        setupButtons();
        setupNavigation();


        await setupAuthentication();


        await setupAuthState();

    }
);


/* =========================================================
   PUBLIC API
========================================================= */

window.solariaAuth = {

    signOut,
    getCurrentUser,
    getCurrentSession,
    resetPassword

};


console.log(
    "[Solaria] Website authentication loaded."
);