import fetch from 'got'

import settings from './settings.js'
import client, { disconnect } from './client.js'
import data, { cache, saveData } from './data.js'
import { headers, refreshAppToken } from './token.js'
import translate from './translation.js'
import { sendMessage } from './message.js'

// https://stackoverflow.com/a/55435856
function chunks (arr, n) {
  function * ch (arr, n) {
    for (let i = 0; i < arr.length; i += n) {
      yield (arr.slice(i, i + n))
    }
  }

  return [...ch(arr, n)]
}

export async function check () {
  try {
    data() // Try loading data.
  } catch (err) {
    console.log(translate.genericDataJSONErrorRetry)
    setTimeout(check, 60000)
    return console.error(err)
  }

  if (disconnect) {
    setTimeout(check, 3000)
    return console.log(translate.disconnectedDiscord)
  }

  const continueBoolean = await refreshAppToken()
  if (!continueBoolean) {
    setTimeout(check, 3000)
    return
  }

  const streamersMap = new Map()

  const guildIDs = Object.keys(data().guilds)
  for (let i = 0; i < guildIDs.length; i++) {
    const guildID = guildIDs[i]
    if (client.guilds.cache.find(i => i.id === guildID) && data().guilds[guildID].streamers) data().guilds[guildID].streamers.forEach(stream => streamersMap.set(stream.name, stream.streamerId))
  }

  const streamersArr = []
  for (const [name, id] of streamersMap) {
    streamersArr.push({ name, id })
  }

  if (streamersArr.length < 1) {
    setTimeout(check, typeof settings.timer === 'number' ? settings.timer + 5000 : 61000)
    return console.log(translate.noTwitchChannels)
  }

  try {
    const batches = chunks(streamersArr, 100)
    const resData = []
    for (let index = 0; index < batches.length; index++) {
      const batch = batches[index]
      const request = await fetch(
        `https://api.twitch.tv/helix/streams?${batch.map((i, ind) => {
          const sym = ind > 0 ? '&' : ''
          if (i.id) {
            return sym + 'user_id=' + i.id
          } else {
            return sym + 'user_login=' + i.name
          }
        }).join('')
        }`,
        { headers, responseType: 'json' }
      )
      const response = request.body

      if (response.error) throw response
      else resData.push(...response.data)
    }

    const streams = []
    for (let i = 0; i < resData.length; i++) {
      const stream = resData[i]

      const request = await fetch(`https://api.twitch.tv/helix/users/?id=${stream.user_id}`, { headers, responseType: 'json' })

      let user
      try {
        user = request.body.data[0]
      } catch (error) {
        console.error(error)
        user = {
          profile_image_url: 'https://static-cdn.jtvnw.net/emoticons/v2/80393/default/dark/3.0'
        }
      }

      streams.push({
        name: stream.user_name.replace(/ /g, ''),
        streamerId: user.id,
        avatar: user ? user.profile_image_url : null,
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
      const games = [...new Set(streams.filter(s => s.gameID).map(s => s.gameID))]
      const gamesChunk = chunks(games, 100)
      for (let index = 0; index < gamesChunk.length; index++) {
        const batch = gamesChunk[index]
        promise.push(fetch(`https://api.twitch.tv/helix/games?${batch.map((i, ind) => ind > 0 ? '&id=' + i : 'id=' + i).join('')}`, { headers, responseType: 'json' }))
      }

      for (let index = 0; index < streams.length; index++) {
        const s = streams[index]
        const imageName = s.thumbnail
        const res = await fetch(s.thumbnail, { responseType: 'buffer' })
        cachedImages[imageName] = res.body
      }
    }

    let streamedGames

    try {
      const requests = await Promise.all(promise)
      streamedGames = requests.map(req => req.body)
    } catch (error) {
      console.error(error)
    }

    const announcements = []
    for (let index = 0; index < guildIDs.length; index++) {
      const guildID = guildIDs[index]
      if (data().guilds[guildID].announcementChannel) {
        for (let i = 0; i < cache().guilds[guildID].length; i++) {
          if (streams.map(s => s.name.toLowerCase()).includes(cache().guilds[guildID][i].name ? cache().guilds[guildID][i].name.toLowerCase() : '')) {
            // Make sure this specific stream hasn't been already announced.
            const isStreaming = cache().guilds[guildID][i].streaming
            const started = streams.find(s => s.name.toLowerCase() === cache().guilds[guildID][i].name.toLowerCase()).started
            const lastStartedAt = data().guilds[guildID].streamers.find(s => s.name.toLowerCase() === cache().guilds[guildID][i].name.toLowerCase()).lastStartedAt

            if (!isStreaming && new Date(started).getTime() > new Date(lastStartedAt || 0).getTime()) {
              // Push info.
              const streamInfo = streams.find(s => s.name.toLowerCase() === cache().guilds[guildID][i].name.toLowerCase())
              const gameInfo = (streamedGames[0] && streamedGames[0].data) ? streamedGames[0].data.find(g => g.id === streamInfo.gameID) : undefined

              cache().guilds[guildID][i] = streamInfo
              cache().guilds[guildID][i].game = gameInfo
              cache().guilds[guildID][i].streaming = true

              const streamers = data().guilds[guildID].streamers
              streamers[i].lastStartedAt = cache().guilds[guildID][i].started
              streamers[i].streamerId = streamInfo.streamerId
              saveData([{ guild: guildID, entry: 'streamers', value: streamers }])

              const streamerInfo = data().guilds[guildID].streamers[i]

              // Batch announcements.
              // Check for cooldown between streams.
              if (new Date(started).getTime() > (new Date(lastStartedAt || 0).getTime() + settings.cooldownTimer)) {
                announcements.push(sendMessage(guildID, streamerInfo, { cachedImage: cachedImages[cache().guilds[guildID][i].thumbnail], streamInfo, gameInfo }))
              }
            }
          } else cache().guilds[guildID][i].streaming = false // Not live.
        }
      }
    }

    await Promise.all(announcements) // Send announcements.

    if (announcements.length > 0) console.log(translate.announcedStreams)
    setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
  } catch (e) {
    if (e.error === 'Too Many Requests') {
      settings.timer += 5000
      setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
      return console.log(translate.throttledByTwitch, translate.twitchThrottleMessage, e.message)
    } else {
      settings.timer += 60000
      setTimeout(check, typeof settings.timer === 'number' ? settings.timer : 61000)
      return console.error(e)
    }
  }
}
