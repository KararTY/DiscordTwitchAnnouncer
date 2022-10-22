import { ChannelType, PermissionsBitField } from 'discord.js'

import data, { saveData } from '../data.js'

import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class AnnouncementchatCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.announcementChannel.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    const discordChannel = message.discord.guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.memberPermissions(message.discord.guild.members.me).has(PermissionsBitField.Flags.SendMessages))
    return this.translate.commands.announcementChannel.helpText
      .replace(/%1/g, this.translate.example)
      .replace(/%2/g, `<@${message.discord.client.user.id}>`)
      .replace('%3', discordChannel.name)
      .replace('%4', discordChannel.id)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    const providedStreamer = message.cmd[1]
    if (!providedStreamer) return false

    let channelID = message.cmd[2]

    const foundIndex = data().guilds[message.gid].streamers.findIndex(streamer => streamer.name === providedStreamer)
    if (foundIndex === -1) return message.discord.reply(this.translate.commands.announcementChannel.streamerDoesNotExist)

    if (!channelID) {
      return message.discord.reply(
        this.translate.commands.announcementChannel.announcementChannel
          .replace('%1', data().guilds[message.gid].streamers[foundIndex].name)
          .replace('%2', `<#${data().guilds[message.gid].streamers[foundIndex].announcementChannel || data().guilds[message.gid].announcementChannel}>`)
      )
    }

    channelID = channelID.replace(/[^0-9]/g, '')
    if (message.discord.guild.channels.cache.get(channelID) && message.discord.guild.channels.cache.get(channelID).memberPermissions(message.discord.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      if (channelID === data().guilds[message.gid].announcementChannel) {
        const streamers = data().guilds[message.gid].streamers
        delete streamers[foundIndex].announcementChannel
        saveData([{ guild: message.gid, entry: 'streamers', value: streamers }])
      } else {
        const streamers = data().guilds[message.gid].streamers
        streamers[foundIndex].announcementChannel = channelID
        saveData([{ guild: message.gid, entry: 'streamers', value: streamers }])
      }

      return message.discord.reply(this.translate.commands.announcementChannel.message)
    } else return message.discord.reply(this.translate.commands.announcementChannel.noPermissionsForChannel)
  }
}
