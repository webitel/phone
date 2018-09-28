
import {getLastElem, makeGroup, intToTimeString, PROTECTED_WEBITEL_DATA} from './helper'

const FETCH_LIMIT = 40;

class CDR {
  constructor(session) {
    this.session = session;
    this.totCall = 0;
    this.filter = null;
    this.page = 1;
    this.count = 0;
    this.groups = [];
    this.loading = false;
    this.nextData = true;
  }

  next(cb) {
    return this.list(++this.page, this.filter, cb);
  }

  flush() {
    this.page = 1;
    this.filter = '*';
    this.groups = [];
    this.count = 0;
  }

  find(qs = '*', cb, hard) {
    if (!hard && qs === this.filter)
      return cb(null, this.groups, this.totCall, this.count);

    this.page = 1;
    this.filter = qs;
    this.groups = [];
    this.count = 0;
    this.nextData = true;
    return this.list(this.page, this.filter, cb);
  }

  byUuid(call_uuid, cb) {
    this.session.storageRequest("GET", `/api/v2/cdr/${call_uuid}`, {}, cb);
  }

  list(page, qs, cb) {
    const body = {
      "columns": [
        "uuid",
        // "direction",
        // "caller_id_name",
        "caller_id_number",
        "destination_number",
        "billsec",
        "duration",
        "variables.webitel_record_file_name",
        "variables.webitel_data",
        "created_time",
        "hangup_cause"
      ],
      // "includes": ["recordings"],
      "columnsDate": [],
      "pageNumber": page,
      "limit": FETCH_LIMIT,
      "query": qs,
      // "domain": "10.10.10.144", //TODO DODO
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
      "term": {"presence_id": this.session.id}
    });

    this.loading = true;
    this.session.storageRequest('POST', '/api/v2/cdr/text?leg=*', JSON.stringify(body)).then(
      res => {
       this.loading = false;
        this._setCacheData(parseElasticResponse(this.session, res.body.hits.hits), res.body.hits.total, cb);
      },
      err => {
        this.loading = false;
        return cb(err)
      }
    );
  }

  availableMoreData() {
    return this.nextData;
  }

  _setCacheData(items, total, cb) {
    this.nextData = items.length === FETCH_LIMIT;

    if (items.length === 0)
      return cb(null, this.groups, total, this.nextData);

    let lastGroup = getLastElem(this.groups);
    let by;

    items.forEach( item => {
      this.count++;
      by = new Date(item[['created_time']]);
      if (!lastGroup) {
        lastGroup = makeGroup(by.toLocaleDateString());
        this.groups.push(lastGroup)
      } else if (lastGroup.by !== by.toLocaleDateString()) {
        lastGroup = makeGroup(by.toLocaleDateString());
        this.groups.push(lastGroup);
      }

      item.startTime = by.toTimeString().split(' ')[0];
      item.durationString = intToTimeString(item['duration']);
      item.imgClassName = getImgCall(item['direction'], item['hangup_cause'], !!item['queue.name']);
      item.webitelData = [];
      if (item['variables.webitel_data']) {
        const data = JSON.parse(item['variables.webitel_data']);
        for (let name in data) {
          if (data[name] && !~PROTECTED_WEBITEL_DATA.indexOf(name))
            item.webitelData.push({name, value: data[name]})
        }
      }

      lastGroup.items.push(item)
    });
    this.totCall = total;
    return cb(null, this.groups, total, this.nextData)
  }
}

export default CDR

function getImgCall(direction, hangupCause, isQueue) {

  if (direction !== 'outbound' && hangupCause === 'ORIGINATOR_CANCEL') {
    return 'call_missed'
  } else if (direction === 'outbound') {
    return 'call_made'
  } else {
    return 'call_received'
  }
}


function parseElasticResponse(session, res) {
  const data = [];
  let t = {};
  res.forEach(function (item) {
    t = {
      activeDetail: false
    };

    for (let key in item.fields) {
      t[key] = item.fields[key][0];
    }

    if (item.fields.hasOwnProperty('variables.webitel_record_file_name')) {
      t._uri = getCdrFileUri(session, item.fields['variables.webitel_record_file_name'].toString())
    }

    if (item.fields.hasOwnProperty('caller_id_number') && ~item.fields.caller_id_number.toString().indexOf('@')) {
      t.caller_id_number = item.fields.caller_id_number.toString().substring(0,
        item.fields.caller_id_number.toString().indexOf('@'));
    }

    if (session.number === t.caller_id_number) {
      t.direction = "outbound"
    } else {
      t.direction = "inbound"
    }

    data.push(t);
  });
  return data;
}

function getCdrFileUri (session, id) {
  //"36bac292-44ea-49b8-bc98-496d5bbfd213_recordSession.mp3"
  const idx = id.indexOf('_');
  if (!~idx) {
    return null;
  }
  const name = id.substring(idx + 1);
  let uri = session.cdrServer + "/api/v2/files/" +
    id.substring(0, idx) + "?access_token=" + session.getToken() +
    "&x_key=" + session.getKey();
  if (name)
    uri += "&name=" + name.substring(0, name.indexOf('.')) + "&file_name=" + name;
  return uri;
}

function _getTypeFile(contentType) {

  switch (contentType) {
    case 'application/pdf':
      return 'pdf';
    case 'audio/wav':
      return 'wav';
    case 'audio/mpeg':
    default:
      return 'mp3'

  }
}
