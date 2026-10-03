/*
==========================================
SOLARIA AI
CODE FACTS ENGINE
==========================================
*/

"use strict";

const { askLlama } = require("./llama");
const { readProjectFile } = require("./file-reader");


/*
==========================================
DEFAULT FILES
==========================================
*/

const DEFAULT_FILES = [
    "src/screens/games.html",
    "src/js/game.js",
    "src/css/games.css"
];


/*
==========================================
ARGUMENT PARSING
==========================================
*/

function parseArguments() {

    const args = process.argv.slice(2);

    const files = [];
    const taskParts = [];

    let i = 0;

    while (i < args.length) {

        if (args[i] === "--file") {

            const filePath = args[i + 1];

            if (!filePath) {
                throw new Error(
                    "The --file option requires a file path."
                );
            }

            files.push(filePath);

            i += 2;
            continue;
        }

        taskParts.push(args[i]);

        i++;
    }

    return {
        files,
        task: taskParts.join(" ").trim()
    };
}


/*
==========================================
FILE TYPE
==========================================
*/

function getFileType(filePath) {

    const lower = filePath.toLowerCase();

    if (lower.endsWith(".html")) return "HTML";
    if (lower.endsWith(".js")) return "JavaScript";
    if (lower.endsWith(".css")) return "CSS";
    if (lower.endsWith(".json")) return "JSON";

    return "Unknown";
}


/*
==========================================
READ FILES
==========================================
*/

function loadFiles(filePaths) {

    const files = [];

    for (const filePath of filePaths) {

        console.log(`Reading: ${filePath}`);

        const content = readProjectFile(filePath);

        files.push({
            path: filePath,
            type: getFileType(filePath),
            content
        });
    }

    return files;
}


/*
==========================================
REMOVE COMMENTS
==========================================
*/

function removeComments(source) {

    return source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
}


/*
==========================================
EXTRACT JAVASCRIPT FACTS
==========================================
*/

