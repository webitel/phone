<template>
  <v-dialog :value="upgradeVersion" max-width="390">
    <v-stepper :value="stage">
      <v-stepper-header>
        <v-stepper-step :complete="stage > 1" step="1">Name of step 1</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="stage > 2" step="2">Name of step 2</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3">Name of step 3</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" transparent>

          <v-card
            color="lighten-1"
          >
            <v-card-title class="headline">{{$t('upgrade.title')}}</v-card-title>
            <v-card-text>
              {{$t('upgrade.text', upgradeVersion)}}
            </v-card-text>
            <v-card-actions>
              <v-btn small color="green darken-1" flat="flat">{{$t('upgrade.later')}}</v-btn>

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
            <v-card-title class="headline">{{$t('upgrade.download')}}</v-card-title>
            <v-card-text>
              <v-progress-linear
                height="45"
                value="75"
              ></v-progress-linear>
            </v-card-text>
          </v-card>

        </v-stepper-content>

        <v-stepper-content step="3">
          <v-card
            color="lighten-1"
          >
            <v-card-title class="headline">{{$t('upgrade.titleEnd')}}</v-card-title>
            <v-card-text>
              {{$t('upgrade.text', {version: upgradeVersion})}}
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
      }
    }
  }
</script>

<style scoped>

</style>
