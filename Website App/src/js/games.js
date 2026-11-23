"use strict";

const SOLARIA_GAMES = Object.freeze({
    test: {
        id: "test",
        name: "Test Baseplate",
        creator: "Solaria",
        description: "Test the Solaria game environment on a simple baseplate."
    }
});

function initializeGamesPage() {

    console.log("[Solaria Games] Initializing...");

    const backButton = document.getElementById("backButton");
    const playButton = document.getElementById("playTestGame");
    const detailsButton = document.getElementById("detailsTestGame");

    if (backButton) {
        backButton.addEventListener("click", event => {
            event.preventDefault();
            window.location.href = "../index.html";
        });
    }

    if (playButton) {
        playButton.addEventListener("click", event => {
            event.preventDefault();

            const game = SOLARIA_GAMES.test;

            console.log("[Solaria Games] Play requested:", game.id);

            if (window.SolariaGameLauncher) {
                window.SolariaGameLauncher.launch(game);
            } else {
                alert("The Solaria game launcher could not be loaded.");
            }
        });
    }

    if (detailsButton) {
        detailsButton.addEventListener("click", event => {
            event.preventDefault();

            window.location.href =
                "./game-details.html?game=" +
                encodeURIComponent(SOLARIA_GAMES.test.id);
        });
    }

    console.log("[Solaria Games] Ready.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGamesPage, { once: true });
} else {
    initializeGamesPage();
}

window.SolariaGames = Object.freeze({
    games: SOLARIA_GAMES,
    getGame: id => SOLARIA_GAMES[id] || null
});
