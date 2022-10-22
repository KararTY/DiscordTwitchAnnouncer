
import Discord from 'discord.js'
import moment from 'moment-timezone'

import client from './client.js'
import data from './data.js'
import translate, { translateDefault } from './translation.js'

export class Msg {
  /**
   * @param {Discord.Message} message
   */
  constructor (message) {
    this.cmd = message.content.replace(new RegExp(`^<@${message.client.user.id}>`), '').trim().split(/[ ]+/)
    this.discord = message
    this.gid = message.guild.id
  }
}

export function streamPreviewEmbed (guildID, { imageFileName, streamInfo, gameInfo }) {
  const embed = new Discord.EmbedBuilder()
    .setColor(0x6441A4)
    .setTitle(`[${streamInfo.type.toUpperCase()}] ${streamInfo.name}`)
    .setDescription(`**${streamInfo.title}**\n${gameInfo ? gameInfo.name : ''}`)
    .setFooter({
      text: translateDefault(data().guilds[guildID].language).streamStarted.concat(moment.utc(streamInfo.started).locale(data().guilds[guildID].time.locale).tz(data().guilds[guildID].time.timeZone).format('LL LTS zz')),
      iconURL: gameInfo ? gameInfo.box_art_url.replace('{width}x{height}', '32x64') : undefined
    })
    .setURL(`http://www.twitch.tv/${streamInfo.name}`)

  if (streamInfo.avatar) embed.setThumbnail(streamInfo.avatar)
  if (imageFileName) embed.setImage(`attachment://${imageFileName}`)
  return embed
}

function parseAnnouncementMessage (guildID, { streamInfo, gameInfo }) {
  const streamer = data().guilds[guildID].streamers.find(s => s.name === streamInfo.name.toLowerCase())
  let message = (streamer && streamer.message && streamer.message.length > 0) ? streamer.message : data().guilds[guildID].message

  if (!message.includes('%link%')) message += ` http://www.twitch.tv/${streamInfo.name}`

  return message
    .replace('%name%', streamInfo.name)
    .replace('%status%', streamInfo.type.toUpperCase())
    .replace('%game%', gameInfo ? gameInfo.name : translate.unknownGame)
    .replace('%title%', streamInfo.title)
    .replace('%link%', `http://www.twitch.tv/${streamInfo.name}`)
}

export async function sendTestMessage (translate, message, streamer = 'twitchdev') {
  const test = {
    gameInfo: {
      name: translate.commands.add.gameInfoName,
      box_art_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Science%20&%20Technology-{width}x{height}.jpg'
    },
    streamInfo: {
      name: streamer,
      avatar: 'https://brand.twitch.tv/assets/images/twitch-extruded.png',
      type: translate.commands.add.streamInfoType,
      title: translate.commands.add.streamInfoTitle
    }
  }

  try {
    const embed = streamPreviewEmbed(message.gid, { ...test, imageFileName: null })
    embed.setImage('https://static-cdn.jtvnw.net/ttv-static/404_preview-1920x1080.jpg')
    await message.discord.channel.send({ content: parseAnnouncementMessage(message.gid, test), embeds: [embed] })
  } catch (err) {
    if (err.message !== 'Missing Permissions') {
      await message.discord.channel.send(parseAnnouncementMessage(message.gid, test))
    }
  }
}

export async function sendMessage (guildID, streamerInfo, { cachedImage, streamInfo, gameInfo }) {
  const imageFileName = `${streamInfo.name}_${Date.now()}.jpg`

  const embed = streamPreviewEmbed(guildID, { imageFileName, streamInfo, gameInfo })

  const announcementChannel = streamerInfo.announcementChannel || data().guilds[guildID].announcementChannel
  if (client.channels.cache.get(announcementChannel)) {
    let message
    const parsedAnnouncementMessage = parseAnnouncementMessage(guildID, { streamInfo, gameInfo })
    const attachment = new Discord.AttachmentBuilder(cachedImage, { name: imageFileName })
    try {
      message = await client.channels.cache.get(announcementChannel).send({
        content: parsedAnnouncementMessage,
        embeds: [embed],
        files: [attachment]
      })
    } catch (err) {
      if (err.message === 'Missing Permissions') {
        message = await client.channels.cache.get(announcementChannel).send(parsedAnnouncementMessage)
      } else console.error(err.name, err.message, err.code, translate.inGuild.concat(client.guilds.cache.get(guildID).name))
    }

    if (data().guilds[guildID].reactions.length > 0) {
      for (let index = 0; index < data().guilds[guildID].reactions.length; index++) {
        const emoji = data().guilds[guildID].reactions[index]
        try {
          if (Number.isInteger(Number(emoji))) await message.react(message.guild.emojis.cache.get(emoji))
          else await message.react(emoji)
        } catch (err) {
          console.error(err.name, err.message, err.code, `in guild ${client.guilds.cache.get(guildID).name}`)
        }
      }
    }

    console.log(translate.announcedInOverAtGuild, streamInfo.name, client.channels.cache.get(announcementChannel).name, client.guilds.cache.get(guildID).name)
  } else console.log(translate.announcementChannelDoesNotExist, announcementChannel, client.guilds.cache.get(guildID).name)

  return Promise.resolve()
}
