import {getLastElem, intToTimeString, makeGroup, PROTECTED_WEBITEL_DATA} from '../services/helper'

const FETCH_COUNT = 40;

export default {
  namespaced: true,
  state: {
    groups: [],
    filter: "",
    page: 0,
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
      state.page = 0;
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
    SET_DATA(state, {total, hits, user}) {
      state.total = total;
      state.end = FETCH_COUNT > hits.length;
      fillGroups(user, state.groups, hits)
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
      fetchCdr(rootGetters.user(), state.filter, state.page).then(result => {
        commit('SET_DATA', {
          total: result.body.hits.total,
          hits: result.body.hits.hits,
          user: rootGetters.user()
        });
        commit('SUCCESS');
      }).catch(err => {
        commit('ERROR', err.message);
      });

    },

    clearError({ commit }) {
      commit('CLEAR_ERROR');
    }
  }
};


function fetchCdr(user, query, page) {
  return user.storageRequest('POST', '/api/v2/cdr/text?leg=*', JSON.stringify(getRequestBody(user.id, query, page)));
}

function getRequestBody(userId, query, page) {
  const body = {
    "columns": [
      "uuid",
      // "direction",
      // "caller_id_name",
      "caller_id_number",
      "destination_number",
      "billsec",
      "duration",
      "variables.webitel_data",
      "created_time",
      "hangup_cause"
    ],
    "includes": ["recordings"],
    "columnsDate": [],
    "pageNumber": page,
    "limit": FETCH_COUNT,
    "query": query,
    "filter": {
      "bool": {
        "must": [
          {
            "range": {
              "created_time": {
                "gte" : "now-7d/d",
                "lt" :  "now",
                "format": "epoch_millis"
              }
            }
          }
        ]
      }
    },
    "sort": {
    }
  };

  body.filter.bool.must.push({
    "term": {"presence_id": userId}
  });
  return body;
}


function responseToRow(user, item) {
  let row = {
    activeDetail: false
  };

  for (let key in item.fields) {
    row[key] = item.fields[key].pop();
  }

  if (item.fields.hasOwnProperty('caller_id_number') && ~item.fields.caller_id_number.toString().indexOf('@')) {
    row.caller_id_number = item.fields.caller_id_number.toString().substring(0,
      item.fields.caller_id_number.toString().indexOf('@'));
  }

  if (item._source.hasOwnProperty('recordings') && item._source.recordings.length) {
    row._uri = getCdrFileUri(user, item._source.recordings[0])
  }

  if (user.number === row.caller_id_number) {
    row.direction = "outbound";
    row.displayNumber = row.destination_number;
  } else {
    row.direction = "inbound";
    row.displayNumber = row.caller_id_number;
  }
  return row;

}

function fillGroups(user, groups, res) {
  res.forEach(function (item) {
    const row = responseToRow(user, item);
    let lastGroup = getLastElem(groups);
    let by;

    by = new Date(row[['created_time']]);
    if (!lastGroup) {
      lastGroup = makeGroup(by.toLocaleDateString());
      groups.push(lastGroup)
    } else if (lastGroup.by !== by.toLocaleDateString()) {
      lastGroup = makeGroup(by.toLocaleDateString());
      groups.push(lastGroup);
    }

    row.startTime = by.toTimeString().split(' ')[0];
    row.durationString = intToTimeString(row['duration']);
    row.imgClassName = getImgCall(row['direction'], row['hangup_cause'], !!row['queue.name']);
    row.webitelData = [];
    if (row['variables.webitel_data']) {
      const data = JSON.parse(row['variables.webitel_data']);
      for (let name in data) {
        if (data[name] && !~PROTECTED_WEBITEL_DATA.indexOf(name))
          row.webitelData.push({name, value: data[name]})
      }
    }


    lastGroup.items.push(row)

  });
  return groups;
}

function getCdrFileUri (user, recording) {
  //"36bac292-44ea-49b8-bc98-496d5bbfd213_recordSession.mp3"

  let uri = user.cdrServer + "/api/v2/files/" +
    recording.uuid + "?access_token=" + user.getToken() +
    "&x_key=" + user.getKey();
  if (recording.name)
    uri += "&name=" + recording.name + "&file_name=" + recording.name;
  return uri;
}

function getImgCall(direction, hangupCause, isQueue) {

  if (direction !== 'outbound' && hangupCause === 'ORIGINATOR_CANCEL') {
    return 'call_missed'
  } else if (direction === 'outbound') {
    return 'call_made'
  } else {
    return 'call_received'
  }
}