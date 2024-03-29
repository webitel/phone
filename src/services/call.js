import store from "../store";
import notification from './notification'
import {NotificationInboundCall} from './notification'
import settings from "./settings";
import {twoDigits} from "./helper"
import CONST from './const'

const STATES = {
  NEW: "RINGING",
  ACTIVE: "ACTIVE",
  HOLD: "HOLD",
  DOWN: "DOWN"
};

const PROTECTED_WEBITEL_DATA = ["dlr_member_id", "dlr_id", "domain_name", "dlr_dsc_s", "dlr_wrap", "callResult"];

class Call {
  constructor(data = {}) {
    const date = new Date();
    this.uuid = data.uuid;
    this.direction = data.direction;
    this.createdAt = new Date(Math.round(+data['call-created-time'] / 1000)).getTime();
    this.hangupAt = null;
    this.answeredAt = null;
    this.bridgedAt = null;

    this.notificationNewCall = null;

    this.postProcessing = false;
    this.requestPostProcess = false;


    this.postProcessData = {
      success: false,
      next_after_enabled: false,
      callResult: {},
      next_after_time: null,
      next_after_date: `${twoDigits(date.getFullYear())}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`,
      next_after_sec: 0,
      stop_communications: false,
      next_communication: ''
    };

    this.postProcessEndTime = null;

    this.info = [];
    this.infoProtectedVariables = {};
    this.postProcessDescriptionMetadata = null;

    this.oldCallInfoText = null;

    this.dbUuid = null;
    if (this.direction === 'outbound') {
      this.dbUuid = data['my-uuid']
    }

    this.updateCallInfo(data.data);
    this.dlrCallbackUuid = null;
    if (data['dlr_session_id']) {
      this.dlrCallbackUuid = data['dlr_session_id'];
    }

    if (this.infoProtectedVariables.dlr_wrap > 0 || settings.get('usePostProcess')) {
      this.postProcessing = true;

      if (!this.infoProtectedVariables.dlr_id) {
        let postDataFields = [
          {
            "id": "Description",
            "type": "v-textarea",
            "value": null,
            "propsData": { "label": "Description"}
          }
        ];
        //TODO NW for 2003 not working instanceof Array ( && settings.get('postProcessDataFields').length)
        if (settings.get('postProcessDataFields') instanceof Array) {
          postDataFields = settings.get('postProcessDataFields');
        }

        if (postDataFields.length > 0) {
          this.postDataFields = JSON.parse(JSON.stringify(postDataFields));
        } else {
          this.postProcessing = false;
        }
      }
    }

    this.state = STATES.NEW;

    this.name = this.direction === "inbound" ? data.callerName : data.calleeName;
    this.number = this.direction === "inbound" ? data.callerNumber : data.calleeNumber;

    this.dtmfDigits = [];

    if (this.direction === 'inbound') {
      if (settings.get('notifyNewCall')) {
        this.notificationNewCall = new NotificationInboundCall(this, {direction: settings.get('notifyNewCallDirection')})
      }
    }

    store.commit("ON_NEW_CALL", this);
  }

