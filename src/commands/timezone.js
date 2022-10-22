import moment from 'moment-timezone'

import { Msg } from '../message.js'
import data, { saveData } from '../data.js'

import Command from './command.js'

export default class TimezoneCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.timezone.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.timezone.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    if (!message.cmd[1]) return false

    saveData([{ guild: message.gid, entry: 'time', value: { locale: message.cmd[1], timeZone: data().guilds[message.gid].time.timeZone } }])

    if (message.cmd[2]) {
      saveData([{ guild: message.gid, entry: 'time', value: { locale: message.cmd[1], timeZone: message.cmd[2] } }])
    }

    return message.discord.reply(this.translate.commands.timezone.message.replace('%1', moment.utc().locale(data().guilds[message.gid].time.locale).tz(data().guilds[message.gid].time.timeZone).format('LL LTS zz')))
  }
}
