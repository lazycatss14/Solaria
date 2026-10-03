/* =========================================================
   SOLARIA AVATAR EDITOR
   ========================================================= */

/*
 * Three.js is provided by the import map in avatar.html.
 */

import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   SETTINGS
   ========================================================= */

const AVATAR_MODEL_PATH =
    "../assets/avatar/rigs/blockworld-r6.glb";


/*
 * TRUE = use the built-in R6 rig.
 *
 * The editor can still display the R6 preview even when
 * the actual game is configured to use the ball.
 */

const USE_PLACEHOLDER = true;


/* =========================================================
   AVATAR DATA
   ========================================================= */

const avatarData = {

    /*
     * Player gender selection.
     */

    gender: "masculine",


    /*
     * How the avatar should appear inside the game.
     *
     * "ball"
     *     The player is represented by a rolling ball.
     *
     * "character"
     *     The player will eventually use the actual
     *     Solaria character model.
     */

    renderMode: "ball",


    /*
     * Avatar colors.
     */

    colors: {

        head: "#FFD6A0",

        torso: "#3366FF",

        arms: "#FFD6A0",

        legs: "#222222"

    }

};


/* =========================================================
   THREE.JS VARIABLES
   ========================================================= */

let scene = null;

let camera = null;

let renderer = null;

let controls = null;

let avatar = null;

let autoSpin = false;


/* =========================================================
   START
   ========================================================= */

function startAvatarEditor() {

    console.log(
        "[Solaria Avatar] Starting..."
    );


    loadSavedAvatar();


    setupThree();


    setupControls();


    loadAvatar();


    updateColorInputs();


    updateGenderButtons();


    updateRenderModeControls();


    console.log(
        "[Solaria Avatar] Ready!"
    );
}


/*
 * This is intentionally NOT dependent only on
 * DOMContentLoaded.
 */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAvatarEditor,
        {
            once: true
        }
    );

} else {

    startAvatarEditor();

}


/* =========================================================
   THREE.JS SETUP
   ========================================================= */

function setupThree() {

    const container =
        document.getElementById(
            "avatarPreview"
        );


    if (!container) {

        console.error(
            "[Solaria Avatar] Could not find #avatarPreview."
        );

        return;
    }


    /*
     * SCENE
     */

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0xe8e8e8
        );


    /*
     * CAMERA
     */

    const width =
        Math.max(
            container.clientWidth,
            1
        );


    const height =
        Math.max(
            container.clientHeight,
            1
        );


    camera =
        new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        );


    camera.position.set(
        0,
        3,
        8
    );


    /*
     * RENDERER
     */

    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        width,
        height
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.shadowMap.enabled =
        true;


    container.innerHTML = "";


    container.appendChild(
        renderer.domElement
    );


    /*
     * LIGHTING
     */

    const hemisphereLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x666666,
            2
        );


    scene.add(
        hemisphereLight
    );


    const keyLight =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );


    keyLight.position.set(
        5,
        8,
        5
    );


    keyLight.castShadow =
        true;


    scene.add(
        keyLight
    );


    const fillLight =
        new THREE.DirectionalLight(
            0xffffff,
            1
        );


    fillLight.position.set(
        -5,
        4,
        -5
    );


    scene.add(
        fillLight
    );


    /*
     * ORBIT CONTROLS
     */

    controls =
        new OrbitControls(
            camera,
            renderer.domElement
        );


    controls.enablePan =
        false;


    controls.enableDamping =
        true;


    controls.dampingFactor =
        0.08;


    controls.minDistance =
        3;


    controls.maxDistance =
        15;


    controls.target.set(
        0,
        3,
        0
    );


    /*
     * RESIZE
     */

    window.addEventListener(
        "resize",
        resizeRenderer
    );


    /*
     * START RENDER LOOP
     */

    animate();
}


/* =========================================================
   LOAD AVATAR
   ========================================================= */

