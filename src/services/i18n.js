import * as messages from "../i18n";
import VueI18n from 'vue-i18n'
import Vue from "vue";

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: localStorage.getItem('language') || 'en', // set locale
  messages
});

export default i18n;
