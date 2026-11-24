const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8787);
const MAX_PLAYERS_PER_ROOM = Number(process.env.MAX_PLAYERS_PER_ROOM || 50);

const server = new WebSocket.Server({
    port: PORT,
    host: "0.0.0.0",
    maxPayload: 16 * 1024
});

const players = new Map();

function send(socket, data) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}

function broadcast(room, data, excludedSocket = null) {
    for (const player of players.values()) {
        if (player.room === room && player.socket !== excludedSocket) {
            send(player.socket, data);
        }
    }
}

function getRoomPlayers(room) {
    return [...players.values()]
        .filter(player => player.room === room)
        .map(player => ({
            id: player.id,
            name: player.name,
            role: player.role,
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            rotation: player.rotation
        }));
}

function cleanText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value.trim()
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .slice(0, maxLength);
}

function validNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function disconnect(player) {
    if (!player || !players.has(player.id)) return;
    players.delete(player.id);
    broadcast(player.room, {
        type: "player_left",
        id: player.id,
        playerCount: getRoomPlayers(player.room).length
    });
    console.log(`[-] ${player.name} (${player.id})`);
}

server.on("connection", socket => {
    let player = null;

    socket.on("message", raw => {
        let data;
        try {
            data = JSON.parse(raw.toString());
        } catch {
            send(socket, { type: "error", message: "Invalid JSON message." });
            return;
        }

        if (!data || typeof data.type !== "string") return;

        if (!player) {
            if (data.type !== "hello") {
                send(socket, { type: "error", message: "Send a hello message first." });
                socket.close(1008, "Handshake required");
                return;
            }

            const name = cleanText(data.name, 20) || "Guest";
            const room = cleanText(data.room, 40) || "main";
            const roomCount = [...players.values()].filter(p => p.room === room).length;

            if (roomCount >= MAX_PLAYERS_PER_ROOM) {
                send(socket, { type: "error", message: "This room is full." });
                socket.close(1013, "Room full");
                return;
            }

            player = {
                id: crypto.randomUUID(),
                name,
                role: "Player",
                room,
                socket,
                position: { x: 0, y: 1, z: 0 },
                rotation: 180,
                lastUpdate: 0,
                lastChat: 0,
                lastPing: Date.now()
            };

            players.set(player.id, player);

            const roomPlayers = getRoomPlayers(room);
            send(socket, {
                type: "welcome",
                id: player.id,
                room,
                players: roomPlayers,
                playerCount: roomPlayers.length
            });

            broadcast(room, {
                type: "player_joined",
                id: player.id,
                name: player.name,
                role: player.role,
                x: player.position.x,
                y: player.position.y,
                z: player.position.z,
                rotation: player.rotation,
                playerCount: roomPlayers.length
            }, socket);

            console.log(`[+] ${name} joined room ${room}`);
            return;
        }

        if (data.type === "update") {
            const now = Date.now();
            if (now - player.lastUpdate < 33) return;
            player.lastUpdate = now;

            const p = data.position;
            if (!p || !validNumber(p.x) || !validNumber(p.y) ||
                !validNumber(p.z) || !validNumber(data.rotation)) return;

            if (Math.abs(p.x) > 100000 || Math.abs(p.y) > 100000 ||
                Math.abs(p.z) > 100000 || Math.abs(data.rotation) > 100000) return;

            player.position = { x: p.x, y: p.y, z: p.z };
            player.rotation = data.rotation;

            broadcast(player.room, {
                type: "player_update",
                id: player.id,
                x: p.x,
                y: p.y,
                z: p.z,
                rotation: data.rotation
            }, socket);
            return;
        }

        if (data.type === "chat") {
            const now = Date.now();
            if (now - player.lastChat < 500) return;
            player.lastChat = now;

            const message = cleanText(data.message, 250);
            if (!message) return;

            broadcast(player.room, {
                type: "chat",
                id: player.id,
                name: player.name,
                message,
                timestamp: now
            });
            return;
        }

        if (data.type === "ping") {
            send(socket, { type: "pong", timestamp: Date.now() });
        }
    });

    socket.on("close", () => disconnect(player));
    socket.on("error", () => disconnect(player));
});

server.on("listening", () => {
    console.log("==================================");
    console.log("       SOLARIA GAME SERVER");
    console.log("==================================");
    console.log(`Listening on 0.0.0.0:${PORT}`);
    console.log("WebSocket server is ready.");
});

server.on("error", error => {
    console.error("Server error:", error.message);
    process.exitCode = 1;
});

// Keep the Render service responsive and remove dead connections.
const heartbeat = setInterval(() => {
    for (const player of players.values()) {
        if (player.socket.readyState !== WebSocket.OPEN) {
            disconnect(player);
        } else {
            send(player.socket, { type: "ping", timestamp: Date.now() });
        }
    }
}, 25000);

server.on("close", () => clearInterval(heartbeat));
