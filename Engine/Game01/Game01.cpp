#include "Engine.h"
#include "Game01.h"

#include "raylib.h"
#include "raymath.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

/*
    ============================================================
    SOLARIA - GAME 01
    Roblox JSON animation importer
    raylib 6.0 skeletal animation
    ============================================================
*/

// ============================================================
// AVATAR
// ============================================================

static Model g_avatarModel = {};
static bool g_avatarModelLoaded = false;

static float g_avatarScale = 1.0f;
static Vector3 g_avatarOffset = { 0.0f, 0.0f, 0.0f };

// Mesh order from the inspected Solaria GLTF:
// 0 Head, 1 RightArm, 2 LeftLeg, 3 LeftArm, 4 RightLeg, 5 Torso.
static Color g_avatarPartColors[6] = {
    { 255, 214, 160, 255 },
    { 255, 214, 160, 255 },
    { 34, 34, 34, 255 },
    { 255, 214, 160, 255 },
    { 34, 34, 34, 255 },
    { 51, 102, 255, 255 }
};

static void ApplyAvatarPartColors()
{
    if (!g_avatarModelLoaded || !g_avatarModel.meshes) {
        return;
    }

    const int count = g_avatarModel.meshCount < 6 ? g_avatarModel.meshCount : 6;

    for (int meshIndex = 0; meshIndex < count; ++meshIndex) {
        Mesh& mesh = g_avatarModel.meshes[meshIndex];

        if (mesh.vertexCount <= 0) {
            continue;
        }

        if (!mesh.colors) {
            mesh.colors = static_cast<unsigned char*>(
                MemAlloc(static_cast<unsigned int>(mesh.vertexCount) * sizeof(Color))
            );
        }

        if (!mesh.colors) {
            TraceLog(LOG_WARNING, "Could not allocate avatar vertex colors for mesh %i.", meshIndex);
            continue;
        }

        Color* vertexColors = reinterpret_cast<Color*>(mesh.colors);

        for (int vertex = 0; vertex < mesh.vertexCount; ++vertex) {
            vertexColors[vertex] = g_avatarPartColors[meshIndex];
        }

        // LoadModel() already uploaded this mesh.
        // Do not upload it again after changing vertex colors.
    }
}


// ============================================================
// GAME SETTINGS
// ============================================================

namespace GameSettings
{
    constexpr float BASEPLATE_WIDTH = 50.0f;
    constexpr float BASEPLATE_DEPTH = 50.0f;
    constexpr float BASEPLATE_HEIGHT = 25.0f;

    constexpr float BASEPLATE_TOP = 1.0f;

    constexpr float BASEPLATE_CENTER_Y =
        BASEPLATE_TOP - BASEPLATE_HEIGHT / 2.0f;

    constexpr float PLAYER_SPEED = 6.0f;
    constexpr float PLAYER_GROUND_Y = BASEPLATE_TOP;
    constexpr float PLAYER_EDGE_MARGIN = 0.35f;

    constexpr float RESPAWN_Y = -35.0f;

    constexpr float JUMP_POWER = 8.0f;
    constexpr float GRAVITY = 20.0f;

    constexpr float WALK_SPEED = 9.0f;
    constexpr float WALK_BLEND_SPEED = 8.0f;

    constexpr float TARGET_AVATAR_HEIGHT = 2.0f;
    constexpr float AVATAR_ROTATION_OFFSET = 0.0f;

    constexpr float MAX_DELTA_TIME = 0.05f;
    constexpr float MOVEMENT_EPSILON = 0.001f;

    constexpr float ANIMATION_FADE_SPEED = 7.0f;
}


// ============================================================
// ANIMATION DATA
// ============================================================

enum AnimationType
{
    ANIM_IDLE = 0,
    ANIM_WALK,
    ANIM_JUMP,
    ANIM_FALL,
    ANIM_COUNT
};

struct AnimationClip
{
    ModelAnimation animation = {};
    float duration = 0.0f;
    bool looping = true;
    bool loaded = false;
};

static AnimationClip g_animations[ANIM_COUNT];


// ============================================================
// SMALL JSON PARSER
// No external JSON package required.
// ============================================================

