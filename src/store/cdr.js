import {getLastElem, intToTimeString, makeGroup, PROTECTED_WEBITEL_DATA} from '../services/helper'
import {CallServiceApi} from 'webitel-sdk'

const FETCH_COUNT = 40;

export default {
  namespaced: true,
  state: {
    groups: [],
    filter: "",
    page: 1,
    end: false,
    total: 0,
    status: {
      loading: false,
      success: true,
      error: false
    }
  },
  getters: {
    groups: (state, getters, rootState) => {
      if (state.filter !== rootState.search) {
        return []
      }
      return state.groups
    },
    loading: state => state.status.loading,
    total: state => state.total,
    haveMoreData: state => !state.end,
    error: state => state.status.error
  },
  mutations: {
    RESET_PAGINATION(state, payload) {
      state.filter = payload;
      state.page = 1;
      state.total = 0;
      state.end = false;
      state.groups= [];
    },
    SET_END_PIPE_DATA(state) {
      state.end = true
    },
    ADD_PAGE(state) {
      state.page++;
    },
    LOADING(state){
      state.status = {
        loading: true,
        success: false,
        error: false
      };
    },
    SUCCESS(state){
      state.status = {
        loading: false,
        success: true,
        error: false
      };
    },
    ERROR(state,payload){
      state.status = {
        loading: false,
        success: false,
        error: payload
      };
      state.end = true;
    },
    CLEAR_ERROR(state){
      state.status = {
        loading: false,
        success: false,
        error: false
      };
    },
    SET_DATA(state, {items, next}) {
      if (!items) {
        state.end = true;
        return;
      }
      state.total = 1;
      state.end =  !next; //!next; //FETCH_COUNT > hits.length;
      fillGroups(state.groups, items)
    }
  },
  actions: {
    fetch({ state, commit, rootGetters }, payload = {}) {

      if (state.status.loading) {
        console.error("LOADING");
        return;
      }

      if (!rootGetters.user()) {
        return console.error('no session');
      }

      if (state.filter === rootGetters.search() &&  !payload.reset) {
        //return;
      }

      if (payload.reset || state.filter !== rootGetters.search()) {
        commit('RESET_PAGINATION', rootGetters.search());
      } else {
        if (state.end) {
          console.error("END");
          return;
        }
        commit('ADD_PAGE')
      }
      commit('LOADING');

      /**
       *
       * @summary List of call
       * @param {number} [page]
       * @param {number} [size]
       * @param {string} [created_at_from]
       * @param {string} [created_at_to]
       * @param {Array<string>} [user_id]
       * @param {Array<string>} [agent_id]
       * @param {Array<string>} [queue_id]
       * @param {Array<string>} [team_id]
       * @param {Array<string>} [member_id]
       * @param {Array<string>} [gateway_id]
       * @param {string} [q]
       * @param {string} [duration_from]
       * @param {string} [duration_to]
       * @param {boolean} [skip_parent]
       * @param {string} [parent_id]
       * @param {string} [cause]
       * @param {boolean} [has_file]
       * @param {Array<string>} [fields]
       * @param {string} [sort]
       * @param {string} [domain_id]
       * @param {string} [number]
       * @param {string} [direction]
       * @param {string} [answered_at_from]
       * @param {string} [answered_at_to]
       * @param {boolean} [missed]
       * @param {string} [stored_at_from]
       * @param {string} [stored_at_to]
       * @param {Array<string>} [id]
       * @param {Array<string>} [transfer_from]
       * @param {Array<string>} [transfer_to]
       * @param {Array<string>} [dependency_id]
       * @param {*} [options] Override http request option.
       * @throws {RequiredError}
       */

      new CallServiceApi(rootGetters.apiConfiguration()).searchHistoryCall(
        +state.page,
        FETCH_COUNT,
        state.filter,
        ['-created_at'],
        ["created_at", "id", "files", "cause", "duration", "direction", "destination", "from", "to", "variables"],
        (new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))).getTime(), // last 7 day
        Date.now() + (60 * 1000),
        rootGetters.user().id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ).then((result) => {
        commit('SUCCESS');
        commit('SET_DATA', result.data);
      }).catch(e => {
        commit('ERROR', e.message);
      });
    },

    clearError({ commit }) {
      commit('CLEAR_ERROR');
    }
  }
};


function responseToRow(item) {
  let row = {
    activeDetail: false,
    post_data: {},
      ...item
  };

  if (item.direction === 'inbound') {
    row.displayNumber = item.from.number
    row.displayName = item.from.name
  } else if (item.to && item.to.number ) { //fixme
    row.displayNumber = item.to.number
    row.displayName = item.to.name
  } else {
    row.displayNumber = row.displayName = item.destination;
  }

  if (item.files) {
    row.file = item.files.pop();
  }

  return row;

}

function fillGroups(groups, res) {
  res.forEach(function (item) {
    const row = responseToRow(item);
    let lastGroup = getLastElem(groups);
    let by;

    by = new Date(+row[['created_at']]);
    if (!lastGroup) {
      lastGroup = makeGroup(by.toLocaleDateString());
      groups.push(lastGroup)
    } else if (lastGroup.by !== by.toLocaleDateString()) {
      lastGroup = makeGroup(by.toLocaleDateString());
      groups.push(lastGroup);
    }

    row.startTime = by.toTimeString().split(' ')[0];
    row.durationString = intToTimeString(row['duration']);
    row.imgClassName = getImgCall(row['direction'], row['cause']);
    row.webitelData = [];
    if (row.variables) {
      const data = row.variables;
      for (let name in data) {
        if (data[name] && !~PROTECTED_WEBITEL_DATA.indexOf(name))
          row.webitelData.push({name, value: data[name]})
      }
    }


    lastGroup.items.push(row)

  });
  return groups;
}

function getImgCall(direction, hangupCause) {

  if (direction !== 'outbound' && hangupCause === 'ORIGINATOR_CANCEL') {
    return 'call_missed'
  } else if (direction === 'outbound') {
    return 'call_made'
  } else {
    return 'call_received'
  }
}
