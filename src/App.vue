<template>
  <v-app :dark="theme === 'dark'">
    <v-system-bar app height="30px" v-if="showMenu">
      <div>
        <v-menu bottom left>
          <v-btn small icon slot="activator" >
            <v-icon :color="getStateColor(user)" >account_circle</v-icon>
          </v-btn>
          <v-list>
            <v-list-tile >
              <v-list-tile-title @click="setReady">Ready</v-list-tile-title>
            </v-list-tile>
            <v-list-tile >
              <v-list-tile-title  @click="setBreak">On Break</v-list-tile-title>
            </v-list-tile>
            <v-list-tile >
              <v-list-tile-title @click="showChangeStatusDialog()">...</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>

      <span v-show="user">
        {{user.name}}
      </span>

      <v-spacer></v-spacer>

      <!--<v-icon style="margin-left: 5px">link</v-icon>-->
      <div v-show="hotLinks.length > 0">
        <v-menu bottom left>
          <v-btn small icon slot="activator" >
            <v-icon>link</v-icon>
          </v-btn>
          <v-list>
            <v-list-tile v-for="link in hotLinks">
              <v-list-tile-title><a @click="openHotLink(link.src)" target="_blank">{{link.name}}</a></v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>

      <v-icon v-show="user && user.loggedCC">contact_mail</v-icon>
      <v-icon v-show="user && user.webPhoneRegister" class="icon-web-rtc"></v-icon>

    </v-system-bar>

    <v-toolbar app tabs v-if="showMenu" :ripple ="false" >
      <v-text-field
        v-model="search"
        @keyup.enter.native="onMakeCall"
        @input="throttledSearch"
        prepend-icon="search"
        label="Search"
        solo-inverted
        class="mx-2"
        flat
      ></v-text-field>

      <v-menu bottom left :open-on-click="false"  v-model="showChangeCallDialog">
        <v-btn icon slot="activator" @click="onShowCallDialog">
          <v-badge v-bind:class="countInboundNoAnswerCall > 0 ? 'flashing' : ''" v-model="showBadgeCall" left color="error" overlap>
            <span slot="badge">{{countCalls}}</span>
            <v-icon
              large
              :color="showBadgeCall ? '' : 'success'"
            >
              call
            </v-icon>
          </v-badge>
        </v-btn>
        <v-list>
          <v-list-tile v-for="(item, i) in calls" :key="i" :href=" '#/call/' + item.uuid">
            <v-list-tile-title>{{ item.getName() }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>

    </v-toolbar>

    <v-content>
      <router-view ></router-view>
    </v-content>

    <v-container fluid class="app-spinner" fill-height v-show="!initialize || viewSpinner">
      <v-layout align-center justify-center>
        <v-progress-circular indeterminate :size="120" :width="7" color="warning">Loading</v-progress-circular>
      </v-layout>
    </v-container>

    <v-dialog v-model="viewStatusDialog" max-width="390">
      <v-card>
        <v-card-title class="headline">Change status</v-card-title>
        <v-card-text>
          <v-form >
            <v-select
              :items="listUserStatus"
              label="Status"
              v-model="dialogStatus"
              class="input-group--focused"
              item-value="text"
              required
            ></v-select>

            <v-select
              v-show="dialogStatus !== 'Ready' && dialogStatus !== 'Logout'"
              :required="dialogStatus !== 'Ready' && dialogStatus !== 'Logout'"
              :items="listUserState(dialogStatus)"
              v-model="dialogState"
              item-value="code"
              item-text="text"
              label="State"
            ></v-select>

            <v-text-field
              v-show="dialogStatus === 'Busy'"
              v-model="dialogTag"
              name="Tag"
              label="Tag"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat="flat" @click.native="viewStatusDialog = false">Close</v-btn>
          <v-btn color="green darken-1" flat="flat" :disabled="!dialogStatusValid" @click="changeStatus(dialogStatus, dialogState, dialogTag)">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-bottom-nav
      app
      :ripple ="false"
      fixed
      :value="showMenu"
      :active.sync="currentLinkIdx"
    >
      <v-btn :ripple="false" router-link to="/">
        <span>History</span>
        <v-icon>contact_phone</v-icon>
      </v-btn>

      <v-btn :ripple="false" router-link to="/users">
        <span>Users</span>
        <v-icon>people</v-icon>
      </v-btn>

      <v-btn :ripple="false" router-link to="/settings">
        <span>Settings</span>
        <v-icon>settings</v-icon>
      </v-btn>

    </v-bottom-nav>
  </v-app>
</template>

<script>
  import Vue from 'vue'
  import throttle from './services/throttle'
  import settings from './services/settings'
  import {getStateColor, parseServerUri} from './services/helper'

  const TABS = [
    {
      name: "History",
      path: "#/"
    },
    {
      name: "Users",
      path: "#/users"
    }, {
      name: "Settings",
      path: "#/settings"
    },
  ];

  function getTabByName(name) {
    for (let idx = 0; idx < TABS.length; idx++) {
      if (TABS[idx].name === name) {
        return idx
      }
    }
    return -1
  }

  function init(app, cb) {
    const server = settings.get("server");
    const token = app.$localStorage.get('token');
    const xkey = app.$localStorage.get('xkey');
    if (!server || !token || !xkey) {
      return cb(new Error("No session"))
    }

    Vue.http.headers.common['x-key'] = xkey;
    Vue.http.headers.common['x-access-token'] = token;

    Vue.http.get(`${parseServerUri(server)}/api/v2/whoami`).then(
      response => {
        response.body.server = parseServerUri(server);
        response.body.token = token;
        response.body.key = xkey;
        return cb(null, response.body);
      },
      response => {
        return cb(new Error("Unauthorized"))
      }
    )
  }



  export default {
    name: 'App',
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

        dialogStatusValid: true,
        dialogStatus: null,
        dialogState: null,
        dialogTag: null,
        ringer: null,

        beforeReconnectingLink: null,

        listUserStatus: [
          {
            text: 'Ready'
          },
          {
            text: 'Call Center',
            state: [
              {
                text: "Waiting",
                code: "Waiting"
              },
              {
                text: "On Break",
                code: "ONBREAK"
              }
            ]
          },
          {
            text: 'Busy',
            state: [
              {
                text: "Do not disturb",
                code: "DND"
              },
              {
                text: "On Break",
                code: "ONBREAK"
              },
              {
                text: "Call forward",
                code: "CALLFORWARD"
              }
            ]
          },
          {
            text: "Logout"
          }
        ]
      }
    },

    created() {

      this.ringer = new Audio('/static/sounds/iphone.mp3');
      this.ringer.loop = true;

      this.$router.beforeEach((to, from, next) => {
        if (!this.initialize) {
          return false;
        }

        if (!this.$store.state.user && to.name !== 'Login') {
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

      init(this, (err, credentials) => {
        this.initialize = true;

        if (err) {
          return this.$router.push("/login")
        }
        this.$store.commit("AUTH", credentials);
      })
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
        return !!this.$store.state.user && !this.reconnecting
      },
      user() {
        return this.$store.state.user
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
        if (this.$store.state.user) {
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
        }
      }
    },

    methods: {

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
        if (this.$store.state.user.loggedCC) {
          this.dialogTag = '';
          this.dialogStatus = this.listUserStatus[1].text;
          if (this.$store.state.user.status === 'ONBREAK') {
            this.dialogState = 'ONBREAK';
          } else {
            this.dialogState = 'Waiting';
          }

        } else if (this.$store.state.user.state === 'ONHOOK' && this.$store.state.user.status === 'NONE') {
          this.dialogTag = '';
          this.dialogStatus = this.listUserStatus[0].text;
        } else {
          this.dialogStatus = this.listUserStatus[2].text;
          this.dialogState = this.$store.state.user.status;
          this.dialogTag = this.$store.state.user.description;
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
          case "Logout":
            this.logout();
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
      }
    }
  }
</script>

<style>
  html {
    overflow-y: auto;
  }

  ::-webkit-scrollbar {
    width: 5px;
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
    z-index: 5;
    background-color: #1c1c1c;
  }

  .icon-web-rtc {
    width: 16px;
    height: 16px;
    background-size: contain;
    margin-left: 9px;
    background-image: url("./assets/webrtc.svg");
  }

  .in-call-center-img {
    content:url("./assets/in_call_center.svg");
  }

  .inbound-error-call-img {
    content:url("./assets/inbound_error.svg")
  }

  .inbound-ok-call-img {
    content:url("./assets/inbound_ok.svg")
  }

  .inbound-queue-call-img {
    content:url("./assets/inbound_queue.svg")
  }

  .missed-call-img {
    content:url("./assets/missed.svg")
  }

  .outbound-error-call-img {
    content:url("./assets/outbound_error.svg")
  }

  .outbound-ok-call-img {
    content:url("./assets/outbound_ok.svg")
  }

  .unknown-call-img {
    content:url("./assets/unknown.svg")
  }

  .internal-call-img {
    content:url("./assets/internal.svg")
  }

  .conference-call-img {
    content:url("./assets/conference.svg")
  }
</style>
