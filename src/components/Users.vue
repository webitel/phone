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

      <v-card wrap flat>
        <v-card-title>
          <v-select
            :items="groups"
            v-model="filterGroup"
            label="Group"
          ></v-select>
        </v-card-title>
      </v-card>


      <v-list two-line>
        <div v-for="(item, index) in listInternalUsers">
          <v-list-tile avatar @click="" class="users-row">
            <v-list-tile-action class="users-action-status">
              <v-icon :color="getStateColor(item)">fiber_manual_record</v-icon>
            </v-list-tile-action>

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

          <v-divider
            v-if="index + 1 < listInternalUsers.length"
          ></v-divider>

        </div>
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
          items: [],
          filterGroup: localStorage.getItem('user_group') || null
        }
      },
      beforeDestroy() {
        this.items = [];
      },
      watch: {
        filterGroup(val) {
          localStorage.setItem('user_group', val);
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
          if (this.filterGroup) {
            return this.$store.getters.internalUsers().filter(item => {
              return item.roleName === this.filterGroup
            })
          }

          if (this.search) {
            return this.$store.getters.internalUsers().filter(item => {
              return item.id.indexOf(this.search) >= 0 || item.name.indexOf(this.search) >= 0|| item.description.indexOf(this.search) >= 0
            })
          }

          return this.$store.getters.internalUsers()
        },

        groups() {
          return this.$store.getters.internalUsers().reduce(function (ctx, c) {
            if (~ctx.indexOf(c.roleName)) {
              return ctx
            }
            ctx.push(c.roleName)
            return ctx
          }, []);
        },

        search() {
          return this.$store.getters.getSearch();
        },

        user() {
          return this.$store.getters.user()
        },
      }
    }
</script>

<style scoped>
  .users-action-status {
    min-width: 35px;
  }
</style>
<style>
  .users-row > a {
    cursor: default;
  }
</style>
