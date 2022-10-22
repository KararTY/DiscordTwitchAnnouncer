import moment from 'moment-timezone'
import data from '../data.js'

import { Msg } from '../message.js'

import Command from './command.js'

const initialization = new Date()

export default class UptimeCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.uptime.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.uptime.helpText.replace('%1', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Uptime command.
    const time = Date.now() - initialization
    let seconds = time / 1000
    const hours = parseInt(seconds / 3600)
    seconds = seconds % 3600
    const minutes = parseInt(seconds / 60)
    seconds = seconds % 60

    const m = moment
      .utc(initialization)
      .locale(data().guilds[message.gid].time.locale)
      .tz(data().guilds[message.gid].time.timeZone)
      .format('LL LTS zz')

    return message.discord.reply(
      `%1 ${minutes > 0 ? `${hours > 0 ? `${hours} %2,` : ''}${minutes} %3 ` : ''}${seconds.toFixed(0)} %4.\n(%5 ${m}.)`
        .replace('%1', this.translate.commands.uptime.message)
        .replace('%2', this.translate.commands.uptime.hoursComma)
        .replace('%3', this.translate.commands.uptime.minutesAnd)
        .replace('%4', this.translate.commands.uptime.seconds)
        .replace('%5', this.translate.commands.uptime.onlineSince)
    )
  }
}
