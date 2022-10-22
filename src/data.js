import fs from 'fs'

import translate from './translation.js'
import settings from './settings.js'
import { debugLog } from './logger.js'

const fileLocation = new URL('../data.json', import.meta.url)

// Create data.json if it doesn't exist.
if (!fs.existsSync(fileLocation)) {
  fs.writeFileSync(fileLocation, JSON.stringify({ guilds: {} }, null, 2))
  console.log(translate.createdDataJSON)
}

const cacheData = loadData()

export function loadData () {
  return JSON.parse(fs.readFileSync(fileLocation, 'utf-8'))
}

// [{ guild: id, entry: 'entry', value: 'value'}]
export function saveData (d = [{ guild: '', entry: '', action: '', value: 'any' }]) {
  const dataOnFile = JSON.parse(fs.readFileSync(fileLocation))
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
          // Default guild data.
          dataOnFile.guilds[object.guild] = {
            streamers: [],
            announcementChannel: null,
            reactions: [],
            message: '@everyone %name% **%status%**!',
            time: { locale: Intl.DateTimeFormat().resolvedOptions().locale, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            language: settings.language || 'english'
          }
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

  cacheData.guilds = dataOnFile.guilds
  debugLog(`Writing to data.json file: ${JSON.stringify(d)}`)

  return fs.writeFileSync(fileLocation, JSON.stringify(dataOnFile, null, 2))
}

const c = {
  guilds: []
}

export const cache = () => c

export const data = () => cacheData

export default data
