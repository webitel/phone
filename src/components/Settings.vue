<template>
  <v-layout row >
    <v-flex xs12 sm6 offset-sm3 >
      <v-card>
        <v-card-text>
          <v-form>

            <v-btn small block @click="logout()">
              {{$t('settings.logout')}}
            </v-btn>

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

            <v-select
              v-model="theme"
              :items="themes"
              :label="$t('settings.theme')"
              prepend-icon="settings_brightness"
            ></v-select>

            <v-checkbox
              v-if="false"
              :label="$t('settings.usePostProcess')"
              v-model="usePostProcess"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.ringInboundCall')"
              v-model="ringInboundCall"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.notifyNewCall')"
              v-model="notifyNewCall"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.notifyMissedCall')"
              v-model="notifyMissedCall"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.disableAutoUpdate')"
              v-model="disableAutoUpdate"
            ></v-checkbox>


            <v-select
              v-model="sipClient"
              :items="sipClients"
              item-text="name"
              item-value="id"
              :label="$t('settings.sipClient')"
              prepend-icon="dialer_sip"
            ></v-select>

            <v-select
              v-if="false"
              v-show="sipClient"
              v-model="webAutoAnswer"
              :items="webAutoAnswerValues"
              :label="$t('settings.webAutoAnswer')"
            ></v-select>

            <v-select
              v-if="false"
              :items="audioInDevices"
              v-model="audioInDevice"
              :label="$t('settings.audioInDevice')"
              :hint="$t('settings.audioInDevice')"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              prepend-icon="mic_none"
            ></v-select>


            <v-select
              v-if="false"
              :items="audioOutDevices"
              :label="$t('settings.audioOutDevices')"
              :hint="$t('settings.audioOutDevices')"
              v-model="audioOutDevice"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              prepend-icon="headset"
            ></v-select>

            <v-select
              v-if="false"
              :items="audioOutDevices"
              :hint="$t('settings.ringInboundSinkId')"
              :label="$t('settings.ringInboundSinkId')"
              v-model="ringInboundSinkId"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              prepend-icon="hearing"
            ></v-select>

            <v-btn v-if="false" class="btn-refresh-devices fab--hot-fix" fab small @click="refreshDevices(true)">
              <v-icon>refresh</v-icon>
              {{$t('settings.refreshDevices')}}
            </v-btn>

          </v-form>
        </v-card-text>
      </v-card>
    </v-flex>

  </v-layout>
</template>

<script>
    import settings from '../services/settings'

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
      name: "Settings",
      data () {
        return {
          sipClients: [
            {
              id: "",
              name: "Disabled"
            },
            {
              id: "sip",
              name: "SIP"
            },
            {
              id: "webrtc",
              name: "WebRTC"
            }
          ],
          languages: getLanguages(this.$i18n.messages),
          sipClient: settings.get("sipClient"),
          webAutoAnswer: settings.get("webAutoAnswer"),

          usePostProcess: settings.get("usePostProcess"),
          notifyNewCall: settings.get("notifyNewCall"),
          disableAutoUpdate: settings.get("disableAutoUpdate"),
          notifyMissedCall: settings.get("notifyMissedCall"),
          audioInDevice: settings.get("audioInDevice"),
          audioOutDevice: settings.get("audioOutDevice"),
          ringInboundCall: settings.get("ringInboundCall"),
          ringInboundSinkId: settings.get("ringInboundSinkId"),
          theme: settings.get("theme"),
          loading: false,
          themes: ["dark", "lite"],
          webAutoAnswerValues: ['Disabled', 'Enabled', 'Variable'],
          audioInDevices: [],
          audioOutDevices: []
        }
      },

      created() {
        this.refreshDevices();
      },

      computed: {
        user() {
          return this.$store.getters.user()
        }
      },

      methods: {
        logout() {
          this.$store.dispatch("logout");
          this.$router.push("/login");
          this.$localStorage.set('token', '');
        },
        refreshDevices(reset) {
          if (this.user) {
            this.loading = true;
            this.user.getDevices(reset).then(data => {
              this.loading = false;
              this.audioInDevices = data.audioInDevices;
              this.audioOutDevices = data.audioOutDevices;
            })
          }
        },
        changeLanguage(val) {
          localStorage.setItem("language", val);
        },
      },

      watch: {
        user(user) {
          if (user) {
            this.refreshDevices()
          }
        },
        theme(val) {
          settings.set("theme", val);
          this.$store.commit("SET_THEME", val);
        },
        ringInboundCall(val) {
          settings.set("ringInboundCall", val);
        },
        //TODO
        sipClient(val) {
          settings.set("sipClient", val);
          this.user.registerSipDevice(val);
        },
        webAutoAnswer(val) {
          settings.set("webAutoAnswer", val);
        },
        usePostProcess: (val) => {
          settings.set("usePostProcess", val)
        },
        notifyNewCall: (val) => {
          settings.set("notifyNewCall", val)
        },
        disableAutoUpdate: (val) => {
          settings.set("disableAutoUpdate", val)
        },
        notifyMissedCall: (val) => {
          settings.set("notifyMissedCall", val)
        },
        audioInDevice(val) {
          settings.set("audioInDevice", val);
          if (this.user) {
            this.user.setWebPhoneMicrophone(val);
          }
        },

        ringInboundSinkId(val) {
          settings.set("ringInboundSinkId", val);
          //TODO
        },
        audioOutDevice(val) {
          settings.set("audioOutDevice", val);
          if (this.user) {
            this.user.setWebPhoneSpeak(val);
          }
        },
      }
    }
</script>

<style scoped>
  .btn-refresh-devices {
    margin-left: 0;
  }
</style>
