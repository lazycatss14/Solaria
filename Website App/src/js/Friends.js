/* ============================================================
   SOLARIA FRIENDS SYSTEM
============================================================ */

console.log(
    "[Solaria] Friends system loading..."
);


let currentFriends = [];
let currentIncomingRequests = [];
let currentOutgoingRequests = [];


/* ============================================================
   HELPERS
============================================================ */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   ONLINE CHECK
============================================================ */

function isOnline(lastSeen) {

    if (!lastSeen) {

        return false;

    }


    const time =
        new Date(lastSeen).getTime();


    if (Number.isNaN(time)) {

        return false;

    }


    /*
     * A player is considered online
     * if their last_seen timestamp was
     * updated within the last 2 minutes.
     */

    const ONLINE_WINDOW =
        2 * 60 * 1000;


    const difference =
        Date.now() - time;


    return (
        difference >= 0 &&
        difference <= ONLINE_WINDOW
    );

}


/* ============================================================
   LOAD FRIENDS
============================================================ */

async function loadFriends() {

    const list =
        document.getElementById(
            "homeFriendsList"
        );

    const empty =
        document.getElementById(
            "homeFriendsEmpty"
        );


    if (!list) {

        console.warn(
            "[Solaria] homeFriendsList was not found."
        );

        return;

    }


    list.innerHTML = `
        <div class="friends-loading">
            Loading friends...
        </div>
    `;


    try {

        if (
            !window.blockworldFriends ||
            typeof window.blockworldFriends.getFriends !==
            "function"
        ) {

            throw new Error(
                "Friends API is unavailable."
            );

        }


        const result =
            await window.blockworldFriends.getFriends();


        console.log(
            "[Solaria] Friends result:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not load friends."
            );

        }


        currentFriends =
            Array.isArray(result.friends)
                ? result.friends
                : [];


        renderFriends();

    } catch (error) {

        console.error(
            "[Solaria] Failed to load friends:",
            error
        );


        list.innerHTML = `
            <div class="friends-empty">
                <strong>Could not load friends</strong>
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;


        if (empty) {

            empty.style.display =
                "none";

        }

    }

}


/* ============================================================
   RENDER FRIENDS
============================================================ */

function renderFriends() {

    const list =
        document.getElementById(
            "homeFriendsList"
        );

    const empty =
        document.getElementById(
            "homeFriendsEmpty"
        );


    if (!list) {

        return;

    }


    if (
        currentFriends.length ===
        0
    ) {

        list.innerHTML = "";


        if (empty) {

            empty.style.display =
                "block";

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    list.innerHTML =
        currentFriends
            .map(
                friend => {

                    const online =
                        isOnline(
                            friend.last_seen
                        );


                    const name =
                        friend.display_name ||
                        friend.username ||
                        "Unknown Player";


                    const firstLetter =
                        name
                            .charAt(0)
                            .toUpperCase();


                    return `
                        <div
                            class="friend-card"
                            data-friend-id="${escapeHTML(friend.id)}"
                        >

                            <div class="friend-avatar">
                                ${escapeHTML(firstLetter)}
                            </div>

                            <div class="friend-info">

                                <div class="friend-display-name">
                                    ${escapeHTML(name)}
                                </div>

                                <div class="friend-username">
                                    @${escapeHTML(
                                        friend.username ||
                                        "unknown"
                                    )}
                                </div>

                                <div class="friend-status">

                                    <span
                                        class="friend-status-dot ${
                                            online
                                                ? "online"
                                                : "offline"
                                        }"
                                    ></span>

                                    <span>
                                        ${
                                            online
                                                ? "Online"
                                                : "Offline"
                                        }
                                    </span>

                                </div>

                            </div>

                            <button
                                class="friend-remove-button"
                                data-friend-id="${escapeHTML(
                                    friend.friendshipId
                                )}"
                            >
                                REMOVE
                            </button>

                        </div>
                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".friend-remove-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const friendshipId =
                            button.dataset.friendId;


                        await removeFriend(
                            friendshipId
                        );

                    }
                );

            }
        );

}


/* ============================================================
   LOAD INCOMING REQUESTS
============================================================ */

