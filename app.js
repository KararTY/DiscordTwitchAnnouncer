const settings = require('./settings.js')
const Discord = require('discord.js')
const ftch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const client = new Discord.Client()

if (!settings.discord.token) throw new Error('No discord authentication token has been provided.')
if (!settings.twitch.clientID) throw new Error('No Twitch client ID token has been provided.')

const headers = new ftch.Headers({
  'Client-ID': settings.twitch.clientID
})

// Create data.json if it doesn't exist.
if (!fs.existsSync(path.join(__dirname, 'data.json'))) {
  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify({ guilds: {} }, null, 2))
  console.log('Created data.json')
}

let data = require('./data.json')

// [{ guild: id, entry: 'entry', value: 'value'}]
function saveData (d = [{ guild: '', entry: '', action: '', value: 'any' }]) {
  const dataOnFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json')))
  for (let index = 0; index < d.length; index++) {
    const object = d[index]
    try {
      switch (object.action) {
        case 'push':
          dataOnFile.guilds[object.guild][object.entry].push(object.value)
          break
        case 'splice':
          dataOnFile.guilds[object.guild][object.entry].splice(object.value[0], object.value[1])
          break
        case 'addGuild':
          dataOnFile.guilds[object.guild] = defaultGuildData
          break
        case 'removeGuild':
          dataOnFile.guilds[object.guild] = undefined
          break
        default:
          dataOnFile.guilds[object.guild][object.entry] = object.value
          break
      }
    } catch (e) {
      console.error(e)
    }
  }
  data = dataOnFile
  return fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(dataOnFile, null, 2))
}

const cache = {}

let disconnect = false

const initialization = new Date()

