const settings = require('./settings.js')
const Discord = require('discord.js')
// const Tmi = require('tmi.js')
const client = new Discord.Client()
const snekfetch = require('snekfetch')

if (!settings.discord.auth) throw new Error('No discord auth token has been provided.')
if (!settings.discord.announceChannel) throw new Error('No discord announce channel has been provided.')
if (!settings.twitch.clientID) throw new Error('No Twitch client token has been provided.')
if (!settings.twitch.channels) throw new Error('No Twitch channel(s) to check have been provided.')

let cache = {
  // users: []
}

let disconnect = false

/*
for (let i = 0; i < settings.twitch.channels.length; i++) {
  let element = settings.twitch.channels[i]
  snekfetch.get('https://api.twitch.tv/kraken/users/' + element).set({
    'Client-ID': settings.twitch.clientID
  }).then(res => {
    cache.users.push(res.body['_id'])
    console.log(res.body['_id'])
  })
}
*/

client.once('ready', () => {
  console.log('Logged into Discord.')
  setInterval(() => {
    if (disconnect) return console.log('Seems Discord is disconnected. Will not post update.')
    for (let i = 0; i < settings.twitch.channels.length; i++) {
      let element = settings.twitch.channels[i]
      snekfetch.get('https://api.twitch.tv/kraken/streams/' + element).set({
        'Client-ID': settings.twitch.clientID
      }).then(res => {
        if (res.body.stream) {
          if (cache[element]) return
          // Post to discord.
          cache[element] = true
          let embed = new Discord.RichEmbed()
            .setColor(0xAB0DE3)
            .setTitle(`${res.body.stream.channel['display_name']} is live!`)
            .setDescription(`**${res.body.stream.channel.status}**\n${res.body.stream.channel.game}`)
            .setImage(res.body.stream.preview.large)
            .setFooter('Discord Twitch Announcer', res.body.stream.channel.logo)
            .setURL(res.body.stream.channel.url)
          client.channels.get(settings.discord.announceChannel).send(`@everyone ${res.body.stream.channel.url}`, {embed})
        } else cache[element] = false
      }).catch(e => console.log(e))
    }
  }, typeof settings.timer === 'number' ? settings.timer : 120000)
}).on('reconnecting', () => {
  console.log('Reconnecting to Discord...')
  disconnect = true
}).on('resume', () => {
  console.log('Reconnected to Discord. All functional.')
  disconnect = false
}).on('disconnect', () => {
  throw new Error("Couldn't connect to Discord after multiple retries. Check your connection and relaunch.")
}).login(settings.discord.auth).catch(e => console.log(e))
