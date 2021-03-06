const fs = require('fs');
const path = require('path');
const systemConfigFileName = 'config.json';
const userConfigFileName = 'user_config.json';
const remote = require('electron').remote;
const app = remote.app;
const clipboard = remote.clipboard;
const {ipcRenderer} = require('electron');
const Tray = require('./tray');
const NotificationNewCall = require('./notificationNewCall');
const os = require('os');
const child = require('child_process').execFile;

class FileStorage {
  constructor(defaultData = {}, pathFile) {
    this._data = {};
    Object.assign(this._data, defaultData);

    this._path = pathFile;
    this.load();
  }

  save(callback) {
    fs.writeFile(this._path, JSON.stringify(this._data, null, '\t'), function (err) {
      if (err) {
        console.info("There was an error attempting to save your data.");
        console.warn(err.message);
      } else if (callback) {
        callback();
      }
    });
  }

  set(name, val, cb) {
    this._data[name] = val;
    this.save(cb);
  }

  get(name) {
    return this._data[name]
  }

  load() {
    try {
      const data = fs.readFileSync(this._path);
      this._data = JSON.parse(data.toString('utf8'));
    } catch (e) {
      this.save()
    }
  }
}

function deepFind(obj, path) {
  let paths = path.split('.')
    , current = obj
    , i;

  for (i = 0; i < paths.length; ++i) {
    if (current[paths[i]] === undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }
  return current;
}

class Executor {
  constructor(config = {}) {
    this.handlers = config || {};
  }

  parseParameters(data = {}, params = []) {
    const parameters = [];
    if (params instanceof Array) {
      params.forEach( val => {
        const parsed = `${val}`.replace(/\$\{([\s\S]*?)\}/gi, function (a, b) {
          return deepFind(data, b)
        });

        if (parsed) {
          parameters.push(parsed);
        } else {
          parameters.push(null)
        }
      })
    }
    return parameters
  }

  exec(name = '', data) {
    if (this.handlers.hasOwnProperty(name)) {
      const {app, parameters} = this.handlers[name];
      if (!app) {
        return false;
      }

      child(app, this.parseParameters(data, parameters), (err) => {
        if (err) {
          console.error(err)
        }
      });

      return true
    }
    return false
  }
}

const userConfig = new FileStorage({}, findUserConfigFilePath(userConfigFileName));
const phoneSettings = new FileStorage({}, path.join(app.getPath('exe'), '..', systemConfigFileName));

if (userConfig.get("useHotdesk") && !userConfig.get("hotdeskId")) {
  userConfig.set("hotdeskId", os.hostname());
}

window.isElectron = true;

window.WEBITEL_NOTIFICATION_NEW_CALL = NotificationNewCall;
window.WEBITEL_CONFIG = userConfig;


window.initPhone = (store) => {
  window.WEBITEL_APP = new App(window, userConfig, store)
};


function findUserConfigFilePath(fileName) {
  const filePath = findUserConfigFilePathFromArgs();
  if (filePath) {
    //TODO make new file ?
    if (fs.existsSync(filePath)) {
      return filePath;
    } else {
      console.error(`Not exists file ${filePath}`)
    }
  }

  if (fs.existsSync(path.join(app.getPath('userData'), fileName))) {
    return path.join(app.getPath('userData'), fileName);
  }

  if (fs.existsSync(path.join(app.getPath('exe'), '..', fileName))) {
    return path.join(app.getPath('exe'), '..', fileName);
  }

  return path.join(app.getPath('userData'), fileName);
}

function findUserConfigFilePathFromArgs() {
  const process = remote.process;
  const args = process.argv.splice(process.execArgv.length + 2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-c' && args[i + 1]) {
      return args[i + 1]
    } else if (args[i].startsWith('--config')) {
      return args[i].substring(9)
    }
  }
  return null;
}


class App {
  constructor(win, config, store, ...options) {
    this.config = config;
    this.systemConfig = phoneSettings;

    this.alwaysOnTop = false;
    this.tray = null;
    this.hide = false;

    this.versions = process.versions;

    if (~["win32", "win64"].indexOf(process.platform) && phoneSettings.get('disableOAuth') !== true) {
      localStorage.setItem("oauthName", phoneSettings.get('oauthName') || os.hostname())
    }

    this.initWindow(win);
    this.makeTray(store);
    this.subscribeStore(store);

    const translate = store.getters.i18n();
    this.t = (name) => {
      return translate.t(name)
    }
  }

  getTheme() {
    return this.config.get('theme')
  }

