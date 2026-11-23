#include "Engine.h"
#include "Game01.h"
#include "BlockWorldAPI.h"

#include "raylib.h"
#include "raymath.h"
#include "rlgl.h"

#include <cmath>

// ============================================================
// SKYBOX
// ============================================================

static Model g_skyboxModel = {};
static Shader g_skyboxShader = {};
static bool g_skyboxLoaded = false;

static const char* SKYBOX_VERTEX_SHADER = R"(
#version 330

in vec3 vertexPosition;

uniform mat4 mvp;

out vec3 fragDirection;

void main()
{
    fragDirection = vertexPosition;
    gl_Position = mvp * vec4(vertexPosition, 1.0);
}
)";

static const char* SKYBOX_FRAGMENT_SHADER = R"(
#version 330

in vec3 fragDirection;

out vec4 finalColor;

float hash3(vec3 p)
{
    p = fract(p * 0.3183099 + vec3(0.1));
    p *= 17.0;

    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float solariaNoise3D(vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash3(i + vec3(0, 0, 0));
    float n100 = hash3(i + vec3(1, 0, 0));
    float n010 = hash3(i + vec3(0, 1, 0));
    float n110 = hash3(i + vec3(1, 1, 0));

    float n001 = hash3(i + vec3(0, 0, 1));
    float n101 = hash3(i + vec3(1, 0, 1));
    float n011 = hash3(i + vec3(0, 1, 1));
    float n111 = hash3(i + vec3(1, 1, 1));

    float x00 = mix(n000, n100, f.x);
    float x10 = mix(n010, n110, f.x);
    float x01 = mix(n001, n101, f.x);
    float x11 = mix(n011, n111, f.x);

    float y0 = mix(x00, x10, f.y);
    float y1 = mix(x01, x11, f.y);

    return mix(y0, y1, f.z);
}

float solariaCloudNoise(vec3 p)
{
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++)
    {
        value += solariaNoise3D(p) * amplitude;
        p *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

void main()
{
    vec3 direction = normalize(fragDirection);

    float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);

    vec3 horizonColor = vec3(0.78, 0.88, 0.98);
    vec3 zenithColor = vec3(0.12, 0.42, 0.82);

    vec3 sky = mix(
        horizonColor,
        zenithColor,
        smoothstep(0.15, 0.95, height)
    );

    float cloudNoise = solariaCloudNoise(direction * 22.0);

    float cloudMask = smoothstep(
        0.52,
        0.72,
        cloudNoise
    );

    cloudMask *= smoothstep(
        -0.20,
        0.15,
        direction.y
    );

    sky = mix(
        sky,
        vec3(0.96, 0.98, 1.0),
        cloudMask * 0.85
    );

    vec3 sunDirection = normalize(
        vec3(-0.4, 0.55, -0.7)
    );

    float sunGlow = max(
        dot(direction, sunDirection),
        0.0
    );

    sunGlow = pow(sunGlow, 32.0);

    sky += vec3(0.18, 0.15, 0.08) * sunGlow;

    finalColor = vec4(sky, 1.0);
}
)";

// ============================================================
// CAMERA SETTINGS
// ============================================================

namespace CameraSettings
{
    constexpr float FIELD_OF_VIEW = 65.0f;

    constexpr float MIN_DISTANCE = 0.0f;
    constexpr float MAX_DISTANCE = 20.0f;

    constexpr float FIRST_PERSON_DISTANCE = 0.5f;

    constexpr float MOUSE_SENSITIVITY = 0.25f;

    constexpr float MIN_PITCH = -85.0f;
    constexpr float MAX_PITCH = 85.0f;

    constexpr float PLAYER_EYE_HEIGHT = 1.6f;
    constexpr float CAMERA_TARGET_HEIGHT = 1.1f;
}

// ============================================================
// SKYBOX INITIALIZATION
// ============================================================

