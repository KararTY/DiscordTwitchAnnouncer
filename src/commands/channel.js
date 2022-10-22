import { ChannelType, PermissionsBitField } from 'discord.js'

import { saveData } from '../data.js'

import Command from './command.js'

/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class ChannelCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.channel.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    const discordChannel = message.discord.guild.channels.cache
      .find(channel => channel.type === ChannelType.GuildText && channel.memberPermissions(message.discord.guild.members.me).has(PermissionsBitField.Flags.SendMessages))

    return this.translate.commands.channel.helpText
      .replace(/%1/g, this.translate.example)
      .replace(/%2/g, `<@${message.discord.client.user.id}>`)
      .replace('%3', discordChannel.name)
      .replace('%4', discordChannel.id)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Choose which channel to post live announcements in.
    if (!message.cmd[1]) return false

    const channelID = message.cmd[1].replace(/[^0-9]/g, '')

    const channel = message.discord.guild.channels.cache.get(channelID)

    if (channel && channel.memberPermissions(message.discord.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      saveData([{ guild: message.gid, entry: 'announcementChannel', value: channelID }])
      return message.discord.reply(this.translate.commands.channel.message)
    } else return message.discord.reply(this.translate.commands.channel.noPermissionsForChannel)
  }
}
