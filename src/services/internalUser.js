class InternalUser {
  constructor(userData = {}) {
    this.id = userData.id;

    this.name = userData.name;
    this.online = userData.online;

    this.state = userData.state;
    this.status = userData.away;
    this.description = userData.tag;

    this.loggedCC = userData.inCC || false;
  }

  setState(state, status, description, inCC) {
    this.state = state;
    this.status = status;
    this.description = description;
    this.loggedCC = inCC || false;
  }
}

export default InternalUser;