function loadAvatar() {

    console.log(
        "[Solaria Avatar] Loading avatar..."
    );


    /*
     * PLACEHOLDER R6
     */

    if (USE_PLACEHOLDER) {

        createPlaceholderAvatar();

        return;
    }


    /*
     * REAL GLB
     */

    const loader =
        new GLTFLoader();


    loader.load(

        AVATAR_MODEL_PATH,

        (gltf) => {

            console.log(
                "[Solaria Avatar] R6 GLB loaded."
            );


            avatar =
                gltf.scene;


            avatar.name =
                "SolariaR6";


            /*
             * Make model parts cast shadows.
             */

            avatar.traverse(
                (object) => {

                    if (
                        object.isMesh
                    ) {

                        object.castShadow =
                            true;

                        object.receiveShadow =
                            true;

                    }

                }
            );


            scene.add(
                avatar
            );


            centerAvatar();


            applyAvatarColors();


            frameAvatar();

        },

        (progress) => {

            if (
                progress.total > 0
            ) {

                const percent =
                    (
                        progress.loaded /
                        progress.total
                    ) * 100;


                console.log(
                    "[Solaria Avatar] Loading " +
                    Math.round(percent) +
                    "%"
                );

            }

        },

        (error) => {

            console.error(
                "[Solaria Avatar] Could not load GLB.",
                error
            );


            console.log(
                "[Solaria Avatar] Using placeholder R6."
            );


            createPlaceholderAvatar();

        }

    );
}


/* =========================================================
   CREATE PLACEHOLDER R6
   ========================================================= */

function createPlaceholderAvatar() {

    console.log(
        "[Solaria Avatar] Creating R6 preview..."
    );


    /*
     * Delete previous avatar.
     */

    if (avatar) {

        scene.remove(
            avatar
        );

    }


    /*
     * Create R6 container.
     */

    avatar =
        new THREE.Group();


    avatar.name =
        "SolariaR6";


    /* =====================================================
       HEAD
       ===================================================== */

    const head =
        createPart(
            "Head",
            1.8,
            1.8,
            1.8
        );


    head.position.set(
        0,
        5.4,
        0
    );


    /* =====================================================
       TORSO
       ===================================================== */

    const torso =
        createPart(
            "Torso",
            2,
            2.4,
            1
        );


    torso.position.set(
        0,
        3.3,
        0
    );


    /* =====================================================
       LEFT ARM
       ===================================================== */

    const leftArm =
        createPart(
            "LeftArm",
            1,
            2.4,
            1
        );


    leftArm.position.set(
        -1.5,
        3.3,
        0
    );


    /* =====================================================
       RIGHT ARM
       ===================================================== */

    const rightArm =
        createPart(
            "RightArm",
            1,
            2.4,
            1
        );


    rightArm.position.set(
        1.5,
        3.3,
        0
    );


    /* =====================================================
       LEFT LEG
       ===================================================== */

    const leftLeg =
        createPart(
            "LeftLeg",
            1,
            2.4,
            1
        );


    leftLeg.position.set(
        -0.5,
        1,
        0
    );


    /* =====================================================
       RIGHT LEG
       ===================================================== */

    const rightLeg =
        createPart(
            "RightLeg",
            1,
            2.4,
            1
        );


    rightLeg.position.set(
        0.5,
        1,
        0
    );


    /*
     * Add all six R6 body parts.
     */

    avatar.add(
        head,
        torso,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
    );


    /*
     * Add the avatar to the scene.
     */

    scene.add(
        avatar
    );


    /*
     * Center it.
     */

    centerAvatar();


    /*
     * Apply colors.
     */

    applyAvatarColors();


    /*
     * Position camera.
     */

    frameAvatar();


    console.log(
        "[Solaria Avatar] R6 preview created."
    );
}


/* =========================================================
   CREATE BODY PART
   ========================================================= */

