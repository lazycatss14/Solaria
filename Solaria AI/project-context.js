/*
==========================================
SOLARIA AI
Project Context Builder
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


const MAX_FILE_SIZE =
    200 * 1024;


function collectFiles(directory, results = []) {

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


            collectFiles(
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
            !ALLOWED_EXTENSIONS.has(
                extension
            )
        ) {
            continue;
        }


        const stats =
            fs.statSync(
                fullPath
            );


        if (
            stats.size > MAX_FILE_SIZE
        ) {
            console.log(
                `[Context] Skipping large file: ${path.relative(WORKSPACE, fullPath)}`
            );

            continue;
        }


        results.push(
            fullPath
        );

    }


    return results;
}


function buildProjectContext() {

    if (!fs.existsSync(WORKSPACE)) {

        throw new Error(
            `Workspace does not exist:\n${WORKSPACE}`
        );

    }


    const files =
        collectFiles(
            WORKSPACE
        );


    const sections = [];


    for (const file of files.sort()) {

        const relativePath =
            path.relative(
                WORKSPACE,
                file
            );


        const contents =
            fs.readFileSync(
                file,
                "utf8"
            );


        sections.push(
            [
                "========================================",
                `FILE: ${relativePath}`,
                "========================================",
                "",
                contents,
                ""
            ].join("\n")
        );

    }


    return sections.join("\n");
}


function main() {

    console.log("");
    console.log("=================================");
    console.log("       SOLARIA PROJECT CONTEXT");
    console.log("=================================");
    console.log("");

    const context =
        buildProjectContext();


    console.log(
        `Context size: ${context.length} characters`
    );

    console.log("");

    console.log(
        "Project context successfully built."
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
            "CONTEXT ERROR"
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
    buildProjectContext
};