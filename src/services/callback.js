import {getLastElem, makeGroup} from './helper'

class Callback {
  constructor(session) {
    this.session = session;
    this.loading = false;
    this.views = {
      'Overdue': new CallbackView('overdue'),
      'Scheduled': new CallbackView('scheduled'),
      'Callback list': new CallbackView('no_time'),
      'Completed': new CallbackView('completed')
    };
  }

  find(viewName, query, reset, cb) {
    const view = this.views[viewName];
    if (!view) {
      return cb(new Error(`Bad view ${viewName}`))
    }

    if (!reset && query === view.filter && view.groups.length > 0)
      return cb(null, view);

    if (reset || view.filter !== query) {
      view.reset(query)
    }

    this.loading = true;
    view.filter = query;
    this.list(view.Name(), view.page, query, (err, items) => {
      this.loading = false;
      if (err)
        return cb(err);

      view.addToCache(items);
      return cb(null, view);
    })
  }

  next(viewName, cb) {
    const view = this.views[viewName];
    if (!view) {
      return cb(new Error(`Bad view ${viewName}`))
    }
    this.loading = true;
    this.list(view.Name(), view.addPage(), view.filter, (err, items) => {
      this.loading = false;
      if (err)
        return cb(err);

      view.addToCache(items);
      return cb(null, view);
    });
  }

  availableMoreData(viewName) {
    const view = this.views[viewName];
    if (!view) {
      return cb(new Error(`Bad view ${viewName}`))
    }

    return view.nextData;
  }

  openItem(item = {}, cb) {
    const u = `/api/v2/callback/${item.queue_id}/members/${item.id}`;
    this.session.apiRequest('GET', u).then(
      res => {
        return cb(null, res.data.data)
      },
      err => {
        return cb(err)
      }
    );
  }

  setDone(queueId, memberId, cb) {
    this.session.apiRequest('PUT', `/api/v2/callback/${queueId}/members/${memberId}`, {done: true}).then(
      res => {
        return cb(null, res.data.data)
      },
      err => {
        return cb(err)
      }
    );
  }

  addComment(queueId, memberId, text, cb) {
    this.session.apiRequest('POST', `/api/v2/callback/${queueId}/members/${memberId}/comments`, {text}).then(
      res => {
        return cb(null, res.data.data)
      },
      err => {
        return cb(err)
      }
    );
  }

  list(type, page, qs, cb) {
    const u = `/api/v2/callback?view=${type}&page=${page}&filter=${qs || ''}`;
    this.session.apiRequest('GET', u).then(
      res => {
        return cb(null, parseData(res.data.data))
      },
      err => {
        return cb(err)
      }
    );
  }
}

class CallbackView {
  constructor(name) {
    this.name = name;
    this.page = 0;
    this.filter = null;
    this.groups = [];
    this.count = 0;
    this.nextData = true;
  }

  addPage() {
    return ++this.page
  }

  Name() {
    return this.name;
  }

  reset(filter) {
    this.page = 0;
    this.filter = filter;
    this.groups = [];
    this.count = 0;
    this.nextData = true;
  }

  addToCache(items) {
    this.nextData = items.length === 40;
    if (items.length < 1)
      return;

    let lastGroup = getLastElem(this.groups);
    let by;

    items.forEach( item => {
      this.count++;

      //TODO
      if (this.name === "completed" && item.done_at) {
        by = new Date(+item.done_at)
      } else {
        by = new Date(+item.callback_time || +item.created_on || Date.now());
      }

      if (!lastGroup) {
        lastGroup = makeGroup(by.toLocaleDateString());
        this.groups.push(lastGroup)
      } else if (lastGroup.by !== by.toLocaleDateString()) {
        lastGroup = makeGroup(by.toLocaleDateString());
        this.groups.push(lastGroup);
      }
      item._time = by.toTimeString().split(' ')[0];

      lastGroup.items.push(item)
    });

  }

  getData() {
    return this.groups;
  }
}

function parseData(data = []) {
  return data.map(item => {
    item.activeDetail = null;
    item._record = null;
    item._dialog = false;
    return item;
  })
}

export default Callback
