import { Msg, sendTestMessage } from '../message.js'
import data, { saveData } from '../data.js'

import Command from './command.js'

export default class MessageCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.message.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.message.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Change stream announcement message.
    const cleanedContent = message.cmd.slice(1).join(' ')
    if (cleanedContent.length === 0) return false

    const streamersIndex = data().guilds[message.gid].streamers.findIndex(i => i.name === message.cmd[1].toLowerCase())
    // Change announcement message for said streamer.
    if (streamersIndex > -1) {
      const streamers = data().guilds[message.gid].streamers
      streamers[streamersIndex].message = message.cmd.slice(2).join(' ')
      saveData([{ guild: message.gid, entry: 'streamers', value: streamers }])

      await sendTestMessage(this.translate, message, message.cmd[1])
      return message.discord.reply(this.translate.commands.message.messageStreamer
        .replace('%1', message.cmd[1]))
    } else {
      saveData([{ guild: message.gid, entry: 'message', value: cleanedContent }])

      await sendTestMessage(this.translate, message)
      return message.discord.reply(this.translate.commands.message.message)
    }
  }
}
