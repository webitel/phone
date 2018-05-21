import Vue from 'vue'
import Router from 'vue-router'

import History from '@/components/History'
import Users from '@/components/Users'
import Settings from '@/components/Settings'
import NotFound from '@/components/404'
import Login from '@/components/Login'
import Call from '@/components/Call'

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
      path: '*',
      name: 'NotFound',
      component: NotFound
    }
  ]
});

export default router
