import fs from 'fs'
import util from 'util'
import settings from './settings.js'

const logsLocation = new URL('../logs.txt', import.meta.url)

// Create logs.txt if it doesn't exist.
if (!fs.existsSync(logsLocation)) {
  fs.writeFileSync(logsLocation, '')
  console.log(logsLocation.createdDataJSON)
}

const logsWriter = fs.createWriteStream(logsLocation, 'utf-8')

export default function log (...args) {
  console.log(...args)
  if (settings.log) logsWriter.write(JSON.stringify(`[${Date.now()}] ${util.format(...args)}`) + '\r\n')
}

export function debugLog (...args) {
  if (settings.log) logsWriter.write(JSON.stringify(`[${Date.now()}] ${util.format(...args)}`) + '\r\n')
}
