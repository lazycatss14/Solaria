#include "GameNetwork.h"

#ifdef _WIN32
#include <windows.h>
#include <winhttp.h>
#endif

#include <algorithm>
#include <chrono>
#include <cmath>
#include <sstream>
#include <regex>
#include <fstream>
#include <cstdlib>

namespace
{
// SOLARIA_NETWORK_DIAGNOSTICS
static void NetworkLog(const std::string& message)
{
    std::ofstream log("Engine/Network/network-debug.log", std::ios::app);
    if (log.is_open()) log << message << std::endl;
}
    std::string EscapeJson(const std::string& value)
    {
        std::string out;
        for (char c : value)
        {
            if (c == '"' || c == '\\') out += '\\';
            if (c == '\n' || c == '\r') continue;
            out += c;
        }
        return out;
    }

    std::string GetString(const std::string& json, const std::string& key)
    {
        std::regex pattern("\"" + key + "\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"");
        std::smatch match;
        if (std::regex_search(json, match, pattern))
            return match[1].str();
        return {};
    }

    float GetNumber(const std::string& json, const std::string& key, float fallback = 0.0f)
    {
        std::regex pattern("\"" + key + "\"\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)");
        std::smatch match;
        if (std::regex_search(json, match, pattern))
            return std::stof(match[1].str());
        return fallback;
    }

    std::string MakeHello(const std::string& name, const std::string& room)
    {
        return "{\"type\":\"hello\",\"name\":\"" + EscapeJson(name) +
               "\",\"room\":\"" + EscapeJson(room) + "\"}";
    }

    struct ServerAddress
    {
        std::wstring host;
        std::wstring path;
        INTERNET_PORT port = 80;
        bool secure = false;
        bool valid = false;
    };

    static std::wstring Utf8ToWide(const std::string& value)
    {
        if (value.empty()) return {};
        int count = MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, nullptr, 0);
        if (count <= 0) return {};
        std::wstring result(static_cast<size_t>(count), L'\0');
        MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, result.data(), count);
        if (!result.empty() && result.back() == L'\0') result.pop_back();
        return result;
    }

    static ServerAddress ParseServerAddress(const std::string& url)
    {
        ServerAddress result;
        const std::string securePrefix = "wss://";
        const std::string plainPrefix = "ws://";
        size_t start = 0;

        if (url.rfind(securePrefix, 0) == 0)
        {
            result.secure = true;
            result.port = 443;
            start = securePrefix.size();
        }
        else if (url.rfind(plainPrefix, 0) == 0)
        {
            result.port = 80;
            start = plainPrefix.size();
        }
        else return result;

        size_t pathStart = url.find('/', start);
        std::string authority = url.substr(start,
            pathStart == std::string::npos ? std::string::npos : pathStart - start);
        std::string path = pathStart == std::string::npos ? "/" : url.substr(pathStart);

        if (authority.empty()) return result;

        size_t colon = authority.rfind(':');
        if (colon != std::string::npos)
        {
            std::string portText = authority.substr(colon + 1);
            if (portText.empty()) return result;
            char* end = nullptr;
            long parsedPort = std::strtol(portText.c_str(), &end, 10);
            if (!end || *end != '\0' || parsedPort < 1 || parsedPort > 65535)
                return result;
            result.port = static_cast<INTERNET_PORT>(parsedPort);
            authority.resize(colon);
        }

        result.host = Utf8ToWide(authority);
        result.path = Utf8ToWide(path);
        result.valid = !result.host.empty() && !result.path.empty();
        return result;
    }

}

GameNetwork::GameNetwork()
    : m_running(false), m_connected(false)
{
}

GameNetwork::~GameNetwork()
{
    Stop();
}

bool GameNetwork::Start(const std::string& playerName, const std::string& room)
{
    if (m_running) return true;

    m_playerName = playerName.empty() ? "Guest" : playerName;
    m_room = room.empty() ? "main" : room;
    m_running = true;
    m_connected = false;

    m_thread = std::thread(&GameNetwork::Run, this);
    return true;
}

void GameNetwork::Stop()
{
    m_running = false;
    m_connected = false;
    m_condition.notify_all();

    if (m_thread.joinable())
        m_thread.join();
}

bool GameNetwork::IsConnected() const
{
    return m_connected;
}

void GameNetwork::QueueMessage(const std::string& message)
{
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_outgoing.push_back(message);
    }
    m_condition.notify_one();
}

void GameNetwork::SendUpdate(float x, float y, float z, float rotation)
{
    if (!m_connected) return;

    if (!std::isfinite(x) || !std::isfinite(y) ||
        !std::isfinite(z) || !std::isfinite(rotation))
        return;

    std::ostringstream out;
    out << "{\"type\":\"update\",\"position\":{\"x\":" << x
        << ",\"y\":" << y << ",\"z\":" << z
        << "},\"rotation\":" << rotation << "}";

    QueueMessage(out.str());
}

