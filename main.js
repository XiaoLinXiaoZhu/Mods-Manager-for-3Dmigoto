const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const fs = require('fs');
const { url } = require('inspector');
const path = require('path');
const shell = require('electron').shell;
const HMC = require("hmc-win32");
const os = require('os');

const isMac = os.platform() === "darwin";
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 实际上 ___dirname 是当前文件所在的目录,但是 最终的目标是要找到 modResourceBackpack 的根文件夹，所以要找到这个文件夹的路径
// 通过 在第一次打开时询问 rootdir 来 确认文件保存的位置

// 国际化，但是我不会使用i18next，这里就直接自定义自己方法来实现国际化
// 通过传递一个json文件来实现国际化
// 需要的时候，通过读取json文件来显示对应的语言的内容


ipcMain.handle('get-translate', async (event, lang) => {
  // 读取对应的json文件，文件位于locales文件夹下,文件名为lang.json
  const langDir = path.join(__dirname, 'locales');
  const langPath = path.join(langDir, `${lang}.json`);
  if (fs.existsSync(langPath)) {
    return JSON.parse(fs.readFileSync(langPath));
  }
  else {
    return {};
  }
}
);

//----------------------firstLoad----------------------
//首次打开时询问用户的默认设置的窗口
ipcMain.handle('open-first-load-window', async (event) => {
  //创建一个新的窗口
  const firstLoadWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'firstLoad-preload.js'),
      contextIsolation: false, // 启用 contextIsolation
      nodeIntegration: true,
      webSecurity: false,
    },
  });
  firstLoadWindow.setMenuBarVisibility(false);
  firstLoadWindow.loadFile('firstLoad.html');
}
);

//auto move mod 
ipcMain.handle('auto-move-mod', async (event) => {
  const modBackpackDir = path.join(rootdir, 'modResourceBackpack');
  const modLoaderDir = path.join(rootdir, 'Mods');
  let ret = '';

  if (!fs.existsSync(modBackpackDir)) {
    //console.log("modResourceBackpack don't exist,create it");
    fs.mkdirSync(modBackpackDir);
    ret = 'modResourceBackpack don\'t exist,succeed to create it,your mods have been moved to modResourceBackpack';
  }
  else {
    //console.log("modResourceBackpack exist");
    //检测modResourceBackpack文件夹是否为空
    if (fs.readdirSync(modBackpackDir).length === 0) {
      ret = 'modResourceBackpack is empty,your mods have been moved to modResourceBackpack';
    }
    else {
      //console.log("modResourceBackpack is not empty");
      //将当前的modResourceBackpack文件夹重命名为modResourceBackpack.bak,在当前名称后面加上数字防止重名
      let i = 0;
      while (fs.existsSync(path.join(rootdir, `modResourceBackpack.bak${i}`))) {
        i++;
      }
      fs.renameSync(modBackpackDir, path.join(rootdir, `modResourceBackpack.bak${i}`));
      //创建modResourceBackpack文件夹
      fs.mkdirSync(modBackpackDir);
      ret = `your old modResourceBackpack has been renamed to modResourceBackpack.bak${i}`;
    }
  }
  //将Mods文件夹里面的文件夹移动到modResourceBackpack文件夹
  fs.readdirSync(modLoaderDir).forEach(file => {
    fs.cpSync(path.join(modLoaderDir, file), path.join(modBackpackDir, file), { recursive: true });
    //删除Mods文件夹里面的文件夹
    fs.rmSync(path.join(modLoaderDir, file), { recursive: true, force: true });
  });

  return ret;
});

//--------------------turtoral--------------------
//todo 通过打开教程窗口，打算是左边是wiki，右边是视频


//-------------------rootdir-------------------
// 先尝试从localStorage中获取rootdir，如果没有则设置为默认值__dirname
let rootdir = '';

ipcMain.handle('check-rootdir', async (event, dir) => {
  //检查 dir 是否存在,如果存在则返回 true
  return fs.existsSync(dir);
}
);

ipcMain.handle('set-rootdir', async (event, dir) => {
  //console.log("set rootdir: " + dir);
  rootdir = dir;
}
);

