const { ipcRenderer } = require('electron');

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
    const presetNameInput = document.getElementById('preset-name');
    const presetAddConfirmButton = document.getElementById('preset-add-confirm');

    //mod列表相关
    const modContainer = document.getElementById('mod-container');
    const applyBtn = document.getElementById('apply-btn');

    const savePresetBtn = document.getElementById('save-preset-btn');
    

    



    const mods = await ipcRenderer.invoke('get-mods');
    mods.forEach(mod => {
        const modItem = document.createElement('div');
        modItem.className = 'mod-item';
        modItem.innerHTML = `<input type="checkbox" id="${mod}" /> <label for="${mod}">${mod}</label>`;
        modContainer.appendChild(modItem);
    });

    const loadPresets = async () => {
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
                const presetName = presetItem.innerHTML;
                const selectedMods = await ipcRenderer.invoke('load-preset', presetName);
                document.querySelectorAll('.mod-item input').forEach(input => {
                    input.checked = selectedMods.includes(input.id);
                });
            });
        }
        );
    };

    await loadPresets();

    applyBtn.addEventListener('click', async () => {
        const selectedMods = Array.from(document.querySelectorAll('.mod-item input:checked')).map(input => input.id);
        await ipcRenderer.invoke('apply-mods', selectedMods);
    });

    savePresetBtn.addEventListener('click', async () => {
        const presetName = presetNameInput.value.trim();
        if (presetName) {
            const selectedMods = Array.from(document.querySelectorAll('.mod-item input:checked')).map(input => input.id);
            await ipcRenderer.invoke('save-preset', presetName, selectedMods);
            await loadPresets();
        }
    });

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
    });
});