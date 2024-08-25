const { ipcRenderer } = require('electron');
const path = require('path');


document.addEventListener('DOMContentLoaded', async () => {
    //- 防止两次加载
    if (!global.isListenerAdded) {
        global.isListenerAdded = true;
        //debug
        console.log("Add event listener");
    }
    else {
        //debug
        console.log("isListenerAdded is true, return");
        return;
    }
    console.log("DOMContentLoaded，add event listener");

    //- 获取元素
    const drawerPage = document.getElementById('drawer-page');

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
    const mods = await ipcRenderer.invoke('get-mods');

    loadModList();

    await loadPresets();


    //- 内部函数
    function loadModList(){
        //加载mod列表
        mods.forEach(async mod => {
            console.log("mod: " + mod);
            //尝试获取mod下的mod.json文件，获取mod的信息和图片
            const modInfo = await ipcRenderer.invoke('get-mod-info', mod); 
            modCharacter = modInfo.character ? modInfo.character : 'Unknown';
            modImagePath = modInfo.imagePath ? path.join(__dirname, 'modResourceBackpack', mod, modInfo.imagePath) : path.join(__dirname, 'default.png');
            modDescription = modInfo.description ? modInfo.description : 'No description';
    
            //debug
            console.log(`mod:${mod} modCharacter:${modCharacter} modImagePath:${modImagePath} modDescription:${modDescription}`);
    
    
            //使用s-card以达到更好的显示效果
            const modItem = document.createElement('s-card');
            modItem.className = 'mod-item';
            modItem.checked = true;
            modItem.clickable = true;
            modItem.id = mod;
            modItem.innerHTML = `
                  <div slot="image" style="height: 200px;">
                        <img src="${modImagePath}" alt="${mod}" style="width: 100% ;height:100%;max-width: 100%; max-height: 100%; object-fit: cover;" />
                  </div>
                  <div slot="headline">${mod}</div>
                  <div slot="subhead">${modCharacter}</div>
                  <div slot="text">Cards are often used for grid lists, which provide click effects</div>`;
        
            modContainer.appendChild(modItem);
    
            //点击modItem时，选中或取消选中
            modItem.addEventListener('click', () => {
                //debug
                console.log("clicked modItem");
    
                modItem.checked = !modItem.checked;
                refreshModList();
            });
            
        });
    }

    async function loadPresets(){
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
                console.log("🔴presetItem"+presetItem.innerHTML);
                if (editMode) {
                    //innerHtml 现在包含了删除按钮，所以不再是presetName，而是presetName+删除按钮，所以需要提取presetName
                    const presetName = presetItem.innerHTML.split('<')[0].trim();
                    await ipcRenderer.invoke('delete-preset', presetName);
                    //将自己的父元素隐藏
                    presetItem.style.display = 'none';
                    //debug
                    console.log("delete presetItem"+presetItem.innerHTML);
                }
                else {
                    //保存之前的preset
                    //检查是否有当前的preset，如果有，则保存
                    if(presets.includes(currentPreset) && currentPreset != presetItem.innerHTML){
                        await savePreset(currentPreset);
                    }
                    currentPreset = presetItem.innerHTML;
                    //debug
                    console.log("clicked presetItem"+presetItem.innerHTML);
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

    function refreshModList(){
        document.querySelectorAll('.mod-item').forEach(item => {
            if(item.checked == true){
                item.type = 'filled';
                //让其背景变为绿色
                item.style.backgroundColor = '#4CAF50';
            }
            else{
                item.type = '';
                //让其背景变回原来的颜色
                item.style.backgroundColor = '';
            }
        }
        );
    }

    async function savePreset(presetName){
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            await loadPresets();
        }
    }

    //- 事件监听
    let editMode = false;

    
    applyBtn.addEventListener('click', async () => {
        //获取选中的mods,mod 元素为 mod-item，当其checked属性为true时，表示选中
        const selectedMods = Array.from(document.querySelectorAll('.mod-item')).filter(item => item.checked).map(input => input.id);
        //debug
        console.log("selectedMods: " + selectedMods);
        await ipcRenderer.invoke('apply-mods', selectedMods);
    })

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
        if(presetName){
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
});