function createPart(
    name,
    width,
    height,
    depth
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );


    const material =
        new THREE.MeshStandardMaterial({

            color: 0xffffff,

            roughness: 0.75,

            metalness: 0

        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.name =
        name;


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    return mesh;
}


/* =========================================================
   CENTER AVATAR
   ========================================================= */

function centerAvatar() {

    if (!avatar) {

        return;
    }


    const box =
        new THREE.Box3()
            .setFromObject(
                avatar
            );


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    avatar.position.x =
        -center.x;


    avatar.position.z =
        -center.z;
}


/* =========================================================
   FRAME AVATAR
   ========================================================= */

function frameAvatar() {

    if (
        !avatar ||
        !camera ||
        !controls
    ) {

        return;
    }


    const box =
        new THREE.Box3()
            .setFromObject(
                avatar
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    const maxSize =
        Math.max(
            size.x,
            size.y,
            size.z
        );


    const distance =
        Math.max(
            maxSize * 1.8,
            5
        );


    camera.position.set(
        distance,
        center.y + maxSize * 0.15,
        distance
    );


    controls.target.copy(
        center
    );


    controls.update();
}


/* =========================================================
   FIND BODY PART
   ========================================================= */

function findPart(
    partName
) {

    if (!avatar) {

        return null;
    }


    let result =
        null;


    avatar.traverse(
        (object) => {

            if (
                object.name ===
                partName
            ) {

                result =
                    object;

            }

        }
    );


    return result;
}


/* =========================================================
   APPLY AVATAR COLORS
   ========================================================= */

function applyAvatarColors() {

    if (!avatar) {

        return;
    }


    setPartColor(
        "Head",
        avatarData.colors.head
    );


    setPartColor(
        "Torso",
        avatarData.colors.torso
    );


    setPartColor(
        "LeftArm",
        avatarData.colors.arms
    );


    setPartColor(
        "RightArm",
        avatarData.colors.arms
    );


    setPartColor(
        "LeftLeg",
        avatarData.colors.legs
    );


    setPartColor(
        "RightLeg",
        avatarData.colors.legs
    );
}


/* =========================================================
   SET PART COLOR
   ========================================================= */

function setPartColor(
    partName,
    color
) {

    const part =
        findPart(
            partName
        );


    if (!part) {

        console.warn(
            "[Solaria Avatar] Missing body part:",
            partName
        );

        return;
    }


    /*
     * Standard material.
     */

    if (
        part.material &&
        part.material.color
    ) {

        part.material.color.set(
            color
        );


        part.material.needsUpdate =
            true;


        return;
    }


    /*
     * Multiple materials.
     */

    if (
        Array.isArray(
            part.material
        )
    ) {

        part.material.forEach(
            (material) => {

                if (
                    material &&
                    material.color
                ) {

                    material.color.set(
                        color
                    );


                    material.needsUpdate =
                        true;

                }

            }
        );

    }
}


/* =========================================================
   SETUP CONTROLS
   ========================================================= */

function setupControls() {

    /*
     * COLOR INPUTS
     */

    const headColor =
        document.getElementById(
            "headColor"
        );


    const torsoColor =
        document.getElementById(
            "torsoColor"
        );


    const armsColor =
        document.getElementById(
            "armsColor"
        );


    const legsColor =
        document.getElementById(
            "legsColor"
        );


    /*
     * HEAD COLOR
     */

    if (headColor) {

        headColor.addEventListener(
            "input",
            () => {

                avatarData.colors.head =
                    headColor.value;


                setPartColor(
                    "Head",
                    headColor.value
                );

            }
        );

    }


    /*
     * TORSO COLOR
     */

    if (torsoColor) {

        torsoColor.addEventListener(
            "input",
            () => {

                avatarData.colors.torso =
                    torsoColor.value;


                setPartColor(
                    "Torso",
                    torsoColor.value
                );

            }
        );

    }


    /*
     * ARM COLOR
     */

    if (armsColor) {

        armsColor.addEventListener(
            "input",
            () => {

                avatarData.colors.arms =
                    armsColor.value;


                setPartColor(
                    "LeftArm",
                    armsColor.value
                );


                setPartColor(
                    "RightArm",
                    armsColor.value
                );

            }
        );

    }


    /*
     * LEG COLOR
     */

    if (legsColor) {

        legsColor.addEventListener(
            "input",
            () => {

                avatarData.colors.legs =
                    legsColor.value;


                setPartColor(
                    "LeftLeg",
                    legsColor.value
                );


                setPartColor(
                    "RightLeg",
                    legsColor.value
                );

            }
        );

    }


    /* =====================================================
       GENDER BUTTONS
       ===================================================== */

    const genderButtons =
        document.querySelectorAll(
            ".gender-button"
        );


    genderButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    avatarData.gender =
                        button.dataset.gender;


                    updateGenderButtons();


                    console.log(
                        "[Solaria Avatar] Gender:",
                        avatarData.gender
                    );

                }
            );

        }
    );


    /* =====================================================
       GAME AVATAR / RENDER MODE
       ===================================================== */

    setupRenderModeControls();


    /* =====================================================
       AUTO SPIN
       ===================================================== */

    const spinButton =
        document.getElementById(
            "spinButton"
        );


    if (spinButton) {

        spinButton.addEventListener(
            "click",
            () => {

                autoSpin =
                    !autoSpin;


                spinButton.classList.toggle(
                    "active",
                    autoSpin
                );


                spinButton.textContent =
                    autoSpin
                        ? "STOP SPIN"
                        : "AUTO SPIN";

            }
        );

    }


    /* =====================================================
       BACK BUTTON
       ===================================================== */

    const backButton =
        document.getElementById(
            "backButton"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.history.back();

            }
        );

    }


    /* =====================================================
       SAVE BUTTON
       ===================================================== */

    const saveButton =
        document.getElementById(
            "saveButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveAvatar
        );

    }
}


