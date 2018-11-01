
export default {
  namespaced: true,
  state: {
    current: null,
    new: null,
    status: {
      stage: 1,
      loading: false,
      progress: null,
      error: null
    }
  },
  getters: {
    current: state => state.current,
    new: state => state.new,
    progress: state => state.status.progress,
    stage: state => () => state.status.stage,
  },
  mutations: {
    SET_VERSION(state, ver) {
      state.current = ver;
    },
    SET_NEW_VERSION(state, ver) {
      state.new = ver;
    },
    SET_ERROR(state, err) {
      state.status.error = err;
      state.status.stage = 3;
      console.error(err);
    },
    DOWNLOAD(state) {
      state.status.stage = 2;
    },
    DOWNLOADED(state) {
      state.status.stage = 3;
    },
    CLOSE(state) {
      state.status.stage = 4;
      state.new = null;
      state.status.loading = false;
      state.status.progress = null;
    }
  },
  actions: {
    upgrade({commit}) {
      commit('DOWNLOAD');
      setTimeout(() => {
        commit('DOWNLOADED');
      }, 1000)
    },
    restart({commit}) {
      commit('CLOSE')
    }
  }
}
