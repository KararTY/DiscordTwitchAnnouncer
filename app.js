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
  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify({ guilds: {} }))
  console.log('Created data.json')
}

let data = require('./data.json')

let cache = {}

let disconnect = false

let initialization = new Date()

const defaultGuildData = {
  streamers: [],
  announcementChannel: null,
  reactions: [],
  time: { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
}

class Message {
  constructor (message) {
    this.cmd = message.content.split(/[ ]+/)
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
    commandNames: ['help', 'h'],
    helpText: '`!help <command>` (Replace <command> with a command to get help about a specific command.)',
    handler: (message) => {
      // Help command.
      let responseText
      if (message.cmd[1]) {
        let command = commands.find(command => command.commandNames.indexOf(message.cmd[1].toLowerCase()) > -1)
        responseText = typeof command.helpText === 'function' ? command.helpText(message) : command.helpText
      } else {
        responseText = `**Help commands:** ${commands.map(cmd => `\n${typeof cmd.helpText === 'function' ? cmd.helpText(message) : cmd.helpText}`)}`
      }
      return message.discord.reply(responseText)
    }
  }),
  new Command({
    commandNames: ['uptime', 'timeup', 'online'],
    helpText: '`!uptime` (Shows bot uptime.)',
    handler: (message) => {
      // Uptime command.
      let time = Date.now() - initialization
      let seconds = time / 1000
      let hours = parseInt(seconds / 3600)
      seconds = seconds % 3600
      let minutes = parseInt(seconds / 60)
      seconds = seconds % 60
      return message.discord.reply(`Been online for ${minutes > 0 ? `${hours > 0 ? `${hours} hours,` : ''}${minutes} minutes and ` : ''}${seconds.toFixed(0)} seconds.\n(Online since ${moment.utc(initialization).locale(data.guilds[message.discord.guild.id].time.locale).tz(data.guilds[message.discord.guild.id].time.timeZone).format('LL LTS zz')}.)`)
    }
  }),
  new Command({
    commandNames: ['add', '+'],
    helpText: '(Example) `!add Streamer_Name` (Adds a Twitch stream to the announcer.)',
    handler: (message) => {
      // Add streamer to cache.
      let streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
      if (streamerName) {
        if (cache[message.discord.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) > -1) return message.discord.reply('already added!')
        cache[message.discord.guild.id].push({ name: streamerName })
        data.guilds[message.discord.guild.id].streamers.push({ name: streamerName })
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
        return message.discord.reply(`added streamer to announcer. ${data.guilds[message.discord.guild.id].announcementChannel ? '' : "\nDon't forget to add announcement channel with `!channel #channelName`."}`)
      } else return false
    }
  }),
  new Command({
    commandNames: ['rem', 'remove', '-', 'del', 'delete'],
    helpText: '(Example) `!remove Streamer_Name` (Removes a Twitch stream from the announcer.)',
    handler: (message) => {
      // Remove streamer from cache.
      let streamerName = message.cmd[1] ? message.cmd[1].toLowerCase().split('/').pop() : false
      if (streamerName) {
        if (cache[message.discord.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) === -1) return message.discord.reply('doesn\'t exist!')
        cache[message.discord.guild.id] = cache[message.discord.guild.id].filter(s => s.name.toLowerCase() !== streamerName)
        data.guilds[message.discord.guild.id].streamers = data.guilds[message.discord.guild.id].streamers.filter(s => s.name !== streamerName)
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
        return message.discord.reply('removed streamer from announcer.')
      } else return false
    }
  }),
  new Command({
    commandNames: ['ch', 'chn', 'channel'],
    helpText: (message) => {
      return `(Example) \`!channel #${message.discord.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')).first().name}\` or (Example) \`!channel ${message.discord.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')).first().id}\` (**Required!** Text channel for announcements.)`
    },
    handler: (message) => {
      // Choose which channel to post live announcements in.
      if (message.cmd[1]) {
        let channelID = message.cmd[1].replace(/[^0-9]/g, '')
        if (message.discord.guild.channels.get(channelID) && message.discord.guild.channels.get(channelID).memberPermissions(message.discord.guild.me).has('SEND_MESSAGES')) {
          data.guilds[message.discord.guild.id].announcementChannel = channelID
          fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
          return message.discord.reply('changed announcement channel.')
        } else return message.discord.reply('can not post in that channel. Change permissions, or choose another channel.')
      } else return false
    }
  }),
  new Command({
    commandNames: ['op', 'operator'],
    helpText: (message) => {
      return `Example: \`!operator <@${message.discord.author.id}>\` (Toggle)`
    },
    handler: (message) => {
      if (message.discord.author.id === message.discord.guild.owner.id) {
        if (message.cmd[1]) {
          let operator = message.cmd[1].replace(/[^0-9]/g, '')
          let added = true
          if (data.guilds[message.discord.guild.id].operator && data.guilds[message.discord.guild.id].operator.includes(operator)) {
            added = false
            data.guilds[message.discord.guild.id].operator.splice(data.guilds[message.discord.guild.id].operator.indexOf(operator), 1)
          } else {
            if (!data.guilds[message.discord.guild.id].operator) data.guilds[message.discord.guild.id].operator = []
            data.guilds[message.discord.guild.id].operator.push(operator)
          }
          fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
          return message.discord.reply(`${added ? 'added' : 'removed'} operator.`)
        } else return false
      } else return message.discord.reply('Only guild owner can add and remove operators.')
    }
  }),
  new Command({
    commandNames: ['reaction', 'react'],
    helpText: '(Example) `!reaction 👍` (Toggles a reaction on the announcement message.)',
    handler: (message) => {
      if (message.cmd[1]) {
        let emoji
        if (message.cmd[1].match(/<a?:[\w]+:[0-9]+>/g)) {
          emoji = message.cmd[1].split(':')[2].replace(/[^0-9]/g, '')
        } else emoji = message.cmd[1]
        let added = true
        if (data.guilds[message.discord.guild.id].reactions.includes(emoji)) {
          added = false
          data.guilds[message.discord.guild.id].reactions.splice(data.guilds[message.discord.guild.id].reactions.indexOf(emoji), 1)
        } else {
          data.guilds[message.discord.guild.id].reactions.push(emoji)
        }
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
        return message.discord.reply(`${added ? 'added' : 'removed'} reaction.`)
      } else return false
    }
  }),
  new Command({
    commandNames: ['tz', 'timezone'],
    helpText: '(Example) `!timezone sv-SE Europe/Stockholm` Check __IANA BCP 47 Subtag registry__ <https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry> & __IETF RFC 5646__ <https://tools.ietf.org/html/rfc5646> for locale tags and __IANA Time Zone Database__ <https://www.iana.org/time-zones> & __Wikipedia__ <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezones.',
    handler: (message) => {
      if (message.cmd[1]) {
        data.guilds[message.discord.guild.id].time.locale = message.cmd[1]
        if (message.cmd[2]) {
          data.guilds[message.discord.guild.id].time.timeZone = message.cmd[2]
        }
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
        return message.discord.reply(`Time will now be displayed as: ${moment.utc().locale(data.guilds[message.discord.guild.id].time.locale).tz(data.guilds[message.discord.guild.id].time.timeZone).format('LL LTS zz')}`)
      } else return false
    }
  })
]

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
    let command = commands.find(command => command.commandNames.indexOf(message.content.split(/[ ]+/)[0].toLowerCase().substr(1)) > -1)
    if (command) command.handler(new Message(message)) || message.reply(command.showHelpText(message)) // Handle command.
  }
})

