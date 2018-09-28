import Webitel from './webitel'
import store from '../store'
import settings from './settings'
import InternalUser from './internalUser'
import Call from './call'
import Vue from 'vue'

import VertoLib from './verto'
import CONST from "./const";
import notification from "./notification";

const WebitelVerto = VertoLib.verto;

class User extends InternalUser {
  constructor(credentials) {
    super(credentials);
    this.role = credentials.roleName;
    this.verto = credentials.verto;
    this.domain = credentials.domain;
    this.id = credentials.id;
    this.number = credentials.id.split('@')[0];

    this._token = credentials.token;
    this._key = credentials.key;

    this._acl = credentials.acl;

    this.devices = null;

    this.webPhoneRegister = false;

    this.name = '';

    this.isAgent = false;

    this.apiServer = credentials.server;
    if (credentials.cdr && `${credentials.cdr.useProxy}`=== 'false' && credentials.cdr.host) {
      this.cdrServer = credentials.cdr.host.replace(/\/$/, '')
    } else {
      this.cdrServer = this.apiServer
    }

    this.webitel = new Webitel({
      server : serverUriToWs(credentials.server),
      account: this.id,
      key: this.getKey(),
      token: this.getToken(),
      debug  : true,
      reconnect: -1
    });

    this.webPhone = null;

    this.webitel.onError((e) => {
      switch (e.errorType) {
        case "AUTH-ERROR":
          store.commit('LOGOUT');
          break;
      }
      console.error(e)
    });

    var mustLoginCC = settings.get('autoLoginCallCenter');

    this.webitel.onReady( (user) => {

      if (`${settings.get('useHotdesk')}` === 'true' && settings.get('hotdeskId')) {
        this.signHotdesk(settings.get('hotdeskId'));
      }

      this.webitel.getAgentsList( list => {
        const internalList = [];

        for (let user of list) {
          if (user.id === this.number) {
            this.name = user.name;
            this.isAgent = user.agent;

            if (mustLoginCC && user.isAgent && !user.inCC && user.state !== 'NONREG') {
              mustLoginCC = false;
              this.loginCC();
            }

            this.setState(user.state, user.away, user.tag, user.inCC)
          }
          internalList.push(new InternalUser(user));
        }
        store.commit("INIT_INTERNAL_USERS", internalList);
      });
      store.commit("LOGIN");
    });

    this.webitel.onRegisterWebRTC( vertoSession => {
      this.webPhone = vertoSession;
      this.webPhoneRegister = true;
    });
    this.webitel.onUnRegisterWebRTC( e => {
      this.webPhone = null;
      this.webPhoneRegister = false
    });

    this.webitel.onUserStatusChange( (e) => {
      if (mustLoginCC && e.id === this.number && e.state !== 'NONREG') {
        mustLoginCC = false;
        if (!e.inCC)
          this.loginCC();
      }
      store.commit("CHANGE_INTERNAL_USER_STATE", e);
    });

    this.webitel.onNewCall( e => {
      new Call(e);
    });

    this.webitel.onDtmfCall(dtmf => {
      const call = store.getters.getCallByUuid(dtmf.call.uuid);
      if (call) {
        call.onDtmf(dtmf.digits);
      }
    });

    this.webitel.onAcceptCall(webitelCall => {
      const call = store.getters.getCallByUuid(webitelCall.uuid);
      if (call) {
        call.OnAnswer(webitelCall);
      }
    });

    this.webitel.onBridgeCall(webitelCall => {
      const call = store.getters.getCallByUuid(webitelCall.uuid);
      if (call) {
        call.onBridge(webitelCall)
      }
    });

    this.webitel.onHoldCall(webitelCall => {
      const call = store.getters.getCallByUuid(webitelCall.uuid);
      if (call) {
        call.onHold();
      }
    });

    this.webitel.onUnholdCall(webitelCall => {
      const call = store.getters.getCallByUuid(webitelCall.uuid);
      if (call) {
        call.onActive();
      }
    });

    this.webitel.onHangupCall(e => {
      const call = store.getters.getCallByUuid(e.uuid);
      if (call) {
        call.setHangupTime(e.hangup_cause);
        if ((!call.postProcessing || !settings.get('usePostProcess')) ||
          (call.direction === 'inbound' && !call.answeredAt)) {
          call.destroy();
        }
      }
    });

    this.webitel.onDisconnect(() => {
      if (store.getters.isLogged()) {
        store.commit("SET_RECONNECT", true);
      }
    });

    this.webitel.connect();

    if (settings.get('useWebPhone') && settings.get('webrtcPassword')) {
      this.registerWebPhone();
    }
  }

