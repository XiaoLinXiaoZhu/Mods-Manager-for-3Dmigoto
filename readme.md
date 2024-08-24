# Mods-Manager-for-3Dmigoto<br>插件管理工具

## 项目简介

这是一个便捷的mod管理工具。该工具会自动加载位于文件夹根目录的 `mods` 文件夹内的插件。通过将插件根据需求移动到 `mods` 文件夹来实现插件的启用和禁用。

## 功能特性

- 从 `modResourceBackpack` 文件夹内读取可选插件列表（每个文件夹即为一个插件）。
- 提供一个美观的可视化页面，允许用户选择开启哪些插件。
- 点击 `Apply` 按钮后，删除 `mods` 文件夹中已经关闭但存在的插件，并从 `modResourceBackpack` 文件夹中复制开启但不在 `mods` 文件夹中的插件。
- 支持创建预设，允许用户在预设之间切换，并通过点击 `Apply` 按钮应用预设。

## 安装指南

1. 克隆项目到本地：
   ```sh
   git clone https://github.com/yourusername/plugin-manager.git
   ```
2. 进入项目目录：
   ```sh
   cd plugin-manager
   ```
3. 安装依赖项（假设使用 vcpkg 进行依赖管理）：
   ```sh
   vcpkg install imgui
   ```
4. 编译项目：
   ```sh
   mkdir build
   cd build
   cmake ..
   cmake --build .
   ```

## 使用说明

1. 启动插件管理工具：
   ```sh
   ./plugin-manager
   ```
2. 在可视化页面中，选择要启用的插件。
3. 点击 `Apply` 按钮，应用所选插件。
4. 要创建预设，点击 `Create Preset` 按钮，输入预设名称并保存。
5. 要切换预设，选择预设并点击 `Apply` 按钮。

## 开发环境

- 开发语言：C++
- 图形库：ImGui
- 构建工具：CMake
- 依赖管理：vcpkg

## 贡献指南

欢迎贡献代码和提交问题！请遵循以下步骤：

1. Fork 本仓库。
2. 创建一个新的分支：
   ```sh
   git checkout -b feature-branch
   ```
3. 提交您的更改：
   ```sh
   git commit -am 'Add new feature'
   ```
4. 推送到分支：
   ```sh
   git push origin feature-branch
   ```
5. 创建一个 Pull Request。

## 许可证

本项目基于 MIT 许可证开源。详细信息请参阅 LICENSE 文件。
