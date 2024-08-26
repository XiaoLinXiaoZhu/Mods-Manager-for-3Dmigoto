const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// 实际上 ___dirname 是当前文件所在的目录,但是 最终的目标是要找到 modResourceBackpack 的根文件夹，所以要找到这个文件夹的路径
// 通过 在第一次打开时询问 rootdir 来 确认文件保存的位置

// 先尝试从localStorage中获取rootdir，如果没有则设置为默认值__dirname
let rootdir = ''


ipcMain.handle('check-rootdir', async (event,dir) => {
  //检查 dir 是否存在,如果存在则返回 true
  return fs.existsSync(dir);
}
);

ipcMain.handle('set-rootdir', async (event, dir) => {
  console.log("set rootdir: " + dir);
  rootdir = dir;
}
);

// 通过配置文件获取 modResourceBackpack 文件夹的路径

function createWindow() {
  //隐藏菜单栏
  // app.on('browser-window-created', (e, window) => {
  //   window.setMenu(null);
  // });
  // 隐藏
  const win = new BrowserWindow({
    //setMenuBarVisibility: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(rootdir, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
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

ipcMain.handle('get-mods', async () => {
  //增加纠错
  if (rootdir === ''){
    console.log("rootdir is empty");
    rootdir = __dirname;
  }
  if (!fs.existsSync(path.join(rootdir, 'modResourceBackpack'))) {
    console.log("modResourceBackpack not found");
    return [];
  }
  //debug
  console.log(`get-mods rootdir: ${rootdir}`);
  const modDir = path.join(rootdir, 'modResourceBackpack');
  const mods = fs.readdirSync(modDir).filter(file => fs.statSync(path.join(modDir, file)).isDirectory());
  //输出mods
  console.log(`load mods in ${modDir}: ${mods}`);
  return mods;
});

ipcMain.handle('get-mod-info', async (event, mod) => {
  const modDir = path.join(rootdir, 'modResourceBackpack', mod);
  const modInfoPath = path.join(modDir, 'mod.json');
  if (fs.existsSync(modInfoPath)) {
    return JSON.parse(fs.readFileSync(modInfoPath));
  }
  return {};
});

ipcMain.handle('apply-mods', async (event, mods) => {
  const modsDir = path.join(rootdir, '3dmigoto','Mods');
  const modResourceDir = path.join(rootdir, 'modResourceBackpack');

  // 删除未选中的mod
  fs.readdirSync(modsDir).forEach(file => {
    if (!mods.includes(file)) {
      fs.rmSync(path.join(modsDir, file), { recursive: true, force: true });
    }
  });

  // 复制选中的mod
  mods.forEach(mod => {
    const src = path.join(modResourceDir, mod);
    const dest = path.join(modsDir, mod);
    if (!fs.existsSync(dest)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  });
});

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
  console.log("delete preset: " + presetPath);
  if (fs.existsSync(presetPath)) {
    fs.rmSync(presetPath);
    //debug
    
  }
});