import Vue from 'vue'

export default {
  namespaced: true,
  state: {
    users: [],
    filter: "",
    page: 1,
    end: false,
    total: 0,
    status: {
      loading: false,
      success: true,
      error: false
    }
  },
  getters: {
    items: (state, getters, rootState) => {
      if (state.filter !== rootState.search) {
        return []
      }
      return state.users
    },
    loading: state => state.status.loading,
    total: state => state.total,
    haveMoreData: state => !state.end,
    error: state => state.status.error
  },
  mutations: {
    RESET_PAGINATION(state, payload) {
      state.filter = payload;
      state.page = 1;
      state.total = 0;
      state.end = false;
      state.users= [];
    },
    SET_END_PIPE_DATA(state) {
      state.end = true
    },
    ADD_PAGE(state) {
      state.page++;
    },
    LOADING(state){
      state.status = {
        loading: true,
        success: false,
        error: false
      };
    },
    SUCCESS(state){
      state.status = {
        loading: false,
        success: true,
        error: false
      };
    },
    ERROR(state,payload){
      state.status = {
        loading: false,
        success: false,
        error: payload
      };
      state.end = true;
    },
    CLEAR_ERROR(state){
      state.status = {
        loading: false,
        success: false,
        error: false
      };
    },
    SET_DATA(state, {items, next}) {
      if (!items) {
        state.end = true;
        return;
      }
      state.total = 1;
      state.end =  !next; //!next; //FETCH_COUNT > hits.length;
      state.users = state.users.concat(...items)
    }
  },
  actions: {
    fetch({state, commit, rootGetters}, payload = {}) {

      if (state.status.loading) {
        console.error("LOADING");
        return;
      }

      if (!rootGetters.user()) {
        return console.error('no session');
      }

      if (state.filter === rootGetters.search() && !payload.reset) {
        //return;
      }

      if (payload.reset || state.filter !== rootGetters.search()) {
        commit('RESET_PAGINATION', rootGetters.search());
      } else {
        if (state.end) {
          console.error("END");
          return;
        }
        commit('ADD_PAGE')
      }
      commit('LOADING');

      function filter(filter = "") {
        if (filter) {
          return `&name=${encodeURIComponent(filter)}*`
        }

        return '';
      }

      Vue.http.get(`${rootGetters.apiConfiguration().basePath}/users?size=20${filter(rootGetters.search())}&page=${+state.page}&fields=id&fields=name&fields=extension&fields=presence`)
        .then(result => {
          commit('SUCCESS');
          commit('SET_DATA', result.data);
        })
        .catch(e => {
          commit('ERROR', e.message);
        })
    },

    clearError({ commit }) {
      commit('CLEAR_ERROR');
    }

  }
}
