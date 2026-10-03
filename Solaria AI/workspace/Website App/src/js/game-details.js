/* =========================================================
   SOLARIA
   GAME DETAILS PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeGameDetails
);


/* =========================================================
   GAME DATABASE
   ========================================================= */

const games = {

    test: {

        id:
            "test",

        name:
            "Test Baseplate",

        creator:
            "Solaria",

        description:
            "Test the Solaria game engine on the default baseplate.",

        players:
            0,

        servers:
            2,

        badges:
            2

    }

};


/* =========================================================
   CURRENT GAME
   ========================================================= */

let currentGame = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeGameDetails() {

    "use strict";


    console.log(
        "SOLARIA GAME DETAILS JS LOADED"
    );


    const gameId =
        getGameId();


    console.log(
        "Game ID:",
        gameId
    );


    currentGame =
        games[gameId];


    connectBackButton();

    connectPlayButton();

    connectServerButtons();


    if (!currentGame) {

        showGameNotFound(
            gameId
        );

        return;

    }


    loadGame(
        currentGame
    );


    window.SolariaGameDetails = {

        game:
            currentGame,

        launchGame:
            launchGame

    };


    console.log(
        "Game details ready."
    );

}


/* =========================================================
   GET GAME ID
   ========================================================= */

function getGameId() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return (
        parameters.get("game") ||
        "test"
    );

}


/* =========================================================
   LOAD GAME
   ========================================================= */

function loadGame(
    game
) {

    document.title =
        game.name +
        " - Solaria";


    const headerTitle =
        document.getElementById(
            "headerTitle"
        );


    const gameName =
        document.getElementById(
            "gameName"
        );


    const gameCreator =
        document.getElementById(
            "gameCreator"
        );


    const gameDescription =
        document.getElementById(
            "gameDescription"
        );


    const descriptionText =
        document.getElementById(
            "descriptionText"
        );


    const playerCount =
        document.getElementById(
            "playerCount"
        );


    const serverCount =
        document.getElementById(
            "serverCount"
        );


    if (headerTitle) {

        headerTitle.textContent =
            game.name.toUpperCase();

    }


    if (gameName) {

        gameName.textContent =
            game.name;

    }


    if (gameCreator) {

        gameCreator.textContent =
            "Created by " +
            game.creator;

    }


    if (gameDescription) {

        gameDescription.textContent =
            game.description;

    }


    if (descriptionText) {

        descriptionText.textContent =
            game.description;

    }


    if (playerCount) {

        playerCount.textContent =
            game.players;

    }


    if (serverCount) {

        serverCount.textContent =
            game.servers;

    }


    console.log(
        "Loaded game:",
        game.name
    );

}


/* =========================================================
   GAME NOT FOUND
   ========================================================= */

function showGameNotFound(
    gameId
) {

    console.error(
        "Solaria: Game not found:",
        gameId
    );


    document.title =
        "Game Not Found - Solaria";


    const headerTitle =
        document.getElementById(
            "headerTitle"
        );


    const gameName =
        document.getElementById(
            "gameName"
        );


    const gameDescription =
        document.getElementById(
            "gameDescription"
        );


    const descriptionText =
        document.getElementById(
            "descriptionText"
        );


    const playButton =
        document.getElementById(
            "playGameButton"
        );


    if (headerTitle) {

        headerTitle.textContent =
            "GAME NOT FOUND";

    }


    if (gameName) {

        gameName.textContent =
            "Game Not Found";

    }


    if (gameDescription) {

        gameDescription.textContent =
            "This game does not exist.";

    }


    if (descriptionText) {

        descriptionText.textContent =
            "The requested game could not be found.";

    }


    if (playButton) {

        playButton.disabled =
            true;

    }

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function connectBackButton() {

    const backButton =
        document.getElementById(
            "backButton"
        );


    if (!backButton) {

        console.warn(
            "Solaria: Back button not found."
        );

        return;

    }


    backButton.addEventListener(
        "click",
        function () {

            console.log(
                "Going back to Games."
            );


            window.location.href =
                "./games.html";

        }
    );

}


/* =========================================================
   PLAY BUTTON
   ========================================================= */

function connectPlayButton() {

    const playButton =
        document.getElementById(
            "playGameButton"
        );


    if (!playButton) {

        console.warn(
            "Solaria: Play button not found."
        );

        return;

    }


    playButton.addEventListener(
        "click",
        function () {

            launchGame();

        }
    );

}


/* =========================================================
   LAUNCH GAME
   ========================================================= */

async function launchGame() {

    if (!currentGame) {

        console.error(
            "Solaria: No game is loaded."
        );

        return;

    }


    console.log(
        "SOLARIA: Play pressed for",
        currentGame.name
    );


    const playButton =
        document.getElementById(
            "playGameButton"
        );


    /*
     * The game engine may not be
     * connected yet.
     */

    if (
        !window.solariaEngine ||
        typeof window.solariaEngine.launch !==
            "function"
    ) {

        console.warn(
            "Solaria Engine is not connected."
        );


        alert(
            "The Solaria game engine is not connected yet."
        );


        return;

    }


    if (playButton) {

        playButton.disabled =
            true;

        playButton.textContent =
            "LAUNCHING...";

    }


    try {

        const result =
            await window.solariaEngine.launch(
                currentGame.id
            );


        console.log(
            "Solaria engine result:",
            result
        );


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                result.error ||
                "The game could not be launched."
            );

        }


        if (playButton) {

            playButton.textContent =
                "RUNNING";

        }

    }

    catch (
        error
    ) {

        console.error(
            "Solaria engine error:",
            error
        );


        alert(
            error.message ||
            "The game could not be launched."
        );


        if (playButton) {

            playButton.disabled =
                false;

            playButton.textContent =
                "PLAY";

        }

    }

}


/* =========================================================
   SERVER BUTTONS
   ========================================================= */

function connectServerButtons() {

    const joinButtons =
        document.querySelectorAll(
            ".join-button"
        );


    joinButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const server =
                        button.getAttribute(
                            "data-server"
                        );


                    console.log(
                        "Join server:",
                        server
                    );


                    alert(
                        "Server " +
                        server +
                        " is not connected yet."
                    );

                }
            );

        }
    );

}