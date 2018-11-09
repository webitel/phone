const url = require('url');
const { EventEmitter } = require('events');
const { BrowserWindow, shell } = require('electron').remote;
const Positioner = require('electron-positioner');

class NotificationNewCall extends EventEmitter {
  constructor(call, {direction}) {
    super();
    let win = new BrowserWindow({
      focus: true,
      frame: false,
      show: false,
      width: 310,
      height: 150,
      resizable: false,
      // backgroundColor: 'transparent',
      transparent: true,
      titleBarStyle: 'default'
    });

    win.on('answer-call', this.answerCall.bind(this));
    win.on('hangup-call', this.hangupCall.bind(this));
    win.on('toggle-hold-call', this.toggleHold.bind(this));
    win.on('close-window', this.close.bind(this));

    win.loadURL(url.format({ pathname:'notificationNewCall.html', protocol: 'file', slashes: true }));
    this.win = win;
    this.call = call;

    win.once('ready-to-show', () => {
      win.webContents.send('init', {
        number:  this.call.number,
        name:  this.call.name,
        answeredAt:  this.call.answeredAt,
        theme: WEBITEL_APP.getTheme(),
        callInfo: this.call.info,
        translate: {
          "notificationNewCall.answer": WEBITEL_APP.t("notificationNewCall.answer"),
          "notificationNewCall.refuse": WEBITEL_APP.t("notificationNewCall.refuse"),
          "notificationNewCall.hold": WEBITEL_APP.t("notificationNewCall.hold"),
          "notificationNewCall.unHold": WEBITEL_APP.t("notificationNewCall.unHold"),
          "notificationNewCall.hangup": WEBITEL_APP.t("notificationNewCall.hangup"),
          "notificationNewCall.close": WEBITEL_APP.t("notificationNewCall.close"),
        }
      });
    });


    win.webContents.on('new-window', function(event, url){
      event.preventDefault();
      shell.openExternal(url);
    });

    win.once('set-show', ({mh = 150}) => {
      win.setAlwaysOnTop(true);
      win.setResizable(true);
      win.setSize(310, mh);
      win.setResizable(false);
      new Positioner(win).move(direction || 'topRight');
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
      this.win.close()
    } catch (e) {
      console.warn(e)
    }
  }
}

module.exports = NotificationNewCall;
