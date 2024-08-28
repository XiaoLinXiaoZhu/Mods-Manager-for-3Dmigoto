const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// 在 config 文件夹下寻找 是否存在 user-config.json 文件。
//如果不存在则代表是第一次打开，通过打开一个新的窗口来询问用户一些默认设置
const configPath = path.join(__dirname, 'configs', 'user-config.json');
if (fs.existsSync(configPath)) {
    // user-config.json exists, do something
    
} else {
    // user-config.json does not exist, open a new window to ask for default settings
    //  debug
    console.log('user-config.json does not exist, open a new window to ask for default settings');
    ipcRenderer.invoke('open-first-load-window');
}
