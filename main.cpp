#include <d3d11.h>
#include "lib/imgui.h"
#include "lib/imgui_impl_win32.h"
#include "lib/imgui_impl_dx11.h"
#include <windows.h>
#include <tchar.h>
#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <shlobj.h>

// 结构体来保存mod的信息
struct Mod {
    std::string name;
    bool enabled = false;
};

// 用于存储所有mod信息的向量
std::vector<Mod> mods;
// 存储预设名称到启用状态的映射
std::map<std::string, std::vector<bool>> presets;
// 当前激活的预设
std::string currentPreset = "Default";

// 读取指定文件夹下的mod文件夹并填充到mods向量中
void LoadMods(const std::string& folder) {
    WIN32_FIND_DATA findData;
    HANDLE hFind = FindFirstFile((folder + "\\*").c_str(), &findData);
    if (hFind != INVALID_HANDLE_VALUE) {
        do {
            if (findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
                if (strcmp(findData.cFileName, ".") != 0 && strcmp(findData.cFileName, "..") != 0) {
                    Mod mod;
                    mod.name = findData.cFileName;
                    mods.push_back(mod);
                }
            }
        } while (FindNextFile(hFind, &findData));
        FindClose(hFind);
    }
}

// 应用当前的选择，更新mods文件夹的内容
void ApplyChanges(const std::string& fromFolder, const std::string& toFolder) {
    // 清除已禁用的mod
    WIN32_FIND_DATA findData;
    HANDLE hFind = FindFirstFile((toFolder + "\\*").c_str(), &findData);
    if (hFind != INVALID_HANDLE_VALUE) {
        do {
            if (findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
                if (strcmp(findData.cFileName, ".") != 0 && strcmp(findData.cFileName, "..") != 0) {
                    bool found = false;
                    for (const auto& mod : mods) {
                        if (mod.enabled && strcmp(mod.name.c_str(), findData.cFileName) == 0) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        RemoveDirectory((toFolder + "\\" + findData.cFileName).c_str());
                    }
                }
            }
        } while (FindNextFile(hFind, &findData));
        FindClose(hFind);
    }

    // 复制新启用的mod
    for (const auto& mod : mods) {
        if (mod.enabled) {
            std::string sourcePath = fromFolder + "\\" + mod.name;
            std::string targetPath = toFolder + "\\" + mod.name;
            if (!CopyFile(sourcePath.c_str(), targetPath.c_str(), FALSE)) {
                std::cerr << "Failed to copy file: " << GetLastError() << std::endl;
            }
        }
    }
}

// 新建或切换预设
void ChangePreset(const std::string& presetName) {
    currentPreset = presetName;
    if (presets.find(presetName) == presets.end()) {
        presets[presetName] = std::vector<bool>(mods.size(), false);
    }
    for (size_t i = 0; i < mods.size(); ++i) {
        mods[i].enabled = presets[presetName][i];
    }
}

// 主循环的一部分
void ShowUI() {
    static char inputText[256] = "";
    static bool showPresets = false;

    ImGui::Begin("Mod Manager");

    // 显示mod列表
    for (size_t i = 0; i < mods.size(); ++i) {
        ImGui::Checkbox(mods[i].name.c_str(), &mods[i].enabled);
    }

    // 应用按钮
    if (ImGui::Button("Apply")) {
        ApplyChanges("modResourceBackpack", "mods");
    }

    // 创建/切换预设
    if (ImGui::Button("Create/Change Preset")) {
        showPresets = true;
    }

    if (showPresets) {
        ImGui::OpenPopup("Presets");
    }

    if (ImGui::BeginPopup("Presets")) {
        ImGui::InputText("New Preset Name", inputText, IM_ARRAYSIZE(inputText));
        if (ImGui::Button("Create")) {
            ChangePreset(inputText);
            showPresets = false;
        }
        for (const auto& preset : presets) {
            if (ImGui::MenuItem(preset.first.c_str())) {
                ChangePreset(preset.first);
                showPresets = false;
            }
        }
        ImGui::EndPopup();
    }

    ImGui::End();
}

// Win32 消息处理函数
LRESULT WINAPI WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    if (ImGui_ImplWin32_WndProcHandler(hWnd, message, wParam, lParam))
        return true;

    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
}

