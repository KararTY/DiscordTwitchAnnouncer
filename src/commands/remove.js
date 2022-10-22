import data, { cache, saveData } from '../data.js'
import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class RemoveCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.remove.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.remove.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Remove streamer from cache.
    const streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
    if (!streamerName) return false
    if (cache().guilds[message.gid].findIndex(s => s.name.toLowerCase() === streamerName) === -1) {
      return message.discord.reply(this.translate.commands.remove.doesNotExist)
    }

    cache().guilds[message.gid] = cache().guilds[message.gid].filter(s => s.name.toLowerCase() !== streamerName)
    saveData([{ guild: message.gid, entry: 'streamers', value: data().guilds[message.gid].streamers.filter(s => s.name !== streamerName) }])
    return message.discord.reply(this.translate.commands.remove.message)
  }
}
