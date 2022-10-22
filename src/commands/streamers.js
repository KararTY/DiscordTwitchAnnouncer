
import { cache } from '../data.js'

import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class StreamersCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.streamers.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (_message) {
    return this.translate.commands.streamers.helpText
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Returns list of added streamers.
    const streamers = cache().guilds[message.gid]

    return message.discord.reply(this.translate.commands.streamers.message.replace('%1', streamers.map(s => s.name).join(', ')))
  }
}
