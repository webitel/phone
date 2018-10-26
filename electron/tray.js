const path = require('path');
const { EventEmitter } = require('events');
const {app, Menu, Tray, shell} = require('electron').remote;

const getTrayIconPath = (state) => {
  const iconDir = {
    win32: 'windows',
    linux: 'linux',
    darwin: 'osx',
  }[process.platform];
  const fileName = `icon-tray-${ getTrayIconFileNameSuffix(state) }.${ process.platform === 'win32' ? 'ico' : 'png' }`;
  return path.join(__dirname, 'static', 'img', 'icons', iconDir, fileName);
};

const getTrayIconFileNameSuffix = (state = {}) => {
  return state.status || 'nonreg'
};

const getContextMenu = (state = {}, tray) => {
  const template = [
    {
      label: tray.state.hide ? tray.i18n.t('app.open') : tray.i18n.t('app.hide'),
      click: () => tray.emit('toggle-show')
    },
    {type: 'separator'}
  ];

  if (state.status !== 'nonreg') {
    template.push({
      label: tray.i18n.t('changeStatus.status'),
      submenu: [
        {
          label: tray.i18n.t('user.statusReady'),
          click: () => tray.emit('set-status', {status: "Ready"})
        },
        {
          label: tray.i18n.t('user.statusCallCenter'),
          submenu: [
            {
              label: tray.i18n.t('user.stateCCWaiting'),
              click: () => tray.emit('set-status', {status: "Call Center", state: "Waiting"})
            },
            {
              label: tray.i18n.t('user.statusOnBreak'),
              click: () => tray.emit('set-status',  {status: "Call Center", state: "OnBreak"})
            }
          ]
        },
        {
          label: tray.i18n.t('user.statusBusy'),
          submenu: [
            {
              label: tray.i18n.t('user.stateDND'),
              click: () => tray.emit('set-status', {status: "Busy", state: "DND"})
            },
            {
              label: tray.i18n.t('user.statusOnBreak'),
              click: () => tray.emit('set-status', {status: "Busy", state: "ONBREAK"})
            }
          ]
        }
      ]
    });

    if (tray.links.length) {
      const links = {
        label: tray.i18n.t('app.links'),
        submenu: tray.links.map( item => {
          const src = item.src;
          return {
            label: item.name || "unknown",
            click: () => shell.openItem(src)
          }
        })
      };

      template.push(links)
    }

  }

  template.push(
    {type: 'separator'},
    {
      label: tray.i18n.t('app.AlwaysOnTop'),
      type: 'checkbox',
      checked: tray.state.alwaysOnTop,
      click: (i) => {
        tray.state.alwaysOnTop = i.checked;
        tray.emit('always-on-top', i.checked)
      }
    },
    // {
    //   label: tray.i18n.t('settings.notifyNewCall'),
    //   type: 'checkbox',
    //   checked: tray.state.notifyNewCall,
    //   click: (i) => {
    //     tray.state.notifyNewCall = i.checked;
    //     tray.emit('notify-new-call', i.checked)
    //   }
    // },
    {
      label: tray.i18n.t('app.close'),
      click: () => tray.emit('quit')
    }
  );

  return template;
};

class TrayMenu extends EventEmitter {
  constructor(i18n, links = [], partialState) {
    super();
    this.tray = null;
    this.state = {
      status: 'nonreg',
      alwaysOnTop: false,
      hide: false
    };
    this.links = [];

    if (links && links.length) {
      for (let link of links) {
        this.links.push(link)
      }
    }

    this.i18n = i18n;

    this.state = {
      ...this.state,
      ...partialState,
    };

    this.createTrayIcon();
  }

  createTrayIcon() {
    this.tray = new Tray(getTrayIconPath(this.state));
    this.tray.setToolTip(app.getName());
    this.tray.on('click', () => {
      this.emit('toggle-show')
    });

    this.update();
  }

  setState(partialState) {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.update();
  }

  update() {
    // this.tray.setToolTip('This is my application.');
    this.tray.setImage(getTrayIconPath(this.state));

    const contextMenu = Menu.buildFromTemplate(getContextMenu(this.state, this));
    this.tray.setContextMenu(contextMenu);
  }
}

module.exports = TrayMenu;