const defaultGuildData = {
  streamers: [],
  announcementChannel: null,
  reactions: [],
  message: '@everyone %name% **%status%**!',
  time: { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
}

class Message {
  constructor (message) {
    this.cmd = message.content.replace(new RegExp(`^<@${client.user.id}> `), '!').split(/[ ]+/)
    this.discord = message
  }
}

class Command {
  constructor ({ helpText, commandNames, handler }) {
    this.helpText = helpText // String or Function
    this.commandNames = commandNames // Array
    this.handler = handler // Function
  }

  showHelpText (message) {
    return typeof this.helpText === 'function' ? this.helpText(message) : this.helpText
  }
}

const commands = [
  new Command({
    commandNames: ['h', 'help'],
    helpText: (message) => {
      return `\`${data.guilds[message.discord.guild.id].prefix || '!'}help <command>\` (Replace <command> with a command to get help about a specific command.)`
    },
    handler: (message) => {
      // Help command.
      let responseText
      if (message.cmd[1]) {
        const command = commands.find(command => command.commandNames.indexOf(message.cmd[1].toLowerCase()) > -1)
        responseText = typeof command.helpText === 'function' ? command.helpText(message) : command.helpText
      } else {
        responseText = `**Help commands:** ${commands.map(cmd => `\n${typeof cmd.helpText === 'function' ? cmd.helpText(message) : cmd.helpText}`)}`
      }
      return message.discord.reply(responseText)
    }
  }),
  new Command({
    commandNames: ['uptime', 'timeup', 'online'],
    helpText: (message) => {
      return `\`${data.guilds[message.discord.guild.id].prefix || '!'}uptime\` (Shows bot uptime.)`
    },
    handler: (message) => {
      // Uptime command.
      const time = Date.now() - initialization
      let seconds = time / 1000
      const hours = parseInt(seconds / 3600)
      seconds = seconds % 3600
      const minutes = parseInt(seconds / 60)
      seconds = seconds % 60
      return message.discord.reply(`Been online for ${minutes > 0 ? `${hours > 0 ? `${hours} hours,` : ''}${minutes} minutes and ` : ''}${seconds.toFixed(0)} seconds.\n(Online since ${moment.utc(initialization).locale(data.guilds[message.discord.guild.id].time.locale).tz(data.guilds[message.discord.guild.id].time.timeZone).format('LL LTS zz')}.)`)
    }
  }),
  new Command({
    commandNames: ['+', 'add'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}add Streamer_Name\` (Adds a Twitch stream to the announcer.)`
    },
    handler: (message) => {
      // Add streamer to cache.
      const streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
      if (streamerName) {
        if (cache[message.discord.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) > -1) return message.discord.reply('already added!')
        cache[message.discord.guild.id].push({ name: streamerName })
        saveData([{ guild: message.discord.guild.id, entry: 'streamers', action: 'push', value: { name: streamerName } }])
        return message.discord.reply(`added streamer to announcer. ${data.guilds[message.discord.guild.id].announcementChannel ? '' : "\nDon't forget to add announcement channel with `!channel #channelName`."}`)
      } else return false
    }
  }),
  new Command({
    commandNames: ['rem', 'remove', '-', 'del', 'delete'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}remove Streamer_Name\` (Removes a Twitch stream from the announcer.)`
    },
    handler: (message) => {
      // Remove streamer from cache.
      const streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
      if (streamerName) {
        if (cache[message.discord.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) === -1) return message.discord.reply('doesn\'t exist!')
        cache[message.discord.guild.id] = cache[message.discord.guild.id].filter(s => s.name.toLowerCase() !== streamerName)
        saveData([{ guild: message.discord.guild.id, entry: 'streamers', value: data.guilds[message.discord.guild.id].streamers.filter(s => s.name !== streamerName) }])
        return message.discord.reply('removed streamer from announcer.')
      } else return false
    }
  }),
  new Command({
    commandNames: ['ch', 'chn', 'channel'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}channel #${message.discord.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')).first().name}\` or (Example) \`!channel ${message.discord.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')).first().id}\` (**Required!** Text channel for announcements.)`
    },
    handler: (message) => {
      // Choose which channel to post live announcements in.
      if (message.cmd[1]) {
        const channelID = message.cmd[1].replace(/[^0-9]/g, '')
        if (message.discord.guild.channels.get(channelID) && message.discord.guild.channels.get(channelID).memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')) {
          saveData([{ guild: message.discord.guild.id, entry: 'announcementChannel', value: channelID }])
          return message.discord.reply('changed announcement channel.')
        } else return message.discord.reply('can not post in that channel. Change permissions, or choose another channel.')
      } else return false
    }
  }),
  new Command({
    commandNames: ['op', 'operator'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}operator <@${message.discord.author.id}>\` (Toggle operator)`
    },
    handler: (message) => {
      if (message.discord.author.id === message.discord.guild.owner.id) {
        if (message.cmd[1]) {
          const operator = message.cmd[1].replace(/[^0-9]/g, '')
          let added = true
          if (data.guilds[message.discord.guild.id].operator && data.guilds[message.discord.guild.id].operator.includes(operator)) {
            added = false
            saveData([{ guild: message.discord.guild.id, entry: 'operator', action: 'splice', value: [data.guilds[message.discord.guild.id].operator.indexOf(operator), 1] }])
          } else {
            if (!data.guilds[message.discord.guild.id].operator) saveData([{ guild: message.discord.guild.id, entry: 'operator', value: [] }])
            saveData([{ guild: message.discord.guild.id, entry: 'operator', action: 'push', value: operator }])
          }
          return message.discord.reply(`${added ? 'added' : 'removed'} operator.`)
        } else return false
      } else return message.discord.reply('Only guild owner can add and remove operators.')
    }
  }),
  new Command({
    commandNames: ['react', 'reaction'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}reaction 👍\` (Toggles a reaction on the announcement message.)`
    },
    handler: (message) => {
      if (message.cmd[1]) {
        let emoji
        if (message.cmd[1].match(/<a?:[\w]+:[0-9]+>/g)) {
          emoji = message.cmd[1].split(':')[2].replace(/[^0-9]/g, '')
        } else emoji = message.cmd[1]
        let added = true
        if (data.guilds[message.discord.guild.id].reactions.includes(emoji)) {
          added = false
          saveData([{ guild: message.discord.guild.id, entry: 'reactions', action: 'splice', value: [data.guilds[message.discord.guild.id].reactions.indexOf(emoji), 1] }])
        } else {
          saveData([{ guild: message.discord.guild.id, entry: 'reactions', action: 'push', value: emoji }])
        }
        return message.discord.reply(`${added ? 'added' : 'removed'} reaction.`)
      } else return false
    }
  }),
  new Command({
    commandNames: ['tz', 'timezone'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}timezone sv-SE Europe/Stockholm\` (Check __IANA BCP 47 Subtag registry__ <https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry> & __IETF RFC 5646__ <https://tools.ietf.org/html/rfc5646> for locale tags and __IANA Time Zone Database__ <https://www.iana.org/time-zones> & __Wikipedia__ <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezones.)`
    },
    handler: (message) => {
      if (message.cmd[1]) {
        saveData([{ guild: message.discord.guild.id, entry: 'time', value: { locale: message.cmd[1], timeZone: data.guilds[message.discord.guild.id].time.timeZone } }])
        if (message.cmd[2]) {
          saveData([{ guild: message.discord.guild.id, entry: 'time', value: { locale: data.guilds[message.discord.guild.id].time.timeZone, timeZone: message.cmd[2] } }])
        }
        return message.discord.reply(`Time will now be displayed as: ${moment.utc().locale(data.guilds[message.discord.guild.id].time.locale).tz(data.guilds[message.discord.guild.id].time.timeZone).format('LL LTS zz')}`)
      } else return false
    }
  }),
  new Command({
    commandNames: ['msg', 'message'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}message @everyone %name% **%status%**, with **%game%**:\n*%title%*\` (Change stream announcement message. Supports *%name%* for streamer's name, *%status%* for type of stream (VOD, LIVE, RERUN), *%game%* for game title and *%title%* for stream title.)`
    },
    handler: (message) => {
      // Change stream announcement message.
      const cleanedContent = message.cmd.slice(1).join(' ')
      if (cleanedContent.length > 0) {
        saveData([{ guild: message.discord.guild.id, entry: 'message', value: cleanedContent }])
        return message.discord.reply('Changed announcement message.')
      } else return false
    }
  }),
  new Command({
    commandNames: ['pfx', 'prefix'],
    helpText: (message) => {
      return `(Example) \`${data.guilds[message.discord.guild.id].prefix || '!'}prefix !\` (Changes the bot's command prefix.)`
    },
    handler: (message) => {
      if (message.cmd[1]) {
        saveData([{ guild: message.discord.guild.id, entry: 'prefix', value: message.cmd[1] }])
        return message.discord.reply(`Prefix is now \`${message.cmd[1]}\`.`)
      } else return false
    }
  })
]

