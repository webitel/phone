
export default function (title = "", body = "", icon, onClick) {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
    return null;
  } else {
    const notification = new Notification(title, {
      icon,
      body
    });

    notification.onclick = onClick;
    return notification
  }
}
