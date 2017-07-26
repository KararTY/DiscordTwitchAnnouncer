# DiscordTwitchAnnouncer
## Announces when a Twitch channel goes live in Discord.

### 5 Step Setup.
  1. Get NodeJS, version 8.1.2 or newer.
  2. Git clone or download this repository and then change to the directory in your console/terminal.
  3. Type `npm i` in your console/terminal and wait for dependencies to download and install successfully.
  4. Open up `settings.js` with any text program:
```js
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
```
  5. Change the fields accordingly. *(All fields must have a value, otherwise program will error.)*

**Type `node app.js` in your console/terminal to run program.**

### Prerequisites
 * NodeJS version >= 8.1.2

### Contributing
Fork project & Send a pull request. Use eslint, thanks.

### License MIT