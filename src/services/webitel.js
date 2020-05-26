
// GENERAL CONSTANTS

import VertoLib from './verto'

const WebitelVerto = VertoLib.verto;

function webSocketStatus(webSocket) {
  console.log("========WebSocket Status========");
  console.log("Status: " + webSocket.readyState);
}

var ConnectionStatus = {
  Connected: 1,
  Disconnected: 2
};

var WebitelCommandResponseTypes = {
  Success: 0,
  Fail: 1
};

var WebitelUserAwayCauseTypes = {
  OnBreak: 'ONBREAK',
  CallForwarding: 'CALLFORWARD',
  VoiceMail: 'VOICEMAIL',
  DoNotDisturb: 'DND',
  None: 'NONE'
//        OnHook: '"ONHOOK"'
};

var WebitelAccountStatusTypes = {
  Ready: 'ONHOOK',
  Busy: 'ISBUSY',
  Unregistered: 'NONREG'
};

var WebitelCallStatuses = {
  Unknown: 'unknown', // "неизвестный"
  Answered: 'answered', // "в разговоре"
  Early: 'early', // "маршрутизация"
  Ringing: 'ringing', // "КПВ"
  Hangup: 'hangup', // "завершен"
  Idle: 'idle' // "не активен"
};

var WebitelErrorTypes = {
  Call: 'CALL-ERROR',
  Authentication: 'AUTH-ERROR',
  Agent: 'AGENT-ERROR',
  Connection: 'CONNECTION-ERROR',
  Command: 'COMMAND-ERROR',
  Event: 'EVENT-ERROR',
  Script: 'SCRIPT-ERROR'
};

var WebitelMuteType = {
  On: "on",
  Off: "off",
  Toggle: "toggle"
};

var WebitelCallDirectionTypes = {
  Inbound: 'inbound',
  Outbound: 'outbound',
  Callback: 'callback'
};

var WebitelUserRoleType = {
  Admin: 'admin',
  User: 'user'
};

var WebitelDeviceType = {
  Sip: 'sip'
};

var WebitelUserParamType = {
  User: 'user',
  Password: 'password',
  Role: 'role'
};

var WebitelAgentStatus = {
  LoggedOut: "Logged Out", // Cannot receive queue calls.
  Available: "Available", // Ready to receive queue calls.
  AvailableOnDemand: "Available (On Demand)", // State will be set to 'Idle' once the call ends (not automatically set to 'Waiting').
  OnBreak: "On Break" // Still Logged in, but will not receive queue calls.
};

var WebitelAgentState = {
  Receiving: "Receiving",
  Waiting: "Waiting", // Ready to receive calls.
  Idle: "Idle", // Does nothing, no calls are given.
  InAQueueCall: "In a queue call" // Currently on a queue call.
};

var WebitelEventNames = [
  'CC::AGENT-OFFERING',
  'CC::BRIDGE-AGENT-START',
  'CC::MEMBER-QUEUE-RESUME',
  'CC::BRIDGE-AGENT-END',
  'CC::BRIDGE-AGENT-FAIL',
  'CC::MEMBERS-COUNT',
  'CC::MEMBER-QUEUE-START',
  'CC::MEMBER-QUEUE-END',
  'CC::AGENT-STATUS-CHANGE',
  'CC::AGENT-STATE-CHANGE',
];

function _parseTable() {
  var data = this.responseText;
  return data.split('\n').reduce(function(table, line, index) {
    var data = line.split('\t'),
      arr = [];
    for (var i = 0; i < data.length; i++) {
      arr.push(data[i].trim());
    };
    if (index === 0) {
      table['headers'] = arr;
    } else {
      if (arr.length === table["headers"].length) {
        table['data'].push(arr);
      }
    }

    return table;
  }, {
    data: [],
    headers: []
  });
};

function _parseCollection() {
  var _line = "=================================================================================================",
    data = this.responseText,
    _start = data.indexOf(_line),
    _end = data.lastIndexOf(_line);

  data = data.substring(_start + _line.length, _end);
  data = data.substring(0, data.lastIndexOf('\n\n'));
  return data.split("\n\n").reduce(function(table, line, index) {
    table["data"][index] = {};
    line.split('\n').forEach(function(row, i) {
      if (row === "") return;
      var item = row.split('\t');
      var hed = item[0].trim().replace(/:$/,'');
      if (table["headers"].indexOf(hed) === -1) {
        table["headers"].push(hed);
      }
      table["data"][index][hed] = item[1]
    });

    return table;
  }, {
    data: [],
    headers: []
  })
};

// END GENERAL CONSTANTS

