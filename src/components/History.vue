<template>
  <v-layout row v-scroll="onScroll" v-show="cdr">
    <v-flex xs12 sm6 offset-sm3>


      <v-flex xs12 v-show="!cdrData.length && search">
        <v-card >
          <v-container fluid grid-list-lg>
            <v-layout row>
              <v-flex xs4 class="text-md-center">
                <v-icon size="100">error_outline</v-icon>
              </v-flex>
              <v-flex xs8>
                <div>
                  <div class="headline">No results found:</div>
                  <div>{{search}}</div>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>

      <v-list two-line subheader expand>
        <v-subheader> Total: {{totalCount}} (last 7 days)
        </v-subheader>
        <div v-for="item in cdrData">
          <v-subheader inset>{{item.name}}</v-subheader>
          <div v-for="i in item.items" :key="item.title" >
            <v-list-tile avatar @click="">

              <v-list-tile-content >
                <v-list-tile-title>
                  <v-icon>{{i.imgClassName}}</v-icon><a @click="makeCall(i['caller_id_number'])">{{i['caller_id_number']}}</a> to
                  <a @click="makeCall(i['destination_number'])">{{i['destination_number']}}</a>
                </v-list-tile-title>
                <v-list-tile-sub-title>
                  {{ i.startTime }} duration {{ i.durationString }}
                </v-list-tile-sub-title>


              </v-list-tile-content>

              <v-list-tile-action>
                <v-list-tile-action-text v-show="i['variables.webitel_record_file_name'] && i.billsec >= 2">
                  <span @click="i.activeDetail = !i.activeDetail" class="green--text lighten-1">MP3</span>
                </v-list-tile-action-text>
              </v-list-tile-action>
            </v-list-tile>

            <v-layout row wrap v-if="i.activeDetail && i['variables.webitel_record_file_name'] && i.billsec >= 2">
              <v-container fluid grid-list-md>
                <audio controls preload="none" class="audio-player">
                  <source :src="i._uri" type="audio/mpeg">
                </audio>
              </v-container>
            </v-layout>
          </div>


          <v-divider inset></v-divider>
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
          style="margin-bottom: 60px; margin-right: 28px"
        >
          <v-icon>refresh</v-icon>
        </v-btn>
      </v-fab-transition>
      </v-layout>
    </v-flex>


    <v-footer color="transparent" app fixed v-show="!cdr || cdr.loading">
      <v-progress-linear :indeterminate="true"></v-progress-linear>
    </v-footer>
  </v-layout>
</template>

<script>
    export default {
      name: "History",
      created() {
        this.refreshData();
      },
      data() {
        return {
          cdrData: [],
          totalCount: 0
        }
      },

      methods: {
        makeCall(number) {
          this.user.makeCall(number)
        },
        refreshData(reset) {
          if (!this.cdr) {
            this.cdrData = [];
            return
          }

          if (reset) {
            this.cdrData = [];
          }
          this.cdr.find(this.search, (err, res, totalCount, count) => {
            if (err) {
              // TODO
              return
            }
            this.totalCount = totalCount;
            this.cdrData = res;
          }, reset)
        },

        onScroll (e) {
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            this.cdr.next((err, data, totalCount, count) => {
              this.totalCount = totalCount;
              this.cdrData = data;
            })
          }
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
  .audio-player {
    width: 100%;
  }
</style>
