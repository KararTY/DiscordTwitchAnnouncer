import fs from 'fs'
import util from 'util'
import settings from './settings.js'
import translate from './translation.js'

const logsDirLocation = new URL('../dta-logs', import.meta.url)

if (!fs.existsSync(logsDirLocation)) {
  fs.mkdirSync(logsDirLocation)
}

const logsLocation = new URL(`../dta-logs/logs-${Date.now()}.txt`, import.meta.url)

// Create logs.txt if it doesn't exist.
if (!fs.existsSync(logsLocation)) {
  fs.writeFileSync(logsLocation, '')
  console.log(translate.createdLogsFolder)
}

const logsWriter = fs.createWriteStream(logsLocation, 'utf-8')

export default function log (...args) {
  console.log(...args)
  if (settings.log) logsWriter.write(JSON.stringify(`[${Date.now()}] ${util.format(...args)}`) + '\r\n')
}

export function debugLog (...args) {
  if (settings.log) logsWriter.write(JSON.stringify(`[${Date.now()}] ${util.format(...args)}`) + '\r\n')
}
