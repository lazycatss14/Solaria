/* =========================================================
   SOLARIA AVATAR EDITOR
   Supports the new Polytoria Avatar V3 rig
   ========================================================= */

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

// The model, scene.bin, and textures are inside:
// assets/avatar/rigs/default/

const AVATAR_MODEL_PATH =
    "../avatar/rigs/Default/scene.gltf";

// Use the actual rig instead of the old placeholder.
const USE_PLACEHOLDER = false;


/*
 * These are the actual mesh node names from your
 * supplied GLTF file.
 *
 * Each mesh is a skinned mesh, so its bones continue
 * controlling its movement.
 */

const MODEL_PARTS = {
    head: "Object_8",
    rightArm: "Object_10",
    leftLeg: "Object_12",
    leftArm: "Object_14",
    rightLeg: "Object_16",
    torso: "Object_18"
};


/* =========================================================
   AVATAR DATA
   ========================================================= */

const avatarData = {

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


/* =========================================================
   THREE.JS VARIABLES
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;
let controls = null;

let avatar = null;

let autoSpin = false;

let avatarParts = {};


/* =========================================================
   START
   ========================================================= */

function startAvatarEditor() {

    console.log("[Solaria Avatar] Starting...");

    loadSavedAvatar();

    setupThree();

    if (!renderer) {
        return;
    }

    setupControls();

    loadAvatar();

    updateColorInputs();

    updateGenderButtons();

    updateRenderModeControls();

    console.log("[Solaria Avatar] Ready!");
}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        startAvatarEditor,
        { once: true }
    );

} else {

    startAvatarEditor();

}


/* =========================================================
   THREE.JS SETUP
   ========================================================= */

function setupThree() {

    const container =
        document.getElementById("avatarPreview");

    if (!container) {

        console.error(
            "[Solaria Avatar] Could not find #avatarPreview."
        );

        return;
    }

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0xe8e8e8);


    // Camera

    const width =
        Math.max(container.clientWidth, 1);

    const height =
        Math.max(container.clientHeight, 1);

    camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        1000
    );

    camera.position.set(0, 5, 12);


    // Renderer

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(width, height);

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.shadowMap.enabled = true;

    container.innerHTML = "";

    container.appendChild(renderer.domElement);


    // Lighting

    const hemisphereLight =
        new THREE.HemisphereLight(
            0xffffff,
            0x666666,
            2
        );

    scene.add(hemisphereLight);


    const keyLight =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );

    keyLight.position.set(5, 8, 5);

    keyLight.castShadow = true;

    scene.add(keyLight);


    const fillLight =
        new THREE.DirectionalLight(
            0xffffff,
            1
        );

    fillLight.position.set(-5, 4, -5);

    scene.add(fillLight);


    // Orbit controls

    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enablePan = false;

    controls.enableDamping = true;

    controls.dampingFactor = 0.08;

    controls.minDistance = 3;

    controls.maxDistance = 25;

    controls.target.set(0, 6, 0);


    // Resize

    window.addEventListener(
        "resize",
        resizeRenderer
    );


    // Render loop

    animate();
}


/* =========================================================
   LOAD AVATAR
   ========================================================= */

