
export default {
  namespaced: true,
  state: {
    current: null,
    new: null,
    status: {
      stage: 1,
      loading: false,
      progress: 0,
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
      state.status.loading = false;
      state.status.progress = 0;
    },
    SET_PROGRESS(state, progress) {
      state.status.progress = progress;
    },
    DOWNLOAD(state) {
      state.status.loading = true;
      state.status.stage = 2;
    },
    DOWNLOADED(state) {
      state.status.loading = false;
      state.status.stage = 3;
    },
    CLOSE(state) {
      state.status.stage = 4;
      state.status.progress = 0;
      state.new = null;
      state.status.loading = false;
      state.status.progress = null;
    },
    LATER(state) {
      state.new = null;
    }
  },
  actions: {
    upgrade({commit}) {
      commit('DOWNLOAD');
    },
    restart({commit}) {
      commit('CLOSE')
    },
    later({commit}) {
      commit('LATER')
    }
  }
}
