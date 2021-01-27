<template>
  <v-layout row>
    <v-flex xs12 sm6 offset-sm3>
      <v-flex xs12 v-if="!items.length && search">
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


      <v-list two-line style="margin-bottom: 30px" v-show="items.length"  two-line subheader expand v-infinite-scroll="loadMore" infinite-scroll-disabled="loading">
        <div v-for="(item, index) in items">
          <v-list-tile avatar @click="" class="users-row"  >
            <!--<v-list-tile-action class="users-action-status">-->
              <!--<v-icon :color="getStateColor(item)">fiber_manual_record</v-icon>-->
            <!--</v-list-tile-action>-->

            <v-list-tile-content>
              <v-list-tile-title >
                {{item.name}}
              </v-list-tile-title>
              <v-list-tile-sub-title>
                {{item.extension}} {{item.presence && item.presence.status}}
              </v-list-tile-sub-title>

            </v-list-tile-content>

            <v-list-tile-action>
              <v-btn @click="makeCall(item.extension)" icon>
                <v-icon color="success">call</v-icon>
              </v-btn>
            </v-list-tile-action>

          </v-list-tile>
          <v-divider
          ></v-divider>
        </div>
      </v-list>

      <!--Refresh btn-->
      <v-layout align-end justify-end>
        <v-btn
          small
          dark
          fixed
          fab
          :disabled="loading"
          @click="refreshData(true)"
          class="fab--hot-fix"
          style="bottom: 65px; margin-left: -10px;"
        >
          <v-icon>refresh</v-icon>
        </v-btn>
      </v-layout>

    </v-flex>

    <v-dialog v-model="showErrorDialog" max-width="390">
      <v-card>
        <v-card-title class="headline">Error</v-card-title>
        <v-card-text>
          {{error}}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            flat
            @click="closeErrorDialog()"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
  import {getStateColor} from '../services/helper'

    export default {
      name: "Users",
      beforeMount: function(){
        if (!this.items.length)
          this.$store.dispatch("users/fetch", {reset: true});
      },
      created() {

      },
      data() {
        return {
          showErrorDialog: false
        }
      },
      beforeDestroy() {

      },
      methods: {
        getStateColor(user) {
          return getStateColor(user.state, user.status)
        },

        makeCall(number) {
          this.user.makeCall(number);
        },

        getStateDescription(user) {
          return 'desription'
        },
        refreshData() {
          this.$store.dispatch('users/fetch', {reset: true})
        },

        loadMore() {
          if (this.haveMoreData)
            this.$store.dispatch("users/fetch");
        },

        closeErrorDialog() {
          this.$store.dispatch('users/clearError');
        }
      },
      computed: {
        items () {
          return this.$store.getters['users/items'];
        },

        error() {
          return this.$store.getters['users/error'];
        },
        totalRecord() {
          return this.$store.getters['users/total'];
        },
        haveMoreData() {
          return this.$store.getters['users/haveMoreData']
        },
        loading () {
          return this.$store.getters['users/loading'];
        },
        search() {
          return this.$store.getters.getSearch();
        },
        user() {
          return this.$store.getters.user();
        },
      },
      watch: {
        error(val) {
          this.showErrorDialog = !!val;
        },
        search() {
          this.$store.dispatch('users/fetch')
        }
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
