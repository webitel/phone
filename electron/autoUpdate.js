const { EventEmitter } = require('events');
const { autoUpdater } = require('electron-updater');
const path = require('path');

class Updater extends EventEmitter {
  constructor() {
    super();
    this.currentVersion = autoUpdater.currentVersion.version;
    this.endpoint = null;
    this.channel = null;
    this.sender = null;

    autoUpdater.autoDownload = false;
    autoUpdater.on('checking-for-update', () => {
      //autoUpdater.updateConfigPath = '/home/igor/work/webitel-phone/release-builds/win-unpacked/resources/app-update.yml';
      if (this.channel) {
        autoUpdater.channel = this.channel;
      }

      if (this.endpoint) {
        autoUpdater.setFeedURL(this.endpoint, [{ }]);
      }
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available.', info);
      if (this.sender) {
        this.sender.send('new-version', info)
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available.', info);
    });

    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater.', err);
      this.sender.send('update-version-error', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log('Download progress...', progressObj);
      this.emit('download-progress', progressObj)
    });

    autoUpdater.on('update-downloaded', (ev, info) => {
      console.log('Update downloaded;', ev, info);
      this.emit('update-downloaded', info)
    });
  }

  check({endpoint = null, channel = null}, sender) {
    this.endpoint = endpoint;
    this.channel = channel;
    this.sender = sender;
    autoUpdater.checkForUpdates();
  }

  get version () {
    return this.currentVersion
  }

  download() {
    return autoUpdater.downloadUpdate();
  }

  install() {
    autoUpdater.quitAndInstall();
  }
}

module.exports = Updater;
