<template>
  <vue-plyr :options="options" class="player" :id="id">
    <audio >
      <source  :src="file" type="audio/mp3"/>
    </audio>
  </vue-plyr>
</template>

<script>
  import 'vue-plyr'
  import 'vue-plyr/dist/vue-plyr.css'

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
        options: {
          speed: { selected: 1, options: [0.5, 1, 1.5, 2] }
        }
      }
    },
    mounted() {
      const el = document.querySelector(`#${this.id} .plyr__menu__container div`);
      const downloadEd = document.createElement('div');
      downloadEd.className = `${this.id} btn-download-file`;
      downloadEd.onclick = function () {
        var link = document.createElement("a");
        link.download = 'File name';
        link.target = 'new'
        link.href = this.getAttribute('file-link');
        link.click();
      };
      downloadEd.setAttribute('file-link', this.file);

      const menuButton = document.createElement('button');
      menuButton.className = 'plyr__control plyr__control--download';

      const textBtn = document.createElement('span');
      textBtn.setAttribute('aria-hidden', 'true');
      textBtn.textContent = `Download`;
      menuButton.appendChild(textBtn);


      const roleMenu = document.createElement('div');
      roleMenu.setAttribute('role', 'menu');


      downloadEd.appendChild(menuButton);
      downloadEd.appendChild(roleMenu);

      el.appendChild(downloadEd)
    },
    methods: {

    },
    destroyed() {
    }
  }
</script>

<style>
  .theme--dark .player .plyr--audio .plyr__controls {
    background: #171a2a;
    color: #ffffff;
  }

  .player .plyr--audio .plyr__controls .btn-download-file {
    cursor: pointer;
  }

  .player .plyr--audio .btn-download-file .plyr__control.plyr__control--download {
    font-weight: 500;
    margin: 7px;
    margin-bottom: 3px;
    /* padding-left: 28px; */
    position: relative;
    width: calc(100% - 14px);
  }

  .player  .plyr__controls__item.plyr__time--current.plyr__time {
    margin-left: 16px;
  }


</style>