async function check () {
  try {
    data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'))) // Reload data json
  } catch (err) {
    console.log('Something is up with your data.json file! Retrying in 1 minute...')
    setTimeout(check, 60000)
    return console.error(err)
  }
  if (disconnect) {
    setTimeout(check, 3000)
    return console.log('Seems Discord is disconnected. Not checking for Twitch streams. Retrying in 3 seconds...')
  }
  const streamers = new Set()

  const guildIDs = Object.keys(data.guilds)
  for (let i = 0; i < guildIDs.length; i++) {
    const guildID = guildIDs[i]
    if (client.guilds.find(i => i.id === guildID) && data.guilds[guildID].streamers) data.guilds[guildID].streamers.forEach(stream => streamers.add(stream.name))
  }

  if ([...streamers].length < 1) {
    setTimeout(check, typeof settings.timer === 'number' ? settings.timer + 5000 : 61000)
    return console.log('No Twitch channels. Add some!')
  }
  try {
    const res = await ftch(`https://api.twitch.tv/helix/streams?${[...streamers].map((i, ind) => ind > 0 ? '&user_login=' + i : 'user_login=' + i).join('')}`, { headers }).then(res => { return res.json() })
    if (res.error) throw res

    const streams = []
    for (let i = 0; i < res.data.length; i++) {
      const stream = res.data[i]
      streams.push({
        name: stream.user_name.replace(/ /g, ''),
        gameID: stream.game_id,
        thumbnail: stream.thumbnail_url.replace('{width}x{height}', '1280x720'),
        type: stream.type,
        title: stream.title,
        viewers: stream.viewer_count,
        started: stream.started_at
      })
    }

    const promise = []
    const cachedImages = {}
    if (streams.length > 0) {
      const games = streams.filter(s => s.gameID).map(s => s.gameID)
      promise.push(ftch(`https://api.twitch.tv/helix/games?${games.map((i, ind) => ind > 0 ? '&id=' + i : 'id=' + i).join('')}`, { headers }).then(res => res.json()))
      for (let index = 0; index < streams.length; index++) {
        const s = streams[index]
        const imageName = s.thumbnail
        const res = await ftch(s.thumbnail).then(res => res.buffer())
        cachedImages[imageName] = res
      }
    }

    const streamedGames = await Promise.all(promise)
    const announcements = []
    for (let index = 0; index < guildIDs.length; index++) {
      const guildID = guildIDs[index]
      for (let i = 0; i < cache[guildID].length; i++) {
        if (streams.map(s => s.name.toLowerCase()).includes(cache[guildID][i].name ? cache[guildID][i].name.toLowerCase() : '')) {
          // Make sure they've not already been announced.
          if (!cache[guildID][i].streaming && new Date(streams[streams.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())].started).getTime() > new Date(data.guilds[guildID].streamers[data.guilds[guildID].streamers.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())].lastStartedAt || 0).getTime()) {
            // Push info.
            const streamInfo = streams[streams.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())]
            const gameInfo = (streamedGames[0] && streamedGames[0].data) ? streamedGames[0].data[streamedGames[0].data.findIndex(g => g.id === streamInfo.gameID)] : undefined

            cache[guildID][i] = streamInfo
            cache[guildID][i].game = gameInfo
            cache[guildID][i].streaming = true

            data.guilds[guildID].streamers[i].lastStartedAt = cache[guildID][i].started
            saveData([{ guild: guildID, entry: 'streamers', value: data.guilds[guildID].streamers }])

            if (data.guilds[guildID].announcementChannel) announcements.push(sendMessage(guildID, { cachedImage: cachedImages[cache[guildID][i].thumbnail], streamInfo, gameInfo })) // Send announcement.
            else console.log('Not announcing. No announcement channel set for guild', client.guilds.get(guildID).name)
          }
        } else cache[guildID][i].streaming = false // Not live.
      }
    }
    await Promise.all(announcements)
    if (announcements.length > 0) console.log('Successfully announced all streams.')
    setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
  } catch (e) {
    if (e.error === 'Too Many Requests') {
      settings.timer += 5000
      setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
      return console.log('Throttled by Twitch! Increase timer in settings.js and restart!', '\nTwitch throttle message:', e.message)
    } else {
      settings.timer += 60000
      setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
      return console.error(e)
    }
  }
}