async function loadIncomingRequests() {

    const list =
        document.getElementById(
            "friendRequestsList"
        );


    if (!list) {

        return;

    }


    try {

        if (
            !window.blockworldFriends ||
            typeof window.blockworldFriends.getIncoming !==
            "function"
        ) {

            throw new Error(
                "Friend request API is unavailable."
            );

        }


        const result =
            await window.blockworldFriends
                .getIncoming();


        console.log(
            "[Solaria] Incoming requests:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not load incoming requests."
            );

        }


        currentIncomingRequests =
            Array.isArray(result.requests)
                ? result.requests
                : [];


        renderFriendRequests();

    } catch (error) {

        console.error(
            "[Solaria] Incoming request error:",
            error
        );

        list.innerHTML = `
            <div class="friends-empty">
                ${escapeHTML(error.message)}
            </div>
        `;

    }

}


/* ============================================================
   LOAD OUTGOING REQUESTS
============================================================ */

async function loadOutgoingRequests() {

    const list =
        document.getElementById(
            "friendRequestsList"
        );


    if (!list) {

        return;

    }


    try {

        if (
            !window.blockworldFriends ||
            typeof window.blockworldFriends.getOutgoing !==
            "function"
        ) {

            throw new Error(
                "Friend request API is unavailable."
            );

        }


        const result =
            await window.blockworldFriends
                .getOutgoing();


        console.log(
            "[Solaria] Outgoing requests:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not load outgoing requests."
            );

        }


        currentOutgoingRequests =
            Array.isArray(result.requests)
                ? result.requests
                : [];


        renderFriendRequests();

    } catch (error) {

        console.error(
            "[Solaria] Outgoing request error:",
            error
        );

    }

}


/* ============================================================
   RENDER ALL PENDING REQUESTS
============================================================ */

function renderFriendRequests() {

    const list =
        document.getElementById(
            "friendRequestsList"
        );


    if (!list) {

        return;

    }


    const total =
        currentIncomingRequests.length +
        currentOutgoingRequests.length;


    if (total === 0) {

        list.innerHTML = `
            <div class="friends-empty">
                No pending friend requests.
            </div>
        `;

        return;

    }


    let html = "";


    /* ========================================================
       INCOMING
    ======================================================== */

    currentIncomingRequests
        .forEach(
            request => {

                const profile =
                    request.requester ||
                    {};


                const name =
                    profile.display_name ||
                    profile.username ||
                    "Unknown Player";


                html += `
                    <div class="friend-request-card">

                        <div class="friend-avatar">
                            ${escapeHTML(
                                name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div class="friend-request-info">

                            <div class="friend-request-display">
                                ${escapeHTML(name)}
                            </div>

                            <div class="friend-request-username">
                                @${escapeHTML(
                                    profile.username ||
                                    "unknown"
                                )}
                            </div>

                            <div class="friend-status">

                                <span
                                    class="friend-status-dot ${
                                        isOnline(
                                            profile.last_seen
                                        )
                                            ? "online"
                                            : "offline"
                                    }"
                                ></span>

                                <span>
                                    ${
                                        isOnline(
                                            profile.last_seen
                                        )
                                            ? "Online"
                                            : "Offline"
                                    }
                                </span>

                            </div>

                        </div>

                        <div class="friend-request-actions">

                            <button
                                class="friend-accept-button"
                                data-request-id="${escapeHTML(
                                    request.id
                                )}"
                            >
                                ACCEPT
                            </button>

                            <button
                                class="friend-decline-button"
                                data-request-id="${escapeHTML(
                                    request.id
                                )}"
                            >
                                DECLINE
                            </button>

                        </div>

                    </div>
                `;

            }
        );


    /* ========================================================
       OUTGOING
    ======================================================== */

    currentOutgoingRequests
        .forEach(
            request => {

                const profile =
                    request.receiver ||
                    {};


                const name =
                    profile.display_name ||
                    profile.username ||
                    "Unknown Player";


                html += `
                    <div class="friend-request-card">

                        <div class="friend-avatar">
                            ${escapeHTML(
                                name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div class="friend-request-info">

                            <div class="friend-request-display">
                                ${escapeHTML(name)}
                            </div>

                            <div class="friend-request-username">
                                @${escapeHTML(
                                    profile.username ||
                                    "unknown"
                                )}
                            </div>

                            <div class="friend-status">

                                <span
                                    class="friend-status-dot ${
                                        isOnline(
                                            profile.last_seen
                                        )
                                            ? "online"
                                            : "offline"
                                    }"
                                ></span>

                                <span>
                                    ${
                                        isOnline(
                                            profile.last_seen
                                        )
                                            ? "Online"
                                            : "Offline"
                                    }
                                </span>

                            </div>

                        </div>

                        <div class="friend-request-actions">

                            <button
                                class="friend-decline-button"
                                data-request-id="${escapeHTML(
                                    request.id
                                )}"
                            >
                                CANCEL
                            </button>

                        </div>

                    </div>
                `;

            }
        );


    list.innerHTML =
        html;


    /* ========================================================
       ACCEPT
    ======================================================== */

    list
        .querySelectorAll(
            ".friend-accept-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await respondToRequest(
                            button.dataset.requestId,
                            "accept"
                        );

                    }
                );

            }
        );


    /* ========================================================
       DECLINE / CANCEL
    ======================================================== */

    list
        .querySelectorAll(
            ".friend-decline-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await cancelOrDeclineRequest(
                            button.dataset.requestId
                        );

                    }
                );

            }
        );

}


