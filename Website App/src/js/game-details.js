"use strict";

const SOLARIA_GAME_DATABASE = {
    test: {
        id: "test",
        name: "Test Baseplate",
        creator: "Solaria",
        description: "Test the Solaria game environment on a simple baseplate.",
        players: 0,
        servers: 2
    }
};

let currentGame = null;

document.addEventListener("DOMContentLoaded", initializeGameDetails);

function initializeGameDetails() {

    console.log("[Solaria Game Details] Initializing...");

    const parameters = new URLSearchParams(window.location.search);
    const gameId = parameters.get("game") || "test";

    currentGame = SOLARIA_GAME_DATABASE[gameId];

    connectBackButton();
    connectPlayButton();
    connectServerButtons();

    if (!currentGame) {
        showGameNotFound();
        return;
    }

    loadGame(currentGame);

    window.SolariaGameDetails = {
        game: currentGame
    };

    console.log("[Solaria Game Details] Ready.");
}

function loadGame(game) {

    document.title = game.name + " - Solaria";

    const elements = {
        gameName: game.name,
        gameCreator: "Created by " + game.creator,
        gameDescription: game.description,
        descriptionText: game.description,
        playerCount: game.players,
        serverCount: game.servers
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function showGameNotFound() {

    document.title = "Game Not Found - Solaria";

    const gameName = document.getElementById("gameName");
    const gameDescription = document.getElementById("gameDescription");
    const descriptionText = document.getElementById("descriptionText");
    const playButton = document.getElementById("playGameButton");

    if (gameName) gameName.textContent = "Game Not Found";

    if (gameDescription) {
        gameDescription.textContent = "The requested game does not exist.";
    }

    if (descriptionText) {
        descriptionText.textContent = "The requested game could not be found.";
    }

    if (playButton) {
        playButton.disabled = true;
        playButton.textContent = "UNAVAILABLE";
    }
}

function connectBackButton() {

    const backButton = document.getElementById("backButton");

    if (!backButton) return;

    backButton.addEventListener("click", () => {
        window.location.href = "./games.html";
    });
}

function connectPlayButton() {

    const playButton = document.getElementById("playGameButton");

    if (!playButton) return;

    playButton.addEventListener("click", event => {

        event.preventDefault();

        if (!currentGame) return;

        console.log("[Solaria Game Details] PLAY:", currentGame.name);

        if (window.SolariaGameLauncher) {
            window.SolariaGameLauncher.launch(currentGame);
        } else {
            alert("The Solaria game launcher could not be loaded.");
        }
    });
}

function connectServerButtons() {

    document.querySelectorAll(".join-button").forEach(button => {

        button.addEventListener("click", () => {

            const server = button.getAttribute("data-server");

            alert(
                "Server " + server +
                "\n\nThis server is not available yet."
            );
        });
    });
}