  makeTray(store) {
    const links = this.config.get('hotLinks') || this.config.get('hot_links'); //TODO hot_links deprecated
    const tray = this.tray = new Tray(store.getters.i18n(), links, {alwaysOnTop: this.alwaysOnTop});
    tray.on('set-status', (params = {}) => {
      const user = store.getters.user();

      switch (params.status) {
        case "Ready":
          user.logoutCallCenter();
          user.setReady();
          break;
        case "Busy":
          user.logoutCallCenter();
          user.setBusy(params.state, '');
          break;
        case "Call Center":
          user.loginCC();
          if (params.state === 'Waiting') {
            user.setReady();
          } else {
            user.setBusy("ONBREAK", '');
          }
          break;
      }
    });

    tray.on('always-on-top', (val) => {
      this.config.set('alwaysOnTop', val);
      this.setAlwaysOnTop(val);
    });

    tray.on('toggle-show', () => {
      this.toggleShow()
    });

    tray.on('open-documentation', () => {
      remote.shell.openExternal("https://docs.webitel.com/display/PHONE")
    });

    tray.on('quit', this.close);
  }

  removeTray() {
    if (this.tray) {
      this.tray.removeAllListeners();
      this.tray.destroy();
      this.tray = null;
    }
  }

  setStateTray(state) {
    if (this.tray) {
      this.tray.setState(state);
    }
  }

  toggleShow() {
    if (this.hide) {
      this.setShow();
    } else {
      this.setHide();
    }
  }

  close() {
    ipcRenderer.send('close-phone')
  }

  subscribeStore(store) {

    if (remote.getGlobal("currentVersion"))
      store.commit('version/SET_VERSION', remote.getGlobal("currentVersion"));

    store.watch(store.getters.status, status => {
      this.setStateTray({status});
    });

    ipcRenderer.on('make-call', (event, payload = {}) => {
      if (!payload.number) {
        return;
      }
      const user = store.getters['user']();
      if (user) {
        user.makeCall(payload.number.replace(/\D/g, ''));
      }
    });
    ipcRenderer.on('http-authentication-request', (e) => {
      store.commit('authentication/SET_REQUEST', credentials => {
        e.sender.send('http-authentication-response', credentials)
      })
    });

    if (!this.config.get('disableAutoUpdate')) {
      store.watch(store.getters['version/stage'], stage => {
        switch (stage) {
          case 2:
            ipcRenderer.send('download-new-version');
            break;
          case 4:
            this.removeTray();
            ipcRenderer.send('install-new-version');
            break;
        }
      });

      ipcRenderer.on('new-version', (e, ver) => {
        store.commit('version/SET_NEW_VERSION', ver);
      });
      ipcRenderer.on('update-version-error', (e, err) => {
        store.commit('version/SET_ERROR', err);
      });
      ipcRenderer.on('update-version-downloaded', (e, info) => {
        store.commit('version/DOWNLOADED');
      });
      ipcRenderer.on('update-version-progress', (e, info) => {
        store.commit('version/SET_PROGRESS', info.percent);
      });

      this.checkUpdate();
    }

    ipcRenderer.on('power-resume', (e) => {
      const user = store.getters['user']();
      if (user && user.useHotdesk()) {
        user.signHotdesk(this.config.get('hotdeskId'));
      }
      console.warn('Receive power-resume');
    });

    ipcRenderer.on('power-suspend', (e) => {
      console.warn('Receive power-suspend');
    });
    ipcRenderer.on('power-unlock-screen', (e) => {
      console.warn('Receive power-unlock-screen');
    });


    store.watch(store.getters.countInboundNoAnswerCall, count => {
      if (count > 0) {
        //TODO IPC
        //this.remote.getCurrentWindow().webContents.focus();
      }
    });
  }

  checkUpdate() {
    ipcRenderer.send('check-update', {
      endpoint: phoneSettings.get('updateEndpoint'),
      channel: phoneSettings.get('updateChannel')
    });
  }

  clearAuthCache() {
    remote.session.defaultSession.clearAuthCache({ type: 'password' }, function () {
      console.log('Electron password auth cache cleared');
    })
  }

  initWindow(window) {
    this.setAlwaysOnTop(this.config.get('alwaysOnTop'));
    window.WEBITEL_COPY_TO_CLIPBOARD = this.copyClipboard.bind(this);
    window.WEBITEL_MINIMALIZE = this.minimize.bind(this);
    window.WEBITEL_HIDE = this.setHide.bind(this);
    window.WEBITEL_EXECUTOR = new Executor(this.config.get('execute'));
    window.addEventListener('keyup', this.keyUp, true)
  }

  keyUp(e) {
    if (e.altKey && e.keyCode === 68) {
      e.preventDefault();
      ipcRenderer.send('open-dev-tool');
    }
  }

  setAlwaysOnTop(val) {
    ipcRenderer.send('always-on-top-phone', val);
    this.alwaysOnTop = val;
  }

  minimize() {
    ipcRenderer.send('minimize-phone');
  }

  setHide() {
    this.hide = true;
    ipcRenderer.send('hide-phone');
    this.setStateTray({hide: this.hide});
  }

  setShow() {
    this.hide = false;
    ipcRenderer.send('show-phone');
    this.setStateTray({hide: this.hide});
  }

  copyClipboard() {
    clipboard.writeText(text)
  }

}