  updateCallInfo(data) {
    try {
      if (data && data !== 'undefined' && this.oldCallInfoText !== data) {
        const info = JSON.parse(data.replace(/'/g, ''));
        this.oldCallInfoText = data;
        this.info = [];
        this.infoProtectedVariables = {};
        this.postProcessDescriptionMetadata = null;
        for (let key in info) {

          if (!info.hasOwnProperty(key)) {
            continue;
          }

          if (~PROTECTED_WEBITEL_DATA.indexOf(key)) {
            if (key === 'dlr_dsc_s') {
              this.setPostProcessMetadata(info[key]);
            } else {
              this.infoProtectedVariables[key] = info[key];
            }
          } else if (info[key]) {
            this.info.push({
              title: key,
              content: info[key]
            })
          }
        }
      }
    } catch (e) {
      console.error(e)
      //TODO
    }
  }

  setPostProcessMetadata(metadata) {
    this.postProcessDescriptionMetadata = [];
    if (metadata instanceof Object) {
      for (let key in metadata) {
        if (metadata[key] instanceof Array) {
          metadata[key].forEach( val => {
            this.postProcessDescriptionMetadata.push({
              key,
              ...parseDescriptionMetadata(val)
            });
          })
        }
      }
    }
  }

  getVariable(name) {
    return this.postProcessData.hasOwnProperty(name) ? this.postProcessData[name] : null;
  }

  setPostProcessField(field, value) {
    this.postProcessData[field] = value;
  }

  getPostDataFields() {
    return this.postDataFields || [];
  }

  getName() {
    return this.name ? `${this.name} (${this.number})` : `${this.number}`
  }

  isOutbound() {
    return this.direction === 'outbound' || this.direction === 'callback'
  }

  setHangupTime(cause) {
    this.state = STATES.DOWN;
    this.hangupAt = Date.now();
    this.postProcessEndTime = this.hangupAt + 10 * 1000;

    this.closeNotificationNewCall();

    if (cause !== 'CALL_REJECTED' && !this.answeredAt && settings.get('notifyMissedCall') && !this.isOutbound()) {
      notification('Missed call', `From ${this.getName()} ${new Date().toLocaleTimeString()}`, CONST.ICON_MISSED_CALL)
    }
  }

  closeNotificationNewCall() {
    if (this.notificationNewCall) {
      try {
        this.notificationNewCall.close();
      } catch (e) {
        console.error(e)
      } finally {
        this.notificationNewCall = null;
      }
    }
  }

  answerNotificationNewCall() {
    if (this.notificationNewCall) {
      try {
        this.notificationNewCall.onAnswer();
      } catch (e) {
        console.error(e);
      }
    }
  }

  activeNotificationNewCall() {
    if (this.notificationNewCall) {
      try {
        this.notificationNewCall.onActive();
      } catch (e) {
        console.error(e)
      }
    }
  }

  holdNotificationNewCall() {
    if (this.notificationNewCall) {
      try {
        this.notificationNewCall.onHold();
      } catch (e) {
        console.error(e)
      }
    }
  }


  setAnswerTime() {
    if (!this.answeredAt) {
      this.state = STATES.ACTIVE;
      this.answeredAt = Date.now();
    }
  }

  isActive() {
    return !this.hangupAt
  }

  sendQueueCallResult(user, data, cb) {
    const body = {};
    this.requestPostProcess = true;

    if (this.postProcessData.success) {
      body.success = true;
    } else {
      body.success = false;

      if (this.postProcessData.next_after_date && this.postProcessData.next_after_time) {
        const date = this.postProcessData.next_after_date.split('-');
        const time = this.postProcessData.next_after_time.split(':');
        if (date.length === 3 && time.length === 2) {
          body.next_after_sec = Math.trunc((new Date(+date[0], +date[1], +date[2], +time[0], +time[1]).getTime()
            - Date.now()) / 1000);

          if ( !(body.next_after_sec > 0) ) {
            delete body.next_after_sec;
          }
        }
      }

      // if (+this.postProcessData.next_after_sec > 0) {
      //   body.next_after_sec = +this.postProcessData.next_after_sec;
      // }

      if (this.postProcessData.next_communication) {
        body.next_communication = this.postProcessData.next_communication;
      }

      if (this.postProcessData.stop_communications) {
        body.stop_communications = this.number;
      }
    }

    if (this.postProcessData.callResult instanceof Object) {
      if (this.postProcessData.callResult.subText) {
        body.description = `${this.postProcessData.callResult.name} / ${this.postProcessData.callResult.subText}`
      } else {
        body.description = this.postProcessData.callResult.name
      }
    }

    body.session_id = this.dlrCallbackUuid;

    user.apiRequest(
      'put',
      `/api/v2/dialer/${this.infoProtectedVariables.dlr_id}/members/${this.infoProtectedVariables.dlr_member_id}/status`,
      body
    ).then(
      () => {
        cb(null, body);
      },
      (res) => {
        return cb(res)
      }
    )
  }

  sendToCdr(user, data, cb) {
    const body = {};

    for (let key in data) {
      if (data.hasOwnProperty(key) && data[key]) {
        body[key] = data[key]
      }
    }

    if (Object.keys(body).length === 0) {
      cb(null);
      return;
    }

    user.storageRequest('post', `/api/v2/cdr/${this.dbUuid}/post?createdAt=${this.createdAt}`, body).then(
      () => {
        cb(null);
      },
      (res) => {
        return cb(res)
      }
    );
  }

  sendPostProcess(data, cb) {

    const user = store.getters.user();
    this.requestPostProcess = true;

    if (this.infoProtectedVariables.dlr_id && this.infoProtectedVariables.dlr_member_id) {
      this.sendQueueCallResult(user, data, (err, body) => {
        if (err) {
          this.requestPostProcess = false;
          return cb && cb(err)
        }

        this.sendToCdr(user, body, err => {
          if (err) {
            this.requestPostProcess = false;
            return cb && cb(err)
          }
          cb && cb(null);
          this.destroy();
        })
      })
    } else {
      this.sendToCdr(user, data, err => {
        if (err) {
          this.requestPostProcess = false;
          return cb && cb(err)
        }
        cb && cb(null);
        this.destroy();
      })
    }

  }

  destroy() {
    store.commit("ON_CLOSE_CALL", this.uuid);
  }

  dtmf(digit = "") {
    const webitel = store.getters.webitel();
    if (webitel) {
      webitel.dtmf(this.uuid, digit, () => {
        // this.dtmfDigits.push(digit)
      })
    }
  }

  attendedTransfer(call) {
    const webitel = store.getters.webitel();
    if (webitel) {
      webitel.bridgeTransfer(this.uuid, call.uuid, () => {

      })
    }

  }

  blindTransfer(number) {
    if (number) {
      const webitel = store.getters.webitel();
      if (webitel) {
        webitel.transfer(this.uuid, number, () => {

        })
      }
    }
  }

  answer() {
    const webitel = store.getters.webitel();
    if (webitel) {
      return webitel.answer(this.uuid, {})
    }
    return false
  }

  onDtmf(digit) {
    this.dtmfDigits.push(digit)
  }

  onHold() {
    this.state = STATES.HOLD;
    this.holdNotificationNewCall();
  }

  onActive() {
    this.state = STATES.ACTIVE;
    this.activeNotificationNewCall();
  }

  OnAnswer(data) {
    if (!this.dbUuid) {
      this.dbUuid = data.dbUuid
    }
    this.setAnswerTime();
    this.answerNotificationNewCall();
    this.updateCallInfo(data.data);
  }

  onBridge(data) {
    this.name = this.isOutbound() ? data.calleeName : data.callerName;
    this.number = this.isOutbound() ? data.calleeNumber : data.callerNumber;
    if (data['other-leg-unique-id'] || data["cc_queue"])
      this.bridgedAt = Date.now();
  }

  hangup(cause = "") {
    const webitel = store.getters.webitel();
    if (webitel) {
      webitel.hangup(this.uuid, this.answeredAt ? "NORMAL_CLEARING" : "CALL_REJECTED")
    }
  }

  hold() {

  }

  unHold() {

  }

  toggleHold() {
    const webitel = store.getters.webitel();
    if (webitel) {
      webitel.toggleHold(this.uuid)
    }
  }

}

const parseDescriptionMetadata = (val) => {

  if (val instanceof Array) {
    return {
      name: val[0],
      subText: "",
      items: val.slice(1)
    }
  } else {
    return {
      name: val,
      subText: "",
      items: null
    }
  }
};


export default Call
