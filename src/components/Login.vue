<template>
  <div>
    <v-container fluid fill-height>

      <v-system-bar app class="lighten-1" height="30px">
      <span class="drag-zone" style="height: 100%;">

      </span>
        <v-spacer></v-spacer>
        <div class="system-bar-icons">
          <a  @click="minimize">
            <v-icon>remove</v-icon>
          </a>
          <a  @click="hide">
            <v-icon>close</v-icon>
          </a>
        </div>
      </v-system-bar>

      <v-layout align-center justify-center>
        <v-flex xs12 sm8 md4>
          <v-card >
            <v-card-title class="display-2 " style="padding-right: 75px;">
              <svg id="logo-img" width="100%" height="100%" viewBox="0 0 588 144"
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M379.666 0C376.112 0 373.231 2.86543 373.231 6.4V14.4C373.231 17.9346 376.112 20.8 379.666 20.8H387.71C391.264 20.8 394.145 17.9346 394.145 14.4V6.4C394.145 2.86543 391.264 0 387.71 0H379.666Z" />
                <path d="M567.086 6.4C567.086 2.86538 569.967 0 573.521 0H581.565C585.119 0 588 2.86538 588 6.4V137.6C588 141.135 585.119 144 581.565 144H573.521C569.967 144 567.086 141.135 567.086 137.6V6.4Z" />
                <path d="M373.231 48C373.231 44.4654 376.112 41.6 379.666 41.6H387.71C391.264 41.6 394.145 44.4654 394.145 48V137.6C394.145 141.135 391.264 144 387.71 144H379.666C376.112 144 373.231 141.135 373.231 137.6V48Z" />
                <path d="M422.298 0C418.744 0 415.863 2.86543 415.863 6.4V22.4C415.863 23.7255 414.783 24.8 413.45 24.8H408.624C405.07 24.8 402.189 27.6654 402.189 31.2V35.2C402.189 38.7346 405.07 41.6 408.624 41.6H413.45C414.783 41.6 415.863 42.6745 415.863 44V137.6C415.863 141.135 418.744 144 422.298 144H430.342C433.896 144 436.777 141.135 436.777 137.6V44C436.777 42.6745 437.857 41.6 439.19 41.6H456.082C459.636 41.6 462.517 38.7346 462.517 35.2V31.2C462.517 27.6654 459.636 24.8 456.082 24.8H439.19C437.857 24.8 436.777 23.7255 436.777 22.4V6.4C436.777 2.86543 433.896 0 430.342 0H422.298Z" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M235.185 130.725C237.717 128.466 237.574 124.589 235.169 122.197L229.653 116.711C226.958 114.03 222.541 114.315 219.533 116.643C214.22 120.753 207.542 123.2 200.29 123.2C187.839 123.2 177.083 115.986 172.015 105.532C171.292 104.04 172.451 102.4 174.117 102.4H246.14C247.172 102.4 248.149 102.158 249.014 101.728C250.437 101.194 251.603 100.07 252.089 98.4436C252.402 97.6906 252.575 96.8654 252.575 96V88C252.575 87.3547 252.479 86.7316 252.3 86.1441C252.249 85.9764 252.208 85.8047 252.186 85.6307C249.029 59.9164 226.998 40 200.29 40C171.414 40 148.005 63.2813 148.005 92C148.005 120.719 171.414 144 200.29 144C213.699 144 225.93 138.979 235.185 130.725ZM174.117 81.6C172.451 81.6 171.292 79.9601 172.015 78.4681C177.083 68.0138 187.839 60.8 200.29 60.8C212.741 60.8 223.497 68.0137 228.565 78.468C229.288 79.9602 228.129 81.6 226.463 81.6H174.117Z" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M541.636 122.197C544.042 124.589 544.185 128.466 541.652 130.725C532.398 138.979 520.167 144 506.758 144C477.882 144 454.473 120.719 454.473 92C454.473 63.2813 477.882 40 506.758 40C533.466 40 555.496 59.9164 558.654 85.6307C558.675 85.8047 558.717 85.9764 558.768 86.1441C558.946 86.7316 559.042 87.3547 559.042 88V96C559.042 96.8654 558.87 97.6906 558.557 98.4436C558.071 100.07 556.905 101.194 555.481 101.728C554.616 102.158 553.64 102.4 552.607 102.4H480.585C478.919 102.4 477.76 104.04 478.483 105.532C483.551 115.986 494.307 123.2 506.758 123.2C514.01 123.2 520.687 120.753 526.001 116.643C529.009 114.315 533.426 114.03 536.121 116.711L541.636 122.197ZM478.483 78.4681C477.76 79.9601 478.919 81.6 480.585 81.6H532.931C534.597 81.6 535.756 79.9602 535.032 78.468C529.965 68.0137 519.208 60.8 506.758 60.8C494.307 60.8 483.551 68.0138 478.483 78.4681Z" />
                <path d="M4.77569 4.28861C1.3396 5.20346 -0.699717 8.71283 0.221114 12.1269L34.3971 138.856C35.1324 141.582 37.5322 143.424 40.2189 143.589V143.6H40.4673C40.5655 143.602 40.6641 143.602 40.7628 143.6H47.7731C47.8718 143.602 47.9704 143.602 48.0687 143.6H48.2626V143.593C50.9711 143.448 53.3985 141.601 54.1386 138.857L78.0247 50.2839L101.911 138.856C102.651 141.601 105.078 143.448 107.787 143.593V143.6H107.981C108.079 143.602 108.177 143.602 108.276 143.6H115.286C115.385 143.602 115.484 143.602 115.582 143.6H115.83V143.589C118.517 143.424 120.917 141.583 121.652 138.857L155.828 12.1271C156.749 8.71283 154.71 5.20346 151.274 4.28861L143.496 2.2181C140.06 1.30326 136.528 3.32943 135.607 6.7435L114.112 86.4506C113.473 88.8216 110.09 88.8216 109.451 86.4506L87.9554 6.7435C87.2123 3.98803 84.7682 2.13666 82.0465 2.0058V1.99994H81.8766C81.7842 1.99799 81.6915 1.99799 81.5986 1.99994H74.4507L74.3421 1.99857C74.2854 1.99838 74.229 1.99877 74.1726 1.99994H74.0027V2.0058C71.281 2.13666 68.837 3.98803 68.0939 6.7435L46.5986 86.4506C45.9592 88.8216 42.5765 88.8216 41.9371 86.4506L20.4419 6.7435C19.5212 3.32943 15.9892 1.30326 12.5531 2.2181L4.77569 4.28861Z" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M260.618 6.4C260.618 2.86538 263.499 0 267.053 0H275.097C278.651 0 281.532 2.86538 281.532 6.4V45.5919C281.532 47.5704 283.829 48.7293 285.523 47.6918C293.486 42.8139 302.864 40 312.903 40C341.779 40 365.187 63.2813 365.187 92C365.187 120.719 341.779 144 312.903 144C302.573 144 292.943 141.021 284.834 135.879C283.439 134.994 281.532 135.954 281.532 137.6C281.532 141.135 278.651 144 275.097 144H267.053C263.499 144 260.618 141.135 260.618 137.6V6.4ZM312.903 123.2C295.577 123.2 281.532 109.231 281.532 92C281.532 74.7688 295.577 60.8 312.903 60.8C330.228 60.8 344.274 74.7688 344.274 92C344.274 109.231 330.228 123.2 312.903 123.2Z" />
              </svg>
            </v-card-title>
            <v-card-text>
              <v-form @keyup.native.enter="submit" v-model="valid" ref="form" >
                <v-text-field v-show="!useDomainAuth" :rules="[loginRules]" v-model="login" required prepend-icon="person" name="login" :label="$t('login.account')" type="text"></v-text-field>
                <v-text-field v-show="oauthName && useDomainAuth" :disabled="true" v-model="oauthName"  prepend-icon="person" :label="$t('login.oauthName')" type="text"></v-text-field>
                <v-text-field v-show="!useDomainAuth" v-model="password" prepend-icon="lock" name="password" :label="$t('login.password')" id="password" type="password"></v-text-field>

                <v-layout row fluid>
                  <v-switch v-model="useDomainAuth" v-show="false" :label="$t('login.useOauth')" ></v-switch>
                  <v-spacer></v-spacer>
                  <a @click="advancedSettings = !advancedSettings" depressed small color="transparent" right>
                    <v-icon v-show="advancedSettings">expand_more</v-icon>
                    <v-icon v-show="!advancedSettings">expand_less</v-icon>
                  </a>
                </v-layout>

                <v-layout v-show="advancedSettings" column>

                  <v-select
                    :items="languages"
                    :label="$t('login.language')"
                    item-value="id"
                    item-text="name"
                    v-model="$i18n.locale"
                    v-on:change="changeLanguage($i18n.locale)"
                    cache-items
                    prepend-icon="language"
                  ></v-select>

                  <v-text-field v-model="server" :rules="serverRules" name="server" :label="$t('login.server')" id="server" type="text"></v-text-field>
                  <v-text-field :rules="[domainServerRules]" v-show="useDomainAuth" v-model="domainOAuthServer" name="domainOAuthServer" :label="$t('login.oauthServer')" type="text"></v-text-field>
                  <v-text-field :rules="[domainNameRules]" v-show="useDomainAuth" v-model="domainOAuthDomainName" name="domainOAuthDomainName" :label="$t('login.oauthDomain')" type="text"></v-text-field>
                  <v-text-field :rules="[domainResourceRules]" v-show="useDomainAuth" v-model="domainOAuthResource" name="domainOAuthResource" :label="$t('login.oauthResource')" type="text"></v-text-field>
                  <v-text-field :rules="[domainClientIdRules]" v-show="useDomainAuth" v-model="domainOAuthClientId" name="domainOAuthClientId" :label="$t('login.oauthClientId')" type="text"></v-text-field>

                </v-layout>

              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                block outline large color="success"
                :loading="loading"
                @click="submit"
                :disabled="loading || !valid"
              >
                {{$t('login.authBtn')}}
              </v-btn>
            </v-card-actions>


            <v-card-actions v-if="version" class="version">
              <p class="caption">{{$t('app.version', {version: version})}}</p>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>

      <v-dialog v-model="errorDialog" max-width="290">
        <v-card>
          <v-card-title class="headline">Error</v-card-title>
          <v-card-text>{{errorMsg}}</v-card-text>
          <v-card-actions>
            <v-btn color="green darken-1" flat="flat" @click.native="closeError">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-container>
  </div>