function loadAvatar() {

    console.log("[Solaria Avatar] Loading avatar...");

    if (USE_PLACEHOLDER) {

        createPlaceholderAvatar();

        return;
    }

    const loader = new GLTFLoader();

    loader.load(

        AVATAR_MODEL_PATH,

        (gltf) => {

            console.log(
                "[Solaria Avatar] New character rig loaded!"
            );

            removeCurrentAvatar();

            avatar = gltf.scene;

            avatar.name = "SolariaCharacter";


            /*
             * Clone materials individually.
             *
             * This is important because the left and right
             * arm meshes can share the same original GLTF
             * material.
             *
             * Without cloning, coloring one arm could
             * accidentally recolor the other.
             */

            avatar.traverse((object) => {

                if (!object.isMesh) {
                    return;
                }

                object.castShadow = true;

                object.receiveShadow = true;

                if (Array.isArray(object.material)) {

                    object.material =
                        object.material.map(material =>
                            material.clone()
                        );

                } else if (object.material) {

                    object.material =
                        object.material.clone();

                }

            });


            scene.add(avatar);

            indexAvatarParts();

            centerAvatar();

            applyAvatarColors();

            frameAvatar();


            console.log(
                "[Solaria Avatar] Character is ready."
            );

        },

        (progress) => {

            if (progress.total > 0) {

                const percent =
                    Math.round(
                        (progress.loaded / progress.total) * 100
                    );

                console.log(
                    "[Solaria Avatar] Loading: " +
                    percent +
                    "%"
                );

            }

        },

        (error) => {

            console.error(
                "[Solaria Avatar] Could not load character model.",
                error
            );

            console.error(
                "[Solaria Avatar] Check the model path and its files."
            );

            console.log(
                "[Solaria Avatar] Loading placeholder instead."
            );

            createPlaceholderAvatar();

        }

    );
}


/* =========================================================
   REMOVE CURRENT AVATAR
   ========================================================= */

function removeCurrentAvatar() {

    if (!avatar) {
        return;
    }

    scene.remove(avatar);

    avatar.traverse((object) => {

        if (!object.isMesh) {
            return;
        }

        if (object.geometry) {
            object.geometry.dispose();
        }

        if (Array.isArray(object.material)) {

            object.material.forEach(material => {
                material.dispose();
            });

        } else if (object.material) {

            object.material.dispose();

        }

    });

    avatar = null;

    avatarParts = {};
}


/* =========================================================
   INDEX THE NEW CHARACTER'S BODY PARTS
   ========================================================= */

function indexAvatarParts() {

    if (!avatar) {
        return;
    }

    avatarParts = {};


    avatar.traverse((object) => {

        for (const [partName, objectName] of
            Object.entries(MODEL_PARTS)) {

            if (object.name === objectName) {

                avatarParts[partName] = object;

                console.log(
                    "[Solaria Avatar] Found:",
                    partName,
                    object.name
                );

            }

        }

    });


    // Report missing model parts.

    for (const partName of Object.keys(MODEL_PARTS)) {

        if (!avatarParts[partName]) {

            console.warn(
                "[Solaria Avatar] Could not find mesh:",
                partName,
                MODEL_PARTS[partName]
            );

        }

    }
}


/* =========================================================
   PLACEHOLDER AVATAR
   ========================================================= */

function createPlaceholderAvatar() {

    console.log(
        "[Solaria Avatar] Creating placeholder avatar..."
    );

    removeCurrentAvatar();

    avatar = new THREE.Group();

    avatar.name = "SolariaPlaceholder";


    const head = createPart(
        "head",
        1.8,
        1.8,
        1.8
    );

    head.position.set(0, 5.4, 0);


    const torso = createPart(
        "torso",
        2,
        2.4,
        1
    );

    torso.position.set(0, 3.3, 0);


    const leftArm = createPart(
        "leftArm",
        1,
        2.4,
        1
    );

    leftArm.position.set(-1.5, 3.3, 0);


    const rightArm = createPart(
        "rightArm",
        1,
        2.4,
        1
    );

    rightArm.position.set(1.5, 3.3, 0);


    const leftLeg = createPart(
        "leftLeg",
        1,
        2.4,
        1
    );

    leftLeg.position.set(-0.5, 1, 0);


    const rightLeg = createPart(
        "rightLeg",
        1,
        2.4,
        1
    );

    rightLeg.position.set(0.5, 1, 0);


    avatar.add(
        head,
        torso,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
    );


    avatarParts = {
        head,
        torso,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
    };


    scene.add(avatar);

    centerAvatar();

    applyAvatarColors();

    frameAvatar();

}


/* =========================================================
   CREATE PLACEHOLDER BODY PART
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

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name = name;

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    return mesh;
}


/* =========================================================
   CENTER AVATAR
   ========================================================= */

function centerAvatar() {

    if (!avatar) {
        return;
    }

    avatar.updateMatrixWorld(true);

    const box =
        new THREE.Box3().setFromObject(avatar);

    const center =
        box.getCenter(new THREE.Vector3());

    avatar.position.x -= center.x;

    avatar.position.z -= center.z;

    avatar.updateMatrixWorld(true);
}


