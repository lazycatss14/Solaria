#pragma once

#include <string>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <condition_variable>

struct SolariaNetPlayer
{
    std::string id;
    std::string name;
    std::string role = "Player";
    float x = 0.0f;
    float y = 1.0f;
    float z = 0.0f;
    float rotation = 0.0f;
};

struct SolariaNetMessage
{
    std::string id;
    std::string name;
    std::string message;
};

class GameNetwork
{
public:
    GameNetwork();
    ~GameNetwork();

    bool Start(const std::string& playerName, const std::string& room = "main");
    void Stop();

    bool IsConnected() const;
    void SendUpdate(float x, float y, float z, float rotation);
    void SendChat(const std::string& message);

    std::vector<SolariaNetPlayer> GetPlayers();
    std::vector<SolariaNetMessage> GetMessages();
    std::string GetPlayerId() const;

private:
    void Run();
    void ReceiveLoop(void* socket);
    void QueueMessage(const std::string& message);
    void HandleMessage(const std::string& json);

    std::atomic<bool> m_running;
    std::atomic<bool> m_connected;
    std::thread m_thread;
    std::thread m_receiveThread;

    mutable std::mutex m_mutex;
    std::condition_variable m_condition;

    std::vector<std::string> m_outgoing;
    std::vector<SolariaNetPlayer> m_players;
    std::vector<SolariaNetMessage> m_messages;

    std::string m_playerName;
    std::string m_room;
    std::string m_playerId;
};
