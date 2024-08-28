const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require("electron");

const openFolder = (pathName)=>{
	shell.openPath(path.join(pathName, "/"))
}

async function getRootDirFromSystemDialog() {
    const rootdir = await ipcRenderer.invoke('get-rootdir');
    //debug
    console.log(rootdir);
    return rootdir;
}

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

// 获取 主窗口
const mainWindow = window.open('index.html', 'mainWindow');

// 发送消息到主窗口
function sendMessageToWindowB() {
    windowB.postMessage('refresh', '*');
}

//-=======================页面加载完成后的事件=======================

document.addEventListener('DOMContentLoaded', () => {
    //默认切换为英文
    translatePage('en');

    //控制配置文件的创建
    const configPath = path.join(__dirname, 'configs', 'user-config.json');

    //配置属性
    let userConfig = {
        lang: localStorage.getItem('lang') || 'en',
        rootdir: localStorage.getItem('rootdir') || '',
        modLoaderDir: localStorage.getItem('modLoaderDir') || '',
        modBackpackDir: localStorage.getItem('modBackpackDir') || ''
    };

    //依次打开 s-dialog 组件，s-dialog 组件会询问用户的默认设置
    //如果用户点击了确认按钮，则保存用户的设置,并且切换到下一个 s-dialog 组件
    //如果用户点击了取消按钮，则不保存用户的设置，并且切换到下一个 s-dialog 组件
    //如果用户点击了关闭按钮，则不保存用户的设置，并且关闭所有的 s-dialog 组件
    const sDialogs = document.querySelectorAll('.s-dialog');

    //各个 s-dialog 组件的引用
    const languagePicker = document.querySelector('#language-switcher');
    const selectRootDir = document.querySelector('#select-rootdir');
    const showModDir = document.querySelector('#show-moddir');

    //close按钮
    const closeBtns = document.querySelector('#close-window');

    //debug
    console.log(sDialogs);

    


    //延时1s打开第一个 s-dialog 组件
    
    //- 内部函数
    const showDialog = (index) => {
        if (index < sDialogs.length) {
            sDialogs[index].show();
            sDialogs[index].addEventListener('dismissed', () => {
                showDialog(index + 1);
                saveUserConfig();
            });
        }
    }

    function saveUserConfig() {
        //保存用户的设置,保存在 localStorage 中
        localStorage.setItem('rootdir', userConfig.rootdir);
        localStorage.setItem('modLoaderDir', userConfig.modLoaderDir);
        localStorage.setItem('modBackpackDir', userConfig.modBackpackDir);
        localStorage.setItem('lang', userConfig.lang);

        ipcRenderer.invoke('set-rootdir', userConfig.rootdir);
    }


    //- 监听事件
    languagePicker.addEventListener('change', (e) => {
        const langIndex = e.target.selectedIndex;
        let lang = '';
        //debug 
        switch(langIndex) {
            case 0:
                console.log('lang: English');
                lang = 'en';
                break;
            case 1:
                console.log('lang: Chinese');
                lang = 'zh-cn';
                break;
            default:
                console.log('lang: Unknown');
                lang = 'en';
        }
        translatePage(lang);
        userConfig.lang = lang;
        //ipcRenderer.invoke('save-user-config', { lang });
    });

    selectRootDir.addEventListener('click', async () => {
        const exeDir = await getRootDirFromSystemDialog();
        const rootdir = path.dirname(exeDir);
        //让 select-rootdir 的 lable属性 为 用户选择的路径
        if (exeDir !== '') {
            selectRootDir.label = exeDir;

            userConfig.rootdir = rootdir;
            userConfig.modLoaderDir = exeDir;

            ipcRenderer.invoke('set-rootdir', rootdir);
            ipcRenderer.invoke('create-mod-resource-backpack');
        }
        else {
            selectRootDir.label = 'Please select your 3dmigoto.exe file';
            alert('Please select your 3dmigoto.exe file');
        }
        //debug
        console.log(rootdir);
        //ipcRenderer.invoke('save-user-config', { rootdir });
    });

    showModDir.addEventListener('click', async () => {
        const rootdir = userConfig.rootdir;
        if (fs.existsSync(rootdir)) {
            const modBackpackDir = path.join(rootdir, 'modResourceBackpack');
            showModDir.label = modBackpackDir;
            userConfig.modBackpackDir = modBackpackDir;

            openFolder(modBackpackDir);
        }
        console.log(modLoaderdir);
        //ipcRenderer.invoke('save-user-config', { modLoaderdir });
    });
    
    //最后一个 s-dialog 组件的事件监听
    sDialogs[sDialogs.length - 1].addEventListener('dismissed', () => {
        saveUserConfig();
        //控制显隐，将标题显示的正在加载变为已完成
        const loading = document.querySelector('#loading');
        loading.style.display = 'none';
        const loaded = document.querySelector('#loaded');
        loaded.style.display = 'block';

    }
    );

    //close按钮的事件监听
    closeBtns.addEventListener('click', () => {
        window.close();
    }
    );


    //- 默认触发
    setTimeout(() => {
        showDialog(0);
    }, 1000);
}
);

