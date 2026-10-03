/* =========================================================
   SOLARIA WEBSITE
   DOWNLOAD PAGE JAVASCRIPT
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       SETTINGS
    ===================================================== */

    const GITHUB_OWNER =
        "lazycatss14";

    const GITHUB_REPOSITORY =
        "Solaria";

    const INSTALLER_NAME =
        "Solaria-Setup.exe";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const downloadButton =
        document.getElementById(
            "downloadWindowsButton"
        );

    const downloadStatus =
        document.getElementById(
            "downloadStatus"
        );


    /* =====================================================
       BUILD DOWNLOAD URL
    ===================================================== */

    const downloadUrl =
        "https://github.com/" +
        GITHUB_OWNER +
        "/" +
        GITHUB_REPOSITORY +
        "/releases/latest/download/" +
        INSTALLER_NAME;


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeDownloadPage() {

        console.log(
            "SOLARIA DOWNLOAD PAGE LOADED"
        );


        if (!downloadButton) {

            console.error(
                "Solaria: Download button not found."
            );

            return;

        }


        /*
         * Give the button the latest
         * GitHub release installer.
         */

        downloadButton.href =
            downloadUrl;


        /*
         * Tell the user the button
         * is ready.
         */

        if (downloadStatus) {

            downloadStatus.textContent =
                "Ready to download the latest Windows release.";

            downloadStatus.classList.add(
                "ready"
            );

        }


        /*
         * Log the destination for
         * debugging.
         */

        console.log(
            "Solaria installer:",
            downloadUrl
        );


        /*
         * Add download click handling.
         */

        downloadButton.addEventListener(
            "click",
            handleDownload
        );

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    function handleDownload() {

        console.log(
            "SOLARIA: Windows download started."
        );


        if (downloadStatus) {

            downloadStatus.textContent =
                "Opening the Solaria Windows installer...";

            downloadStatus.classList.remove(
                "error"
            );

            downloadStatus.classList.add(
                "ready"
            );

        }

    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeDownloadPage
        );

    } else {

        initializeDownloadPage();

    }

})();