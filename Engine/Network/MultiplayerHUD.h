#pragma once

#include "raylib.h"
#include "GameNetwork.h"

#include <algorithm>
#include <string>
#include <vector>

class MultiplayerHUD
{
public:
    MultiplayerHUD()
        : m_chatOpen(false),
          m_inputActive(false),
          m_leaderboardVisible(true),
          m_menuRequested(false),
          m_leaderboardX(-1.0f),
          m_chatScroll(0),
          m_bubbleTimer(0.0f)
    {
    }

    void Update(GameNetwork& network)
    {
        const int sw = GetScreenWidth();
        const int sh = GetScreenHeight();
        const Vector2 mouse = GetMousePosition();
        const bool mousePressed = IsMouseButtonPressed(MOUSE_BUTTON_LEFT);

        m_bubbleTimer = std::max(0.0f, m_bubbleTimer - GetFrameTime());

        if (m_leaderboardX < 0.0f)
            m_leaderboardX = (float)sw - 263.0f;

        // Tab slides the leaderboard off-screen and back.
        if (!m_inputActive && IsKeyPressed(KEY_TAB))
            m_leaderboardVisible = !m_leaderboardVisible;

        // Slash, including Shift+Slash for ?, opens chat directly in typing mode.
        const bool slashShortcut = IsKeyPressed(KEY_SLASH);
        if (slashShortcut)
        {
            m_chatOpen = true;
            m_inputActive = true;
        }

        const Rectangle menuButton = { 18.0f, 18.0f, 78.0f, 38.0f };
        const Rectangle chatButton = { 104.0f, 18.0f, 82.0f, 38.0f };
        const Rectangle chatPanel = { 18.0f, 64.0f, 365.0f, 310.0f };
        const Rectangle inputBox = { 30.0f, 326.0f, 258.0f, 36.0f };
        const Rectangle sendButton = { 296.0f, 326.0f, 75.0f, 36.0f };
        const Rectangle history = { 30.0f, 116.0f, 341.0f, 198.0f };

        if (mousePressed && CheckCollisionPointRec(mouse, menuButton))
        {
            m_inputActive = false;
            m_menuRequested = true;
        }
        else if (mousePressed && CheckCollisionPointRec(mouse, chatButton))
        {
            m_chatOpen = !m_chatOpen;
            m_inputActive = false;
        }
        else if (m_chatOpen && mousePressed)
        {
            const Rectangle closeButton = { 358.0f, 69.0f, 17.0f, 17.0f };
            if (CheckCollisionPointRec(mouse, closeButton))
            {
                m_chatOpen = false;
                m_inputActive = false;
            }
            else if (CheckCollisionPointRec(mouse, inputBox))
            {
                m_inputActive = true;
            }
            else if (CheckCollisionPointRec(mouse, sendButton))
            {
                SendMessage(network);
            }
            else if (!CheckCollisionPointRec(mouse, chatPanel))
            {
                // Keep the small window open, but fade it and release typing focus.
                m_inputActive = false;
            }
            else if (!CheckCollisionPointRec(mouse, history))
            {
                m_inputActive = false;
            }
        }

        if (m_chatOpen && CheckCollisionPointRec(mouse, history))
        {
            const float wheel = GetMouseWheelMove();
            if (wheel > 0.0f) m_chatScroll += 2;
            if (wheel < 0.0f) m_chatScroll -= 2;
        }

        if (m_inputActive)
        {
            int character = GetCharPressed();
            bool skipShortcutCharacter = slashShortcut;

            while (character > 0)
            {
                if (skipShortcutCharacter &&
                    (character == '/' || character == '?'))
                {
                    skipShortcutCharacter = false;
                }
                else if (character >= 32 && character <= 125 &&
                         m_input.size() < 250)
                {
                    m_input += (char)character;
                }

                character = GetCharPressed();
            }

            if (IsKeyPressed(KEY_BACKSPACE) && !m_input.empty())
                m_input.pop_back();

            if (IsKeyPressed(KEY_ENTER))
                SendMessage(network);
        }
        else if (slashShortcut)
        {
            // Drain the slash character so it does not remain queued.
            while (GetCharPressed() > 0) {}
        }

        // Smooth XP-style slide animation.
        const float targetX = m_leaderboardVisible
            ? (float)sw - 263.0f
            : (float)sw + 3.0f;

        const float amount = std::min(GetFrameTime() * 12.0f, 1.0f);
        m_leaderboardX += (targetX - m_leaderboardX) * amount;

        (void)sh;
    }