</template>

<script>
  import Vue from 'vue'
  import settings from '../services/settings'
  import {parseServerUri} from '../services/helper'

  //FIXME
  function getLanguages(obj) {
    const result = [];
    for (let id in obj) {
      result.push({
        name: obj[id].name || id,
        id
      })
    }
    return result;
  }

  export default {
    name: "Login",
    data() {
      return {
        login: null,
        password: null,
        server: null,
        oauthName: null,
        useDomainAuth: null,
        domainOAuthServer: null,
        domainOAuthResource: null,
        domainOAuthClientId: null,
        domainOAuthDomainName: null,
        languages: getLanguages(this.$i18n.messages),
        loading: false,
        errorDialog: null,
        errorMsg: null,
        valid: true,
        advancedSettings: false,
        serverRules: [
          v => !!v || 'Server url is required'
        ]
      }
    },
    mounted() {
      if (this.$store.getters.user()) {
         return this.$router.push("/")
      }

      this.oauthName = this.$localStorage.get('oauthName');


      //FIXME server not implement
      this.useDomainAuth = false;//, settings.get('useDomainAuth') === true && !!this.oauthName;
      this.server = settings.get('server') || null;
      this.domainOAuthServer = settings.get('domainOAuthServer') || null;
      this.domainOAuthResource = settings.get('domainOAuthResource') || null;
      this.domainOAuthClientId = settings.get('domainOAuthClientId') || null;
      this.domainOAuthDomainName = settings.get('domainOAuthDomainName') || null;


      if (this.$route.query.token && this.server) {
        const serverUri = parseServerUri(this.server);
        this.validateToken(serverUri, this.$route.query.token)

      }

      if (this.maybeAutoLogin()) {
        return this.doLogin()
      }

      this.advancedSettings = !this.$refs.form.validate();
    },
    methods: {
      changeLanguage(val) {
        localStorage.setItem("language", val);
      },
      maybeAutoLogin() {
        return !this.$store.getters.lastLogged() && this.useDomainAuth && !!this.domainOAuthServer && !!this.server
          && !!this.domainOAuthResource &&  !!this.domainOAuthClientId && !!this.domainOAuthDomainName;
      },
      loginRules() {
        if (this.useDomainAuth)
          return true;
        return !!this.login || this.$t('login.errRequiredAccount')
      },
      domainServerRules() {
        if (!this.useDomainAuth)
          return true;
        return !!this.domainOAuthServer || this.$t('login.errRequiredOauthServer')
      },
      domainNameRules() {
        if (!this.useDomainAuth)
          return true;
        return !!this.domainOAuthDomainName || this.$t('login.errRequiredOauthDomain')
      },
      domainResourceRules() {
        if (!this.useDomainAuth)
          return true;
        return !!this.domainOAuthResource || this.$t('login.errRequiredOauthResource')
      },
      domainClientIdRules() {
        if (!this.useDomainAuth)
          return true;
        return !!this.domainOAuthClientId || this.$t('login.errRequiredOauthClientId')
      },

      setError(msg) {
        this.errorDialog = true;
        this.errorMsg = msg;
      },
      closeError() {
        this.errorDialog = null;
        this.errorMsg = null;
      },

      saveSettings() {
        settings.set('useDomainAuth', this.useDomainAuth || false);
        settings.set('server', this.server || "");
        settings.set('domainOAuthServer', this.domainOAuthServer || "");
        settings.set('domainOAuthResource', this.domainOAuthResource || "");
        settings.set('domainOAuthClientId', this.domainOAuthClientId || "");
        settings.set('domainOAuthDomainName', this.domainOAuthDomainName || "");
      },

      loginOAuth(serverUri, cb) {
        const url = `${this.domainOAuthServer}?response_type=code&resource=${this.domainOAuthResource}&client_id=${this.domainOAuthClientId}&redirect_uri=${serverUri}/login/${this.domainOAuthDomainName}`;

        this.$http.get(url).then(response => {
          if (!response.body.token) {
            return cb(new Error(`Server bad response!`))
          }
          return cb(null, response)
        }, (r) => {
          if (r.status > 0) {
            return cb(new Error(`Server response: ${r.statusText} ${(r.body && r.body.info || '').trim()}`))
          } else {
            return cb(new Error(`Bad server parameters or server shutdown!`))
          }
        });
      },

      loginDefault(serverUri, cb) {
        // fixme
        Vue.http.headers.common['X-Webitel-Access'] = undefined;
        this.$http.post(`${serverUri}/login`, {
          username: this.login,
          password: this.password
        }).then(response => {

          return cb(null, response)
        }, (r) => {
          if (r.status > 0) {
            return cb(new Error(`Server response: ${r.statusText} ${(r.body && r.body.info || '').trim()}`))
          } else {
            return cb(new Error(`Bad server parameters or server shutdown!`))
          }
        });
      },

      validateToken(serverUri, token) {
        Vue.http.headers.common['X-Webitel-Access'] = token;
        this.$http.get(`${serverUri}/userinfo`)
          .then(res => {
            res.body.token = token;
            this.$localStorage.set('token', token);
            res.body.server = serverUri;
            //TODO check oauth
            // response.body.id = response.body.username || this.login;

            this.$store.commit("AUTH", res.body);
            this.$router.push('/');
          })
          .catch(e => {
            this.setError(e.message || e.statusText);
          });
      },

      doLogin() {
        this.loading = true;
        const serverUri = parseServerUri(this.server);

        this.saveSettings();

        const callback = (err, response) => {
          this.loading = false;
          if (err)
            return this.setError(err.message);

          this.validateToken(serverUri, response.body.access_token);

        };

        if (this.useDomainAuth) {
          this.loginOAuth(serverUri, callback);
        } else {
          this.loginDefault(serverUri, callback);
        }
      },

      submit() {
        if (this.$refs.form.validate()) {
          this.doLogin();
        }
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
    },
    computed: {
      user() {
        return this.$store.getters.user()
      },
      version() {
        return this.$store.getters['version/current']
      }
    },
    watch: {
      user(val) {
        if (val) {
          this.$router.push("/")
        }
      },
      useDomainAuth() {
        this.advancedSettings = !this.$refs.form.validate()
      }
    }
  }
</script>

<style scoped>
  svg#logo-img path {
    fill: #0A1334;
  }

  #app.theme--dark svg#logo-img path {
    fill: #F2F2F2;
  }

  .version {
    padding: 0 10px 0 0px;
  }
  .version > p {
    width: 100%;
    text-align: right;
  }
</style>