// 主函数
int WINAPI wWinMain(_In_ HINSTANCE hInstance,
                    _In_opt_ HINSTANCE hPrevInstance,
                    _In_ LPWSTR    lpCmdLine,
                    _In_ int       nCmdShow)
{
    WNDCLASSEX wc = { 0 };
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.cbClsExtra = 0;
    wc.cbWndExtra = 0;
    wc.hInstance = hInstance;
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszMenuName = NULL;
    wc.lpszClassName = L"ImGuiModManager";
    wc.hIconSm = LoadIcon(wc.hInstance, IDI_APPLICATION);

    if (!RegisterClassEx(&wc))
        return -1;

    HWND hwnd = CreateWindowEx(WS_EX_OVERLAPPEDWINDOW,
                               wc.lpszClassName, L"Mod Manager",
                               WS_OVERLAPPEDWINDOW,
                               CW_USEDEFAULT, CW_USEDefault, 640, 480,
                               NULL, NULL, hInstance, NULL);

    if (!hwnd)
        return -1;

    // DirectX 11 和 ImGui 的初始化
    // 假设你已经有了一个有效的 DirectX 11 设备和交换链
    ID3D11Device* pd3dDevice = nullptr;
    ID3D11DeviceContext* pd3dDeviceContext = nullptr;
    IDXGISwapChain* pSwapChain = nullptr;

    // 初始化 ImGui
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX11_Init(pd3dDevice, pd3dDeviceContext);

    LoadMods(L"modResourceBackpack");

    MSG msg = { 0 };
    while (msg.message != WM_QUIT) {
        if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        } else {
            ImGui_ImplDX11_NewFrame();
            ImGui_ImplWin32_NewFrame();
            ImGui::NewFrame();

            ShowUI();

            ImGui::Render();
            pd3dDeviceContext->OMSetRenderTargets(1, &pRenderTargetView, NULL);
            pd3dDeviceContext->ClearRenderTargetView(pRenderTargetView, reinterpret_cast<const float*>(&COLOR_CLEAR_VALUE));
            ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());

            pSwapChain->Present(g_bVSyncEnabled ? 1 : 0, 0);
        }
    }

    ImGui_ImplDX11_Shutdown();
    ImGui_ImplWin32_Shutdown();
    ImGui::DestroyContext();

    if (pRenderTargetView) pRenderTargetView->Release();
    if (pd3dDeviceContext) pd3dDeviceContext->Release();
    if (pd3dDevice) pd3dDevice->Release();
    if (pSwapChain) pSwapChain->Release();

    return (int)msg.wParam;
}

using namespace std;

struct Mod {
    string name;
    bool enabled = false;
};

// 全局变量
WNDCLASSEX wc = { 0 };
HWND hwnd = nullptr;
IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);
ID3D11Device* pd3dDevice = nullptr;
ID3D11DeviceContext* pd3dDeviceContext = nullptr;
IDXGISwapChain* pSwapChain = nullptr;
ID3D11RenderTargetView* pRenderTargetView = nullptr;
bool g_bIsFullScreen = false;
bool g_bVSyncEnabled = false;
bool isDone = false;

// 结构体来存储mod信息
vector<Mod> mods;
// 存储预设名称到启用状态的映射
map<string, vector<bool>> presets;
// 当前激活的预设
string currentPreset = "Default";

// 读取mod文件夹并填充到mods向量中
void LoadMods(const string& folder) {
    for (auto& entry : filesystem::directory_iterator(folder)) {
        if (entry.is_directory()) {
            Mod mod;
            mod.name = entry.path().filename().string();
            mods.push_back(mod);
        }
    }
}

// 应用当前的选择，更新mods文件夹的内容
void ApplyChanges(const string& fromFolder, const string& toFolder) {
    for (const auto& entry : filesystem::directory_iterator(toFolder)) {
        if (entry.is_directory()) {
            bool found = false;
            for (const auto& mod : mods) {
                if (mod.enabled && entry.path().filename() == mod.name) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                filesystem::remove_all(entry.path());
            }
        }
    }

    for (const auto& mod : mods) {
        if (mod.enabled) {
            filesystem::path sourcePath = fromFolder + "/" + mod.name;
            filesystem::path targetPath = toFolder + "/" + mod.name;
            if (!filesystem::exists(targetPath)) {
                filesystem::copy(sourcePath, targetPath, filesystem::copy_options::recursive);
            }
        }
    }
}

// 新建或切换预设
void ChangePreset(const string& presetName) {
    currentPreset = presetName;
    if (presets.find(presetName) == presets.end()) {
        presets[presetName] = vector<bool>(mods.size(), false);
    }
    for (size_t i = 0; i < mods.size(); ++i) {
        mods[i].enabled = presets[presetName][i];
    }
}

