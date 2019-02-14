# DiscordTwitchAnnouncer
## Announces when Twitch channels go live, in Discord.

### 5 Step Setup.
  1. Get NodeJS, version 8.1.2 or newer.
  2. Git clone or download this repository and then change to the directory in your console/terminal.
  3. Type `npm i` in your console/terminal and wait for dependencies to download and install successfully.
  4. Open up `settings.js` with any text program:
```js
module.exports = {
  timer: 61000, // Is in milliseconds. Default: 61000 ms = 1 minute & 1 second.
  twitch: {
    clientID: '' // Make a Twitch application at https://glass.twitch.tv/console/apps
  },
  discord: {
    token: '', // https://discordapp.com/developers/applications/me/
    permissionForCommands: 'MANAGE_ROLES', // https://discordapp.com/developers/docs/topics/permissions
    message: '@everyone', // The text on announcement, before the url and stream type. Default: '@everyone' = '@everyone LIVE! https://twitch.tv/stream'
    activity: ['LISTENING', 'Twitch API.'] // Status, second entry in array is your custom activity text. If second or first entry is empty, no custom activity will be displayed.
    /** First entry in the above array can only be the following, and will default to 'PLAYING'.
     * PLAYING
     * STREAMING
     * LISTENING
     * WATCHING
     */
  }
}
```
  5. Change the fields accordingly. *(Fields `twitch.clientID` & `discord.token` must have a value, otherwise program will error.)*

**Type `node app.js` in your console/terminal to run program.**

After you've started the announcer, invite the bot and go to your discord channel.

#### Commands
Available commands:
* `!help`
* (Example) `!add Streamer_Name`
* (Example) `!remove Streamer_Name`
* (Example) `!channel #general` or (Example) `!channel 000000000000000000`
* (Example) `!operator @User_Name`

### Prerequisites
 * NodeJS version >= 8.1.2

### Contributing
Fork project & Send a pull request. Use eslint, thanks.

### License MIT
