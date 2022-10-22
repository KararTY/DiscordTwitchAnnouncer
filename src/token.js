import fs from 'fs'
import fetch from 'got'

import settings from './settings.js'
import translate from './translation.js'
import log from './logger.js'

const tokenFileLocation = new URL('../token.json', import.meta.url)

export let headers = {}
let tokenExpirationDate

export async function refreshAppToken () {
  let tokenJSON

  if (typeof tokenExpirationDate !== 'number' && fs.existsSync(tokenFileLocation)) {
    try {
      tokenJSON = JSON.parse(fs.readFileSync(tokenFileLocation))
      tokenExpirationDate = tokenJSON.expiration

      log(translate.usingExistingToken, new Date(tokenJSON.expiration).toUTCString())
      headers = {
        Authorization: `Bearer ${tokenJSON.superSecret}`,
        'Client-ID': settings.twitch.clientID
      }

      // Validate token
      try {
        const request = await fetch('https://id.twitch.tv/oauth2/validate', {
          headers: {
            Authorization: `OAuth ${tokenJSON.superSecret}`
          },
          responseType: 'json'
        })

        const res = request.body

        if (res.client_id !== settings.twitch.clientID) throw new Error('Missmatch')
      } catch (err) {
        if (err.message === 'Missmatch') log(translate.missmatchToken)
        log(translate.invalidTokenResponse)
        tokenExpirationDate = 0
      }
    } catch (e) {
      tokenExpirationDate = Date.now() - 1
    }
  }

  if (Date.now() >= (tokenExpirationDate || 0)) {
    try {
      const request = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${settings.twitch.clientID}&client_secret=${settings.twitch.clientSecret}&grant_type=client_credentials`, { method: 'POST', responseType: 'json' })

      const res = request.body

      const expirationDate = Date.now() + (res.expires_in * 1000)

      headers = {
        Authorization: `Bearer ${res.access_token}`,
        'Client-ID': settings.twitch.clientID
      }

      log(translate.wroteTokenToDisk)
      fs.writeFileSync(tokenFileLocation, JSON.stringify({
        expiration: expirationDate,
        superSecret: res.access_token
      }))

      tokenExpirationDate = expirationDate
    } catch (err) {
      log(translate.genericTokenError)
      console.error(err)
      return false
    }
  }

  return true
}
