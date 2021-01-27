<template>
  <span style="margin-left: 10px">
    <!--<Countdown :start="start" :end="stop"></Countdown>-->
    {{user.agentCallState}}
  </span>
</template>

<script>
  import Countdown from './Countdown'
  export default {
    name: "AgentChannels",
    data() {
      return {
        start: null,
        stop: null
      }
    },
    components:{
      Countdown
    },
    watch: {
      lastCallChannelChanged(val) {
        this.start = Date.now() > val ? val : Date.now();
      }
    },
    created() {
      this.start = this.lastCallChannelChanged;
    },
    computed: {
      user() {
        return this.$store.getters.user()
      },
      lastCallChannelChanged() {
        const user = this.$store.getters.user();
        if (!user || !user.agent)
          return;

        for (const chan of user.agent.channels) {
          if (chan.channel === 'call') {
            return chan.joined_at;
          }
        }

        return null
      },
    }
  }
</script>

<style scoped>

</style>