static void InitializeSkybox()
{
    if (g_skyboxLoaded)
    {
        return;
    }

    g_skyboxShader = LoadShaderFromMemory(
        SKYBOX_VERTEX_SHADER,
        SKYBOX_FRAGMENT_SHADER
    );

    if (g_skyboxShader.id == 0)
    {
        TraceLog(
            LOG_ERROR,
            "Solaria skybox shader failed to load."
        );

        return;
    }

    g_skyboxModel = LoadModelFromMesh(
        GenMeshCube(1.0f, 1.0f, 1.0f)
    );

    if (
        g_skyboxModel.meshCount <= 0 ||
        g_skyboxModel.materialCount <= 0
    )
    {
        TraceLog(
            LOG_ERROR,
            "Solaria skybox model failed to load."
        );

        if (g_skyboxModel.meshCount > 0)
        {
            UnloadModel(g_skyboxModel);
        }

        UnloadShader(g_skyboxShader);

        g_skyboxModel = {};
        g_skyboxShader = {};

        return;
    }

    g_skyboxModel.materials[0].shader = g_skyboxShader;

    g_skyboxLoaded = true;

    TraceLog(
        LOG_INFO,
        "Solaria procedural skybox loaded."
    );
}

// ============================================================
// SKYBOX RENDER
// ============================================================

static void RenderSkybox(Camera3D& camera)
{
    if (!g_skyboxLoaded)
    {
        return;
    }

    BeginMode3D(camera);

    rlDisableBackfaceCulling();
    rlDisableDepthTest();

    DrawModel(
        g_skyboxModel,
        camera.position,
        500.0f,
        WHITE
    );

    rlEnableDepthTest();
    rlEnableBackfaceCulling();

    EndMode3D();
}

// ============================================================
// ENGINE
// ============================================================

BlockWorldEngine::BlockWorldEngine()
    : m_width(1280),
      m_height(720),
      m_running(false),
      m_cameraYaw(0.0f),
      m_cameraPitch(20.0f),
      m_cameraDistance(8.0f),
      m_lookMode(false),
      m_shiftLockEnabled(false),
      m_menuOpen(false)
{
    m_camera = {};
}

BlockWorldEngine::~BlockWorldEngine()
{
    Shutdown();
}

// ============================================================
// INITIALIZE
// ============================================================

bool BlockWorldEngine::Initialize(
    int width,
    int height,
    const char* title
)
{
    m_width = width;
    m_height = height;

    // Start as a normal, maximized, resizable desktop window. F11 toggles true fullscreen.
    SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_WINDOW_MAXIMIZED);
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
    SetWindowMinSize(960, 600);

    // Escape is handled by Solaria's pause menu, not by raylib.
    SetExitKey(KEY_NULL);

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

    m_camera.fovy = CameraSettings::FIELD_OF_VIEW;
    m_camera.projection = CAMERA_PERSPECTIVE;

    m_cameraYaw = 0.0f;
    m_cameraPitch = 20.0f;
    m_cameraDistance = 8.0f;

    m_lookMode = false;
    m_shiftLockEnabled = false;
    m_menuOpen = false;
    m_running = true;

    EnableCursor();

    InitializeSkybox();

    return true;
}

// ============================================================
// BEGIN FRAME
// ============================================================

bool BlockWorldEngine::BeginFrame()
{
    static bool firstFrameLogged = false;

    if (!m_running)
    {
        TraceLog(LOG_WARNING, "DIAGNOSTIC: BeginFrame stopped because m_running is FALSE.");
        return false;
    }

    // F11 switches between the maximized desktop window and actual fullscreen.
    if (IsKeyPressed(KEY_F11))
    {
        ToggleFullscreen();
    }

    if (!firstFrameLogged)
    {
        TraceLog(LOG_INFO, "DIAGNOSTIC: BeginFrame reached. Window ready: %s",
            IsWindowReady() ? "YES" : "NO");

        firstFrameLogged = true;
    }

    if (WindowShouldClose())
    {
        TraceLog(LOG_WARNING, "DIAGNOSTIC: WindowShouldClose returned TRUE.");
        TraceLog(LOG_WARNING, "DIAGNOSTIC: Engine main loop is stopping.");

        m_running = false;
        return false;
    }

    BeginDrawing();

    ClearBackground(SKYBLUE);

    RenderSkybox(m_camera);

    return true;
}

// ============================================================
// END FRAME
// ============================================================

void BlockWorldEngine::EndFrame()
{
    if (!m_running)
    {
        return;
    }

    EndDrawing();
}

// ============================================================
// CAMERA UPDATE
// ============================================================