/* =========================================================
   GAME AVATAR / RENDER MODE CONTROLS
   ========================================================= */

function setupRenderModeControls() {

    /*
     * We support several possible IDs so the editor can
     * use either buttons or radio inputs.
     */


    const ballButton =
        document.getElementById(
            "renderBall"
        );


    const characterButton =
        document.getElementById(
            "renderCharacter"
        );


    /*
     * BALL
     */

    if (ballButton) {

        ballButton.addEventListener(
            "click",
            () => {

                setRenderMode(
                    "ball"
                );

            }
        );


        if (
            ballButton.type ===
            "radio"
        ) {

            ballButton.addEventListener(
                "change",
                () => {

                    if (
                        ballButton.checked
                    ) {

                        setRenderMode(
                            "ball"
                        );

                    }

                }
            );

        }

    }


    /*
     * CHARACTER
     */

    if (characterButton) {

        characterButton.addEventListener(
            "click",
            () => {

                setRenderMode(
                    "character"
                );

            }
        );


        if (
            characterButton.type ===
            "radio"
        ) {

            characterButton.addEventListener(
                "change",
                () => {

                    if (
                        characterButton.checked
                    ) {

                        setRenderMode(
                            "character"
                        );

                    }

                }
            );

        }

    }


    /*
     * Also support elements using
     * data-render-mode.
     */

    const renderOptions =
        document.querySelectorAll(
            "[data-render-mode]"
        );


    renderOptions.forEach(
        (option) => {

            option.addEventListener(
                "click",
                () => {

                    const mode =
                        option.dataset.renderMode;


                    if (
                        mode === "ball" ||
                        mode === "character"
                    ) {

                        setRenderMode(
                            mode
                        );

                    }

                }
            );

        }
    );
}


/* =========================================================
   SET RENDER MODE
   ========================================================= */

function setRenderMode(
    mode
) {

    if (
        mode !== "ball" &&
        mode !== "character"
    ) {

        return;
    }


    avatarData.renderMode =
        mode;


    updateRenderModeControls();


    console.log(
        "[Solaria Avatar] Game avatar:",
        avatarData.renderMode
    );
}


/* =========================================================
   UPDATE RENDER MODE CONTROLS
   ========================================================= */

function updateRenderModeControls() {

    const ballButton =
        document.getElementById(
            "renderBall"
        );


    const characterButton =
        document.getElementById(
            "renderCharacter"
        );


    /*
     * Update normal buttons.
     */

    if (ballButton) {

        ballButton.classList.toggle(
            "active",
            avatarData.renderMode === "ball"
        );

    }


    if (characterButton) {

        characterButton.classList.toggle(
            "active",
            avatarData.renderMode === "character"
        );

    }


    /*
     * Update radio inputs.
     */

    if (
        ballButton &&
        ballButton.type ===
        "radio"
    ) {

        ballButton.checked =
            avatarData.renderMode === "ball";

    }


    if (
        characterButton &&
        characterButton.type ===
        "radio"
    ) {

        characterButton.checked =
            avatarData.renderMode === "character";

    }


    /*
     * Update anything using data-render-mode.
     */

    const renderOptions =
        document.querySelectorAll(
            "[data-render-mode]"
        );


    renderOptions.forEach(
        (option) => {

            option.classList.toggle(
                "active",
                option.dataset.renderMode ===
                    avatarData.renderMode
            );

        }
    );
}


/* =========================================================
   UPDATE COLOR INPUTS
   ========================================================= */

function updateColorInputs() {

    const headColor =
        document.getElementById(
            "headColor"
        );


    const torsoColor =
        document.getElementById(
            "torsoColor"
        );


    const armsColor =
        document.getElementById(
            "armsColor"
        );


    const legsColor =
        document.getElementById(
            "legsColor"
        );


    if (headColor) {

        headColor.value =
            avatarData.colors.head;

    }


    if (torsoColor) {

        torsoColor.value =
            avatarData.colors.torso;

    }


    if (armsColor) {

        armsColor.value =
            avatarData.colors.arms;

    }


    if (legsColor) {

        legsColor.value =
            avatarData.colors.legs;

    }
}


/* =========================================================
   UPDATE GENDER BUTTONS
   ========================================================= */

