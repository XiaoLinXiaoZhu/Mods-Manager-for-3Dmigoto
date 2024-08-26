# Mods Manager for 3dmigoto<br>——3dmigoto的插件管理工具

## 项目简介

这是一个便捷的插件管理工具，旨在通过一个美观的GUI界面来管理3dmigoto的mods。

该工具利用sober库实现了Material You风格的界面。

## 功能列表

1. 从 `modResourceBackpack` 文件夹内读取可选mod列表（每个文件夹即为一个mod）。
2. 通过一个美观的可视化页面，选择开启哪些mod。
3. 点击 `Apply` 按钮后，删除 `mods` 文件夹中已经关闭但是存在的插件，并从 `modResourceBackpack` 文件夹中复制开启但是不在 `mods` 文件夹中的文件。
4. 点击 `创建预设` 可以创建预设，点击可以在预设之间切换，并且再次点击 `Apply` 以应用预设。

## 安装步骤
### 从 release 下载
release页面里面有两个版本，一个是安装包版本，一个是松散文件版本。安装包版本是一个exe文件，松散文件版本是一个文件夹，里面包含了所有的文件。

建议使用松散文件版本，因为这样加载速度会更快。

1. 下载最新版本的安装包或者松散文件。
2. 解压文件。
3. 运行 `ZZZmod管理器-1.0.0 Setup.exe` 或者 `ZZZmod管理器.exe`。
4. 指定 `modResourceBackpack` 文件夹根目录的路径。比如：文件夹结构如下：
    ```
    rootdir
    ├── modResourceBackpack
    │   ├── mod1
    │   ├── mod2
    │   ├── mod3
    │   └── ...
    ├── 3dmigoto
    │   ├── Mods
    │   ├── 3dmigoto.exe
    │   └── ...
    └── presets
        ├── preset1
        ├── preset2
        ├── preset3
        └── ...
    ```
    那么指定 `modResourceBackpack` 文件夹的路径为 `modResourceBackpack` 文件夹的根目录`rootdir`。
5. 将mod安装至 `modResourceBackpack` 文件夹中即可，你可能需要为每个mod增加一个 mod.json 文件，以便在管理器中显示mod的名称和描述。mod.json文件的格式如下：
    ```json
    {
    "character": "Anby",
    "description": "This is a description of my mod.",
    "imagePath": "preview.png"
    }
    ```
    

### 从 源码 编译
1. 克隆此仓库到本地：
    ```bash
    git clone <仓库地址>
    ```
2. 进入项目目录：
    ```bash
    cd <项目目录>
    ```
3. 安装依赖：
    ```bash
    npm install
    ```
4. 启动项目：
    ```bash
    npm run start
    ```

## 使用说明

1. 启动应用后，界面会显示 `modResourceBackpack` 文件夹中的所有mod。
2. 通过勾选复选框选择要启用的mod。
3. 点击 `Apply` 按钮应用更改。
4. 点击 `创建预设` 按钮可以创建一个新的预设，之后可以在预设之间切换并应用。

## 技术栈

- Electron
- [sober库](https://soberjs.com/)
- Material You 风格

## 后续计划
- [ ] 支持下载mod
- [ ] 支持自定义mod文件夹



## 贡献指南

欢迎任何形式的贡献！请遵循以下步骤：

1. Fork 此仓库。
2. 创建一个新的分支：
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. 提交你的更改：
    ```bash
    git commit -m 'Add some feature'
    ```
4. 推送到分支：
    ```bash
    git push origin feature/your-feature-name
    ```
5. 创建一个Pull Request。

## 许可证

此项目基于MIT许可证开源。详细信息请参阅 [LICENSE](./LICENSE) 文件。