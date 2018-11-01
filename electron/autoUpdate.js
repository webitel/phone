const { EventEmitter } = require('events');
const { autoUpdater } = require('electron-updater');
const path = require('path');

class Updater extends EventEmitter {
  constructor() {
    super();
    this.currentVersion = autoUpdater.currentVersion.version;
    this.feed = null;
    this.channel = null;
    autoUpdater.autoDownload = false;

    autoUpdater.on('checking-for-update', (a, b) => {
      // autoUpdater.updateConfigPath = '/home/igor/work/webitel-phone/release-builds/win-unpacked/resources/app-update.yml';
      if (this.feed) {
        autoUpdater.setFeedURL(this.feed, [{ }]);
      }
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available.', info);
      if (this.channel) {
        this.channel.send('new-version', info)
      }
    });

    autoUpdater.on('update-not-available', (ev, info) => {
      console.log('Update not available.', ev, info);
      this.channel = null;
    });

    autoUpdater.on('error', (ev, err) => {
      console.log('Error in auto-updater.', ev, err);
      this.channel.send('update-version-error', err);
      this.channel = null;
    });

    autoUpdater.on('download-progress', (ev, progressObj) => {
      console.log('Download progress...', ev, progressObj);
    });

    autoUpdater.on('update-downloaded', (ev, info) => {
      console.log('Update downloaded;', ev, info);
      this.emit('update-downloaded', info)
    });
  }

  check(feed, channel) {
    this.feed = feed;
    this.channel = channel;
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