// 主循环的一部分
void ShowUI() {
    static char inputText[256] = "";
    static bool showPresets = false;

    ImGui::Begin("Mod Manager");

    for (size_t i = 0; i < mods.size(); ++i) {
        ImGui::Checkbox(mods[i].name.c_str(), &mods[i].enabled);
    }

    if (ImGui::Button("Apply")) {
        ApplyChanges("modResourceBackpack", "mods");
    }

    if (ImGui::Button("Create/Change Preset")) {
        showPresets = true;
    }

    if (showPresets) {
        ImGui::OpenPopup("Presets");
    }

    if (ImGui::BeginPopup("Presets")) {
        ImGui::InputText("New Preset Name", inputText, IM_ARRAYSIZE(inputText));
        if (ImGui::Button("Create")) {
            ChangePreset(inputText);
            showPresets = false;
        }
        for (const auto& preset : presets) {
            if (ImGui::MenuItem(preset.first.c_str())) {
                ChangePreset(preset.first);
                showPresets = false;
            }
        }
        ImGui::EndPopup();
    }

    ImGui::End();
}

LRESULT WINAPI WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    if (ImGui_ImplWin32_WndProcHandler(hWnd, message, wParam, lParam))
        return true;

    switch (message)
    {
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
}

void SetupImGui(ID3D11Device* device, ID3D11DeviceContext* context, IDXGISwapChain* swapchain) {
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX11_Init(device, context);
}

int WINAPI wWinMain(_In_ HINSTANCE hInstance,
                    _In_opt_ HINSTANCE hPrevInstance,
                    _In_ LPWSTR    lpCmdLine,
                    _In_ int       nCmdShow)
{
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.cbClsExtra = 0;
    wc.cbWndExtra = 0;
    wc.hInstance = hInstance;
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszMenuName = NULL;
    wc.lpszClassName = TEXT("ImGuiModManager");
    wc.hIconSm = LoadIcon(wc.hInstance, IDI_APPLICATION);

    if (!RegisterClassEx(&wc))
        return -1;

    hwnd = CreateWindowEx(WS_EX_OVERLAPPEDWINDOW,
                          wc.lpszClassName, TEXT("Mod Manager"),
                          WS_OVERLAPPEDWINDOW,
                          CW_USEDEFAULT, CW_USEDEFAULT, 640, 480,
                          NULL, NULL, hInstance, NULL);

    if (!hwnd)
        return -1;

    D3D_FEATURE_LEVEL featureLevel;
    DXGI_SWAP_CHAIN_DESC swapChainDesc = { 0 };
    swapChainDesc.BufferCount = 1;
    swapChainDesc.BufferDesc.Width = 0;
    swapChainDesc.BufferDesc.Height = 0;
    swapChainDesc.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    swapChainDesc.BufferDesc.RefreshRate.Numerator = 60;
    swapChainDesc.BufferDesc.RefreshRate.Denominator = 1;
    swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    swapChainDesc.OutputWindow = hwnd;
    swapChainDesc.SampleDesc.Count = 1;
    swapChainDesc.SampleDesc.Quality = 0;
    swapChainDesc.Windowed = !g_bIsFullScreen;
    swapChainDesc.Flags = DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH;
    
    if (D3D11CreateDeviceAndSwapChain(
        NULL, D3D_DRIVER_TYPE_HARDWARE, NULL, 0,
        NULL, 0, D3D11_SDK_VERSION,
        &swapChainDesc, &pSwapChain, &pd3dDevice, &featureLevel, &pd3dDeviceContext) != S_OK)
        return -1;

    SetupImGui(pd3dDevice, pd3dDeviceContext, pSwapChain);

    LoadMods("modResourceBackpack");

    MSG msg = { 0 };
    while (msg.message != WM_QUIT) {
        if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        } else {
            ImGui_ImplDX11_NewFrame();
            ImGui_ImplWin32_NewFrame();
            ImGui::NewFrame();

            ShowUI();

            ImGui::Render();
            pd3dDeviceContext->OMSetRenderTargets(1, &pRenderTargetView, NULL);
            const float COLOR_CLEAR_VALUE[] = { 0.0f, 0.0f, 0.0f, 1.0f };
            pd3dDeviceContext->ClearRenderTargetView(pRenderTargetView, COLOR_CLEAR_VALUE);
            ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());

            pSwapChain->Present(g_bVSyncEnabled ? 1 : 0, 0);
        }
    }

    ImGui_ImplDX11_Shutdown();
    ImGui_ImplWin32_Shutdown();
    ImGui::DestroyContext();

    if (pRenderTargetView) pRenderTargetView->Release();
    if (pd3dDeviceContext) pd3dDeviceContext->Release();
    if (pd3dDevice) pd3dDevice->Release();
    if (pSwapChain) pSwapChain->Release();

    return (int)msg.wParam;
}