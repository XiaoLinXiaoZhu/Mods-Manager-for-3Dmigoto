# Mods Manager for 3dmigoto<br>——3dmigoto的插件管理工具

english version: [readme-en.md](./readme-en.md)

## 项目简介

这是一个便捷的插件管理工具，旨在通过一个美观的GUI界面来管理3dmigoto的mods。

该工具利用sober库实现了Material You风格的界面。
![alt text](readmeSrc/image-3.png)

## 功能列表

1. 从 `modResourceBackpack` 文件夹内读取可选mod列表（每个文件夹即为一个mod）。
2. 通过一个美观的可视化页面，选择开启哪些mod。
3. 点击 `Apply` 按钮后，根据选择的mod，将其复制到 `3dmigoto/Mods` 文件夹中。
4. 点击 `创建预设` 可以创建预设，点击可以在预设之间切换，并且再次点击 `Apply` 以应用预设。

## 安装步骤
### 从 release 下载
release页面里面有两个版本，一个是安装包版本，一个是松散文件版本。安装包版本是一个exe文件，松散文件版本是一个文件夹，里面包含了所有的文件。

建议使用松散文件版本，因为这样加载速度会更快。

1. 下载最新版本的安装包或者松散文件。
2. 解压文件。
3. 运行 `ZZZmod管理器-1.0.0 Setup.exe` 或者 `ZZZmod管理器.exe`。

### 从 源码 编译
1. 克隆此仓库到本地：
    ```bash
    git clone https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto.git
    ```
2. 进入项目目录：
    ```bash
    cd Mods-Manager-for-3Dmigoto
    ```
3. 安装依赖：
    ```bash
    npm install electron@latest
    npm install @soberjs/core
    ```
4. 启动项目：
    ```bash
    npm run start
    ```
5. 打包项目：安装electron forge 来打包项目
    ```bash
    npm install -g electron-forge
    electron-forge make
    ```
    打包后的文件在out文件夹中
    
## 开始使用

1. 启动应用后，界面会显示 `modResourceBackpack` 文件夹中的所有mod，首次使用时，需要指定 `modResourceBackpack` 文件夹根目录的路径。![alt text](readmeSrc/image-2.png)比如：文件夹结构如下：
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
    那么指定的文件夹的路径应为 `modResourceBackpack` 文件夹的根目录 `rootdir`。
![alt text](readmeSrc/image-1.png)
1. 将mod安装至 `modResourceBackpack` 文件夹中即可，你可能需要为每个mod增加一个 mod.json 文件，以便在管理器中显示mod的名称和描述。mod.json文件的格式如下：
    ```json
    {
    "character": "Anby",
    "description": "This is a description of my mod.",
    "imagePath": "preview.png"
    }
    ```

> 工具里面也提供了 autog.bat 来帮助生成 mod.json，当然你也不必每个mod都设置，只需要保证文件夹名称的可读性，并在mod文件夹下防止一张图片即可达到比较好的视觉效果:![](readmeSrc/image.png)
> 
> 当加载mod列表的时候，会按照以下优先级获取显示的图片：
> 1. mod.json 中的 imagePath 字段
> 2. mod文件夹下的第一张 名称为 preview 的图片
> 3. mod文件夹下的第一张图片
> 4. 默认图片


## 使用说明

1. 单击mod的卡片即可选择或取消选择mod。
2. 点击 `Apply` `应用配置` 按钮以应用更改。
3. 点击 `创建预设` 按钮以创建预设。
4. 点击 `预设` 按钮以切换预设。
5. 点击 `管理预设` 按钮以管理预设。

## 已知问题

暂无。


## 技术栈

- Electron
- [sober库](https://soberjs.com/)
- Material You 风格

## 后续计划


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

## 版本历史
### 版本 1.5 的新功能：
#### 新增功能：
- 添加了主题选择功能（推荐使用暗色主题，我根据zzz的设计风格进行了模仿）
- 添加了一个关闭窗口的按钮，放置在左下角
- 为图标按钮添加了文本描述
- 现在你的 mods 文件夹中的 mod 文件将永远不会被删除，如果出现冲突，将弹出警告窗口和操作选择

#### 视觉优化：
- 颜色方案模仿了 ZZZ 的设计
- 优化了按角色筛选的显示效果
- 添加了非常好的 mod 卡片显示效果，当选择或取消选择时，将有相应的动画和显示效果
- 选择预设时添加了高亮效果

#### 修复的问题：
- 当程序在 Mods 文件夹中找到一个未被管理的文件夹时，将弹出警告窗口和操作选项，您可以选择对未被管理的 mod 进行什么操作（忽略：不删除或移动文件；移动到 ModResourceBackpack：将 mod 移动到 modResourceBackpack 文件夹进行程序管理）
- 现在在更改 mod 卡片的选择时，预设会自动保存
- 一些文本还没有被翻译为翻译文本


## 许可证

此项目基于MIT许可证开源。详细信息请参阅 [LICENSE](./LICENSE) 文件。