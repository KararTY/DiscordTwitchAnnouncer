module.exports = {
  timer: 120000, // Is in milliseconds. Default: 120000 ms = 2 minutes.
  twitch: {
    clientID: '', // Make a new Twitch application in https://www.twitch.tv/settings/connections
    channels: ['datblindarcher', 'datguyseathus'] // https://www.twitch.tv/<Streamer>
  },
  discord: {
    auth: '', // https://discordapp.com/developers/applications/me/
    announceChannel: '' // Enable Discord developer mode and then right click channel & "Copy ID" you want announcements to be sent to.
  }
}

/**
 *Example invite link
 *https://discordapp.com/oauth2/authorize?&client_id=<clientid from Discord>&scope=bot&permissions=0
 */