// Webitel = function(host, user, password, domain) {
var Webitel = function(parameters) {
  var host = parameters['server'];
  var account = parameters['account'];
  var secret = parameters['secret'];

  var keyAuth = parameters['key'];
  var tokenAuth = parameters['token'];

  var agentLic = parameters['agentLic'];
  var isOperator = parameters['isOperator'];
  var debug = parameters['debug'];
  var reconnect = parameters['reconnect'] || -1;
  var autoAnswerParam = parameters['autoAnswerParam'];
  var vertoRecordFile = parameters['vertoRecordFile'];

  var webitelAgentStatusDef = WebitelAgentStatus.Available;
  if (parameters['availableOnDemand']){
    webitelAgentStatusDef = WebitelAgentStatus.AvailableOnDemand;
  };


  var webrtc = parameters['webrtc'];

  var domainUser = parameters['domain'] || account.split('@')[1];

  var webrtcPhone = null;

  var guid = (typeof(window.crypto) != 'undefined' &&
    typeof(window.crypto.getRandomValues) != 'undefined') ?
    function() {
      var buf = new Uint16Array(8);
      window.crypto.getRandomValues(buf);
      var S4 = function(num) {
        var ret = num.toString(16);
        while(ret.length < 4){
          ret = "0"+ret;
        }
        return ret;
      };
      return (S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-"+S4(buf[3])+"-"+S4(buf[4])+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7]));
    }

    :

    function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    };

  //EVENTS
  var WebitelEvent = function() {
    var nextSubscriberId = 0;
    var subscriberList = [];

    this.subscribe = function(callback) {
      var id = nextSubscriberId;
      subscriberList[id] = callback;
      nextSubscriberId++;
      return id;
    };

    this.unsubscribe = function(id) {
      delete subscriberList[id];
    };

    this.trigger = function(sender) {
      for (var i in subscriberList) {
        subscriberList[i](sender);
      }
    };
  };

  var WebitelEventMixin = function() {
    var _eventHandlers = [];

    function commandEvent(eventName, type, all, callback, scopeCb) {
      if (eventName.indexOf(' ') != -1 || eventName == "ALL") {
        if (typeof scopeCb == "function") scopeCb(false);
        throw new Error('Wrong event');
      };

      var srvEvents = new WebitelCommand(type, {
        event: eventName,
        all: all
      }, callback);
      srvEvents.execute();
    };

    var on = function(eventName, handler, type, cb) {
      if (typeof  type === 'function') {
        cb = type;
        type = null
      };

      if (!type && ~WebitelEventNames.indexOf(eventName)) {
        type = {};
      };

      eventName = eventName.toUpperCase();
      if (!_eventHandlers[eventName]) {
        _eventHandlers[eventName] = [];
      };
      _eventHandlers[eventName].push(handler);
      if (!type || _eventHandlers[eventName].length > 1) {
        if (cb) cb(true);
        return
      } else {
        var _all = type.all;
        commandEvent(eventName, WebitelCommandTypes.Event, _all, function (response) {
          if (response.status === WebitelCommandResponseTypes.Success)
          //_eventHandlers[eventName].push(handler);
            if (cb) cb(response);
        }, cb);
      }
    };

    var off = function(eventName, type, fn, cb) {
      eventName = eventName.toUpperCase();
      var handlers = _eventHandlers[eventName];
      if (!handlers) return;

      for(var i = 0; i < handlers.length; i++) {
        if (handlers[i] == fn) {
          handlers.splice(i--, 1);
          break;
        }
      };

      if (!type || handlers.length > 0) {
        if (cb) cb(true);
        return
      }

      commandEvent(eventName, WebitelCommandTypes.NixEvent, null, function(response) {
        //if (response.status === WebitelCommandResponseTypes.Success)
        //    for(var i=0; i<handlers.length; i++) {
        //        handlers.splice(i--, 1);
        //    };
        if (cb) cb(response);
      }, cb);
    };

    var trigger = function(eventName) {

      if (!_eventHandlers || !_eventHandlers[eventName]) {
        return; // обработчиков для события нет
      }

      // вызвать обработчики
      var handlers = _eventHandlers[eventName];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply({}, [].slice.call(arguments, 1));
      }

    };

    var removeAllHandlers = function () {
      _eventHandlers.length = 0;
    };
    return {
      on: on,
      off: off,
      trigger: trigger,
      removeAll: removeAllHandlers
    };
  };
  // ==================================== Constants ==================================================

  var EventMixin = new WebitelEventMixin();

  var WebitelCommandTypes = {
    Auth: 'auth',
    Login: 'login',
    Logout: 'logout',
    AgentList: 'api account_list',
    Call: 'call',
    Hangup: 'hangup',
    Park: 'park',
    CahangeStatus: 'state',
    ToggleHold: 'toggle_hold',
    Hold: 'hold',
    UnHold: 'unhold',
    Transfer: 'transfer',
    AttendedTransfer: 'attended_transfer',
    Bridge: 'bridge',
    Dtmf: 'dtmf',
    Broadcast: 'broadcast',
    Bind: 'bind',
    Event: 'subscribe',
    NixEvent: 'unsubscribe',
    AttXfer2: 'att_xfer2',
    VideoRefresh: 'video_refresh',
    Domain: {
      List: 'api domain list',
      Create: 'api domain create',
      Remove: 'api domain remove'
    },
    Account: {
      List: 'api account list', //
      Create: 'api account create',
      Change: 'api account change',
      Remove: 'api account remove'
    },
    Device: {
      List: 'api device list',
      Create: 'api device create',
      Change: 'api device change',
      Remove: 'api device remove'
    },
    ListUsers: 'api list_users',
    Whoami: 'api whoami',
    GetVariable: 'getvar',
    SetVariable: 'setvar',
    ReloadAgents: 'reloadAgents',
    Rawapi: 'rawapi',
    Eavesdrop: 'eavesdrop',
    ChannelDump: 'channel_dump',
    SipProfile: {
      List: 'sip_profile_list',
      Rescan: 'sip_gateway_rescan'
    },

    Gateway: {
      List: 'sip_gateway_list',
      Kill: 'sip_gateway_kill'
    },
    Show: {
      Channel: 'show_channel'
    },

    CDR: {
      GetRecordLink: "cdr_get_record_link"
    },

    CallCenter: {
      Ready: "cc ready",
      Busy: "cc busy",
      Logout: "cc logout",
      Login: "cc login",
      Tiers: "cc tier from user"
    },
    Chat: {
      Send: "chat_send"
    },
    Sys: {
      message: 'sys_msg'
    }
  };

  var version = parameters.remoteVersion || '3.1';

  var WebitelCallChanelVariables = {
    UUID: 'Unique-ID',
    ChanelCallUuid: 'Channel-Call-UUID',
    CallStateName: 'Channel-Call-State',
    CallStateCode: 'Channel-State-Number',
    ChannelState: 'Channel-State',
    AnswerState: 'Answer-State',
    Direction: 'Call-Direction',
    SipCallId: 'variable_sip_call_id',
    CallerCalleeName: 'Caller-Callee-ID-Name',
    CallerCalleeNumber: 'Caller-Callee-ID-Number',
    CallerCallerName: 'Caller-Caller-ID-Name',
    CallerCallerNumber: 'Caller-Caller-ID-Number',
    CallerDestinationName: 'Caller-Destination-Number',
    CallerDestinationNumber: 'Caller-Destination-Number',
    WAccountOriginationUuid: 'variable_w_account_origination_uuid',
    WJsXTransfer: 'variable_w_jsclient_xtransfer',
    WJsOriginate: 'variable_w_jsclient_originate_number',
    WJsSipHead: 'Call-Info',
    WActivityId: 'variable_w_activity_uuid',
    WAttXfer: 'variable_webitel_att_xfer',
    WebitelData: 'variable_webitel_data'
  };

  var WebitelCallEventTypes = {
    ChannelCallState: 'CHANNEL_CALLSTATE',
    ChannelCreate: 'CHANNEL_CREATE',
    ChannelDestroy: 'CHANNEL_DESTROY',
    ChannelState: 'CHANNEL_STATE',
    ChannelAnswer: 'CHANNEL_ANSWER',
    ChannelHangup: 'CHANNEL_HANGUP',
    ChannelHangupComplete: 'CHANNEL_HANGUP_COMPLETE',
    ChannelExecute: 'CHANNEL_EXECUTE',
    ChannelExecuteComlete: 'CHANNEL_EXECUTE_COMPLETE',
    ChannelBridge: 'CHANNEL_BRIDGE',
    ChannelUnbridge: 'CHANNEL_UNBRIDGE',
    ChannelProgress: 'CHANNEL_PROGRESS',
    ChannelProgressMedia: 'CHANNEL_PROGRESS_MEDIA',
    ChannelOutgoing: 'CHANNEL_OUTGOING',
    ChannelPark: 'CHANNEL_PARK',
    ChannelUnpark: 'CHANNEL_UNPARK',
    ChannelApplication: 'CHANNEL_APPLICATION',
    ChannelHold: 'CHANNEL_HOLD',
    ChannelUnhold: 'CHANNEL_UNHOLD',
    ChannelOriginate: 'CHANNEL_ORIGINATE',
    ChannelUUID: 'CHANNEL_UUID',
    Dtmf: 'DTMF',
    RecordStart: 'RECORD_START',
    RecordStop: 'RECORD_STOP',
    Custom: 'CUSTOM',
    isValid: function (name) {
      for (var key in this) {
        if (this[key] == name) {
          return true;
        }
      };
      return false;
    }
  };

  var WebitelCustomEventsSubclass = {
    Conference: 'conference::maintenance'
  };

  var WebitelCallStates = {
    Rinding: 1,
    Answered: 2,
    Hold: 3,
    Active: 4,
    Ended: 5
  };

  var WebitelUserEventTypes = {
    UserCreate: 'USER_CREATE',
    UserStatus: 'USER_STATE',
    UserDestroy: 'USER_DESTROY',
    UserChanged: 'USER_CHANGE',
    AccountOnline: 'ACCOUNT_ONLINE',
    AccountOffline: 'ACCOUNT_OFFLINE',
    AccountStatus: 'ACCOUNT_STATUS',

//            AccountRole: 'ACCOUNT_ROLE',
    isValid: function (name) {
      for (var key in this) {
        if (this[key] == name) {
          return true;
        };
      };
      return false;
    }
  };

  var WebitelUserAttributes = {
    Role: 'Account-Role',
    Domain: 'Event-Domain',
    Online: 'Account-Online',
    State: 'Account-State',
    Id: 'User-ID',
    AccountUserId: 'Account-User',
    oldId: 'Account-Old-User'
  };


  // ================================================================================================

  var OnWebitelUserStatusChange = new WebitelEvent();

  var OnWebitelUserChange = new WebitelEvent();

  var OnWebitelCallAccept = new WebitelEvent();

  var OnWebitelCallBridge = new WebitelEvent();

  var OnWebitelCallUnbridge = new WebitelEvent();

  var OnWebitelCallHold = new WebitelEvent();

  var OnWebitelCallDtmf = new WebitelEvent();

  var OnWebitelCallRecordStart = new WebitelEvent();

  var OnWebitelCallRecordStop = new WebitelEvent();

  var OnWebitelCallUnhold = new WebitelEvent();

  var OnWebitelCallUuid = new WebitelEvent();

  var OnWebitelCallHangup = new WebitelEvent();

  var OnWebitelError = new WebitelEvent();

  var OnWebitelWebRTCCall = new WebitelEvent();

  var OnNewMessage = new WebitelEvent();

  var OnWebitelReady = new WebitelEvent();

  var OnWebitelLogin = new WebitelEvent();

  var OnNewWebRTCCall = new WebitelEvent();

  var OnVideoWebRTCCall = new WebitelEvent();
  var OnVideoChangeWebRTCCall = new WebitelEvent();

  var OnRegisterWebRTC = new WebitelEvent();
  var OnUnRegisterWebRTC = new WebitelEvent();
  var OnWebRTCDoAnswer = new WebitelEvent();

  var OnDestroyWebRTCCall = new WebitelEvent();

  var WebitelError = function(errorType, message) {
    this.getJSONObject = function() {
      return {
        errorType: errorType,
        message: message
      }
    }
  };

  var WebitelUser = function(attrs) {

    var that = this;

    this.getId = function() {
      return attrs['id'];
    };

    this.getDomain = function() {
      return attrs['domain'];
    };

    this.getState = function() {
      return attrs['state'];
    };

    this.getAway = function() {
      return attrs['away'];
    };

    this.getTag = function() {
      return decodeURI(decodeURI(attrs['tag']));
    };

    this.getOnline = function() {
      return attrs['online'];
    };

    this.getName = function () {
      return unescape(attrs['name']);
    };

    this.getScheme = function () {
      return (attrs['scheme'])
    };

    this.getAgent = function () {
      return (attrs['agent'])
    };

    this.setAgent = function (val) {
      attrs['agent'] = Boolean(val);
    };

    this.getOnlineCC = function () {
      return attrs['cc-login']
    };

    this.getRole = function () {
      return attrs['role']
    };

    this.getJSONObject = function() {
      return {
        id: that.getId(),
        domain: that.getDomain(),
        state: that.getState(),
        away: that.getAway(),
        tag: that.getTag(),
        online: that.getOnline(),
        name: that.getName(),
        scheme: that.getScheme(),
        roleName: that.getRole(),
        agent: that.getAgent(),
        inCC: that.getOnlineCC()
      };
    };

    this.setId = function (id) {
      attrs['id'] = id;
      OnWebitelUserChange.trigger(that.getJSONObject());
    };

    this.setOnline = function(value) {
      attrs['online'] = value;
      OnWebitelUserStatusChange.trigger(that.getJSONObject());
    };

    this.setStatus = function(away, state, tag, agentStatus) {
      attrs['away'] = away;
      attrs['state'] = state;
      attrs['tag'] = tag || '';
      attrs['cc-login'] = (agentStatus === WebitelAgentStatus.Available || agentStatus === WebitelAgentStatus.AvailableOnDemand || agentStatus === WebitelAgentStatus.OnBreak);
      OnWebitelUserStatusChange.trigger(that.getJSONObject());
    };

    this.setState = function (state) {
      if (state == attrs['state'])
        return;

      attrs['state'] = state;
      OnWebitelUserStatusChange.trigger(that.getJSONObject());
    }
  };

  var WebitelCall = function(key, channel, state) {
    var that = this;

    this['state'] = state;

    this._webitelData = channel['variable_webitel_data'];

    this['uuid'] = key;

    this.channels = new Array(channel[WebitelCallChanelVariables.UUID]);

    that['isOriginator'] = (channel['Channel-Call-UUID'] === channel['Unique-ID']);

    this.getActualChannel = function () {
      return ChanelCalls.get(that.channels[0]);
    };

    this.getWebitelData = function () {
      if (this._webitelData !== "'undefined'")

        var chn = that.getActualChannel(),
          str = chn[WebitelCallChanelVariables.WebitelData]
        ;

      if (typeof str === 'string') {
        return chn[WebitelCallChanelVariables.WebitelData].replace(/'/g, '');
      };
      return chn[WebitelCallChanelVariables.WebitelData];
    };

    this.getCalleeNumber = function () {
      var chn = that.getActualChannel(),
        num = "";
      if (this.getDirection() === WebitelCallDirectionTypes.Inbound) {
        if (!this.switchChannelInboundDisplay()) {
          num = chn[WebitelCallChanelVariables.CallerCalleeNumber];
        } else {
          num = chn[WebitelCallChanelVariables.CallerCallerNumber];
        }
      } else {
        if (this.switchChannelInboundDisplay()) {
          num = chn[WebitelCallChanelVariables.CallerCalleeNumber] ||chn[WebitelCallChanelVariables.CallerDestinationName];
        } else {
          num = chn[WebitelCallChanelVariables.CallerCallerNumber];
        }
      }

      if (/^u?:?[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(num)) {
        return WebitelConnection.getCurrentStatus().id;
      } else {
        return num;
      }
    };
    this.getCalleeName = function () {
      return that.getActualChannel()[WebitelCallChanelVariables.CallerCalleeName] || that.getCalleeNumber();
    };
    this.getCallerNumber = function () {
      var chn = that.getActualChannel(),
        num = "";

      if (this.getDirection() === WebitelCallDirectionTypes.Inbound) {
        if (this.switchChannelInboundDisplay()) {
          num = chn[WebitelCallChanelVariables.CallerCalleeNumber];
        } else {
          num = chn[WebitelCallChanelVariables.CallerCallerNumber];
        }
      } else {
        if (!this.switchChannelInboundDisplay()) {
          num = chn[WebitelCallChanelVariables.CallerCalleeNumber];
        } else {
          num = chn[WebitelCallChanelVariables.CallerCallerNumber];
        }
      }

      if (/^u?:?[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(num)) {
        return WebitelConnection.getCurrentStatus().id;
      } else {
        return num;
      }
    };
    this.getCallerName = function () {
      var _actual = that.getActualChannel();
      return _actual[WebitelCallChanelVariables.CallerCallerName]
        ? _actual[WebitelCallChanelVariables.CallerCallerName].split('@')[0]
        : _actual[WebitelCallChanelVariables.CallerCallerName];
    };
    this.getDestinationNumber = function () {
      return that.getActualChannel()[WebitelCallChanelVariables.CallerDestinationName];
    };

    this.getChannels = function () {
      return that.channels;
    };

    this.getDirection = function () {
      var chn = that.getActualChannel();
      if (chn[WebitelCallChanelVariables.WJsOriginate] && that['state'] < WebitelCallStates.Answered) {
        return WebitelCallDirectionTypes.Callback;
      } else {
        return (chn[WebitelCallChanelVariables.WJsOriginate] || chn['Caller-Logical-Direction'] === "inbound")
          ? WebitelCallDirectionTypes.Outbound
          : WebitelCallDirectionTypes.Inbound
      }
    };

    this.switchChannelInboundDisplay = () => {
      //#define switch_channel_inbound_display(_channel)
      // ((switch_channel_direction(_channel) == SWITCH_CALL_DIRECTION_INBOUND && !switch_channel_test_flag(_channel, CF_BLEG)) ||
      // (switch_channel_direction(_channel) == SWITCH_CALL_DIRECTION_OUTBOUND && switch_channel_test_flag(_channel, CF_DIALPLAN)))
      var chn = that.getActualChannel();
      return (chn['Call-Direction'] === 'inbound' && chn['Unique-ID'] === chn['Channel-Call-UUID']) ||
        (chn['Call-Direction'] === 'outbound' && chn['Channel-HIT-Dialplan'] === "true");
    };

    this.getDisplayNumber = function () {
      return (that.isOriginator)
        ? that.getCalleeNumber()
        : that.getCallerNumber()
    };

    this.getDisplayName = function () {
      return (that.isOriginator)
        ? that['calleeName']
        : that['callerName']
    };

    this.getActualChannelUUID = function () {
      return that.getActualChannel()[WebitelCallChanelVariables.UUID]
    };

    this.addChannels = function(channelId) {
      if (that.channels.indexOf(channelId) != -1) {
        return that.channels.length;
      };
      that.channels.push(channelId);
      return that.channels.length;
    };

    this.removeChannel = function(channelId) {
      for (var i in that.channels) {
        if (that.channels[i] === channelId) {
          that.channels.splice(i, 1);
          return that.channels.length;
        };
      };
      return that.channels.length;
    };

    this.getCountChannel = function () {
      return that.channels.length;
    };

    this.setState = function (state) {
      if (state === that['state']) {
        console.warn('status error.');
        return;
      };
      that['state'] = state;
      switch (state) {
        case WebitelCallStates.Answered:
          OnWebitelCallAccept.trigger(that.getJSONObject());
          break;
        case WebitelCallStates.Active:
          OnWebitelCallUnhold.trigger(that.getJSONObject());
          break;
        case WebitelCallStates.Hold:
          OnWebitelCallHold.trigger(that.getJSONObject());
          break;
      };
    };

    this.getState = function () {
      return that['state'];
    };

    this.setCdrUuid = function (uuid) {
      that['cdrUuid'] = uuid
    };

    this.getCdrUuid = function () {
      return that['cdrUuid'];
    };
    ///
    this.getXTransferChannelId = function () {
      return that.getActualChannel()[WebitelCallChanelVariables.WJsXTransfer];
    };

    this.setAdditionInfo = function (result) {
      var channel = that.getActualChannel();
      result['hangup_cause'] = channel['variable_hangup_cause'];
      result['cc_queue'] = channel['variable_cc_queue'];
      result['transferResult'] = channel['variable_w_transfer_result'];
      result['call-created-time'] = channel['Caller-Channel-Created-Time'];
      result['call-answered-time'] = channel['Caller-Channel-Answered-Time'];
      result['call-hangup-time'] = channel['Caller-Channel-Hangup-Time'];
      result['other-leg-unique-id'] = channel['Other-Leg-Unique-ID'];
      result['bridge-A-Unique-ID'] = channel['Bridge-A-Unique-ID'];
      result['bridge-B-Unique-ID'] = channel['Bridge-B-Unique-ID'];
      result['my-uuid'] = channel[WebitelCallChanelVariables.UUID];

      if (channel['variable_dlr_session_id']) {
        result['dlr_session_id'] = channel['variable_dlr_session_id']
      }
    };

    this.getJSONObject = function() {
      var result = {
        'uuid': that['uuid'],
        'dbUuid': that.getCdrUuid(),
        'state': that.getState(),
        'calleeNumber': decodeURIComponent(that.getCalleeNumber()),
        'calleeName': decodeURIComponent(that.getCalleeName()),
        'callerNumber': decodeURIComponent(that.getCallerNumber()),
        'callerName': decodeURIComponent(that.getCallerName()),
        'displayNumber': decodeURIComponent(that.getDisplayNumber()),
        'isOriginator': that['isOriginator'],
        'attended-transfer-call-uuid': that.getXTransferChannelId(),
        'direction': that.getDirection(),
        'call-channel-uuid': that.getActualChannelUUID(),
        'data': that.getWebitelData()
      };
      that.setAdditionInfo(result);

      return result;
    };
  };

  var WebitelHashCollection = function() {
    var collection = {};

    var length = 0;

    var onAddedElement = new WebitelEvent();
    var onRemovedElement = new WebitelEvent();

    var addElement = function(key, element) {
      if (collection[key]) {
        throw new Error('Key ' + key + ' already defined!');
      } else {
        collection[key] = element;
        length++;
        onAddedElement.trigger(collection[key].getJSONObject ? collection[key].getJSONObject() : collection[key]);
      };
    };

    var getLength = function() {
      return length;
    };

    var getElement = function(key) {
      return collection[key]
    };

    var removeElement = function(key) {
      if (collection[key]) {
        var removedElement = collection[key];
        delete collection[key];
        length--;
        onRemovedElement.trigger(removedElement.getJSONObject ? removedElement.getJSONObject() : removedElement);
      };
    };

    var removeAllElement = function() {
      for (var key in collection) {
        removeElement(key);
      }
    };

    var setNewKey = function(key, newKey) {
      if (collection[key]) {
        throw new Error('Key ' + key + ' not found!');
      } else {
        var element = collection[key];
        collection[newKey] = element;
        collection[key] = undefined;
        delete collection[key];
      };
    };

    return {
      add: addElement,
      get: getElement,
      remove: removeElement,
      removeAll: removeAllElement,
      setNewKey: setNewKey,
      onAdded: onAddedElement,
      onRemoved: onRemovedElement,
      length: getLength,
      collection: collection
    };
  };

  var WebitelArrayCollection = function(identityField) {
    var collection = [];
    var onAddedElement = new WebitelEvent();
    var onRemovedElement = new WebitelEvent();

    var getElement = function(key) {
      for (var i = 0; i < collection.length; i++) {
        if (collection[i][identityField] == key) {
          return collection[i];
        }
      }
      return null;
    };

    var addElement = function(element) {
      var key = element[identityField];
      if (getElement(key)) {
        throw new Error('Key ' + key + ' already defined!');
      } else {
        var index = collection.push(element) - 1;
        onAddedElement.trigger(collection[index].getJSONObject ? collection[index].getJSONObject() : collection[index]);
      };
    };

    var removeElement = function(key) {
      for (var i = 0; i < collection.length; i++) {
        if (collection[i][identityField] == key) {
          var removedElement = collection.splice(i, 1)[0];
          onRemovedElement.trigger(removedElement);
        }
      }
    };

    var setParam = function (key, paramName, value) {
      for (var i = 0; i < collection.length; i++) {
        if (collection[i][identityField] == key) {
          collection[i][paramName] = value;
          return true;
        }
      }
      return false;
    };

    var getLength = function(){
      return collection.length;
    };

    return {
      add: addElement,
      get: getElement,
      setParam: setParam,
      remove: removeElement,
      onAdded: onAddedElement,
      onRemoved: onRemovedElement,
      getLength: getLength,
      // TODO ???????
      collection: collection
    };
  };

  var OngoingCommands = new WebitelHashCollection();

  var WebitelUsers = new WebitelHashCollection();

  var ChanelCalls = new WebitelHashCollection();

  var OngoingCalls = new WebitelArrayCollection('uuid');

  var WebrtcCalls = new WebitelArrayCollection('call-uuid');

  var WebitelCommand = function(commandName, params, callback) {
    var that = this;

    this.id = guid();
    this.commandName = commandName;
    this.params = params;
    this.callback = callback;

    if (callback) {
      this.callback = function () {
        try {
          this.responseText = arguments[0].response.response;
        } catch (e){

        }
        if (callback) {
          callback.apply(this, arguments)
        }
      };
    }

    this.responseText = '';

    this.parseDataTable = _parseTable.bind(this);
    this.parseDataCollection = _parseCollection.bind(this);

    this.getJson = function() {
      var result = {
        'exec-uuid': that.id,
        'exec-func': that.commandName
      };
      if (that.params) {
        result['exec-args'] = that.params;
      };
      return result;
    };

    this.execute = function() {
      var wc = WebitelConnection;
      if (wc._status == ConnectionStatus.Connected) {
        var executed = JSON.stringify(that.getJson());
        if (debug)
          console.log('Command to execute: ' + executed);

        wc._webSocket.send(JSON.stringify(that.getJson()));
        OngoingCommands.add(that.id, that);
      };
    };
  };

  var WebitelUserEvent = function(attrs) {
    switch (attrs['Event-Name']) {
      case WebitelUserEventTypes.AccountOnline:
      case WebitelUserEventTypes.AccountOffline:
        var user = WebitelUsers.get(attrs[WebitelUserAttributes.Id]);
        if (user) {
          console.log('Users ' + user.getId() + ' changed his status!');
          user.setOnline(attrs['Event-Name'] == WebitelUserEventTypes.AccountOnline);
        };
        break;
      //case WebitelUserEventTypes.UserStatus:
      //	var user = WebitelUsers.get(attrs[WebitelUserAttributes.Id]);
      //	if (user) {
      //		console.log('User ' + user.getId() + ' changed his status!');
      //		user.setState(attrs['User-State']);
      //	}
      //	break;
      case WebitelUserEventTypes.AccountStatus:
        var user = WebitelUsers.get(attrs[WebitelUserAttributes.AccountUserId]);
        if (user) {
          console.log('User ' + user.getId() + ' changed his state!');
          user.setStatus(
            decodeURIComponent(attrs['Account-Status']),
            decodeURIComponent(attrs['Account-User-State']),
            attrs['Account-Status-Descript'] && decodeURIComponent(attrs['Account-Status-Descript']),
            attrs['Account-Agent-Status'] && decodeURIComponent(attrs['Account-Agent-Status'])
          );
        }
        break;
      case WebitelUserEventTypes.UserCreate:
        var user = new WebitelUser({
          'id': attrs[WebitelUserAttributes.Id],
          'domain': attrs[WebitelUserAttributes.Domain],
          'scheme': attrs[WebitelUserAttributes.Role],
          'online': false,
          'state': attrs[WebitelUserAttributes.State]
        });
        WebitelUsers.add(user.getId(), user);
        break;
      case WebitelUserEventTypes.UserDestroy:
        WebitelUsers.remove(attrs[WebitelUserAttributes.Id]);
        break;
      case WebitelUserEventTypes.UserChanged:
        /*switch (attrs['changed']) {
         case 'username':
         var user = WebitelUsers.get(attrs[WebitelUserAttributes.oldId]);
         WebitelUsers.setNewKey(attrs[WebitelUserAttributes.oldId], WebitelUserAttributes.Id);
         if (user)
         user.setId(attrs[WebitelUserAttributes.oldId], attrs[WebitelUserAttributes.Id]);
         break;
         };*/
        break;
    };
  };

  var WebitelCallEvent = function(attrs) {
    if (decodeURIComponent(attrs['Channel-Presence-ID']) != account) return;

    var channelId = attrs[WebitelCallChanelVariables.UUID];

    try {
      switch (attrs['Event-Name']) {
        case WebitelCallEventTypes.ChannelCreate:
          handleChannelCreateEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelUUID:
          // TODO .
          var oldKey = attrs['Old-Unique-ID'];
          var channel = ChanelCalls.get(oldKey);
          channel.setParam(oldKey, WebitelCallChanelVariables.UUID, channelId);
          break;
        case WebitelCallEventTypes.ChannelOutgoing:
          handleChannelOutgoingEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelCallState:
          handleChannelCallState(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelState:
          handleChannelState(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelHangup:
        case WebitelCallEventTypes.ChannelHangupComplete:
          handleChannelHangupCompleteEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelAnswer:
          handleChannelAnswerEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelBridge:
          handleChannelBridgeEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelUnbridge:
          handleChannelUnbridgeEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelDestroy:
          handleChannelDestroyEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.Dtmf:
          handleChannelDtmfEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelHold:
          handleChannelHoldEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.ChannelUnhold:
          handleChannelUnholdEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.RecordStart:
          handleChannelReccordStartEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.RecordStop:
          handleChannelReccordStopEvent(channelId, attrs);
          break;
        case WebitelCallEventTypes.Custom:
          // TODO
          break;
      };
    } catch (e) {
      OnWebitelError.trigger(new WebitelError(WebitelErrorTypes.Call, e.message).getJSONObject());
    };
  };

  function getChannel(channelId) {
    var channel = ChanelCalls.get(channelId);
    if (!channel) {
      return null;
    } else {
      return channel;
    };
  };

  function getChannelsByCall(callId) {
    var call = OngoingCalls.get(callId);
    if (call) {
      return call.channels
    }
    return []
  }

  function updateChannelParameters(channel, e) {
    if (!channel) return;
    for (var key in e) {
      channel[key] = e[key];
    };
  };

  function getCallIdFromEvent(e) {
    return e[WebitelCallChanelVariables.WAccountOriginationUuid] || e[WebitelCallChanelVariables.ChanelCallUuid];
  };

  function findCallByChannel(channel) {
    var channelId = channel[WebitelCallChanelVariables.UUID];
    var calls = OngoingCalls.collection,
      channels;
    for (var key in calls) {
      channels = calls[key].getChannels();
      if (channels.indexOf(channelId) > -1) {
        return calls[key];
      };
    };
    return null;
  };

  function handleChannelCreateEvent (channelId, e) {
    ChanelCalls.add(channelId, e);

    var callId = getCallIdFromEvent(e);
    var call = OngoingCalls.get(callId);
    if (call) {
      call.addChannels(channelId);
    } else {
      var newCall = new WebitelCall(callId, e, WebitelCallStates.Rinding);
      OngoingCalls.add(newCall);
    };

    var webCall = WebrtcCalls.get(channelId);
    if (webCall && webCall['session'].direction === WebitelVerto.enum.direction.inbound) {
      try {
        if (webCall['session'].answered) {
          return;
        }
        if (e[WebitelCallChanelVariables.WJsOriginate]) {
          webCall['session'].answer();
        } else {
          OnWebRTCDoAnswer.trigger({
            channel: e,
            dialog: webCall['session']
          });
        }
      } catch(e) {
        console.error(e)
      }
    }
  };

  function handleChannelState(id, e) {
    try {
      var channel = getChannel(id);
      if (channel) {
        if (
          channel[WebitelCallChanelVariables.CallerCalleeNumber] !== e[WebitelCallChanelVariables.CallerCalleeNumber] ||
          channel[WebitelCallChanelVariables.CallerCallerNumber] !== e[WebitelCallChanelVariables.CallerCallerNumber]
        ) {
          updateChannelParameters(channel, e);
          var call = findCallByChannel(channel);
          return OnWebitelCallBridge.trigger(call.getJSONObject());
        }
        updateChannelParameters(channel, e);
      }
    } catch (e) {
      // TODO CALL_STATE > CHANNEL_CREATE
    }
  };

  function handleChannelCallState(id, e) {
    try {
      var channel = getChannel(id);
      updateChannelParameters(channel, e);
    } catch (e) {
      // TODO CALL_STATE > CHANNEL_CREATE ?? ????? ?????????? freeSWITCH (?? ????????)
    }
  };

  function handleChannelHangupCompleteEvent (id, e) {
    var channel = getChannel(id);

    // fix cur_call
    var webCall = WebrtcCalls.get(id);
    if (webCall) {
      WebrtcCalls.remove(id);
      try {
        webCall['session'].hangup();
      } catch (e) {}
    };


    var call = findCallByChannel(channel);
    updateChannelParameters(channel, e);
    if (call) {
      var callId = call['uuid'];
      if (call.getCountChannel() == 1) {
        OngoingCalls.remove(callId);
        call.setState(WebitelCallStates.Ended);
        /* Fix IntegrationID */
        var newCallId;
        if (call.getDirection() == "inbound") {
          newCallId = channel['variable_originating_leg_uuid'] || e['Other-Leg-Unique-ID'] || e["variable_cc_member_session_uuid"];
        } else {
          newCallId = e['Unique-ID'];
        }
        /* EndFix IntegrationID */
        if (channel['variable_hangup_cause'] != "LOSE_RACE" && callId != newCallId) {
          try {
            OnWebitelCallUuid.trigger({call: call.getJSONObject(),
              newId: newCallId
            });
          } catch (e){}
        };
        try {
          OnWebitelCallHangup.trigger(call.getJSONObject());
        } catch (e) {}
      } else {
        call.removeChannel(id);
      };
    };
  };

  function handleChannelAnswerEvent (id, e) {
    var channel = getChannel(id);
    updateChannelParameters(channel, e);
    var call = findCallByChannel(channel);

    var direction = call.getDirection();

    var cdrId = id;
    if (direction === WebitelCallDirectionTypes.Inbound ) {
      cdrId = channel['variable_originating_leg_uuid'] || e['Other-Leg-Unique-ID']
        || e["variable_cc_member_session_uuid"] || e["Channel-Call-UUID"];
    } else {
      cdrId = e['Unique-ID'];
    }
    call.setCdrUuid(cdrId);

    call.setState(WebitelCallStates.Answered);
    if (direction === WebitelCallDirectionTypes.Inbound && (e['Other-Leg-Unique-ID'] || e['variable_cc_queue'])) { // Other-Leg-Unique-ID
      OnWebitelCallBridge.trigger(call.getJSONObject());
    }
  };

  function handleChannelBridgeEvent(id, e) {
    var channel = getChannel(id);
    updateChannelParameters(channel, e);
    var call = findCallByChannel(channel);
    OnWebitelCallBridge.trigger(call.getJSONObject());
  };

  function handleChannelUnbridgeEvent(id, e) {
    var channel = getChannel(id);
    updateChannelParameters(channel, e);
    var call = findCallByChannel(channel);
    if (call)
      OnWebitelCallUnbridge.trigger(call.getJSONObject());
  }

  function handleChannelOutgoingEvent (e) {

  };

  function handleChannelDestroyEvent (id, e) {
    ChanelCalls.remove(id);
  };

  function handleChannelDtmfEvent (id, e) {
    var channel = getChannel(id);
    var call = findCallByChannel(channel);
    OnWebitelCallDtmf.trigger({
      call: call.getJSONObject(),
      digits: e['DTMF-Digit']
    });
  };


  function handleChannelHoldEvent (id, e) {
    var channel = getChannel(id);
    var call = findCallByChannel(channel);
    call.setState(WebitelCallStates.Hold);
    e[WebitelCallChanelVariables.CallStateName] = 'HOLD';
    updateChannelParameters(channel, e);
  };

  function handleChannelUnholdEvent (id, e) {
    var channel = getChannel(id);
    var call = findCallByChannel(channel);
    call.setState(WebitelCallStates.Active);
    e[WebitelCallChanelVariables.CallStateName] = 'ACTIVE';
    updateChannelParameters(channel, e);
  };

  function handleChannelReccordStartEvent(id, e) {
    var channel = getChannel(id);
    var call = findCallByChannel(channel);
    if (call) {
      OnWebitelCallRecordStart.trigger(call.getJSONObject());
    };
  };

  function handleChannelReccordStopEvent(id, e) {
    var channel = getChannel(id);
    var call = findCallByChannel(channel);
    if (call) {
      OnWebitelCallRecordStop.trigger(call.getJSONObject());
    };
  };

  var WebitelServerEvent = function(attrs) {
    var type = attrs['Event-Name'];
    if (WebitelUserEventTypes.isValid(type)) {
      WebitelUserEvent(attrs);
    } else if (WebitelCallEventTypes.isValid(type)) {
      WebitelCallEvent(attrs);
    };

    /*

     */
    EventMixin.trigger(attrs['Event-Name'], attrs);
  };

  var WebitelCommandResponse = function(response) {
    this.id = response['exec-uuid'];
    this.status = (response['exec-complete'] == "+OK" || response['exec-complete'].indexOf('-ERR no reply\n')== 0)
      ? WebitelCommandResponseTypes.Success
      : WebitelCommandResponseTypes.Fail;
    this.response = response['exec-response'];
  };

  function getWebrtcCallFromCallUUID (callUUID) {
    var call = OngoingCalls.get(callUUID)
      ,channels
      ,channel
      ,webCall
    ;
    if (!call) return null;
    channels = call.getChannels();
    for (var key in channels) {
      channel = channels[key];
      webCall = WebrtcCalls.get(channel);
      if (webCall) {
        return webCall;
      };
    }
    return null;
  };

  //====================================================================

  var webrtcPhoneStart = function (option) {
    var _option = option;
    if (webrtcPhone) {
      webrtcPhone.logout();
    }
    var login = _option['login'];
    var jssipConfiguration = new Object(_option);
    jssipConfiguration['uri'] = 'sip:' + login;
    var callbacks = {
      onMessage: function(verto, dialog, msg, data) {
        switch (msg) {
          case WebitelVerto.enum.message.info:
            OnNewMessage.trigger(data);
            break;
          default:
          //console.info(arguments);
        };
      },
      onError: function (dialog, err) {
        OnWebitelError.trigger(new WebitelError(WebitelErrorTypes.Call,
          err['message'] || err['name']).getJSONObject());
      },
      onVideoEnabledChange: function (dialog) {
        var to = dialog.params.remote_caller_id_number;
        if (!to) return;

        if (to.indexOf('@') === -1) {
          to += '@' + domainUser;
        };
        var msg = {
          to: to,
          body: {
            type: 'REMOTE-VIDEO-CHANGE',
            callID: dialog.callID,
            enabled: dialog.rtc.videoEnabled
          }
        };

        WebitelConnection.sendUserMsg(msg);
      },
      onGetVideoContainer: function (dialog) {
        OnNewWebRTCCall.trigger(dialog);
      },
      onDialogState: function(d) {
        console.log('---------VERTO onDialogState----------');
        switch (d.state) {
          case WebitelVerto.enum.state.recovering:
            var newWebCall = {
              'call-uuid': d.callID,
              'session': d,
              'attached': true
            };

            WebrtcCalls.add(newWebCall);
            WebitelConnection.channelDump(d.callID, function (res) {
              var jsonE;
              try {
                jsonE = JSON.parse(res);
              } catch (e) {
                jsonE = {
                  "Channel-Call-UUID": d.params['callID'],
                  "Caller-Callee-ID-Name": d.params['caller_id_name'],
                  "Caller-Callee-ID-Number": d.params['caller_id_number'],
                  "Caller-Caller-ID-Name": d.params['remote_caller_id_name'],
                  "Caller-Caller-ID-Number": d.params['remote_caller_id_number'],
                  "Caller-Destination-Number": d.params['destination_number'],
                  "Unique-ID": d.params['callID']
                };
              };
              handleChannelCreateEvent (d.callID, jsonE);
            });
            if (d.params.useVideo) {
              OnVideoWebRTCCall.trigger(d);
            };
            break;
          case WebitelVerto.enum.state.ringing:
            var newWebCall = {
              'call-uuid': d.callID,
              'session': d
            };

            WebrtcCalls.add(newWebCall);
            var channel = ChanelCalls.get(d.callID);
            if (channel) {
              try {
                if (channel[WebitelCallChanelVariables.WJsOriginate]) {
                  d.answer();
                } else {
                  if (!d.answered) {
                    OnWebRTCDoAnswer.trigger({
                      channel,
                      dialog: d
                    });
                  }
                }
              } catch (e) {}
            }

            console.log('verto.enum.state.ringing');

            break;

          case WebitelVerto.enum.state.trying:
            var newWebCall = {
              'call-uuid': d.callID,
              'session': d
            };
            WebrtcCalls.add(newWebCall);
            console.log('verto.enum.state.ringing');
            console.log('verto.enum.state.trying');
            break;

          //case WebitelVerto.enum.state.early:
          case WebitelVerto.enum.state.active:
            var webCall = WebrtcCalls.get(d.callID);
            if (webCall && webCall['attached']) {
              var _channel = ChanelCalls.get(d.callID);
              handleChannelAnswerEvent(d.callID, _channel);
            };

            if (d.lastState === WebitelVerto.enum.state.held) {
              WebitelConnection.refreshVideo(d.callID);
            };

            //d.rtc.remoteStream && d.rtc.remoteStream.getVideoTracks().length > 0
            //if (d.params.useVideo && d.params.sdp.indexOf('m=video') > 0) {
            if (d.params.useVideo && d.rtc.mediaData.SDP.indexOf('m=video') > 0) {
              OnVideoWebRTCCall.trigger(d);
            };
            break;

          case WebitelVerto.enum.state.hangup:
            console.log('verto.enum.state.hangup');
            break;
          case WebitelVerto.enum.state.destroy:
            console.log('verto.enum.state.destroy');
            OnDestroyWebRTCCall.trigger(d);
            break;

          case WebitelVerto.enum.state.held:
            console.log('verto.enum.state.held');
            break;
          default:
            console.info(d.state);
            break;
        }
      },
      onWSLogin: function(v, success) {
        if (!success) {
          // TODO
          reconnect = -1;
        } else {
          OnRegisterWebRTC.trigger(v)
        }
        console.log('---------VERTO onWSLogin----------');
      },
      onWSClose: function(v, success) {
        console.log('---------VERTO onWSClose----------');
        OnUnRegisterWebRTC.trigger(v)
      },
      onEvent: function(v, e) {
        console.debug("GOT EVENT", e);
      }
    };
    webrtcPhone = new WebitelVerto({
      login: login,
      passwd: jssipConfiguration['password'],
      socketUrl: jssipConfiguration['ws_servers'],
      ringFile: vertoRecordFile,
      videoParams: jssipConfiguration['videoParams'],
      deviceParams: option.deviceParams || {},
      userVariables: {
        "verto_user_agent": "Webitel-Phone/" + version
      },
      //audioParams: {
      //    googAutoGainControl: false,
      //    googNoiseSuppression: false,
      //    googHighpassFilter: false
      //},
      //screenShare: true,
      localTag: jssipConfiguration['localTag'],
      iceServers: jssipConfiguration['iceServers'],
      attachAutoAnswer: jssipConfiguration['attachAutoAnswer']

    }, callbacks);
    //phone = webrtcPhone;
    webrtcPhone.login();

  };

  var webRtcPhoneStop = function () {
    if (webrtcPhone) {
      webrtcPhone.logout();
    }
    webrtcPhone = null;
  };

  var getWebPhone = function () {
    return webrtcPhone;
  };

  //Functions related to connection
  var WebitelConnection = {
    _status: ConnectionStatus.Disconnected,
    getStatus: function() {
      return WebitelConnection._status;
    },
    _webSocket: null,
    onConnect: new WebitelEvent(),
    onReceivedMessage: new WebitelEvent(),
    onDisconnect: new WebitelEvent(),
    connect: function() {
      var that = WebitelConnection;
      that._ready = false;
      if (!host || host == '') {
        that.onDisconnect.trigger(new WebitelError(WebitelErrorTypes.Connection, 'Incorrect connection string.').getJSONObject());
        return;
      };

      EventMixin.on('webitel-custom-message', function (evt) {
        var msg = evt['body'];
        if (msg instanceof Object) {
          switch (msg['type']) {
            case 'REMOTE-VIDEO-CHANGE':
              var calls = OngoingCalls.collection,
                chn,
                call;
              for (var i = 0, len = calls.length; i < len; i++) {
                call = calls[i];
                chn = call.getActualChannel();
                if ([chn['variable_originating_leg_uuid'],chn['Other-Leg-Unique-ID'], chn['Channel-Call-UUID']]
                  .indexOf(msg['callID']) > -1) {

                  OnVideoChangeWebRTCCall.trigger({
                    call: call.getJSONObject(),
                    remoteVideoEnabled: msg['enabled']
                  });
                  return;
                };
              };
              break;
          }
        }
      }, true);

      console.log("Host: " + host);
      try {
        if (webrtc && !isOperator) {
          webrtcPhoneStart(webrtc);
        }
      } catch (e) {
        alert(e.message);
        OnWebitelError.trigger(new WebitelError(WebitelErrorTypes.Connection, e.message).getJSONObject());
      }
      that._webSocket = new window.WebSocket(host);

      that._webSocket.onmessage = function(event) {
        if (debug) {
          console.info('New message received!');
        };
        that.onReceivedMessage.trigger(event.data);
      };
      that._webSocket.onerror = function(e) {
//                    that._status = ConnectionStatus.Disconnected;
        webSocketStatus(that._webSocket);
        console.error(e);
      };
      that._webSocket.onclose = function() {
        webSocketStatus(that._webSocket);
        that._ready = false;
        console.log('WebSocket conection closed');
        that._status = ConnectionStatus.Disconnected;
        that.onDisconnect.trigger();
        OngoingCommands.removeAll();
        EventMixin.removeAll();
        WebitelUsers.removeAll();

        if (reconnect && reconnect > 0) {
          console.info('will reconnect in ' + reconnect + ' sec.');
          setTimeout(function () {
            reconnect = reconnect * 2;
            that.connect()
          }, reconnect * 1000);
        }
      };
      that._webSocket.onopen = function() {
        webSocketStatus(that._webSocket);
        console.log('WebSocket connection opened');
        that._status = ConnectionStatus.Connected;
        var authCommand = new WebitelCommand(WebitelCommandTypes.Auth, {
            'account': account,
            'secret': secret,
            'key': keyAuth,
            'token': tokenAuth
          },
          function(res) {
            if (res.status === WebitelCommandResponseTypes.Success) {
              var user;
              if (res.response) {
                user = {
                  login: res.response.login,
                  role: res.response.role,
                  domain: res.response.domain,
                  wsCount: res.response['ws-count'],
                  cdr: res.response.cdr,
                  verto: res.response.verto,
                  acl: res.response.acl,
                  agent: Boolean(res.response['cc-agent'])
                }
              };
              that.onConnect.trigger(user);
              that.getAgents(user);
            } else {
              // TODO
              reconnect = -1;
              that.onDisconnect.trigger(res.response);
            };
          });
        authCommand.execute();
      };
    },

    getWebSocketStatus: function () {
      return WebitelConnection._status;
    },

    disconnect: function() {
      var logout = new WebitelCommand(WebitelCommandTypes.Logout,
        null,
        function() {
          console.log('Successfuly logged out!');
          reconnect = -1;
          WebitelConnection._webSocket.close();
        });
      logout.execute();
    },

    getAgents: function(currentSession) {
      var that = WebitelConnection;
      that.login(function() {
        that._ready = true;
        that.listUser(domainUser, function (res) {
          if (res.status === WebitelCommandResponseTypes.Success) {
            try {
              var users = JSON.parse(res.response.response);

              for (var key in users) {
                var agent = new WebitelUser({
                  'id': users[key]['id'],
                  'domain': users[key]['domain'],
                  'scheme': users[key]['scheme'],
                  'role': users[key]['role'],
                  'online': users[key]['online'],
                  'state': users[key]['state'],
                  'away': users[key]['status'],
                  'tag': users[key]['descript'],
                  'name': users[key]['name'],
                  'cc-login': (users[key]['agent.status'] === WebitelAgentStatus.Available || users[key]['agent.status'] === WebitelAgentStatus.AvailableOnDemand),
                  'agent': users[key]['agent'] === 'true'
                });
                WebitelUsers.add(agent.getId(), agent);
              };
              var currentUser = WebitelUsers.get(account.split('@')[0]);
              currentUser.setOnline(true);

            } catch (e) {
              // TODO !CM
            }

            OnWebitelReady.trigger(currentSession);
          }
        });
      });

    },


    getSocketReady: function () {
      return WebitelConnection._ready;
    },

    makeCall: function(extension, useVideo, autoAnswerData) {
      if ((!extension && extension != 0) /*|| !this.account()['online']*/)
        return false;
      extension = extension.replace(/\D/g, '');
      if (webrtcPhone) {
        webrtcPhone.newCall({
          destination_number: extension,
          caller_id_name: this.account().name,
          caller_id_number: this.account().id,
          useVideo: useVideo,
          useStereo: false
        });

      } else {
        var params = {
          "extension": extension,
          "auto_answer_param": autoAnswerData ? "sip_auto_answer=true" : null, //autoAnswerParam || autoAnswerData,
          "user": account
        };
        var call = new WebitelCommand(WebitelCommandTypes.Call,
          params,
          function(sender) {
            console.log(sender);
          }
        );
        call.execute();
      };
    },

    answer: function(callUUID, useVideo) {
      var webCall = getWebrtcCallFromCallUUID(callUUID);

      if (webCall && !webCall['answered']) {
        webCall['session'].answer({
          useVideo: useVideo
        });
        webCall['answered'] = true;
        return true;
      };
      return false;
    },

    setMute: function (callUUID, wath) {
      var webCall = getWebrtcCallFromCallUUID(callUUID);
      if (webCall) {
        return webCall['session'].setMute(wath);
      };
      return null;
    },

    getMute: function (callUUID) {
      var webCall = getWebrtcCallFromCallUUID(callUUID);
      if (webCall) {
        return webCall['session'].getMute();
      };
      return null;
    },

    sendMessage: function (option, cb) {
      if (!option || !option['to'] || !option['message']) {
        // TODO ERROR
        return false;
      };
      if (!/@/.test(option['to'])){
        option['to'] += '@' + domainUser;
      }
      var command = new WebitelCommand(WebitelCommandTypes.Chat.Send, option, cb);
      command.execute();
      return true;
    },

    setStatusReady: function(cb) {
      var _account = account.split('@')[0];
      this.userUpdate(_account, domainUser, 'status', WebitelAccountStatusTypes.Ready, function (res) {
        if (res.status == WebitelCommandResponseTypes.Success)
          console.log('Status successfully changed to Ready!');

        if (cb)
          cb(res);
      });
    },

    setStatusBusy: function(cause, tag, cb) {
      var _cause = cause ? cause.toUpperCase() : '';
      if (!(_cause == WebitelUserAwayCauseTypes.CallForwarding || _cause == WebitelUserAwayCauseTypes.DoNotDisturb ||
        _cause == WebitelUserAwayCauseTypes.OnBreak || _cause == WebitelUserAwayCauseTypes.VoiceMail)) {
        throw "Cause '" + _cause + "' is not supported! Please check your data and use one from WebitelUserAwayCauseTypes object"
      };
      var _account = account.split('@')[0],
        _cause = _cause;
      if (tag) {
        _cause += "('" + tag.replace(/\n/g, ' ') + "')";
      };
      this.userUpdate(_account, domainUser, 'status', _cause, function (res) {
        if (res.status == WebitelCommandResponseTypes.Success)
          console.log('Status successfully changed to Busy!');

        if (cb)
          cb(res);
      });

    },

    hangupCall: function(callUUID, cause) {
      var call = OngoingCalls.get(callUUID),
        channels = [],
        command;
      if (call) {
        channels = call.getChannels();
        for (var key in channels) {
          command = new WebitelCommand(
            WebitelCommandTypes.Hangup, {
              'channel-uuid': channels[key],
              cause
            }
          );
          command.execute();
        }
        return true;
      }
      return false;
    },

    parkCall: function (callUUID) {
      var call = OngoingCalls.get(callUUID),
        channels = [],
        command;
      if (call) {
        channels = call.getChannels();
        for (var key in channels) {
          command = new WebitelCommand(
            WebitelCommandTypes.Park, {
              'call-uuid': channels[key]
            }
          );
          command.execute();
        };
        return true;
      }
      return false;
    },

    toggleHoldCall: function(callUUID, callback) {
      var call = OngoingCalls.get(callUUID),
        channel;
      if (call) {
        channel = call.getActualChannel();
        // TODO switch_callstate_table CALLSTATE_CHART
        if (channel && (channel[WebitelCallChanelVariables.CallStateName] == "ACTIVE" ||
          channel[WebitelCallChanelVariables.CallStateName] == "RING_WAIT")) {
          this.hold(callUUID, callback);
        } else {
          this.unhold(callUUID, callback);
        };
      }
    },

    holdCall: function(callUUID, callback) {
      var call = OngoingCalls.get(callUUID),
        channels = [],
        command;

      if (call) {
        channels = call.getChannels();

        var _webCall = WebrtcCalls.get(channels[0]);
        if (_webCall) {
          _webCall['session'].hold();
          if (callback) {
            callback();
          }
          return;
        };

        command = new WebitelCommand(
          WebitelCommandTypes.Hold, {
            'channel-uuid': channels.join(',')
          },
          callback
        );
        command.execute();
      }
    },

    unholdCall: function(callUUID, callback) {
      var call = OngoingCalls.get(callUUID),
        channels = [],
        command;

      if (call) {
        channels = call.getChannels();

        var _webCall = WebrtcCalls.get(channels[0]);
        if (_webCall) {
          _webCall['session'].unhold();
          if (callback) {
            callback();
          }
          return;
        }

        command = new WebitelCommand(
          WebitelCommandTypes.UnHold, {
            'channel-uuid': channels.join(',')
          },
          callback
        );
        command.execute();
      }
    },

    sendDtmf: function (callUUID, digits, callback) {
      var call = OngoingCalls.get(callUUID),
        channels = [],
        command;
      if (call) {
        channels = call.getChannels();
        command = new WebitelCommand(
          WebitelCommandTypes.Dtmf, {
            'channel-uuid': channels.join(','),
            'digits': digits
          },
          callback
        );
        command.execute();
      }
    },

    transferCall: function(callUUID, destination, callback) {
      var call = OngoingCalls.get(callUUID),
        command;
      if (call) {
        command = new WebitelCommand(
          WebitelCommandTypes.Transfer, {
            'channel-uuid': call.getActualChannel()['Other-Leg-Unique-ID'],
            'destination': destination
          },
          callback
        );
        command.execute();
        return true;
      }
      return false;
    },

    attendedTransferCall: function(callUUID, destination) {
      var call = OngoingCalls.get(callUUID);
      if (!call || !destination) return false;

      var channel = call.getActualChannel();
      var channelUUID = channel['Unique-ID'];
      var cmd = new WebitelCommand(WebitelCommandTypes.AttXfer2, {
        'channel-uuid': channelUUID,
        'extension': destination + '@' + account.split('@')[1],
        'user': account,
        'auto_answer_param': (webrtcPhone) ? null : [autoAnswerParam || 'sip_h_Call-Info=answer-after=0'],
        'parent_call_uuid': callUUID
      });
      cmd.execute();
    },

    cancelTransfer: function (callIdA, callIdB) {
      var call = OngoingCalls.get(callIdA);
      var consultCall = OngoingCalls.get(callIdB);
      if (!call || !consultCall) return false;

      var channel = call.getActualChannel();
      var channelC = consultCall.getActualChannel();
      var command = new WebitelCommand(
        'att_xfer_cancel', {
          'channel-uuid-leg-a': channel['Unique-ID'],
          'channel-uuid-leg-b': channel['Other-Leg-Unique-ID'],
          'channel-uuid-leg-c': channelC['Unique-ID']
        }
      );
      command.execute();
      return true;
    },

    bridgeChannel: function (legA, legB) {
      const a = ChanelCalls.get(legA), b = ChanelCalls.get(legB);
      if (!a || !b || !a['Other-Leg-Unique-ID'] || !b['Other-Leg-Unique-ID'])
        return false;

      var command = new WebitelCommand(
        WebitelCommandTypes.Bridge, {
          'channel_uuid_A': a['Other-Leg-Unique-ID'],
          'channel_uuid_B': b['Other-Leg-Unique-ID']
        }
      );
      command.execute();
      return true;
    },

    bridgeTransfer: function (callIdA, callIdB) {
      var call = OngoingCalls.get(callIdA);
      var consultCall = OngoingCalls.get(callIdB);
      if (!call || !consultCall) return false;

      var channel = call.getActualChannel();
      var channelC = consultCall.getActualChannel();
      var command = new WebitelCommand(
        'att_xfer_bridge', {
          'channel-uuid-leg-a': channel['Unique-ID'],
          'channel-uuid-leg-b': channel['Other-Leg-Unique-ID'],
          'channel-uuid-leg-c': channelC['Other-Leg-Unique-ID']
        }
      );
      command.execute();
      return true;
    },

    conferenceTransfer: function (callUUID) {

    },

    getVariable: function(channelUUID, variable, inleg, callback) {
      var variableCommand = new WebitelCommand(
        WebitelCommandTypes.GetVariable, {
          'channel-uuid': channelUUID,
          'variable': variable
        },
        callback
      );
      variableCommand.execute();
    },

    setVariable: function(channelUUID, variable, value, inleg) {
      var variableCommand = new WebitelCommand(
        WebitelCommandTypes.SetVariable, {
          'channel-uuid': channelUUID,
          'variable': variable,
          'value': value
        }
      );
      variableCommand.execute();
    },

    logout: function() {
      var logout = new WebitelCommand(WebitelCommandTypes.Logout, null, null);

      logout.execute();
    },

    login: function(handle) {
      var that = this,
        login = new WebitelCommand(WebitelCommandTypes.Login, null, function() {
          if (handle) {
            try {
              handle.call(this, this);
            } catch (e) {
              // TODO gen event script error
              console.error(e);
            }
          };
          OnWebitelLogin.trigger();
        });
      ;
      login.execute();
    },

    readyCallCenter: function (opt, cb) {
      opt = opt || {};
      if (!opt['status'])
        opt['status'] = webitelAgentStatusDef;

      var cmd = new WebitelCommand(WebitelCommandTypes.CallCenter.Ready, opt, function() {
        console.log('Successfuly status CC agent ready!');
        if (cb) {
          cb.call(this, this);
        };
      });
      cmd.execute();
    },

    loginCallCenter: function (opt, cb) {
      opt = opt || {};
      if (!opt['status'])
        opt['status'] = webitelAgentStatusDef;

      var cmd = new WebitelCommand(WebitelCommandTypes.CallCenter.Login, opt, function(res) {
        console.log('Successfuly logged CC in!');
        if (cb) {
          cb.call(this, this);
        };
      });
      cmd.execute();
    },

    busyCallCenter: function (opt, cb) {
      // delete
      alert('DELETE FN USE budy!');
      return
    },

    logoutCallCenter: function (cb) {
      var login = new WebitelCommand(WebitelCommandTypes.CallCenter.Logout, null, function() {
        console.log('Successfuly logged CC in!');
        if (cb) {
          cb.call(this, this);
        }
      });
      login.execute();
    },

    bindNumber: function(number, password, handle) {

    },

    getCurrentStatus: function() {
      var currentAgent = WebitelUsers.get(account.split('@')[0]);
      return currentAgent
        ? currentAgent.getJSONObject()
        : {};
    },

    // System Commands
    createDomain: function(name, customerId, cb) {
      var command = new WebitelCommand(WebitelCommandTypes.Domain.Create, {
        name: '\"' + name + '\"',
        customerId: customerId
      }, cb);
      command.execute();
    },

    listDomain: function(customerId, cb) {
      var _cb, _customerId;
      if (typeof arguments[0] == "function") {
        _cb = arguments[0];
        _customerId = null
      } else {
        _cb = cb;
        _customerId = customerId;
      };
      var command = new WebitelCommand(WebitelCommandTypes.Domain.List, {
        customerId: _customerId
      }, _cb);
      command.execute();
    },

    removeDomain: function(name, cb) {
      var command = new WebitelCommand(WebitelCommandTypes.Domain.Remove, {
        name: name
      }, cb);
      command.execute();
    },

    updateDomain: function() {
      // TODO
    },

    hotdeskSignIn: function (id, cb) {
      var cmd = new WebitelCommand('hotdesk_signin', {
        address: id
      }, cb);
      cmd.execute();
    },

    hotdeskSignOut: function (cb) {
      var cmd = new WebitelCommand('hotdesk_signout', {

      }, cb);
      cmd.execute();
    },

    /*
     *  Список всех пользователей и устройств
     *  @domain {String}
     */
    list_users: function(domain, cb) {
      var _cb, _domain;
      if (typeof arguments[0] == "function") {
        _cb = arguments[0];
        _domain = null
      } else {
        _cb = cb;
        _domain = domain;
      };

      var cmd = new WebitelCommand(WebitelCommandTypes.ListUsers, {
        domain: _domain
      }, _cb);
      cmd.execute();
    },
    /*
     @domain
     */
    listUser: function(domainName, cb) {
      var _cb, _domain;
      if (typeof arguments[0] == "function") {
        _cb = arguments[0];
        _domain = null
      } else {
        _cb = cb;
        _domain = domainName;
      };

      var cmd = new WebitelCommand(WebitelCommandTypes.Account.List, {
        domain: _domain
      }, _cb);
      cmd.execute();
    },
    /*
     @role {String}
     <user>[:<password>][@<domain>]
     */
    createUser: function(role, login, password, domain, attr, cb) {
      /**
       * attr = {
                 *       parameters: [],
                 *       extensions: []
                 * }
       */
      if (typeof attr === 'function') {
        cb = attr;
        attr = null;
      };

      if (!attr) {
        attr = {
          "parameters": ["cc-agent=true"]
        }
      };

      var _param =[];
      _param.push(login);
      if (password && password != '')
        _param.push(':' + password);
      _param.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Account.Create, {
        role: role,
        param: _param.join(''),
        attribute: attr
      }, cb);
      cmd.execute();
    },
    /*
     <user>[@<domain>]
     <param> {user, password, role}
     <value>
     */
    updateUser: function(user, domain, paramName, paramValue, cb) {

      if ( typeof paramValue === 'function' ) {
        cb = paramValue;
        paramValue = null;
      }

      var _user = [];
      _user.push(user);

      if (domain)
        _user.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Account.Change, {
        user: _user.join(''),
        param: paramName,
        value: paramValue
      }, cb);

      cmd.execute();
    },

    userItem: function (user, domain, cb) {
      if (typeof domain === 'function') {
        cb = domain;
        domain = null;
      };
      if (domain) {
        user += '@' + domain;
      };
      var cmd = new WebitelCommand(WebitelCommandTypes.Account.Item, {
        "user": user
      }, cb);
      cmd.execute();
    },
    /*
     <user>[@<domain>]
     */
    removeUser: function(user, domain, cb) {
      var _user = [];
      _user.push(user);
      if (domain)
        _user.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Account.Remove, {
        user: _user.join('')
      }, cb);
      cmd.execute();
    },

    // ----------------------- Device --------------------------------
    /*
     @domain
     */
    listDevice: function(domain, cb) {
      var _cb, _domain;
      if (typeof arguments[0] == "function") {
        _cb = arguments[0];
        _domain = null
      } else {
        _cb = cb;
        _domain = domain;
      };

      var cmd = new WebitelCommand(WebitelCommandTypes.Device.List, {
        domain: _domain
      }, _cb);
      cmd.execute();
    },
    /*
     @role {String}
     <user>[:<password>][@<domain>]
     */
    createDevice: function(type, login, password, domain, cb) {
      var _param =[];
      _param.push(login);
      if (password && password != '')
        _param.push(':' + password);
      _param.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Device.Create, {
        type: type,
        param: _param.join('')
      }, cb);
      cmd.execute();
    },
    /*
     <user>[@<domain>]
     <param> {user, password, role}
     <value>
     */
    updateDevice: function(device, domain, paramName, paramValue, cb) {
      var _device = [];
      _device.push(device);
      if (domain)
        _device.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Device.Change, {
        device: _device.join(''),
        param: paramName,
        value: paramValue
      }, cb);
      cmd.execute();
    },
    /*
     <user>[@<domain>]
     */
    removeDevice: function(device, domain, cb) {
      var _device = [];
      _device.push(device);
      if (domain)
        _device.push('@' + domain);

      var cmd = new WebitelCommand(WebitelCommandTypes.Device.Remove, {
        device: _device.join('')
      }, cb);
      cmd.execute();
    },

    whoami: function (cb) {
      var that = WebitelConnection;
      var cmd = new WebitelCommand(WebitelCommandTypes.Whoami, {
      }, function (res) {
        if (res.status == WebitelCommandResponseTypes.Success) {
          cb(that.parseCurrentAccount(res.response))
        };
      });
      cmd.execute();
    },

    sendMessageInChannel: function (channelId, text) {
      var that = WebitelConnection;
      var cmd = new WebitelCommand('//api uuid_chat', {
        channelId: channelId,
        text: text
      });
      cmd.execute();
    },

    reloadAgents: function (cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.ReloadAgents, {}, cb);
      cmd.execute();
    },

    getAgentsList: function (cb) {
      var res = [],
        _users = WebitelUsers.collection;
      for (var key in _users)
        res.push(_users[key].getJSONObject());
      cb(res);
    },

    rawapi: function(command, handle) {
      var rawapi = new WebitelCommand(
        WebitelCommandTypes.Rawapi, {
          'command': command
        },
        function(jsonResp) {
          if (handle) {
            handle.call(this, jsonResp['response']['response'].trim());
          }
        }
      );
      rawapi.execute();
    },

    eavesdrop: function (user, channelId, options, cb) {
      if (typeof option == 'string') {
        options = {
          "side": options
        }
      }
      option = option || {};
      var side = option.side;
      var display = option.display;
      var rawapi = new WebitelCommand(
        WebitelCommandTypes.Eavesdrop, {
          'user': user,
          'channel-uuid': channelId,
          'side': side,
          'display': display,
        },
        cb
      );
      rawapi.execute();
    },

    displace: function () {
      // TODO
    },

    channelDump: function (channelId, cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.ChannelDump, {
        'uuid': channelId
      }, cb);
      cmd.execute();
    },

    genToken: function(password, cb) {
      var exec = new WebitelCommand('token_generate', {
        'password': password
      }, function (res) {
        if (cb) {
          cb(res['response'])
        }
      });
      exec.execute();
    },

    sipProfileList: function (cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.SipProfile.List, {
      }, cb);
      cmd.execute();
    },

    sipProfileRescan: function (profile, cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.SipProfile.Rescan, {
        'profile': profile
      }, cb);
      cmd.execute();
    },

    gatewayList: function (cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.Gateway.List, {
      }, cb);
      cmd.execute();
    },
    gatewayKill: function (profile, gateway, cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.Gateway.Kill, {
        'profile': profile,
        'gateway': gateway
      }, cb);
      cmd.execute();
    },

    showChannel: function (domain, cb) {
      var _cb, _domain;
      if (typeof arguments[0] == "function") {
        _cb = arguments[0];
        _domain = null
      } else {
        _cb = cb;
        _domain = domain;
      };
      var cmd = new WebitelCommand(WebitelCommandTypes.Show.Channel, {
        'domain': _domain
      }, _cb);
      cmd.execute();
    },

    getRecordFileFromUUID: function (uuid, cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.CDR.GetRecordLink, {
        'uuid': uuid
      }, cb);
      cmd.execute();
    },

    sendUserMsg: function (msg, cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.Sys.message, msg, cb);
      cmd.execute();
    },

    refreshVideo: function (uuid, cb) {
      /*var call = OngoingCalls.get(callUUID);
       if (!call) return false;

       var channel = call.getActualChannel();
       var channelUUID = channel['Unique-ID']; */
      var cmd = new WebitelCommand(WebitelCommandTypes.VideoRefresh, {
        'uuid': uuid
      }, cb);
      cmd.execute();
    },

    setMuteVideo: function (callUUID, wath) {
      var webCall = getWebrtcCallFromCallUUID(callUUID);
      var res;
      if (webCall) {
        return webCall['session'].setMuteVideo(wath, true);
      };
      return null;
    },
    getTiers: function(cb) {
      var cmd = new WebitelCommand(WebitelCommandTypes.CallCenter.Tiers, {}, function(res) {
        var _result, err;
        if (res.status === WebitelCommandResponseTypes.Fail) {
          err = new Error(res.response);
        } else {
          // edit 01.02.2016
          if ( typeof res.response == 'string') {
            _result = res.response;
          } else {
            var objRes = res.response;
            _result = [];
            for (var key in objRes)
              _result.push(objRes[key])
          }

        }
        ;

        if (cb) {
          cb(err, _result);
        }

      });
      cmd.execute();
    },

    _exec: function(api, args, cb) {
      var cmd = new WebitelCommand(api, args, cb);
      cmd.execute();
    }

  };

  WebitelConnection.onReceivedMessage.subscribe(function(message) {
    var jsonResponse = JSON.parse(message);
    if (jsonResponse['webitel-event-name']) {
      if (debug) {
        console.log("=============== Event ================");
        console.log(jsonResponse);
        console.log("======================================");
      }
      WebitelServerEvent(jsonResponse);
    } else {
      if (debug) {
        console.log("=============== Command Response ================");
        console.log(message);
        console.log("=================================================");
      }
      var commandResponse = new WebitelCommandResponse(jsonResponse);

      var currentCommand = OngoingCommands.get(commandResponse.id);
      try {
        if (commandResponse.status == WebitelCommandResponseTypes.Success) {
          if (currentCommand.callback) {
            try {
              currentCommand.callback(commandResponse, message);
              if (debug)
                console.log('Command ' + currentCommand.id + ' executed callback');
            } catch (e){
              console.error('Error: Command ' + currentCommand.id + ' executed callback');
            }
          };
          if (debug)
            console.log('Command ' + currentCommand.id + ' executed with result: ' + JSON.stringify(commandResponse));
        } else {
          var errorType;
          switch (currentCommand.commandName) {
            case WebitelCommandTypes.Call:
              errorType = WebitelErrorTypes.Call;
              break;
            case (WebitelCommandTypes.Auth || WebitelCommandTypes.Login):
              errorType = WebitelErrorTypes.Authentication;
              break;
            case (WebitelCommandTypes.AgentList || WebitelCommandTypes.CahangeStatus):
              errorType = WebitelErrorTypes.Agent;
              break;
            case WebitelCommandTypes.ReloadDialplan:
              errorType = WebitelCommandTypes.ReloadDialplan;
              break;
            case WebitelCommandTypes.ReloadDirectory:
              errorType = WebitelCommandTypes.ReloadDirectory;
              break;
          }
          if (currentCommand.callback) {
            currentCommand.callback(commandResponse, message);
            if (debug) console.log('Command ' + currentCommand.id + ' executed callback');
          }
          ;
          OnWebitelError.trigger(new WebitelError(errorType, commandResponse.response).getJSONObject());
        }
        ;
      } catch (e) {
        console.error(e.message);
      } finally {
        OngoingCommands.remove(currentCommand.id);
      };
    }
  });

  var resultInterface = {
    /**
     * Версия.
     */
    version: version,

    /**
     * Соедениться.
     */
    connect: WebitelConnection.connect,

    /**
     *  Закрыть соединение.
     **/
    disconnect: WebitelConnection.disconnect,

    /**
     * Информация о текущем пользовате.
     * @response {WebitelUser} - информация про текущего пользователя.
     **/
    account: WebitelConnection.getCurrentStatus,

    /**
     *  Войти в Webitel.
     **/
    login: WebitelConnection.login,
    readyCallCenter: WebitelConnection.readyCallCenter,
    busyCallCenter: WebitelConnection.busyCallCenter,
    logoutCallCenter: WebitelConnection.logoutCallCenter,
    loginCallCenter: WebitelConnection.loginCallCenter,
    getTiers: WebitelConnection.getTiers,

    /**
     *  Выйти из Webitel.
     **/
    logout: WebitelConnection.logout,

    /**
     *  Установить статус пользователя в состояние @code
     * **/
    busy: WebitelConnection.setStatusBusy,

    /**
     *  Установить статус пользователя Готов
     **/
    ready: WebitelConnection.setStatusReady,

    /**
     *  Событие пользователя в состоянии "Готов"
     **/
    onReady: OnWebitelReady.subscribe,

    /**
     *  Создать звонок.
     *  @number {String} - номер куда нужно позвонить.
     *  @useVideo {Boolean} - использовать видео при звонке WebRTC.
     **/
    call: WebitelConnection.makeCall,

    /**
     *  Завершить звонок.
     *  @uuid {String} - идентификатор звонка.
     **/
    hangup: WebitelConnection.hangupCall,

    /**
     * Ответить на звонок(WebRTC)
     * @uuid {String} - идентификатор звонка.
     * @useVideo {Boolean} - использовать видео поток.
     **/
    answer: WebitelConnection.answer,

    /**
     * Поставить/снять звонок с удержания.
     * @uuid {String} - идентификатор звонка.
     **/
    toggleHold: WebitelConnection.toggleHoldCall,

    /**
     * Поставить звонок на удержание.
     * @uuid {String} - идентификатор звонка.
     **/
    hold: WebitelConnection.holdCall,

    /**
     * Снять звонок с удержания.
     * @uuid {String} - идентификатор звонка.
     **/
    unhold: WebitelConnection.unholdCall,

    /**
     * Отправить DTMF.
     * @uuid {String} - идентификатор звонка.
     * @digits {String} - сигнал.
     */
    dtmf: WebitelConnection.sendDtmf,

    /**
     * Перевести звонок.
     * @uuid {String} - идентификатор звонка.
     * @number {String} - номер звонка на который нужно перевести @uuid звонок.
     **/
    transfer: WebitelConnection.transferCall,

    /**
     * Перевод с консультацией.
     * @uuid {String} - идентификатор звонка.
     * @number - номер на который нужно сделать звонок с консультацией.
     **/
    attendedTransfer: WebitelConnection.attendedTransferCall,

    /**
     * Отмена перевода с консультацией.
     * @uuid {String} - идентификатор звонка.
     **/
    cancelTransfer: WebitelConnection.cancelTransfer,

    /**
     * Соединить консультативный звонок.
     * @uuid {String} - идентификатор звонка.
     **/
    bridgeTransfer: WebitelConnection.bridgeTransfer,

    /**
     *
     */
    bridgeChannel: WebitelConnection.bridgeChannel,

    /**
     * Создать конференцию из активных консультатывных звонков.
     * @uuid {String} - идентификатор звонка.
     */
    conferenceTransfer: WebitelConnection.conferenceTransfer,

    /**
     * Перевести звонок на парковку.
     * @uuid {String} - идентификатор звонка.
     */
    parkCall: WebitelConnection.parkCall,

    /**
     * Событие смены статуса пользователей Webitel.
     * @return {WebitelUser} - пользователь в которого сменился статус.
     **/
    onUserStatusChange: OnWebitelUserStatusChange.subscribe,
    unUserStatusChange: OnWebitelUserStatusChange.unsubscribe,

    /**
     *
     */
    onUserLogin: OnWebitelLogin.subscribe,

    /**
     * Событие добавления информации о пользователе Webitel.
     * @return {WebitelUser} - новый пользователь.
     * **/
    onAddUser: WebitelUsers.onAdded.subscribe,

    /**
     * Событие удаления информации о пользователе Webitel.
     * @return {WebitelUser} - пользователь которого удалили.
     **/
    onRemoveUser: WebitelUsers.onRemoved.subscribe,

    /**
     * Смена атрубута пользователя.
     * @return {WebitelUser} - пользователь.
     */
    onChangeUser: OnWebitelUserChange.subscribe,

    /**
     * Событие нового звонка.
     * @param {WebitelCall} - атрибуты звонка.
     **/
    onNewCall: OngoingCalls.onAdded.subscribe,

    /**
     * Событие поднятия "Трубки"
     * @param {WebitelCall} - атрибуты звонка.
     **/
    onAcceptCall: OnWebitelCallAccept.subscribe,

    /**
     * Событие установки звонка на удержании.
     * @param {WebitelCall} - атрибуты звонка.
     **/
    onHoldCall: OnWebitelCallHold.subscribe,

    /**
     * Событие снятия звонка с удержания.
     * @param {WebitelCall} - атрибуты звонка.
     **/
    onUnholdCall: OnWebitelCallUnhold.subscribe,

    /**
     * Событие DTMF.
     * @call {WebitelCall} - атрибуты звонка.
     * @digits {String} - digits.
     **/
    onDtmfCall: OnWebitelCallDtmf.subscribe,


    /**
     * Событие соединения с каналом.
     * @call {WebitelCall} - атрибуты звонка.
     */
    onBridgeCall: OnWebitelCallBridge.subscribe,

    /**
     * Событие разъединение с каналом.
     * @call {WebitelCall} - атрибуты звонка.
     */
    onUnBridgeCall: OnWebitelCallUnbridge.subscribe,

    /**
     * Событие начала записи.
     * @call {WebitelCall} - атрибуты звонка.
     */
    onStartRecordCall: OnWebitelCallRecordStart.subscribe,

    /**
     * Событие остановки записи.
     * @call {WebitelCall} - атрибуты звонка.
     */
    onStopRecordCall: OnWebitelCallRecordStop.subscribe,

    /**
     * Событие смены UUID звонка.
     * @call {WebitelCall} - атрибуты звонка.
     * @newId {String} - новый UUID.
     */
    onUuidCall: OnWebitelCallUuid.subscribe,

    /**
     * Событие завершения звонка.
     * @call {WebitelCall} - атрибуты звонка.
     **/
    onHangupCall: OnWebitelCallHangup.subscribe,

    /**
     * Событие успешного соеденения с сервером Webitel
     * */
    onConnect: WebitelConnection.onConnect.subscribe,

    /**
     * Событие отключения соеденения с сервером Webitel
     * */
    onDisconnect: WebitelConnection.onDisconnect.subscribe,

    /**
     * Событие ошибки.
     * @param {WebitelError} - ошибка.
     **/
    onError: OnWebitelError.subscribe,

    /**
     * Событие новой Webrtc сессии.
     * @param {WebitelWebRTCSession} - сеcсия Webrtc.
     */
    onWebitelWebRTCCall: OnWebitelWebRTCCall.subscribe,

    /*
     * Событие нового сообщения на веб телефон
     * @text {String} - текст сообщения.
     */
    onNewMessage: OnNewMessage.subscribe,

    /*
     * Отправить сообщение на веб телефон
     * @extension {String} - номер абонента.
     * @text {String} - текст сообщения.
     * @succeededCb {Function} - обработчик успешной отправки сообщения.
     * @failedCb {Function} - обработчик не успешной отправки сообщения.
     */
    sendMessage: WebitelConnection.sendMessage,

    // System API
    /*
     * Создать домен.
     * @domainName {String} - домен.
     * @customerId {String} - CustomerId.
     * @callback {Function} - callback Функция обратного вызова.
     */
    domainCreate: WebitelConnection.createDomain,

    /*
     * Получить список доменов.
     * @domainName {String} - домен (если не задан, список всех доменов).
     * @callback {Function} - callback Функция обратного вызова.
     */
    domainList: WebitelConnection.listDomain,

    /*
     * Удалить домен.
     * @domainName {String} - домен.
     * @callback {Function} - callback Функция обратного вызова.
     */
    domainRemove: WebitelConnection.removeDomain,

    domainUpdate: WebitelConnection.updateDomain,

    /*
     * Список всех устройств и пользователей.
     * @domain {String} - обязательный для Root пользователя, домен по которому получить список.
     * @cb {Function} - callback Функция обратного вызова.
     */
    list_users: WebitelConnection.list_users,

    /*
     * Список пользователей
     * @domain {String} - обязательный для Root пользователя, домен по которому получить список.
     * @cb {Function} - callback Функция обратного вызова.
     */
    userList: WebitelConnection.listUser,

    /*
     * Создать пользователя.
     * @role {WebitelUserRoleType} - роль пользователя.
     * @login {String} - логин(номер) - пользователя.
     * @password {String} - пароль пользователя.
     * @domain {String} - домен пользователя.
     * @cb {Function} - callback Функция обратного вызова.
     */
    userCreate: WebitelConnection.createUser,

    /*
     * Обновить параметр пользователя.
     * @user {String} - пользователь которому нужно сменить значение параметра.
     * @domain {String} - обязательный для Root пользователя, домен пользователя которого нужно обновить.
     * @paramName {WebitelUserParamType} - название параметра который нужно сменить.
     * @paramValue {String} - значение параметра.
     * @callback {Function} - callback Функция обратного вызова.
     */
    userUpdate: WebitelConnection.updateUser,
    /*

     */
    user: WebitelConnection.userItem,

    /*
     * Удалить пользователя.
     * @user {String} - пользователь которого нужно удалить.
     * @domain {String} - обязательный для Root пользователя, домен пользователя которого нужно удалить.
     * @cb {Function} - callback Функция обратного вызова.
     */
    userRemove: WebitelConnection.removeUser,

    /*
     * Список устройств.
     * @domain {String} - домен по которому получить список.
     * @cb {Function} - callback Функция обратного вызова.
     */
    deviceList: WebitelConnection.listDevice,

    /*
     * Создать устройство.
     * @type {WebitelDeviceType} - тип устройства.
     * @login {String} - логин(номер) - устройства.
     * @password {String} - пароль устройства.
     * @domain {String} - домен устройства.
     * @cb {Function} - callback Функция обратного вызова.
     */
    deviceCreate: WebitelConnection.createDevice,

    /*
     * Обновить параметр устройства.
     * @device {String} - устройство которому нужно сменить значение параметра.
     * @domain {String} - домен устройства которое нужно обновить.
     * @paramName {WebitelUserParamType} - название параметра который нужно сменить.
     * @paramValue {String} - значение параметра.
     * @callback {Function} - callback Функция обратного вызова.
     */
    deviceUpdate: WebitelConnection.updateDevice,

    /*
     * Удалить устройство.
     * @device {String} - устройство которое нужно удалить.
     * @domain {String} - домен устройства которое нужно удалить.
     * @cb {Function} - callback Функция обратного вызова.
     */
    deviceRemove: WebitelConnection.removeDevice,

    /*
     * Подписаться на события сервера.
     * @eventName {String} - название события.
     * @handler {Function} - обработчик события.
     * @callback {Function} - callback Функция обратного вызова.
     */
    onServerEvent: EventMixin.on,

    /*
     * Отписаться от события сервера.
     * @eventName {String} - название события.
     * @callback {Function} - callback Функция обратного вызова.
     */
    unServerEvent: EventMixin.off,
    whoami: WebitelConnection.whoami,

    /*
     * Информация WebSoсket соединения.
     * @return {ConnectionStatus}
     */
    socketStatus: WebitelConnection.getWebSocketStatus,

    onNewWebRTCCall: OnNewWebRTCCall.subscribe,
    onWebRTCDoAnswer: OnWebRTCDoAnswer.subscribe,
    onDestroyWebRTCCall: OnDestroyWebRTCCall.subscribe,
    onVideoWebRTCCall: OnVideoWebRTCCall.subscribe,
    onVideoChangeWebRTCCall: OnVideoChangeWebRTCCall.subscribe,

    onRegisterWebRTC: OnRegisterWebRTC.subscribe,
    onUnRegisterWebRTC: OnUnRegisterWebRTC.subscribe,
    /**
     *
     */
    videoRefresh: WebitelConnection.refreshVideo,
    setMuteVideo: WebitelConnection.setMuteVideo,

    /**
     * Mute audio.
     * @param {WebitelMuteType} - значение;
     **/
    setMute: WebitelConnection.setMute,
    getMute: WebitelConnection.getMute,
    getChannel: getChannel,
    getChannelsByCall: getChannelsByCall,

    // SYS
    getVar: WebitelConnection.getVariable,
    setVar: WebitelConnection.setVariable,
    reloadAgents: WebitelConnection.reloadAgents,
    getAgentsList: WebitelConnection.getAgentsList,
    rawapi: WebitelConnection.rawapi,
    eavesdrop: WebitelConnection.eavesdrop,
    displace: WebitelConnection.displace,
    /*
     * Генарация токена для REST запросов.
     * @password {String}: пароль активного подключения.
     * @callback {Function} - callback Функция обратного вызова.
     */
    genToken: WebitelConnection.genToken,
    sipProfileList: WebitelConnection.sipProfileList,
    sipProfileRescan: WebitelConnection.sipProfileRescan,
    gatewayList: WebitelConnection.gatewayList,
    gatewayKill: WebitelConnection.gatewayKill,
    showChannel: WebitelConnection.showChannel,
    getRecordFileFromUUID: WebitelConnection.getRecordFileFromUUID,
    channelDump: WebitelConnection.channelDump,
    getSocketReady: WebitelConnection.getSocketReady,

    hotdeskSignIn: WebitelConnection.hotdeskSignIn,
    hotdeskSignOut: WebitelConnection.hotdeskSignOut,

    webrtcPhoneStart: webrtcPhoneStart,
    webrtcPhoneStop: webRtcPhoneStop,
    getWebPhone: getWebPhone,

    _exec: WebitelConnection._exec
  };

  return resultInterface;
};

export default Webitel;
