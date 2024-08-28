const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

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


//首次打开时询问用户的默认设置的窗口
ipcMain.handle('open-first-load-window', async (event) => {
  //创建一个新的窗口
  const firstLoadWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'firstLoad-preload.js'),
      contextIsolation: false, // 启用 contextIsolation
      nodeIntegration: true,
    },
  });
  firstLoadWindow.loadFile('firstLoad.html');
}
);

//创建 modResourceBackpack 文件夹，以及 presets 文件夹
ipcMain.handle('create-mod-resource-backpack', async () => {
  const modResourceDir = path.join(rootdir, 'modResourceBackpack');
  const modsDir = path.join(rootdir, 'Mods');

  
  let modCount = 0;
  if (fs.existsSync(modsDir)) {
    fs.readdirSync(modsDir).forEach(file => {
      modCount += 1;
    }
    );
  }

  let modResourceCount = 0;
  if (fs.existsSync(modResourceDir)) {
    fs.readdirSync(modResourceDir).forEach(file => {
      modResourceCount += 1;
    }
    );
  }

  //总共分为四种情况：
  //1. mods文件夹存在且modCount>0，modResourceBackpack文件夹存在且modResourceCount>0，将modResourceBackpack文件夹改名为modResourceBackpack.bak，然后创建modResourceBackpack文件夹，将mods文件夹里面的文件夹复制到 modResourceBackpack 文件夹
  //2. mods文件夹存在且modCount>0，modResourceBackpack文件夹不存在或者modResourceCount = 0，创建modResourceBackpack文件夹，将mods文件夹里面的文件夹复制到 modResourceBackpack 文件夹
  //3. mods文件夹存在但modCount = 0，modResourceBackpack文件夹存在且modResourceCount>0，将modResourceBackpack文件夹改名为modResourceBackpack.bak，然后创建modResourceBackpack文件夹
  //4. mods文件夹存在但modCount = 0，modResourceBackpack文件夹不存在或者modResourceCount = 0，创建modResourceBackpack文件夹
  //如果mods文件夹里面有文件夹，则将mods文件夹里面的文件夹复制到 modResourceBackpack 文件夹

  if (fs.existsSync(modsDir) && modCount > 0) {
    if (fs.existsSync(modResourceDir) && modResourceCount > 0) {
      //将 modResourceBackpack 文件夹重命名为 modResourceBackpack.bak
      fs.renameSync(modResourceDir, path.join(rootdir, 'modResourceBackpack.bak'));
      //创建 modResourceBackpack 文件夹
      fs.mkdirSync(modResourceDir);
    }
    else {
      //创建 modResourceBackpack 文件夹
      fs.mkdirSync(modResourceDir);
    }
    //将mods文件夹里面的文件夹复制到 modResourceBackpack 文件夹
    fs.readdirSync(modsDir).forEach(file => {
      fs.cpSync(path.join(modsDir, file), path.join(modResourceDir, file), { recursive: true });
    }
    );
  }
  else {
    if (fs.existsSync(modsDir) && modCount === 0) {
      if (fs.existsSync(modResourceDir) && modResourceCount > 0) {
        //将 modResourceBackpack 文件夹重命名为 modResourceBackpack.bak
        fs.renameSync(modResourceDir, path.join(rootdir, 'modResourceBackpack.bak'));
        //创建 modResourceBackpack 文件夹
        fs.mkdirSync(modResourceDir);
      }
      else {
        //创建 modResourceBackpack 文件夹
        fs.mkdirSync(modResourceDir);
      }
    }
  }
  
  //创建 presets 文件夹
  const presetsDir = path.join(rootdir, 'presets');
  if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir);
  }
  else {
    //将 presets 文件夹重命名为 presets.bak
    fs.renameSync(presetsDir, path.join(rootdir, 'presets.bak'));
    //创建 presets 文件夹
    fs.mkdirSync(presetsDir);
  }
}
);


//保存用户的设置
ipcMain.handle('save-user-config', async (event, userConfig) => {
  //保存用户的设置
  const configDir = path.join(__dirname, 'configs');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  fs.writeFileSync(path.join(configDir, 'user-config.json'), JSON.stringify(userConfig));
}
);

// 先尝试从localStorage中获取rootdir，如果没有则设置为默认值__dirname
let rootdir = ''

ipcMain.handle('check-rootdir', async (event, dir) => {
  //检查 dir 是否存在,如果存在则返回 true
  return fs.existsSync(dir);
}
);

ipcMain.handle('set-rootdir', async (event, dir) => {
  console.log("set rootdir: " + dir);
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
      preload: path.join(__dirname, 'renderer-preload.js'),
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
  if (rootdir === '') {
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
  const modsDir = path.join(rootdir, 'Mods');
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