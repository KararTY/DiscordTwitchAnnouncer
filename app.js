const settings = require('./settings.js')
const Discord = require('discord.js')
const ftch = require('node-fetch')
const fs = require('fs')
const path = require('path')
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

client.on('message', message => {
  // Only accept messages from a guild and from a guild member with the required permission, or from myself (aka self-bot) in a guild.
  if ((message.guild && message.member && message.member.hasPermission(settings.discord.permissionForCommands || 'MANAGE_ROLES', false, true, true)) || (message.guild && message.member && message.author.id === client.user.id)) {
    let cmd = message.content.split(/[ ]+/)
    let streamerName = cmd[1] ? cmd[1].toLowerCase().split('/').pop() : false
    switch (cmd[0].toLowerCase()) {
      case '!help':
        message.reply(`\n(Example) \`!channel #${message.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.guild.me).has('SEND_MESSAGES')).first().name}\` or (Example) \`!channel ${message.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.guild.me).has('SEND_MESSAGES')).first().id}\` (**Required!** Text channel for announcements.)\n(Example) \`!add Streamer_Name\` (Adds a Twitch stream to the announcer.)\n(Example) \`!remove Streamer_Name\` (Removes a Twitch stream from the announcer.)`)
        break
      case '!add':
      case '!+':
        // Add streamer to cache.
        if (streamerName) {
          if (cache[message.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) > -1) return message.reply('already added!')
          cache[message.guild.id].push({ name: streamerName })
          data.guilds[message.guild.id].streamers.push(streamerName)
          fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(data), (err) => {
            if (!err) message.reply('added streamer to announcer.')
          })
        } else message.reply('Example: `!add Streamer_Name`')
        break
      case '!remove':
      case '!rem':
      case '!delete':
      case '!del':
      case '!-':
        // Remove streamer from cache.
        if (streamerName) {
          if (cache[message.guild.id].findIndex(s => s.name.toLowerCase() === streamerName) === -1) return message.reply('doesn\'t exist!')
          cache[message.guild.id] = cache[message.guild.id].filter(s => s.name.toLowerCase() !== streamerName)
          data.guilds[message.guild.id].streamers = data.guilds[message.guild.id].streamers.filter(s => s !== streamerName)
          fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(data), (err) => {
            if (!err) message.reply('removed streamer from announcer.')
          })
        } else message.reply('Example: `!remove Streamer_Name`')
        break
      case '!channel':
      case '!chn':
      case '!ch':
        // Choose which channel to post live announcements in.
        if (cmd[1]) {
          let channelID = cmd[1].replace(/[^0-9]/g, '')
          if (message.guild.channels.get(channelID) && message.guild.channels.get(channelID).memberPermissions(message.guild.me).has('SEND_MESSAGES')) {
            data.guilds[message.guild.id].announcementChannel = channelID
            fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(data), (err) => {
              if (!err) message.reply('changed announcement channel.')
            })
          } else message.reply('can not post in that channel. Change permissions, or choose another channel.')
        } else message.reply(`Example: \`!channel #${message.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.guild.me).has('SEND_MESSAGES')).first().name}\` \`!channel ${message.guild.channels.filter(channel => channel.type === 'text' && channel.memberPermissions(message.guild.me).has('SEND_MESSAGES')).first().id}\``)
        break
    }
  }
})

client.on('guildCreate', guild => {
  if (!data.guilds[guild.id]) {
    cache[guild.id] = []
    data.guilds[guild.id] = {
      streamers: [],
      announcementChannel: null
    }
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    console.log('Added guild to list!')
  }
})

client.on('guildDelete', guild => {
  if (data.guilds[guild.id]) {
    cache[guild.id] = undefined
    data.guilds[guild.id] = undefined
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    console.log('Removed guild from list!')
  }
})

