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

    //控制按钮
    const settingsShowButton = document.getElementById('settings-show-button');
    const fullScreenButton = document.getElementById('fullscreen-button');
    const fullScreenSvgpath = document.getElementById('fullscreen-button-svgpath');

    //mod筛选相关
    const modFilterScroll = document.getElementById('mod-filter-scroll');
    const modFilter = document.getElementById('mod-filter');
    const modFilterAll = document.getElementById('mod-filter-all');

    //mod列表相关
    const modContainer = document.getElementById('mod-container');
    const applyBtn = document.getElementById('apply-btn');

    const savePresetBtn = document.getElementById('save-preset-btn');
    let mods = [];
    let modCharacters = [];
    let modFilterCharacter = 'All';

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
        refreshModFilter();
    }



    //- 内部函数
    function setTheme(theme) {
        const sPages = document.querySelectorAll('s-page');
        localStorage.setItem('theme', theme);
        sPages.forEach(page => {
            page.theme = theme;
        }
        );

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
    setTheme(localStorage.getItem('theme') || 'dark');

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

    function clickModItem(modItem, event = null) {
        //debug
        console.log("clicked modItem " + modItem.id);
        //显示mod的信息
        showModInfo(modItem.id);

        //获取鼠标相对于卡片的位置（百分比）
        let x, y, rotateX, rotateY;
        let rotateLevel = -20;
        if (event != null) {
            //如果传入了event，则使用event的位置
            x = (event.clientX - modItem.getBoundingClientRect().left) / modItem.offsetWidth;
            y = (event.clientY - modItem.getBoundingClientRect().top) / modItem.offsetHeight;
        }
        else {
            //如果没有传入event，则使用卡片的右上角位置
            if(modItem.checked){
                x = 0.5;
                y = 0.5;
            }
            else{
                x = 1;
                y = 0;
            }
        }
        //根据鼠标相对于卡片的位置设置反转程度
        rotateX = 2 * (y - 0.5);
        rotateY = -2 * (x - 0.5);


        //!debug
        //console.log(`x:${x} y:${y} rotateX:${rotateX} rotateY:${rotateY}`);

        modItem.checked = !modItem.checked;
        //改变modItem的背景颜色
        let item = modItem;
        if (item.checked == true) {
            item.type = 'filled';
            //让其背景变为荧光黄
            item.style.backgroundColor = 'var(--s-color-surface-container-low)';
            item.style.border = '5px solid transparent';
            item.style.backgroundClip = 'padding-box, border-box';
            item.style.backgroundOrigin = 'padding-box, border-box';
            item.style.backgroundImage = 'linear-gradient(to right, var(--s-color-surface-container-low), var(--s-color-surface-container-low)), linear-gradient(90deg, var(--s-color-primary), #e4d403)';
            item.style.boxSizing = 'border-box';

            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` },
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1.05)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 15}px,${rotateX * 15}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` }
            ], {
                duration: 700,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });

            modItem.style.transform = `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)`;
        }
        else {
            item.type = '';
            //让其背景变回原来的颜色
            item.style.backgroundColor = 'var(--s-color-surface-container-low)';
            item.style.border = '';


            modItem.animate([
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg) scale(0.95)` },

                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(0.9)` },
                //缩小一点
                { transform: `perspective( 500px ) translate(${-rotateY * 5}px,${rotateX * 5}px) rotateX(${rotateX * rotateLevel}deg) rotateY(${rotateY * rotateLevel * 0.2}deg) scale(1)` },
                { transform: `perspective( 500px ) rotate3d(1,1,0,0deg)` }
            ], {
                duration: 700,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                iterations: 1
            });

            modItem.style.transform = `perspective( 500px ) rotate3d(1,1,0,0deg)`;
        }
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

            if (!modCharacters.includes(modCharacter)) {
                modCharacters.push(modCharacter);
                //debug
                console.log(`add modCharacter:${modCharacter}`);
            }
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
            modItem.checked = false;
            modItem.clickable = true;
            modItem.id = mod;
            modItem.character = modCharacter;
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
                clickModItem(modItem, event);
                currentMod = modItem.id;
                //一旦点击了modItem，将其保存在currentPreset中
                if (currentPreset != '') {
                    savePreset(currentPreset);
                }
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
                    console.log("🟢load presetItem" + presetItem.innerHTML);

                    currentPreset = presetItem.innerHTML;

                    //将其他的type设置为elevated，自己的type设置为filled
                    const allpresetItems = document.querySelectorAll('#preset-item');
                    allpresetItems.forEach(item => {
                        item.type = 'elevated';
                    }
                    );
                    presetItem.type = 'filled';

                    const presetName = presetItem.innerHTML;
                    const selectedMods = await ipcRenderer.invoke('load-preset', presetName);
                    document.querySelectorAll('.mod-item').forEach(item => {
                        //debug
                        console.log(`item.id:${item.id} selectedMods:${selectedMods.includes(item.id)}`);
                        if (item.checked != selectedMods.includes(item.id)) {
                            clickModItem(item);
                        }
                    });
                }
            });
        }
        );
    };


    function filterMods() {
        document.querySelectorAll('.mod-item').forEach(item => {
            if (modFilterCharacter == 'All' || modFilterCharacter == item.character) {
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
            filterItem.selectable = true;
            filterItem.innerHTML = `<p style='width:fit-content; font-weight: bold;'>${character}</p>`;
            filterItem.style = 'margin-right: 5px;';
            filterItem.addEventListener('click', () => {
                //debug
                console.log("clicked filterItem " + character);
                modFilterCharacter = character;
                modFilterAll.type = 'default';
                //将自己的type设置为filled，其他的设置为default
                const allfilterItems = document.querySelectorAll('#mod-filter s-chip');
                allfilterItems.forEach(item => {
                    //获取当前的innerHTML内的p元素内的文本
                    let itemCharacter = item.innerHTML.split('<')[1].split('>')[1].split('<')[0];
                    if (itemCharacter != character) {
                        item.type = 'default';
                        //debug
                        console.log(`set ${item.innerHTML} to default`);
                    }
                    else {
                        item.type = 'filled-tonal';
                        //debug
                        console.log(`set ${item.innerHTML} to filled`);
                    }
                });

                filterMods();
            });
            modFilter.appendChild(filterItem);
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

    const createTapeButton = document.getElementById('create-tape');
    createTapeButton.addEventListener('click', () => {
        const tape = createTape('test', 'test', './src/tape-cover.png');
        document.querySelector('.swiper-container').appendChild(tape);
    });
    function createTape(title, subtitle, imgPath) {
        const tape = document.createElement('div');
        tape.className = 'tape-container';
        tape.innerHTML = `
      <!-- -磁带开始 -->
      <div class="tape-container">
        <!-- 点击区域 -->
        <div class="tape-click-area">
        </div>
        <!-- -磁带脊柱 -->
        <div class='tape-spine'>
          <img src="./src/tape-spine.png" alt="tape-spine">
          <div class="tape-spine-cover  fit-parent-width" style="background-image: url(${imgPath});">
            <!-- 白色衬底 -->
            <div class="tape-spine-cover-mask"></div>
          </div>
          <p class="tape-spine-text font-num">${title}</p>
        </div>
        <!-- -磁带封面 -->
        <!-- 结构为：tape-box > tape-cover-container -->
        <!-- tape-box > tape-body -->
        <div class="tape-box">
          <div class="tape-cover-container">
            <img src="./src/tape-mask.png" alt="tape-mask">
            <div class="tape-cover fit-parent-width" style="background-image: url(${imgPath});">
            </div>
            <!-- 文本 -->
            <p class="tape-cover-title font-num">${title}</p>
            <p class="tape-cover-subtitle font-hongmeng">${subtitle}</p>
          </div>
          <!-- -磁带本体 -->
          <div class="tape-body fit-parent-width"></div>
        </div>
      </div>
      <!-- -磁带结束 -->
        `;

        //事件绑定
        initTapeEvent(tape);
        return tape;
    }

    //-----------------------------事件监听--------------------------------
    let editMode = false;

    //-控制按钮
    settingsShowButton.addEventListener('click', async () => {
        // 显示或隐藏settingsDrawer
        settingsDialog.show();

        //显示主题为当前主题
        const theme = localStorage.getItem('theme') || 'dark';
        const themePicker = document.getElementById('theme-picker');
        //获取 themePicker 下的所有 s-chip 元素
        const themes = themePicker.querySelectorAll('s-chip');
        themes.forEach(item => {
            //将所有的type设置为default
            if (item.id == theme) {
                item.type = 'filled-tonal';
            }
            else {
                item.type = 'default';
            }

            item.addEventListener('click', () => {
                //将所有的type设置为default
                themes.forEach(item => {
                    item.type = 'default';
                });
                //将当前点击的type设置为filled-tonal
                item.type = 'filled-tonal';
                //保存当前的主题
                setTheme(item.id);
            }
            );
        });
        //获取当前rootdir
        rootdirInput.value = rootdir;
    });

    //-全屏按钮
    fullScreenButton.addEventListener('click', async () => {
        const isFullScreen = await ipcRenderer.invoke('toggle-fullscreen');
        if (!isFullScreen) {
            fullScreenSvgpath.setAttribute('d', 'M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z');
        }
        else {
            fullScreenSvgpath.setAttribute('d', 'M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z');
        }
    }
    );


    //-dialog相关
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

    //-mod启用
    applyBtn.addEventListener('click', async () => {
        //获取选中的mods,mod 元素为 mod-item，当其checked属性为true时，表示选中
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        //debug
        console.log("selectedMods: " + selectedMods);
        //检查mods文件夹下是否有modResourceBackpack文件夹没有的文件夹，如果有则提示用户检测到mod文件夹下有未知文件夹，是否将其移动到modResourceBackpack文件夹
        const modLoaderDir = path.join(rootdir, 'Mods');
        const modBackpackDir = path.join(rootdir, 'modResourceBackpack');
        const unknownDirs = fs.readdirSync(modLoaderDir).filter(file => !fs.existsSync(path.join(modBackpackDir, file)));
        if (unknownDirs.length > 0) {
            const dialog = document.getElementById('unknown-mod-dialog');
            dialog.show();
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
    })

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

    modFilterAll.addEventListener('click', () => {
        modFilterCharacter = 'All';
        modFilterAll.type = 'filled-tonal';
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

    //-轮换预设卡片相关
    const translateToDegree = (tape, rotationAngle) => {
        const spine = tape.querySelector('.tape-spine');
        const box = tape.querySelector('.tape-box');
        //debug
        console.log(`tape:${tape}spine:${spine} box:${box}`);
        //打印tape的所有子元素
        //debug
        console.log(tape.children);

        spine.animate([
            { transform: `${spine.style.transform}` },
            { transform: `perspective( 500px ) rotateY(${rotationAngle}deg)` },
        ], {
            duration: 700,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            iterations: 1
        });

        spine.style.transform = `perspective( 500px ) rotateY(${rotationAngle}deg)`;

        box.animate([
            { transform: `${box.style.transform}` },
            { transform: `perspective( 500px ) rotateY(${90 + rotationAngle}deg)` },
        ], {
            duration: 700,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            iterations: 1
        });

        box.style.transform = `perspective( 500px ) rotateY(${90 + rotationAngle}deg)`;

        //调整可点击区域
        const tapeClickArea = tape.querySelector('.tape-click-area');
        //整个形状围绕 20%  处旋转，所以说点击区域从 0% 到 20% 为tape-cover，从 20% 到 100% 为tape-spine
        //其中，因为旋转，左边缘会向右移动，实际宽度为 20% * cos(rotationAngle) + 80%*sin(rotationAngle)
        const spineOriginalWidth = 70;
        const boxOriginalWidth = 240;
        tapeClickArea.style.width = `${spineOriginalWidth * Math.abs(Math.cos(rotationAngle * Math.PI / 180)) + boxOriginalWidth * Math.abs(Math.sin(rotationAngle * Math.PI / 180))}px`;
        tapeClickArea.style.left = `${spineOriginalWidth - spineOriginalWidth * Math.abs(Math.cos(rotationAngle * Math.PI / 180))}px`;

        // tape.style.marginLeft = `${-spineWidth*(1-Math.abs(Math.cos(rotationAngle*Math.PI/180))) + 10}px`;
        // tape.style.marginRight = `${-boxWidth*(1-Math.abs(Math.sin(rotationAngle*Math.PI/180))) + 10}px`;
        //debug
        //console.log(`marginLeft:${spineWidth-spineWidth*Math.abs(Math.cos(rotationAngle*Math.PI/180))} marginRight:${boxWidth - boxWidth*Math.abs(Math.sin(rotationAngle*Math.PI/180))}`);

        setTimeout(() => {
            let spineWidth = spine.getBoundingClientRect().width;
            let boxWidth = box.getBoundingClientRect().width;
            tapeClickArea.style.width = `${spineWidth + boxWidth}px`;
            tapeClickArea.style.left = `${spineOriginalWidth - spineWidth}px`;
        }, 700);
    }

    function initTapeEvent(container) {
        const mouseoverEvent = () => {
            //将其子元素tape-cover左移，tape-body右移，以展示tape-body的内容
            container.querySelector('.tape-cover-container').style.transform = 'translateX(-40%)';
            //增加过渡动画
            container.querySelector('.tape-cover-container').style.transition = 'transform 0.5s';

            //spine也左移
            //container.querySelector('.tape-spine').style.transform = 'translateX(-40%)';
            //增加过渡动画
            container.querySelector('.tape-spine').style.transition = 'transform 0.5s';

            container.querySelector('.tape-body').style.transform = 'translateX(40%)';
            //增加过渡动画
            container.querySelector('.tape-body').style.transition = 'transform 0.5s';
        }

        const mouseoutEvent = () => {
            container.querySelector('.tape-cover-container').style.transform = 'translateX(0)';
            container.querySelector('.tape-spine').style.transform += 'translateX(0)';
            container.querySelector('.tape-body').style.transform = 'translateX(0)';
        }

        container.clicked = false;
        const offAngle = 0;
        const onAngle = -90;
        translateToDegree(container, offAngle);

        const tapeClickArea = container.querySelector('.tape-click-area');
        //点击时，切换展示 侧面tape-spine 或者 tape-cover。
        tapeClickArea.addEventListener('click', () => {
            //debug
            console.log("clicked tapeContainer");

            if (!container.clicked) {
                //spine向后折叠，cover向前展开，container向左移动
                translateToDegree(container, onAngle);

                container.style.transform = 'translateX(-50%)';
                container.style.transition = 'transform 0.7s';


                //延时0.7s，增加鼠标移入移出事件
                mouseoutEvent();

                setTimeout(() => {
                    container.addEventListener('mouseover', mouseoverEvent);
                    container.addEventListener('mouseout', mouseoutEvent);
                    container.clicked = true;
                }, 700);

            }
            else {
                //移除鼠标移入移出事件
                container.removeEventListener('mouseover', mouseoverEvent);
                container.removeEventListener('mouseout', mouseoutEvent);
                mouseoutEvent();


                //spine向前展开，cover向后折叠
                translateToDegree(container, offAngle);

                container.style.transform = 'translateX(0)';
                container.style.transition = 'transform 0.7s';

                container.clicked = false;
            }
        }
        );
    }

    const tapeContainer = document.querySelectorAll('.tape-container');
    tapeContainer.forEach(container => initTapeEvent(container));

    const tapeClickArea = document.querySelectorAll('.tape-click-area');
    tapeClickArea.forEach(area => {
    }
    );

    //当鼠标移出swipe-container时，恢复tape-container的缩放比例
    const swiperContainer = document.querySelector('.swiper-container');
    swiperContainer.onmouseleave = () => {
        const tapeContainer = document.querySelectorAll('.tape-container');
        for (let i = 0; i < tapeContainer.length; i++) {
            tapeContainer[i].style.transform = 'scale(1)';
            tapeContainer[i].style.transition = 'transform 0.5s';
        }
    }

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