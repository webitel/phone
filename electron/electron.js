const url = require('url');
const electron = require('electron');
const WindowState = require('./windowState');
// Module to control application life.
const app = electron.app;
const ipcMain = electron.ipcMain;
const protocol = electron.protocol;
const path = require('path');
const shell = electron.shell;
const Menu = electron.Menu;

const Updater = require('./autoUpdate');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
//Adds the main Menu to our app

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
} else {
  app.on('second-instance', (event, argv) => {
    if (process.platform === 'win32' || process.platform === 'linux') {
      sendMakeCall(argv.slice(1)[0])
    }
  });
}

function sendMakeCall(number = '') {
  if (mainWindow) {
    mainWindow.webContents.send('make-call', {number})
  }
}

app.on('open-url', (event, number) => {
  sendMakeCall(number);
});

function createWindow () {
  const updater = new Updater();

  global.currentVersion = updater.version;

  // Create the browser window.
  const mainWindowState = new WindowState(app.getPath('userData'), 'main', {});

  mainWindow = new BrowserWindow({
    titleBarStyle: 'default',
    minWidth: 325,
    width: 325,
    minHeight: 560,
    height: 560,
    title: 'Webitel phone',
    name: 'webitel-phone',
    id: 0,
    hasShadow: false,
    // backgroundColor: 'transparent',
    show: false,
    transparent: true,
    frame: false,
   // icon: path.join(__dirname, 'static/img/icons/icon64x64.png'),
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  let closePhone = false;
  ipcMain.on('close-phone', () => {
    closePhone = true;
    mainWindowState.saveState(mainWindow);
    app.quit();
  });

  ipcMain.on('check-update', (e, config) => {
    updater.check(config, e.sender);
  });
  ipcMain.on('download-new-version', (e) => {
    updater.download();
    updater.once('update-downloaded', (info) => {
      e.sender.send('update-version-downloaded', info);
    });
    updater.on('download-progress', (info) => {
      e.sender.send('update-version-progress', info);
    });

  });

  ipcMain.on('install-new-version', (e) => {
    mainWindowState.saveState(mainWindow);
    closePhone = true;
    app.removeAllListeners('window-all-closed');
    updater.install();
  });

  ipcMain.on('show-phone', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  ipcMain.on('hide-phone', () => {
    mainWindow.hide();
  });

  ipcMain.on('minimize-phone', () => {
    mainWindow.minimize();
  });

  ipcMain.on('always-on-top-phone', (e, val) => {
    mainWindow.setAlwaysOnTop(!!val);
  });

  ipcMain.on('open-dev-tool', (e) => {
    mainWindow.webContents.openDevTools()
  });

  // and load the index.html of the app.
  // mainWindow.loadURL(`file://${__dirname}/index.html`, {slashes: true });
  mainWindow.loadURL(url.format({ pathname:'index.html', protocol: 'file', slashes: true }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('close', (event) => {
    if (closePhone) {
      return
    }
    mainWindow.minimize();
    event.preventDefault();
  });

  // Show the mainwindow when it is loaded and ready to show
  mainWindow.once('ready-to-show', () => {
    mainWindowState.loadState(mainWindow);
    mainWindow.show()
  });

  mainWindow.webContents.on('new-window', function(event, url){
    event.preventDefault();
    shell.openExternal(url);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault();
  if (!mainWindow) {
    callback();
    return
  }

  mainWindow.send('http-authentication-request');
  ipcMain.once('http-authentication-response', (e, {login = null, password = null}) => {
    callback(login, password)
  })
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  protocol.interceptFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7) /* all urls start with 'file://' */
    callback({ path: path.normalize(`${__dirname}/${url}`)})
  }, (err) => {
    if (err)
      console.error('Failed to register protocol')
  });

  createWindow();

  Menu.setApplicationMenu(Menu.buildFromTemplate(templateApplicationMenu()));
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

if (!app.isDefaultProtocolClient("wtel")) {
  app.setAsDefaultProtocolClient("wtel");
}

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function templateApplicationMenu() {
  // Create the Application's main menu
  return [{
    label: "Application",
    submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];
}
