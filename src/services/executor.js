
export default function () {
  if (window.WEBITEL_EXECUTOR) {
    return window.WEBITEL_EXECUTOR
  } else {
    return null
  }
}
