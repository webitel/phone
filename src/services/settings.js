class Settings {
  constructor(storage) {
    this.storage = storage;
  }

  get(name) {
    return this.storage.get(name)
  }

  set(name, val) {
    this.storage.set(name, val)
  }
}

class LocalStorage {
  get(name) {
    const val = localStorage.getItem(name);
    if (val === 'true') {
      return true
    } else if (val === 'false') {
      return false
    } else {
      return val
    }
  }

  set(name, val) {
    localStorage.setItem(name, val)
  }
}

// TODO
const settings = (typeof window.WEBITEL_CONFIG === 'object') ? window.WEBITEL_CONFIG : new Settings(new LocalStorage());

export default settings
