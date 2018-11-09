<template>

  <div >
    <Spinner :value="busy"></Spinner>

    <v-layout row  v-show="callback" >
      <v-flex xs12 sm6 offset-sm3>
        <v-card wrap flat>
          <v-card-title>
            <v-select
              :items="items"
              v-model="select"
              item-value="id"
              item-text="name"
              :label="$t('callback.view')"
            ></v-select>
          </v-card-title>
        </v-card>

        <v-flex xs12 v-show="!data.length && search">
          <v-card flat>
            <v-card-title>
              <v-flex xs4 class="text-md-center">
                <v-icon size="64px">error_outline</v-icon>
              </v-flex>
              <v-flex xs8>
                <div>
                  <div class="headline">{{$t('callback.noResultFound')}}</div>
                  <div>{{search}}</div>
                </div>
              </v-flex>
            </v-card-title>
          </v-card>
        </v-flex>

        <v-flex xs12 v-show="!data.length && !search">
          <v-card flat>
            <v-card-title>
              <v-flex xs4 class="text-md-center">
                <v-icon size="64px">error_outline</v-icon>
              </v-flex>
              <v-flex xs8>
                <div>
                  <div class="headline">{{$t('callback.emptyResult')}}</div>
                </div>
              </v-flex>
            </v-card-title>
          </v-card>
        </v-flex>

        <!--Grid data-->
        <v-list style="margin-bottom: 30px" two-line subheader expand v-infinite-scroll="loadMore" infinite-scroll-disabled="busy">
          <div v-for="item in data">
            <v-subheader inset>{{item.name}}</v-subheader>
            <div v-for="(i, index) in item.items" :key="item.title" >
              <v-list-tile @click="" avatar class="callback-row">

                <v-list-tile-action class="callback-done-btn">
                  <v-dialog v-model="i._dialog" persistent max-width="290">
                    <v-checkbox slot="activator" @click.stop.prevent="!i.done && confirmDone(i)" :input-value="i.done === true"></v-checkbox>
                    <v-card >
                      <v-card-title class="headline">{{$t('callback.dialogDoneTitle')}}</v-card-title>
                      <v-card-text>{{$t('callback.dialogDoneContent')}}</v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="green darken-1" flat @click.native="i._dialog = false">{{$t('app.cancel')}}</v-btn>
                        <v-btn color="green darken-1" flat @click.native="setDone(i)">{{$t('app.ok')}}</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-list-tile-action>

                <v-list-tile-content  class="body-1">
                  <v-list-tile-title style="user-select:text;">
                    <i18n path="callback.rowTile" tag="span">
                      <a @click="makeCall(i.number)" place="number">{{i.number}}</a>
                      <span place="queue">{{i.queue_name}}</span>
                    </i18n>
                  </v-list-tile-title>
                  <v-list-tile-sub-title>
                    {{i._time}}
                  </v-list-tile-sub-title>


                </v-list-tile-content>

                <v-list-tile-action class="callback-actions">

                  <v-btn class="text--secondary" :class="{'btn--active': i.activeDetail === 'info'}"  flat icon @click="openItem(i, 'info')">
                    <v-icon>info</v-icon>
                  </v-btn>

                  <v-btn class="text--secondary" :class="{'btn--active': i.activeDetail === 'comments'}" flat icon @click="openItem(i, 'comments')">
                    <v-icon>comment</v-icon>
                  </v-btn>

                </v-list-tile-action>

              </v-list-tile>

              <v-container  grid-list-xl style="padding: 0 13px;" v-if="i._record" v-show="i.activeDetail === 'info'">
                <v-flex class="callback-detail-field" xs12 v-show="i._record.done_at">
                  {{$t('callback.doneAt')}}: {{dateToTimeString(+i._record.done_at)}}
                </v-flex>
                <v-flex class="callback-detail-field" xs12 v-if="i._record.done_by">
                  {{$t('callback.doneBy')}}: {{deleteDomain(i._record.done_by)}}
                </v-flex>
                <v-flex class="callback-detail-field" xs12 v-show="i._record.href">
                  {{$t('callback.href')}}: <a @click="openLink(i._record.href)" target="_blank">{{i._record.href}}</a>
                </v-flex>
                <v-flex class="callback-detail-field" xs12 v-show="i._record.widget_name">
                  {{$t('callback.widget')}}: {{i._record.widget_name}}
                </v-flex>
                <v-flex class="callback-detail-field" xs12 v-show="i._record.request_ip">
                  {{$t('callback.requestIP')}}: {{i._record.request_ip}}
                </v-flex>
                <v-flex class="callback-detail-field" xs12 v-show="i._record.user_agent">
                  {{$t('callback.userAgent')}}: {{i._record.user_agent}}
                </v-flex>
                <div v-if="i._record.location">
                  <v-flex class="callback-detail-field" xs12 v-show="i._record.location.country_name">
                    {{$t('callback.country')}}: {{i._record.location.country_name}}
                  </v-flex>
                  <v-flex class="callback-detail-field" xs12 v-show="i._record.location.region_name">
                    {{$t('callback.regionName')}}: {{i._record.location.region_name}}
                  </v-flex>
                  <v-flex class="callback-detail-field" xs12 v-show="i._record.location.time_zone">
                    {{$t('callback.timeZone')}}: {{i._record.location.time_zone}}
                  </v-flex>
                </div>
              </v-container>

              <v-layout row wrap v-show="i.activeDetail === 'comments'" v-if="i._record" style="padding: 0 13px;">
                <v-flex  style="padding: 18px 0 0;">
                  <div class="callback-comment-row" v-for="comment in i._record.comments" >
                    <div>{{comment.text}}</div>
                    <div class="text--secondary">
                      {{$t('callback.commentSubTile', {createdBy: deleteDomain(comment.created_by), date: dateToTimeString(comment.created_on)})}}
                    </div>
                    <v-divider></v-divider>
                  </div>
                </v-flex>
                <v-flex xs12>
                  <v-text-field
                    append-icon="send"
                    v-model="i._newComment"
                    @click:append="sendComment(i)"
                    @keyup.enter="sendComment(i)"
                    type="text"
                    :placeholder="$t('callback.newCommentPlaceholder')"
                  ></v-text-field>
                </v-flex>
              </v-layout>


              <v-divider
                v-if="index + 1 < item.items.length"
              ></v-divider>
            </div>

          </div>
        </v-list>


        <!--Refresh btn-->
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
  </div>