struct JsonValue
{
    enum Type
    {
        NONE,
        OBJECT,
        ARRAY,
        STRING,
        NUMBER,
        BOOLEAN,
        NULL_VALUE
    };

    Type type = NONE;

    std::string stringValue;
    double numberValue = 0.0;
    bool boolValue = false;

    std::vector<std::pair<std::string, JsonValue>> object;
    std::vector<JsonValue> array;

    const JsonValue* Get(const char* name) const
    {
        for (const auto& item : object)
        {
            if (item.first == name)
            {
                return &item.second;
            }
        }

        return nullptr;
    }

    double Number(double fallback = 0.0) const
    {
        return type == NUMBER ? numberValue : fallback;
    }

    const std::string& String() const
    {
        return stringValue;
    }
};


class JsonParser
{
public:
    explicit JsonParser(const std::string& source)
        : m_source(source), m_position(0)
    {
    }

    JsonValue Parse()
    {
        SkipWhitespace();
        return ParseValue();
    }

private:
    const std::string& m_source;
    size_t m_position;

    void SkipWhitespace()
    {
        while (m_position < m_source.size())
        {
            char c = m_source[m_position];

            if (c != ' ' && c != '\n' && c != '\r' && c != '\t')
            {
                break;
            }

            ++m_position;
        }
    }

    char Peek() const
    {
        if (m_position >= m_source.size())
        {
            return '\0';
        }

        return m_source[m_position];
    }

    char Next()
    {
        if (m_position >= m_source.size())
        {
            return '\0';
        }

        return m_source[m_position++];
    }

    bool Consume(char expected)
    {
        SkipWhitespace();

        if (Peek() != expected)
        {
            return false;
        }

        ++m_position;
        return true;
    }

    std::string ParseString()
    {
        std::string result;

        if (!Consume('"'))
        {
            return result;
        }

        while (m_position < m_source.size())
        {
            char c = Next();

            if (c == '"')
            {
                break;
            }

            if (c == '\\')
            {
                char escaped = Next();

                switch (escaped)
                {
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    case '/': result += '/'; break;
                    case 'b': result += '\b'; break;
                    case 'f': result += '\f'; break;
                    case 'n': result += '\n'; break;
                    case 'r': result += '\r'; break;
                    case 't': result += '\t'; break;

                    case 'u':
                    {
                        // Bone names in these animation files are ASCII.
                        for (int i = 0; i < 4 && m_position < m_source.size(); ++i)
                        {
                            Next();
                        }

                        result += '?';
                        break;
                    }

                    default:
                        result += escaped;
                        break;
                }
            }
            else
            {
                result += c;
            }
        }

        return result;
    }

    JsonValue ParseValue()
    {
        SkipWhitespace();

        JsonValue value;
        char c = Peek();

        if (c == '{')
        {
            value.type = JsonValue::OBJECT;
            Next();

            SkipWhitespace();

            while (Peek() != '}' && Peek() != '\0')
            {
                SkipWhitespace();

                std::string key = ParseString();

                if (!Consume(':'))
                {
                    break;
                }

                JsonValue child = ParseValue();
                value.object.push_back({ key, child });

                SkipWhitespace();

                if (!Consume(','))
                {
                    break;
                }
            }

            Consume('}');
            return value;
        }

        if (c == '[')
        {
            value.type = JsonValue::ARRAY;
            Next();

            SkipWhitespace();

            while (Peek() != ']' && Peek() != '\0')
            {
                value.array.push_back(ParseValue());

                SkipWhitespace();

                if (!Consume(','))
                {
                    break;
                }
            }

            Consume(']');
            return value;
        }

        if (c == '"')
        {
            value.type = JsonValue::STRING;
            value.stringValue = ParseString();
            return value;
        }

        if (c == 't' || c == 'f')
        {
            value.type = JsonValue::BOOLEAN;

            if (m_source.compare(m_position, 4, "true") == 0)
            {
                value.boolValue = true;
                m_position += 4;
            }
            else
            {
                value.boolValue = false;
                m_position += 5;
            }

            return value;
        }

        if (c == 'n')
        {
            value.type = JsonValue::NULL_VALUE;
            m_position += 4;
            return value;
        }

        value.type = JsonValue::NUMBER;

        const char* start = m_source.c_str() + m_position;
        char* end = nullptr;

        value.numberValue = std::strtod(start, &end);

        if (end == start)
        {
            value.type = JsonValue::NONE;
            if (m_position < m_source.size())
            {
                ++m_position;
            }
        }
        else
        {
            m_position += static_cast<size_t>(end - start);
        }

        return value;
    }
};