ipcMain.handle('get-rootdir', async (event) => {
  //提示选择 3dmigoto.exe 文件
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '3dmigoto', extensions: ['exe'] }
    ]
  });
  if (!result.canceled) {
    const exePath = result.filePaths[0];
    //rootdir = path.dirname(exePath);
    return exePath;
  }
  return '';
}
);

//-------------------exePath-------------------
// 通过配置文件获取 exePath 文件的路径
let exePath = '';

ipcMain.handle('check-exePath', async (event, path) => {
  //检查 path 是否存在,如果存在则返回 true
  return fs.existsSync(path);
}
);

ipcMain.handle('set-exePath', async (event, path) => {
  //console.log("set exePath: " + path);
  exePath = path;
}
);

ipcMain.handle('get-exePath', async (event) => {
  //提示选择 refresh-in-zzz.bat 文件
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'refresh-in-zzz', extensions: ['bat'] }
    ]
  });

  if (!result.canceled) {
    const exePath = result.filePaths[0];
    return exePath;
  }
  return '';
});



//-------------------mods list 加载-------------------
ipcMain.handle('get-mods', async () => {
  //增加纠错
  if (rootdir === '') {
    //console.log("rootdir is empty");
    rootdir = __dirname;
  }
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack'))) {
    //console.log("modResourceBackpack not found");
    return [];
  }
  //debug
  //console.log(`get-mods rootdir: ${rootdir}`);
  const modDir = path.join(rootdir, 'modResourceBackpack');
  const mods = fs.readdirSync(modDir).filter(file => fs.statSync(path.join(modDir, file)).isDirectory());
  //输出mods
  //console.log(`load mods in ${modDir}: ${mods}`);
  return mods;
});

ipcMain.handle('get-mod-info', async (event, mod) => {
  //增加纠错
  if (rootdir === '') {
    console.log("rootdir is empty");
    return {};
  }
  if (mod === '') {
    console.log("mod is empty");
    return {};
  }
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod))) {
    console.log(`mod ${mod} not found`);
    return {};
  }
  const modDir = path.join(rootdir, 'modResourceBackpack', mod);
  const modInfoPath = path.join(modDir, 'mod.json');
  if (fs.existsSync(modInfoPath)) {
    // 这里为了兼容老的mod.json文件，如果没有url字段，则添加一个空的url字段
    const modInfo = JSON.parse(fs.readFileSync(modInfoPath));
    if (!modInfo.url) {
      modInfo.url = '';
    }
    // 如果存在 cover 字段，则将其改为 imagePath
    if (modInfo.cover) {
      //如果也存在imagePath字段，则将cover字段删除
      if (modInfo.imagePath === '') {
        modInfo.imagePath = modInfo.cover;
      }
      delete modInfo.cover;
    }

    //如果不存在imagePath字段，则设置为preview.jpg
    if (modInfo.imagePath === '') {
      modInfo.imagePath = 'preview.jpg';
    }
    return modInfo;
  }
  else {
    //console.log(`modInfoPath not found: ${modInfoPath}`);
    //创建默认的mod.json文件
    const modInfo = {
      character: 'unknown',
      description: 'no description',
      imagePath: 'preview.jpg',
      url: ''
    };
    fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
    return modInfo;
  }
});

ipcMain.handle('set-mod-info', async (event, mod, modInfo) => {
  //增加纠错
  if (rootdir === '') {
    console.log("rootdir is empty");
    return;
  }
  if (mod === '') {
    console.log("mod is empty");
    return;
  }
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod))) {
    console.log(`mod ${mod} not found`);
    return;
  }
  const modDir = path.join(rootdir, 'modResourceBackpack', mod);
  const modInfoPath = path.join(modDir, 'mod.json');
  fs.writeFileSync(modInfoPath, JSON.stringify(modInfo));
});


