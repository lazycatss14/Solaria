module.exports = {
    packagerConfig: {
        asar: true
    },

    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "blockworld",
                authors: "LazyCatss",
                description: "BlockWorld"
            }
        }
    ]
};