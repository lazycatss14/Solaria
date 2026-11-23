"use strict";

window.SolariaGameLauncher = (() => {

    let launching = false;


    function getThumbnail() {
        const images = Array.from(document.querySelectorAll("img"));

        const image = images.find(img =>
            img.complete &&
            img.naturalWidth > 0 &&
            !img.closest("#solariaLoadingOverlay")
        );

        return image ? image.src : "";
    }

    function createOverlay(game) {
        const existing = document.getElementById("solariaLoadingOverlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "solariaLoadingOverlay";

        const thumbnail = game.thumbnail || getThumbnail();

        overlay.innerHTML = `
            <style>
                #solariaLoadingOverlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                        radial-gradient(circle at top, #315d50 0%, #14251f 45%, #090f13 100%);
                    color: white;
                    font-family: "Segoe UI", Arial, sans-serif;
                    animation: solariaFadeIn .3s ease;
                }

                #solariaLoadingOverlay * {
                    box-sizing: border-box;
                }

                .solaria-loading-content {
                    width: min(440px, 90%);
                    text-align: center;
                }

                .solaria-loading-image {
                    width: 100%;
                    height: 210px;
                    object-fit: cover;
                    border-radius: 18px;
                    background: linear-gradient(135deg, #f3c96b, #548d72, #315344);
                    box-shadow: 0 15px 55px #0008;
                    margin-bottom: 28px;
                }

                .solaria-loading-title {
                    font-size: 27px;
                    font-weight: 800;
                    letter-spacing: 4px;
                    margin-bottom: 10px;
                }

                .solaria-loading-game-name {
                    color: #d5e5d9;
                    font-size: 15px;
                    margin-bottom: 28px;
                }

                .solaria-spinner {
                    width: 58px;
                    height: 58px;
                    margin: 0 auto 22px;
                    border: 5px solid #ffffff25;
                    border-top-color: #f4ce75;
                    border-right-color: #9ed6a8;
                    border-radius: 50%;
                    animation: solariaSpin .85s linear infinite;
                }

                .solaria-loading-status {
                    color: #dce9df;
                    font-size: 14px;
                    letter-spacing: 1px;
                }

                .solaria-loading-error {
                    color: #ffaaaa;
                    margin-top: 18px;
                    line-height: 1.5;
                }

                .solaria-loading-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 20px;
                }

                .solaria-loading-actions button {
                    border: 0;
                    border-radius: 9px;
                    padding: 12px 22px;
                    cursor: pointer;
                    font-weight: 700;
                    background: #f4ce75;
                    color: #17231c;
                }

                @keyframes solariaSpin {
                    to { transform: rotate(360deg); }
                }

                @keyframes solariaFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 500px) {
                    .solaria-loading-image {
                        height: 160px;
                    }
                    .solaria-loading-title {
                        font-size: 22px;
                    }
                }
            </style>

            <div class="solaria-loading-content">
                <img
                    class="solaria-loading-image"
                    src="${thumbnail}"
                    alt=""
                    onerror="this.style.display='none'"
                >

                <div class="solaria-loading-title">LOADING GAME</div>

                <div class="solaria-loading-game-name">
                    ${escapeHtml(game.name)}
                </div>

                <div class="solaria-spinner"></div>

                <div class="solaria-loading-status" id="solariaLoadingStatus">
                    Preparing your game...
                </div>

                <div class="solaria-loading-error" id="solariaLoadingError"></div>

                <div class="solaria-loading-actions" id="solariaLoadingActions"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        return overlay;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function setStatus(message) {
        const status = document.getElementById("solariaLoadingStatus");
        if (status) status.textContent = message;
    }

    function showError(message, game) {
        const spinner = document.querySelector(".solaria-spinner");
        const error = document.getElementById("solariaLoadingError");
        const actions = document.getElementById("solariaLoadingActions");

        if (spinner) spinner.style.display = "none";
        if (error) error.textContent = message;

        if (actions) {
            actions.innerHTML = `
                <button type="button" id="solariaRetryButton">RETRY</button>
                <button type="button" id="solariaBackButton">BACK</button>
            `;

            document.getElementById("solariaRetryButton").onclick = () => {
                launch(game);
            };

            document.getElementById("solariaBackButton").onclick = () => {
                document.getElementById("solariaLoadingOverlay")?.remove();
                launching = false;
            };
        }
    }

    async function getCurrentPlayerData() {
        let profile = {};

        try {
            if (window.blockworldProfile && typeof window.blockworldProfile.getMine === "function") {
                const result = await window.blockworldProfile.getMine();
                profile = result && result.profile ? result.profile : {};
            }
        } catch (error) {
            console.warn("[Solaria Launcher] Could not read account profile:", error);
        }

        let avatar = null;

        try {
            if (window.SolariaAvatar && typeof window.SolariaAvatar.getData === "function") {
                avatar = window.SolariaAvatar.getData();
            }
        } catch (_) {
            avatar = null;
        }

        if (!avatar) {
            try {
                avatar = JSON.parse(localStorage.getItem("blockworldAvatar") || "null");
            } catch (_) {
                avatar = null;
            }
        }

        avatar = avatar || {
            gender: "masculine",
            renderMode: "ball",
            colors: {
                head: "#FFD6A0",
                torso: "#3366FF",
                leftArm: "#FFD6A0",
                rightArm: "#FFD6A0",
                leftLeg: "#222222",
                rightLeg: "#222222"
            }
        };

        return {
            displayName: profile.display_name || profile.displayName || profile.username || "Guest",
            username: profile.username || "",
            avatar
        };
    }
    async function launch(game) {
        if (launching) return;

        if (!game || !game.id) {
            alert("The game information is missing.");
            return;
        }

        if (!window.solariaEngine || typeof window.solariaEngine.launch !== "function") {
            alert("The Solaria engine connection is unavailable.");
            return;
        }

        launching = true;

        const overlay = createOverlay(game);
        const startTime = Date.now();

        setStatus("Preparing your game...");

        try {
            const playerData = await getCurrentPlayerData();
            const launchPromise = window.solariaEngine.launch(game.id, playerData);

            setStatus("Starting Solaria engine...");

            const result = await launchPromise;

            if (!result || result.success !== true) {
                throw new Error(
                    result?.message || "The Solaria engine could not start."
                );
            }

            setStatus("Game launched!");

            // The native child window now occupies the Electron content area.
            overlay.remove();
            launching = false;

        } catch (error) {
            console.error("[Solaria Launcher]", error);

            launching = false;

            showError(
                error?.message || "An unexpected error occurred while launching the game.",
                game
            );
        }
    }

    return Object.freeze({
        launch
    });

})();

