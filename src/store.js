import Vue from 'vue'
import Vuex from 'vuex'
import User from './services/user'
import CDR from './services/cdr'
import Callback from './services/callback'
import settings from './services/settings'
import {findUserById} from "./services/helper";
import i18n from './services/i18n'

import CDRStore from './store/cdr'

Vue.use(Vuex);

const store = new Vuex.Store({
  debug: true,
  modules: {
    cdr: CDRStore
  },
  state: {
    i18n,
    emitter: new Vue(),
    viewSpinner: false,
    logged: false,
    lastLogged: null,
    user: null,
    search: "",
    status: null,
    theme: settings.get('theme'),
    internalUsers: [],
    calls: [],
    callback: null,
    reconnecting: false
  },
  getters: {
    i18n: state => () => state.i18n,

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

    internalUsers: state => () => {
      return state.internalUsers
    },

    theme: (state) => () => {
      return state.theme;
    },

    calls: (state) => () => {
      return state.calls;
    },

    callback: (state) => () => {
      return state.callback;
    },

    search: state => () => state.search,
    getSearch: state => () => state.search,

    reconnecting: state => () => state.reconnecting === true,

    isLogged: state => () => state.logged === true,

    lastLogged: state => () => state.lastLogged,

    viewSpinner: state => () => state.viewSpinner,

    status: state => () => state.status

  },

  mutations: {
    VIEW_SPINNER (state = {}, value) {
      state.viewSpinner = value
    },
    AUTH (state = {}, credentials) {
      state.user = new User(credentials);
      state.callback = new Callback(state.user);
      state.status = getStatus(state.user.state, state.user.status);

      Vue.http.headers.common['x-key'] = credentials.key;
      Vue.http.headers.common['x-access-token'] = credentials.token;
    },

    SET_RECONNECT (state = {}, value) {
      state.reconnecting = value;
      state.logged = state.reconnecting === false;
    },

    LOGIN (state = {}) {
      state.logged = true;
      state.lastLogged = Date.now();
      state.status = getStatus(state.user.state, state.user.status);
    },

    LOGOUT (state = {}) {
      state.logged = false;
      state.reconnecting = false;
      if (state.user) {
        state.user.logout();
        state.user = null;
        state.status = getStatus("NONREG");
      }
      state.search = "";
      state.internalUsers = [];
      state.calls = [];
      state.callback = null;

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
          state.user.setState(data.state, data.away, data.tag, data.inCC);
          state.status = getStatus(user.state, user.status);
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
    viewSpinner({ commit, state }, view) {
      commit("VIEW_SPINNER", view)
    },

    publish({ state }, event = {}) {
      state.emitter.$emit(event.name, event.data)
    },

    subscribe({state}, sub = {}) {
      state.emitter.$on(sub.name, sub.fn)
    }
  }
});

export default store

function getStatus(state, status) {
  if (state === 'ONHOOK' && status === 'NONE' ) {
    return 'ready'
  } else if (state === 'ISBUSY' && status === 'ONBREAK') {
    return 'break'
  } else if (state === 'ISBUSY') {
    return 'busy'
  } else {
    return 'nonreg'
  }
}