/* ============================================================
   SEND FRIEND REQUEST
============================================================ */

async function sendFriendRequest(
    username
) {

    username =
        String(username || "").trim();


    if (!username) {

        alert(
            "Enter a username first."
        );

        return;

    }


    try {

        if (
            !window.blockworldFriends ||
            typeof window.blockworldFriends.sendRequest !==
            "function"
        ) {

            throw new Error(
                "Friends API is unavailable."
            );

        }


        const result =
            await window.blockworldFriends
                .sendRequest(
                    username
                );


        console.log(
            "[Solaria] Send friend request:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not send friend request."
            );

        }


        alert(
            `Friend request sent to @${username}!`
        );


        await loadFriends();
        await loadIncomingRequests();
        await loadOutgoingRequests();

    } catch (error) {

        console.error(
            "[Solaria] Send friend request error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* ============================================================
   ACCEPT REQUEST
============================================================ */

async function respondToRequest(
    friendshipId,
    action
) {

    if (!friendshipId) {

        return;

    }


    try {

        const result =
            await window.blockworldFriends
                .respond(
                    friendshipId,
                    action
                );


        console.log(
            "[Solaria] Friend response:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not respond to request."
            );

        }


        await loadFriends();
        await loadIncomingRequests();
        await loadOutgoingRequests();

    } catch (error) {

        console.error(
            "[Solaria] Respond request error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* ============================================================
   DECLINE OR CANCEL
============================================================ */

async function cancelOrDeclineRequest(
    friendshipId
) {

    if (!friendshipId) {

        return;

    }


    try {

        const result =
            await window.blockworldFriends
                .remove(
                    friendshipId
                );


        console.log(
            "[Solaria] Cancel/decline request:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not remove request."
            );

        }


        await loadIncomingRequests();
        await loadOutgoingRequests();

    } catch (error) {

        console.error(
            "[Solaria] Cancel/decline error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* ============================================================
   REMOVE FRIEND
============================================================ */

async function removeFriend(
    friendshipId
) {

    if (!friendshipId) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to remove this friend?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const result =
            await window.blockworldFriends
                .remove(
                    friendshipId
                );


        console.log(
            "[Solaria] Remove friend:",
            result
        );


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                result?.error ||
                "Could not remove friend."
            );

        }


        await loadFriends();

    } catch (error) {

        console.error(
            "[Solaria] Remove friend error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* ============================================================
   ADD FRIEND BUTTON
============================================================ */

function setupAddFriendButtons() {

    const addFriendButton =
        document.getElementById(
            "addFriendButton"
        );


    const addFriendEmptyButton =
        document.getElementById(
            "addFriendEmptyButton"
        );


    if (addFriendButton) {

        addFriendButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./screens/search.html";

            }
        );

    }


    if (addFriendEmptyButton) {

        addFriendEmptyButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./screens/search.html";

            }
        );

    }

}


/* ============================================================
   UPDATE FRIEND ONLINE STATUS
============================================================ */

function refreshFriendOnlineStatuses() {

    renderFriends();
    renderFriendRequests();

}


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeFriends() {

    console.log(
        "[Solaria] Initializing Friends..."
    );


    setupAddFriendButtons();


    await loadFriends();

    await loadIncomingRequests();

    await loadOutgoingRequests();


    /*
     * Refresh online/offline states every 30 seconds.
     */

    setInterval(
        refreshFriendOnlineStatuses,
        30000
    );


    console.log(
        "[Solaria] Friends system ready."
    );

}


/* ============================================================
   GLOBAL API
============================================================ */

window.loadFriends =
    loadFriends;

window.loadIncomingRequests =
    loadIncomingRequests;

window.loadOutgoingRequests =
    loadOutgoingRequests;

window.sendFriendRequest =
    sendFriendRequest;

window.respondToRequest =
    respondToRequest;

window.removeFriend =
    removeFriend;


/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeFriends
);