client.once('ready', () => {
  console.log('Logged into Discord.')

  client.guilds.forEach(guild => {
    if (!data.guilds[guild.id]) {
      data.guilds[guild.id] = {
        streamers: [],
        announcementChannel: null
      }
      fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data))
    }
  })

  // Initialization of cache.
  for (const guildID in data.guilds) {
    if (data.guilds.hasOwnProperty(guildID)) {
      const guild = data.guilds[guildID]

      cache[guildID] = []

      for (let i = 0; i < guild.streamers.length; i++) {
        const streamer = guild.streamers[i]
        cache[guildID].push({ name: streamer, streaming: false })
      }
    }
  }

  setInterval(() => {
    data = require('./data.json') // Reload data json
    if (disconnect) return console.log('Seems Discord is disconnected. Not checking for updates.')
    let streamers = new Set()
    for (const guildID in data.guilds) {
      if (data.guilds.hasOwnProperty(guildID)) {
        data.guilds[guildID].streamers.forEach(stream => streamers.add(stream))
      }
    }
    if ([...streamers].length < 1) return console.log('No Twitch channels. Add some!')
    ftch(`https://api.twitch.tv/helix/streams?${[...streamers].map((i, ind) => ind > 0 ? '&user_login=' + i : 'user_login=' + i).join('')}`, { headers }).then(res => { return res.json() }).then(res => {
      let streams = []
      for (let i = 0; i < res.data.length; i++) {
        let stream = res.data[i]
        streams.push({
          name: stream.user_name,
          gameID: stream.game_id,
          thumbnail: stream.thumbnail_url.replace('{width}x{height}', '1280x720'),
          type: stream.type,
          title: stream.title,
          viewers: stream.viewer_count,
          started: stream.started_at
        })
      }
      let promise = []
      if (streams.length > 0) {
        let games = streams.filter(s => s.gameID).map(s => s.gameID)
        promise.push(new Promise((resolve, reject) => { ftch(`https://api.twitch.tv/helix/games?${games.map((i, ind) => ind > 0 ? '&id=' + i : 'id=' + i).join('')}`, { headers }).then(res => res.json()).then(res => resolve(res)) }))
      }
      Promise.all(promise).then(res => {
        for (const guildID in data.guilds) {
          if (data.guilds.hasOwnProperty(guildID)) {
            for (let i = 0; i < cache[guildID].length; i++) {
              if (streams.map(s => s.name.toLowerCase()).includes(cache[guildID][i].name.toLowerCase())) {
                // Make sure they're not already live.
                if (!cache[guildID][i].streaming) {
                  // Push info
                  let streamInfo = streams[streams.findIndex(s => s.name.toLowerCase() === cache[guildID][i].name.toLowerCase())]
                  let gameInfo = res[0] ? res[0].data[res[0].data.findIndex(g => g.id === streamInfo.gameID)] : undefined

                  cache[guildID][i] = streamInfo
                  cache[guildID][i].game = gameInfo
                  cache[guildID][i].streaming = true

                  if (data.guilds[guildID].announcementChannel) {
                    // Announce here!
                    let embed = new Discord.RichEmbed()
                      .setColor(0x6441A4)
                      .setTitle(`[${cache[guildID][i].type.toUpperCase()}] ${cache[guildID][i].name}`)
                      .setDescription(`**${cache[guildID][i].title}**\n${cache[guildID][i].game ? cache[guildID][i].game.name : ''}`)
                      .setImage(cache[guildID][i].thumbnail)
                      .setFooter('Discord Twitch Announcer', cache[guildID][i].game ? cache[guildID][i].game.box_art_url.replace('{width}x{height}', '32x64') : undefined)
                      .setURL(`http://www.twitch.tv/${cache[guildID][i].name}`)
                    if (client.channels.get(data.guilds[guildID].announcementChannel)) {
                      client.channels.get(data.guilds[guildID].announcementChannel).send(`@everyone **${cache[guildID][i].type.toUpperCase()}!** http://www.twitch.tv/${cache[guildID][i].name}`, { embed })
                      console.log('Announcing', cache[guildID][i].name, 'in', client.channels.get(data.guilds[guildID].announcementChannel).name, 'over at guild', client.guilds.get(guildID).name)
                    } else console.log('Could not announce. Announcement channel,', data.guilds[guildID].announcementChannel, 'does not exist over at guild', client.guilds.get(guildID).name)
                  } else console.log('Not announcing. No announcement channel set for guild', client.guilds.get(guildID).name)
                }
              } else cache[guildID][i].streaming = false // Not live.
            }
          }
        }
      })
    }).catch(e => console.log(e))
  }, typeof settings.timer === 'number' ? settings.timer : 61000)
})

client.on('reconnecting', () => {
  console.log('Reconnecting to Discord...')
  disconnect = true
}).on('resume', () => {
  console.log('Reconnected to Discord. All functional.')
  disconnect = false
}).on('disconnect', () => {
  throw new Error("Couldn't connect to Discord after multiple retries. Check your connection and restart script.")
}).login(settings.discord.token).catch(e => console.log(e))
