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
              v-model="theme"
              :items="themes"
              :label="$t('settings.theme')"
              prepend-icon="settings_brightness"
            ></v-select>

            <v-checkbox
              :label="$t('settings.useWebPhone')"
              v-model="useWebPhone"
            ></v-checkbox>

            <v-select
              v-show="useWebPhone"
              v-model="webAutoAnswer"
              :items="webAutoAnswerValues"
              :label="$t('settings.webAutoAnswer')"
            ></v-select>

            <v-checkbox
              :label="$t('settings.iceServers')"
              v-model="iceServers"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.sipAutoAnswer')"
              v-model="sipAutoAnswer"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.autoLoginCallCenter')"
              v-model="autoLoginCallCenter"
            ></v-checkbox>

            <v-checkbox
              :label="$t('settings.agentOnDemand')"
              v-model="agentOnDemand"
            ></v-checkbox>

            <v-checkbox
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

            <v-btn class="btn-refresh-devices" fab small @click="refreshDevices(true)">
              <v-icon>refresh</v-icon>
            </v-btn>
            {{$t('settings.refreshDevices')}}

          </v-form>
        </v-card-text>
      </v-card>
    </v-flex>

  </v-layout>
</template>

<script>
    import settings from '../services/settings'

    export default {
      name: "Settings",
      data () {
        return {
          useWebPhone: settings.get("useWebPhone"),
          sipAutoAnswer: settings.get("sipAutoAnswer"),
          webAutoAnswer: settings.get("webAutoAnswer"),
          autoLoginCallCenter: settings.get("autoLoginCallCenter"),
          agentOnDemand: settings.get("agentOnDemand"),
          usePostProcess: settings.get("usePostProcess"),
          notifyNewCall: settings.get("notifyNewCall"),
          disableAutoUpdate: settings.get("disableAutoUpdate"),
          notifyMissedCall: settings.get("notifyMissedCall"),
          audioInDevice: settings.get("audioInDevice"),
          audioOutDevice: settings.get("audioOutDevice"),
          iceServers: settings.get("iceServers"),
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
          this.$localStorage.set('xkey', '');
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
        }
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
        useWebPhone(val) {
          settings.set("useWebPhone", val);
          if (val) {
            this.user.registerWebPhone()
          } else {
            this.user.unRegisterWebPhone()
          }
        },
        webAutoAnswer(val) {
          settings.set("webAutoAnswer", val);
        },
        autoLoginCallCenter(val) {
          settings.set("autoLoginCallCenter", val);

          if (val) {
            this.user.loginCC(true);
          } else {
            this.user.logoutCallCenter();
          }
        },
        agentOnDemand(val) {
          settings.set("agentOnDemand", val);
        },
        usePostProcess: (val) => {
          settings.set("usePostProcess", val)
        },
        sipAutoAnswer: (val) => {
          settings.set("sipAutoAnswer", val)
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
        iceServers(val) {
          settings.set("iceServers", val);
          if (this.user) {
            this.user.setWebPhoneIceServers(val);
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
