import settings from '../settings.cjs'
import translate from './translation.js'
import log from './logger.js'

if (!settings.discord.token) throw new Error(translate.noDiscordToken)
if (!settings.twitch.clientID) throw new Error(translate.noTwitchClientID)
if (!settings.twitch.clientSecret) {
  log(translate.includeTwitchClientSecret)
  throw new Error(translate.noTwitchClientSecret)
}

if (typeof settings.cooldownTimer === 'undefined') {
  log(translate.includeCooldownTimerWarning)
  settings.cooldownTimer = 21600000
}

export default settings
