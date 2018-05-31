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
    return localStorage.getItem(name)
  }

  set(name, val) {
    localStorage.setItem(name, val)
  }
}

// TODO
const settings = (typeof window.WEBITEL_CONFIG === 'object') ? window.WEBITEL_CONFIG : new Settings(new LocalStorage());

export default settings
