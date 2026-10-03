// ==========================================
// BLOCKWORLD MUSIC SYSTEM
// Global Music + Now Playing Metadata
// ==========================================

console.log("BlockWorld music system starting...");


// ==========================================
// MUSIC FILE
// ==========================================

const MUSIC_FILE = "./audio/blockworld.mp3";

const MUSIC_SETTINGS_KEY =
    "blockworld_music_settings";

const DEFAULT_MUSIC_SETTINGS = {
    enabled: true,
    volume: 0.5
};


// ==========================================
// MUSIC METADATA
// ==========================================

const DEFAULT_MUSIC_METADATA = {
    name: "BlockWorld Music",
    creator: "Unknown",
    description: ""
};

let currentMusicMetadata = {
    ...DEFAULT_MUSIC_METADATA
};


// ==========================================
// VARIABLES
// ==========================================

let blockWorldMusic = null;

let musicSettings = {
    ...DEFAULT_MUSIC_SETTINGS
};


// ==========================================
// LOAD SETTINGS
// ==========================================

function loadMusicSettings() {

    try {

        const saved =
            localStorage.getItem(
                MUSIC_SETTINGS_KEY
            );

        if (!saved) {

            musicSettings = {
                ...DEFAULT_MUSIC_SETTINGS
            };

            return;

        }

        const parsed =
            JSON.parse(saved);

        musicSettings = {
            ...DEFAULT_MUSIC_SETTINGS,
            ...parsed
        };

        musicSettings.enabled =
            Boolean(
                musicSettings.enabled
            );

        musicSettings.volume =
            Number(
                musicSettings.volume
            );

        if (
            Number.isNaN(
                musicSettings.volume
            )
        ) {

            musicSettings.volume =
                DEFAULT_MUSIC_SETTINGS.volume;

        }

        musicSettings.volume =
            Math.max(
                0,
                Math.min(
                    1,
                    musicSettings.volume
                )
            );

    }
    catch (error) {

        console.error(
            "Could not load music settings:",
            error
        );

        musicSettings = {
            ...DEFAULT_MUSIC_SETTINGS
        };

    }

}


// ==========================================
// SAVE SETTINGS
// ==========================================

function saveMusicSettings() {

    try {

        localStorage.setItem(
            MUSIC_SETTINGS_KEY,
            JSON.stringify(
                musicSettings
            )
        );

    }
    catch (error) {

        console.error(
            "Could not save music settings:",
            error
        );

    }

}


// ==========================================
// CREATE AUDIO
// ==========================================

function createMusicPlayer() {

    if (blockWorldMusic) {

        return blockWorldMusic;

    }

    blockWorldMusic =
        new Audio(
            MUSIC_FILE
        );

    blockWorldMusic.loop =
        true;

    blockWorldMusic.preload =
        "auto";

    blockWorldMusic.volume =
        musicSettings.volume;

    blockWorldMusic.addEventListener(
        "error",
        () => {

            console.error(
                "BlockWorld music could not be loaded:",
                MUSIC_FILE
            );

        }
    );

    return blockWorldMusic;

}


// ==========================================
// GET CONTENTS FILE
// ==========================================

function getMusicContentsFile() {

    const lastDot =
        MUSIC_FILE.lastIndexOf(".");

    if (lastDot === -1) {

        return (
            MUSIC_FILE +
            ".contents.txt"
        );

    }

    return (
        MUSIC_FILE.substring(
            0,
            lastDot
        ) +
        ".contents.txt"
    );

}


// ==========================================
// LOAD MUSIC METADATA
// ==========================================

async function loadMusicMetadata() {

    currentMusicMetadata = {
        ...DEFAULT_MUSIC_METADATA
    };

    const contentsFile =
        getMusicContentsFile();

    try {

        const response =
            await fetch(
                contentsFile,
                {
                    cache: "no-cache"
                }
            );

        if (!response.ok) {

            console.log(
                "Music contents file not found:",
                contentsFile
            );

            updateNowPlayingUI();

            return;

        }

        const text =
            await response.text();

        const lines =
            text.split(/\r?\n/);

        for (
            const line of lines
        ) {

            const trimmed =
                line.trim();

            if (!trimmed) {

                continue;

            }

            const separator =
                trimmed.indexOf(":");

            if (
                separator === -1
            ) {

                continue;

            }

            const key =
                trimmed
                    .substring(
                        0,
                        separator
                    )
                    .trim()
                    .toLowerCase();

            const value =
                trimmed
                    .substring(
                        separator + 1
                    )
                    .trim();

            if (
                key === "name" ||
                key === "title"
            ) {

                currentMusicMetadata.name =
                    value;

            }
            else if (
                key === "creator" ||
                key === "author" ||
                key === "made by"
            ) {

                currentMusicMetadata.creator =
                    value;

            }
            else if (
                key === "description"
            ) {

                currentMusicMetadata.description =
                    value;

            }

        }

        updateNowPlayingUI();

    }
    catch (error) {

        console.error(
            "Could not load music metadata:",
            error
        );

        updateNowPlayingUI();

    }

}


