#pragma once

#include <string>

class BlockWorldAPI
{
public:

    // Supabase connection information
    static const char* GetSupabaseURL();
    static const char* GetSupabasePublishableKey();

    // Test whether the engine can reach Supabase
    static bool TestConnection(long& statusCode);

    // Get player profile data from Supabase
    static bool GetPlayerProfile(
        const std::string& userId,
        std::string& username,
        std::string& displayName
    );

    // Get the player's saved avatar
    static bool GetPlayerAvatar(
        const std::string& userId,
        std::string& avatarData
    );
};