// ============================================================
// GENERAL HELPERS
// ============================================================

static float GetClampedDeltaTime()
{
    float deltaTime = GetFrameTime();

    if (deltaTime > GameSettings::MAX_DELTA_TIME)
    {
        deltaTime = GameSettings::MAX_DELTA_TIME;
    }

    return deltaTime;
}


static bool IsPlayerAboveBaseplate(float x, float z)
{
    const float halfWidth = GameSettings::BASEPLATE_WIDTH / 2.0f;
    const float halfDepth = GameSettings::BASEPLATE_DEPTH / 2.0f;

    return
        std::fabs(x) <= halfWidth - GameSettings::PLAYER_EDGE_MARGIN &&
        std::fabs(z) <= halfDepth - GameSettings::PLAYER_EDGE_MARGIN;
}


static float Clamp01(float value)
{
    return value < 0.0f ? 0.0f : (value > 1.0f ? 1.0f : value);
}


// ============================================================
// QUATERNION CONVERSION
// Roblox CFrame stores a 3x3 rotation matrix.
// ============================================================

static Quaternion QuaternionFromCFrame(const float* m)
{
    // CFrame order:
    // position xyz, then rotation matrix:
    // R00 R01 R02
    // R10 R11 R12
    // R20 R21 R22

    const float r00 = m[3];
    const float r01 = m[4];
    const float r02 = m[5];

    const float r10 = m[6];
    const float r11 = m[7];
    const float r12 = m[8];

    const float r20 = m[9];
    const float r21 = m[10];
    const float r22 = m[11];

    Quaternion q = { 0.0f, 0.0f, 0.0f, 1.0f };

    const float trace = r00 + r11 + r22;

    if (trace > 0.0f)
    {
        const float s = std::sqrt(trace + 1.0f) * 2.0f;

        q.w = 0.25f * s;
        q.x = (r21 - r12) / s;
        q.y = (r02 - r20) / s;
        q.z = (r10 - r01) / s;
    }
    else if (r00 > r11 && r00 > r22)
    {
        const float s = std::sqrt(1.0f + r00 - r11 - r22) * 2.0f;

        q.w = (r21 - r12) / s;
        q.x = 0.25f * s;
        q.y = (r01 + r10) / s;
        q.z = (r02 + r20) / s;
    }
    else if (r11 > r22)
    {
        const float s = std::sqrt(1.0f + r11 - r00 - r22) * 2.0f;

        q.w = (r02 - r20) / s;
        q.x = (r01 + r10) / s;
        q.y = 0.25f * s;
        q.z = (r12 + r21) / s;
    }
    else
    {
        const float s = std::sqrt(1.0f + r22 - r00 - r11) * 2.0f;

        q.w = (r10 - r01) / s;
        q.x = (r02 + r20) / s;
        q.y = (r12 + r21) / s;
        q.z = 0.25f * s;
    }

    return QuaternionNormalize(q);
}


// ============================================================
// POSE IMPORT
// ============================================================

static int FindBoneIndex(const std::string& name)
{
    if (!g_avatarModelLoaded)
    {
        return -1;
    }

    for (unsigned int i = 0; i < g_avatarModel.skeleton.boneCount; ++i)
    {
        if (name == g_avatarModel.skeleton.bones[i].name)
        {
            return static_cast<int>(i);
        }
    }

    return -1;
}