</template>

<script>
  import {deleteDomain} from '../services/helper'
  import Spinner from './Spinner'

  export default {
    name: "Callback",
    components: {
      Spinner
    },
    data() {
      return {
        busy: true,
        select: localStorage.getItem('callback_view') || "overdue",
        items: [
          {
            name: this.$t('callback.viewOverdue'),
            id: "overdue"
          },
          {
            name: this.$t('callback.viewScheduled'),
            id: "scheduled"
          },
          {
            name: this.$t('callback.callbackList'),
            id: "callbackList"
          },
          {
            name: this.$t('callback.viewCompleted'),
            id: "completed"
          }
        ],
        data: []
      }
    },
    beforeDestroy() {
      this.data = [];
    },
    created() {
      this.refreshData();
    },
    methods: {
      loadMore() {
        if (this.busy || !this.callback.availableMoreData(this.select)) {
          return;
        }

        this.busy = true;
        this.callback.next(this.select, this.onViewData);
      },
      refreshData(reset = false) {
        if (!this.callback) {
          this.data = [];
          return
        }

        this.find(this.select,  this.search, reset);
      },

      find(view, query, reset) {
        this.busy = true;
        this.callback.find(view,  query, reset, this.onViewData)
      },

      openLink(href) {
        if (typeof WEBITEL_LINK === 'function') {
          WEBITEL_LINK({href}, null, true)
        } else {
          window.open(href, '_blank')
        }
      },

      onViewData(err, view) {
        this.busy = false;
        if (err)
          throw err; //TODO

        this.data = view.getData();
      },

      dateToTimeString: v => {
        return new Date(v).toLocaleString()
      },

      openItem(item, menu) {
        item.activeDetail = item.activeDetail !== menu ? menu: null;
        if (item._record) {
          return;
        }
        this.busy = true;
        this.callback.openItem(item, (err, res) => {
          this.busy = false;
          if (err)
            throw err;

          item._record = res;
        })
      },
      sendComment(item) {
        if (!item._newComment) {
          return
        }

        if (!item._record.comments) {
          item._record.comments = [];
        }

        this.busy = true;
        this.callback.addComment(item.queue_id, item.id, item._newComment, (err, result) => {
          this.busy = false;
          if (err)
            throw err;

          item._record.comments.push({
            created_by: result.created_by,
            created_on: +result.created_on,
            id: result.id,
            member_id: result.member_id,
            text: result.text
          });
          item._newComment = "";

        });
      },
      makeCall(number) {
        this.user.makeCall(number);
      },
      confirmDone(item) {
        item._dialog = true;
      },
      setDone(item) {
        this.busy = true;
        this.callback.setDone(item.queue_id, item.id, (err, res) => {
          this.busy = false;
          item._dialog = false;
          if (err)
            throw err;

          this.refreshData(true)
        });
      },
      deleteDomain
    },
    computed: {
      search() {
        return this.$store.getters.getSearch();
      },
      user() {
        return this.$store.state.user
      },
      callback() {
        return this.$store.getters.callback();
      }
    },
    watch:{
      callback(val) {
        if (val) {
          this.refreshData()
        }
      },
      select(val) {
        localStorage.setItem('callback_view', val);
        this.find(val, this.search, false);
      },
      search() {
        this.refreshData(true)
      }
    }
  }
</script>

<style scoped>
  .callback-detail-field {
    padding: 18px 0 0;
  }
  .callback-done-btn {
    min-width: 35px;
  }
  .callback-comment-row {
    margin-bottom: 7px;
  }


  .callback-actions {
    min-width: 30px;
  }
</style>

<style>
  .callback-row > a {
    cursor: default;
  }
</style>