/* =========================================================
   FRAME AVATAR
   ========================================================= */

function frameAvatar() {

    if (!avatar || !camera || !controls) {
        return;
    }

    avatar.updateMatrixWorld(true);

    const box =
        new THREE.Box3().setFromObject(avatar);

    const size =
        box.getSize(new THREE.Vector3());

    const center =
        box.getCenter(new THREE.Vector3());

    const maxSize =
        Math.max(size.x, size.y, size.z);

    const distance =
        Math.max(maxSize * 1.8, 5);

    camera.position.set(
        center.x + distance,
        center.y + maxSize * 0.15,
        center.z + distance
    );

    controls.target.copy(center);

    controls.update();
}


/* =========================================================
   FIND BODY PART
   ========================================================= */

function findPart(partName) {

    return avatarParts[partName] || null;
}


/* =========================================================
   APPLY ALL AVATAR COLORS
   ========================================================= */

function applyAvatarColors() {

    if (!avatar) {
        return;
    }

    for (const [partName, color] of
        Object.entries(avatarData.colors)) {

        setPartColor(partName, color);

    }
}


/* =========================================================
   SET BODY PART COLOR
   ========================================================= */

function setPartColor(
    partName,
    color
) {

    const part = findPart(partName);

    if (!part) {

        console.warn(
            "[Solaria Avatar] Missing body part:",
            partName
        );

        return;
    }


    const materials =
        Array.isArray(part.material)
            ? part.material
            : [part.material];


    materials.forEach((material) => {

        if (!material || !material.color) {
            return;
        }

        material.color.set(color);

        material.needsUpdate = true;

    });

}


/* =========================================================
   CHANGE A COLOR
   ========================================================= */

function changeColor(
    partName,
    color
) {

    if (!avatarData.colors.hasOwnProperty(partName)) {
        return;
    }

    avatarData.colors[partName] = color;

    setPartColor(partName, color);
}


/* =========================================================
   SETUP CONTROLS
   ========================================================= */

function setupControls() {

    /*
     * COLOR CONTROLS
     *
     * Old controls still work:
     * headColor
     * torsoColor
     * armsColor
     * legsColor
     *
     * New optional controls:
     * leftArmColor
     * rightArmColor
     * leftLegColor
     * rightLegColor
     */


    const colorControls = {

        headColor: "head",

        torsoColor: "torso",

        leftArmColor: "leftArm",

        rightArmColor: "rightArm",

        leftLegColor: "leftLeg",

        rightLegColor: "rightLeg"

    };


    for (const [elementId, partName] of
        Object.entries(colorControls)) {

        const input =
            document.getElementById(elementId);

        if (!input) {
            continue;
        }

        input.addEventListener("input", () => {

            changeColor(
                partName,
                input.value
            );

        });

    }


    /*
     * OLD SHARED ARM COLOR CONTROL
     *
     * If the HTML still only has armsColor,
     * this changes both arms.
     */

    const armsColor =
        document.getElementById("armsColor");

    if (armsColor) {

        armsColor.addEventListener("input", () => {

            changeColor("leftArm", armsColor.value);

            changeColor("rightArm", armsColor.value);

            updateIndividualColorInputs();

        });

    }


    /*
     * OLD SHARED LEG COLOR CONTROL
     */

    const legsColor =
        document.getElementById("legsColor");

    if (legsColor) {

        legsColor.addEventListener("input", () => {

            changeColor("leftLeg", legsColor.value);

            changeColor("rightLeg", legsColor.value);

            updateIndividualColorInputs();

        });

    }


    /* =====================================================
       GENDER BUTTONS
       ===================================================== */

    const genderButtons =
        document.querySelectorAll(".gender-button");

    genderButtons.forEach((button) => {

        button.addEventListener("click", () => {

            avatarData.gender =
                button.dataset.gender;

            updateGenderButtons();

            console.log(
                "[Solaria Avatar] Gender:",
                avatarData.gender
            );

        });

    });


    /* =====================================================
       RENDER MODE
       ===================================================== */

    setupRenderModeControls();


    /* =====================================================
       AUTO SPIN
       ===================================================== */

    const spinButton =
        document.getElementById("spinButton");

    if (spinButton) {

        spinButton.addEventListener("click", () => {

            autoSpin = !autoSpin;

            spinButton.classList.toggle(
                "active",
                autoSpin
            );

            spinButton.textContent =
                autoSpin ? "STOP SPIN" : "AUTO SPIN";

        });

    }


    /* =====================================================
       BACK BUTTON
       ===================================================== */

    const backButton =
        document.getElementById("backButton");

    if (backButton) {

        backButton.addEventListener("click", () => {

            window.history.back();

        });

    }


    /* =====================================================
       SAVE BUTTON
       ===================================================== */

    const saveButton =
        document.getElementById("saveButton");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveAvatar
        );

    }

}


