#include "Engine.h"
#include "Game01.h"
#include "BlockWorldAPI.h"

#include "raylib.h"

int main()
{
    BlockWorldEngine engine;

    if (!engine.Initialize(
        1280,
        720,
        "BlockWorld"
    ))
    {
        return 1;
    }

    // Test connection to Supabase
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
        TraceLog(
            LOG_ERROR,
            "Supabase connection test failed."
        );
    }

    // Create Game01
    Game01 game;

    game.Initialize();

    // Main game loop
    while (engine.BeginFrame())
    {
        // Update camera position from the player
        engine.UpdatePlayerCamera(
            game.GetPlayerPosition()
        );

        // Update game
        game.Update(
            engine.GetCameraYaw()
        );

        // Draw 3D world
        BeginMode3D(
            engine.GetCamera()
        );

        game.Render(
            engine.IsFirstPerson()
        );

        EndMode3D();

        // UI
        DrawText(
            "BLOCKWORLD ENGINE",
            20,
            20,
            30,
            BLACK
        );

        DrawText(
            "WASD = Move | SPACE = Jump | RMB = Look | Mouse Wheel = Zoom",
            20,
            55,
            20,
            DARKGRAY
        );

        engine.EndFrame();
    }

    // Shutdown
    game.Shutdown();

    engine.Shutdown();

    return 0;
}