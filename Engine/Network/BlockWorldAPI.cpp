#include "BlockWorldAPI.h"
#include <string>
#include <windows.h>
#include <winhttp.h>

bool BlockWorldAPI::TestConnection(long& statusCode)
{
    statusCode = 0;

    HINTERNET session = WinHttpOpen(
        L"BlockWorld/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0
    );

    if (!session)
    {
        return false;
    }

    HINTERNET connection = WinHttpConnect(
        session,
        L"rprqpkcmyuwvqkzfiqbi.supabase.co",
        INTERNET_DEFAULT_HTTPS_PORT,
        0
    );

    if (!connection)
    {
        WinHttpCloseHandle(session);
        return false;
    }

    HINTERNET request = WinHttpOpenRequest(
        connection,
        L"GET",
        L"/auth/v1/settings",
        nullptr,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        WINHTTP_FLAG_SECURE
    );

    if (!request)
    {
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return false;
    }

    std::wstring headers =
        L"apikey: " +
        std::wstring(
            L"sb_publishable_kTzqdJhND_1X2nmE1_lszQ_1NO5-6vf"
        ) +
        L"\r\n";

    WinHttpAddRequestHeaders(
        request,
        headers.c_str(),
        static_cast<DWORD>(-1L),
        WINHTTP_ADDREQ_FLAG_ADD
    );

    BOOL sent = WinHttpSendRequest(
        request,
        WINHTTP_NO_ADDITIONAL_HEADERS,
        0,
        WINHTTP_NO_REQUEST_DATA,
        0,
        0,
        0
    );

    if (!sent)
    {
        WinHttpCloseHandle(request);
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return false;
    }

    BOOL received = WinHttpReceiveResponse(
        request,
        nullptr
    );

    if (!received)
    {
        WinHttpCloseHandle(request);
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return false;
    }

    DWORD size = sizeof(statusCode);

    WinHttpQueryHeaders(
        request,
        WINHTTP_QUERY_STATUS_CODE |
        WINHTTP_QUERY_FLAG_NUMBER,
        WINHTTP_HEADER_NAME_BY_INDEX,
        &statusCode,
        &size,
        WINHTTP_NO_HEADER_INDEX
    );

    WinHttpCloseHandle(request);
    WinHttpCloseHandle(connection);
    WinHttpCloseHandle(session);

    return statusCode != 0;
}