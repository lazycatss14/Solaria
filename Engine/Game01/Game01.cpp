#include "Engine.h"
#include "Game01.h"

#include "raylib.h"

#include <cmath>

/*
    ============================================================
    SOLARIA - GAME 01
    Basic playable 3D game
    ============================================================
*/


// ============================================================
// AVATAR
// ============================================================

static Model g_avatarModel = {};
static bool g_avatarModelLoaded = false;


// ============================================================
// GAME SETTINGS
// ============================================================

namespace GameSettings
{
    // Player
    constexpr float PLAYER_SPEED = 6.0f;
    constexpr float PLAYER_GROUND_Y = 1.0f;

    // Jumping
    constexpr float JUMP_POWER = 8.0f;
    constexpr float GRAVITY = 20.0f;

    // Rotation
    constexpr float ROTATION_SPEED = 12.0f;

    // Walking
    constexpr float WALK_SPEED = 9.0f;
    constexpr float WALK_BLEND_SPEED = 8.0f;

    // Avatar
    constexpr float AVATAR_SCALE = 1.0f;

    // The imported GLB faces backwards.
    constexpr float AVATAR_ROTATION_OFFSET = 180.0f;

    // Prevent huge physics jumps if the game lags.
    constexpr float MAX_DELTA_TIME = 0.05f;

