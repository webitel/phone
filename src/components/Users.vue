<template>
  <v-layout row>
    <v-flex xs12 sm6 offset-sm3>
      <v-flex xs12 v-show="!listInternalUsers.length && search">
        <v-card flat>
          <v-card-title>
            <v-flex xs4 class="text-md-center">
              <v-icon size="64px">error_outline</v-icon>
            </v-flex>
            <v-flex xs8>
              <div>
                <div class="headline">No results found:</div>
                <div>{{search}}</div>
              </div>
            </v-flex>
          </v-card-title>
        </v-card>
      </v-flex>

      <v-list two-line>
        <template v-for="(item, index) in listInternalUsers">
          <v-list-tile avatar @click="">
            <v-list-tile-avatar>
              <v-icon :color="getStateColor(item)">fiber_manual_record</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title >
                {{item.name}}
              </v-list-tile-title>
              <v-list-tile-sub-title>
                {{item.id}} {{getStateDescription(item)}}
              </v-list-tile-sub-title>
            </v-list-tile-content>

            <v-list-tile-action>
              <v-btn :disabled="item.state === 'NONREG'" @click="makeCall(item.id)" icon>
                <v-icon color="success">call</v-icon>
              </v-btn>
            </v-list-tile-action>

          </v-list-tile>
        </template>
      </v-list>
    </v-flex>
  </v-layout>
</template>

<script>
  import {getStateColor} from '../services/helper'

    export default {
      name: "Users",
      data () {
        return {
          items: []
        }
      },
      methods: {
        getStateColor(user) {
          return getStateColor(user.state, user.status)
        },

        makeCall(number) {
          this.user.makeCall(number);
        },

        getStateDescription(user) {
          if (user.state === 'NONREG') {
            return this.$t('users.statusNotRegister')
          } else if (user.state === 'ISBUSY') {
            switch (user.status) {
              case "NONE":
                return this.$t('users.statusTalking');
              case "AGENT":
                return this.$t('users.statusAgent', {description: user.description ? user.description : 'In queue call'});
              case "CALLFORWARD":
                return this.$t('users.statusCallForward', {number: user.description});
              case "ONBREAK":
                return this.$t('users.statusOnBreak', {description: user.description});
              case "DND":
                return this.$t('users.statusDND', {description: user.description});
            }
          } else {
            return this.$t('users.statusAvailable');
          }
        }
      },
      computed: {
        listInternalUsers () {
          if (this.search) {
            return this.$store.state.internalUsers.filter(item => {
              return item.id.indexOf(this.search) >= 0 || item.name.indexOf(this.search) >= 0|| item.description.indexOf(this.search) >= 0
            })
          }
          return this.$store.state.internalUsers
        },

        search() {
          return this.$store.getters.getSearch();
        },

        user() {
          return this.$store.state.user
        },
      }
    }
</script>

<style scoped>

</style>
