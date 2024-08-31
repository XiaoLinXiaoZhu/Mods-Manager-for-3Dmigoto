const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');



document.addEventListener('DOMContentLoaded', async () => {
    let lang = localStorage.getItem('lang') || 'en';
    //翻译页面
    translatePage(lang);

    //- 获取元素
    const drawerPage = document.getElementById('drawer-page');

    //rootdir相关
    let rootdir = localStorage.getItem('rootdir') || __dirname;                //rootdir保存在localStorage中，如果没有则设置为默认值__dirname
    const settingsButton = document.getElementById('settings-show-button');
    const settingsDialog = document.getElementById('settings-dialog');
    const rootdirInput = document.getElementById('set-rootdir-input');
    const rootdirConfirmButton = document.getElementById('set-rootdir-confirm');

    //预设列表相关
    const presetContainer = document.getElementById('preset-container');
    const presetListDisplayButton = document.getElementById('preset-list-button');
    const presetAddButton = document.getElementById('preset-item-add');
    const presetNameInput = document.getElementById('add-preset-name');

    const presetAddConfirmButton = document.getElementById('preset-add-confirm');
    const presetEditButton = document.getElementById('preset-item-edit');

    let currentPreset = '';

    //mod列表相关
    const modContainer = document.getElementById('mod-container');
    const applyBtn = document.getElementById('apply-btn');

    const savePresetBtn = document.getElementById('save-preset-btn');
    let mods = [];

    //mod info 相关
    const modInfoName = document.getElementById('mod-info-name');
    const modInfoCharacter = document.getElementById('mod-info-character');
    const modInfoDescription = document.getElementById('mod-info-description');
    const modInfoImage = document.getElementById('mod-info-image');
    let currentMod = '';

    const infoShowButton = document.getElementById('info-show-button');

    //打开mod文件夹
    const openModFolderButton = document.getElementById('open-mod-dir');

    //编辑mod.json文件
    const editModInfoButton = document.getElementById('edit-mod-info');

    //设置初始化按钮
    const initConfigButton = document.getElementById('init-config-button');

    //- 初始化
    // 检测是否是第一次打开
    const firstOpen = localStorage.getItem('firstOpen');

    if (!firstOpen) {
        localStorage.setItem('firstOpen', 'false');
        //创建 firset-opne-window
        ipcRenderer.invoke('open-first-load-window');

        //展示要求刷新的提示
        document.getElementById('refresh-dialog').show();
    }
    else {
        await ipcRenderer.invoke('set-rootdir', rootdir);
        await loadModList();
        await loadPresets();
    }



    //- 内部函数
    function translatePage(lang) {
        //获取所有需要翻译的元素
        const elements = document.querySelectorAll('[data-translate-key]');
        //获取翻译文件
        const translationPath = path.join(__dirname, 'locales', `${lang}.json`);
        //读取翻译文件
        const translation = JSON.parse(fs.readFileSync(translationPath));
        //debug
        if (translation) {
            //翻译元素
            elements.forEach((element) => {
                const key = element.getAttribute('data-translate-key');
                if (key in translation) {
                    element.textContent = translation[key];
                    //debug
                    console.log(`Translate ${key} to ${translation[key]}`);
                }
            });
        }
        else {
            console.log('Translation file not found');
        }
    }

    function snack(message) {
        customElements.get('s-snackbar').show(message);
    }
    async function loadModList() {
        //加载mod列表
        modContainer.innerHTML = '';
        mods = await ipcRenderer.invoke('get-mods');
        mods.forEach(async mod => {
            console.log("mod: " + mod);
            //尝试获取mod下的mod.json文件，获取mod的信息和图片
            const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
            var modCharacter = modInfo.character ? modInfo.character : 'Unknown';
            //图片优先使用modInfo.imagePath，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
            var modImagePath;
            if (modInfo.imagePath) {
                var modImagePath = path.join(rootdir, 'modResourceBackpack', mod, modInfo.imagePath);
            }
            else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.png'))) {
                modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.png');
            }
            else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpg'))) {
                modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpg');
            }
            else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpeg'))) {
                modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpeg');
            }
            else {
                // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
                const files = fs.readdirSync(path.join(rootdir, 'modResourceBackpack', mod));
                const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
                if (imageFiles.length > 0) {
                    modImagePath = path.join(rootdir, 'modResourceBackpack', mod, imageFiles[0]);
                }
                else {
                    modImagePath = path.join(__dirname, 'default.png');
                }
            }

            var modDescription = modInfo.description ? modInfo.description : 'No description';

            //debug
            console.log(`mod:${mod} modCharacter:${modCharacter} modImagePath:${modImagePath} modDescription:${modDescription}`);


            //使用s-card以达到更好的显示效果
            const modItem = document.createElement('s-card');
            modItem.className = 'mod-item';
            modItem.checked = true;
            modItem.clickable = true;
            modItem.id = mod;
            modItem.style = 'width: 250px; height: 350px;margin-bottom: -5px;';
            modItem.innerHTML = `
                  <div slot="image" style="height: 200px;">
                        <img src="${modImagePath}" alt="${mod}" style="width: 100% ;height:100%;max-width: 100%; max-height: 100%; object-fit: cover;" />
                  </div>
                  <div slot="headline" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;margin-top:12px;">${mod}</div>
                  <div slot="subhead" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;margin-top: -2px;">
                  ${modCharacter}
                  </div>
                  
                  <div slot="text" style="height: 100px;margin-top:-10px;">
                    <s-scroll-view style="height: 100%;width: 110%;">
                        <p>${modDescription}</p>
                        <div style="height: 30px;"></div>
                    </s-scroll-view>
                </div>
            `;

            modContainer.appendChild(modItem);

            //点击modItem时，选中或取消选中
            modItem.addEventListener('click', () => {
                //debug
                console.log("clicked modItem " + modItem.id);
                currentMod = modItem.id;
                showModInfo(modItem.id);

                modItem.checked = !modItem.checked;
                refreshModList();
            });

        });
    }

    async function loadPresets() {
        presetContainer.innerHTML = '';
        const presets = await ipcRenderer.invoke('get-presets');
        presets.forEach(preset => {
            const presetItem = document.createElement('s-button');
            presetItem.id = 'preset-item';
            presetItem.type = "elevated";
            presetItem.innerHTML = preset;
            presetContainer.appendChild(presetItem);
        });

        document.querySelectorAll('#preset-item').forEach(presetItem => {
            presetItem.addEventListener('click', async () => {
                console.log("🔴presetItem" + presetItem.innerHTML);
                if (editMode) {
                    //innerHtml 现在包含了删除按钮，所以不再是presetName，而是presetName+删除按钮，所以需要提取presetName
                    const presetName = presetItem.innerHTML.split('<')[0].trim();
                    await ipcRenderer.invoke('delete-preset', presetName);
                    //将自己的父元素隐藏
                    presetItem.style.display = 'none';
                    //debug
                    console.log("delete presetItem" + presetItem.innerHTML);
                }
                else {
                    //保存之前的preset
                    //检查是否有当前的preset，如果有，则保存
                    if (presets.includes(currentPreset) && currentPreset != presetItem.innerHTML) {
                        await savePreset(currentPreset);
                    }
                    currentPreset = presetItem.innerHTML;
                    //debug
                    console.log("clicked presetItem" + presetItem.innerHTML);
                    const presetName = presetItem.innerHTML;
                    const selectedMods = await ipcRenderer.invoke('load-preset', presetName);
                    document.querySelectorAll('.mod-item').forEach(item => {
                        //debug
                        console.log(`item.id:${item.id} selectedMods:${selectedMods.includes(item.id)}`);
                        item.checked = selectedMods.includes(item.id);
                    });
                    refreshModList();
                }
            });
        }
        );
    };

    function refreshModList() {
        document.querySelectorAll('.mod-item').forEach(item => {
            if (item.checked == true) {
                item.type = 'filled';
                //让其背景变为绿色
                item.style.backgroundColor = '#4CAF50';
            }
            else {
                item.type = '';
                //让其背景变回原来的颜色
                item.style.backgroundColor = '';
            }
        }
        );
    }

    async function savePreset(presetName) {
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            await loadPresets();
        }
    }

    async function showModInfo(mod) {
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        //将info显示在 modInfo 中
        modInfoName.textContent = mod;
        modInfoCharacter.textContent = modInfo.character ? modInfo.character : 'Unknown';
        modInfoDescription.textContent = modInfo.description ? modInfo.description : 'No description';
        //图片优先使用modInfo.imagePath，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
        var modImagePath;
        if (modInfo.imagePath) {
            var modImagePath = path.join(rootdir, 'modResourceBackpack', mod, modInfo.imagePath);
        }
        else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.png'))) {
            modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.png');
        }
        else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpg'))) {
            modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpg');
        }
        else if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpeg'))) {
            modImagePath = path.join(rootdir, 'modResourceBackpack', mod, 'preview.jpeg');
        }
        else {
            // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
            const files = fs.readdirSync(path.join(rootdir, 'modResourceBackpack', mod));
            const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
            if (imageFiles.length > 0) {
                modImagePath = path.join(rootdir, 'modResourceBackpack', mod, imageFiles[0]);
            }
            else {
                modImagePath = path.join(__dirname, 'default.png');
            }
        }
        modInfoImage.src = modImagePath;
    }

    //-----------------------------事件监听--------------------------------
    let editMode = false;

    //-settings 相关
    settingsButton.addEventListener('click', async () => {
        // 显示或隐藏settingsDrawer
        settingsDialog.show();
        //获取当前rootdir
        rootdirInput.value = rootdir;
    });

    rootdirConfirmButton.addEventListener('click', async () => {
        //debug
        console.log("rootdir: " + rootdirInput.value);
        var dir = rootdirInput.value.trim();
        //将特殊路径替换为几个预设路径
        if (dir == 'default') {
            dir = __dirname;
        }

        if (dir) {
            //检查rootdir是否存在
            const exists = await ipcRenderer.invoke('check-rootdir', dir);
            if (exists) {
                //保存rootdir
                localStorage.setItem('rootdir', dir);
                rootdir = dir;
                await ipcRenderer.invoke('set-rootdir', dir);
                //debug
                console.log("rootdir: " + dir);
                //重新加载mods
                loadModList();
                loadPresets();
            }
            else {
                snack('Root directory does not exist');
            }
        }
        else {
            snack('Root directory cannot be empty');
        }
    }
    );

    //-mod启用
    applyBtn.addEventListener('click', async () => {
        //获取选中的mods,mod 元素为 mod-item，当其checked属性为true时，表示选中
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        //debug
        console.log("selectedMods: " + selectedMods);
        await ipcRenderer.invoke('apply-mods', selectedMods);
    })



