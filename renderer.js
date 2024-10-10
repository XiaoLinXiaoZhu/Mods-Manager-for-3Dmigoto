const { ipcRenderer, dialog } = require('electron');
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

    const settingsDialog = document.getElementById('settings-dialog');
    const rootdirInput = document.getElementById('set-rootdir-input');
    const rootdirConfirmButton = document.getElementById('set-rootdir-confirm');

    //设置页面
    const autoApplySwitch = document.getElementById('auto-apply-switch');
    let ifAutoApply = localStorage.getItem('auto-apply') || false;
    const autoRefreshInZZZSwitch = document.getElementById('auto-refresh-in-zzz');
    let ifAutofreshInZZZ = localStorage.getItem('auto-refresh-in-zzz') || false;
    const getExePathInput = document.getElementById('get-exePath-input');
    let exePath = localStorage.getItem('exePath') || '';
    const themePicker = document.getElementById('theme-picker');
    const themes = themePicker.querySelectorAll('s-chip');

    //预设列表相关
    const presetContainer = document.getElementById('preset-container');
    const presetListDisplayButton = document.getElementById('preset-list-button');
    const presetAddButton = document.getElementById('preset-item-add');
    const presetNameInput = document.getElementById('add-preset-name');

    const presetAddConfirmButton = document.getElementById('preset-add-confirm');
    const presetEditButton = document.getElementById('preset-item-edit');

    const addPresetDialog = document.getElementById('add-preset-dialog');

    let currentPreset = '';
    let editMode = false;

    //控制按钮
    const settingsShowButton = document.getElementById('settings-show-button');
    const fullScreenButton = document.getElementById('fullscreen-button');
    const fullScreenSvgpath = document.getElementById('fullscreen-button-svgpath');

    //mod筛选相关
    const modFilterScroll = document.getElementById('mod-filter-scroll');
    const modFilterSelected = document.getElementById('mod-filter-selected');
    const modFilter = document.getElementById('mod-filter');
    const modFilterAll = document.getElementById('mod-filter-all');

    //mod列表相关
    const modContainer = document.getElementById('mod-container');
    const applyBtn = document.getElementById('apply-btn');

    const unknownModDialog = document.getElementById('unknown-mod-dialog');

    const savePresetBtn = document.getElementById('save-preset-btn');
    let mods = [];
    let modCharacters = [];
    let modFilterCharacter = 'All';

    let compactMode = false;
    const compactModeButton = document.getElementById('compact-mode-button');

    //mod info 相关
    const modInfoName = document.getElementById('mod-info-name');
    const modInfoCharacter = document.getElementById('mod-info-character');
    const modInfoDescription = document.getElementById('mod-info-description');
    const modInfoImage = document.getElementById('mod-info-image');
    let currentMod = '';

    const infoShowButton = document.getElementById('info-show-button');

    //mod info 页面的按钮：
    //打开mod链接
    const openModUrlButton = document.getElementById('open-mod-url');
    //打开mod文件夹
    const openModFolderButton = document.getElementById('open-mod-dir');

    //编辑mod.json文件
    const editModInfoButton = document.getElementById('edit-mod-info');
    const editModInfoDialog = document.getElementById('edit-mod-info-dialog');
    const ifSaveChangeDialog = document.getElementById('save-change-dialog');

    //设置初始化按钮
    const initConfigButton = document.getElementById('init-config-button');
    const refreshDialog = document.getElementById('refresh-dialog');

    // Window size and position
    const bounds = localStorage.getItem('bounds');
    await ipcRenderer.invoke('set-bounds', bounds);

    // Window fullscreen
    let isFullScreen = localStorage.getItem('fullscreen') === 'true';
    if (isFullScreen) {
        toggleFullscreen();
    }

    // 创建 Intersection Observer
    // 用于检测modItem是否在视窗内,如果在视窗内则使其inWindow属性为true,否则为false
    // 用来代替 getBoundingClientRect() 来判断元素是否在视窗内,getBoundingClientRect()会导致页面重绘
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const modItem = entry.target;
            // 如果元素在视口内，则使其inWindow属性为true
            modItem.inWindow = entry.isIntersecting ? true : false;
            //debug
            //console.log(`modItem ${modItem.id} inWindow:${modItem.inWindow}`);
        });
    }, {
        root: null, // 使用视口作为根
        rootMargin: '250px 100px', // 扩展视口边界
        threshold: 0 // 只要元素进入视口就触发回调
    });

    //- 初始化
    // 检测是否是第一次打开
    const firstOpen = localStorage.getItem('firstOpen');

    if (!firstOpen) {
        localStorage.setItem('firstOpen', 'false');
        //创建 firset-opne-window
        ipcRenderer.invoke('open-first-load-window');

        //展示要求刷新的提示
        showDialog(refreshDialog);
    }
    else {
        await ipcRenderer.invoke('set-rootdir', rootdir);
        await ipcRenderer.invoke('set-exePath', exePath);
        await loadModList();
        await loadPresets();
        refreshModFilter();

        //debug
        console.log("rootdir: " + rootdir);
        console.log("exePath: " + exePath);
        console.log("ifAutofreshInZZZ: " + ifAutofreshInZZZ);
        console.log("ifAutoApply: " + ifAutoApply);
    }
    setTheme(localStorage.getItem('theme') || 'dark');


    //- 内部函数

    async function applyMods() {
        //获取选中的mods,mod 元素为 mod-item，当其checked属性为true时，表示选中
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        //debug
        console.log("selectedMods: " + selectedMods);
        //检查mods文件夹下是否有modResourceBackpack文件夹没有的文件夹，如果有则提示用户检测到mod文件夹下有未知文件夹，是否将其移动到modResourceBackpack文件夹
        const modLoaderDir = path.join(rootdir, 'Mods');
        const modBackpackDir = path.join(rootdir, 'modResourceBackpack');
        const unknownDirs = fs.readdirSync(modLoaderDir).filter(file => !fs.existsSync(path.join(modBackpackDir, file)));
        if (unknownDirs.length > 0) {
            //显示未知文件夹对话框
            showDialog(unknownModDialog);
            //显示未知文件夹
            const unknownModList = document.getElementById('unknown-mod-list');
            unknownModList.innerHTML = '';
            unknownDirs.forEach(dir => {
                const listItem = document.createElement('li');
                listItem.textContent = dir;
                unknownModList.appendChild(listItem);
            });
        }

        else await ipcRenderer.invoke('apply-mods', selectedMods);

        //如果启用了 auto-refresh-in-zzz 则使用cmd激活刷新的exe程序
        if (ifAutofreshInZZZ) {
            tryRefreshInZZZ();
        }
    }

    function showDialog(dialog) {
        // 将 Dialog 的 display 设置为 block
        if (dialog.style.display != 'block') {
            dialog.style.display = 'block';
        }
        dialog.show();
    }

    function setTheme(theme) {
        const sPages = document.querySelectorAll('s-page');

        //保存当前主题
        localStorage.setItem('theme', theme);

        sPages.forEach(page => {
            page.theme = theme;
        }
        );

        //在设置页面同步修改显示情况
        themes.forEach(item => {
            //将所有的type设置为default
            if (item.id == theme) {
                item.type = 'filled-tonal';
            }
            else {
                item.type = 'default';
            }
        });

        //特殊样式手动更改
        if (theme != 'dark') {
            //将背景图片取消显示
            sPages.forEach(page => {
                page.style.backgroundImage = 'none';
            }
            );
        }
        else {
            //将背景图片显示
            sPages.forEach(page => {
                page.style.backgroundImage = 'url(./src/background.png)';
            }
            );
        }
    }


    function translatePage(lang) {
        //获取所有需要翻译的元素
        const elements = document.querySelectorAll('[data-translate-key]');
        //获取翻译文件
        const translationPath = path.join(__dirname, 'locales', `${lang}.json`);
        //读取翻译文件
        const translation = JSON.parse(fs.readFileSync(translationPath));
        //直接替换元素的textContent，不使用文档片段，比较两者的性能
        elements.forEach(async element => {
            const key = element.getAttribute('data-translate-key');
            if (key in translation) {
                element.textContent = translation[key];
                //debug
                //console.log(`Translate ${key} to ${translation[key]}`);
            }
            else {
                console.log(`Translation for ${key} not found`);
            }
        });
    }

    function snack(message) {
        customElements.get('s-snackbar').show(message);
    }

    function clickModItem(modItem, event = null, rect = null) {
        //获取鼠标相对于卡片的位置（百分比）
        let x, y, rotateX, rotateY;
        let rotateLevel = -20;
        if (event != null) {
            //如果传入了event，则使用event的位置
            //获取鼠标相对于卡片的位置（百分比）
            x = (event.clientX - rect.left) / rect.width;
            y = (event.clientY - rect.top) / rect.height;
        }
        else {
            //如果没有传入event，且modItem.checked为true，则设置为0，0.7，否则设置为0.7，0 偏移0.2*random
            x = modItem.checked ? 0 : Math.random() / 5 + 0.7;
            y = modItem.checked ? 0.7 : Math.random() / 5;
        }
        //根据鼠标相对于卡片的位置设置反转程度
        rotateX = 2 * (y - 0.5);
        rotateY = -2 * (x - 0.5);

        //反转卡片状态
        modItem.checked = !modItem.checked;
        modItem.setAttribute('checked', modItem.checked ? 'true' : 'false');

        if (!modItem.inWindow) {
            //如果modItem不在视窗内，则不进行动画
            return;
        }


        //添加动画
        if (modItem.checked == true) {

            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });
        }
        else {
            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` },

                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(0.88)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });
        }
    }

    //获得mod的显示图片
    async function getModImagePath(mod) {
        //图片优先使用modInfo.imagePath，如果没有则尝试使用 mod文件夹下的preview.png或者preview.jpg或者preview.jpeg，如果没有则使用默认图片
        var modImageName = '';
        const modPath = path.join(rootdir, 'modResourceBackpack', mod);
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        const modInfoImagePath = modInfo.imagePath;

        if (modInfoImagePath && fs.existsSync(path.join(modPath, modInfoImagePath))) {
            modImageName = modInfoImagePath;
            return path.join(modPath, modImageName);
        }

        const tryImageNames = ['preview.png', 'preview.jpg', 'preview.jpeg'];
        tryImageNames.forEach(imageName => {
            if (fs.existsSync(path.join(modPath, imageName))) {
                modImageName = imageName;
            }
        });

        if (modImageName != '') {
            // 如果找到了图片文件，说明mod文件夹下有preview图片，但是没有在modInfo中设置imagePath，所以需要将其保存到modInfo中
            modInfo.imagePath = modImageName;
            ipcRenderer.invoke('set-mod-info', mod, modInfo);

            // 使用snack提示用户自动保存了图片
            snack(`Original image is ${modInfoImagePath},but not found, find ${modImageName} instead, auto saved to mod.json`);
            return path.join(modPath, modImageName);
        }

        // 如果都没有的话，尝试寻找mod文件夹下的第一个图片文件
        const files = fs.readdirSync(path.join(rootdir, 'modResourceBackpack', mod));
        const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
        //如果没有图片文件，则使用默认图片,之后直接跳出程序
        if (imageFiles.length <= 0) {
            return path.join(__dirname, 'default.png');
        }

        modImageName = imageFiles[0];
        //debug
        //console.log(`modImageName:${modImageName}`);
        return path.join(modPath, modImageName);
    }

    //使用替换的方式而不是清空再添加的方式实现loadModList，减少页面重绘次数
    async function loadModList() {
        //加载mod列表
        mods = await ipcRenderer.invoke('get-mods');
        //获取当前modContainer的所有子元素
        const modContainerCount = modContainer.childElementCount;

        //使用fragment来批量添加modItem，减少重绘次数
        const fragment = document.createDocumentFragment();

        mods.forEach(async (mod, index) => {
            const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
            var modCharacter = modInfo.character ? modInfo.character : 'Unknown';
            if (!modCharacters.includes(modCharacter)) {
                modCharacters.push(modCharacter);
            }

            var modImagePath = await getModImagePath(mod);
            var modDescription = modInfo.description ? modInfo.description : 'No description';

            var modItem;
            if (index < modContainerCount) {
                modItem = modContainer.children[index];
            }
            else {
                modItem = document.createElement('s-card');
                modItem.innerHTML = `
                <div slot="image" style="height: 200px;">
                        <img src="" alt="" loading="lazy"/>
                    </div>
                    <div slot="headline" id="mod-item-headline"></div>
                    <div slot="subhead" id="mod-item-subhead">
                    </div>
                    <div slot="text" id="mod-item-text">
                        <s-scroll-view>
                            <p id="mod-item-description"></p>
                            <div class="placeholder"></div>
                        </s-scroll-view>
                    </div>
                `
                fragment.appendChild(modItem);
            }

            modItem.className = 'mod-item';
            modItem.checked = false;
            modItem.clickable = true;
            modItem.inWindow = false;
            modItem.id = mod;
            modItem.character = modCharacter;
            modItem.style = '';
            modItem.querySelector('img').src = modImagePath;
            modItem.querySelector('img').alt = mod;
            modItem.querySelector('#mod-item-headline').textContent = mod;
            modItem.querySelector('#mod-item-subhead').textContent = modCharacter;
            modItem.querySelector('#mod-item-description').textContent = modDescription;

            //debug
            //console.log(`load modItem ${mod} , character:${modCharacter} , description:${modDescription}`);
            if (fragment.children.length == mods.length - modContainerCount) {
                //如果是最后一个modItem,意味着所有的modItem都已经添加到fragment中，将fragment添加到modContainer中

                modContainer.appendChild(fragment);

                //如果是compactMode则需要将modContainer添加上compact = true
                if (compactMode) {
                    modContainer.setAttribute('compact', 'true');
                }
                else {
                    modContainer.setAttribute('compact', 'false');
                }

                //将所有的的modItem添加到observer中
                document.querySelectorAll('.mod-item').forEach(item => {
                    observer.observe(item);
                });
            }

        });

        //删除多余的modItem
        if (mods.length < modContainerCount) {
            for (let i = mods.length; i < modContainerCount; i++) {
                modContainer.removeChild(modContainer.children[mods.length]);
            }
        }
    }

    //使用事件委托处理点击事件，减少事件绑定次数
    modContainer.addEventListener('click', (event) => {
        const modItem = event.target.closest('.mod-item');
        if (modItem) {
            clickModItem(modItem, event, modItem.getBoundingClientRect());
            currentMod = modItem.id;
            showModInfo(currentMod);
            //一旦点击了modItem，将其保存在currentPreset中
            if (currentPreset != '') {
                savePreset(currentPreset);
            }

            //如果开启了自动应用，则自动应用
            if (ifAutoApply) {
                applyMods();
            }

            let cardHeight = compactMode ? '150px' : '350px';
            //如果modFilterCharacter为Selected，则将modItem切换为 clicked = false 的时候，将其隐藏
            if (modFilterCharacter == 'Selected' && !modItem.checked) {
                //添加消失动画
                modItem.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });
                //当动画结束后，将其display设置为none（也就是0.3秒后）
                setTimeout(() => {
                    modItem.style.display = 'none';
                }, 300);
                //让其他的元素进行浮动，填补空缺
                //mod-container是grid布局，所以可以获取当前点击的modItem的行和列，然后将其左边的modItem左移，将下一行的第一个modItem移到当前行的最后
                const modItems = document.querySelectorAll('.mod-item[style="display: block;"]');
                //通过modContainer的width和modItem的width计算出每行的modItem数量
                const modItemPerRow = Math.floor(modContainer.offsetWidth / 250);
                //获取当前点击的modItem的行和列
                const modItemIndex = Array.from(modItems).indexOf(modItem);
                const modItemRow = Math.floor(modItemIndex / modItemPerRow);
                const modItemColumn = modItemIndex % modItemPerRow;


                //debug
                console.log(`modItemPerRow:${modItemPerRow} modItemIndex:${modItemIndex} modItemRow:${modItemRow} modItemColumn:${modItemColumn}`);

                //遍历所有的modItem，将当前行的mod左移以填补空缺，将下一行的第一个mod移到当前行的最后，以此类推
                modItems.forEach(item => {
                    const itemIndex = Array.from(modItems).indexOf(item);
                    const itemRow = Math.floor(itemIndex / modItemPerRow);
                    const itemColumn = itemIndex % modItemPerRow;
                    if (itemRow == modItemRow && itemColumn > modItemColumn) {
                        //debug
                        //console.log(`move ${item.id} to left`);
                        item.animate([
                            { transform: `translateX(0px)` },
                            { transform: `translateX(-250px)` }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (itemRow > modItemRow && itemColumn == 0) {
                        //debug
                        //console.log(`move ${item.id} to up`);
                        item.animate([
                            { transform: `translateY(0px) translateX(0px)` },
                            { transform: `translateY(-${cardHeight}) translateX(${(modItemPerRow - 1) * 260}px)` }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (itemRow > modItemRow && itemColumn > 0) {
                        //debug
                        //console.log(`move ${item.id} to left`);
                        item.animate([
                            { transform: `translateX(0px)` },
                            { transform: `translateX(-250px)` }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                }
                );
            }

        }
    }
    );

    //使用事件委托处理拖放事件：
    // 当拖动文件且悬停在modItem上时，显示拖动的mod的信息
    modContainer.addEventListener('dragover', (event) => {
        event.preventDefault();

        const modItem = event.target.closest('.mod-item'); //获取拖动的modItem
        if (modItem) {
            event.dataTransfer.dropEffect = 'copy';

            currentMod = modItem.id;
            showModInfo(currentMod);
        }

    });

    modContainer.addEventListener('drop', (event) => {
        event.preventDefault();

        const modItem = event.target.closest('.mod-item');
        if (!modItem) {
            snack('Invalid drop target');
            return;
        }

        const mod = modItem.id;
        currentMod = mod;

        var modInfo = ipcRenderer.invoke('get-mod-info', mod);
        // 获取拖动的文件
        const files = event.dataTransfer.files;

        // debug
        console.log(`drop on ${mod} , files:`, files);

        // 如果拖拽的是文件
        if (files.length > 0) {
            const file = files[0];

            // 校验文件是否是图片
            if (file.type.startsWith('image/')) {
                // 交给 handleImageDrop 处理
                handleImageDrop(file, modItem, mod);
                return;
            }

            //todo: 如果拖入的是zip文件，则交给handleZipDrop处理，但是解压zip文件似乎需要使用别的库，暂时不实现
            // // 如果拖入的是zip文件，则交给handleZipDrop处理
            // if (file.name.endsWith('.zip')) {
            //     handleZipDrop(file, modItem, mod);
            //     return;
            // }

            snack('Invalid file type');        // 如果不是图片文件，则提示用户
            return;
        }
    });

    function handleImageDrop(file, modItem, mod) {
        // 因为electron的file对象不是标准的file对象，所以需要使用reader来读取文件
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            updateModCardCover(imageUrl, modItem, mod);
        };
        reader.readAsDataURL(file);
    }

    async function updateModCardCover(imageUrl, modItem, mod) {
        // 将图片保存到modResourceBackpack文件夹中，文件名为preview+后缀名，并且将其保存到mod.json中
        //debug
        console.log(`update mod card cover of ${mod} with ${imageUrl}`);
        const imageExt = imageUrl.split(';')[0].split('/')[1];
        const modImageName = `preview.${imageExt}`;
        const modImageDest = path.join(rootdir, 'modResourceBackpack', mod, modImageName);
        fs.writeFileSync(modImageDest, imageUrl.split(',')[1], 'base64');

        // 更新mod.json
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        //debug
        console.log(`modInfo:`, modInfo);
        modInfo.imagePath = modImageName;
        ipcRenderer.invoke('set-mod-info', mod, modInfo);

        // 更新modItem的图片
        modItem.querySelector('img').src = modImageDest;

        // 刷新侧边栏的mod信息
        showModInfo(mod);

        // snack提示
        snack(`Updated cover for ${mod}`);
    }

    async function loadPresets() {
        // presetContainer.innerHTML = '';
        // const presets = await ipcRenderer.invoke('get-presets');
        // presets.forEach(preset => {
        //     const presetItem = document.createElement('s-button');
        //     presetItem.id = 'preset-item';
        //     presetItem.type = "elevated";
        //     presetItem.name = preset;
        //     presetItem.innerHTML = preset;
        //     presetContainer.appendChild(presetItem);
        // });
        // 上面的方法会导致preset元素闪烁，使用重复利用元素的方法来减少重绘次数
        editMode = false;
        const presets = await ipcRenderer.invoke('get-presets');
        const presetContainerCount = presetContainer.childElementCount;
        const fragment = document.createDocumentFragment();
        presets.forEach((preset, index) => {
            var presetItem;
            if (index < presetContainerCount) {
                presetItem = presetContainer.children[index];
            }
            else {
                presetItem = document.createElement('s-button');
                presetItem.className = 'left-adhesive-button font-hongmeng';
                presetItem.id = 'preset-item';
                presetItem.type = "elevated";
                presetItem.name = preset;
                presetItem.innerHTML = preset;
                fragment.appendChild(presetItem);
            }
            presetItem.name = preset;
            presetItem.innerHTML = preset;
            if (fragment.children.length == presets.length - presetContainerCount) {
                presetContainer.appendChild(fragment);
            }
        });

        //删除多余的presetItem
        if (presets.length < presetContainerCount) {
            for (let i = presets.length; i < presetContainerCount; i++) {
                presetContainer.removeChild(presetContainer.children[presets.length]);
            }
        }
    }

    function deletePreset(presetName) {
        //debug
        console.log("🔴delete presetItem" + presetName);

        //禁止删除和currentPreset相同的preset
        if (currentPreset == presetName) {
            snack('Cannot delete current preset');
            return;
        }

        ipcRenderer.invoke('delete-preset', presetName);
        //将自己的父元素删除
        const allpresetItems = document.querySelectorAll('#preset-item');
        allpresetItems.forEach(item => {
            if (item.name == presetName) {
                //删除自己的父元素
                item.parentNode.removeChild(item);
            }
        });
    }

    async function applyPreset(presetName) {
        console.log("🟢load presetItem " + presetName);
        
        if (currentPreset == presetName) {
            //如果点击的是当前的preset，则不进行任何操作
            return;
        }

        currentPreset = presetName;

        const selectedMods = await ipcRenderer.invoke('load-preset', presetName);
        document.querySelectorAll('.mod-item').forEach(item => {
            //debug
            //console.log(`item.id:${item.id} selectedMods:${selectedMods.includes(item.id)}`);
            if (item.checked && !selectedMods.includes(item.id)) {
                clickModItem(item);
            }
            if (!item.checked && selectedMods.includes(item.id)) {
                clickModItem(item);
            }
        });

        //更改样式
        const allpresetItems = document.querySelectorAll('#preset-item');
        allpresetItems.forEach(item => {
            item.type = 'elevated';
            if (item.name == presetName) {
                item.type = 'filled';
            }
        }
        );


        //刷新筛选
        if (modFilterCharacter == 'Selected') {
            filterMods();
        }
        //如果开启了自动应用，则自动应用
        if (ifAutoApply) {
            applyMods();
        }
    }

    //使用事件委托处理点击事件，减少事件绑定次数
    presetContainer.addEventListener('click', async (event) => {
        const presetItem = event.target.closest('#preset-item');
        presetItem? editMode? deletePreset(presetItem.name): applyPreset(presetItem.name): null;
    });

    function filterMods() {
        //如果modFilterCharacter为All，则将所有的modItem显示
        if (modFilterCharacter == 'All') {
            //将所有的modItem显示
            document.querySelectorAll('.mod-item').forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        //如果modFilterCharacter为Selected，则将所有checked="true"的modItem显示
        if (modFilterCharacter == 'Selected') {
            //将所有的modItem显示
            document.querySelectorAll('.mod-item').forEach(item => {
                if (item.checked == true && item.style.display == 'none') {
                    //如果不在视窗内，则直接显示
                    if (!item.inWindow) {
                        item.style.display = 'block';
                        return;
                    }
                    //添加出现动画
                    item.style.display = 'block';
                    item.animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], {
                        duration: 300,
                        easing: 'ease-in-out',
                        iterations: 1
                    });
                }
                if (item.checked == false && item.style.display != 'none') {
                    //如果不在视窗内，则直接隐藏
                    if (!item.inWindow) {
                        item.style.display = 'none';
                        return;
                    }
                    //添加消失动画
                    item.animate([
                        { opacity: 1 },
                        { opacity: 0 }
                    ], {
                        duration: 300,
                        easing: 'ease-in-out',
                        iterations: 1
                    });
                    //当动画结束后，将其display设置为none（也就是0.3秒后）
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
            return;
        }
        //如果modFilterCharacter为其他，则将所有character=modFilterCharacter的modItem显示
        document.querySelectorAll('.mod-item').forEach(item => {
            if (modFilterCharacter == item.character) {
                item.style.display = 'block';
            }
            else {
                item.style.display = 'none';
            }
        }
        );
    }

    function refreshModFilter() {
        //debug
        console.log(`modCharacters:${modCharacters}`);

        modFilter.innerHTML = '';
        modCharacters.forEach(character => {
            const filterItem = document.createElement('s-chip');
            filterItem.type = 'default';
            filterItem.class = 'font-hongmeng';
            filterItem.id = character;
            filterItem.selectable = true;
            filterItem.innerHTML = `<p>${character}</p>`;
            modFilter.appendChild(filterItem);
        }
        );

        //使用事件委托处理点击事件，减少事件绑定次数
        modFilter.addEventListener('click', (event) => {
            const filterItem = event.target.closest('s-chip');
            if (filterItem) {
                const character = filterItem.id;
                //debug
                console.log("clicked filterItem " + character);
                modFilterCharacter = character;
                modFilterAll.type = 'default';
                modFilterSelected.type = 'default';
                //将自己的type设置为filled，其他的设置为default
                const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
                allfilterItems.forEach(item => {
                    item.type = 'default';
                });
                filterItem.type = 'filled-tonal';
                filterMods();
            }
        }
        );
    }

    async function savePreset(presetName) {
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            // await loadPresets();
        }
    }

    async function showModInfo(mod) {
        const modInfo = await ipcRenderer.invoke('get-mod-info', mod);
        //将info显示在 modInfo 中
        modInfoName.textContent = mod;
        modInfoCharacter.textContent = modInfo.character ? modInfo.character : 'Unknown';
        modInfoDescription.textContent = modInfo.description ? modInfo.description : 'No description';
        modInfoImage.src = await getModImagePath(mod);
    }



    //-----------------------------事件监听--------------------------------
    

    //-全屏按钮
    fullScreenButton.addEventListener('click', toggleFullscreen);

    async function toggleFullscreen() {
        isFullScreen = await ipcRenderer.invoke('toggle-fullscreen');
        if (!isFullScreen) {
            fullScreenSvgpath.setAttribute('d', 'M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z');
        }
        else {
            fullScreenSvgpath.setAttribute('d', 'M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z');
        }
    }

    //-compactMode按钮
    compactModeButton.addEventListener('click', () => {
        //切换compactMode
        compactMode = !compactMode;
        const icon = compactModeButton.querySelector('path');
        if (compactMode) {
            //设置按钮图标样式
            icon.setAttribute('d', 'M480-80 240-320l57-57 183 183 183-183 57 57L480-80ZM298-584l-58-56 240-240 240 240-58 56-182-182-182 182Z');

            modContainer.setAttribute('compact', 'true');
            //添加折叠动画，modContainer的子物体modItem的高度从350px变为150px
            //动画只对窗口内的modItem进行动画
            const modItems = document.querySelectorAll('.mod-item');
            modItems.forEach(item => {
                if (!item.inWindow) {
                    return;
                }
                item.animate([
                    { height: '350px' },
                    { height: '150px' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });

                //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓上移
                //获取这些元素
                //遍历子元素，匹配slot属性
                item.childNodes.forEach(child => {
                    if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
                        child.animate([
                            { transform: 'translateY(200px)' },
                            { transform: 'translateY(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (child.slot == 'image') {
                        //获取slot下的img元素
                        const img = child.querySelector('img');
                        img.animate([
                            { opacity: 1, filter: 'blur(0px)' },
                            { opacity: 0.2, filter: 'blur(5px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                });
            });
        }
        else {
            //设置按钮图标样式
            icon.setAttribute('d', 'm356-160-56-56 180-180 180 180-56 56-124-124-124 124Zm124-404L300-744l56-56 124 124 124-124 56 56-180 180Z');

            modContainer.setAttribute('compact', 'false');
            //添加展开动画，modContainer的子物体modItem的高度从150px变为350px
            //动画只对窗口内的modItem进行动画
            const modItems = document.querySelectorAll('.mod-item');
            modItems.forEach(item => {
                if (!item.inWindow) {
                    return;
                }
                item.animate([
                    { height: '150px' },
                    { height: '350px' }
                ], {
                    duration: 300,
                    easing: 'ease-in-out',
                    iterations: 1
                });

                //item下的slot=headline，slot=text，slot=subhead的div元素会缓缓下移
                //获取这些元素
                //遍历子元素，匹配slot属性
                item.childNodes.forEach(child => {
                    if (child.slot == 'headline' || child.slot == 'subhead' || child.slot == 'text') {
                        child.animate([
                            { transform: 'translateY(-200px)' },
                            { transform: 'translateY(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                    if (child.slot == 'image') {
                        //获取slot下的img元素
                        const img = child.querySelector('img');
                        img.animate([
                            { opacity: 0.2, filter: 'blur(5px)' },
                            { opacity: 1, filter: 'blur(0px)' }
                        ], {
                            duration: 300,
                            easing: 'ease-in-out',
                            iterations: 1
                        });
                    }
                });

            });
        }
    });


    //-setting-dialog相关

    //-展示设置页面
    settingsShowButton.addEventListener('click', async () => {
        // 显示或隐藏settingsDialog
        showDialog(settingsDialog);

        //显示当前rootdir
        rootdirInput.value = rootdir;

        //显示当前 auto-apply 的值
        autoApplySwitch.checked = ifAutoApply;

        //显示当前 auto-refresh-in-zzz 的值
        autoRefreshInZZZSwitch.checked = ifAutofreshInZZZ;

        //显示当前exePath
        getExePathInput.querySelector('p').innerHTML = exePath;
    });


    //设置主题
    themes.forEach(item => {
        item.addEventListener('click', () => {
            setTheme(item.id);
        }
        );
    }
    );

    //设置rootdir
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
                loadModList().then(() => { refreshModFilter(); });
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

    //是否开启自动应用
    autoApplySwitch.addEventListener('change', () => {
        ifAutoApply = autoApplySwitch.checked;
        //保存ifAutoApply
        localStorage.setItem('auto-apply', ifAutoApply);
        //debug
        console.log("ifAutoApply: " + ifAutoApply);
    });

    //是否开启自动刷新
    autoRefreshInZZZSwitch.addEventListener('change', () => {
        ifAutofreshInZZZ = autoRefreshInZZZSwitch.checked;
        //保存ifAutofreshInZZZ
        localStorage.setItem('auto-refresh-in-zzz', ifAutofreshInZZZ);
        //debug
        console.log("ifAutofreshInZZZ: " + ifAutofreshInZZZ);

        if (ifAutofreshInZZZ) {
            //尝试获得管理员权限
            //tryGetAdmin();
        }
    });

    //获得自动刷新的exe 的路径

    getExePathInput.addEventListener('click', async () => {
        const path = await ipcRenderer.invoke('get-exePath');
        //debug
        console.log("exePath: " + path);

        if (ipcRenderer.invoke('check-exePath', exePath) && path) {
            exePath = path;
            //显示exePath
            getExePathInput.querySelector('p').innerHTML = path;
            //保存exePath
            localStorage.setItem('exePath', exePath);

            await ipcRenderer.invoke('set-exePath', path);
        }
        else {
            snack('Please select the correct exe path');
        }
    });


    function tryGetAdmin() {
        //尝试获取管理员权限

        //使用powershell运行下面的命令
        //Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs 获取管理员权限
        //Start-Process $electronAppPath 使用管理员权限打开electron程序
        const ps1Path = path.join(exePath, `..`, `runZZZMMasAdmin.ps1`);
        const electronAppPath = path.join(exePath, `..`, `..`, `ZZZModManager.exe`);
        //debug
        console.log("ps1Path: " + ps1Path);

        const options = { shell: true };

        require('child_process').exec(`start powershell.exe "${ps1Path}" -electronAppPath "${__dirname}"
            `, options, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(stdout);
            snack('Successfully get admin permission' + stdout);
        }
        );
        //debug

        console.log("tryGetAdmin");
    }

    //-mod启用
    applyBtn.addEventListener('click', async () => {
        applyMods();
        //使用s-snackbar显示提示
        snack('Mods applied');
    })

    async function tryRefreshInZZZ() {
        //尝试刷新,使用async，防止阻塞
        //使用cmd激活刷新的exe程序
        if (exePath === '') {
            console.log("exePath is empty");
            return '';
        }

        const cmd = `start "" "${exePath}" /min`;
        let stdout;
        console.log(`cmd: ${cmd}`);

        try {
            // 执行exe程序
            stdout = require('child_process').execSync(cmd, { encoding: 'utf-8' });
            console.log('stdout:', stdout);
            // 如果没有抛出异常，说明程序正常退出，退出状态码为0
            console.log('程序正常退出，退出状态码: 0');
        } catch (error) {
            // 如果程序非正常退出，这里可以捕获到错误
            if (error.status) {
                console.error(`程序非正常退出，退出状态码: ${error.status}`);
            } else {
                // 处理其他类型的错误
                console.error('发生了一个错误：', error.message);
            }
        }

        console.log(`succeed to execute ${cmd}，refresh-in-zzz.exe return: ${stdout}`);
        snack('Successfully refresh in ZZZ' + stdout);

        return exePath;
    }

    const unknownModConfirmButton = document.getElementById('unknown-mod-confirm');
    const unknownModIgnoreButton = document.getElementById('unknown-mod-ignore');
    unknownModConfirmButton.addEventListener('click', async () => {
        //将Mods文件夹里面的文件夹移动到modResourceBackpack文件夹，跳过已经存在的文件夹
        const modLoaderDir = path.join(rootdir, 'Mods');
        const modBackpackDir = path.join(rootdir, 'modResourceBackpack');
        const unknownDirs = fs.readdirSync(modLoaderDir).filter(file => !fs.existsSync(path.join(modBackpackDir, file)));
        unknownDirs.forEach(dir => {
            //移动文件夹,使用异步函数
            fs.rename(path.join(modLoaderDir, dir), path.join(modBackpackDir, dir), (err) => {
                if (err) {
                    alert(err);
                }
                else {
                    console.log(`move ${dir} to modResourceBackpack`);
                }
            });
        });
    });

    unknownModIgnoreButton.addEventListener('click', async () => {
        //忽略未知文件夹
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        await ipcRenderer.invoke('apply-mods', selectedMods);
    });

    //-mod筛选相关

    modFilterScroll.addEventListener('wheel', (e) => {
        e.preventDefault();
        modFilterScroll.scrollLeft += e.deltaY;
    }
    );

    //点击All按钮时，将modFilterCharacter设置为All，并且将其他的type设置为default
    modFilterAll.addEventListener('click', () => {
        modFilterCharacter = 'All';
        modFilterAll.type = 'filled-tonal';
        modFilterSelected.type = 'default';
        //将其他的type设置为default
        const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
        allfilterItems.forEach(item => {
            item.type = 'default';
        });
        filterMods();
    }
    );

    //点击selected按钮时，将modFilterCharacter设置为selected，并且将其他的type设置为default
    modFilterSelected.addEventListener('click', () => {
        modFilterCharacter = 'Selected';
        modFilterSelected.type = 'filled-tonal';
        modFilterAll.type = 'default';
        //将其他的type设置为default
        const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
        allfilterItems.forEach(item => {
            item.type = 'default';
        });
        filterMods();
    }
    );


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
        showDialog(addPresetDialog);
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

        //要求用户手动刷新
        snack('Please refresh the mod list after initializing the configuration');
        showDialog(refreshDialog);
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

    //打开mod链接
    openModUrlButton.addEventListener('click', async () => {
        //debug
        console.log("clicked openModUrlButton");
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        const modInfo = await ipcRenderer.invoke('get-mod-info', currentMod);
        if (modInfo.url) {
            await ipcRenderer.invoke('open-external-link', modInfo.url);
        }
        else {
            snack('No url found, please edit mod info');
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

    //用来比较modInfo的内容是否有改变，如果有改变则显示保存按钮
    let currentModInfo;
    let currentImagePath;
    let tempModInfo;
    let tempImagePath;

    //编辑mod.json文件
    editModInfoButton.addEventListener('click', async () => {
        //debug
        console.log("clicked editModInfoButton");

        //改为程序内编辑，而不是打开外部编辑器
        if (currentMod == '') {
            snack('Please select a mod');
            return;
        }
        //打开编辑对话框
        //获取mod的信息，填充到对话框中
        const modInfo = await ipcRenderer.invoke('get-mod-info', currentMod);
        //进行深拷贝，以便比较是否有改变
        currentModInfo = JSON.parse(JSON.stringify(modInfo));
        tempModInfo = JSON.parse(JSON.stringify(modInfo));
        currentImagePath = await getModImagePath(currentMod);
        tempImagePath = await getModImagePath(currentMod);

        //debug
        console.log(`modInfo:${modInfo}`);
        //填充modInfoDialog
        editModInfoDialog.querySelector('#editDialog-mod-info-name').textContent = currentMod;
        editModInfoDialog.querySelector('#editDialog-mod-info-character').textContent = modInfo.character ? modInfo.character : 'Unknown';
        editModInfoDialog.querySelector('#editDialog-mod-info-image').src = await getModImagePath(currentMod);

        editModInfoDialog.querySelector('#edit-mod-name').textContent = currentMod;
        editModInfoDialog.querySelector('#edit-mod-character').value = modInfo.character ? modInfo.character : '';
        editModInfoDialog.querySelector('#edit-mod-url').value = modInfo.url ? modInfo.url : '';
        editModInfoDialog.querySelector('#edit-mod-description').value = modInfo.description ? modInfo.description : '';


        //显示对话框
        showDialog(editModInfoDialog);
    });

    //打开mod文件夹
    const editModInfoOpenFolderButton = document.getElementById('edit-mod-name');
    editModInfoOpenFolderButton.addEventListener('click', async () => {
        //打开mod文件夹
        await ipcRenderer.invoke('open-mod-folder', currentMod);
        //要求用户手动刷新
        snack('Please refresh the mod list after editing the mod');
        showDialog(refreshDialog);
    }
    );


    //获取选择的图片
    const editModInfoImagePreview = document.getElementById('edit-mod-image-select');
    editModInfoImagePreview.addEventListener('click', async () => {
        //debug
        console.log("clicked editModInfoImagePreview");
        //打开文件选择对话框，选择图片
        const imagePath = await ipcRenderer.invoke('select-image');

        //这里只显示，保存在点击保存按钮时才会保存
        if (imagePath) {
            //debug
            console.log(`imagePath:${imagePath}`);

            //显示图片
            editModInfoDialog.querySelector('#editDialog-mod-info-image').src = imagePath;
            tempImagePath = imagePath;
        }
        else {
            //debug
            console.log("no image selected");
            alert("no image selected");
        }
    });

    //保存当前编辑的mod的信息
    function saveCurrentModInfo() {
        //debug
        console.log("clicked saveCurrentModInfo");
        //保存当前编辑的mod的信息
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value;

        //将图片保存到mod文件夹下，命名为preview + 后缀名
        //如果已经存在则覆盖，并且将文件名保存到mod.json文件中
        const imagePath = tempImagePath;
        const imageExt = path.extname(imagePath);
        const modImageName = 'preview' + imageExt;
        const modImageDest = path.join(rootdir, 'modResourceBackpack', currentMod, modImageName);

        //复制图片
        console.log(`imagePath:${imagePath} modImageDest:${modImageDest}`);
        //如果是默认图片则不复制
        if (imagePath != path.join(__dirname, 'default.png') && imagePath != modImageDest) {
            //强制覆盖
            fs.copyFileSync(imagePath, modImageDest, fs.constants.COPYFILE_FICLONE);
        }


        //保存到tempModInfo中
        tempModInfo.imagePath = modImageName;

        //debug
        console.log(`tempModInfo:${tempModInfo}`);
        //保存到mod.json文件中
        ipcRenderer.invoke('set-mod-info', currentMod, tempModInfo);

        //更新当前的modInfo
        currentModInfo = tempModInfo;
        currentImagePath = tempImagePath;

        //提示保存成功
        snack('Mod info saved successfully');
        //关闭对话框
        editModInfoDialog.dismiss();
        //刷新mod列表
        loadModList().then(() => { refreshModFilter(); });
    }

    const editModInfoSaveButton = document.getElementById('edit-mod-info-save');
    editModInfoSaveButton.addEventListener('click', async () => {
        //如果当前的modInfo和tempModInfo不一样，则保存
        //保存当前编辑的mod的信息
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value;

        if (JSON.stringify(currentModInfo) != JSON.stringify(tempModInfo) || tempImagePath != currentImagePath) {
            saveCurrentModInfo();
        }
        else {
            //debug
            editModInfoDialog.dismiss();
            console.log("modInfo not changed");
            //打印当前的modInfo和tempModInfo的各个属性
            //console.log(`currentModInfo: character:${currentModInfo.character} description:${currentModInfo.description} imagePath:${currentModInfo.imagePath}`);
            //console.log(`tempModInfo: character:${tempModInfo.character} description:${tempModInfo.description} imagePath:${tempModInfo.imagePath}`);
        }
    });

    //如果取消了编辑，但是有修改，提示是否保存
    const editModInfocancelButton = document.getElementById('edit-mod-info-cancel');
    editModInfocancelButton.addEventListener('click', async () => {
        //窗口消失
        editModInfoDialog.dismiss();
    });

    editModInfoDialog.addEventListener('dismiss', async () => {
        //debug
        console.log("editModInfoDialog dismissed");
        tempModInfo.character = editModInfoDialog.querySelector('#edit-mod-character').value;
        tempModInfo.description = editModInfoDialog.querySelector('#edit-mod-description').value;
        tempModInfo.url = editModInfoDialog.querySelector('#edit-mod-url').value

        //打印当前的modInfo和tempModInfo的各个属性
        console.log(`currentModInfo: character:${currentModInfo.character} description:${currentModInfo.description} url:${currentModInfo.url} imagePath:${currentModInfo.imagePath}`);
        console.log(`tempModInfo: character:${tempModInfo.character} description:${tempModInfo.description} url:${tempModInfo.url} imagePath:${tempModInfo.imagePath}`);
        if (JSON.stringify(currentModInfo) != JSON.stringify(tempModInfo) || tempImagePath != currentImagePath) {
            //提示是否保存
            showDialog(ifSaveChangeDialog);
        }
    }
    );

    const saveChangeConfirmButton = document.getElementById('save-change-confirm');
    saveChangeConfirmButton.addEventListener('click', async () => {
        //保存当前的modInfo
        saveCurrentModInfo();
        //关闭对话框
        editModInfoDialog.dismiss();
    });

    window.addEventListener('unload', function (event) {
        localStorage.setItem('fullscreen', isFullScreen);

        if (!isFullScreen) {
            localStorage.setItem('bounds', JSON.stringify({
                x: window.screenX,
                y: window.screenY,
                width: window.outerWidth,
                height: window.innerHeight,
            }));
        }
    });


    // about-dialog
    const linkButton = document.querySelectorAll('.link-button');
    linkButton.forEach(button => {
        button.addEventListener('click', async () => {
            const url = button.getAttribute('link');
            //debug
            console.log(`clicked link-button ${url}`);
            await ipcRenderer.invoke('open-external-link', url);
        });
    });
});