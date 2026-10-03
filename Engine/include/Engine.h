#pragma once

#include "raylib.h"

class BlockWorldEngine
{
public:
    BlockWorldEngine();
    ~BlockWorldEngine();

    bool Initialize(int width, int height, const char* title);

    bool BeginFrame();
    void EndFrame();

    void Shutdown();

    bool IsRunning() const;

    Camera3D& GetCamera();

    void UpdatePlayerCamera(Vector3 playerPosition);

    bool IsFirstPerson() const;

    float GetCameraYaw() const;

private:
    int m_width;
    int m_height;

    bool m_running;

    Camera3D m_camera;

    float m_cameraYaw;
    float m_cameraPitch;
    float m_cameraDistance;

    bool m_lookMode;
};