//-------------------应用mods-------------------
ipcMain.handle('apply-mods', async (event, mods) => {
  const modsDir = path.join(rootdir, 'Mods');
  const modResourceDir = path.join(rootdir, 'modResourceBackpack');

  // 删除 未选中的mod 且 存在在modResourceBackpack文件夹中的mod
  fs.readdirSync(modsDir).forEach(file => {
    if (!mods.includes(file) && fs.existsSync(path.join(modResourceDir, file))) {
      // 删除文件夹,包括文件夹内的文件，使用异步方法
      fs.rm(path.join(modsDir, file), { recursive: true, force: true }, (err) => {
        if (err) {
          //console.log(`failed to delete ${file}: ${err}`);
        }
      }
      );
      //fs.rmSync(path.join(modsDir, file), { recursive: true, force: true });
    }
  });

  // 复制选中的mod
  mods.forEach(mod => {
    const src = path.join(modResourceDir, mod);
    const dest = path.join(modsDir, mod);
    if (!fs.existsSync(dest)) {
      // // 复制文件夹,包括文件夹内的文件，使用异步方法
      // fs.cp(src, dest, { recursive: true }, (err) => {
      //   if (err) {
      //     //console.log(`failed to copy ${mod}: ${err}`);
      //   }
      // }
      // );
      // //fs.cpSync(src, dest, { recursive: true });
      //这里不再复制文件夹，而是创建一个快捷方式，使用cmd的mklink命令
      fs.symlinkSync(src, dest, 'junction', (err) => {
        if (err) console.log(err);
      });
    }
  });
});

ipcMain.handle("refresh-in-zzz", async (event) => {
  // Refresh in ZZZ success flag
  // 0: Failed
  // 1: Success
  // 2: Cannot find the process
  // 3: Cannot find the zenless zone zero window
  // 4: Cannot find the mod manager window

  // Only availabe in windows
  if (isWindows) {
    // Virtual key code for F10. This key is the default but
    // can be changed in d3dx.ini. Future improvement.

    // We have the path to the 3dmigoto.exe, d3dx.ini is in the same folder
    // We just need to read the d3dx.ini file and get the VK_F10 value 
    const VK_F10 = 0x79;

    // Process name. Should be set as a config value for 
    // this to work while managing other games.
    const processName = "ZenlessZoneZero.exe";

    // Get the process from the name
    const process = HMC.getProcessNameList(processName);

    if (process.length <= 0) return 2;


    // Get the Zenless Zone Zero Hwnd handle
    const window = HMC.getProcessWindow(process[0].pid);

    // Get the Mod manager Hwnd handle
    const manager = HMC.getForegroundWindow();

    if (!window) return 3;
    if (!manager) return 4;

    // ZZZ wont accept any keys if the manager is not run as admin.
    // ZZZ wont accept virtual keys, only accepts direct input keys.
    // Here is the trick to get ZZZ to register the VK input without admin:

    // 1. Press the F10 Key down on the manager
    HMC.sendKeyboard(VK_F10, true);

    // 2. Set focus on ZZZ window
    window.setFocus(true);

    // 3. Wait a reasonable amount of time for the key to register
    await sleep(75);

    // 4. Set focus on the Manager window
    manager.setFocus(true);

    // 5. Wait again for the window
    await sleep(50);

    // 6. Release the F10 Key
    HMC.sendKeyboard(VK_F10, false);

    // 7. Set focus on ZZZ window again
    window.setFocus(true);

    refreshState = true;
  }
});


//-------------------presets-------------------
ipcMain.handle('save-preset', async (event, presetName, mods) => {
  const presetDir = path.join(rootdir, 'presets');
  if (!fs.existsSync(presetDir)) {
    fs.mkdirSync(presetDir);
  }
  fs.writeFileSync(path.join(presetDir, `${presetName}.json`), JSON.stringify(mods));
});

ipcMain.handle('get-presets', async () => {
  const presetDir = path.join(rootdir, 'presets');
  if (!fs.existsSync(presetDir)) {
    return [];
  }
  return fs.readdirSync(presetDir).map(file => path.basename(file, '.json'));
});

ipcMain.handle('load-preset', async (event, presetName) => {
  const presetDir = path.join(rootdir, 'presets');
  const presetPath = path.join(presetDir, `${presetName}.json`);
  if (fs.existsSync(presetPath)) {
    return JSON.parse(fs.readFileSync(presetPath));
  }
  return [];
});

ipcMain.handle('delete-preset', async (event, presetName) => {
  const presetDir = path.join(rootdir, 'presets');
  const presetPath = path.join(presetDir, `${presetName}.json`);
  //console.log("delete preset: " + presetPath);
  if (fs.existsSync(presetPath)) {
    fs.rmSync(presetPath);
  }
});

