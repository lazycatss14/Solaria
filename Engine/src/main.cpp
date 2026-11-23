#include <string>
#include <fstream>
#include <sstream>
#include <unordered_map>
#include <cstdint>
#include <cstdlib>
#include <algorithm>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif

// Prevent Win32 names from colliding with raylib names.
#define CloseWindow Win32CloseWindow
#define ShowCursor Win32ShowCursor
#define Rectangle Win32GdiRectangle
#define LoadImage Win32LoadImage
#define DrawTextEx Win32DrawTextEx
#define PlaySound Win32PlaySound

#include <windows.h>

#undef CloseWindow
#undef ShowCursor
#undef Rectangle
#undef LoadImage
#undef DrawTextEx
#undef PlaySound
#undef DrawText
#endif

#include "raylib.h"
#include "Engine.h"
#include "Game01.h"
#include "BlockWorldAPI.h"
#include "GameNetwork.h"
#include "MultiplayerHUD.h"

enum class Screen
{
    GAME,
    PAUSE,
    SETTINGS,
    TUTORIAL
};

static const Color UI_BACKGROUND = { 17, 27, 39, 245 };
static const Color UI_PANEL = { 29, 43, 57, 255 };
static const Color UI_ACCENT = { 255, 190, 91, 255 };
static const Color UI_TEXT = { 239, 246, 240, 255 };
static const Color UI_MUTED = { 164, 181, 188, 255 };

// The menu is authored on a 1280x720 design canvas, then uniformly scaled
// and centered so it stays centered and readable at any resizable window size.
static float gUiScale = 1.0f;
static Vector2 gUiOffset = { 0.0f, 0.0f };

static void BeginResponsiveUI()
{
    const float scaleX = (float)GetScreenWidth() / 1280.0f;
    const float scaleY = (float)GetScreenHeight() / 720.0f;
    gUiScale = std::max(0.1f, std::min(scaleX, scaleY));
    gUiOffset = {
        ((float)GetScreenWidth() - 1280.0f * gUiScale) * 0.5f,
        ((float)GetScreenHeight() - 720.0f * gUiScale) * 0.5f
    };

    Camera2D uiCamera = {};
    uiCamera.offset = gUiOffset;
    uiCamera.target = { 0.0f, 0.0f };
    uiCamera.rotation = 0.0f;
    uiCamera.zoom = gUiScale;
    BeginMode2D(uiCamera);
}

static void EndResponsiveUI()
{
    EndMode2D();
}

static bool Button(const char* text, Rectangle bounds)
{
    Vector2 mouse = GetMousePosition();
    mouse.x = (mouse.x - gUiOffset.x) / gUiScale;
    mouse.y = (mouse.y - gUiOffset.y) / gUiScale;
    bool hover = CheckCollisionPointRec(mouse, bounds);

    DrawRectangleRounded(
        bounds,
        0.18f,
        8,
        hover ? UI_ACCENT : UI_PANEL
    );

    DrawText(
        text,
        (int)(bounds.x + 18),
        (int)(bounds.y + 13),
        20,
        hover ? UI_BACKGROUND : UI_TEXT
    );

    return hover && IsMouseButtonPressed(MOUSE_BUTTON_LEFT);
}

static const char* KeyLabel(int key)
{
    const char* name = GetKeyName(key);
    return name ? name : "Unknown";
}

struct SolariaPlayerData
{
    std::string displayName = "Guest";
    std::string username;
    std::string renderMode = "ball";

    // GLTF mesh order: Head, RightArm, LeftLeg, LeftArm, RightLeg, Torso.
    Color avatarColors[6] = {
        { 255, 214, 160, 255 },
        { 255, 214, 160, 255 },
        { 34, 34, 34, 255 },
        { 255, 214, 160, 255 },
        { 34, 34, 34, 255 },
        { 51, 102, 255, 255 }
    };
};

static Color ParseAvatarColor(const std::string& value, Color fallback)
{
    if (value.size() != 7 || value[0] != '#') {
        return fallback;
    }

    char* end = nullptr;
    const unsigned long parsed = std::strtoul(value.c_str() + 1, &end, 16);

    if (!end || *end != '\0') {
        return fallback;
    }

    return Color{
        static_cast<unsigned char>((parsed >> 16) & 0xFF),
        static_cast<unsigned char>((parsed >> 8) & 0xFF),
        static_cast<unsigned char>(parsed & 0xFF),
        255
    };
}

