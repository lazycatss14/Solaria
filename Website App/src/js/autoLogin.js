(function () {
    "use strict";

    let started = false;

    async function restoreSolariaSession() {

        if (started) return;
        started = true;

        try {

            console.log("[Solaria] Checking saved login...");

            if (
                !window.blockworldAuth ||
                typeof window.blockworldAuth.getSession !== "function"
            ) {
                throw new Error("The authentication session method is unavailable.");
            }

            const result = await window.blockworldAuth.getSession();

            if (
                !result ||
                result.success !== true ||
                !result.session ||
                !result.session.user
            ) {
                console.log("[Solaria] No saved login found.");
                return;
            }

            if (typeof window.showHome !== "function") {
                throw new Error("The showHome function is unavailable.");
            }

            console.log("[Solaria] Saved login found. Opening home screen...");

            await window.showHome(result.session.user);

            console.log("[Solaria] Automatic login completed.");

        } catch (error) {

            console.error("[Solaria] Automatic login failed:", error);

        }
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            restoreSolariaSession,
            { once: true }
        );

    } else {

        restoreSolariaSession();

    }

})();