//-----------------------modInfo-----------------------
//打开mod文件夹
ipcMain.handle('open-mod-folder', async (event, mod) => {
  //判断mod是否存在
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod))) {
    //console.log(`mod ${mod} not found`);
    return;
  }
  shell.openPath(path.join(rootdir, 'modResourceBackpack', mod));
});

//打开mod.json文件
ipcMain.handle('edit-mod-info', async (event, mod) => {
  //判断mod是否存在
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod))) {
    //console.log(`mod ${mod} not found`);
    return;
  }
  //判断mod.json文件是否存在，如果不存在则创建一个默认的mod.json文件
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'mod.json'))) {
    const modInfo = {
      character: 'unknown',
      description: 'no description',
      imagePath: 'preview.jpg'
    };
    fs.writeFileSync(path.join(rootdir, 'modResourceBackpack', mod, 'mod.json'), JSON.stringify(modInfo));
  }

  //判断mod.json文件是否存在，如果存在则打开mod.json文件
  if (fs.existsSync(path.join(rootdir, 'modResourceBackpack', mod, 'mod.json'))) {
    shell.openPath(path.join(rootdir, 'modResourceBackpack', mod, 'mod.json'));
  }
  else {
    //console.log(`mod.json not found in ${mod}`);
    return;
  }
});

//选择mod封面
ipcMain.handle('select-image', async () => {
  //通过文件选择对话框选择图片
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }
    ]
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return '';
}
);

//---------------------窗口控制---------------------
ipcMain.handle('minimize-window', async () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.handle('maximize-window', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win.isMaximized()) {
    win.unmaximize();
  }
  else {
    win.maximize();
  }
});

ipcMain.handle('close-window', async () => {
  BrowserWindow.getFocusedWindow().close();
});

ipcMain.handle('toggle-fullscreen', async () => {
  //窗口化全屏
  const win = BrowserWindow.getFocusedWindow();
  if (win.isFullScreen()) {
    win.setFullScreen(false);
    return false;
  }
  else {
    win.setFullScreen(true);
    return true;
  }
});

// 设置窗口大小
ipcMain.handle('set-bounds', async (event, boundsStr) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const bounds = JSON.parse(boundsStr);

    if (win && bounds) {
      const screenArea = screen.getDisplayMatching(bounds).workArea;

      if (
        (bounds.x + bounds.width) > (screenArea.x + screenArea.width) ||
        bounds.x > (screenArea.x + screenArea.width) ||
        bounds.x < screenArea.x ||
        (bounds.y + bounds.height) > (screenArea.y + screenArea.height) ||
        bounds.y > (screenArea.y + screenArea.height) ||
        bounds.y < screenArea.y
      ) {
        // Fit and center window into the existing screenarea
        const width = Math.min(bounds.width, screenArea.width);
        const height = Math.min(bounds.height, screenArea.height);
        const x = Math.floor((screenArea.width - width) / 2);
        const y = Math.floor((screenArea.height - height) / 2);
        win.setBounds({ x: x, y: y, width: width, height: height });
      }
      else {
        win.setBounds(bounds);
      }
    }
  } catch (e) { }
});


// 打开外部链接
ipcMain.handle('open-external-link', async (event, link) => {
  shell.openExternal(link);
});

// 获取外部文件的路径
ipcMain.handle('get-file-path', (event, filePath) => {
  //debug
  console.log(`get-file-path: ${filePath}`);
  return filePath; // 直接返回文件路径
});



//---------------------主窗口---------------------
//创建主窗口
function createWindow() {
  //隐藏菜单栏
  // app.on('browser-window-created', (e, window) => {
  //   window.setMenu(null);
  // });
  const mainWindow = new BrowserWindow({
    setMenuBarVisibility: false,
    frame: false,
    show: false,
    width: 1050,
    height: 800,
    backgroundColor: '#1d1f1e',
    webPreferences: {
      preload: path.join(__dirname, 'renderer-preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false, // 不推荐使用
      webSecurity: false, // 允许加载跨域资源，生产环境中应谨慎使用
    },
  });

  mainWindow.loadFile('index.html');

  //因为需要调整窗口大小，所以需要等待窗口加载完成
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


