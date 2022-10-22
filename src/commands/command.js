/**
 * @typedef { import("../message.js").Msg } Msg
 */

export default class Command {
  constructor (translate) {
    this.translate = translate // object
  }

  showHelpText (message) {
    return typeof this.helpText === 'function'
      ? this.helpText(message)
      : this.helpText
  }

  /**
   * @param {Msg} _message
   */
  helpText (_message) { }

  /**
   * @param {Msg} _message
   */
  async handler (_message) { }
}
