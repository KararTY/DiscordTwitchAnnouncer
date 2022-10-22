import data, { saveData } from '../data.js'

import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class OperatorCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.operator.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.operator.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
      .replace('%3', message.discord.author.id)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    if (message.discord.author.id !== message.discord.guild.ownerId) {
      return message.discord.reply(this.translate.commands.operator.noPermission)
    }

    if (!message.cmd[1]) return false

    const operator = message.cmd[1].replace(/[^0-9]/g, '')
    let added = true
    if (data().guilds[message.gid].operator && data().guilds[message.gid].operator.includes(operator)) {
      added = false
      saveData([{ guild: message.gid, entry: 'operator', action: 'splice', value: [data().guilds[message.gid].operator.indexOf(operator), 1] }])
    } else {
      if (!data().guilds[message.gid].operator) saveData([{ guild: message.gid, entry: 'operator', value: [] }])
      saveData([{ guild: message.gid, entry: 'operator', action: 'push', value: operator }])
    }

    return message.discord.reply(this.translate.commands.operator.message.replace('%1', added ? this.translate.added : this.translate.removed))
  }
}
