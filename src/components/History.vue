<template>
  <v-layout row>
    <Spinner :value="loading"></Spinner>
    <v-flex xs12 sm6 offset-sm3>

      <v-flex xs12 v-show="!groups.length && search">
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


      <v-flex xs12 v-show="!groups.length && !search">
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


      <v-list style="margin-bottom: 30px" v-show="groups.length"  two-line subheader expand v-infinite-scroll="loadMore" infinite-scroll-disabled="loading">
        <v-subheader>
          {{$t('history.header', {count: totalRecord})}}
        </v-subheader>

        <div v-for="item in groups">
          <v-subheader inset>{{item.name}}</v-subheader>

          <div v-for="(i, index) in item.items">
            <v-list-tile
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
                <v-icon class="lighten-1" @click="toggleActiveDetail(i)" v-show="showCallData(i)">contact_mail</v-icon>
                <i class="history-record-session-icon" @click="toggleActiveDetail(i)" v-show="i._uri" ></i>
              </v-list-tile-action>
            </v-list-tile>

            <v-layout row wrap v-if="i.activeDetail">
              <v-container fluid grid-list-md>
                <player v-if="i._uri" :file="i._uri"></player>
                <div class="call-info-row text--accent-1" v-if="i.webitelData.length > 0" v-for="data in i.webitelData">
                  <vue-markdown class="call-info-item" :breaks="false" :anchor-attributes="anchorAttrs">**{{data.name}}**: {{data.value}}</vue-markdown>
                </div>
              </v-container>
            </v-layout>

            <v-divider
              v-show="index + 1 < item.items.length"
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
          @click="refreshData()"
          :disabled="loading"
          style="margin-bottom: 50px; margin-left: -10px;"
        >
          <v-icon>refresh</v-icon>
        </v-btn>
      </v-fab-transition>
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
    import Player from "./Player"
    import VueMarkdown from 'vue-markdown'
    import Spinner from './Spinner'
    //
    export default {
      name: "History",
      components: {
         Player,
         VueMarkdown,
         Spinner
      },
      beforeMount: function(){
        if (!this.groups.length)
          this.$store.dispatch("cdr/fetch", {reset: true});
      },
      created() {

      },
      data() {
        return {
          showErrorDialog: false,
          anchorAttrs: {
            target: '_blank',
            // onclick: `typeof WEBITEL_LINK === 'function' ? WEBITEL_LINK(this, event): null`,
            rel: 'noopener noreferrer nofollow'
          }
        }
      },
      beforeDestroy() {

      },
      methods: {
        makeCall(number) {
         this.user.makeCall(number)
        },
        showCallData: (cdrItem) => {
          return cdrItem.webitelData.length > 0
        },
        toggleActiveDetail: (item) => {
          item.activeDetail = !item.activeDetail;
        },
        refreshData() {
          this.$store.dispatch('cdr/fetch', {reset: true})
        },

        loadMore() {
          if (this.haveMoreData)
            this.$store.dispatch("cdr/fetch");
        },

        closeErrorDialog() {
          this.$store.dispatch('cdr/clearError');
        }
      },

      computed: {
        groups() {
          return this.$store.getters['cdr/groups'];
        },
        error() {
          return this.$store.getters['cdr/error'];
        },
        totalRecord() {
          return this.$store.getters['cdr/total'];
        },
        haveMoreData() {
          return this.$store.getters['cdr/haveMoreData']
        },
        loading () {
          return this.$store.getters['cdr/loading'];
        },
        search() {
          return this.$store.getters.getSearch();
        },
        user() {
          return this.$store.getters.user();
        }
      },
      watch: {
        error(val) {
          this.showErrorDialog = !!val;
        },
        search() {
          this.$store.dispatch('cdr/fetch')
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

  .history-record-session-icon {
    cursor: pointer;
    display: inline-block;
    width:  24px;
    height: 24px;
    -webkit-mask: url(/static/img/history_record_session.svg) no-repeat 100% 100%;
    mask: url(/static/img/history_record_session.svg) no-repeat 100% 100%;
    -webkit-mask-size: cover;
    mask-size: cover;
    background-color: #767676;
  }

  .theme--dark .history-record-session-icon {
    background-color: #ffffff;
  }


</style>
<style>
  .history-row > a {
    cursor: default;
  }
</style>