  accessToResource(resource, permit) {
    if (!this._acl[resource])
      return false;

    return !!~this._acl[resource].indexOf(permit) || !!~this._acl[resource].indexOf('*');
  }

  setWebPhoneMicrophone(id) {
    if (this.webPhone) {
      this.webPhone.deviceParams({useMic: id || 'any'});
      return true;
    }
    return false;
  }
  setWebPhoneSpeak(id) {
    if (this.webPhone) {
      this.webPhone.deviceParams({useSpeak: id || 'any'});
      return true;
    }
    return false;
  }

  setWebPhoneIceServers(val) {
    if (this.webPhone) {
      this.webPhone.iceServers(val);
      return true;
    }
    return false;
  }

  registerWebPhone() {
    this.webitel.webrtcPhoneStart({
      login: this.id,
      password: settings.get('webrtcPassword'),
      iceServers: settings.get('iceServers'),
      deviceParams: {
        useMic: settings.get('audioInDevice') || "any",
        useSpeak: settings.get('audioOutDevice') || "any"
      },
      videoParams: {},
      ws_servers: this.verto
    })
  }

  unRegisterWebPhone() {
    this.webitel.webrtcPhoneStop()
  }

  logout() {
    this.webitel.disconnect();
    this.unRegisterWebPhone();
    this.webitel = null;
    this.apiRequest('post', '/logout');
  }

  getToken() {
    return this._token;
  }

  getKey() {
    return this._key;
  }

  storageRequest(method = 'get', resource = '', body) {
    return this.request(this.cdrServer, method, resource, body);
  }

  apiRequest(method = 'get', resource = '', body) {
    return this.request(this.apiServer, method, resource, body);
  }

  getDevices(refresh) {
    if (!refresh && this.devices) {
      return new Promise(resolve => resolve(this.devices));
    }
    return new Promise((resolve, reject) => {
      WebitelVerto.init({skipPermCheck: true}, ()=> {
        this.devices = {
          audioInDevices: WebitelVerto.audioInDevices,
          audioOutDevices: WebitelVerto.audioOutDevices,
          videoDevices: WebitelVerto.videoDevices
        };
        resolve(this.devices)
      })
    });
  }

  request(server = '', method = 'get', resource = '', body) {
    method = method.toLocaleLowerCase();
    switch (method) {
      case 'get':
        return Vue.http.get(`${server}${resource}`);
      default:
        return Vue.http[method](`${server}${resource}`, body);
    }
  }

  makeCall(number) {
    this.webitel.call(number, null, settings.get('sipAutoAnswer'))
  }

  loginCC(reset) {
    //TODO bug server
    // if (this.loggedCC && !reset) {
    //   return;
    // }

    let param = null;
    if (settings.get('agentOnDemand')) {
      param = {'status': "Available (On Demand)"};
    }
    this.webitel.loginCallCenter(param, () => {

    })
  }

  logoutCallCenter() {
    if (this.loggedCC)
      this.webitel.logoutCallCenter();
  }

  setReady() {
    this.webitel.ready();
  }

  setBusy(state = "", tag = "") {
    this.webitel.busy(state, tag);
  }

  setOnBreak() {
    this.webitel.busy("ONBREAK", "");
  }

  signHotdesk(name) {
    this.webitel.hotdeskSignIn(name, (res) => {
      if (res.status === 1) {
        notification(`Hot desk ${name} error:`, res.response.trim(), CONST.HOT_DESK_ERROR);
      }
    })
  }
}

function serverUriToWs(uri = "") {
  return uri.replace(/^http/, 'ws')
}

export default User
