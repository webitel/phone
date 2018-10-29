const url = require('url');
const { EventEmitter } = require('events');
const { BrowserWindow, app, shell } = require('electron').remote;
const WindowState = require('./windowState');
const windowState = new WindowState(app.getPath('userData'), 'notification', {});

class NotificationNewCall extends EventEmitter {
  constructor(call) {
    super();
    let win = new BrowserWindow({
      focus: true,
      frame: false,
      show: false,
      width: 310,
      height: 150,
      resizable: false,
      transparent: true,
      titleBarStyle: 'default',
      hasShadow: false,
    });

    win.on('answer-call', this.answerCall.bind(this));
    win.on('hangup-call', this.hangupCall.bind(this));
    win.on('toggle-hold-call', this.toggleHold.bind(this));
    win.on('close-window', this.close.bind(this));

    win.loadURL(url.format({ pathname:'miniCall.html', protocol: 'file', slashes: true }));
    this.win = win;
    this.call = call;

    win.once('ready-to-show', () => {
      windowState.loadState(win);
      win.webContents.send('init', {
        number:  this.call.getName(),
        theme: WEBITEL_APP.getTheme(),
        callInfo: this.call.info,
        translate: {
          "notificationNewCall.answer": WEBITEL_APP.t("notificationNewCall.answer"),
          "notificationNewCall.refuse": WEBITEL_APP.t("notificationNewCall.refuse"),
          "notificationNewCall.hold": WEBITEL_APP.t("notificationNewCall.hold"),
          "notificationNewCall.hangup": WEBITEL_APP.t("notificationNewCall.hangup")
        }
      });
    });


    win.webContents.on('new-window', function(event, url){
      event.preventDefault();
      shell.openItem(url)
    });

    win.once('set-show', ({mh = 150}) => {
      win.setAlwaysOnTop(true);
      win.setResizable(true);
      win.setSize(310, mh);
      win.setResizable(false);
      win.show()
    });

    // win.webContents.openDevTools()
  }

  closeWindow() {
    this.win.close();
  }
  hangupCall() {
    this.call.hangup();
  }
  toggleHold() {
    this.call.toggleHold();
  }
  answerCall() {
    this.call.answer();
  }

  onAnswer () {
    this.win.webContents.send('answer');
  }

  onActive() {
    this.win.webContents.send('active');
  }

  onHold() {
    this.win.webContents.send('hold');
  }

  close() {
    this.call = null;
    try {
      windowState.saveState(this.win);
      this.win.close()
    } catch (e) {
      console.warn(e)
    }
  }
}

module.exports = NotificationNewCall;
