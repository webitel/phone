//TODO
export default {
  namespaced: true,
  state: {
    queue: [],
    request: false
  },
  getters: {
    request: state => state.request,
    credentials: state => () => state.credentials,
  },
  mutations: {
    "SET_REQUEST"(state, cb) {
      state.request = true;
      state.queue.push(cb)
    },
    "CLOSE_REQUEST"(state, credentials) {
      state.request = false;
      const cb = state.queue.pop();
      if (typeof cb === 'function') {
        cb.apply(null, [credentials]);
      }
    },
  },
  actions: {
  }
}