client.on('guildCreate', guild => {
  if (!data.guilds[guild.id]) {
    cache[guild.id] = []
    data.guilds[guild.id] = defaultGuildData
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    console.log('Added guild to list!')
  }
})

client.on('guildDelete', guild => {
  if (data.guilds[guild.id]) {
    cache[guild.id] = undefined
    data.guilds[guild.id] = undefined
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    console.log('Removed a guild from list!')
  }
})

client.once('ready', () => {
  console.log('Logged into Discord.')
  if (settings.discord.activity[0].length > 0 && settings.discord.activity[1].length > 0) {
    let possibleActivities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING']
    client.user.setActivity(settings.discord.activity[1], { type: possibleActivities.includes(settings.discord.activity[0].toUpperCase()) ? settings.discord.activity[0].toUpperCase() : 'PLAYING' }).then(() => console.log(`Activity has been set.`)).catch(console.error)
  }

  client.guilds.forEach(guild => {
    if (!data.guilds[guild.id]) {
      data.guilds[guild.id] = defaultGuildData
      fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    } else {
      if (!data.guilds[guild.id].reactions) data.guilds[guild.id].reactions = []
      if (!data.guilds[guild.id].time) data.guilds[guild.id].time = { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    }
  })

  // Initialization of cache.
  for (const guildID in data.guilds) {
    if (data.guilds.hasOwnProperty(guildID)) {
      const guild = data.guilds[guildID]

      cache[guildID] = []

      for (let i = 0; i < guild.streamers.length; i++) {
        const streamer = guild.streamers[i]
        cache[guildID].push({ name: streamer.name, streaming: false })
      }
    }
  }

  setInterval(() => {
    data = require('./data.json') // Reload data json
    if (disconnect) return console.log('Seems Discord is disconnected. Not checking for updates.')
    let streamers = new Set()
    for (const guildID in data.guilds) {
      if (data.guilds.hasOwnProperty(guildID)) {
        if (client.guilds.find(i => i.id === guildID) && data.guilds[guildID].streamers) data.guilds[guildID].streamers.forEach(stream => streamers.add(stream.name))
      }
    }
    if ([...streamers].length < 1) return console.log('No Twitch channels. Add some!')
    ftch(`https://api.twitch.tv/helix/streams?${[...streamers].map((i, ind) => ind > 0 ? '&user_login=' + i : 'user_login=' + i).join('')}`, { headers }).then(res => { return res.json() }).then(res => {
      if (res.error === 'Too Many Requests') {
        settings.timer += 5000
        return console.log('Throttled by Twitch! Increase timer in settings.js and restart!', '\nTwitch throttle message:', res.message)
      }
      let streams = []
      for (let i = 0; i < res.data.length; i++) {
        let stream = res.data[i]
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
      let promise = []
      let cachedImages = {}
      if (streams.length > 0) {
        let games = streams.filter(s => s.gameID).map(s => s.gameID)
        promise.push(new Promise((resolve, reject) => { ftch(`https://api.twitch.tv/helix/games?${games.map((i, ind) => ind > 0 ? '&id=' + i : 'id=' + i).join('')}`, { headers }).then(res => res.json()).then(res => resolve(res)) }))
        streams.forEach(s => {
          promise.push(new Promise((resolve, reject) => {
            let imageName = s.thumbnail
            ftch(s.thumbnail).then(res => res.buffer()).then(res => {
              cachedImages[imageName] = res
              resolve()
            })
          }))
        })
      }
      Promise.all(promise).then(res => {
        for (const guildID in data.guilds) {
          if (data.guilds.hasOwnProperty(guildID)) {
            for (let i = 0; i < cache[guildID].length; i++) {
              if (streams.map(s => s.name.toLowerCase()).includes(cache[guildID][i].name ? cache[guildID][i].name.toLowerCase() : '')) {
                // Make sure they've not already been announced.
                if (!cache[guildID][i].streaming && new Date(streams[streams.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())].started).getTime() > new Date(data.guilds[guildID].streamers[data.guilds[guildID].streamers.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())].lastStartedAt || 0).getTime()) {
                  // Push info
                  let streamInfo = streams[streams.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())]
                  let gameInfo = res[0] ? res[0].data[res[0].data.findIndex(g => g.id === streamInfo.gameID)] : undefined

                  cache[guildID][i] = streamInfo
                  cache[guildID][i].game = gameInfo
                  cache[guildID][i].streaming = true

                  data.guilds[guildID].streamers[i].lastStartedAt = cache[guildID][i].started
                  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))

                  if (data.guilds[guildID].announcementChannel) {
                    // Announce here!
                    let imageFileName = `${cache[guildID][i].name}_${Date.now()}.jpg`
                    let embed = new Discord.RichEmbed()
                      .setColor(0x6441A4)
                      .setTitle(`[${cache[guildID][i].type.toUpperCase()}] ${cache[guildID][i].name}`)
                      .setDescription(`**${cache[guildID][i].title}**\n${cache[guildID][i].game ? cache[guildID][i].game.name : ''}`)
                      .setImage(`attachment://${imageFileName}`)
                      .setFooter(`Stream started ${moment.utc(cache[guildID][i].started).locale(data.guilds[guildID].time.locale).tz(data.guilds[guildID].time.timeZone).format('LL LTS zz')} `, cache[guildID][i].game ? cache[guildID][i].game.box_art_url.replace('{width}x{height}', '32x64') : undefined)
                      .setURL(`http://www.twitch.tv/${cache[guildID][i].name}`)
                    if (client.channels.get(data.guilds[guildID].announcementChannel)) {
                      client.channels.get(data.guilds[guildID].announcementChannel).send(`${settings.discord.message} **${cache[guildID][i].type.toUpperCase()}!** http://www.twitch.tv/${cache[guildID][i].name}`, { embed, file: { attachment: cachedImages[cache[guildID][i].thumbnail], name: imageFileName } }).then(message => {
                        if (data.guilds[guildID].reactions.length > 0) {
                          data.guilds[guildID].reactions.forEach(emoji => {
                            if (Number.isInteger(Number(emoji))) message.react(message.guild.emojis.get(emoji)).catch(err => console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`))
                            else message.react(emoji).catch(err => console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`))
                          })
                        }
                      }).catch(err => {
                        console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`)
                        if (err.message === 'Missing Permissions') {
                          client.channels.get(data.guilds[guildID].announcementChannel).send(`${settings.discord.message} ${cache[guildID][i].name.toUpperCase()} is **${cache[guildID][i].type.toUpperCase()}!** http://www.twitch.tv/${cache[guildID][i].name}`).then(message => {
                            if (data.guilds[guildID].reactions.length > 0) {
                              data.guilds[guildID].reactions.forEach(emoji => {
                                if (Number.isInteger(Number(emoji))) message.react(message.guild.emojis.get(emoji)).catch(err => console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`))
                                else message.react(emoji).catch(err => console.error(err.name, err.message, err.code, `in guild ${client.guilds.get(guildID).name}`))
                              })
                            }
                          })
                        }
                      })
                      console.log('Announcing', cache[guildID][i].name, 'in', client.channels.get(data.guilds[guildID].announcementChannel).name, 'over at guild', client.guilds.get(guildID).name)
                    } else console.log('Could not announce. Announcement channel,', data.guilds[guildID].announcementChannel, 'does not exist over at guild', client.guilds.get(guildID).name)
                  } else console.log('Not announcing. No announcement channel set for guild', client.guilds.get(guildID).name)
                }
              } else cache[guildID][i].streaming = false // Not live.
            }
          }
        }
      })
    }).catch(e => console.error(e))
  }, typeof settings.timer === 'number' ? settings.timer : 61000)
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
