class Settings {
  constructor(type, config = {}) {
    this.type = type;
    this.storage = new LocalStorage();
  }

  get(name) {
    return this.storage.get(name)
  }

  set(name, val) {
    this.storage.set(name, val)
  }
}

class FileStorage {
  
}

class LocalStorage {
  get(name) {
    return localStorage.getItem(name)
  }

  set(name, val) {
    localStorage.setItem(name, val)
  }
}

const settings = new Settings();

export default settings
