<template>
  <v-app :dark="theme === 'dark'">
    <v-system-bar app height="30px" v-if="showMenu">
      <div>
      </div>

      <span v-show="user" class="drag-zone">
        {{user.name}}
      </span>

      <v-spacer></v-spacer>

      <div class="system-bar-icons">

        <i v-show="user && user.loggedCC" class="in-queue"></i>

        <v-icon v-show="user && user.webPhoneRegister">headset_mic</v-icon>

        <div v-show="hotLinks.length > 0">
          <v-menu bottom left>
            <a slot="activator" >
              <v-icon>link</v-icon>
            </a>
            <v-list>
              <v-list-tile v-for="link in hotLinks" @click="openHotLink(link.src)" target="_blank">
                <v-list-tile-title>{{link.name}}</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </div>

        <a  @click="minimize">
          <v-icon>remove</v-icon>
        </a>
        <a  @click="hide">
          <v-icon>close</v-icon>
        </a>
      </div>


    </v-system-bar>

    <v-toolbar app v-if="showMenu" height="48" dense>


      <v-btn icon @click="showChangeStatusDialog()">
        <v-icon large :color="getStateColor(user)" >account_circle</v-icon>
      </v-btn>

      <v-text-field
        class="input-or-search-number"
        hide-details
        v-model="search"
        @keyup.enter.native="onMakeCall"
        @input="throttledSearch"
        :label="$t('app.search')"
        solo-inverted
        flat
      ></v-text-field>

      <v-menu
        offset-y bottom left :open-on-click="false"  v-model="showChangeCallDialog"
      >
        <v-btn icon slot="activator" @click="onShowCallDialog">
          <v-icon
            large
            :color="showBadgeCall ? '' : 'success'"
          >
            call
          </v-icon>

          <v-badge right overlap class="badge-call-count"  v-bind:class="countInboundNoAnswerCall > 0 ? 'flashing' : ''" v-model="showBadgeCall" right color="error" overlap>
            <span slot="badge">{{countCalls}}</span>
          </v-badge>
        </v-btn>
        <v-list>
          <v-list-tile v-for="(item, i) in calls" :key="i" :href=" '#/call/' + item.uuid">
            <v-list-tile-title>{{ item.getName() }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>

    </v-toolbar>

    <v-content class="app-content" v-if="initialize">
      <div class="app-view">
        <router-view></router-view>
      </div>
    </v-content>

    <v-container fluid class="app-spinner" fill-height v-show="!initialize || viewSpinner">
      <v-layout align-center justify-center>
        <v-progress-circular indeterminate :size="120" :width="2" color="warning">{{$t('app.loading')}}</v-progress-circular>
      </v-layout>
    </v-container>

    <AuthenticationDialog></AuthenticationDialog>

    <v-dialog v-model="viewStatusDialog" max-width="390">
      <v-card v-if="viewStatusDialog">
        <v-card-title class="headline">{{$t('changeStatus.title')}}</v-card-title>
        <v-card-text>
          <v-form >
            <v-select
              :items="listUserStatus"
              :label="$t('changeStatus.status')"
              v-model="dialogStatus"
              class="input-group--focused"
              item-value="text"
              :item-text="getStatusText"
              required
            ></v-select>

            <v-select
              v-show="dialogStatus !== 'Ready'"
              :required="dialogStatus !== 'Ready'"
              :items="listUserState(dialogStatus)"
              v-model="dialogState"
              item-value="code"
              :item-text="getStatusText"
              :label="$t('changeStatus.state')"
            ></v-select>

            <v-text-field
              v-show="dialogStatus === 'Busy'"
              v-model="dialogTag"
              name="Tag"
              :label="$t('changeStatus.tag')"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat="flat" @click.native="viewStatusDialog = false">{{$t('app.close')}}</v-btn>
          <v-btn color="green darken-1" flat="flat" :disabled="!dialogStatusValid" @click="changeStatus(dialogStatus, dialogState, dialogTag)">{{$t('app.ok')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <Upgrade></Upgrade>

    <v-bottom-nav
      app
      :ripple ="false"
      fixed
      :value="showMenu"
      :active.sync="currentLinkIdx"
    >
      <v-btn flat :ripple="false" to="/">
        <v-tooltip top>
          <v-icon
            slot="activator"
          >
            contact_phone
          </v-icon>
          <span>{{$t('toolbar.history')}}</span>
        </v-tooltip>
      </v-btn>

      <v-btn flat :ripple="false" router-link to="/callback" v-show="showCallbackTab">
        <v-tooltip top>
          <v-icon
            slot="activator"
          >
            update
          </v-icon>
          <span>{{$t('toolbar.callback')}}</span>
        </v-tooltip>
      </v-btn>

      <v-btn flat :ripple="false" router-link to="/users">
        <v-tooltip top>
          <v-icon
            slot="activator"
          >
            people
          </v-icon>
          <span>{{$t('toolbar.users')}}</span>
        </v-tooltip>
      </v-btn>

      <v-btn flat :ripple="false" router-link to="/settings">
        <v-tooltip top>
          <v-icon
            slot="activator"
          >
            settings
          </v-icon>
          <span>{{$t('toolbar.settings')}}</span>
        </v-tooltip>
      </v-btn>

    </v-bottom-nav>
  </v-app>
</template>

<script>
  import Vue from 'vue'
  import throttle from './services/throttle'
  import settings from './services/settings'
  import {getStateColor, parseServerUri} from './services/helper'
  import Spinner from './components/Spinner'
  import Upgrade from './components/Upgrade'
  import AuthenticationDialog from './components/AuthenticationDialog'

  const TABS = [
    {
      name: "History",
      path: "#/"
    },
    {
      name: "Users",
      path: "#/users"
    },
    {
      name: "Callback",
      path: "#/callback"
    },
    {
      name: "Settings",
      path: "#/settings"
    }
  ];

  function getTabByName(name) {
    for (let idx = 0; idx < TABS.length; idx++) {
      if (TABS[idx].name === name) {
        return idx
      }
    }
    return -1
  }

  export default {
    name: 'App',
    components: {
      Spinner,
      Upgrade,
      AuthenticationDialog
    },
    data() {
      return {
        tabs: null,
        search: '',
        initialize: false,
        showBadgeCall: false,
        showChangeCallDialog: false,
        viewMenu: false,
        viewSpinner: false,
        viewStatusDialog: false,
        currentLinkIdx: 0,

        showCallbackTab: false,

        dialogStatusValid: true,
        dialogStatus: null,
        dialogState: null,
        dialogTag: null,
        ringer: null,

        beforeReconnectingLink: null,

        listUserStatus: [
          {
            id: "statusReady",
            text: 'Ready'
          },
          {
            id: "statusCallCenter",
            text: 'Call Center',
            state: [
              {
                id: "stateCCWaiting",
                text: "Waiting",
                code: "Waiting"
              },
              {
                id: "statusOnBreak",
                text: "On Break",
                code: "ONBREAK"
              }
            ]
          },
          {
            id: "statusBusy",
            text: 'Busy',
            state: [
              {
                id: "stateDND",
                text: "Do not disturb",
                code: "DND",
              },
              {
                id: "statusOnBreak",
                text: "On Break",
                code: "ONBREAK"
              },
              {
                id: "stateCallForward",
                text: "Call forward",
                code: "CALLFORWARD"
              }
            ]
          }
        ]
      }
    },

    beforeCreate() {
      const server = settings.get("server");
      const token = this.$localStorage.get('token');
      const xkey = this.$localStorage.get('xkey');
      if (!server || !token || !xkey) {
        setTimeout(() => {
          this.afterInit(new Error("No session"));
        }, 10);
        return;
      }

      Vue.http.headers.common['x-key'] = xkey;
      Vue.http.headers.common['x-access-token'] = token;

      Vue.http.get(`${parseServerUri(server)}/api/v2/whoami`).then(
        response => {
          response.body.server = parseServerUri(server);
          response.body.token = token;
          response.body.key = xkey;
          this.afterInit(null, response.body);
        },
        response => {
          this.afterInit(new Error("Unauthorized"));
        }
      )
    },
    created() {

      this.ringer = new Audio('/static/sounds/iphone.mp3');
      this.ringer.loop = true;

      this.$router.beforeEach((to, from, next) => {
        if (!this.initialize) {
          return false;
        }

        if (!this.user && to.name !== 'Login') {
          return next('/login');
        } else if (to.name === 'Login') {
          // return next('/');
        }
        next()
      });

      this.$router.afterEach(to => {
        this.currentLinkIdx = getTabByName(to.name);
      });
      this.currentLinkIdx = getTabByName(this.$route.name);
    },

    computed: {
      hotLinks() {
        const links = settings.get('hot_links');
        if (links && links.length > 0) {
          return links
        }
        return []
      },
      showMenu () {
        return !!this.user && !this.reconnecting
      },
      user() {
        return this.$store.getters.user()
      },
      webitel() {
        return this.$store.getters.webitel
      },

      theme() {
        return this.$store.getters.theme()
      },

      countCalls() {
        return this.$store.getters.countCalls()
      },

      countInboundNoAnswerCall() {
        return this.$store.getters.countInboundNoAnswerCall()
      },

      calls() {
        return this.$store.getters.calls()
      },

      throttledSearch: function() {
        return throttle(this.onSearch, 500);
      },

      userStatus() {
        console.error('userStatus');
        if (this.user) {
          return "non-reg"
        }
        return ""
      },

      reconnecting() {
        return this.$store.getters.reconnecting()
      }
    },

    watch: {
      reconnecting(reconnecting) {
        if (reconnecting) {
          this.beforeReconnectingLink = this.$router.currentRoute.fullPath;
          this.$router.push('/reconnect')
        } else {
          this.$router.push(this.beforeReconnectingLink)
        }
      },
      calls(calls, old) {
        if (calls.length > 0) {
          this.showBadgeCall = true;
          let idx;
          if (calls.length === 1) {
            idx = 0;
          } else if (calls[calls.length - 1].isOutbound()) {
            idx = calls.length - 1;
          }

          if (idx > -1)
            this.$router.push(`/call/${calls[idx].uuid}`);

        } else {
          this.showBadgeCall = false;
        }
      },

      countInboundNoAnswerCall(count) {
        if (!settings.get('ringInboundCall')) {
          return;
        }
        if (settings.get(`ringInboundSinkId`)) {
          this.ringer.setSinkId(settings.get(`ringInboundSinkId`))
        }
        if (count === 1) {
          this.ringer.play();
        } else {
          this.ringer.currentTime = 0;
          this.ringer.pause();
        }
      },

      user(user) {
        if (!user) {
          this.logout();
        } else {
          this.showCallbackTab = user.accessToResource('callback/members', 'r');
        }
      }
    },

    methods: {
      afterInit(err, credentials) {
        this.initialize = true;

        if (err) {
          return this.$router.push("/login")
        }
        this.$store.commit("AUTH", credentials);
      },

      getStatusText(st) {
        return this.$t(`user.${st.id}`)
      },

      openHotLink(href = '') {
        href = href.replace(/\${KEY}|\${TOKEN}/g, (str) => {
          switch (str) {
            case '${KEY}':
              return this.user._key;
            case '${TOKEN}':
              return this.user._token;
          }
        });

        if (typeof WEBITEL_LINK === 'function') {
          WEBITEL_LINK({href}, null, true)
        } else {
          window.open(href, '_blank')
        }
      },

      showSpinner(val) {
        this.viewSpinner = !!val;
      },

      onMakeCall() {
        if (this.search) {
          this.user.makeCall(this.search);
          this.search = '';
          this.$store.commit("CHANGE_SEARCH", this.search);
        }
      },

      onShowCallDialog() {
        if (this.countCalls === 1 && !this.search) {
          this.$router.push(`/call/${this.calls[0].uuid}`);
        } else if (this.countCalls > 0) {
          this.showChangeCallDialog = true;
        } else if (this.search) {
          this.onMakeCall()
        }
      },

      getStateColor(user = {}) {
        if (!user)
          return;
        return getStateColor(user.state, user.status)
      },

      showChangeStatusDialog() {
        this.viewStatusDialog = true;
        if (this.user.loggedCC) {
          this.dialogTag = '';
          this.dialogStatus = this.listUserStatus[1].text;
          if (this.user.status === 'ONBREAK') {
            this.dialogState = 'ONBREAK';
          } else {
            this.dialogState = 'Waiting';
          }

        } else if (this.user.state === 'ONHOOK' && this.user.status === 'NONE') {
          this.dialogTag = '';
          this.dialogStatus = this.listUserStatus[0].text;
        } else {
          this.dialogStatus = this.listUserStatus[2].text;
          this.dialogState = this.user.status;
          this.dialogTag = this.user.description;
        }
      },

      logout() {
        this.$store.commit("LOGOUT");
        this.$router.push("/login");
        this.$localStorage.set('token', '');
        this.$localStorage.set('xkey', '');
      },

      changeStatus(status, state, tag) {
        switch (status) {
          case "Ready":
            this.user.logoutCallCenter();
            this.user.setReady();
            break;
          case "Busy":
            this.user.logoutCallCenter();
            this.user.setBusy(state, tag);
            break;
          case "Call Center":
            this.user.loginCC();
            if (state === 'Waiting') {
              this.user.setReady();
            } else {
              this.user.setBusy("ONBREAK", tag);
            }
            break;
        }
        this.viewStatusDialog = false;
      },

      listUserState(status) {
        switch (status) {
          case "Call Center":
            return this.listUserStatus[1].state;
          case "Busy":
            return this.listUserStatus[2].state;
        }
        return [];
      },

      setReady() {
        this.user.setReady();
      },

      setBreak() {
        this.user.setOnBreak();
      },

      onSearch() {
        this.$store.commit("CHANGE_SEARCH", this.search);
      },

      minimize() {
        if (typeof WEBITEL_MINIMALIZE === 'function') {
          WEBITEL_MINIMALIZE()
        }
        //todo
      },

      hide() {
        if (typeof WEBITEL_HIDE === 'function') {
          WEBITEL_HIDE()
        }
        //todo
      }
    }
  }
</script>

<style scoped>
  .in-queue {
    display: inline-block;
    width: 20px;
    height: 17px;
    min-width: 16px;
    min-height: 16px;
    -webkit-mask: url(/static/img/in_queue.svg) no-repeat 100% 100%;
    mask: url(/static/img/in_queue.svg) no-repeat 100% 100%;
    -webkit-mask-size: cover;
    mask-size: cover;
    background-color: #767676;
  }

  .theme--dark .in-queue {
    background-color: hsla(0,0%,100%,.7);
  }

</style>

<style>
  html {
    overflow-y: auto;
  }

  .input-or-search-number.v-text-field.v-text-field--solo .v-input__control {
    min-height: 42px;
  }

  .drag-zone {
    -webkit-app-region: drag;
    cursor: pointer;
    width: 100%;
  }

  .badge-call-count .v-badge__badge {
    top: -22px;
  }

  .system-bar-icons {
    display: contents;
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently*/
  }
  .system-bar-icons > * {
    margin-left: 5px;
    width: 23px;
  }

  .app-content {
    max-height: 100vh;
  }

  .app-view {
    height: 100%;
    overflow-y: auto;
    backface-visibility: hidden;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-thumb:vertical {
    margin: 5px;
    background-color: #999;
    -webkit-border-radius: 5px;
  }

  ::-webkit-scrollbar-button:start:decrement,
  ::-webkit-scrollbar-button:end:increment {
    height: 5px;
    display: block;
  }

  .flashing .badge__badge.error {
    -webkit-animation: flash linear 1s infinite;
    animation: flash linear 1s infinite;
  }
  @-webkit-keyframes flash {
    0% { opacity: 1; }
    50% { opacity: .1; }
    100% { opacity: 1; }
  }
  @keyframes flash {
    0% { opacity: 1; }
    50% { opacity: .1; }
    100% { opacity: 1; }
  }

  .app-spinner {
    position: fixed;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    background-color: #1c1c1c;
  }

  .icon-web-rtc {
    width: 16px;
    height: 16px;
    background-size: contain;
    margin-left: 9px;
    background-image: url("./assets/webrtc.svg");
  }

  .call-info-row {
    padding: 3px;
    word-break: break-all;
  }

  .call-info-row .call-info-item * {
    width: 100%;
  }

  .call-info-row .call-info-item p {
    margin-bottom: 0px;
    line-height: 1.1;
  }
</style>