void BlockWorldEngine::UpdatePlayerCamera(
    Vector3 playerPosition
)
{
    if (!m_running)
    {
        return;
    }

    // Keep the field of view consistent.
    m_camera.fovy = CameraSettings::FIELD_OF_VIEW;

    // --------------------------------------------------------
    // ZOOM
    // --------------------------------------------------------

    const float wheel = GetMouseWheelMove();

    if (wheel != 0.0f)
    {
        m_cameraDistance -= wheel * 1.0f;

        if (m_cameraDistance < CameraSettings::MIN_DISTANCE)
        {
            m_cameraDistance = CameraSettings::MIN_DISTANCE;
        }

        if (m_cameraDistance > CameraSettings::MAX_DISTANCE)
        {
            m_cameraDistance = CameraSettings::MAX_DISTANCE;
        }
    }

    // --------------------------------------------------------
    // RIGHT MOUSE LOOK AND SHIFT LOCK

    const bool shouldLook =
        !m_menuOpen &&
        (m_shiftLockEnabled || IsMouseButtonDown(MOUSE_BUTTON_RIGHT));

    if (shouldLook && !m_lookMode)
    {
        m_lookMode = true;
        DisableCursor();
    }
    else if (!shouldLook && m_lookMode)
    {
        m_lookMode = false;
        EnableCursor();
    }
    // MOUSE ROTATION
    // --------------------------------------------------------

    if (m_lookMode)
    {
        const Vector2 mouseDelta = GetMouseDelta();

        m_cameraYaw -=
            mouseDelta.x * CameraSettings::MOUSE_SENSITIVITY;

        m_cameraPitch +=
            mouseDelta.y * CameraSettings::MOUSE_SENSITIVITY;

        m_cameraPitch = Clamp(
            m_cameraPitch,
            CameraSettings::MIN_PITCH,
            CameraSettings::MAX_PITCH
        );
    }

    const float yawRadians =
        m_cameraYaw * DEG2RAD;

    const float pitchRadians =
        m_cameraPitch * DEG2RAD;

    // --------------------------------------------------------
    // ONE CONSISTENT LOOK DIRECTION
    // --------------------------------------------------------

    const float lookX =
        -sinf(yawRadians) * cosf(pitchRadians);

    const float lookY =
        -sinf(pitchRadians);

    const float lookZ =
        -cosf(yawRadians) * cosf(pitchRadians);

    const Vector3 targetPosition = {
        playerPosition.x,
        playerPosition.y + CameraSettings::CAMERA_TARGET_HEIGHT,
        playerPosition.z
    };

    // --------------------------------------------------------
    // FIRST PERSON
    // --------------------------------------------------------

    if (m_cameraDistance <= CameraSettings::FIRST_PERSON_DISTANCE)
    {
        m_camera.position = {
            playerPosition.x,
            playerPosition.y + CameraSettings::PLAYER_EYE_HEIGHT,
            playerPosition.z
        };

        m_camera.target = {
            m_camera.position.x + lookX,
            m_camera.position.y + lookY,
            m_camera.position.z + lookZ
        };

        return;
    }

    // --------------------------------------------------------
    // THIRD PERSON
    // --------------------------------------------------------

    const float horizontalDistance =
        m_cameraDistance * cosf(pitchRadians);

    const float verticalDistance =
        m_cameraDistance * sinf(pitchRadians);

    m_camera.position = {
        targetPosition.x - lookX * m_cameraDistance,
        targetPosition.y - lookY * m_cameraDistance,
        targetPosition.z - lookZ * m_cameraDistance
    };

    m_camera.target = targetPosition;

    m_camera.up = {
        0.0f,
        1.0f,
        0.0f
    };
}

// ============================================================
// CAMERA GETTERS
// ============================================================

void BlockWorldEngine::SetShiftLockEnabled(bool enabled)
{
    // Remember the player's Shift Lock preference.
    m_shiftLockEnabled = enabled;
}

void BlockWorldEngine::SetMenuOpen(bool open)
{
    // Menus release the mouse but preserve the Shift Lock preference.
    m_menuOpen = open;

    if (open && m_lookMode)
    {
        m_lookMode = false;
        EnableCursor();
    }
}

bool BlockWorldEngine::IsShiftLockEnabled() const
{
    return m_shiftLockEnabled;
}
bool BlockWorldEngine::IsFirstPerson() const
{
    return m_cameraDistance <= CameraSettings::FIRST_PERSON_DISTANCE;
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

// ============================================================
// SHUTDOWN
// ============================================================

void BlockWorldEngine::Shutdown()
{
    if (g_skyboxLoaded)
    {
        UnloadModel(g_skyboxModel);
        UnloadShader(g_skyboxShader);

        g_skyboxModel = {};
        g_skyboxShader = {};

        g_skyboxLoaded = false;
    }

    if (IsWindowReady())
    {
        CloseWindow();
    }

    m_running = false;
    m_lookMode = false;
}