    // Movement threshold.
    constexpr float MOVEMENT_EPSILON = 0.001f;
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

static float NormalizeAngle(float angle)
{
    while (angle > 180.0f)
    {
        angle -= 360.0f;
    }

    while (angle < -180.0f)
    {
        angle += 360.0f;
    }

    return angle;
}


static float GetClampedDeltaTime()
{
    float deltaTime = GetFrameTime();

    if (deltaTime > GameSettings::MAX_DELTA_TIME)
    {
        deltaTime = GameSettings::MAX_DELTA_TIME;
    }

    return deltaTime;
}


// ============================================================
// CONSTRUCTOR
// ============================================================

Game01::Game01()
    : m_initialized(false),
      m_playerPosition({
          0.0f,
          GameSettings::PLAYER_GROUND_Y,
          0.0f
      }),
      m_playerVelocityY(0.0f),
      m_onGround(true),
      m_playerRotation(0.0f),
      m_walkTime(0.0f),
      m_walkAmount(0.0f)
{
}


// ============================================================
// INITIALIZE
// ============================================================

void Game01::Initialize()
{
    m_initialized = true;

    // Reset player.
    m_playerPosition = {
        0.0f,
        GameSettings::PLAYER_GROUND_Y,
        0.0f
    };

    m_playerVelocityY = 0.0f;
    m_onGround = true;
    m_playerRotation = 0.0f;

    m_walkTime = 0.0f;
    m_walkAmount = 0.0f;


    // --------------------------------------------------------
    // Load avatar
    // --------------------------------------------------------

    if (!g_avatarModelLoaded)
    {
        g_avatarModel = LoadModel(
            "Engine/Assets/Avatars/blockworld-r6.glb"
        );

        /*
            raylib's Model has a mesh count.

            If no meshes were loaded, treat the model as
            unavailable instead of pretending it loaded.
        */

        if (g_avatarModel.meshCount > 0)
        {
            g_avatarModelLoaded = true;

            TraceLog(
                LOG_INFO,
                "Solaria R6 avatar loaded successfully."
            );
        }
        else
        {
            TraceLog(
                LOG_ERROR,
                "Failed to load Solaria R6 avatar."
            );

            g_avatarModel = {};
            g_avatarModelLoaded = false;
        }
    }
}


// ============================================================
// UPDATE
// ============================================================

void Game01::Update(float cameraYaw)
{
    if (!m_initialized)
    {
        return;
    }

    const float deltaTime = GetClampedDeltaTime();


    // ========================================================
    // CAMERA-RELATIVE MOVEMENT
    // ========================================================

    const float yawRadians = cameraYaw * DEG2RAD;

    // Forward direction.
    const Vector2 forward = {
        -sinf(yawRadians),
        -cosf(yawRadians)
    };

    // Right direction.
    const Vector2 right = {
        cosf(yawRadians),
        -sinf(yawRadians)
    };


    Vector2 movement = {
        0.0f,
        0.0f
    };


    // WASD.
    if (IsKeyDown(KEY_W))
    {
        movement.x += forward.x;
        movement.y += forward.y;
    }

    if (IsKeyDown(KEY_S))
    {
        movement.x -= forward.x;
        movement.y -= forward.y;
    }

    if (IsKeyDown(KEY_A))
    {
        movement.x -= right.x;
        movement.y -= right.y;
    }

    if (IsKeyDown(KEY_D))
    {
        movement.x += right.x;
        movement.y += right.y;
    }


    // ========================================================
    // NORMALIZE MOVEMENT
    // ========================================================

    const float movementLength = std::sqrt(
        movement.x * movement.x +
        movement.y * movement.y
    );

    const bool isMoving =
        movementLength > GameSettings::MOVEMENT_EPSILON;


    if (isMoving)
    {
        movement.x /= movementLength;
        movement.y /= movementLength;


        // ====================================================
        // MOVE PLAYER
        // ====================================================

        m_playerPosition.x +=
            movement.x *
            GameSettings::PLAYER_SPEED *
            deltaTime;

        m_playerPosition.z +=
            movement.y *
            GameSettings::PLAYER_SPEED *
            deltaTime;


        // ====================================================
        // ROTATE PLAYER
        // ====================================================

        const float targetRotation =
            std::atan2(
                movement.x,
                -movement.y
            ) * RAD2DEG;

        const float rotationDifference =
            NormalizeAngle(
                targetRotation -
                m_playerRotation
            );

        m_playerRotation +=
            rotationDifference *
            GameSettings::ROTATION_SPEED *
            deltaTime;


        // ====================================================
        // WALK STATE
        // ====================================================

        m_walkTime +=
            deltaTime *
            GameSettings::WALK_SPEED;

        m_walkAmount +=
            deltaTime *
            GameSettings::WALK_BLEND_SPEED;

        if (m_walkAmount > 1.0f)
        {
            m_walkAmount = 1.0f;
        }
    }
    else
    {
        // Fade walking state out.
        m_walkAmount -=
            deltaTime *
            GameSettings::WALK_BLEND_SPEED;

        if (m_walkAmount < 0.0f)
        {
            m_walkAmount = 0.0f;
        }
    }


    // ========================================================
    // JUMP
    // ========================================================

    if (IsKeyPressed(KEY_SPACE) && m_onGround)
    {
        m_playerVelocityY =
            GameSettings::JUMP_POWER;

        m_onGround = false;
    }


    // ========================================================
    // GRAVITY
    // ========================================================

    m_playerVelocityY -=
        GameSettings::GRAVITY *
        deltaTime;

    m_playerPosition.y +=
        m_playerVelocityY *
        deltaTime;


    // ========================================================
    // GROUND COLLISION
    // ========================================================

    if (
        m_playerPosition.y <=
        GameSettings::PLAYER_GROUND_Y
    )
    {
        m_playerPosition.y =
            GameSettings::PLAYER_GROUND_Y;

        m_playerVelocityY = 0.0f;
        m_onGround = true;
    }
}


// ============================================================
// RENDER
// ============================================================

void Game01::Render(bool firstPerson)
{
    if (!m_initialized)
    {
        return;
    }


    // ========================================================
    // PLAYER
    // ========================================================

    if (!firstPerson)
    {
        if (g_avatarModelLoaded)
        {
            const float avatarRotation =
                m_playerRotation +
                GameSettings::AVATAR_ROTATION_OFFSET;

            DrawModelEx(
                g_avatarModel,

                m_playerPosition,

                {
                    0.0f,
                    1.0f,
                    0.0f
                },

                avatarRotation,

                {
                    GameSettings::AVATAR_SCALE,
                    GameSettings::AVATAR_SCALE,
                    GameSettings::AVATAR_SCALE
                },

                WHITE
            );
        }
        else
        {
            // Simple fallback character.
            DrawCube(
                {
                    m_playerPosition.x,
                    m_playerPosition.y + 1.0f,
                    m_playerPosition.z
                },

                1.0f,
                2.0f,
                1.0f,

                RED
            );
        }
    }


    // ========================================================
    // WORLD
    // ========================================================

    DrawGrid(
        20,
        1.0f
    );
}


// ============================================================
// PLAYER POSITION
// ============================================================

Vector3 Game01::GetPlayerPosition() const
{
    return m_playerPosition;
}


// ============================================================
// SHUTDOWN
// ============================================================

void Game01::Shutdown()
{
    if (g_avatarModelLoaded)
    {
        UnloadModel(g_avatarModel);

        g_avatarModel = {};
        g_avatarModelLoaded = false;
    }

    m_initialized = false;
}