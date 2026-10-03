/* =========================================================
   SOLARIA
   GAMES PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        "use strict";


        /* =====================================================
           GAME DATABASE
           ===================================================== */

        const games = {

            test: {

                id:
                    "test",

                name:
                    "Test Baseplate",

                description:
                    "Test the Solaria game engine."

            }

        };


        /* =====================================================
           ELEMENTS
           ===================================================== */

        const backButton =
            document.getElementById(
                "backButton"
            );


        const playButton =
            document.getElementById(
                "playTestGame"
            );


        const detailsButton =
            document.getElementById(
                "detailsTestGame"
            );


        const gameCards =
            document.querySelectorAll(
                ".game-card"
            );


        /* =====================================================
           BACK BUTTON
           ===================================================== */

        if (
            backButton
        ) {

            backButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "../index.html";

                }
            );

        }


        /* =====================================================
           OPEN GAME DETAILS
           ===================================================== */

        function openGameDetails(
            gameId
        ) {

            const game =
                games[gameId];


            if (!game) {

                console.error(
                    "Solaria: Game not found:",
                    gameId
                );

                return;

            }


            window.location.href =
                "./game-details.html?game=" +
                encodeURIComponent(
                    gameId
                );

        }


        /* =====================================================
           GAME CARDS
           ===================================================== */

        gameCards.forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function () {

                        const gameId =
                            card.getAttribute(
                                "data-game"
                            );


                        openGameDetails(
                            gameId
                        );

                    }
                );

            }
        );


        /* =====================================================
           GAME DETAILS BUTTON
           ===================================================== */

        if (
            detailsButton
        ) {

            detailsButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    openGameDetails(
                        "test"
                    );

                }
            );

        }


        /* =====================================================
           PLAY BUTTON
           ===================================================== */

        if (
            playButton
        ) {

            playButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    launchGame(
                        "test"
                    );

                }
            );

        }


        /* =====================================================
           LAUNCH GAME
           ===================================================== */

        async function launchGame(
            gameId
        ) {

            const game =
                games[gameId];


            if (!game) {

                console.error(
                    "Solaria: Game not found."
                );

                return;

            }


            /*
             * Make sure the Electron
             * engine API exists.
             */

            if (
                !window.solariaEngine
            ) {

                alert(
                    "The Solaria game engine is not connected yet."
                );

                return;

            }


            /*
             * Disable the button while
             * the engine is starting.
             */

            if (
                playButton
            ) {

                playButton.disabled =
                    true;

                playButton.textContent =
                    "LAUNCHING...";

            }


            try {

                const result =
                    await window
                        .solariaEngine
                        .launch(
                            game.id
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


                if (
                    playButton
                ) {

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


                if (
                    playButton
                ) {

                    playButton.disabled =
                        false;

                    playButton.textContent =
                        "PLAY";

                }

            }

        }


        /* =====================================================
           PUBLIC API
           ===================================================== */

        window.SolariaGames = {

            games:
                games,

            openGameDetails:
                openGameDetails,

            launchGame:
                launchGame

        };


        /* =====================================================
           STARTUP
           ===================================================== */

        console.log(
            "Solaria Games loaded."
        );

    }
);