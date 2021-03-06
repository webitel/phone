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
            <v-card-title class="display-2 ">Webitel</v-card-title>
            <v-card-text>
              <v-form @keyup.native.enter="submit" v-model="valid" ref="form" >
                <v-text-field v-show="!useDomainAuth" :rules="[loginRules]" v-model="login" required prepend-icon="person" name="login" :label="$t('login.account')" type="text"></v-text-field>
                <v-text-field v-show="oauthName && useDomainAuth" :disabled="true" v-model="oauthName"  prepend-icon="person" :label="$t('login.oauthName')" type="text"></v-text-field>
                <v-text-field v-show="!useDomainAuth" v-model="password" prepend-icon="lock" name="password" :label="$t('login.password')" id="password" type="password"></v-text-field>

                <v-layout row fluid>
                  <v-switch v-model="useDomainAuth" v-show="oauthName" :label="$t('login.useOauth')" ></v-switch>
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
  import settings from '../services/settings'
  import {parseServerUri} from '../services/helper'

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

      this.useDomainAuth = settings.get('useDomainAuth') === true && !!this.oauthName;
      this.server = settings.get('server') || null;
      this.domainOAuthServer = settings.get('domainOAuthServer') || null;
      this.domainOAuthResource = settings.get('domainOAuthResource') || null;
      this.domainOAuthClientId = settings.get('domainOAuthClientId') || null;
      this.domainOAuthDomainName = settings.get('domainOAuthDomainName') || null;

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
        this.$http.post(`${serverUri}/login`, {
          username: this.login,
          password: this.password
        }).then(response => {
          settings.set('webrtcPassword', this.password);
          return cb(null, response)
        }, (r) => {
          if (r.status > 0) {
            return cb(new Error(`Server response: ${r.statusText} ${(r.body && r.body.info || '').trim()}`))
          } else {
            return cb(new Error(`Bad server parameters or server shutdown!`))
          }
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

          this.$localStorage.set('token', response.body.token);
          this.$localStorage.set('xkey', response.body.key);

          response.body.server = serverUri;
          //TODO check oauth
          response.body.id = response.body.username || this.login;

          this.$store.commit("AUTH", response.body);
          this.$router.push('/');
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
  .version {
    padding: 0 10px 0 0px;
  }
  .version > p {
    width: 100%;
    text-align: right;
  }
</style>