/* =========================================================
   UPDATE INDIVIDUAL COLOR INPUTS
   ========================================================= */

function updateIndividualColorInputs() {

    const ids = {

        headColor: "head",

        torsoColor: "torso",

        leftArmColor: "leftArm",

        rightArmColor: "rightArm",

        leftLegColor: "leftLeg",

        rightLegColor: "rightLeg"

    };

    for (const [elementId, partName] of
        Object.entries(ids)) {

        const input =
            document.getElementById(elementId);

        if (input) {

            input.value =
                avatarData.colors[partName];

        }

    }

}


/* =========================================================
   RENDER MODE CONTROLS
   ========================================================= */

function setupRenderModeControls() {

    const ballButton =
        document.getElementById("renderBall");

    const characterButton =
        document.getElementById("renderCharacter");


    if (ballButton) {

        ballButton.addEventListener("click", () => {
            setRenderMode("ball");
        });

        if (ballButton.type === "radio") {

            ballButton.addEventListener("change", () => {

                if (ballButton.checked) {
                    setRenderMode("ball");
                }

            });

        }

    }


    if (characterButton) {

        characterButton.addEventListener("click", () => {
            setRenderMode("character");
        });

        if (characterButton.type === "radio") {

            characterButton.addEventListener("change", () => {

                if (characterButton.checked) {
                    setRenderMode("character");
                }

            });

        }

    }


    const renderOptions =
        document.querySelectorAll("[data-render-mode]");

    renderOptions.forEach((option) => {

        option.addEventListener("click", () => {

            const mode =
                option.dataset.renderMode;

            if (mode === "ball" || mode === "character") {
                setRenderMode(mode);
            }

        });

    });

}


/* =========================================================
   SET RENDER MODE
   ========================================================= */

function setRenderMode(mode) {

    if (mode !== "ball" && mode !== "character") {
        return;
    }

    avatarData.renderMode = mode;

    updateRenderModeControls();

    console.log(
        "[Solaria Avatar] Game avatar:",
        mode
    );

}


/* =========================================================
   UPDATE RENDER MODE CONTROLS
   ========================================================= */

function updateRenderModeControls() {

    const ballButton =
        document.getElementById("renderBall");

    const characterButton =
        document.getElementById("renderCharacter");


    if (ballButton) {

        ballButton.classList.toggle(
            "active",
            avatarData.renderMode === "ball"
        );

        if (ballButton.type === "radio") {

            ballButton.checked =
                avatarData.renderMode === "ball";

        }

    }


    if (characterButton) {

        characterButton.classList.toggle(
            "active",
            avatarData.renderMode === "character"
        );

        if (characterButton.type === "radio") {

            characterButton.checked =
                avatarData.renderMode === "character";

        }

    }


    const renderOptions =
        document.querySelectorAll("[data-render-mode]");

    renderOptions.forEach((option) => {

        option.classList.toggle(
            "active",
            option.dataset.renderMode === avatarData.renderMode
        );

    });

}


/* =========================================================
   UPDATE COLOR INPUTS
   ========================================================= */

