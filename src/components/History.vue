<template>
  <v-layout row v-show="cdr">
    <Spinner :value="busy"></Spinner>
    <v-flex xs12 sm6 offset-sm3>

      <v-flex xs12 v-show="!cdrData.length && search">
        <v-card flat>
          <v-card-title>
            <v-flex xs4 class="text-md-center">
              <v-icon size="64px">error_outline</v-icon>
            </v-flex>
            <v-flex xs8>
              <div>
                <div class="headline">{{$t('history.noResultFound')}}</div>
                <div>{{search}}</div>
              </div>
            </v-flex>
          </v-card-title>
        </v-card>
      </v-flex>


      <v-flex xs12 v-show="!cdrData.length && !search">
        <v-card flat>
          <v-card-title>
            <v-flex xs4 class="text-md-center">
              <v-icon size="64px">error_outline</v-icon>
            </v-flex>
            <v-flex xs8>
              <div>
                <div class="headline">{{$t('history.emptyResult')}}</div>
              </div>
            </v-flex>
          </v-card-title>
        </v-card>
      </v-flex>


      <v-list style="margin-bottom: 30px" v-show="cdrData.length"  two-line subheader expand v-infinite-scroll="loadMore" infinite-scroll-disabled11="busy">
        <v-subheader>
          {{$t('history.header', {count: totalCount})}}
        </v-subheader>

        <div v-for="item in cdrData">
          <v-subheader inset>{{item.name}}</v-subheader>

          <div v-for="(i, index) in item.items">
            <v-list-tile
              :key="i.uuid"
              class="history-row"
              @click=""
            >
              <v-list-tile-action class="history-direction">
                <v-icon>{{i.imgClassName}}</v-icon>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title>
                  <a @click="makeCall(i.displayNumber)">{{ i.displayNumber }}</a>
                </v-list-tile-title>

                <v-list-tile-sub-title>
                  {{$t('history.rowSubTile', {startTime: i.startTime, durationString: i.durationString})}}
                </v-list-tile-sub-title>

              </v-list-tile-content>

              <v-list-tile-action class="history-actions" >
                <v-icon class="lighten-1" @click="i.activeDetail = !i.activeDetail" v-show="showCallData(i)">info</v-icon>
                <v-icon class="lighten-1" @click="i.activeDetail = !i.activeDetail" v-show="i._uri">voicemail</v-icon>
              </v-list-tile-action>
            </v-list-tile>

            <v-layout row wrap v-if="i.activeDetail">
              <v-container fluid grid-list-md>
                <player v-if="i._uri" :file="i._uri"></player>
                <div class="call-info-row text--accent-1" v-show="i.webitelData.length > 0" v-for="data in i.webitelData">
                  <vue-markdown class="call-info-item" :breaks="false" :anchor-attributes="anchorAttrs">**{{data.name}}**: {{data.value}}</vue-markdown>
                </div>
              </v-container>
            </v-layout>

            <v-divider
              v-if="index + 1 < item.items.length"
            ></v-divider>

          </div>
        </div>
      </v-list>

      <v-layout justify-end>
        <v-fab-transition>
        <v-btn
          small
          dark
          fixed
          bottom
          fab
          @click="refreshData(true)"
          style="margin-bottom: 50px; margin-left: -10px;"
        >
          <v-icon>refresh</v-icon>
        </v-btn>
      </v-fab-transition>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
    import Player from "./Player"
    import VueMarkdown from 'vue-markdown'
    import Spinner from './Spinner'

    export default {
      name: "History",
      components: {
        Player,
        VueMarkdown,
        Spinner
      },
      created() {
        this.refreshData();
      },
      data() {
        return {
          busy: true,
          cdrData: [],
          totalCount: 0,
          anchorAttrs: {
          target: '_blank',
            onclick: `typeof WEBITEL_LINK === 'function' ? WEBITEL_LINK(this, event): null`,
            // onclick: "debugger;",
            rel: 'noopener noreferrer nofollow'
        }
        }
      },

      methods: {
        makeCall(number) {
          this.user.makeCall(number)
        },
        showDetailActions (cdrItem) {
          return this.showCallData(cdrItem) || this.showRecordFile(cdrItem)
        },
        showRecordFile: (cdrItem) => {
          return cdrItem['variables.webitel_record_file_name'] && cdrItem.billsec >= 1
        },
        showCallData: (cdrItem) => {
          return cdrItem.webitelData.length > 0
        },
        refreshData(reset) {
          if (!this.cdr) {
            this.cdrData = [];
            return
          }

          if (reset) {
            this.cdrData = [];
          }
          this.busy = true;
          this.cdr.find(this.search, (err, res, totalCount, nextData) => {
            this.busy = false;
            if (err) {
              // TODO
              return
            }
            this.totalCount = totalCount;
            this.cdrData = res;
          }, reset)
        },

        loadMore() {
          if (this.busy || !this.cdr.availableMoreData()) {
            return;
          }

          this.busy = true;
          this.cdr.next((err, data, totalCount, nextData) => {
            this.busy = false;
            this.totalCount = totalCount;
            this.cdrData = data;
          })
        }
      },

      computed: {
        search() {
          return this.$store.getters.getSearch();
        },
        user() {
          return this.$store.getters.user();
        },
        cdr() {
          return this.$store.getters.cdr();
        }
      },
      watch: {
        cdr(val) {
          if (val) {
            this.refreshData()
          }
        },
        search() {
          this.refreshData()
        }
      }
    }
</script>

<style scoped>
  .history-direction {
    min-width: 35px;
  }
  .history-actions {
    min-width: 30px;
  }


</style>
<style>
  .history-row > a {
    cursor: default;
  }
</style>
