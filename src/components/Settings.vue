<template>
  <v-layout row >
    <v-flex xs12 sm6 offset-sm3 >
      <v-card>
        <v-card-text>
          <v-form>

            <v-select
              v-model="theme"
              :items="themes"
              label="Theme"
              prepend-icon="settings_brightness"
            ></v-select>

            <v-switch
              label="Use Web phone"
              v-model="useWebPhone"
            ></v-switch>

            <v-switch
              label="Use STUN"
              v-model="iceServers"
            ></v-switch>

            <v-switch
              label="SIP auto answer"
              v-model="sipAutoAnswer"
            ></v-switch>
            <v-switch
              label="Agent auto login"
              v-model="autoLoginCallCenter"
            ></v-switch>
            <v-switch
              label="Agent on demand"
              v-model="agentOnDemand"
            ></v-switch>
            <v-switch
              label="Use post process"
              v-model="usePostProcess"
            ></v-switch>
            <v-switch
              label="Ring inbound call"
              v-model="ringInboundCall"
            ></v-switch>
            <v-switch
              label="Notify new call"
              v-model="notifyNewCall"
            ></v-switch>
            <v-switch
              label="Notify missed call"
              v-model="notifyMissedCall"
            ></v-switch>

            <v-select
              :items="audioInDevices"
              v-model="audioInDevice"
              label="Microphone"
              hint="Microphone"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              auto
              prepend-icon="mic_none"
            ></v-select>


            <v-select
              :items="audioOutDevices"
              label="Output device"
              hint="Output device"
              v-model="audioOutDevice"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              auto
              prepend-icon="headset"
            ></v-select>

            <v-select
              :items="audioOutDevices"
              label="Ring device"
              hint="Ring device"
              v-model="ringInboundSinkId"
              item-text="label"
              item-value="id"
              :loading="loading"
              :disabled="loading"
              cache-items
              single-line
              auto
              prepend-icon="hearing"
            ></v-select>

            <v-btn class="btn-refresh-devices" fab small @click="refreshDevices(true)">
              <v-icon>refresh</v-icon>
            </v-btn>
            Refresh devices

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
          autoLoginCallCenter: settings.get("autoLoginCallCenter"),
          agentOnDemand: settings.get("agentOnDemand"),
          usePostProcess: settings.get("usePostProcess"),
          notifyNewCall: settings.get("notifyNewCall"),
          notifyMissedCall: settings.get("notifyMissedCall"),
          audioInDevice: settings.get("audioInDevice"),
          audioOutDevice: settings.get("audioOutDevice"),
          iceServers: settings.get("iceServers"),
          ringInboundCall: settings.get("ringInboundCall"),
          ringInboundSinkId: settings.get("ringInboundSinkId"),
          theme: settings.get("theme"),
          loading: false,
          themes: ["dark", "lite"],
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
