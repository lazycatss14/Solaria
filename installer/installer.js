const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const CONFIG_PATH = path.join(
    __dirname,
    "installer-configuration.json"
);

function loadConfiguration() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(
            "installer-configuration.json was not found."
        );
    }

    const text = fs.readFileSync(
        CONFIG_PATH,
        "utf8"
    );

    return JSON.parse(text);
}

function replaceVariables(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value
        .replace(
            "%LOCALAPPDATA%",
            process.env.LOCALAPPDATA ||
            path.join(
                os.homedir(),
                "AppData",
                "Local"
            )
        )
        .replace(
            "%USERPROFILE%",
            os.homedir()
        );
}

function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function runInstaller() {
    console.log("");
    console.log("==============================");
    console.log("       BLOCKWORLD SETUP");
    console.log("==============================");
    console.log("");

    let config;

    try {
        config = loadConfiguration();
    } catch (error) {
        console.error("");
        console.error("Installer configuration error:");
        console.error(error.message);
        console.error("");
        process.exit(1);
    }

    const applicationName =
        config.application.name;

    const applicationVersion =
        config.application.version;

    console.log(
        `${applicationName} ${applicationVersion}`
    );

    console.log(
        config.application.description
    );

    console.log("");

    let installDirectory =
        replaceVariables(
            config.installation.defaultDirectory
        );

    if (
        config.installation.allowCustomDirectory
    ) {
        console.log(
            `Default installation folder:`
        );

        console.log(
            installDirectory
        );

        console.log("");

        const answer = await askQuestion(
            "Use this folder? [Y/n] "
        );

        if (
            answer.toLowerCase() === "n"
        ) {
            const customDirectory =
                await askQuestion(
                    "Enter installation folder: "
                );

            if (customDirectory.length > 0) {
                installDirectory =
                    replaceVariables(
                        customDirectory
                    );
            }
        }
    }

    console.log("");
    console.log(
        `Installation folder: ${installDirectory}`
    );

    console.log("");

    let desktopShortcut =
        config.shortcuts.desktop;

    let startMenuShortcut =
        config.shortcuts.startMenu;

    const shortcutAnswer =
        await askQuestion(
            "Create a desktop shortcut? [Y/n] "
        );

    if (
        shortcutAnswer.toLowerCase() === "n"
    ) {
        desktopShortcut = false;
    }

    console.log("");

    console.log(
        "BlockWorld is ready to install."
    );

    const installAnswer =
        await askQuestion(
            "Install BlockWorld now? [Y/n] "
        );

    if (
        installAnswer.toLowerCase() === "n"
    ) {
        console.log("");
        console.log(
            "Installation cancelled."
        );
        process.exit(0);
    }

    console.log("");
    console.log(
        "Installing BlockWorld..."
    );

    if (
        !fs.existsSync(installDirectory)
    ) {
        fs.mkdirSync(
            installDirectory,
            {
                recursive: true
            }
        );
    }

    /*
        The actual BlockWorld application
        files will be copied here.

        For now, this installer creates
        the installation directory.

        Later we will connect this section
        to the real Browser application
        files and BlockWorld Engine.
    */

    const installInfo = {
        name: applicationName,
        version: applicationVersion,
        installedAt:
            new Date().toISOString()
    };

    fs.writeFileSync(
        path.join(
            installDirectory,
            "blockworld-install.json"
        ),
        JSON.stringify(
            installInfo,
            null,
            4
        ),
        "utf8"
    );

    console.log("");
    console.log(
        "BlockWorld installation complete."
    );

    console.log("");

    if (desktopShortcut) {
        console.log(
            "Desktop shortcut: enabled"
        );
    } else {
        console.log(
            "Desktop shortcut: disabled"
        );
    }

    if (startMenuShortcut) {
        console.log(
            "Start Menu shortcut: enabled"
        );
    } else {
        console.log(
            "Start Menu shortcut: disabled"
        );
    }

    console.log("");

    if (
        config.afterInstall.askToLaunch
    ) {
        const launchAnswer =
            await askQuestion(
                "Run BlockWorld now? [Y/n] "
            );

        if (
            launchAnswer.toLowerCase() !== "n"
        ) {
            console.log("");
            console.log(
                "Launching BlockWorld..."
            );

            /*
                The real BlockWorld executable
                will be launched here once
                the Browser application is
                connected.
            */
        }
    }

    console.log("");
    console.log(
        "Thank you for installing BlockWorld!"
    );
    console.log("");
}

runInstaller();