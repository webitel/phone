<template>
  <audio class="player" controls :src="file"></audio>
</template>

<script>
  export default {
    name: "Player",
    props: {
      file: {
        type: String
      }
    },
    data() {
      return {
        id: `player-${this._uid}`,
      }
    },
    mounted() {
    },
    methods: {
    },
    destroyed() {
    }
  }
</script>

<style scoped>
  .player {
    width: 100%;
  }
</style>