//-预设列表相关
    presetListDisplayButton.addEventListener('click', async () => {
        // 显示或隐藏presetListDrawer
        drawerPage.toggle();
        //debug
        console.log("clicked presetListButton");
    });

    presetAddConfirmButton.addEventListener('click', async () => {
        //获取 presetName
        const presetName = presetNameInput.value.trim();
        //debug
        console.log("presetName: " + presetName);
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item input:checked')).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            await loadPresets();
        }
        else {
            //debug
            console.log("presetName is empty");
        }
        //清空输入框
        presetNameInput.value = '';
    });

    presetAddButton.addEventListener('click', async () => {
        //显示添加预设对话框
        presetNameInput.value = '';
        const dialog = document.getElementById('add-preset-dialog');
        dialog.show();
    }
    );

    // 管理预设 按钮
    presetEditButton.addEventListener('click', async () => {
        //给每个 presetItem 添加删除按钮
        if (editMode) {
            //debug
            console.log("exit edit mode");
            editMode = false;
            document.querySelectorAll('#preset-item').forEach(presetItem => {
                presetItem.removeChild(presetItem.lastChild);
            });
            loadPresets();
        }
        else {
            //debug
            console.log("enter edit mode");
            editMode = true;
            document.querySelectorAll('#preset-item').forEach(presetItem => {
                const deleteButton = document.createElement('s-icon');
                deleteButton.type = 'close';
                //设置 图标 左对齐
                deleteButton.style = 'float:right; margin-left: 10px;';
                presetItem.appendChild(deleteButton);
            });
        }
    });

    //初始化按钮
    initConfigButton.addEventListener('click', async () => {
        //debug
        console.log("clicked initConfigButton");
        localStorage.clear();
    });

//-mod info 相关
    infoShowButton.addEventListener('click', async () => {
        //显示或隐藏modInfoDrawer
        //如果当前的type="outlined" 则将其切换为"filled"，并且开启drawer
        //debug
        console.log("clicked infoShowButton");
        if (infoShowButton.type == 'default') {
            infoShowButton.type = 'filled';
            drawerPage.show('end');
        }
        else {
            infoShowButton.type = 'default';
            drawerPage.dismiss('end');
        }
    });

    //打开mod文件夹
    openModFolderButton.addEventListener('click', async () => {
        //debug
        console.log("clicked openModFolderButton");
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        await ipcRenderer.invoke('open-mod-folder', currentMod);
    });

    //编辑mod.json文件
    editModInfoButton.addEventListener('click', async () => {
        //debug
        console.log("clicked editModInfoButton");
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        await ipcRenderer.invoke('edit-mod-info', currentMod);
    });
});