static SolariaPlayerData LoadSolariaPlayerData(const std::string& path)
{
    SolariaPlayerData data;

    if (path.empty()) {
        return data;
    }

    std::ifstream file(path);
    if (!file.is_open()) {
        TraceLog(LOG_WARNING, "Player data file could not be opened: %s", path.c_str());
        return data;
    }

    std::unordered_map<std::string, std::string> values;
    std::string line;

    while (std::getline(file, line)) {
        const std::size_t split = line.find('=');
        if (split == std::string::npos) {
            continue;
        }

        values[line.substr(0, split)] = line.substr(split + 1);
    }

    if (values.count("displayName") && !values["displayName"].empty()) {
        data.displayName = values["displayName"];
    }

    if (values.count("username")) {
        data.username = values["username"];
    }

    if (values.count("renderMode")) {
        data.renderMode = values["renderMode"];
    }

    data.avatarColors[0] = ParseAvatarColor(values["head"], data.avatarColors[0]);
    data.avatarColors[1] = ParseAvatarColor(values["rightArm"], data.avatarColors[1]);
    data.avatarColors[2] = ParseAvatarColor(values["leftLeg"], data.avatarColors[2]);
    data.avatarColors[3] = ParseAvatarColor(values["leftArm"], data.avatarColors[3]);
    data.avatarColors[4] = ParseAvatarColor(values["rightLeg"], data.avatarColors[4]);
    data.avatarColors[5] = ParseAvatarColor(values["torso"], data.avatarColors[5]);

    return data;
}

