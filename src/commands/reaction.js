import data, { saveData } from '../data.js'

import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class ReactionCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.reaction.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.reaction.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    if (!message.cmd[1]) return false

    let emoji
    if (message.cmd[1].match(/<a?:[\w]+:[0-9]+>/g)) {
      emoji = message.cmd[1].split(':')[2].replace(/[^0-9]/g, '')
    } else emoji = message.cmd[1]

    let added = true
    if (data().guilds[message.gid].reactions.includes(emoji)) {
      added = false
      saveData([{ guild: message.gid, entry: 'reactions', action: 'splice', value: [data().guilds[message.gid].reactions.indexOf(emoji), 1] }])
    } else {
      saveData([{ guild: message.gid, entry: 'reactions', action: 'push', value: emoji }])
    }

    return message.discord.reply(this.translate.commands.reaction.message.replace('%1', added ? this.translate.added : this.translate.removed))
  }
}
