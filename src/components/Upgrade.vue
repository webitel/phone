<template>
  <v-dialog :value="upgradeVersion" persistent max-width="390">
    <v-stepper :value="stage">
      <v-stepper-header>
        <v-stepper-step :complete="stage > 1" step="">Confirm</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="stage > 2" step="">Download</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="stage > 2" step="">End</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" transparent>

          <v-card
            color="lighten-1"
          >
            <v-card-title v-if="" class="headline">{{$t('upgrade.title')}}</v-card-title>
            <v-card-text>
              {{$t('upgrade.textAboutUpgrade', upgradeVersion)}}
            </v-card-text>
            <v-card-actions>
              <v-btn small color="green darken-1" flat="flat" @click="later()">{{$t('upgrade.later')}}</v-btn>

              <v-btn
                color="green darken-1" flat="flat"
                @click="upgrade()"
              >
                {{$t('upgrade.install')}}
              </v-btn>
            </v-card-actions>
          </v-card>

        </v-stepper-content>

        <v-stepper-content step="2">

          <v-card
            color="lighten-1"
          >
            <v-card-title class="headline">{{$t('upgrade.titleDownload')}}</v-card-title>
            <v-card-text>
              <v-progress-linear
                height="45"
                :value="progress"
                color="success"
              >
              </v-progress-linear>
            </v-card-text>
          </v-card>

        </v-stepper-content>

        <v-stepper-content step="3">
          <v-card
            color="lighten-1"
            v-if="errorUpgrade"
          >
            <v-card-title class="headline">{{$t('upgrade.titleError')}}</v-card-title>
            <v-card-text>
              {{$t('upgrade.textError', {errorMsg: errorUpgrade})}}
            </v-card-text>
            <v-card-actions>
              <v-btn small color="green darken-1" flat="flat" @click="close()">{{$t('app.close')}}</v-btn>
            </v-card-actions>
          </v-card>
          <v-card
            color="lighten-1"
            v-else
          >
            <v-card-title class="headline">{{$t('upgrade.titleSuccess')}}</v-card-title>
            <v-card-text>
              {{$t('upgrade.textSuccess', {upgradeVersion})}}
            </v-card-text>
            <v-card-actions>
              <v-btn small color="green darken-1" flat="flat" @click="restart()">{{$t('upgrade.restart')}}</v-btn>
            </v-card-actions>
          </v-card>

        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-dialog>
</template>

<script>
  export default {
    name: "Upgrade",
    props: {
    },
    data() {
      return {
      }
    },
    computed: {
      upgradeVersion() {
        return this.$store.getters['version/new'];
      },
      errorUpgrade() {
        return this.$store.getters['version/error'];
      },
      progress() {
        return this.$store.getters['version/progress'];
      },
      stage() {
        return this.$store.getters['version/stage']();
      }
    },
    methods: {
      upgrade() {
        this.$store.dispatch('version/upgrade')
      },
      restart() {
        this.$store.dispatch('version/restart')
      },
      later() {
        this.$store.dispatch('version/later')
      },
      close() {
        this.$store.dispatch('version/later')
      }
    }
  }
</script>

<style scoped>

</style>
