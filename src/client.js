import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js'

import settings from './settings.js'
import data, { cache, saveData } from './data.js'
import commands from './commands/index.js'
import translate, { translateDefault } from './translation.js'
import { Msg } from './message.js'
import { check } from './check.js'

export let disconnect = false

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions]
})

client.on('messageCreate', async message => {
  let allow = false

  if (message.guild && message.member) {
    // If message comes from a guild and guild member.
    if (data().guilds[message.guild.id].operator && data().guilds[message.guild.id].operator.length > 0) {
      // If server has operators set.
      if (data().guilds[message.guild.id].operator.includes(message.author.id)) {
        // If message is from an operator.
        allow = true
      } else if (message.author.id === message.guild.ownerId) {
        // Or from server owner.
        allow = true
      }
    }

    if (settings.discord.permissionForCommands) {
      if (message.member.permissions.has(settings.discord.permissionForCommands || PermissionsBitField.Flags.ManageRoles)) {
        // If message from a guild member with the required permission.
        allow = true
      } else if (!message.author.bot && (message.author.id === client.user.id)) {
        // If from myself (aka self-bot) in a guild.
        allow = true
      }
    }
  }

  if (allow) {
    const cleanedMessage = message.content.replace(new RegExp(`^<@${client.user.id}>`), '').trim()
    if (message.content.startsWith(message.mentions.users.find(u => u.id === client.user.id))) {
      const command = commands(translateDefault(data().guilds[message.guild.id].language)).find(command => command.commandNames.indexOf(cleanedMessage.split(/[ ]+/)[0].toLowerCase()) > -1)
      if (!command) return

      const handled = await command.handler(new Msg(message))

      // Only run if handled returns false boolean.
      if (typeof handled === 'boolean' && handled === false) message.reply(command.showHelpText(new Msg(message)))
    }
  }
})

client.on('guildCreate', guild => {
  if (!data().guilds[guild.id]) {
    cache().guilds[guild.id] = []
    saveData([{ guild: guild.id, action: 'addGuild' }])
    console.log(translate.addedGuild)
  }
})

client.on('guildDelete', guild => {
  if (data().guilds[guild.id]) {
    cache().guilds[guild.id] = undefined
    saveData([{ guild: guild.id, action: 'removeGuild' }])
    console.log(translate.removedGuild)
  }
})

client.once('ready', async () => {
  console.log(translate.loggedIntoDiscord)

  client.guilds.cache.forEach(guild => {
    if (!data().guilds[guild.id]) {
      saveData([{ guild: guild.id, action: 'addGuild' }])
    } else {
      if (!data().guilds[guild.id].reactions) saveData([{ guild: guild.id, entry: 'reactions', value: [] }])
      if (!data().guilds[guild.id].time) saveData([{ guild: guild.id, entry: 'time', value: { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } }])
      if (!data().guilds[guild.id].message) saveData([{ guild: guild.id, entry: 'message', value: '@everyone %name% **%status%**!' }])
      if (!data().guilds[guild.id].language) saveData([{ guild: guild.id, entry: 'language', value: settings.language || 'english' }])
    }
  })

  // Initialization of cache.
  const guildIDs = Object.keys(data().guilds)
  for (let index = 0; index < guildIDs.length; index++) {
    const guildID = guildIDs[index]
    const guild = data().guilds[guildID]
    cache().guilds[guildID] = []
    for (let i = 0; i < guild.streamers.length; i++) {
      const streamer = guild.streamers[i]
      cache().guilds[guildID].push({ name: streamer.name, streaming: false })
    }
  }

  // Starter
  setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
})

client.on('reconnecting', () => {
  console.log(translate.reconnectingToDiscord)
  disconnect = true
}).on('resume', () => {
  console.log(translate.reconnectedToDiscord)
  disconnect = false
}).on('disconnect', () => {
  disconnect = true
  client.login(settings.discord.token)
}).login(settings.discord.token).catch(e => console.log(e))

export default client
