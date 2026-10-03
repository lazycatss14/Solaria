/*
==========================================
SOLARIA AI
Safe Workspace File Reader
==========================================
*/

"use strict";

const fs = require("fs");
const path = require("path");


const WORKSPACE =
    path.resolve(
        __dirname,
        "workspace",
        "Website App"
    );


const ALLOWED_EXTENSIONS = new Set([
    ".js",
    ".html",
    ".css",
    ".json"
]);


const BLOCKED_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    "dist",
    "Build",
    "installer",
    "userdata"
]);


const MAX_FILE_SIZE =
    250 * 1024;


/*
==========================================
MAKE SURE FILE STAYS INSIDE WORKSPACE
==========================================
*/

function getSafePath(relativePath) {

    const cleanedPath =
        relativePath
            .replace(/\//g, path.sep)
            .replace(/\\/g, path.sep);


    const fullPath =
        path.resolve(
            WORKSPACE,
            cleanedPath
        );


    const workspaceWithSeparator =
        WORKSPACE.endsWith(path.sep)
            ? WORKSPACE
            : WORKSPACE + path.sep;


    if (
        fullPath !== WORKSPACE &&
        !fullPath.startsWith(
            workspaceWithSeparator
        )
    ) {

        throw new Error(
            "Access denied: file is outside the Solaria AI workspace."
        );

    }


    return fullPath;
}


/*
==========================================
CHECK FILE
==========================================
*/

function validateFile(fullPath) {

    const relativePath =
        path.relative(
            WORKSPACE,
            fullPath
        );


    const parts =
        relativePath.split(
            path.sep
        );


    for (const part of parts) {

        if (
            BLOCKED_DIRECTORIES.has(part)
        ) {

            throw new Error(
                `Access denied: ${part} is protected.`
            );

        }

    }


    const extension =
        path.extname(
            fullPath
        ).toLowerCase();


    if (
        !ALLOWED_EXTENSIONS.has(
            extension
        )
    ) {

        throw new Error(
            `File type is not allowed: ${extension}`
        );

    }


    if (
        !fs.existsSync(fullPath)
    ) {

        throw new Error(
            `File does not exist: ${relativePath}`
        );

    }


    const stats =
        fs.statSync(
            fullPath
        );


    if (!stats.isFile()) {

        throw new Error(
            "The requested path is not a file."
        );

    }


    if (
        stats.size > MAX_FILE_SIZE
    ) {

        throw new Error(
            `File is too large: ${relativePath}`
        );

    }

}


/*
==========================================
READ FILE
==========================================
*/

function readProjectFile(relativePath) {

    const fullPath =
        getSafePath(
            relativePath
        );


    validateFile(
        fullPath
    );


    return fs.readFileSync(
        fullPath,
        "utf8"
    );

}


/*
==========================================
CLI
==========================================
*/

function main() {

    const requestedFile =
        process.argv
            .slice(2)
            .join(" ");


    if (!requestedFile) {

        console.log("");
        console.log(
            "Usage:"
        );

        console.log(
            'node file-reader.js "src/js/games.js"'
        );

        console.log("");

        process.exit(1);

    }


    try {

        const contents =
            readProjectFile(
                requestedFile
            );


        console.log("");
        console.log(
            `===== ${requestedFile} =====`
        );
        console.log("");

        console.log(
            contents
        );

        console.log("");

        console.log(
            "===== END FILE ====="
        );

        console.log("");

    } catch (error) {

        console.error("");
        console.error(
            "FILE READER ERROR"
        );

        console.error("");

        console.error(
            error.message
        );

        console.error("");

        process.exit(1);

    }

}


if (
    require.main === module
) {

    main();

}


module.exports = {
    readProjectFile
};