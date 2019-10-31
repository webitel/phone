import CONST from "./const";

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

class NotificationInboundCallDef {
  constructor(call) {
    this.id = call.uuid;

    this.notification = new Notification(`Inbound call`, {
      icon: CONST.ICON_CALL,
      body: `Call from ${call.getName()}`
    });
  }

  onAnswer () {
    this.close();
  }

  onActive() {
  }

  onHold() {

  }

  close() {
    try {
      this.notification.close();
    } catch (e) {
      console.error(e)
    }
  }
}

const NotificationInboundCall = window.WEBITEL_NOTIFICATION_NEW_CALL ? window.WEBITEL_NOTIFICATION_NEW_CALL : NotificationInboundCallDef;

export {NotificationInboundCall};
