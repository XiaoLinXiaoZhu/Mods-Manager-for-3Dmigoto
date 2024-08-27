## Mods Manager for 3dmigoto<br>--Plugin management tools for 3dmigoto

I use ai to translate the text for me, there may be something that is not clear ......
## Project Information

This is a handy plugin management tool designed to manage 3dmigoto's mods through a beautiful GUI interface.

The tool utilizes the sober library to achieve a Material You style interface.
! [alt text](readmeSrc/image-3.png)

## List of features

1. read the list of available mods from the `modResourceBackpack` folder (each folder is a mod). 2. read the list of available mods from the `modResourceBackpack` folder (each folder is a mod).
2. Select which mods to enable via a nice visualization page. 3.
3. Click the `Apply` button and copy the selected mods to the `3dmigoto/Mods` folder. 4.
4. Click `Create Preset` to create a preset, click to switch between presets, and click `Apply` again to apply the preset.

## Installation steps
### Download from release
There are two versions on the release page, an installer version and a loose file version. The installer version is an exe file and the loose file version is a folder containing all the files.

It is recommended to use the loose file version as it will load faster.

1. Download the latest version of the installer or loose file.
2. Unzip the file.
3. Run `ZZZmod Manager-1.0.0 Setup.exe` or `ZZZmod Manager.exe`.

### Compile from source
1. Clone the repository locally:
    ```bash
    git clone https://github.com/XiaoLinXiaoZhu/Mods-Manager-for-3Dmigoto.git
    ```
2. Go to the project directory:
    ``bash
    cd Mods-Manager-for-3Dmigoto
    ```
3. Install the dependencies:
    ```bash
    npm install electron@latest
    npm install @soberjs/core
    ```
4. Start the project:
    ```bash
    npm run start
    ```
5. Package the project: Install electron forge to package the project.
    ```bash
    npm install -g electron-forge
    electron-forge make
    ```
    The packaged files are in the out folder.
    
## Getting Started

1. When you start the application, the interface will show all the mods in the `modResourceBackpack` folder. The first time you use the application, you need to specify the path to the root of the `modResourceBackpack` folder.! [alt text](readmeSrc/image-2.png) For example: the folder structure is as follows:
    ``
    rootdir
    ├── modResourceBackpack
    │ ├── mod1
    │ ├── mod2
    │ ├── mod3
    │ └── ...
    ├── 3dmigoto
    │ ├── Mods
    │ ├── 3dmigoto.exe
    │ └── ...
    └── presets
        ├── preset1
        ├── preset2
        ├── preset3
        └── ...
    ```
    Then the path to the specified folder should be `rootdir`, the root directory of the `modResourceBackpack` folder.
! [alt text](readmeSrc/image-1.png)
1. Simply install the mods into the `modResourceBackpack` folder. You may need to add a mod.json file for each mod in order to display the name and description of the mod in the manager. mod.json files have the following format:
    ``json
    {
    “character": ‘Anby’,
    “description": ‘This is a description of my mod.’,
    “imagePath": ”preview.png”
    }
    ```

> The tool also provides autog.bat to help generate the mod.json, but you don't have to set it up for every mod, just make sure the folder name is readable and prevent an image in the mod folder to achieve a better visual effect :! [](readmeSrc/image.png)
> 
> When loading the mod list, the displayed image is fetched in the following priority:
> 1. the imagePath field in mod.json
> 2. the first image in the mod folder with the name preview
> 3. the first image in the mod folder
> 4. the default image


## Instructions for use

1. Click on a mod's card to select or deselect the mod. 2.
2. Click the `Apply` `Apply Configuration` button to apply the changes. 3.
3. Click the `Create Preset` button to create a preset. 4.
4. Click the `Presets` button to switch presets. 5.
5. Click the `Manage Presets` button to manage presets.

## Known Issues
- The first time you start up, all mods are selected/unselected because the specified preset is not selected. This is because the assigned preset is not selected. Clicking on a random preset will fix it.
- Sometimes the mod list cannot be read because the path to the `modResourceBackpack` folder is not specified. This is because the path to the `modResourceBackpack` folder was not specified.

## Technology Stack

- Electron
- [sober library](https://soberjs.com/)
- Material You style

## Follow-up plans
- [ ] Support downloading mods
- [ ] Support for customizing mod folders



## Contribution Guidelines

Contributions of any kind are welcome! Please follow the steps below:

1. Fork this repository.
2. Create a new branch:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Commit your changes:
    ```bash
    git commit -m 'Add some feature'
    ```
4. Push to the branch:
    ``bash
    git push origin feature/your-feature-name
    ```
5. Create a Pull Request.

## License

This project is open source under the MIT license. See the [LICENSE](. /LICENSE) file for more information.

Translated with DeepL.com (free version)