function updateColorInputs() {

    const oldInputs = {

        headColor: "head",

        torsoColor: "torso",

        armsColor: "leftArm",

        legsColor: "leftLeg"

    };


    for (const [elementId, partName] of
        Object.entries(oldInputs)) {

        const input =
            document.getElementById(elementId);

        if (input) {

            input.value =
                avatarData.colors[partName];

        }

    }


    updateIndividualColorInputs();

}


/* =========================================================
   UPDATE GENDER BUTTONS
   ========================================================= */

function updateGenderButtons() {

    const buttons =
        document.querySelectorAll(".gender-button");

    buttons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.gender === avatarData.gender
        );

    });

}


/* =========================================================
   SAVE AVATAR
   ========================================================= */

function saveAvatar() {

    const savedAvatar =
        JSON.stringify(avatarData);

    localStorage.setItem(
        "blockworldAvatar",
        savedAvatar
    );

    console.log(
        "[Solaria Avatar] Saved:",
        avatarData
    );


    const saveButton =
        document.getElementById("saveButton");

    if (saveButton) {

        const oldText =
            saveButton.textContent;

        saveButton.textContent = "SAVED!";

        saveButton.classList.add("saved");

        setTimeout(() => {

            saveButton.textContent = oldText;

            saveButton.classList.remove("saved");

        }, 1500);

    }

}


/* =========================================================
   LOAD SAVED AVATAR
   ========================================================= */

function loadSavedAvatar() {

    const saved =
        localStorage.getItem("blockworldAvatar");

    if (!saved) {

        avatarData.renderMode = "ball";

        return;
    }


    try {

        const data = JSON.parse(saved);


        // Gender

        if (
            data.gender === "masculine" ||
            data.gender === "feminine"
        ) {

            avatarData.gender = data.gender;

        }


        // Render mode

        if (
            data.renderMode === "ball" ||
            data.renderMode === "character"
        ) {

            avatarData.renderMode = data.renderMode;

        } else {

            avatarData.renderMode = "ball";

        }


        // Colors

        if (data.colors && typeof data.colors === "object") {

            const colors = data.colors;


            if (typeof colors.head === "string") {
                avatarData.colors.head = colors.head;
            }

            if (typeof colors.torso === "string") {
                avatarData.colors.torso = colors.torso;
            }


            /*
             * Backwards compatibility:
             *
             * Old saves used:
             * arms
             * legs
             *
             * New saves use:
             * leftArm
             * rightArm
             * leftLeg
             * rightLeg
             */

            if (typeof colors.arms === "string") {

                avatarData.colors.leftArm = colors.arms;

                avatarData.colors.rightArm = colors.arms;

            }

            if (typeof colors.legs === "string") {

                avatarData.colors.leftLeg = colors.legs;

                avatarData.colors.rightLeg = colors.legs;

            }


            // New individual colors override old shared colors.

            const individualParts = [
                "leftArm",
                "rightArm",
                "leftLeg",
                "rightLeg"
            ];

            individualParts.forEach((partName) => {

                if (typeof colors[partName] === "string") {

                    avatarData.colors[partName] =
                        colors[partName];

                }

            });

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

        avatarData.renderMode = "ball";

    }

}


/* =========================================================
   PUBLIC SOLARIA AVATAR API
   ========================================================= */

window.SolariaAvatar = {

    getData() {

        return JSON.parse(
            JSON.stringify(avatarData)
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


    setRenderMode(mode) {

        setRenderMode(mode);

    },


    setColor(partName, color) {

        changeColor(partName, color);

        updateColorInputs();

    },


    reloadAvatar() {

        loadAvatar();

    }

};


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    requestAnimationFrame(animate);


    if (avatar && autoSpin) {

        avatar.rotation.y += 0.01;

    }


    if (controls) {

        controls.update();

    }


    if (renderer && scene && camera) {

        renderer.render(scene, camera);

    }

}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeRenderer() {

    const container =
        document.getElementById("avatarPreview");

    if (!container || !camera || !renderer) {
        return;
    }

    const width =
        Math.max(container.clientWidth, 1);

    const height =
        Math.max(container.clientHeight, 1);

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

}