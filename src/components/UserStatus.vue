<template>
  <v-menu offset-y v-model="menu"  origin="top right" absolute :close-on-content-click="false"
          :nudge-width="200" >
    <template v-slot:activator="{ on }">
      <v-btn
        v-on="on"
        icon
      >
        <v-icon large :color="getStateColor(user)">account_circle</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-tile>
        <v-list-tile-title>
          <Countdown :start="lastStatusChange" :end="stop"></Countdown>
        </v-list-tile-title>
      </v-list-tile>


      <div v-for="(item, index) in items">
        <v-list-tile
          v-if="!item.items.length"
          v-show="item.id !== status"
          :key="index"
          @click="status = item.id"
        >
          <v-list-tile-title>{{ $t('user.' + item.id) }}</v-list-tile-title>
        </v-list-tile>

        <v-list-tile
          :key="index"
          v-else
        >
          <v-select
            v-model="pausePayload"
            :items='item.items'
            :label="$t('user.' + item.id)"
          ></v-select>
        </v-list-tile>
      </div>

      <v-list-tile>
        <v-checkbox style="padding: 0"
          label="Auto answer"
          v-model="autoAnswer"
        ></v-checkbox>
      </v-list-tile>

    </v-list>
  </v-menu>
</template>

<script>

  import {getStateColor} from '../services/helper'
  import  Countdown from './Countdown'
  import settings from '../services/settings'

  export default {
    name: "UserStatus",
    components: {
      Countdown
    },
    data() {
      return {
        menu: false,
        fav: true,
        message: false,
        hints: true,
        stop: null,
        statusList: []
      }
    },
    created() {
      const pauseItems = settings.get('pauseDescriptions') || [];

      this.statusList = [
        {id: "pause", title: 'Pause', items: pauseItems},
        {id: "online", title: 'Online', items: []},
        {id: "offline", title: 'Offline', items: []}
      ]
    },

    computed: {
      items() {
        return this.statusList
      },
      user() {
        return this.$store.getters.user();
      },

      lastStatusChange() {
        const user = this.$store.getters.user();
        if (!user || !user.agent)
          return;

        return user.agent.lastStatusChange
      },
      pausePayload: {
        get() {
          const user = this.$store.getters.user();
          if (!user || !user.agent)
          return null;

          return user.agent.statusPayload
        },
        set(val) {
          this.$store.getters.user().agent.pause(val);
          this.menu = false;
        }
      },

      autoAnswer: {
        get() {
          if (this.user)
            return this.user.usrAutoAnswer
          return false
        },

        set(val) {
          if (this.user)
             this.user.usrAutoAnswer = val
        }
      },

      status: {
        get() {
          const user = this.$store.getters.user();
          if (!user || !user.agent)
            return;

          return user.agent.status
        },
        set(val) {
          switch (val) {
            case "offline":
              this.$store.getters.user().agent.offline();
              break;
            case "online":
              this.$store.getters.user().agent.online();
              break;
            case "pause":
              this.$store.getters.user().agent.pause();
              break;
          }
          this.menu = false;
        }
      },
    },
    methods: {
      getStateColor(user = {}) {
        if (!user || !user.agent)
          return;
        return getStateColor(user.agent.status)
      },
    }
  }
</script>

<style scoped>

</style>