function extractJavaScriptFacts(source) {

    const cleanSource = removeComments(source);

    const facts = {

        functions: [],

        variables: [],

        constants: [],

        objectLiterals: [],

        domQueries: [],

        eventListeners: [],

        windowReferences: [],

        windowAssignments: [],

        navigation: [],

        errorHandling: [],

        exportedObjects: []
    };


    /*
    ==========================================
    FUNCTION DECLARATIONS
    ==========================================
    */

    const functionRegex =
        /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;

    let match;

    while ((match = functionRegex.exec(cleanSource)) !== null) {

        const name = match[1];

        const parameters =
            match[2]
                .split(",")
                .map(value => value.trim())
                .filter(Boolean);

        facts.functions.push({
            name,
            parameters,
            async: match[0].trim().startsWith("async")
        });
    }


    /*
    ==========================================
    ARROW FUNCTIONS
    ==========================================
    */

    const arrowRegex =
        /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*=>/g;

    while ((match = arrowRegex.exec(cleanSource)) !== null) {

        const name = match[1];

        const parameters =
            match[3] !== undefined
                ? match[3]
                    .split(",")
                    .map(value => value.trim())
                    .filter(Boolean)
                : match[4]
                    ? [match[4]]
                    : [];

        facts.functions.push({
            name,
            parameters,
            async: Boolean(match[2])
        });
    }


    /*
    ==========================================
    VARIABLE DECLARATIONS
    ==========================================
    */

    const variableRegex =
        /\b(let|var)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*([^;\n]+))?/g;

    while ((match = variableRegex.exec(cleanSource)) !== null) {

        facts.variables.push({
            declaration: match[1],
            name: match[2],
            initializer: match[3]
                ? match[3].trim()
                : null
        });
    }


    /*
    ==========================================
    CONSTANT DECLARATIONS
    ==========================================
    */

    const constantRegex =
        /\bconst\s+([A-Za-z_$][\w$]*)\s*(?:=\s*([^;\n]+))?/g;

    while ((match = constantRegex.exec(cleanSource)) !== null) {

        facts.constants.push({
            name: match[1],
            initializer: match[2]
                ? match[2].trim()
                : null
        });
    }


    /*
    ==========================================
    OBJECT LITERALS
    ==========================================
    */

    const objectRegex =
        /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;

    while ((match = objectRegex.exec(cleanSource)) !== null) {

        facts.objectLiterals.push({
            name: match[1]
        });
    }


    /*
    ==========================================
    DOM: getElementById
    ==========================================
    */

    const idRegex =
        /document\.getElementById\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

    while ((match = idRegex.exec(cleanSource)) !== null) {

        facts.domQueries.push({
            method: "getElementById",
            value: match[1]
        });
    }


    /*
    ==========================================
    DOM: querySelector
    ==========================================
    */

    const selectorRegex =
        /document\.querySelector\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

    while ((match = selectorRegex.exec(cleanSource)) !== null) {

        facts.domQueries.push({
            method: "querySelector",
            value: match[1]
        });
    }


    /*
    ==========================================
    DOM: querySelectorAll
    ==========================================
    */

    const selectorAllRegex =
        /document\.querySelectorAll\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

    while ((match = selectorAllRegex.exec(cleanSource)) !== null) {

        facts.domQueries.push({
            method: "querySelectorAll",
            value: match[1]
        });
    }


    /*
    ==========================================
    EVENT LISTENERS
    ==========================================
    */

    const eventRegex =
        /([A-Za-z_$][\w$]*)\.addEventListener\(\s*["'`]([^"'`]+)["'`]/g;

    while ((match = eventRegex.exec(cleanSource)) !== null) {

        facts.eventListeners.push({
            target: match[1],
            event: match[2]
        });
    }


    /*
    ==========================================
    WINDOW REFERENCES
    ==========================================
    */

    const windowReferenceRegex =
        /window\.([A-Za-z_$][\w$]*)/g;

    while ((match = windowReferenceRegex.exec(cleanSource)) !== null) {

        const property = match[1];

        if (!facts.windowReferences.includes(property)) {

            facts.windowReferences.push(property);
        }
    }


    /*
    ==========================================
    WINDOW ASSIGNMENTS
    ==========================================
    */

    const windowAssignmentRegex =
        /window\.([A-Za-z_$][\w$]*)\s*=/g;

    while ((match = windowAssignmentRegex.exec(cleanSource)) !== null) {

        facts.windowAssignments.push({
            property: match[1]
        });
    }


    /*
    ==========================================
    NAVIGATION
    ==========================================
    */

    const hrefRegex =
        /location\.href\s*=\s*([^;\n]+)/g;

    while ((match = hrefRegex.exec(cleanSource)) !== null) {

        facts.navigation.push({
            expression: match[1].trim()
        });
    }


    /*
    ==========================================
    ERROR HANDLING
    ==========================================
    */

    const consoleErrorRegex =
        /console\.error\s*\(([^)]*)\)/g;

    while ((match = consoleErrorRegex.exec(cleanSource)) !== null) {

        facts.errorHandling.push({
            type: "console.error",
            expression: match[1].trim()
        });
    }


    const alertRegex =
        /alert\s*\(([^)]*)\)/g;

    while ((match = alertRegex.exec(cleanSource)) !== null) {

        facts.errorHandling.push({
            type: "alert",
            expression: match[1].trim()
        });
    }


    const throwRegex =
        /throw\s+new\s+Error\s*\(([^)]*)\)/g;

    while ((match = throwRegex.exec(cleanSource)) !== null) {

        facts.errorHandling.push({
            type: "throw new Error",
            expression: match[1].trim()
        });
    }


    /*
    ==========================================
    WINDOW EXPORT OBJECT
    ==========================================
    */

    const windowExportRegex =
        /window\.([A-Za-z_$][\w$]*)\s*=\s*\{([\s\S]*?)\};/g;

    while ((match = windowExportRegex.exec(cleanSource)) !== null) {

        const properties = [];

        const propertyRegex =
            /([A-Za-z_$][\w$]*)\s*(?:,|$)/g;

        let propertyMatch;

        while (
            (propertyMatch =
                propertyRegex.exec(match[2])) !== null
        ) {

            properties.push(propertyMatch[1]);
        }

        facts.exportedObjects.push({
            windowProperty: match[1],
            properties
        });
    }


    /*
    ==========================================
    REMOVE DUPLICATES
    ==========================================
    */

    facts.domQueries =
        uniqueObjects(
            facts.domQueries,
            item =>
                `${item.method}:${item.value}`
        );

    facts.eventListeners =
        uniqueObjects(
            facts.eventListeners,
            item =>
                `${item.target}:${item.event}`
        );

    facts.windowAssignments =
        uniqueObjects(
            facts.windowAssignments,
            item =>
                item.property
        );

    facts.navigation =
        uniqueObjects(
            facts.navigation,
            item =>
                item.expression
        );

    facts.errorHandling =
        uniqueObjects(
            facts.errorHandling,
            item =>
                `${item.type}:${item.expression}`
        );


    return facts;
}


/*
==========================================
UNIQUE OBJECTS
==========================================
*/

function uniqueObjects(items, keyFunction) {

    const seen = new Set();

    return items.filter(item => {

        const key = keyFunction(item);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}


/*
==========================================
BUILD FACT REPORT
==========================================
*/

function buildFactReport(files) {

    let report = "";

    for (const file of files) {

        report += `
==================================================
EXACT FACTS
==================================================

FILE:
${file.path}

TYPE:
${file.type}

`;

        if (file.type === "JavaScript") {

            const facts =
                extractJavaScriptFacts(file.content);

            report += `
FUNCTIONS
---------
${JSON.stringify(facts.functions, null, 2)}

VARIABLES
---------
${JSON.stringify(facts.variables, null, 2)}

CONSTANTS
---------
${JSON.stringify(facts.constants, null, 2)}

OBJECT LITERALS
---------------
${JSON.stringify(facts.objectLiterals, null, 2)}

DOM QUERIES
-----------
${JSON.stringify(facts.domQueries, null, 2)}

EVENT LISTENERS
---------------
${JSON.stringify(facts.eventListeners, null, 2)}

WINDOW REFERENCES
-----------------
${JSON.stringify(facts.windowReferences, null, 2)}

WINDOW ASSIGNMENTS
------------------
${JSON.stringify(facts.windowAssignments, null, 2)}

NAVIGATION
----------
${JSON.stringify(facts.navigation, null, 2)}

ERROR HANDLING
--------------
${JSON.stringify(facts.errorHandling, null, 2)}

WINDOW EXPORTS
--------------
${JSON.stringify(facts.exportedObjects, null, 2)}

`;
        }

        report += `
==================================================
END EXACT FACTS
==================================================
`;
    }

    return report;
}


/*
==========================================
BUILD LLAMA PROMPT
==========================================
*/

function buildPrompt(task, files, factReport) {

    let source = "";

    for (const file of files) {

        source += `
==================================================
SOURCE FILE
==================================================

EXACT PATH:
${file.path}

TYPE:
${file.type}

SOURCE CODE:
--------------------------------------------------

${file.content}

--------------------------------------------------
END SOURCE FILE
==================================================
`;
    }


    return `
You are the Solaria AI code explanation engine.

Analyze the supplied source code using the EXACT FACTS
provided below.

The exact facts were extracted from the actual source.

Your job is to explain those facts accurately.

==================================================
STRICT RULES
==================================================

Only analyze:

${files.map(file => `- ${file.path}`).join("\n")}

Never invent files.

Never invent functions.

Never invent variables.

Never invent selectors.

Never invent events.

Never invent APIs.

Never invent behavior.

Never assume another file exists.

Do not call something a "game engine" unless the source
actually creates an engine.

If the source only REFERENCES an object, say that it
references the object.

If something cannot be determined, say:

"Cannot be determined from the supplied source."

==================================================
EXACT FACTS
==================================================

${factReport}

==================================================
SOURCE CODE
==================================================

${source}

==================================================
USER REQUEST
==================================================

${task}

==================================================
RESPONSE FORMAT
==================================================

# FILES ANALYZED

Exact filenames.

# FUNCTIONS

Exact functions and parameters.

# VARIABLES

Exact variables.

# CONSTANTS

Exact constants.

# OBJECTS

Exact object literals and their known properties.

# DOM ACCESS

Exact DOM methods and selectors.

# EVENTS

Exact event listeners.

# WINDOW REFERENCES

Exact window properties.

# WINDOW ASSIGNMENTS

Exact assignments to window.

# NAVIGATION

Exact navigation expressions.

# ERROR HANDLING

Exact error handling.

# CODE FLOW

Explain the actual execution flow.

# WHAT CANNOT BE DETERMINED

State anything that cannot be known from this source.

==================================================
FINAL RULE

The source code is authoritative.

The exact facts are authoritative.

Your general programming knowledge is NOT evidence.

Do not guess.
`;
}


/*
==========================================
MAIN
==========================================
*/

async function main() {

    console.log("");
    console.log("=================================");
    console.log("     SOLARIA CODE FACTS ENGINE");
    console.log("=================================");
    console.log("");

    const {
        files: requestedFiles,
        task
    } = parseArguments();


    if (!task) {

        console.log("No task was provided.");
        console.log("");

        console.log(
            'Example: node ai-task.js --file "src/js/game.js" "Analyze this file."'
        );

        console.log("");

        return;
    }


    const filePaths =
        requestedFiles.length > 0
            ? requestedFiles
            : DEFAULT_FILES;


    console.log("Task:");
    console.log(task);
    console.log("");

    console.log("Files selected:");

    for (const filePath of filePaths) {
        console.log(`  - ${filePath}`);
    }

    console.log("");


    /*
    ==========================================
    READ
    ==========================================
    */

    console.log("Reading selected Solaria files...");
    console.log("");

    const files =
        loadFiles(filePaths);


    /*
    ==========================================
    EXTRACT
    ==========================================
    */

    console.log("");
    console.log("Extracting exact code facts...");
    console.log("");

    const factReport =
        buildFactReport(files);


    /*
    ==========================================
    COUNTS
    ==========================================
    */

    let functionCount = 0;
    let domCount = 0;
    let eventCount = 0;
    let variableCount = 0;
    let constantCount = 0;

    for (const file of files) {

        if (file.type !== "JavaScript") {
            continue;
        }

        const facts =
            extractJavaScriptFacts(file.content);

        functionCount += facts.functions.length;
        domCount += facts.domQueries.length;
        eventCount += facts.eventListeners.length;
        variableCount += facts.variables.length;
        constantCount += facts.constants.length;
    }


    console.log(`Functions found: ${functionCount}`);
    console.log(`Variables found: ${variableCount}`);
    console.log(`Constants found: ${constantCount}`);
    console.log(`DOM queries found: ${domCount}`);
    console.log(`Event listeners found: ${eventCount}`);

    console.log("");


    /*
    ==========================================
    LLAMA
    ==========================================
    */

    console.log("Sending exact facts and source to Llama...");
    console.log("");

    const prompt =
        buildPrompt(
            task,
            files,
            factReport
        );


    const response =
        await askLlama(prompt);


    /*
    ==========================================
    OUTPUT
    ==========================================
    */

    console.log("");
    console.log("=================================");
    console.log("       SOLARIA CODE ANALYSIS");
    console.log("=================================");
    console.log("");

    console.log(response);

    console.log("");
    console.log("=================================");
    console.log("Analysis complete.");
    console.log("No files were modified.");
    console.log("=================================");
    console.log("");
}


/*
==========================================
START
==========================================
*/

main().catch(error => {

    console.error("");
    console.error("=================================");
    console.error("       SOLARIA AI ERROR");
    console.error("=================================");
    console.error("");

    console.error(error.message);

    console.error("");
});