    void Draw(GameNetwork& network, const std::string& localPlayerName)
    {
        const int sw = GetScreenWidth();
        const int sh = GetScreenHeight();

        const Color xpBody = { 236, 233, 216, 255 };
        const Color xpBodyDark = { 210, 207, 190, 255 };
        const Color xpBlue = { 0, 84, 166, 255 };
        const Color xpBlueLight = { 36, 137, 222, 255 };
        const Color xpText = { 28, 36, 48, 255 };
        const Color xpMuted = { 95, 100, 108, 255 };
        const Color xpWhite = { 255, 255, 255, 255 };
        const Color xpBorder = { 74, 91, 112, 255 };

        // Top-left XP-style controls.
        DrawXpButton({ 18, 18, 78, 38 }, "MENU", false);
        DrawXpButton({ 104, 18, 82, 38 }, "CHAT", false);

        // Top-right leaderboard. It slides beyond the right edge when hidden.
        Rectangle playerPanel = { m_leaderboardX, 18.0f, 245.0f, 292.0f };
        DrawXpWindow(playerPanel, "Players", xpBody, xpBlue, xpBlueLight);

        std::vector<SolariaNetPlayer> players = network.GetPlayers();
        const std::string myId = network.GetPlayerId();

        // Always include the local player in the visible list, even before
        // the existing connection has delivered its first player snapshot.
        const bool hasLocalPlayer = std::any_of(
            players.begin(), players.end(),
            [&](const SolariaNetPlayer& p) {
                return !myId.empty() && p.id == myId;
            }
        );
        if (!hasLocalPlayer)
        {
            SolariaNetPlayer localPlayer;
            localPlayer.id = myId;
            localPlayer.name = localPlayerName.empty() ? "Guest" : localPlayerName;
            players.insert(players.begin(), localPlayer);
        }

        DrawText(
            TextFormat("%i online", (int)players.size()),
            (int)playerPanel.x + 155,
            (int)playerPanel.y + 8,
            11,
            xpWhite
        );

        const int maxRows = 8;
        const int count = std::min((int)players.size(), maxRows);

        for (int i = 0; i < count; ++i)
        {
            const float y = playerPanel.y + 39.0f + i * 29.0f;
            Rectangle row = {
                playerPanel.x + 9.0f, y,
                playerPanel.width - 18.0f, 27.0f
            };

            const bool isMe =
                (!myId.empty() && players[i].id == myId) ||
                (myId.empty() && i == 0);
            DrawRectangleRec(row, isMe ? Color{ 207, 229, 250, 255 } : xpWhite);
            DrawRectangleLinesEx(row, 1.0f, xpBorder);
            DrawCircle((int)row.x + 12, (int)y + 13, 4, isMe ? BLUE : GREEN);

            std::string name = players[i].name.empty()
                ? "Guest" : players[i].name;
            if (name.size() > 20)
                name = name.substr(0, 17) + "...";

            DrawText(name.c_str(), (int)row.x + 23,
                     (int)y + 6, 13, xpText);

            if (isMe)
                DrawText("You", (int)row.x + 187,
                         (int)y + 7, 10, xpMuted);
        }

        if (players.size() == 1)
            DrawText("Waiting for other players...",
                     (int)playerPanel.x + 12,
                     (int)playerPanel.y + 82, 11, xpMuted);

        // Small chat window below the top-left buttons.
        if (m_chatOpen)
        {
            const unsigned char alpha = m_inputActive ? 255 : 178;
            Color body = xpBody;
            Color title = xpBlue;
            Color titleLight = xpBlueLight;
            body.a = alpha;
            title.a = alpha;
            titleLight.a = alpha;

            Rectangle chatPanel = { 18.0f, 64.0f, 365.0f, 310.0f };
            DrawXpWindow(chatPanel, "Solaria Chat", body, title, titleLight, alpha);

            Rectangle history = { 30.0f, 116.0f, 341.0f, 198.0f };
            DrawRectangleRec(history, Color{ 255, 255, 255, alpha });
            DrawRectangleLinesEx(history, 1.0f, xpBorder);

            DrawText(
                network.IsConnected() ? "Connected" : "Connecting...",
                275, 76, 10,
                Color{ 235, 245, 255, alpha }
            );

            std::vector<SolariaNetMessage> messages = network.GetMessages();
            if (messages.empty())
            {
                const char* emptyText = network.IsConnected()
                    ? "No messages yet. Say hello!"
                    : "Connecting to chat server...";
                DrawText(emptyText, (int)history.x + 9,
                         (int)history.y + 12, 12, xpMuted);
            }
            const int maxVisible = 8;
            const int maxScroll = std::max(0, (int)messages.size() - maxVisible);
            m_chatScroll = std::max(0, std::min(m_chatScroll, maxScroll));

            const int endIndex = (int)messages.size() - m_chatScroll;
            const int startIndex = std::max(0, endIndex - maxVisible);

            int line = 0;
            for (int i = startIndex; i < endIndex; ++i)
            {
                std::string sender = messages[i].name.empty()
                    ? "Guest" : messages[i].name;
                std::string entry = sender + ": " + messages[i].message;

                if (entry.size() > 49)
                    entry = entry.substr(0, 46) + "...";

                DrawText(entry.c_str(),
                         (int)history.x + 7,
                         (int)history.y + 7 + line * 23,
                         12,
                         Color{ xpText.r, xpText.g, xpText.b, alpha });
                ++line;
            }

            Rectangle inputBox = { 30.0f, 326.0f, 258.0f, 36.0f };
            Rectangle sendButton = { 296.0f, 326.0f, 75.0f, 36.0f };

            DrawXpButton(inputBox, m_inputActive ? " " : "Click here to type", true);
            if (!m_input.empty())
            {
                DrawRectangleRec(
                    { inputBox.x + 5, inputBox.y + 4,
                      inputBox.width - 10, inputBox.height - 8 },
                    Color{ 255, 255, 255, alpha }
                );
                DrawText(m_input.c_str(), (int)inputBox.x + 10,
                         (int)inputBox.y + 11, 13, xpText);
            }
            else if (m_inputActive)
            {
                DrawText("Type a message...", (int)inputBox.x + 10,
                         (int)inputBox.y + 11, 13, xpMuted);
            }

            DrawXpButton(sendButton, "Send", false);
        }

        (void)sw;
        (void)sh;
        (void)xpBodyDark;
    }

