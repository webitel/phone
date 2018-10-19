const fs = require('fs');
const path = require('path');
const systemConfigFileName = 'config.json';
const userConfigFileName = 'user_config.json';
const app = require('electron').remote.app;

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

window.WEBITEL_CONFIG = new FileStorage({}, findUserConfigFilePath(userConfigFileName));
window.isElectron = true;
window.initPhone = (store) => {
  console.error(store);
};

function findUserConfigFilePath(fileName) {
  if (fs.existsSync(path.join(__dirname, fileName))) {
    return path.join(__dirname, fileName);
  }

  return path.join(app.getPath('userData'), fileName);
}
