export class Guild {
  data = {
    id: null,
    default_announcement_channel: null,
    time: {
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    prefix: '!',
    language: 'english',
    operators: [],
    streamers: {}
  }

  constructor(obj) {
    this.data.id = obj.id
    this.data.default_announcement_channel = obj.default_announcement_channel

    this.data.time.locale = obj.time.locale || this.data.time.locale
    this.data.time.time_zone = obj.time.time_zone || this.data.time.time_zone

    this.data.prefix = obj.prefix || this.data.prefix
    this.data.language = obj.language || this.data.language
    this.data.operators = obj.operators || this.data.operators
    this.data.streamers = obj.streamers || this.data.streamers
  }

  get id() {
    return this.data.id
  }

  get defaultAnnouncementChannel() {
    return this.data.default_announcement_channel
  }

  set defaultAnnouncementChannel(channelID) {
    this.data.default_announcement_channel = channelID
  }

  get prefix () {
    return this.data.prefix
  }

  set prefix (prefix) {
    this.data.prefix = prefix
  }

  get language () {
    return this.data.language
  }

  set language (language) {
    this.data.language = language
  }

  get time () {
    return this.data.time
  }

  set time ({locale, timeZone}) {
    this.data.time = {
      locale,
      time_zone: timeZone
    }
  }

  getStreamerById (id) {
    const streamer = this.streamers[id]
    if (streamer) {
      return {
        streamer
      }
    } else {
      throw new Error('Streamer not found in guild.')
    }
  }

  upsertStreamer({ id }) {
    this.streamers[id] = {
      message: '',
      announcement_channel: ''
    }
  }

  get streamers () {
    const arr = Object.entries(this.streamers)
    return arr.map(([key, value]) => {
      return { id: key, ...value }
    })
  }
}
