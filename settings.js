module.exports = {
  timer: 61000, // Is in milliseconds. Default: 61000 ms = 1 minute & 1 second.
  twitch: {
    clientID: '' // Make a Twitch application at https://glass.twitch.tv/console/apps
  },
  discord: {
    token: '', // https://discordapp.com/developers/applications/me/
    permissionForCommands: 'MANAGE_ROLES', // https://discordapp.com/developers/docs/topics/permissions
    message: '@everyone' // The text on announcement, before the url and stream type. Default: '@everyone' = '@everyone LIVE! https://twitch.tv/stream'
  }
}

/**
 * Example invite link for bot
 * https://discordapp.com/oauth2/authorize?&client_id=<clientid from Discord>&scope=bot&permissions=0
 */
