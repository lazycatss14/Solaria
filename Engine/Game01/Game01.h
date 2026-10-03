#pragma once

#include "raylib.h"

/*
    ============================================================
    SOLARIA - GAME 01
    Basic playable game
    ============================================================
*/

class Game01
{
public:

    // --------------------------------------------------------
    // Game lifecycle
    // --------------------------------------------------------

    Game01();

    void Initialize();
    void Update(float cameraYaw);
    void Render(bool firstPerson);
    void Shutdown();


    // --------------------------------------------------------
    // Player
    // --------------------------------------------------------

    Vector3 GetPlayerPosition() const;


private:

    // --------------------------------------------------------
    // Game state
    // --------------------------------------------------------

    bool m_initialized;


    // --------------------------------------------------------
    // Player position
    // --------------------------------------------------------

    Vector3 m_playerPosition;


    // --------------------------------------------------------
    // Player physics
    // --------------------------------------------------------

    float m_playerVelocityY;

    bool m_onGround;


    // --------------------------------------------------------
    // Player rotation
    // --------------------------------------------------------

    /*
        Rotation in degrees.

        0 degrees = facing -Z.
    */

    float m_playerRotation;


    // --------------------------------------------------------
    // Walking animation state
    // --------------------------------------------------------

    /*
        Current position in the walking animation cycle.
    */

    float m_walkTime;

    /*
        How strongly the walking animation is active.

        0.0 = standing still
        1.0 = fully walking
    */

    float m_walkAmount;
};