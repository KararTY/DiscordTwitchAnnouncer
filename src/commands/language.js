import { Msg } from '../message.js'
import { saveData } from '../data.js'
import { translations } from '../translation.js'

import Command from './command.js'

export default class LanguageCommand extends Command {
  constructor (translate) {
    super(translate)
    this.commandNames = [...new Set([...this.translate.commands.language.triggers, 'language'])]
  }

  /**
   * @param {Msg} message
   */
  helpText (message) {
    return this.translate.commands.language.helpText
      .replace('%1', this.translate.example)
      .replace('%2', `<@${message.discord.client.user.id}>`)
      .replace('%3', Object.keys(translations).join(', '))
  }

  /**
   * @param {Msg} message
   */
  async handler (message) {
    const providedValue = message.cmd[1]
    if (!providedValue) return false

    if (!translations[providedValue.toLowerCase()]) {
      return message.discord.reply(this.translate.commands.language.languageDoesNotExit.replace('%1', Object.keys(translations).join(', ')))
    }

    saveData([{ guild: message.gid, entry: 'language', value: message.cmd[1] }])
    return message.discord.reply(this.translate.commands.language.message.replace('%1', providedValue.toLowerCase()))
  }
}
