import {findUserById} from "../services/helper";

export default {
  namespaced: true,
  state: {
    users: []
  },
  getters: {},
  mutations: {
    "INIT_USERS"(state, users) {
      state.users = users;
    },
    "CHANGE_USER_STATE"(state, event) {
      const user = findUserById(state.users, event.id);
      if (user) {
        user.setState(event.state, event.away, event.tag, event.inCC);

      }
    }
  }
}

function f() {

}
