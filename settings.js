module.exports = {
  timer: 61000, // Is in milliseconds. Default: 61000 ms = 1 minute & 1 second.
  language: 'english', // Default language 'english'. Other languages available in `i18n` folder.
  twitch: {
    clientID: '', // Make a Twitch application at
    clientSecret: '' // https://dev.twitch.tv/console/apps
  },
  discord: {
    defaultPrefix: '!',
    token: '', // https://discordapp.com/developers/applications/me/
    permissionForCommands: 'MANAGE_ROLES', // https://discordapp.com/developers/docs/topics/permissions
    message: '@everyone', // The default text on announcement, before the url and stream type. Can be changed with !message command. Default: '@everyone' = '@everyone LIVE! https://twitch.tv/stream'
    activity: ['LISTENING', 'Twitch API.'] // Status, second entry in array is your custom activity text. If second or first entry is empty, no custom activity will be displayed.
    /** First entry in the above array can only be the following, and will default to 'PLAYING'.
     * PLAYING
     * STREAMING
     * LISTENING
     * WATCHING
     */
  }
}

/**
 * Example invite link for bot
 * https://discordapp.com/oauth2/authorize?client_id=<clientid from Discord>&scope=bot&permissions=0
 */