int main(int argc, char* argv[])
{
    const bool testMode = argc > 1 && std::string(argv[1]) == "test";

    std::string playerDataPath;

    for (int i = 2; i < argc; ++i) {
        const std::string argument = argv[i];

        if (argument == "--player-data" && i + 1 < argc) {
            playerDataPath = argv[++i];
        }
    }

    SolariaPlayerData playerData = LoadSolariaPlayerData(playerDataPath);

    if (testMode && playerData.displayName == "Guest") {
        playerData.displayName = "Player 1";
    }

    const std::string localPlayerName = playerData.displayName;



    BlockWorldEngine engine;

    if (!engine.Initialize(1280, 720, "Solaria"))
        return 1;



    long supabaseStatus = 0;

    if (BlockWorldAPI::TestConnection(supabaseStatus))
    {
        TraceLog(
            LOG_INFO,
            "Supabase connection test HTTP status: %ld",
            supabaseStatus
        );
    }
    else
    {
        TraceLog(LOG_WARNING, "Supabase connection test failed.");
    }

    Game01 game;
    game.Initialize();
    game.SetAvatarColors(playerData.avatarColors);

    TraceLog(
        LOG_INFO,
        "Solaria player: %s (@%s), avatar mode: %s",
        playerData.displayName.c_str(),
        playerData.username.c_str(),
        playerData.renderMode.c_str()
    );

    GameNetwork network;
    MultiplayerHUD multiplayerHUD;


    if (testMode)
    {
        TraceLog(LOG_INFO, "TEST MODE: Joining as Player 1");
        network.Start(localPlayerName, "main");
    }

    int keyForward = KEY_W;
    int keyBackward = KEY_S;
    int keyLeft = KEY_A;
    int keyRight = KEY_D;
    int keyJump = KEY_SPACE;

    game.SetMovementKeys(
        keyForward,
        keyBackward,
        keyLeft,
        keyRight,
        keyJump
    );

    Screen screen = Screen::GAME;
    int waitingForKey = -1;

    bool shiftLock = false;

    bool tutorialSeen = false;
    {
        std::ifstream file("solaria_tutorial_seen.txt");
        tutorialSeen = file.good();
    }

    if (!tutorialSeen)
        screen = Screen::TUTORIAL;

    int diagnosticFrameCount = 0;
    TraceLog(LOG_INFO, "DIAGNOSTIC: Entering main game loop.");
    while (engine.BeginFrame())
    {
        bool exitToLauncher = false;
        diagnosticFrameCount++;
        if (diagnosticFrameCount == 1)
            TraceLog(LOG_INFO, "DIAGNOSTIC: First game frame started.");
        if (screen == Screen::GAME && IsKeyPressed(KEY_ESCAPE))
        {
            multiplayerHUD.StopTyping();
            screen = Screen::PAUSE;
        }
        else if (screen == Screen::PAUSE && IsKeyPressed(KEY_ESCAPE))
            screen = Screen::GAME;
        // Shift toggles Shift Lock while playing.
        if (screen == Screen::GAME &&
            (IsKeyPressed(KEY_LEFT_SHIFT) ||
             IsKeyPressed(KEY_RIGHT_SHIFT)))
        {
            shiftLock = !shiftLock;
            engine.SetShiftLockEnabled(shiftLock);
        }

        // Update the HUD before the player controller so typing can freeze movement.
        if (screen == Screen::GAME)
        {
            multiplayerHUD.Update(network);

            if (multiplayerHUD.TakeMenuRequest())
                screen = Screen::PAUSE;
        }

        game.SetMovementEnabled(
            screen == Screen::GAME && !multiplayerHUD.IsTyping()
        );

        // Keep the mouse available while the chat window is open.
        engine.SetMenuOpen(
            screen != Screen::GAME || multiplayerHUD.IsChatOpen()
        );

        if (screen == Screen::GAME)
        {
            engine.UpdatePlayerCamera(game.GetPlayerPosition());

            game.Update(engine.GetCameraYaw());

            if (testMode)
            {
                Vector3 position = game.GetPlayerPosition();
                network.SendUpdate(position.x, position.y, position.z, engine.GetCameraYaw());
            }

            BeginMode3D(engine.GetCamera());
            game.Render(engine.IsFirstPerson());
            EndMode3D();

            // Project the local player's head position into screen space.
            Vector3 nameWorldPosition = game.GetPlayerPosition();
            nameWorldPosition.y += 2.35f;
            Vector2 nameScreenPosition = GetWorldToScreen(
                nameWorldPosition,
                engine.GetCamera()
            );

            const int nameWidth = MeasureText(localPlayerName.c_str(), 16);
            if (nameScreenPosition.x >= 0.0f &&
                nameScreenPosition.x <= (float)GetScreenWidth() &&
                nameScreenPosition.y >= 0.0f &&
                nameScreenPosition.y <= (float)GetScreenHeight())
            {
                Rectangle namePlate = {
                    nameScreenPosition.x - nameWidth * 0.5f - 8.0f,
                    nameScreenPosition.y - 5.0f,
                    (float)nameWidth + 16.0f,
                    25.0f
                };
                DrawRectangleRounded(
                    namePlate, 0.25f, 6,
                    Color{ 0, 66, 130, 210 }
                );
                DrawText(
                    localPlayerName.c_str(),
                    (int)(nameScreenPosition.x - nameWidth * 0.5f),
                    (int)nameScreenPosition.y,
                    16,
                    WHITE
                );
            }

            Rectangle statusPanel = {
                18.0f,
                (float)GetScreenHeight() - 68.0f,
                250.0f,
                50.0f
            };

            DrawRectangleRounded(
                statusPanel, 0.08f, 8,
                Color{ 236, 233, 216, 235 }
            );
            DrawRectangleRoundedLines(
                statusPanel, 0.08f, 8,
                Color{ 70, 90, 115, 255 }
            );
            DrawRectangle(
                22,
                GetScreenHeight() - 64,
                242,
                22,
                Color{ 0, 84, 166, 255 }
            );
            DrawText("SOLARIA", 31, GetScreenHeight() - 62, 16, WHITE);
            DrawText(
                "GAME WORLD  |  ESC: MENU  |  /: CHAT",
                30,
                GetScreenHeight() - 38,
                10,
                Color{ 35, 45, 58, 255 }
            );

            multiplayerHUD.Draw(network, localPlayerName);
            multiplayerHUD.DrawChatBubble(game.GetPlayerPosition(), engine.GetCamera());
        }
        else
        {
            // Keep the world visible behind the menus.
            engine.UpdatePlayerCamera(game.GetPlayerPosition());

            BeginMode3D(engine.GetCamera());
            game.Render(engine.IsFirstPerson());
            EndMode3D();

            DrawRectangle(0, 0, GetScreenWidth(), GetScreenHeight(), { 0, 0, 0, 150 });
            BeginResponsiveUI();

            Rectangle panel = { 350, 75, 580, 570 };

            DrawRectangleRounded(
                panel,
                0.06f,
                12,
                UI_BACKGROUND
            );

            DrawText("SOLARIA", 395, 105, 34, UI_ACCENT);

            if (screen == Screen::PAUSE)
            {
                DrawText("PAUSED", 395, 158, 24, UI_TEXT);

                if (Button("Resume", { 395, 220, 490, 55 }))
                    screen = Screen::GAME;

                if (Button("Settings", { 395, 290, 490, 55 }))
                    screen = Screen::SETTINGS;

                if (Button("Controls Tutorial", { 395, 360, 490, 55 }))
                    screen = Screen::TUTORIAL;

                if (Button("Exit Game", { 395, 430, 490, 55 }))
                {
                    TraceLog(LOG_WARNING, "DIAGNOSTIC: Exit Game button was clicked.");
                    exitToLauncher = true;
                }
            }
            else if (screen == Screen::SETTINGS)
            {
                DrawText("SETTINGS", 395, 158, 24, UI_TEXT);

                if (Button(
                    shiftLock ? "Shift Lock: ON" : "Shift Lock: OFF",
                    { 395, 205, 490, 48 }
                ))
                {
                    shiftLock = !shiftLock;
                    engine.SetShiftLockEnabled(shiftLock);
                }

                DrawText("MOVEMENT KEYBINDS", 395, 275, 18, UI_ACCENT);

                const char* labels[] = {
                    "Move Forward",
                    "Move Backward",
                    "Turn Left",
                    "Turn Right",
                    "Jump"
                };

                int keys[] = {
                    keyForward,
                    keyBackward,
                    keyLeft,
                    keyRight,
                    keyJump
                };

                for (int i = 0; i < 5; ++i)
                {
                    int y = 310 + i * 42;

                    DrawText(labels[i], 405, y + 7, 17, UI_TEXT);

                    Rectangle keyButton = {
                        710,
                        (float)y,
                        165,
                        34
                    };

                    const bool active = waitingForKey == i;

                    if (Button(
                        active ? "Press a key..." : KeyLabel(keys[i]),
                        keyButton
                    ))
                    {
                        waitingForKey = i;
                    }
                }

                if (waitingForKey >= 0)
                {
                    int pressed = GetKeyPressed();

                    if (pressed != 0 && pressed != KEY_ESCAPE)
                    {
                        switch (waitingForKey)
                        {
                            case 0: keyForward = pressed; break;
                            case 1: keyBackward = pressed; break;
                            case 2: keyLeft = pressed; break;
                            case 3: keyRight = pressed; break;
                            case 4: keyJump = pressed; break;
                        }

                        game.SetMovementKeys(
                            keyForward,
                            keyBackward,
                            keyLeft,
                            keyRight,
                            keyJump
                        );

                        waitingForKey = -1;
                    }
                }

                if (Button("Back", { 395, 555, 490, 48 }))
                {
                    waitingForKey = -1;
                    screen = Screen::PAUSE;
                }
            }
            else if (screen == Screen::TUTORIAL)
            {
                DrawText("CONTROLS TUTORIAL", 395, 158, 24, UI_TEXT);

                DrawText("MOVEMENT", 405, 220, 18, UI_ACCENT);
                DrawText(TextFormat("%s  Move forward", KeyLabel(keyForward)), 420, 250, 18, UI_TEXT);
                DrawText(TextFormat("%s  Move backward", KeyLabel(keyBackward)), 420, 280, 18, UI_TEXT);
                DrawText(TextFormat("%s  Turn left", KeyLabel(keyLeft)), 420, 310, 18, UI_TEXT);
                DrawText(TextFormat("%s  Turn right", KeyLabel(keyRight)), 420, 340, 18, UI_TEXT);
                DrawText(TextFormat("%s  Jump", KeyLabel(keyJump)), 420, 370, 18, UI_TEXT);

                DrawText("CAMERA", 405, 420, 18, UI_ACCENT);
                DrawText("Press Shift to toggle Shift Lock.", 420, 450, 17, UI_TEXT);
                DrawText("Hold right mouse button for temporary camera look.", 420, 480, 17, UI_TEXT);
                DrawText("ESC opens the pause menu.", 420, 510, 17, UI_TEXT);

                if (Button("Let's Play", { 395, 570, 490, 48 }))
                {
                    std::ofstream file("solaria_tutorial_seen.txt");
                    file << "seen";
                    screen = Screen::GAME;
                }
            }

            EndResponsiveUI();
        }

        engine.EndFrame();
        if (diagnosticFrameCount == 1)
            TraceLog(LOG_INFO, "DIAGNOSTIC: First game frame completed.");

        if (exitToLauncher)
            break;
    }

    TraceLog(LOG_WARNING, "DIAGNOSTIC: Main loop exited after %d frames.", diagnosticFrameCount);

    engine.SetShiftLockEnabled(false);

    network.Stop();
    game.Shutdown();
    engine.Shutdown();

    return 0;
}







