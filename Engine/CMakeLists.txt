cmake_minimum_required(VERSION 3.20)

project(SolariaEngine LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)


# ============================================================
# RAYLIB
# ============================================================

include(FetchContent)

set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(BUILD_GAMES OFF CACHE BOOL "" FORCE)

FetchContent_Declare(
    raylib
    GIT_REPOSITORY https://github.com/raysan5/raylib.git
    GIT_TAG 6.0
)

FetchContent_MakeAvailable(raylib)


# ============================================================
# SOLARIA GAME
# ============================================================

add_executable(SolariaGame

    # Engine
    src/main.cpp
    src/Engine.cpp

    # Game
    Game01/Game01.cpp

    # Network
    Network/BlockWorldAPI.cpp
)


# ============================================================
# INCLUDE DIRECTORIES
# ============================================================

target_include_directories(SolariaGame PRIVATE

    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/Game01
    ${CMAKE_CURRENT_SOURCE_DIR}/Network
)


# ============================================================
# RAYLIB
# ============================================================

target_link_libraries(SolariaGame PRIVATE

    raylib
)


# ============================================================
# WINDOWS LIBRARIES
# ============================================================

if(WIN32)

    target_link_libraries(SolariaGame PRIVATE

        winmm
        winhttp
    )

endif()