export class Streamer {
  data = {
    id: undefined,
    username: undefined,
    last_stream: undefined
  }

  constructor(obj) {
    this.data = { id: obj.id, username: obj.username, last_stream: obj.last_stream }
  }

  get id() {
    return this.data.id
  }

  get username() {
    return this.data.username
  }

  set username(username) {
    this.data.username = username
  }

  get lastStream() {
    return this.data.last_stream
  }

  set lastStream(lastStream) {
    this.data.last_stream = lastStream
  }
}
