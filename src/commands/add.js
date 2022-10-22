import fetch from 'got'

import { Msg } from '../message.js'
import data, { cache, saveData } from '../data.js'
import { headers, refreshAppToken } from '../token.js'

import Command from './command.js'

export default class AddCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.add.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.add.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Add streamer to cache.
    const streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
    if (!streamerName) return false

    const sanitizedStreamerName = streamerName.toLowerCase().normalize().replace(/[^\w]/g, '')
    if (cache().guilds[message.gid].findIndex(s => s.name.toLowerCase() === sanitizedStreamerName) > -1) {
      return message.discord.reply(this.translate.commands.add.alreadyExists)
    }

    await refreshAppToken()

    const request = await fetch(`https://api.twitch.tv/helix/users/?login=${sanitizedStreamerName}`, { headers, responseType: 'json' })

    let user
    try {
      user = request.body

      if (user.data.length === 0) {
        return message.discord.reply(
          this.translate.commands.add.doesNotExist
            .replace('%1', sanitizedStreamerName)
        )
      } else user = user.data[0]
    } catch (error) {
      return message.discord.reply(
        this.translate.twitchError
          .replace('%1', error.message)
      )
    }

    const streamerObj = { name: sanitizedStreamerName, streamerId: user.id }

    cache().guilds[message.gid].push(streamerObj)
    saveData([{ guild: message.gid, entry: 'streamers', action: 'push', value: streamerObj }])

    return message.discord.reply(
      `%1 ${data().guilds[message.gid].announcementChannel ? '' : '\n%2'}`
        .replace('%1', this.translate.commands.add.message.replace('%1', sanitizedStreamerName))
        .replace('%2', this.translate.commands.add.addAnnouncementChannel.replace('%1', `<@${message.discord.client.user.id}>`))
    )
  }
}
