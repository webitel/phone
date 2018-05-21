<template>
  <div>
    <span v-show="hours > 0" class="digit">{{ hours | twoDigits }}:</span><span class="digit">{{ minutes | twoDigits }}</span>:<span class="digit">{{ seconds | twoDigits }}</span>
  </div>
</template>

<script>
  export default {
    name: 'Countdown',
    inheritAttrs: false,
    props: {
      start: {
        type: Number
      },
      end: {
        type: Number
      }
    },
    data: function() {
      return {
        now: null,
        startDate: null,
        interval: null,
        diff: 0
      }
    },
    created() {
      this.recalc();
    },
    computed: {

      seconds() {
        return Math.trunc(this.diff) % 60
      },
      minutes() {
        return Math.trunc(this.diff / 60) % 60
      },
      hours() {
        return Math.trunc(this.diff / 60 / 60) % 24
      },
      days() {
        return Math.trunc(this.diff / 60 / 60 / 24)
      }
    },
    watch: {
      now() {
        this.diff = this.now - this.startDate;
      },
      start() {
        this.recalc();
      },
      end() {
        this.recalc();
      }
    },
    methods: {
      recalc () {
        if (!this.start) {
          this.diff = 0;
          clearInterval(this.interval);
          return;
        }

        this.startDate = Math.trunc(this.start / 1000);
        if (this.end) {
          clearInterval(this.interval);
          this.diff = Math.trunc(this.end / 1000) - this.startDate;
        } else {
          this.diff = Math.trunc(Date.now() / 1000) - this.startDate;
          this.now = Math.trunc((Date.now()) / 1000);
          clearInterval(this.interval);
          this.interval = setInterval(() => {
            this.now = Math.trunc(Date.now() / 1000);
          }, 1000);
        }

      }
    },
    filters: {
      twoDigits(value) {
        if ( value.toString().length <= 1 ) {
          return '0'+value.toString()
        }
        return value.toString()
      }
    },
    destroyed() {
      clearInterval(this.interval);
    }
  }
</script>
<style>
</style>
