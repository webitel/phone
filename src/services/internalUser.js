class InternalUser {
  constructor(userData = {}) {
    this.id = userData.id;

    this.name = userData.name;
    this.online = userData.online;

    this.state = userData.state;
    this.status = userData.away;
    this.description = userData.tag;

    this.loggedCC = userData.inCC || false;
    // this.bigData = new Array(1e5).join('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n');
  }

  setState(state, status, description, inCC) {
    this.state = state;
    this.status = status;
    this.description = description;
    this.loggedCC = inCC || false;
  }
}

export default InternalUser;
