const url = require('url');
const electron = require('electron');
const WindowState = require('./windowState');
// Module to control application life.
const app = electron.app;
const ipcMain = electron.ipcMain;
const protocol = electron.protocol;
const path = require('path');
const shell = electron.shell;
const globalShortcut = electron.globalShortcut;
const Menu = electron.Menu;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
//Adds the main Menu to our app

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  const mainWindowState = new WindowState(app.getPath('userData'), 'main', {});

  mainWindow = new BrowserWindow({
    titleBarStyle: 'default',
    minWidth: 325,
    minHeight: 560,
    title: 'Webitel phone',
    name: 'webitel-phone',
    id: 0,
    hasShadow: false,
    // backgroundColor: 'transparent',
    show: false,
    transparent: true,
    frame: false,
    icon: path.join(__dirname, 'static/img/icons/call48.png'),
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
    shell.openItem(url)
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

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
  })

  globalShortcut.register('CommandOrControl+F1', () => {
    // Open the DevTools.
    if (!mainWindow.webContents.devToolsWebContents) {
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.webContents.closeDevTools();
    }
  });

  createWindow()

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