void GameNetwork::SendChat(const std::string& message)
{
    if (!m_connected || message.empty()) return;

    std::string clean = message.substr(0, 250);
    QueueMessage("{\"type\":\"chat\",\"message\":\"" + EscapeJson(clean) + "\"}");
}

std::vector<SolariaNetPlayer> GameNetwork::GetPlayers()
{
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_players;
}

std::vector<SolariaNetMessage> GameNetwork::GetMessages()
{
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_messages;
}

std::string GameNetwork::GetPlayerId() const
{
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_playerId;
}

void GameNetwork::HandleMessage(const std::string& json)
{
    const std::string type = GetString(json, "type");

    if (type == "welcome")
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_playerId = GetString(json, "id");
        m_players.clear();

        std::regex objectPattern("\\{[^{}]*\\}");
        for (auto it = std::sregex_iterator(json.begin(), json.end(), objectPattern);
             it != std::sregex_iterator(); ++it)
        {
            std::string object = it->str();
            std::string id = GetString(object, "id");
            std::string name = GetString(object, "name");

            if (id.empty() || name.empty()) continue;

            SolariaNetPlayer player;
            player.id = id;
            player.name = name;
            player.role = GetString(object, "role");
            if (player.role.empty()) player.role = "Player";
            player.x = GetNumber(object, "x");
            player.y = GetNumber(object, "y", 1.0f);
            player.z = GetNumber(object, "z");
            m_players.push_back(player);
        }
        return;
    }

    if (type == "player_joined")
    {
        // The server sends player fields at the top level so this lightweight
        // parser can read them without needing a full JSON library.
        std::string id = GetString(json, "id");
        std::string name = GetString(json, "name");
        if (id.empty()) return;

        std::lock_guard<std::mutex> lock(m_mutex);
        auto found = std::find_if(m_players.begin(), m_players.end(),
            [&](const SolariaNetPlayer& p) { return p.id == id; });

        if (found == m_players.end())
        {
            SolariaNetPlayer player;
            player.id = id;
            player.name = name.empty() ? "Guest" : name;
            player.role = GetString(json, "role");
            if (player.role.empty()) player.role = "Player";
            player.x = GetNumber(json, "x");
            player.y = GetNumber(json, "y", 1.0f);
            player.z = GetNumber(json, "z");
            player.rotation = GetNumber(json, "rotation");
            m_players.push_back(player);
        }
        return;
    }

    if (type == "player_left")
    {
        std::string id = GetString(json, "id");
        std::lock_guard<std::mutex> lock(m_mutex);
        m_players.erase(std::remove_if(m_players.begin(), m_players.end(),
            [&](const SolariaNetPlayer& p) { return p.id == id; }), m_players.end());
        return;
    }

    if (type == "player_update")
    {
        std::string id = GetString(json, "id");
        std::lock_guard<std::mutex> lock(m_mutex);

        auto found = std::find_if(m_players.begin(), m_players.end(),
            [&](const SolariaNetPlayer& p) { return p.id == id; });

        if (found != m_players.end())
        {
            found->x = GetNumber(json, "x", found->x);
            found->y = GetNumber(json, "y", found->y);
            found->z = GetNumber(json, "z", found->z);
            found->rotation = GetNumber(json, "rotation", found->rotation);
        }
        return;
    }

    if (type == "chat")
    {
        SolariaNetMessage msg;
        msg.id = GetString(json, "id");
        msg.name = GetString(json, "name");
        msg.message = GetString(json, "message");

        std::lock_guard<std::mutex> lock(m_mutex);
        m_messages.push_back(msg);
        if (m_messages.size() > 100)
            m_messages.erase(m_messages.begin());
    }
}

