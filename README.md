# DiscordTwitchAnnouncer

## Announces when Twitch channels go live, in Discord

### Updating from 2.x to 3.x

  1. Update your NodeJS version to 12.16.3 or a later version! **(Tested on 12.16.3 and 14.1.0)**
  2. Please run `npm install` again to update libraries and dependencies!
  3. Please add `twitch.clientSecret` to `settings.js` file.
  4. **Please do not share** your `settings.js` file and the new `token.json` file. They both include secrets that allow other people to use your authentications.

### 5 Step Setup

  1. Get NodeJS, v12.x.x or newer **(Tested & Works on v12.16.3)**.
  2. Git clone or download this repository and then change to the directory in your console/terminal.
  3. Type `npm install` in your console/terminal and wait for dependencies to download and install successfully.
  4. Open up `settings.js` with any text program:

```js
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
```

  5. Change the fields accordingly. *(Fields `twitch.clientID`, `twitch.clientSecret` & `discord.token` must have a value, otherwise program will error.)*

**Type `node app.js` in your console/terminal to run program.**

After you've started the announcer, invite the bot and go to your discord channel.

#### Commands

Available commands:

* `!help`
* `!uptime`
* (Example) `!timezone sv-SE Europe/Stockholm` Check [IANA BCP 47 Subtag registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) & [IETF RFC 5646](https://tools.ietf.org/html/rfc5646) for locale tags and [IANA Time Zone Database](https://www.iana.org/time-zones) or [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for timezones.
* (Example) `!channel #general`
  * (Example) `!channel 000000000000000000`
* (Example) `!operator @User_Name`
* (Example) `!add Streamer_Name`
* (Example) `!remove Streamer_Name`
* (Example) `!reaction 👍`
* (Example) `!message <streamerName> @here %name% is **%status%** streaming, **%game%**: *%title%* %link%`
  * `%name%` Streamer's name
  * `%status%` VOD / LIVE / RERUN?
  * `%game%` Game name
  * `%title%` Stream title
  * `%link%` Twitch link
* (Example) `!prefix #`
* (Example) `!language english` Check i18n folder for available languages.
* (Example) `!announcementchannel Streamer_Name 000000000000000000`

### Contributing

Fork project & Send a pull request. Use eslint, thanks.

### License MIT
