import { EmbedBuilder } from 'discord.js'

import { Msg } from '../message.js'
import commands from './index.js'

import Command from './command.js'

export default class HelpCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = this.translate.commands.help.triggers
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.help.helpText.replace('%1', `<@${message.discord.client.user.id}>`)
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    // Help command.
    if (message.cmd[1]) {
      const command = commands(this.translate).find(command => command.commandNames.indexOf(message.cmd[1].toLowerCase()) > -1)
      return message.discord.reply(command ? typeof command.helpText === 'function' ? command.helpText(message) : command.helpText : 'that command does not exist.')
    }

    try {
      const embed = new EmbedBuilder()
        .setTitle(this.translate.commands.help.availableCommands)

      const fields = commands(this.translate).map(cmd => ({ name: cmd.commandNames.join(', '), value: typeof cmd.helpText === 'function' ? cmd.helpText(message) : cmd.helpText }))
      embed.addFields(fields)

      await message.discord.channel.send({ content: this.translate.commands.help.message, embeds: [embed] })
    } catch (err) {
      if (err.message === 'Missing Permissions') {
        return message.discord.reply(this.translate.commands.help.message.concat(commands.map(cmd => `\n${typeof cmd.helpText === 'function' ? cmd.helpText(message) : cmd.helpText}`)))
      }
    }
  }
}
