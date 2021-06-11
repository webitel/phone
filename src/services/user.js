import store from '../store'
import settings from './settings'
import InternalUser from './internalUser'
import Call from './call'
import Vue from 'vue'

import CONST from "./const";
import notification from "./notification";
import executor from './executor'

import {Client, CallActions} from 'webitel-sdk'

import {SipPhone} from 'webitel-sdk/esm2015/sip/webrtc'

const ExecEvents = {
  NEW_CALL: "new_call",
  ANSWER: "answer",
  HOLD: "hold",
  UNHOLD: "unhold",
  BRIDGE: "bridge",
  DTMF: "dtmf",
  HANGUP: "hangup",
};

class User extends InternalUser {
  constructor(credentials) {
    super(credentials);
    this.role = credentials.roleName;
    this.domain = credentials.domain;
    this.id = credentials.user_id;
    this.number = credentials.extension;

    this.executor = executor();

    this._token = credentials.token;

    this._acl = credentials.acl;

    this.devices = null;
    this.agent = null;

    this.webPhoneRegister = false;

    this.name = credentials.name;

    this.apiServer = credentials.server;

    this.webitel = new Client({
      endpoint: serverUriToWs(this.apiServer),
      // endpoint: "ws://192.168.177.199/ws",
      // endpoint: "wss://cloud.webitel.ua/ws",
      // endpoint: "ws://10.10.10.25:10025",
      token: this._token,
      registerWebDevice: false,
      debug: true,
    });

    window.cli = this.webitel;
    window.usr = this;

    this.webitel.on('disconnected', async () => {
      await this.disconnect();
      if (store.getters.isLogged()) {
        store.commit("SET_RECONNECT", true);
      }
    })

    this._usrAutoAnswer = localStorage.getItem('usrAutoAnswer') === "true";


    this.connect();
  }

  get usrAutoAnswer() {
    return this._usrAutoAnswer;
  }

  set usrAutoAnswer(val) {
    localStorage.setItem('usrAutoAnswer', val);
    this._usrAutoAnswer = val;
  }

  async connect() {
    const callHandler =  (action, call) => {
      switch (action) {
        case CallActions.Ringing: {
          new Call(call);
          if (call.autoAnswer || (this.usrAutoAnswer && call.direction === 'inbound')) {
            try {
              setTimeout(() => call.answer({}), 750);
            } catch (e) {
              console.error(e)
            }
          }

          this.exec(ExecEvents.NEW_CALL, call);
          break
        }
        case CallActions.Active: {
          const c = store.getters.getCallByUuid(call.id);
          if (c) {
            c.OnAnswer(call);
            this.exec(ExecEvents.ANSWER, call);

            try {
              for (let c of this.webitel.allCall()) {
                if (c !== call && !c.isHold) {
                  c.hold()
                }
              }
            } catch (e) {

            }
          }
          break
        }
        case CallActions.Hangup: {
          const c = store.getters.getCallByUuid(call.id);
          if (c) {
            c.setHangupTime(call.cause);
            c.destroy(); //todo
            this.exec(ExecEvents.HANGUP, call);
          }
          break
        }
      }
    };


    const agentStatusHandle = (agent) => {
      store.commit('CHANGE_USER_STATUS', agent.status);
    }

    await this.webitel.connect();
    await this.webitel.auth();
    await this.webitel.subscribeCall( callHandler, {});

    await this.registerSipDevice(settings.get("sipClient"));


    store.commit("LOGIN");

    try {
      const agent = await this.webitel.agentSession();
      this.agent = agent;
      store.commit('CHANGE_USER_STATUS', this.agent.status);

      await this.webitel.subscribeAgentsStatus(agentStatusHandle, {agent_id: agent.agentId});
    } catch (e) {
      console.error(e);
    }
  }

  async disconnect() {
    if (!this.webitel) {
      return;
    }

    if (this.webitel.phone) {
      await this.webitel.phone.unregister();
      if (this.webitel.phone.destroy) {
        await this.webitel.phone.destroy();
      }
    }
    await this.webitel.disconnect();
    this.webitel.eventHandler.off('*');

  }

  hasToken(token) {
    return this._token === token;
  }

  get agentCallState() {
    if (this.agent) {
      for (let st of this.agent.channels) {
        if (st.channel === 'call') {
          return st.state
        }
      }
    }

    return ""
  }

  async registerSipDevice(typeName) {

    if (this.webitel.phone) {
      await this.webitel.phone.unregister();
      if (this.webitel.phone.destroy) {
        await this.webitel.phone.destroy();
      }
      this.webitel.phone = null;
    }

    if (!typeName) {
      return;
    }



    switch (typeName) {
      case "sip": {
        this.webitel.registerCallClient(new window.SIP.SipClient({})); //TODO add parameters tcp/udp/tls etc
        break;
      }
      case "webrtc": {
        this.webitel.registerCallClient(new SipPhone('electron', true));
        break
      }
    }

    function registered(deviceId) {
      console.error("registered ", deviceId);
      store.commit('SET_SIP_REG', true);
      store.commit('SET_SIP_DEVICE', deviceId);
    }

    function unregistered() {
      console.error("unregistered");
      store.commit('SET_SIP_REG', false);
      store.commit('SET_SIP_DEVICE', null);
    }

    this.webitel.phone.on('registered', registered.bind(this));

    this.webitel.phone.on('unregistered', unregistered.bind(this));
  }

  doExecCallEvent(ev = {}) {
    try {
      if (typeof ev.data === 'string') {
        ev.data = JSON.parse(ev.data);
      }
    }  catch (e) {
      return ev;
    }
    return ev;
  }

  exec(name = "", data) {
    if (this.executor) {
      try {
        return this.executor.exec(name, this.doExecCallEvent(data))
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    return false;
  }

  accessToResource(resource, permit) {
    //FIXME !
    return false;
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


  unRegisterWebPhone() {
    if (this.webitel.phone) {
      this.webitel.phone.unregister();
      //FIXME
      if (this.webitel.phone.destroy) {
        this.webitel.phone.destroy();
      }
    }
  }

  logout() {
    this.unRegisterWebPhone();
    this.webitel.disconnect();
    this.webitel = null;
    this.apiRequest('post', '/logout');
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
      resolve({});
      // WebitelVerto.init({skipPermCheck: true}, ()=> {
      //   this.devices = {
      //     audioInDevices: [].slice.call(WebitelVerto.audioInDevices),
      //     audioOutDevices: [].slice.call(WebitelVerto.audioOutDevices),
      //     videoDevices: [].slice.call(WebitelVerto.videoDevices)
      //   };
      //   resolve(this.devices)
      // })
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

  makeCall(destination) {
    if (!destination)
      return;

    this.webitel.call({destination}, {})
  }

  makeCallbackQueueCall(queueId, memberId) {
    return this.apiRequest('POST', `/api/v2/callback/${queueId}/members/${memberId}/call`, {})
  }


  useHotdesk() {
    return `${settings.get('useHotdesk')}` === 'true' && settings.get('hotdeskId')
  }

  signHotdesk(name) {
    this.webitel.hotdeskSignIn(name, (res) => {
      if (res.status === 1 && res.response !== "You connected") {
        notification(`Hot desk ${name} error:`, res.response.trim(), CONST.HOT_DESK_ERROR);
      }
    })
  }
}

function serverUriToWs(uri = "") {
  // fixme link
  return uri.replace(/^http/, 'ws').replace(/(api\/?)$/, 'ws')
}

export default User
