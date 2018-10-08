// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import store from './store'
import Resource from 'vue-resource'
import VueLocalStorage from 'vue-localstorage'
import infiniteScroll from 'vue-infinite-scroll'

import i18n from './services/i18n'


Vue.use(infiniteScroll);

Vue.use(VueLocalStorage);

Vue.use(Resource);

Vue.use(Vuetify, {
  theme: {
    primary: '#82B1FF',
    // primary: '#142dbf',
    secondary: '#424242',
    accent: '#ee44aa',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107'
  }
});


// Vue.config.productionTip = false;

//TODO
if (typeof nw === 'object') {
  window.phoneStore = store;
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  i18n,
  router,
  store,
  components: { App },
  template: '<App/>'
});
