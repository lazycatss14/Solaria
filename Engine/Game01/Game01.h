#pragma once

#include "raylib.h"

/*
    ============================================================
    SOLARIA - GAME 01
    Floating baseplate world + animated avatar
    ============================================================
*/

class Game01
{
public:
    Game01();

    void Initialize();
    void Update(float cameraYaw);
    void Render(bool firstPerson);
    void Shutdown();

    Vector3 GetPlayerPosition() const;
    void SetMovementKeys(int forward, int backward, int left, int right, int jump);
    void SetAvatarColors(const Color colors[6]);
    void SetMovementEnabled(bool enabled);

private:
    bool m_initialized;
    bool m_movementEnabled;

    int m_keyForward;
    int m_keyBackward;
    int m_keyLeft;
    int m_keyRight;
    int m_keyJump;

    Vector3 m_playerPosition;

    float m_playerVelocityY;
    bool m_onGround;

    // 0 degrees = +Z, 180 degrees = -Z.
    float m_playerRotation;

    float m_walkTime;
    float m_walkAmount;

    // Animation state.
    int m_currentAnimation;
    int m_previousAnimation;

    float m_animationTime;
    float m_previousAnimationTime;
    float m_animationBlend;
    float m_animationDuration;
};