// ==========================================
// CREATE GLOBAL UI
// ==========================================

function createNowPlayingUI() {

    if (!document.body) {

        console.warn(
            "BlockWorld Now Playing UI is waiting for document.body."
        );

        return false;

    }

    if (
        document.getElementById(
            "blockworldNowPlaying"
        )
    ) {

        return true;

    }

    const container =
        document.createElement(
            "div"
        );

    container.id =
        "blockworldNowPlaying";

    container.innerHTML = `

        <div id="blockworldNowPlayingHeader">
            🎵 NOW PLAYING
        </div>

        <div id="blockworldNowPlayingName">
            BlockWorld Music
        </div>

        <div id="blockworldNowPlayingCreator">
            by Unknown
        </div>

        <div id="blockworldNowPlayingDescription">
        </div>

    `;

    document.body.appendChild(
        container
    );

    addNowPlayingStyles();

    updateNowPlayingUI();

    return true;

}


// ==========================================
// CREATE UI STYLES
// ==========================================

function addNowPlayingStyles() {

    if (!document.head) {

        return;

    }

    if (
        document.getElementById(
            "blockworldNowPlayingStyles"
        )
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "blockworldNowPlayingStyles";

    style.textContent = `

        #blockworldNowPlaying {

            position: fixed;

            top: 20px;
            right: 20px;

            width: 300px;

            padding: 18px;

            box-sizing: border-box;

            background:
                rgba(
                    20,
                    20,
                    25,
                    0.94
                );

            color: white;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

            border-radius: 12px;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            box-shadow:
                0 10px 30px
                rgba(
                    0,
                    0,
                    0,
                    0.35
                );

            z-index: 999999;

            pointer-events: none;

            opacity: 1;

            transform:
                translateY(0);

            transition:
                opacity 0.3s ease,
                transform 0.3s ease;

        }


        #blockworldNowPlaying.hidden {

            opacity: 0;

            transform:
                translateY(-10px);

        }


        #blockworldNowPlayingHeader {

            font-size: 12px;

            font-weight: bold;

            letter-spacing: 1px;

            opacity: 0.7;

            margin-bottom: 8px;

        }


        #blockworldNowPlayingName {

            font-size: 20px;

            font-weight: bold;

            margin-bottom: 5px;

            word-break: break-word;

        }


        #blockworldNowPlayingCreator {

            font-size: 14px;

            opacity: 0.75;

            margin-bottom: 8px;

        }


        #blockworldNowPlayingDescription {

            font-size: 13px;

            line-height: 1.4;

            opacity: 0.65;

            word-break: break-word;

        }

    `;

    document.head.appendChild(
        style
    );

}


// ==========================================
// UPDATE UI
// ==========================================

function updateNowPlayingUI() {

    if (!document.body) {

        return;

    }

    createNowPlayingUI();

    const name =
        document.getElementById(
            "blockworldNowPlayingName"
        );

    const creator =
        document.getElementById(
            "blockworldNowPlayingCreator"
        );

    const description =
        document.getElementById(
            "blockworldNowPlayingDescription"
        );

    if (name) {

        name.textContent =
            currentMusicMetadata.name;

    }

    if (creator) {

        creator.textContent =
            "by " +
            currentMusicMetadata.creator;

    }

    if (description) {

        description.textContent =
            currentMusicMetadata.description;

        if (
            currentMusicMetadata
                .description
                .trim()
                .length === 0
        ) {

            description.style.display =
                "none";

        }
        else {

            description.style.display =
                "block";

        }

    }

}


// ==========================================
// SHOW UI
// ==========================================

function showNowPlaying() {

    if (!document.body) {

        return;

    }

    createNowPlayingUI();

    const ui =
        document.getElementById(
            "blockworldNowPlaying"
        );

    if (!ui) {

        return;

    }

    ui.classList.remove(
        "hidden"
    );

}


// ==========================================
// HIDE UI
// ==========================================

function hideNowPlaying() {

    const ui =
        document.getElementById(
            "blockworldNowPlaying"
        );

    if (!ui) {

        return;

    }

    ui.classList.add(
        "hidden"
    );

}


// ==========================================
// START MUSIC
// ==========================================

async function startBlockWorldMusic() {

    loadMusicSettings();

    if (
        !musicSettings.enabled
    ) {

        return false;

    }

    createNowPlayingUI();

    const music =
        createMusicPlayer();

    music.volume =
        musicSettings.volume;

    await loadMusicMetadata();

    try {

        await music.play();

        showNowPlaying();

        console.log(
            "BlockWorld music started."
        );

        return true;

    }
    catch (error) {

        console.log(
            "Music is waiting for user interaction."
        );

        return false;

    }

}


// ==========================================
// STOP MUSIC
// ==========================================

function stopBlockWorldMusic() {

    if (!blockWorldMusic) {

        return;

    }

    blockWorldMusic.pause();

    blockWorldMusic.currentTime =
        0;

    hideNowPlaying();

}


// ==========================================
// PAUSE MUSIC
// ==========================================

function pauseBlockWorldMusic() {

    if (!blockWorldMusic) {

        return;

    }

    blockWorldMusic.pause();

}


// ==========================================
// RESUME MUSIC
// ==========================================

async function resumeBlockWorldMusic() {

    if (
        !musicSettings.enabled
    ) {

        return false;

    }

    const music =
        createMusicPlayer();

    music.volume =
        musicSettings.volume;

    try {

        await music.play();

        showNowPlaying();

        return true;

    }
    catch (error) {

        return false;

    }

}


// ==========================================
// ENABLE / DISABLE
// ==========================================

function setMusicEnabled(enabled) {

    musicSettings.enabled =
        Boolean(enabled);

    saveMusicSettings();

    if (
        musicSettings.enabled
    ) {

        startBlockWorldMusic();

    }
    else {

        stopBlockWorldMusic();

    }

    updateMusicSettingsUI();

}


// ==========================================
// VOLUME
// ==========================================

function setMusicVolume(volume) {

    let value =
        Number(volume);

    if (
        Number.isNaN(value)
    ) {

        return;

    }

    if (
        value > 1
    ) {

        value =
            value / 100;

    }

    value =
        Math.max(
            0,
            Math.min(
                1,
                value
            )
        );

    musicSettings.volume =
        value;

    saveMusicSettings();

    if (blockWorldMusic) {

        blockWorldMusic.volume =
            value;

    }

    updateMusicSettingsUI();

}


// ==========================================
// GETTERS
// ==========================================

function getMusicEnabled() {

    return Boolean(
        musicSettings.enabled
    );

}


function getMusicVolume() {

    return musicSettings.volume;

}


function getMusicVolumePercent() {

    return Math.round(
        musicSettings.volume * 100
    );

}


// ==========================================
// SETTINGS UI
// ==========================================

function updateMusicSettingsUI() {

    const toggle =
        document.getElementById(
            "musicToggle"
        );

    const slider =
        document.getElementById(
            "musicVolume"
        );

    const value =
        document.getElementById(
            "musicVolumeValue"
        );

    if (toggle) {

        toggle.checked =
            musicSettings.enabled;

    }

    if (slider) {

        slider.value =
            String(
                getMusicVolumePercent()
            );

    }

    if (value) {

        value.textContent =
            getMusicVolumePercent() +
            "%";

    }

}


// ==========================================
// SETTINGS CONTROLS
// ==========================================

function setupMusicControls() {

    const toggle =
        document.getElementById(
            "musicToggle"
        );

    const slider =
        document.getElementById(
            "musicVolume"
        );

    if (toggle) {

        toggle.addEventListener(
            "change",
            () => {

                setMusicEnabled(
                    toggle.checked
                );

            }
        );

    }

    if (slider) {

        slider.addEventListener(
            "input",
            () => {

                setMusicVolume(
                    slider.value
                );

            }
        );

    }

    updateMusicSettingsUI();

}


// ==========================================
// AUTOPLAY FALLBACK
// ==========================================

function setupMusicInteractionFallback() {

    const interaction =
        async () => {

            if (
                !musicSettings.enabled
            ) {

                return;

            }

            if (
                blockWorldMusic &&
                !blockWorldMusic.paused
            ) {

                return;

            }

            await startBlockWorldMusic();

        };

    document.addEventListener(
        "click",
        interaction
    );

    document.addEventListener(
        "keydown",
        interaction
    );

}


// ==========================================
// INITIALIZE
// ==========================================

function initializeMusic() {

    loadMusicSettings();

    createMusicPlayer();

    setupMusicControls();

    setupMusicInteractionFallback();

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                createNowPlayingUI();

                loadMusicMetadata();

            },
            {
                once: true
            }
        );

    }
    else {

        createNowPlayingUI();

        loadMusicMetadata();

    }

    console.log(
        "BlockWorld music system loaded."
    );

}


// ==========================================
// PUBLIC API
// ==========================================

window.blockWorldMusic = {

    start:
        startBlockWorldMusic,

    stop:
        stopBlockWorldMusic,

    pause:
        pauseBlockWorldMusic,

    resume:
        resumeBlockWorldMusic,

    setEnabled:
        setMusicEnabled,

    getEnabled:
        getMusicEnabled,

    setVolume:
        setMusicVolume,

    getVolume:
        getMusicVolume,

    getVolumePercent:
        getMusicVolumePercent,

    showNowPlaying:
        showNowPlaying,

    hideNowPlaying:
        hideNowPlaying,

    getMetadata:
        () => ({
            ...currentMusicMetadata
        })

};


// ==========================================
// START
// ==========================================

initializeMusic();