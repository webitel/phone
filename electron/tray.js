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
  switch (state.status) {
    case "online":
      return "ready";
    case "pause":
      return "break";
    default:
      return "nonreg"
  }
};

const getContextMenu = (state = {}, tray) => {
  const template = [
    {
      label: tray.state.hide ? tray.i18n.t('app.show') : tray.i18n.t('app.hide'),
      click: () => tray.emit('toggle-show')
    },
    {type: 'separator'}
  ];

  // if logged
  if (state.status !== 'nonreg') {
    const statusMenu = {
      label: tray.i18n.t('changeStatus.status'),
      submenu: [
        // {
        //   label: tray.i18n.t('user.statusReady'),
        //   click: () => tray.emit('set-status', {status: "online"})
        // },
        // {
        //   label: tray.i18n.t('user.statusBusy'),
        //   submenu: [
        //     {
        //       label: tray.i18n.t('user.stateDND'),
        //       click: () => tray.emit('set-status', {status: "Busy", state: "DND"})
        //     },
        //     {
        //       label: tray.i18n.t('user.statusOnBreak'),
        //       click: () => tray.emit('set-status', {status: "Busy", state: "ONBREAK"})
        //     }
        //   ]
        // }
      ]
    }

    for (let status of tray.statusList) {
      if (status.items.length) {
        statusMenu.submenu.push({
          label: tray.i18n.t('user.' + status.id),
          submenu: status.items.map( i => {
            return {
              label: i,
              click: () => tray.emit('set-status', {status: status.id, payload: i})
            }
          })
        })

      } else {
        statusMenu.submenu.push({
          label: tray.i18n.t('user.' + status.id),
          click: () => tray.emit('set-status', {status: status.id})
        })
      }
    }

    template.push(statusMenu);

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
      label: tray.i18n.t('app.alwaysOnTop'),
      type: 'checkbox',
      checked: tray.state.alwaysOnTop,
      click: (i) => {
        tray.state.alwaysOnTop = i.checked;
        tray.emit('always-on-top', i.checked)
      }
    },
    {
      label: tray.i18n.t('app.documentation'),
      click: () => tray.emit('open-documentation')
    },
    {
      label: tray.i18n.t('app.close'),
      click: () => tray.emit('quit')
    }
  );

  return template;
};

class TrayMenu extends EventEmitter {
  constructor(i18n, links = [], pauseDescriptions = [], partialState) {
    super();
    this.tray = null;
    this.state = {
      status: 'nonreg',
      alwaysOnTop: false,
      hide: false
    };
    this.links = [];

    this.statusList = [
      {id: "pause", title: 'Pause', items: pauseDescriptions},
      {id: "online", title: 'Online', items: []},
      {id: "offline", title: 'Offline', items: []}
    ]

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

  destroy() {
    if (!this.tray)
      return;
    this.tray.destroy();
    this.tray = null;
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
    const imgFile = getTrayIconPath(this.state);
    if (this.imgFile === imgFile) {
      return;
    }
    this.imgFile = imgFile;
    this.tray.setImage(imgFile);

    const contextMenu = Menu.buildFromTemplate(getContextMenu(this.state, this));
    this.tray.setContextMenu(contextMenu);
  }
}

module.exports = TrayMenu;