async function sendMessage (guildID, { cachedImage, streamInfo, gameInfo }) {
  const imageFileName = `${streamInfo.name}_${Date.now()}.jpg`
  const embed = new Discord.RichEmbed()
    .setColor(0x6441A4)
    .setTitle(`[${streamInfo.type.toUpperCase()}] ${streamInfo.name}`)
    .setDescription(`**${streamInfo.title}**\n${gameInfo ? gameInfo.name : ''}`)
    .setImage(`attachment://${imageFileName}`)
    .setFooter(`Stream started ${moment.utc(streamInfo.started).locale(data.guilds[guildID].time.locale).tz(data.guilds[guildID].time.timeZone).format('LL LTS zz')} `, gameInfo ? gameInfo.box_art_url.replace('{width}x{height}', '32x64') : undefined)
    .setURL(`http://www.twitch.tv/${streamInfo.name}`)

  if (client.channels.get(data.guilds[guildID].announcementChannel)) {
    console.log('Announcing', streamInfo.name, 'in', client.channels.get(data.guilds[guildID].announcementChannel).name, 'over at guild', client.guilds.get(guildID).name)

    let message
    const parsedAnnouncementMessage = data.guilds[guildID].message
      .replace('%name%', streamInfo.name)
      .replace('%status%', streamInfo.type.toUpperCase())
      .replace('%game%', gameInfo.name)
      .replace('%title%', streamInfo.title)
    try {
      message = await client.channels.get(data.guilds[guildID].announcementChannel).send(`${parsedAnnouncementMessage} http://www.twitch.tv/${streamInfo.name}`, { embed, file: { attachment: cachedImage, name: imageFileName } })
    } catch (err) {
      console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`)
      if (err.message === 'Missing Permissions') {
        message = await client.channels.get(data.guilds[guildID].announcementChannel).send(`${parsedAnnouncementMessage} http://www.twitch.tv/${streamInfo.name}`)
      }
    }

    if (data.guilds[guildID].reactions.length > 0) {
      for (let index = 0; index < data.guilds[guildID].reactions.length; index++) {
        const emoji = data.guilds[guildID].reactions[index]
        try {
          if (Number.isInteger(Number(emoji))) await message.react(message.guild.emojis.get(emoji))
          else await message.react(emoji)
        } catch (err) {
          console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`)
        }
      }
    }

    console.log('Announced', streamInfo.name, 'in', client.channels.get(data.guilds[guildID].announcementChannel).name, 'over at guild', client.guilds.get(guildID).name)
  } else console.log('Could not announce. Announcement channel,', data.guilds[guildID].announcementChannel, 'does not exist over at guild', client.guilds.get(guildID).name)

  return Promise.resolve()
}

client.on('message', message => {
  let allow = false
  if (message.guild && message.member) {
    // If message comes from a guild and guild member.
    if (data.guilds[message.guild.id].operator && data.guilds[message.guild.id].operator.length > 0) {
      // If server has operators set.
      if (data.guilds[message.guild.id].operator.includes(message.author.id)) {
        // If message is from an operator.
        allow = true
      } else if (message.author.id === message.guild.owner.id) {
        // Or from server owner.
        allow = true
      }
    } else if (message.member.hasPermission((settings.discord.permissionForCommands || 'MANAGE_ROLES'), false, true, true)) {
      // If message from a guild member with the required permission.
      allow = true
    } else if (!message.author.bot && (message.author.id === client.user.id)) {
      // If from myself (aka self-bot) in a guild.
      allow = true
    }
  }
  if (allow) {
    const cleanedMessage = message.content.replace(new RegExp(`^<@${client.user.id}> `), '!')
    if (message.cleanContent.startsWith(data.guilds[message.guild.id].prefix || '!') || message.mentions.users.find(u => u.id === client.user.id)) {
      console.log(message.cleanContent.startsWith(data.guilds[message.guild.id].prefix || '!'), data.guilds[message.guild.id].prefix, cleanedMessage.split(/[ ]+/)[0].toLowerCase().substr(1), cleanedMessage)
      const command = commands.find(command => command.commandNames.indexOf(cleanedMessage.split(/[ ]+/)[0].toLowerCase().substr(data.guilds[message.guild.id].prefix.length)) > -1)
      if (command) command.handler(new Message(message)) || message.reply(command.showHelpText(message)) // Handle command.
    }
  }
})

client.on('guildCreate', guild => {
  if (!data.guilds[guild.id]) {
    cache[guild.id] = []
    saveData([{ guild: guild.id, action: 'addGuild' }])
    console.log('Added guild to list!')
  }
})

client.on('guildDelete', guild => {
  if (data.guilds[guild.id]) {
    cache[guild.id] = undefined
    saveData([{ guild: guild.id, action: 'removeGuild' }])
    console.log('Removed a guild from list!')
  }
})

client.once('ready', () => {
  console.log('Logged into Discord.')
  if (settings.discord.activity[0].length > 0 && settings.discord.activity[1].length > 0) {
    const possibleActivities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING']
    client.user.setActivity(settings.discord.activity[1], { type: possibleActivities.includes(settings.discord.activity[0].toUpperCase()) ? settings.discord.activity[0].toUpperCase() : 'PLAYING' }).then(() => console.log('Activity has been set.')).catch(console.error)
  }

  client.guilds.forEach(guild => {
    if (!data.guilds[guild.id]) {
      saveData([{ guild: guild.id, action: 'addGuild' }])
    } else {
      if (!data.guilds[guild.id].reactions) saveData([{ guild: guild.id, entry: 'reactions', value: [] }])
      if (!data.guilds[guild.id].time) saveData([{ guild: guild.id, entry: 'time', value: { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } }])
      if (!data.guilds[guild.id].message) saveData([{ guild: guild.id, entry: 'message', value: '@everyone %name% **%status%**!' }])
      if (!data.guilds[guild.id].prefix) saveData([{ guild: guild.id, entry: 'prefix', value: settings.discord.defaultPrefix }])
    }
  })

  // Initialization of cache.
  const guildIDs = Object.keys(data.guilds)
  for (let index = 0; index < guildIDs.length; index++) {
    const guildID = guildIDs[index]
    const guild = data.guilds[guildID]
    cache[guildID] = []
    for (let i = 0; i < guild.streamers.length; i++) {
      const streamer = guild.streamers[i]
      cache[guildID].push({ name: streamer.name, streaming: false })
    }
  }
  // Starter
  setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
})

client.on('reconnecting', () => {
  console.log('Reconnecting to Discord...')
  disconnect = true
}).on('resume', () => {
  console.log('Reconnected to Discord. All functional.')
  disconnect = false
}).on('disconnect', () => {
  disconnect = true
  client.login(settings.discord.token)
}).login(settings.discord.token).catch(e => console.log(e))
