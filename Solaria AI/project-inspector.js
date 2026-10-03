/*
==========================================
SOLARIA AI
Project Inspector
==========================================
*/

"use strict";

const fs = require("fs");
const path = require("path");


const WORKSPACE =
    path.join(
        __dirname,
        "workspace",
        "Website App"
    );


const IGNORED_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    "dist",
    "Build",
    "installer",
    "userdata"
]);


const ALLOWED_EXTENSIONS = new Set([
    ".js",
    ".html",
    ".css",
    ".json"
]);


function scanDirectory(directory, results = []) {

    const entries =
        fs.readdirSync(
            directory,
            {
                withFileTypes: true
            }
        );


    for (const entry of entries) {

        const fullPath =
            path.join(
                directory,
                entry.name
            );


        if (entry.isDirectory()) {

            if (
                IGNORED_DIRECTORIES.has(
                    entry.name
                )
            ) {
                continue;
            }


            scanDirectory(
                fullPath,
                results
            );

            continue;
        }


        const extension =
            path.extname(
                entry.name
            ).toLowerCase();


        if (
            ALLOWED_EXTENSIONS.has(
                extension
            )
        ) {

            results.push(
                path.relative(
                    WORKSPACE,
                    fullPath
                )
            );

        }

    }


    return results;
}


function inspectProject() {

    if (!fs.existsSync(WORKSPACE)) {

        throw new Error(
            `Workspace does not exist:\n${WORKSPACE}`
        );

    }


    const files =
        scanDirectory(
            WORKSPACE
        );


    return {
        workspace: WORKSPACE,
        fileCount: files.length,
        files: files.sort()
    };
}


function main() {

    console.log("");
    console.log("=================================");
    console.log("      SOLARIA PROJECT INSPECTOR");
    console.log("=================================");
    console.log("");

    console.log(
        "Workspace:"
    );

    console.log(
        WORKSPACE
    );

    console.log("");

    const project =
        inspectProject();


    console.log(
        `Files found: ${project.fileCount}`
    );

    console.log("");

    for (const file of project.files) {

        console.log(
            `  ${file}`
        );

    }


    console.log("");

    console.log(
        "Inspection complete."
    );

    console.log("");

}


if (
    require.main === module
) {

    try {

        main();

    } catch (error) {

        console.error("");
        console.error(
            "INSPECTOR ERROR"
        );
        console.error("");
        console.error(
            error.message
        );
        console.error("");

        process.exit(1);

    }

}


module.exports = {
    inspectProject
};
