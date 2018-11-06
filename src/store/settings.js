import settings from '../services/settings'

export default {
  namespaced: true,
  state: {
    provider: settings,
    useWebPhone: false,
    sipAutoAnswer: false,
    autoLoginCallCenter: false,
    agentOnDemand: false,
    usePostProcess: false,
    notifyNewCall: false,
    notifyMissedCall: false,
    iceServers: false,
    ringInboundCall: false,
    audioInDevice: null,
    audioOutDevice: null,
    ringInboundSinkId: null,
    theme: null,
    audioInDevices: [],
    audioOutDevices: [],
  },
  getters: {

  },
  mutations: {
    setUseWebPhone({ state, commit, rootGetters }, payload) {

    }
  }
}
