import Vue from 'vue'
import Router from 'vue-router'

import History from '../components/History.vue'
import Users from '../components/Users'
import Settings from '../components/Settings.vue'
import NotFound from '../components/404.vue'
import Login from '../components/Login.vue'
import Call from '../components/Call.vue'
import Reconnect from '../components/Reconnect.vue'
import Callback from '../components/Callback.vue'

Vue.use(Router);

const router = new Router({
  // mode: 'abstract',
  routes: [
    {
      path: '/',
      name: 'History',
      component: History
    },
    {
      path: '/users',
      name: 'Users',
      component: Users
    },
    {
      path: '/callback',
      name: 'Callback',
      component: Callback
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    },
    {
      path: '/call/:id',
      name: 'Call',
      component: () => Promise.resolve(Call)
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/reconnect',
      name: 'Reconnect',
      component: Reconnect
    },
    {
      path: '*',
      name: 'NotFound',
      component: NotFound
    }
  ]
});

export default router