static void ApplyPoseTree(
    const JsonValue& pose,
    Transform* outputPose,
    bool* boneWasSet)
{
    const JsonValue* nameValue = pose.Get("Name");
    const JsonValue* weightValue = pose.Get("Weight");
    const JsonValue* cframeValue = pose.Get("CFrame");

    if (nameValue && weightValue && cframeValue)
    {
        const std::string& name = nameValue->String();
        const float weight = static_cast<float>(weightValue->Number());

        if (
            weight > 0.0f &&
            cframeValue->type == JsonValue::ARRAY &&
            cframeValue->array.size() >= 12
        )
        {
            const int boneIndex = FindBoneIndex(name);

            if (boneIndex >= 0)
            {
                float cframe[12];

                for (int i = 0; i < 12; ++i)
                {
                    cframe[i] = static_cast<float>(
                        cframeValue->array[i].Number()
                    );
                }

                const Transform& bind =
                    g_avatarModel.skeleton.bindPose[boneIndex];

                Transform result = bind;

                Vector3 poseTranslation = {
                    cframe[0],
                    cframe[1],
                    cframe[2]
                };

                Quaternion poseRotation =
                    QuaternionFromCFrame(cframe);

                // Roblox pose transforms are applied relative to the
                // GLTF bone's original local bind transform.
                result.translation = Vector3Add(
                    bind.translation,
                    Vector3Scale(poseTranslation, weight)
                );

                Quaternion weightedRotation =
                    QuaternionSlerp(
                        QuaternionIdentity(),
                        poseRotation,
                        Clamp01(weight)
                    );

                result.rotation = QuaternionNormalize(
                    QuaternionMultiply(bind.rotation, weightedRotation)
                );

                outputPose[boneIndex] = result;
                boneWasSet[boneIndex] = true;
            }
        }
    }

    const JsonValue* children = pose.Get("Children");

    if (children && children->type == JsonValue::ARRAY)
    {
        for (const JsonValue& child : children->array)
        {
            ApplyPoseTree(child, outputPose, boneWasSet);
        }
    }
}


// ============================================================
// ANIMATION CLIP LOADING
// ============================================================

