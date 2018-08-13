import Vue from 'vue'
import Vuex from 'vuex'
import User from './services/user'
import CDR from './services/cdr'
import settings from './services/settings'
import {findUserById} from "./services/helper";

Vue.use(Vuex);

const store = new Vuex.Store({
  debug: true,
  state: {
    logged: false,
    user: null,
    search: "",
    theme: settings.get('theme'),
    internalUsers: [],
    calls: [],
    cdr: null,
    reconnecting: false
  },
  getters: {
    countCalls: state => () => {
      return state.calls.length;
    },

    countInboundNoAnswerCall: state => () => {
      return state.calls.filter(call => call.direction === 'inbound' && !call.answeredAt).length
    },

    getCallByUuid: (state) => (uuid) => {
      return state.calls.find(call => call.uuid === uuid)
    },

    otherCalls: state => (uuid) => {
      const calls = state.calls.find(call => call.uuid !== uuid);
      if (calls instanceof Array) {
        return calls
      } else {
        return [calls]
      }
    },

    webitel: (state) => () => {
      if (state.user)
        return state.user.webitel;

      return null;
    },

    user: (state) => () => {
      return state.user;
    },

    theme: (state) => () => {
      return state.theme;
    },

    calls: (state) => () => {
      return state.calls;
    },

    cdr: (state) => () => {
      return state.cdr;
    },

    getSearch: state => () => state.search,

    reconnecting: state => () => state.reconnecting === true,

    isLogged: state => () => state.logged === true
  },

  mutations: {
    AUTH (state = {}, credentials) {
      state.user = new User(credentials);
      state.cdr = new CDR(state.user);
      Vue.http.headers.common['x-key'] = credentials.key;
      Vue.http.headers.common['x-access-token'] = credentials.token;
    },

    SET_RECONNECT (state = {}, value) {
      state.reconnecting = value;
      state.logged = state.reconnecting === false
    },

    LOGIN (state = {}) {
      state.logged = true;
    },

    LOGOUT (state = {}) {
      state.logged = false;
      state.reconnecting = false;
      if (state.user) {
        state.user.logout();
        state.user = null;
      }
      state.search = "";
      state.internalUsers = [];
      state.calls = [];
      state.cdr = null;
      Vue.http.headers.common['x-key'] = '';
      Vue.http.headers.common['x-access-token'] = '';
      settings.set('webrtcPassword', '');
    },

    SET_THEME (state = {}, value) {
      state.theme = value;
    },

    INIT_INTERNAL_USERS (state = {}, list) {
      state.internalUsers = list;
    },

    CHANGE_INTERNAL_USER_STATE (state = {}, data = {}) {
      const user = findUserById(state.internalUsers, data.id);
      if (user) {
        user.setState(data.state, data.away, data.tag, data.inCC);
        if (state.user && state.user.id === `${data.id}@${data.domain}`) {
          state.user.setState(data.state, data.away, data.tag, data.inCC)
        }
      }
    },

    CHANGE_SEARCH (state = {}, val = "") {
      state.search = val;
    },

    ON_NEW_CALL (state, call) {
      state.calls.push(call)
    },

    ON_CLOSE_CALL (state, uuid) {
      for (let i = 0; i < state.calls.length; i++) {
        if (state.calls[i].uuid === uuid) {
          state.calls.splice(i, 1);
          return;
        }
      }
    }
  },
  actions: {

  }
});

export default store
