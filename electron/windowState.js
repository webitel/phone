const path = require("path");
const fs = require("fs");
const electron = require('electron');
const app = electron.app;

class WindowState {
  constructor(name, defaults) {
    this.name = name;
    this.path = path.join(app.getPath('userData'), `window-${this.name}-state.json`);
    this.state = {
      width: defaults.width,
      height: defaults.height
    };

    try {
      this.state = JSON.parse(fs.readFileSync(this.path, 'utf8')) || this.state;
    } catch (err) {
      console.error(`Failed to load "${ name }" window state`);
      console.error(err);
    }
  }

  get x() {
    return this.state.x && Math.floor(this.state.x);
  }
  get y() {
    return this.state.y && Math.floor(this.state.y);
  }

  get width() {
    return this.state.width && Math.floor(this.state.width);
  }
  get height() {
    return this.state.height && Math.floor(this.state.height);
  }
  get isMaximized() {
    return this.state.isMaximized
  }
  get isMinimized() {
    return this.state.isMinimized
  }
  get isHidden() {
    return this.state.isHidden
  }

  loadState(window) {
    if (this.x !== undefined && this.y !== undefined) {
      window.setPosition(this.x, this.y, false);
    }

    if (this.width !== undefined && this.height !== undefined) {
      window.setSize(this.width, this.height, false);
    }

    //todo  win10: error, position 0 0
    //this.isMaximized ? window.maximize() : window.unmaximize();
    this.isMinimized ? window.minimize() : window.restore();
    this.isHidden ? window.hide() : window.show();
  }

  saveState(window) {
    if (window.isDestroyed()) {
      return;
    }

    this.state.isMaximized = window.isMaximized();
    this.state.isMinimized = window.isMinimized();
    this.state.isHidden = !window.isMinimized() && !window.isVisible();

    if (!this.state.isMaximized && !this.state.isHidden) {
      [this.state.x, this.state.y] = window.getPosition();
      [this.state.width, this.state.height] = window.getSize();
    }

    fs.writeFileSync(this.path, JSON.stringify(this.state));
  }
}

module.exports = WindowState;