static bool LoadAnimationClip(
    AnimationType type,
    const char* fileName,
    const char* animationName,
    bool looping)
{
    if (!g_avatarModelLoaded)
    {
        return false;
    }

    const std::string path =
        std::string("../../Assets/Avatars/Default/Animations/") +
        fileName;

    std::ifstream file(path);

    if (!file.is_open())
    {
        TraceLog(LOG_ERROR, "Could not open animation: %s", path.c_str());
        return false;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();

    const std::string jsonText = buffer.str();
    JsonParser parser(jsonText);
    JsonValue root = parser.Parse();

    const JsonValue* keyframesValue = root.Get("Keyframes");

    if (!keyframesValue || keyframesValue->type != JsonValue::ARRAY)
    {
        TraceLog(LOG_ERROR, "Invalid animation JSON: %s", path.c_str());
        return false;
    }

    struct ParsedFrame
    {
        float time;
        const JsonValue* poses;
    };

    std::vector<ParsedFrame> frames;

    for (const JsonValue& keyframe : keyframesValue->array)
    {
        const JsonValue* timeValue = keyframe.Get("Time");
        const JsonValue* posesValue = keyframe.Get("Poses");

        if (!timeValue || !posesValue)
        {
            continue;
        }

        frames.push_back({
            static_cast<float>(timeValue->Number()),
            posesValue
        });
    }

    if (frames.empty())
    {
        TraceLog(LOG_ERROR, "Animation has no keyframes: %s", path.c_str());
        return false;
    }

    std::sort(
        frames.begin(),
        frames.end(),
        [](const ParsedFrame& a, const ParsedFrame& b)
        {
            return a.time < b.time;
        }
    );

    AnimationClip& clip = g_animations[type];

    clip.animation = {};
    clip.animation.boneCount = g_avatarModel.skeleton.boneCount;
    clip.animation.keyframeCount = static_cast<int>(frames.size());
    clip.looping = looping;

    std::strncpy(
        clip.animation.name,
        animationName,
        sizeof(clip.animation.name) - 1
    );

    const unsigned int boneCount =
        g_avatarModel.skeleton.boneCount;

    clip.animation.keyframePoses =
        static_cast<ModelAnimPose*>(
            MemAlloc(sizeof(ModelAnimPose) * frames.size())
        );

    if (!clip.animation.keyframePoses)
    {
        return false;
    }

    for (size_t frameIndex = 0; frameIndex < frames.size(); ++frameIndex)
    {
        Transform* framePose =
            static_cast<Transform*>(
                MemAlloc(sizeof(Transform) * boneCount)
            );

        bool* boneWasSet =
            new bool[boneCount];

        if (!framePose || !boneWasSet)
        {
            if (framePose)
            {
                MemFree(framePose);
            }

            delete[] boneWasSet;
            return false;
        }

        for (unsigned int bone = 0; bone < boneCount; ++bone)
        {
            framePose[bone] =
                g_avatarModel.skeleton.bindPose[bone];

            boneWasSet[bone] = false;
        }

        const JsonValue* poses = frames[frameIndex].poses;

        if (poses->type == JsonValue::ARRAY)
        {
            for (const JsonValue& pose : poses->array)
            {
                ApplyPoseTree(pose, framePose, boneWasSet);
            }
        }

        delete[] boneWasSet;

        clip.animation.keyframePoses[frameIndex] = framePose;
    }

    clip.duration = frames.back().time - frames.front().time;

    if (clip.duration <= 0.0f)
    {
        clip.duration = 0.01f;
    }

    clip.loaded = true;

    TraceLog(
        LOG_INFO,
        "Loaded animation '%s': %i frames, %.3f seconds",
        animationName,
        clip.animation.keyframeCount,
        clip.duration
    );

    return true;
}


// ============================================================
// ANIMATION CLEANUP
// ============================================================

static void UnloadAnimationClips()
{
    for (int i = 0; i < ANIM_COUNT; ++i)
    {
        AnimationClip& clip = g_animations[i];

        if (!clip.loaded)
        {
            continue;
        }

        for (int frame = 0; frame < clip.animation.keyframeCount; ++frame)
        {
            if (clip.animation.keyframePoses[frame])
            {
                MemFree(clip.animation.keyframePoses[frame]);
            }
        }

        MemFree(clip.animation.keyframePoses);

        clip = {};
    }
}


// ============================================================
// ANIMATION PLAYBACK
// ============================================================

static float GetAnimationFrame(
    const AnimationClip& clip,
    float time)
{
    if (!clip.loaded || clip.animation.keyframeCount <= 1)
    {
        return 0.0f;
    }

    const int frameCount = clip.animation.keyframeCount;

    float localTime = time;

    if (clip.looping)
    {
        localTime = std::fmod(localTime, clip.duration);

        if (localTime < 0.0f)
        {
            localTime += clip.duration;
        }
    }
    else
    {
        if (localTime > clip.duration)
        {
            localTime = clip.duration;
        }

        if (localTime < 0.0f)
        {
            localTime = 0.0f;
        }
    }

    const float framePosition =
        (localTime / clip.duration) * (frameCount - 1);

    return Clamp(framePosition, 0.0f, static_cast<float>(frameCount - 1));
}


static void UpdateAvatarAnimation(
    int currentAnimation,
    int previousAnimation,
    float currentTime,
    float previousTime,
    float blend)
{
    if (!g_avatarModelLoaded)
    {
        return;
    }

    if (
        currentAnimation < 0 ||
        currentAnimation >= ANIM_COUNT ||
        !g_animations[currentAnimation].loaded
    )
    {
        return;
    }

    AnimationClip& current = g_animations[currentAnimation];

    const int currentFrame = static_cast<int>(
        GetAnimationFrame(current, currentTime)
    );

    if (
        previousAnimation >= 0 &&
        previousAnimation < ANIM_COUNT &&
        previousAnimation != currentAnimation &&
        g_animations[previousAnimation].loaded &&
        blend < 1.0f
    )
    {
        AnimationClip& previous = g_animations[previousAnimation];

        const int previousFrame = static_cast<int>(
            GetAnimationFrame(previous, previousTime)
        );

        UpdateModelAnimationEx(
            g_avatarModel,
            previous.animation,
            previousFrame,
            current.animation,
            currentFrame,
            Clamp01(blend)
        );
    }
    else
    {
        UpdateModelAnimation(
            g_avatarModel,
            current.animation,
            currentFrame
        );
    }
}


// ============================================================
// AVATAR LOADING
// ============================================================

static void LoadSolariaAvatar()
{
    if (g_avatarModelLoaded)
    {
        return;
    }

    const char* avatarPath =
        "../../Assets/Avatars/Default/scene.gltf";

    TraceLog(LOG_INFO, "Loading Solaria rig: %s", avatarPath);

    g_avatarModel = LoadModel(avatarPath);

    if (g_avatarModel.meshCount <= 0)
    {
        TraceLog(
            LOG_ERROR,
            "Could not load the Solaria avatar. Check scene.gltf, scene.bin, and textures."
        );

        g_avatarModel = {};
        return;
    }

    g_avatarModelLoaded = true;

    ApplyAvatarPartColors();

    TraceLog(
        LOG_INFO,
        "Avatar skeleton bone count: %i",
        static_cast<int>(g_avatarModel.skeleton.boneCount)
    );

    for (unsigned int i = 0; i < g_avatarModel.skeleton.boneCount; ++i)
    {
        TraceLog(
            LOG_INFO,
            "Bone %i: %s | Parent: %i",
            static_cast<int>(i),
            g_avatarModel.skeleton.bones[i].name,
            g_avatarModel.skeleton.bones[i].parent
        );
    }

    BoundingBox bounds = GetModelBoundingBox(g_avatarModel);

    float modelHeight = bounds.max.y - bounds.min.y;

    if (modelHeight > 0.001f)
    {
        g_avatarScale =
            GameSettings::TARGET_AVATAR_HEIGHT / modelHeight;
    }
    else
    {
        g_avatarScale = 1.0f;
    }

    g_avatarOffset = {
        -(bounds.min.x + bounds.max.x) * 0.5f,
        -bounds.min.y,
        -(bounds.min.z + bounds.max.z) * 0.5f
    };

    TraceLog(
        LOG_INFO,
        "Solaria rig loaded. Meshes: %i, scale: %.4f",
        g_avatarModel.meshCount,
        g_avatarScale
    );

    // Load all four Roblox animation files.
    LoadAnimationClip(ANIM_IDLE, "idle.json", "Idle", true);
    LoadAnimationClip(ANIM_WALK, "walk.json", "Walk", true);
    LoadAnimationClip(ANIM_JUMP, "jump.json", "Jump", false);
    LoadAnimationClip(ANIM_FALL, "fall.json", "Fall", true);

    if (!g_animations[ANIM_IDLE].loaded)
    {
        TraceLog(LOG_WARNING, "Idle animation failed to load.");
    }
}


// ============================================================
// CONSTRUCTOR
// ============================================================

Game01::Game01()
    : m_initialized(false),
      m_movementEnabled(true),
      m_keyForward(KEY_W),
      m_keyBackward(KEY_S),
      m_keyLeft(KEY_A),
      m_keyRight(KEY_D),
      m_keyJump(KEY_SPACE),
      m_playerPosition({
          0.0f,
          GameSettings::PLAYER_GROUND_Y,
          0.0f
      }),
      m_playerVelocityY(0.0f),
      m_onGround(true),
      m_playerRotation(180.0f),
      m_walkTime(0.0f),
      m_walkAmount(0.0f),
      m_currentAnimation(ANIM_IDLE),
      m_previousAnimation(ANIM_IDLE),
      m_animationTime(0.0f),
      m_previousAnimationTime(0.0f),
      m_animationBlend(1.0f),
      m_animationDuration(0.0f)
{
}


// ============================================================
// INITIALIZE
// ============================================================

void Game01::Initialize()
{
    m_initialized = true;

    m_playerPosition = {
        0.0f,
        GameSettings::PLAYER_GROUND_Y,
        0.0f
    };

    m_playerVelocityY = 0.0f;
    m_onGround = true;

    m_playerRotation = 180.0f;

    m_walkTime = 0.0f;
    m_walkAmount = 0.0f;

    m_currentAnimation = ANIM_IDLE;
    m_previousAnimation = ANIM_IDLE;

    m_animationTime = 0.0f;
    m_previousAnimationTime = 0.0f;
    m_animationBlend = 1.0f;

    LoadSolariaAvatar();

    m_animationDuration =
        g_animations[ANIM_IDLE].duration;

    TraceLog(LOG_INFO, "Solaria world initialized.");
}


// ============================================================
// UPDATE
// ============================================================

void Game01::Update(float cameraYaw)
{
    if (!m_initialized || !m_movementEnabled)
    {
        return;
    }

    const float deltaTime = GetClampedDeltaTime();

    // Camera-relative movement.
    const float yawRadians = cameraYaw * DEG2RAD;

    const Vector2 forward = {
        -sinf(yawRadians),
        -cosf(yawRadians)
    };

    const Vector2 right = {
        cosf(yawRadians),
        -sinf(yawRadians)
    };

    Vector2 movement = { 0.0f, 0.0f };

    if (IsKeyDown(m_keyForward))
    {
        movement.x += forward.x;
        movement.y += forward.y;
    }

    if (IsKeyDown(m_keyBackward))
    {
        movement.x -= forward.x;
        movement.y -= forward.y;
    }

    if (IsKeyDown(m_keyLeft))
    {
        movement.x -= right.x;
        movement.y -= right.y;
    }

    if (IsKeyDown(m_keyRight))
    {
        movement.x += right.x;
        movement.y += right.y;
    }

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

        m_playerPosition.x +=
            movement.x * GameSettings::PLAYER_SPEED * deltaTime;

        m_playerPosition.z +=
            movement.y * GameSettings::PLAYER_SPEED * deltaTime;

        // Four-direction facing.
        if (std::fabs(movement.x) > std::fabs(movement.y))
        {
            m_playerRotation = movement.x > 0.0f ? 90.0f : 270.0f;
        }
        else
        {
            m_playerRotation = movement.y > 0.0f ? 0.0f : 180.0f;
        }

        m_walkTime += deltaTime * GameSettings::WALK_SPEED;

        m_walkAmount = Clamp(
            m_walkAmount + deltaTime * GameSettings::WALK_BLEND_SPEED,
            0.0f,
            1.0f
        );
    }
    else
    {
        m_walkAmount = Clamp(
            m_walkAmount - deltaTime * GameSettings::WALK_BLEND_SPEED,
            0.0f,
            1.0f
        );
    }

    // Jump.
    if (IsKeyPressed(m_keyJump) && m_onGround)
    {
        m_playerVelocityY = GameSettings::JUMP_POWER;
        m_onGround = false;
    }

    // Vertical physics and baseplate collision.
    const bool onBaseplate = IsPlayerAboveBaseplate(
        m_playerPosition.x,
        m_playerPosition.z
    );

    if (
        onBaseplate &&
        m_playerPosition.y <= GameSettings::PLAYER_GROUND_Y &&
        m_playerVelocityY <= 0.0f
    )
    {
        m_playerPosition.y = GameSettings::PLAYER_GROUND_Y;
        m_playerVelocityY = 0.0f;
        m_onGround = true;
    }
    else
    {
        m_onGround = false;

        m_playerVelocityY -=
            GameSettings::GRAVITY * deltaTime;

        m_playerPosition.y +=
            m_playerVelocityY * deltaTime;
    }

    // Respawn.
    if (m_playerPosition.y < GameSettings::RESPAWN_Y)
    {
        m_playerPosition = {
            0.0f,
            GameSettings::PLAYER_GROUND_Y,
            0.0f
        };

        m_playerVelocityY = 0.0f;
        m_onGround = true;

        m_playerRotation = 180.0f;

        m_walkTime = 0.0f;
        m_walkAmount = 0.0f;
    }

    // --------------------------------------------------------
    // CHOOSE ANIMATION
    // --------------------------------------------------------

    int desiredAnimation = ANIM_IDLE;

    if (m_onGround)
    {
        desiredAnimation = isMoving ? ANIM_WALK : ANIM_IDLE;
    }
    else if (m_playerVelocityY > 0.0f)
    {
        desiredAnimation = ANIM_JUMP;
    }
    else
    {
        desiredAnimation = ANIM_FALL;
    }

    // Change animation and begin a crossfade.
    if (
        desiredAnimation != m_currentAnimation &&
        g_animations[desiredAnimation].loaded
    )
    {
        m_previousAnimation = m_currentAnimation;
        m_previousAnimationTime = m_animationTime;

        m_currentAnimation = desiredAnimation;
        m_animationTime = 0.0f;

        m_animationBlend = 0.0f;
    }

    // Advance animation clocks.
    if (g_animations[m_currentAnimation].loaded)
    {
        float playbackSpeed = 1.0f;

        if (m_currentAnimation == ANIM_WALK)
        {
            // Walking animation follows the player's movement speed.
            playbackSpeed = Clamp(
                movementLength > 0.0f ? movementLength : 1.0f,
                0.5f,
                1.5f
            );
        }

        m_animationTime += deltaTime * playbackSpeed;

        if (
            g_animations[m_currentAnimation].looping &&
            g_animations[m_currentAnimation].duration > 0.0f
        )
        {
            if (m_animationTime >= g_animations[m_currentAnimation].duration)
            {
                m_animationTime = std::fmod(
                    m_animationTime,
                    g_animations[m_currentAnimation].duration
                );
            }
        }
        else if (
            m_animationTime >
            g_animations[m_currentAnimation].duration
        )
        {
            m_animationTime =
                g_animations[m_currentAnimation].duration;
        }
    }

    if (
        g_animations[m_previousAnimation].loaded &&
        m_previousAnimation != m_currentAnimation
    )
    {
        m_previousAnimationTime += deltaTime;

        if (
            g_animations[m_previousAnimation].looping &&
            g_animations[m_previousAnimation].duration > 0.0f
        )
        {
            m_previousAnimationTime = std::fmod(
                m_previousAnimationTime,
                g_animations[m_previousAnimation].duration
            );
        }
    }

    m_animationBlend = Clamp(
        m_animationBlend +
            deltaTime * GameSettings::ANIMATION_FADE_SPEED,
        0.0f,
        1.0f
    );

    // Apply the animated skeleton.
    UpdateAvatarAnimation(
        m_currentAnimation,
        m_previousAnimation,
        m_animationTime,
        m_previousAnimationTime,
        m_animationBlend
    );
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

    // Baseplate.
    DrawCubeV(
        {
            0.0f,
            GameSettings::BASEPLATE_CENTER_Y,
            0.0f
        },
        {
            GameSettings::BASEPLATE_WIDTH,
            GameSettings::BASEPLATE_HEIGHT,
            GameSettings::BASEPLATE_DEPTH
        },
        DARKGREEN
    );

    // Top surface.
    DrawPlane(
        {
            0.0f,
            GameSettings::BASEPLATE_TOP + 0.01f,
            0.0f
        },
        {
            GameSettings::BASEPLATE_WIDTH,
            GameSettings::BASEPLATE_DEPTH
        },
        GREEN
    );

    // Baseplate outline.
    DrawCubeWiresV(
        {
            0.0f,
            GameSettings::BASEPLATE_CENTER_Y,
            0.0f
        },
        {
            GameSettings::BASEPLATE_WIDTH,
            GameSettings::BASEPLATE_HEIGHT,
            GameSettings::BASEPLATE_DEPTH
        },
        DARKGRAY
    );

    // Animated rigged avatar.
    if (!firstPerson && g_avatarModelLoaded)
    {
        const float avatarRotation =
            m_playerRotation +
            GameSettings::AVATAR_ROTATION_OFFSET;

        Vector3 avatarPosition = {
            m_playerPosition.x +
                g_avatarOffset.x * g_avatarScale,

            m_playerPosition.y +
                g_avatarOffset.y * g_avatarScale,

            m_playerPosition.z +
                g_avatarOffset.z * g_avatarScale
        };

        DrawModelEx(
            g_avatarModel,
            avatarPosition,
            { 0.0f, 1.0f, 0.0f },
            avatarRotation,
            {
                g_avatarScale,
                g_avatarScale,
                g_avatarScale
            },
            WHITE
        );
    }
}


void Game01::SetAvatarColors(const Color colors[6])
{
    if (!colors) {
        return;
    }

    for (int i = 0; i < 6; ++i) {
        g_avatarPartColors[i] = colors[i];
    }

    ApplyAvatarPartColors();
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
    UnloadAnimationClips();

    if (g_avatarModelLoaded)
    {
        UnloadModel(g_avatarModel);

        g_avatarModel = {};
        g_avatarModelLoaded = false;
    }

    m_initialized = false;
}

void Game01::SetMovementKeys(
    int forward,
    int backward,
    int left,
    int right,
    int jump
)
{
    m_keyForward = forward;
    m_keyBackward = backward;
    m_keyLeft = left;
    m_keyRight = right;
    m_keyJump = jump;
}


void Game01::SetMovementEnabled(bool enabled)
{
    m_movementEnabled = enabled;
}





