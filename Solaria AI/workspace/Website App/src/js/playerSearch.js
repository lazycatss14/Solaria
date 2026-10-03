/* =========================================
   SOLARIA
   PLAYER + GAME SEARCH
   CONNECTED AVATARS + GAME PROFILES
========================================= */

(function () {

    "use strict";


    /* =========================================
       ELEMENTS
    ========================================= */

    const searchInput =
        document.getElementById(
            "playerSearchInput"
        );

    const searchMessage =
        document.getElementById(
            "playerSearchError"
        );

    const resultsContainer =
        document.getElementById(
            "playerSearchResults"
        );


    /* =========================================
       CHECK HTML
    ========================================= */

    if (
        !searchInput ||
        !searchMessage ||
        !resultsContainer
    ) {

        console.error(
            "[Solaria Search] Required search elements were not found."
        );

        return;

    }


    /* =========================================
       GAME DATABASE
    ========================================= */

    const games = [

        {
            id: "test",

            name:
                "Test Baseplate",

            description:
                "Test the Solaria game engine.",

            type:
                "game"

        }

    ];


    /* =========================================
       MESSAGES
    ========================================= */

    function showMessage(text) {

        searchMessage.textContent =
            text || "";

    }


    function clearMessage() {

        searchMessage.textContent =
            "";

    }


    /* =========================================
       CLEAR RESULTS
    ========================================= */

    function clearResults() {

        resultsContainer.innerHTML =
            "";

    }


    /* =========================================
       NORMALIZE TEXT
    ========================================= */

    function normalizeText(text) {

        return String(
            text || ""
        )
            .trim()
            .toLowerCase();

    }


    /* =========================================
       NORMALIZE USERNAME
    ========================================= */

    function normalizeUsername(username) {

        return normalizeText(
            username
        );

    }


    /* =========================================
       SEARCH SCORE
    ========================================= */

    function getSearchScore(
        username,
        query
    ) {

        const name =
            normalizeUsername(
                username
            );

        const search =
            normalizeText(
                query
            );


        if (
            !name ||
            !search
        ) {

            return 999999;

        }


        /* =========================================
           EXACT MATCH
        ========================================= */

        if (
            name === search
        ) {

            return 0;

        }


        /* =========================================
           STARTS WITH
        ========================================= */

        if (
            name.startsWith(
                search
            )
        ) {

            return (
                100 +
                name.length
            );

        }


        /* =========================================
           CONTAINS
        ========================================= */

        const containsIndex =
            name.indexOf(
                search
            );


        if (
            containsIndex !== -1
        ) {

            return (
                200 +
                containsIndex +
                name.length
            );

        }


        /* =========================================
           LETTERS CLOSE TOGETHER
        ========================================= */

        let previousIndex =
            -1;

        let totalDistance =
            0;

        let foundAll =
            true;


        for (
            const character
            of search
        ) {

            const index =
                name.indexOf(
                    character,
                    previousIndex + 1
                );


            if (
                index === -1
            ) {

                foundAll =
                    false;

                break;

            }


            if (
                previousIndex !== -1
            ) {

                totalDistance +=
                    index -
                    previousIndex -
                    1;

            }


            previousIndex =
                index;

        }


        if (
            foundAll
        ) {

            return (
                300 +
                totalDistance +
                name.length
            );

        }


        /* =========================================
           LETTERS ANYWHERE
        ========================================= */

        let position =
            0;

        let matched =
            0;


        for (
            const character
            of search
        ) {

            const index =
                name.indexOf(
                    character,
                    position
                );


            if (
                index !== -1
            ) {

                matched++;

                position =
                    index + 1;

            }

        }


        if (
            matched ===
            search.length
        ) {

            return (
                400 +
                name.length
            );

        }


        /* =========================================
           BASIC FUZZY MATCH
        ========================================= */

        let fuzzyScore =
            0;


        for (
            const character
            of search
        ) {

            if (
                name.includes(
                    character
                )
            ) {

                fuzzyScore++;

            }

        }


        if (
            fuzzyScore > 0
        ) {

            return (
                500 +
                (
                    search.length -
                    fuzzyScore
                ) *
                20 +
                name.length
            );

        }


        return 999999;

    }


    /* =========================================
       RANK PROFILES
    ========================================= */

    function rankProfiles(
        profiles,
        query
    ) {

        if (
            !Array.isArray(
                profiles
            )
        ) {

            return [];

        }


        return profiles

            .filter(
                profile =>
                    profile &&
                    profile.username
            )

            .map(
                profile => {

                    return {

                        profile:
                            profile,

                        score:
                            getSearchScore(
                                profile.username,
                                query
                            )

                    };

                }
            )

            .filter(
                item =>
                    item.score <
                    999999
            )

            .sort(
                (
                    a,
                    b
                ) => {

                    if (
                        a.score !==
                        b.score
                    ) {

                        return (
                            a.score -
                            b.score
                        );

                    }


                    return normalizeUsername(
                        a.profile.username
                    ).localeCompare(
                        normalizeUsername(
                            b.profile.username
                        )
                    );

                }
            )

            .map(
                item =>
                    item.profile
            );

    }


    /* =========================================
       RANK GAMES
    ========================================= */

    function rankGames(
        gameList,
        query
    ) {

        if (
            !Array.isArray(
                gameList
            )
        ) {

            return [];

        }


        return gameList

            .filter(
                game =>
                    game &&
                    game.name
            )

            .map(
                game => {

                    const nameScore =
                        getSearchScore(
                            game.name,
                            query
                        );


                    const descriptionScore =
                        getSearchScore(
                            game.description,
                            query
                        );


                    return {

                        game:
                            game,

                        score:
                            Math.min(
                                nameScore,
                                descriptionScore +
                                50
                            )

                    };

                }
            )

            .filter(
                item =>
                    item.score <
                    999999
            )

            .sort(
                (
                    a,
                    b
                ) => {

                    if (
                        a.score !==
                        b.score
                    ) {

                        return (
                            a.score -
                            b.score
                        );

                    }


                    return normalizeText(
                        a.game.name
                    ).localeCompare(
                        normalizeText(
                            b.game.name
                        )
                    );

                }
            )

            .map(
                item =>
                    item.game
            );

    }


    /* =========================================
       GET AVATAR DATA
    ========================================= */

    function getAvatarData(profile) {

        let data = null;


        if (
            profile &&
            profile.avatar_data
        ) {

            data =
                profile.avatar_data;

        }

        else if (
            profile &&
            profile.avatarData
        ) {

            data =
                profile.avatarData;

        }

        else if (
            profile &&
            profile.avatar
        ) {

            data =
                profile.avatar;

        }


        /* =========================================
           JSON STRING SUPPORT
        ========================================= */

        if (
            typeof data ===
            "string"
        ) {

            try {

                data =
                    JSON.parse(
                        data
                    );

            }

            catch (
                error
            ) {

                data =
                    null;

            }

        }


        if (
            !data ||
            typeof data !==
            "object"
        ) {

            data = {};

        }


        const colors =
            data.colors &&
            typeof data.colors ===
            "object"
                ? data.colors
                : {};


        return {

            gender:
                data.gender ||
                "masculine",

            colors: {

                head:
                    colors.head ||
                    "#FFD6A0",

                torso:
                    colors.torso ||
                    "#3366FF",

                arms:
                    colors.arms ||
                    "#FFD6A0",

                legs:
                    colors.legs ||
                    "#222222"

            },

            accessories:
                data.accessories &&
                typeof data.accessories ===
                "object"
                    ? data.accessories
                    : {}

        };

    }


    /* =========================================
       SAFE COLOR
    ========================================= */

    function safeColor(
        color,
        fallback
    ) {

        if (
            typeof color !==
            "string"
        ) {

            return fallback;

        }


        const test =
            document.createElement(
                "div"
            );


        test.style.color =
            color;


        if (
            test.style.color
        ) {

            return color;

        }


        return fallback;

    }


    /* =========================================
       CREATE AVATAR
    ========================================= */

    function createAvatarPreview(profile) {

        const avatarData =
            getAvatarData(
                profile
            );


        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "player-search-avatar";


        avatar.setAttribute(
            "aria-label",
            "Solaria Avatar"
        );


        /* =========================================
           HEAD
        ========================================= */

        const head =
            document.createElement(
                "div"
            );


        head.className =
            "player-search-avatar-head";


        head.style.backgroundColor =
            safeColor(
                avatarData.colors.head,
                "#FFD6A0"
            );


        /* =========================================
           TORSO
        ========================================= */

        const torso =
            document.createElement(
                "div"
            );


        torso.className =
            "player-search-avatar-torso";


        torso.style.backgroundColor =
            safeColor(
                avatarData.colors.torso,
                "#3366FF"
            );


        /* =========================================
           LEFT ARM
        ========================================= */

        const leftArm =
            document.createElement(
                "div"
            );


        leftArm.className =
            "player-search-avatar-arm left";


        leftArm.style.backgroundColor =
            safeColor(
                avatarData.colors.arms,
                "#FFD6A0"
            );


        /* =========================================
           RIGHT ARM
        ========================================= */

        const rightArm =
            document.createElement(
                "div"
            );


        rightArm.className =
            "player-search-avatar-arm right";


        rightArm.style.backgroundColor =
            safeColor(
                avatarData.colors.arms,
                "#FFD6A0"
            );


        /* =========================================
           LEFT LEG
        ========================================= */

        const leftLeg =
            document.createElement(
                "div"
            );


        leftLeg.className =
            "player-search-avatar-leg left";


        leftLeg.style.backgroundColor =
            safeColor(
                avatarData.colors.legs,
                "#222222"
            );


        /* =========================================
           RIGHT LEG
        ========================================= */

        const rightLeg =
            document.createElement(
                "div"
            );


        rightLeg.className =
            "player-search-avatar-leg right";


        rightLeg.style.backgroundColor =
            safeColor(
                avatarData.colors.legs,
                "#222222"
            );


        /* =========================================
           BUILD AVATAR
        ========================================= */

        avatar.appendChild(
            head
        );

        avatar.appendChild(
            torso
        );

        avatar.appendChild(
            leftArm
        );

        avatar.appendChild(
            rightArm
        );

        avatar.appendChild(
            leftLeg
        );

        avatar.appendChild(
            rightLeg
        );


        return avatar;

    }


    /* =========================================
       CREATE GAME ICON
    ========================================= */

    function createGamePreview(game) {

        const preview =
            document.createElement(
                "div"
            );


        preview.className =
            "player-search-game";


        preview.setAttribute(
            "aria-label",
            "Solaria Game"
        );


        /* =========================================
           BASEPLATE
        ========================================= */

        const baseplate =
            document.createElement(
                "div"
            );


        baseplate.className =
            "player-search-game-baseplate";


        /* =========================================
           GRID
        ========================================= */

        const grid =
            document.createElement(
                "div"
            );


        grid.className =
            "player-search-game-grid";


        /* =========================================
           BALL
        ========================================= */

        const ball =
            document.createElement(
                "div"
            );


        ball.className =
            "player-search-game-ball";


        ball.textContent =
            "●";


        /* =========================================
           BUILD
        ========================================= */

        baseplate.appendChild(
            grid
        );

        baseplate.appendChild(
            ball
        );

        preview.appendChild(
            baseplate
        );


        return preview;

    }


    /* =========================================
       OPEN PLAYER PROFILE
    ========================================= */

    function openPlayerProfile(profile) {

        if (
            !profile ||
            !profile.username
        ) {

            console.error(
                "[Solaria Search] Invalid player profile."
            );

            return;

        }


        const username =
            String(
                profile.username
            ).trim();


        if (
            !username
        ) {

            return;

        }


        console.log(
            "[Solaria Search] Opening player profile:",
            username
        );


        window.location.href =
            "./playerProfile.html?username=" +
            encodeURIComponent(
                username
            );

    }


    /* =========================================
       OPEN GAME PROFILE
    ========================================= */

    function openGame(game) {

        if (
            !game ||
            !game.id
        ) {

            console.error(
                "[Solaria Search] Invalid game."
            );

            return;

        }


        console.log(
            "[Solaria Search] Opening game profile:",
            game.name
        );


        /*
         * GAME SEARCH RESULT
         *        ↓
         * GAME PROFILE
         *        ↓
         * PLAY
         *        ↓
         * SOLARIA ENGINE
         */

        window.location.href =
            "./GameProfile.html?game=" +
            encodeURIComponent(
                game.id
            );

    }


    /* =========================================
       CREATE PLAYER RESULT
    ========================================= */

    function createPlayerResult(
        profile,
        index
    ) {

        const result =
            document.createElement(
                "button"
            );


        result.type =
            "button";


        result.className =
            "player-search-result";


        result.dataset.username =
            profile.username;


        /* =========================================
           RESULT NUMBER
        ========================================= */

        const number =
            document.createElement(
                "div"
            );


        number.className =
            "player-search-result-number";


        number.textContent =
            String(
                index + 1
            );


        /* =========================================
           AVATAR
        ========================================= */

        const avatar =
            createAvatarPreview(
                profile
            );


        /* =========================================
           RESULT INFORMATION
        ========================================= */

        const information =
            document.createElement(
                "div"
            );


        information.className =
            "player-search-result-info";


        /* =========================================
           DISPLAY NAME
        ========================================= */

        const displayName =
            document.createElement(
                "div"
            );


        displayName.className =
            "player-search-result-display";


        displayName.textContent =
            profile.display_name ||
            profile.username ||
            "Player";


        /* =========================================
           USERNAME
        ========================================= */

        const username =
            document.createElement(
                "div"
            );


        username.className =
            "player-search-result-username";


        username.textContent =
            "@" +
            profile.username;


        information.appendChild(
            displayName
        );

        information.appendChild(
            username
        );


        /* =========================================
           ARROW
        ========================================= */

        const arrow =
            document.createElement(
                "div"
            );


        arrow.className =
            "player-search-result-arrow";


        arrow.textContent =
            "›";


        /* =========================================
           BUILD RESULT
        ========================================= */

        result.appendChild(
            number
        );

        result.appendChild(
            avatar
        );

        result.appendChild(
            information
        );

        result.appendChild(
            arrow
        );


        /* =========================================
           CLICK
        ========================================= */

        result.addEventListener(
            "click",
            function () {

                openPlayerProfile(
                    profile
                );

            }
        );


        return result;

    }


    /* =========================================
       CREATE GAME RESULT
    ========================================= */

    function createGameResult(
        game,
        index
    ) {

        const result =
            document.createElement(
                "button"
            );


        result.type =
            "button";


        result.className =
            "player-search-result game-search-result";


        result.dataset.game =
            game.id;


        /* =========================================
           RESULT NUMBER
        ========================================= */

        const number =
            document.createElement(
                "div"
            );


        number.className =
            "player-search-result-number";


        number.textContent =
            String(
                index + 1
            );


        /* =========================================
           GAME PREVIEW
        ========================================= */

        const preview =
            createGamePreview(
                game
            );


        /* =========================================
           RESULT INFORMATION
        ========================================= */

        const information =
            document.createElement(
                "div"
            );


        information.className =
            "player-search-result-info";


        /* =========================================
           GAME NAME
        ========================================= */

        const name =
            document.createElement(
                "div"
            );


        name.className =
            "player-search-result-display";


        name.textContent =
            game.name;


        /* =========================================
           GAME DESCRIPTION
        ========================================= */

        const description =
            document.createElement(
                "div"
            );


        description.className =
            "player-search-result-username";


        description.textContent =
            game.description;


        information.appendChild(
            name
        );

        information.appendChild(
            description
        );


        /* =========================================
           ARROW
        ========================================= */

        const arrow =
            document.createElement(
                "div"
            );


        arrow.className =
            "player-search-result-arrow";


        arrow.textContent =
            "›";


        /* =========================================
           BUILD RESULT
        ========================================= */

        result.appendChild(
            number
        );

        result.appendChild(
            preview
        );

        result.appendChild(
            information
        );

        result.appendChild(
            arrow
        );


        /* =========================================
           CLICK
        ========================================= */

        result.addEventListener(
            "click",
            function () {

                openGame(
                    game
                );

            }
        );


        return result;

    }


    /* =========================================
       CREATE SECTION TITLE
    ========================================= */

    function createSectionTitle(
        icon,
        title
    ) {

        const section =
            document.createElement(
                "div"
            );


        section.className =
            "search-result-section-title";


        const titleText =
            document.createElement(
                "span"
            );


        titleText.textContent =
            icon +
            " " +
            title;


        section.appendChild(
            titleText
        );


        return section;

    }


    /* =========================================
       DISPLAY PLAYER RESULTS
    ========================================= */

    function displayPlayerResults(
        profiles
    ) {

        if (
            !Array.isArray(
                profiles
            ) ||
            profiles.length === 0
        ) {

            return;

        }


        resultsContainer.appendChild(
            createSectionTitle(
                "👤",
                "PLAYERS"
            )
        );


        profiles.forEach(
            (
                profile,
                index
            ) => {

                const result =
                    createPlayerResult(
                        profile,
                        index
                    );


                resultsContainer.appendChild(
                    result
                );

            }
        );

    }


    /* =========================================
       DISPLAY GAME RESULTS
    ========================================= */

    function displayGameResults(
        gameList
    ) {

        if (
            !Array.isArray(
                gameList
            ) ||
            gameList.length === 0
        ) {

            return;

        }


        resultsContainer.appendChild(
            createSectionTitle(
                "🎮",
                "GAMES"
            )
        );


        gameList.forEach(
            (
                game,
                index
            ) => {

                const result =
                    createGameResult(
                        game,
                        index
                    );


                resultsContainer.appendChild(
                    result
                );

            }
        );

    }


    /* =========================================
       SEARCH PLAYER + GAMES
    ========================================= */

    async function searchPlayer(
        suppliedQuery = null
    ) {

        const query =
            suppliedQuery !== null
                ? String(
                    suppliedQuery
                ).trim()
                : searchInput.value.trim();


        searchInput.value =
            query;


        console.log(
            "================================"
        );

        console.log(
            "Solaria Search"
        );

        console.log(
            "Query:",
            query
        );

        console.log(
            "================================"
        );


        /* =========================================
           EMPTY SEARCH
        ========================================= */

        if (
            !query
        ) {

            clearResults();

            showMessage(
                "Please enter a player or game."
            );

            searchInput.focus();

            return;

        }


        /* =========================================
           MAX LENGTH
        ========================================= */

        if (
            query.length > 50
        ) {

            clearResults();

            showMessage(
                "Search must be 50 characters or less."
            );

            return;

        }


        /* =========================================
           START SEARCH
        ========================================= */

        clearResults();

        showMessage(
            "Searching..."
        );


        /*
         * Games are currently local.
         *
         * Later this can be replaced with
         * the Solaria game database.
         */

        const rankedGames =
            rankGames(
                games,
                query
            );


        let rankedProfiles =
            [];


        /* =========================================
           PLAYER SEARCH
        ========================================= */

        try {

            if (
                window.blockworldProfile
            ) {

                /* =====================================
                   CURRENT API
                ===================================== */

                if (
                    typeof window
                        .blockworldProfile
                        .search ===
                    "function"
                ) {

                    const result =
                        await window
                            .blockworldProfile
                            .search(
                                query
                            );


                    let profiles =
                        [];


                    if (
                        Array.isArray(
                            result
                        )
                    ) {

                        profiles =
                            result;

                    }

                    else if (
                        result &&
                        Array.isArray(
                            result.profiles
                        )
                    ) {

                        profiles =
                            result.profiles;

                    }

                    else if (
                        result &&
                        Array.isArray(
                            result.data
                        )
                    ) {

                        profiles =
                            result.data;

                    }


                    rankedProfiles =
                        rankProfiles(
                            profiles,
                            query
                        );

                }


                /* =====================================
                   LEGACY API
                ===================================== */

                else if (
                    typeof window
                        .blockworldProfile
                        .searchProfiles ===
                    "function"
                ) {

                    const result =
                        await window
                            .blockworldProfile
                            .searchProfiles(
                                query
                            );


                    const profiles =
                        result &&
                        Array.isArray(
                            result.profiles
                        )
                            ? result.profiles
                            : Array.isArray(
                                result
                            )
                                ? result
                                : [];


                    rankedProfiles =
                        rankProfiles(
                            profiles,
                            query
                        );

                }


                /* =====================================
                   EXACT USERNAME FALLBACK
                ===================================== */

                else if (
                    typeof window
                        .blockworldProfile
                        .findByUsername ===
                    "function"
                ) {

                    const result =
                        await window
                            .blockworldProfile
                            .findByUsername(
                                query
                            );


                    if (
                        result &&
                        result.profile
                    ) {

                        rankedProfiles =
                            [
                                result.profile
                            ];

                    }

                }

            }

        }

        catch (
            error
        ) {

            /*
             * Player search failing should NOT
             * prevent game search from working.
             */

            console.error(
                "[Solaria Search] Player search error:",
                error
            );

        }


        /* =========================================
           DISPLAY EVERYTHING
        ========================================= */

        clearResults();


        const hasPlayers =
            rankedProfiles.length >
            0;


        const hasGames =
            rankedGames.length >
            0;


        if (
            !hasPlayers &&
            !hasGames
        ) {

            showMessage(
                "No players or games found."
            );

            return;

        }


        clearMessage();


        /* =========================================
           PLAYERS
        ========================================= */

        if (
            hasPlayers
        ) {

            displayPlayerResults(
                rankedProfiles
            );

        }


        /* =========================================
           GAMES
        ========================================= */

        if (
            hasGames
        ) {

            displayGameResults(
                rankedGames
            );

        }

    }


    /* =========================================
       ENTER KEY
    ========================================= */

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                searchPlayer();

            }

        }
    );


    /* =========================================
       PUBLIC PLAYER API
    ========================================= */

    window.blockworldPlayerSearch = {

        search:
            searchPlayer,

        clear:
            function () {

                clearResults();

                clearMessage();

            }

    };


    /* =========================================
       PUBLIC GAME API
    ========================================= */

    window.SolariaGameSearch = {

        getGames() {

            return [
                ...games
            ];

        },

        search(
            query
        ) {

            return rankGames(
                games,
                query
            );

        }

    };


    /* =========================================
       STARTUP
    ========================================= */

    console.log(
        "[Solaria Search] Player + Game Search loaded."
    );

})();