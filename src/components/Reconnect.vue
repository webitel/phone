<template>
  <v-container fluid fill-height class="reconnect-page">
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-container fluid fill-height>
          <v-layout align-center justify-center>
            <v-progress-circular style="text-align: center;" indeterminate :size="140" :width="7" color="warning">
              Connecting...
              {{count}}
            </v-progress-circular>
          </v-layout>
        </v-container>
        <v-container fluid fill-height>
          <v-layout align-center justify-center>
            <v-btn flat @click="cancelReconnect" >Cancel</v-btn>
          </v-layout>
        </v-container>

      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
    export default {
      name: "Reconnect",
      data() {
        return {
          count: 1,
          timerId: null
        }
      },
      created() {
        if (!this.$store.getters.reconnecting() || this.isLogged) {
          this.$store.commit('SET_RECONNECT', false);
          setTimeout(()=>{
            this.$router.push("/")
          }, 10);
          return
        }
        this.count = 1;
        this.timerId = setInterval(()=> {
         this.tryReconnect()
        }, 5000)
      },
      computed: {
        isLogged() {
          return this.$store.getters.isLogged()
        },

        webitel() {
          return this.$store.getters.webitel()
        }
      },
      beforeDestroy() {
        clearInterval(this.timerId);
      },

      watch: {
        isLogged(val) {
          clearInterval(this.timerId);
          this.count = 0;
          this.$store.commit('SET_RECONNECT', false)
        }
      },
      methods: {
        tryReconnect() {
          this.webitel.connect();
          this.count++;
        },
        cancelReconnect() {
          this.$store.commit('LOGOUT')
        }
      }

    }
</script>

<style scoped>
  .reconnect-page {
    position: fixed;
  }
</style>
