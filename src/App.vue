<template>
  <v-app :dark="theme === 'dark'" class="" >
    <v-system-bar  app height="30px" v-if="showMenu" class="win-sys-top" style="font-size: small" status>

      <v-layout row style="width: 100%; white-space: nowrap;" class="drag-zone">
        <v-flex xs6 v-if="user" style=" overflow: hidden; text-overflow: ellipsis;">
          <span v-if="sipDeviceId">
            [{{sipDeviceId}}]
          </span>
          {{user.name}}
        </v-flex>
        <v-flex xs6 style="text-align: end">
          <AgentChannels></AgentChannels>
          <v-icon v-if="sipReg === true">dialer_sip</v-icon>

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
        </v-flex>
      </v-layout>

      <v-spacer></v-spacer>

      <div class="system-bar-icons text-xs-center" style="min-width: 60px;">
        <a  @click="minimize">
          <v-icon>remove</v-icon>
        </a>
        <a  @click="hide">
          <v-icon>close</v-icon>
        </a>
      </div>


    </v-system-bar>

    <v-toolbar app v-if="showMenu" height="48" dense>

      <UserStatus></UserStatus>

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

    <Upgrade></Upgrade>

    <v-navigation-drawer
      v-if="!mini && false"
      v-model="drawer"
      app
    >
<!--      <v-list-item >-->
<!--        <v-list-item-content>-->
<!--          <v-list-item-title class="title">-->
<!--            Application-->
<!--          </v-list-item-title>-->
<!--          <v-list-item-subtitle>-->
<!--            subtext-->
<!--          </v-list-item-subtitle>-->
<!--        </v-list-item-content>-->
<!--      </v-list-item>-->

      <v-list dense nav>

        <v-list-item
          to="/"
          link
        >
          <v-list-item-icon>
            <v-icon>contact_phone</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{$t('toolbar.history')}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

<!--        <v-list-tile flat :ripple="false" to="/">-->
<!--          <v-tooltip top>-->
<!--            <v-icon-->
<!--              slot="activator"-->
<!--            >-->
<!--              contact_phone-->
<!--            </v-icon>-->
<!--            <span>{{$t('toolbar.history')}}</span>-->
<!--          </v-tooltip>-->
<!--        </v-list-tile>-->

<!--        <v-list-tile flat :ripple="false" router-link to="/users">-->
<!--          <v-tooltip top>-->
<!--            <v-icon-->
<!--              slot="activator"-->
<!--            >-->
<!--              people-->
<!--            </v-icon>-->
<!--            <span>{{$t('toolbar.users')}}</span>-->
<!--          </v-tooltip>-->
<!--        </v-list-tile>-->

<!--        <v-list-tile flat :ripple="false" router-link to="/settings">-->
<!--          <v-tooltip top>-->
<!--            <v-icon-->
<!--              slot="activator"-->
<!--            >-->
<!--              settings-->
<!--            </v-icon>-->
<!--            <span>{{$t('toolbar.settings')}}</span>-->
<!--          </v-tooltip>-->
<!--        </v-list-tile>-->
      </v-list>
    </v-navigation-drawer>

    <v-bottom-nav
      v-else=""
      app
      :ripple ="false"
      fixed
      :value="showMenu"
      :active.sync="currentLinkIdx"
      class="win-sys-bottom"
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
  import {parseServerUri} from './services/helper'
  import Spinner from './components/Spinner'
  import Upgrade from './components/Upgrade'
  import AuthenticationDialog from './components/AuthenticationDialog'
  import UserStatus from './components/UserStatus'
  import AgentChannels from './components/AgentChannels'

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
      AuthenticationDialog,
      UserStatus,
      AgentChannels,
    },
    data() {
      return {
        menu: false,
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
      }
    },

    beforeCreate() {
      const server = settings.get("server");
      const token = this.$localStorage.get('token') || this.$route.query.token;
      if (!server || !token) {
        setTimeout(() => {
          this.afterInit(new Error("No session"));
        }, 10);
        return;
      }

      Vue.http.headers.common['X-Webitel-Access'] = token;

      Vue.http.get(`${parseServerUri(server)}/userinfo`).then(
        response => {
          response.body.server = parseServerUri(server);
          response.body.token = token;
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

        if (!this.user && to.name !== 'Login' && to.name !== 'Reconnect') {
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
      mini() {
        switch (this.$vuetify.breakpoint.name) {
          case 'xs': return true
          case 'sm': return true
          case 'md': return true
          case 'lg': return false
          case 'xl': return false
        }
      },
      hotBusyTags() {
        const tags = settings.get('busyTags');
        if (tags && tags.length > 0) {
          return tags
        }

        return ["A"]
      },

      hotLinks() {
        const links = settings.get('hotLinks') || settings.get('hot_links');
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
      sipReg() {
        return this.$store.getters.sipReg()
      },
      sipDeviceId() {
        return this.$store.getters.deviceId()
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


      logout() {
        this.$store.dispatch("logout");
        this.$router.push("/login");
        this.$localStorage.set('token', '');
        this.$localStorage.set('xkey', '');
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
    font-weight: 500;
    font-size: 17px;
    font-style: normal;
    width: 23px;
  }

</style>

<style>
  html {
    overflow-y: hidden;
    background-color: transparent;
  }
  body {
    overflow-y: hidden;
    background-color: transparent;
  }

  .application {
    font-family: 'Montserrat Semi', monospace;;
  }

  .app-content .v-content__wrap {
    overflow-y: auto;
  }

  .theme--light.application {
    background: #f5f5f5;
  }
  .theme--light.v-bottom-nav {
    background-color: #f5f5f5;
  }

  .input-or-search-number.v-text-field.v-text-field--solo .v-input__control {
    min-height: 42px;
  }

  .drag-zone {
    -webkit-app-region: drag;
    cursor: pointer;
    width: 100%;
    min-height: 20px;

  }

  .badge-call-count .v-badge__badge {
    top: -22px;
  }

  .v-system-bar .user-name.v-btn {
    box-shadow: none;
    max-width: 150px;
  }

  .system-bar-icons {
    display: flex;
    align-items: center;
    align-content: center;
    text-align: right;
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
    /*overflow-y: auto;*/
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
    /*background-color: #1c1c1c;*/
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