void GameNetwork::Run()
{
    NetworkLog("Starting multiplayer connection...");
#ifdef _WIN32
    HINTERNET session = WinHttpOpen(
        L"SolariaGame/1.0",
        WINHTTP_ACCESS_TYPE_NO_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0);

    if (!session)
    {
        NetworkLog("WinHttpOpen failed: " + std::to_string(GetLastError()));
        m_running = false;
        return;
    }

    const char* configuredUrl = std::getenv("SOLARIA_SERVER_URL");
    const std::string serverUrl = configuredUrl ? configuredUrl : "ws://127.0.0.1:8787/";
    const ServerAddress address = ParseServerAddress(serverUrl);

    if (!address.valid)
    {
        NetworkLog("Invalid SOLARIA_SERVER_URL. Use ws:// or wss://.");
        WinHttpCloseHandle(session);
        m_running = false;
        return;
    }

    NetworkLog("Connecting to " + serverUrl);
    HINTERNET connection = WinHttpConnect(
        session, address.host.c_str(), address.port, 0);

    HINTERNET request = connection
        ? WinHttpOpenRequest(connection, L"GET", address.path.c_str(),
            nullptr, WINHTTP_NO_REFERER,
            WINHTTP_DEFAULT_ACCEPT_TYPES,
            address.secure ? WINHTTP_FLAG_SECURE : 0)
        : nullptr;

    if (!request)
    {
        NetworkLog("WinHttpOpenRequest failed: " + std::to_string(GetLastError()));
        if (connection) WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        m_running = false;
        return;
    }

    WinHttpSetOption(request, WINHTTP_OPTION_UPGRADE_TO_WEB_SOCKET, nullptr, 0);

    BOOL sent = WinHttpSendRequest(request,
        WINHTTP_NO_ADDITIONAL_HEADERS, 0,
        WINHTTP_NO_REQUEST_DATA, 0, 0, 0);

    if (!sent)
        NetworkLog("WinHttpSendRequest failed: " + std::to_string(GetLastError()));

    BOOL received = sent && WinHttpReceiveResponse(request, nullptr);

    if (sent && !received)
        NetworkLog("WinHttpReceiveResponse failed: " + std::to_string(GetLastError()));

    HINTERNET socket = received
        ? WinHttpWebSocketCompleteUpgrade(request, 0)
        : nullptr;

    WinHttpCloseHandle(request);

    if (!socket)
    {
        NetworkLog("WebSocket upgrade failed: " + std::to_string(GetLastError()));
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        m_running = false;
        return;
    }

    NetworkLog("WebSocket connected successfully.");
    m_connected = true;

    std::string hello = MakeHello(m_playerName, m_room);
    WinHttpWebSocketSend(socket,
        WINHTTP_WEB_SOCKET_UTF8_MESSAGE_BUFFER_TYPE,
        (PVOID)hello.data(),
        (DWORD)hello.size());

    m_receiveThread = std::thread(&GameNetwork::ReceiveLoop, this, socket);

    while (m_running && m_connected)
    {
        std::string outgoing;

        {
            std::unique_lock<std::mutex> lock(m_mutex);
            m_condition.wait_for(lock, std::chrono::milliseconds(20),
                [&] { return !m_outgoing.empty() || !m_running; });

            if (!m_outgoing.empty())
            {
                outgoing = std::move(m_outgoing.front());
                m_outgoing.erase(m_outgoing.begin());
            }
        }

        if (!outgoing.empty())
        {
            DWORD result = WinHttpWebSocketSend(socket,
                WINHTTP_WEB_SOCKET_UTF8_MESSAGE_BUFFER_TYPE,
                (PVOID)outgoing.data(),
                (DWORD)outgoing.size());

            if (result != NO_ERROR)
                break;
        }
    }

    m_running = false;
    m_connected = false;

    // Shutdown the WebSocket before joining the receive thread. Receive()
    // can block indefinitely otherwise, preventing Exit Game from returning.
    if (m_receiveThread.joinable())
    {
        const DWORD shutdownResult = WinHttpWebSocketShutdown(
            socket,
            WINHTTP_WEB_SOCKET_SUCCESS_CLOSE_STATUS,
            nullptr,
            0);

        if (shutdownResult != NO_ERROR)
            NetworkLog("WebSocket shutdown returned: " + std::to_string(shutdownResult));

        m_receiveThread.join();
    }

    WinHttpWebSocketClose(socket,
        WINHTTP_WEB_SOCKET_SUCCESS_CLOSE_STATUS,
        nullptr, 0);

    WinHttpCloseHandle(socket);
    WinHttpCloseHandle(connection);
    WinHttpCloseHandle(session);
#else
    m_running = false;
#endif
}

void GameNetwork::ReceiveLoop(void* socketPointer)
{
#ifdef _WIN32
    HINTERNET socket = (HINTERNET)socketPointer;
    char buffer[8192];
    std::string message;

    while (m_running && m_connected)
    {
        DWORD bytesRead = 0;
        WINHTTP_WEB_SOCKET_BUFFER_TYPE bufferType;

        DWORD result = WinHttpWebSocketReceive(
            socket, buffer, sizeof(buffer), &bytesRead, &bufferType);

        if (result != NO_ERROR)
            break;

        message.append(buffer, bytesRead);

        if (bufferType == WINHTTP_WEB_SOCKET_UTF8_MESSAGE_BUFFER_TYPE ||
            bufferType == WINHTTP_WEB_SOCKET_BINARY_MESSAGE_BUFFER_TYPE)
        {
            HandleMessage(message);
            message.clear();
        }

        if (bufferType == WINHTTP_WEB_SOCKET_CLOSE_BUFFER_TYPE)
            break;
    }

    m_connected = false;
    m_running = false;
    m_condition.notify_all();
#endif
}