    void DrawChatBubble(Vector3 playerPosition, Camera3D& camera) const
    {
        if (m_bubbleTimer <= 0.0f || m_bubbleText.empty())
            return;

        Vector3 bubbleWorldPosition = playerPosition;
        bubbleWorldPosition.y += 3.05f;

        const Vector2 screenPosition = GetWorldToScreen(
            bubbleWorldPosition,
            camera
        );

        const int screenWidth = GetScreenWidth();
        const int screenHeight = GetScreenHeight();
        if (screenPosition.x < 0.0f || screenPosition.x > (float)screenWidth ||
            screenPosition.y < 0.0f || screenPosition.y > (float)screenHeight)
            return;

        std::string text = m_bubbleText;
        if (text.size() > 48)
            text = text.substr(0, 45) + "...";

        const int fontSize = 14;
        const float width = (float)std::max(100, std::min(350, MeasureText(text.c_str(), fontSize) + 26));
        const float height = 34.0f;
        Rectangle bubble = {
            screenPosition.x - width * 0.5f,
            screenPosition.y - 48.0f,
            width,
            height
        };

        bubble.x = std::max(6.0f, std::min(bubble.x, (float)screenWidth - width - 6.0f));
        bubble.y = std::max(6.0f, bubble.y);

        const unsigned char alpha = (unsigned char)(m_bubbleTimer < 0.8f
            ? 245.0f * (m_bubbleTimer / 0.8f) : 245.0f);
        const Color bubbleColor = { 255, 255, 255, alpha };
        const Color borderColor = { 47, 76, 105, alpha };

        DrawTriangle(
            { screenPosition.x - 8.0f, bubble.y + height - 1.0f },
            { screenPosition.x + 8.0f, bubble.y + height - 1.0f },
            { screenPosition.x, bubble.y + height + 9.0f },
            bubbleColor
        );
        DrawRectangleRounded(bubble, 0.22f, 8, bubbleColor);
        DrawRectangleRoundedLines(bubble, 0.22f, 8, borderColor);
        DrawText(text.c_str(), (int)bubble.x + 13, (int)bubble.y + 10,
                 fontSize, Color{ 30, 42, 58, alpha });
    }

