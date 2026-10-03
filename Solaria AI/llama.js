/*
==========================================
SOLARIA AI
Local Llama 3.2 Controller
==========================================
*/

"use strict";


const OLLAMA_URL =
    "http://127.0.0.1:11434/api/generate";

const MODEL =
    "llama3.2:latest";


/*
==========================================
ASK LLAMA
==========================================
*/

async function askLlama(prompt) {

    console.log(
        "[Solaria AI] Sending request to Ollama..."
    );


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            function () {

                controller.abort();

            },
            30000
        );


    try {

        const response =
            await fetch(
                OLLAMA_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        model: MODEL,
                        prompt: prompt,
                        stream: false
                    }),

                    signal: controller.signal
                }
            );


        console.log(
            `[Solaria AI] Ollama HTTP status: ${response.status}`
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                `Ollama returned HTTP ${response.status}: ${errorText}`
            );

        }


        console.log(
            "[Solaria AI] Waiting for Llama response..."
        );


        const data =
            await response.json();


        console.log(
            "[Solaria AI] Response received."
        );


        return data.response || "";


    } catch (error) {

        if (
            error.name === "AbortError"
        ) {

            throw new Error(
                "Ollama took longer than 30 seconds to respond."
            );

        }


        throw error;


    } finally {

        clearTimeout(
            timeout
        );

    }

}


/*
==========================================
COMMAND-LINE TEST
==========================================
*/

async function main() {

    console.log("");
    console.log("=================================");
    console.log("       SOLARIA AI CONTROLLER");
    console.log("=================================");
    console.log("");

    console.log("Model:");
    console.log(`  ${MODEL}`);
    console.log("");

    console.log(
        "Connecting to Ollama..."
    );

    console.log("");


    try {

        const answer =
            await askLlama(
                "You are the Solaria development assistant. Reply with exactly: SOLARIA AI CONNECTED"
            );


        console.log("");
        console.log("Llama response:");
        console.log("----------------");
        console.log(
            answer.trim()
        );
        console.log("----------------");
        console.log("");

        console.log(
            "Solaria AI is ready."
        );

        console.log("");


    } catch (error) {

        console.log("");
        console.log(
            "=============================="
        );

        console.log(
            "      SOLARIA AI ERROR"
        );

        console.log(
            "=============================="
        );

        console.log("");

        console.log(
            error.message
        );

        console.log("");

    }

}


/*
==========================================
ONLY RUN TEST WHEN DIRECTLY EXECUTED
==========================================
*/

if (
    require.main === module
) {

    main();

}


/*
==========================================
EXPORT
==========================================
*/

module.exports = {
    askLlama
};