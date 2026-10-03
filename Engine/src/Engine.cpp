#include "Engine.h"
#include "Game01.h"
#include "BlockWorldAPI.h"

#include "raylib.h"

#include <cmath>

BlockWorldEngine::BlockWorldEngine()
    : m_width(1280),
      m_height(720),
      m_running(false),
      m_cameraYaw(0.0f),
      m_cameraPitch(20.0f),
      m_cameraDistance(8.0f),
      m_lookMode(false)
{
    m_camera = {};
}

BlockWorldEngine::~BlockWorldEngine()
{
    Shutdown();
}

bool BlockWorldEngine::Initialize(
    int width,
    int height,
    const char* title
)
{
    m_width = width;
    m_height = height;

    InitWindow(
        m_width,
        m_height,
        title
    );

    if (!IsWindowReady())
    {
        return false;
    }

    SetTargetFPS(60);

    /*
        ==============================
        CAMERA INITIALIZATION
        ==============================
    */

    m_camera.position = {
        8.0f,
        6.0f,
        8.0f
    };

    m_camera.target = {
        0.0f,
        1.0f,
        0.0f
    };

    m_camera.up = {
        0.0f,
        1.0f,
        0.0f
    };

    m_camera.fovy = 45.0f;

    m_camera.projection =
        CAMERA_PERSPECTIVE;

    /*
        ==============================
        CAMERA SETTINGS
        ==============================
    */

    m_cameraYaw = 0.0f;

    m_cameraPitch = 20.0f;

    m_cameraDistance = 8.0f;

    m_lookMode = false;

    m_running = true;

    EnableCursor();

    return true;
}

bool BlockWorldEngine::BeginFrame()
{
    if (!m_running)
    {
        return false;
    }

    if (WindowShouldClose())
    {
        m_running = false;
        return false;
    }

    BeginDrawing();

    ClearBackground(SKYBLUE);

    return true;
}

void BlockWorldEngine::EndFrame()
{
    if (!m_running)
    {
        return;
    }

    EndDrawing();
}

void BlockWorldEngine::UpdatePlayerCamera(
    Vector3 playerPosition
)
{
    if (!m_running)
    {
        return;
    }

    /*
        ==============================
        ZOOM
        ==============================
    */

    float wheel =
        GetMouseWheelMove();

    if (wheel != 0.0f)
    {
        m_cameraDistance -=
            wheel * 1.0f;

        if (m_cameraDistance < 0.0f)
        {
            m_cameraDistance = 0.0f;
        }

        if (m_cameraDistance > 20.0f)
        {
            m_cameraDistance = 20.0f;
        }
    }

    /*
        ==============================
        RIGHT MOUSE LOOK
        ==============================
    */

    if (IsMouseButtonPressed(
        MOUSE_BUTTON_RIGHT
    ))
    {
        m_lookMode = !m_lookMode;

        if (m_lookMode)
        {
            DisableCursor();
        }
        else
        {
            EnableCursor();
        }
    }

    /*
        ==============================
        CAMERA ROTATION
        ==============================
    */

    if (m_lookMode)
    {
        Vector2 mouseDelta =
            GetMouseDelta();

        const float mouseSensitivity =
            0.25f;

        /*
            GLOBE-STYLE HORIZONTAL LOOK

            Mouse LEFT  = camera looks RIGHT
            Mouse RIGHT = camera looks LEFT

            This makes it feel like you are
            dragging a globe/world around.
        */

        m_cameraYaw -=
            mouseDelta.x *
            mouseSensitivity;

        /*
            GLOBE-STYLE VERTICAL LOOK

            Mouse UP   = camera looks DOWN
            Mouse DOWN = camera looks UP
        */

        m_cameraPitch +=
            mouseDelta.y *
            mouseSensitivity;

        /*
            Prevent the camera from
            flipping completely upside down.
        */

        if (m_cameraPitch > 85.0f)
        {
            m_cameraPitch = 85.0f;
        }

        if (m_cameraPitch < -85.0f)
        {
            m_cameraPitch = -85.0f;
        }
    }

    /*
        ==============================
        ANGLES
        ==============================
    */

    float yawRadians =
        m_cameraYaw *
        DEG2RAD;

    float pitchRadians =
        m_cameraPitch *
        DEG2RAD;

    /*
        ==============================
        FIRST PERSON
        ==============================
    */

    if (m_cameraDistance <= 0.5f)
    {
        /*
            Camera forward direction.
        */

        float lookX =
            -sinf(yawRadians) *
            cosf(pitchRadians);

        float lookY =
            sinf(pitchRadians);

        float lookZ =
            -cosf(yawRadians) *
            cosf(pitchRadians);

        /*
            Camera eye position.
        */

        m_camera.position = {
            playerPosition.x,
            playerPosition.y + 1.6f,
            playerPosition.z
        };

        /*
            Camera looks toward the
            calculated direction.
        */

        m_camera.target = {
            playerPosition.x + lookX,
            playerPosition.y + 1.6f + lookY,
            playerPosition.z + lookZ
        };

        return;
    }

    /*
        ==============================
        THIRD PERSON
        ==============================
    */

    float horizontalDistance =
        m_cameraDistance *
        cosf(pitchRadians);

    float verticalDistance =
        m_cameraDistance *
        sinf(pitchRadians);

    /*
        Camera sits behind the player.

        At yaw 0:

            PLAYER
              |
              |
              v
             -Z

            CAMERA
              |
              |
              v
             +Z
    */

    float cameraX =
        playerPosition.x +
        sinf(yawRadians) *
        horizontalDistance;

    float cameraZ =
        playerPosition.z +
        cosf(yawRadians) *
        horizontalDistance;

    float cameraY =
        playerPosition.y +
        1.0f +
        verticalDistance;

    m_camera.position = {
        cameraX,
        cameraY,
        cameraZ
    };

    /*
        Look toward the player's
        upper body.
    */

    m_camera.target = {
        playerPosition.x,
        playerPosition.y + 1.1f,
        playerPosition.z
    };
}

bool BlockWorldEngine::IsFirstPerson() const
{
    return m_cameraDistance <= 0.5f;
}

float BlockWorldEngine::GetCameraYaw() const
{
    return m_cameraYaw;
}

Camera3D& BlockWorldEngine::GetCamera()
{
    return m_camera;
}

bool BlockWorldEngine::IsRunning() const
{
    return m_running;
}

void BlockWorldEngine::Shutdown()
{
    if (IsWindowReady())
    {
        CloseWindow();
    }

    m_running = false;

    m_lookMode = false;
}