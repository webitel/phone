export function getStateColor(status) {
  if (status === 'offline') {
    return 'default'
  } else if (status === 'online') {
    return 'success'
  } else if (status === 'pause') {
    return 'warning'
  } else {
    return 'error'
  }
}

export function twoDigits(value) {
  if ( value.toString().length <= 1 ) {
    return '0'+value.toString()
  }
  return value.toString()
}

export function findUserById(users = [], id) {
  for (let user of users)
    if (user.id === id)
      return user;
}

export function parseServerUri(serverStr) {
  if (serverStr.indexOf('ws') === 0) {
    return serverStr.replace(/ws/, 'http');
  }
  else if (serverStr.indexOf('http') === 0) {
    return serverStr;
  } else {
    return 'http://' + serverStr;
  }
}

export function getGroupName(by) {
  if (by === new Date().toLocaleDateString()) {
    return 'Today'
  } else {
    return by
  }
}

export function getLastElem(arr) {
  return arr[arr.length - 1];
}


export function makeGroup(by) {
  return {
    by,
    name: getGroupName(by),
    show: true,
    items: []
  }
}

export function intToTimeString(seconds) {
  let h, m, s, str = '';
  s = Math.floor(seconds);

  if (!seconds) {
    return " 0 sec"
  }

  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;

  if (h > 0) {
    str += `${h} hours `
  }

  if (m > 0) {
    str += `${m} min `
  }

  str += `${s} sec`;
  return str;
}

export function deleteDomain(str = "") {
  const idx = str.indexOf('@');
  if (~idx) {
    return str.substring(0, idx);
  }
  return str;
}

export const PROTECTED_WEBITEL_DATA = ["dlr_member_id", "dlr_id", "domain_name", "dlr_dsc_s", "dlr_wrap"];
