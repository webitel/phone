export function getStateColor(state, status) {

  if (state === 'NONREG') {
    return 'default'
  } else if (state === 'ONHOOK' && status === 'NONE' ) {
    return 'success'
  } else if (state === 'ISBUSY' && status === 'ONBREAK') {
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
