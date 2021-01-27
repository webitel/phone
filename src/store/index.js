import Vue from 'vue'
import Vuex from 'vuex'
import User from '../services/user'
import Callback from '../services/callback'
import {Configuration} from 'webitel-sdk'
import settings from '../services/settings'
import {findUserById} from "../services/helper";
import i18n from '../services/i18n'

import CDRStore from '../store/cdr'
import UsersStore from '../store/users'
import VersionStore from '../store/version'
import AuthenticationStore from '../store/authentication'

Vue.use(Vuex);

const store = new Vuex.Store({
  debug: true,
  modules: {
    cdr: CDRStore,
    users: UsersStore,
    version: VersionStore,
    authentication: AuthenticationStore
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
    sipReg: false,
    deviceId: null,
    theme: settings.get('theme'),
    internalUsers: [],
    calls: [],
    callback: null,
    reconnecting: false,

    apiConfiguration: null
  },
  getters: {
    i18n: state => () => state.i18n,
    sipReg: state => () => state.sipReg,
    deviceId: state => () => state.deviceId,
    apiConfiguration: state => () => state.apiConfiguration,

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
    SET_SIP_REG (state = {}, value) {
      state.sipReg = value
    },
    SET_SIP_DEVICE (state = {}, value) {
      state.deviceId = value
    },
    CHANGE_USER_STATUS (state = {}, value) {
      state.status = value
    },
    VIEW_SPINNER (state = {}, value) {
      state.viewSpinner = value
    },
    AUTH (state = {}, credentials) {
      state.apiConfiguration = new Configuration({
        apiKey: credentials.token,
        basePath: credentials.server
      });
      state.user = new User(credentials);
      // state.callback = new Callback(state.user);
      state.status = state.user.status;

      Vue.http.headers.common['X-Webitel-Access'] = credentials.token;
    },

    SET_RECONNECT (state = {}, value) {
      state.reconnecting = value;
      state.logged = state.reconnecting === false;
    },

    LOGIN (state = {}) {
      state.logged = true;
      state.lastLogged = Date.now();
      state.status = state.user.status;
    },

    LOGOUT (state = {}) {
      state.logged = false;
      state.reconnecting = false;
      state.apiConfiguration = null;

      if (state.user) {
        state.user.logout();
        state.user = null;
        state.status = getStatus("NONREG");
      }
      state.search = "";
      state.internalUsers = [];
      state.calls = [];
      state.callback = null;

      Vue.http.headers.common['X-Webitel-Access'] = '';
    },

    //FIXME
    CLEAN_SESSION (state = {}) {
      state.logged = false;
      state.reconnecting = false;
      state.apiConfiguration = null;

      if (state.user) {
        state.status = getStatus("NONREG");
      }
      state.search = "";
      state.internalUsers = [];
      state.calls = [];
      state.callback = null;

      localStorage.removeItem('token');

      Vue.http.headers.common['X-Webitel-Access'] = '';
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
    },
    SET_CURRENT_VERSION(state, version)  {
      state.version = version;
    }
  },
  actions: {
    viewSpinner({ commit, state }, view) {
      commit("VIEW_SPINNER", view)
    },

    logout({ commit }) {
      commit("LOGOUT");
      commit("cdr/RESET_PAGINATION");
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
  return 'break';
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