    bool IsTyping() const
    {
        return m_inputActive;
    }

    bool IsChatOpen() const
    {
        return m_chatOpen;
    }

    void StopTyping()
    {
        m_inputActive = false;
    }

    bool TakeMenuRequest()
    {
        const bool requested = m_menuRequested;
        m_menuRequested = false;
        return requested;
    }

private:
    bool m_chatOpen;
    bool m_inputActive;
    bool m_leaderboardVisible;
    bool m_menuRequested;
    float m_leaderboardX;
    int m_chatScroll;
    float m_bubbleTimer;
    std::string m_input;
    std::string m_bubbleText;

    static void DrawXpButton(Rectangle r, const char* label, bool inset)
    {
        const Color face = { 236, 233, 216, 255 };
        const Color light = { 255, 255, 255, 255 };
        const Color dark = { 105, 105, 105, 255 };

        DrawRectangleRec(r, face);
        if (inset)
        {
            DrawLine((int)r.x, (int)r.y, (int)(r.x + r.width), (int)r.y, dark);
            DrawLine((int)r.x, (int)r.y, (int)r.x, (int)(r.y + r.height), dark);
            DrawLine((int)r.x, (int)(r.y + r.height),
                     (int)(r.x + r.width), (int)(r.y + r.height), light);
            DrawLine((int)(r.x + r.width), (int)r.y,
                     (int)(r.x + r.width), (int)(r.y + r.height), light);
        }
        else
        {
            DrawLine((int)r.x, (int)r.y, (int)(r.x + r.width), (int)r.y, light);
            DrawLine((int)r.x, (int)r.y, (int)r.x, (int)(r.y + r.height), light);
            DrawLine((int)r.x, (int)(r.y + r.height),
                     (int)(r.x + r.width), (int)(r.y + r.height), dark);
            DrawLine((int)(r.x + r.width), (int)r.y,
                     (int)(r.x + r.width), (int)(r.y + r.height), dark);
        }

        const int fontSize = 13;
        const int textWidth = MeasureText(label, fontSize);
        DrawText(label,
                 (int)(r.x + (r.width - textWidth) * 0.5f),
                 (int)(r.y + (r.height - fontSize) * 0.5f),
                 fontSize,
                 Color{ 30, 42, 58, 255 });
    }

    static void DrawXpWindow(
        Rectangle r,
        const char* title,
        Color body,
        Color titleColor,
        Color titleLight,
        unsigned char alpha = 255)
    {
        DrawRectangleRec(r, body);
        DrawRectangleLinesEx(r, 2.0f, Color{ 72, 88, 108, alpha });

        Rectangle titleBar = { r.x + 2, r.y + 2, r.width - 4, 27 };
        DrawRectangleGradientV((int)titleBar.x, (int)titleBar.y, (int)titleBar.width, (int)titleBar.height, titleLight, titleColor);
        DrawText(title, (int)titleBar.x + 9, (int)titleBar.y + 6,
                 14, Color{ 255, 255, 255, alpha });

        Rectangle closeButton = {
            r.x + r.width - 25, r.y + 5, 17, 17
        };
        DrawRectangleRec(closeButton, Color{ 220, 70, 65, alpha });
        DrawRectangleLinesEx(closeButton, 1.0f, Color{ 255, 255, 255, alpha });
        DrawText("x", (int)closeButton.x + 5, (int)closeButton.y + 1,
                 13, Color{ 255, 255, 255, alpha });
    }

    void SendMessage(GameNetwork& network)
    {
        if (m_input.empty())
            return;

        // Keep the typed text if the network is still connecting. This avoids
        // silently clearing a message that was never sent.
        if (!network.IsConnected())
            return;

        m_bubbleText = m_input;
        m_bubbleTimer = 5.0f;
        network.SendChat(m_input);
        m_input.clear();
        m_chatScroll = 0;
    }
};