function updateGenderButtons() {

    const buttons =
        document.querySelectorAll(
            ".gender-button"
        );


    buttons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.gender ===
                    avatarData.gender
            );

        }
    );
}


/* =========================================================
   SAVE AVATAR
   ========================================================= */

function saveAvatar() {

    /*
     * Convert avatar data into JSON.
     *
     * renderMode is included automatically.
     */

    const savedAvatar =
        JSON.stringify(
            avatarData
        );


    /*
     * Save it permanently in this
     * browser/Electron installation.
     */

    localStorage.setItem(
        "blockworldAvatar",
        savedAvatar
    );


    console.log(
        "[Solaria Avatar] Saved:",
        avatarData
    );


    /*
     * Change button to SAVED!
     */

    const saveButton =
        document.getElementById(
            "saveButton"
        );


    if (saveButton) {

        const oldText =
            saveButton.textContent;


        saveButton.textContent =
            "SAVED!";


        saveButton.classList.add(
            "saved"
        );


        setTimeout(
            () => {

                saveButton.textContent =
                    oldText;


                saveButton.classList.remove(
                    "saved"
                );

            },
            1500
        );

    }
}


/* =========================================================
   LOAD SAVED AVATAR
   ========================================================= */

function loadSavedAvatar() {

    const saved =
        localStorage.getItem(
            "blockworldAvatar"
        );


    if (!saved) {

        /*
         * New accounts default to the ball.
         */

        avatarData.renderMode =
            "ball";


        return;
    }


    try {

        const data =
            JSON.parse(
                saved
            );


        /*
         * Gender
         */

        if (
            data.gender === "masculine" ||
            data.gender === "feminine"
        ) {

            avatarData.gender =
                data.gender;

        }


        /*
         * Render mode
         *
         * Older saved avatars will automatically
         * become "ball".
         */

        if (
            data.renderMode === "ball" ||
            data.renderMode === "character"
        ) {

            avatarData.renderMode =
                data.renderMode;

        } else {

            avatarData.renderMode =
                "ball";

        }


        /*
         * Colors
         */

        if (
            data.colors &&
            typeof data.colors === "object"
        ) {

            if (
                typeof data.colors.head ===
                "string"
            ) {

                avatarData.colors.head =
                    data.colors.head;

            }


            if (
                typeof data.colors.torso ===
                "string"
            ) {

                avatarData.colors.torso =
                    data.colors.torso;

            }


            if (
                typeof data.colors.arms ===
                "string"
            ) {

                avatarData.colors.arms =
                    data.colors.arms;

            }


            if (
                typeof data.colors.legs ===
                "string"
            ) {

                avatarData.colors.legs =
                    data.colors.legs;

            }

        }


        console.log(
            "[Solaria Avatar] Saved avatar loaded."
        );


        console.log(
            "[Solaria Avatar] Render mode:",
            avatarData.renderMode
        );

    } catch (error) {

        console.error(
            "[Solaria Avatar] Could not load saved avatar:",
            error
        );


        /*
         * Safe fallback.
         */

        avatarData.renderMode =
            "ball";

    }
}


/* =========================================================
   GET AVATAR DATA
   ========================================================= */

/*
 * This makes the avatar data available to other
 * Solaria JavaScript files.
 *
 * Later the game launcher can use this to determine
 * whether the player should spawn as a ball or character.
 */

window.SolariaAvatar = {

    getData() {

        return JSON.parse(
            JSON.stringify(
                avatarData
            )
        );

    },


    getRenderMode() {

        return avatarData.renderMode;

    },


    getColors() {

        return {
            ...avatarData.colors
        };

    },


    setRenderMode(
        mode
    ) {

        setRenderMode(
            mode
        );

    }

};


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    /*
     * Auto rotation
     */

    if (
        avatar &&
        autoSpin
    ) {

        avatar.rotation.y +=
            0.01;

    }


    /*
     * Update controls
     */

    if (controls) {

        controls.update();

    }


    /*
     * Render scene
     */

    if (
        renderer &&
        scene &&
        camera
    ) {

        renderer.render(
            scene,
            camera
        );

    }
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeRenderer() {

    const container =
        document.getElementById(
            "avatarPreview"
        );


    if (
        !container ||
        !camera ||
        !renderer
    ) {

        return;
    }


    const width =
        Math.max(
            container.clientWidth,
            1
        );


    const height =
        Math.max(
            container.clientHeight,
            1
        );


    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );
}