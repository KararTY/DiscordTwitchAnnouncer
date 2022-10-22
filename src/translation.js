import fs from 'fs'

const i18DirLocation = new URL('../i18n', import.meta.url)

export const translations = {}
const translationsDir = fs.readdirSync(i18DirLocation)
translationsDir.forEach(i => {
  const name = i.replace('.json', '')
  translations[name] = JSON.parse(fs.readFileSync(new URL(i18DirLocation.toString() + '/' + i)))
})
const translate = translations.english

// Prototypal. Good for now.
export function translateDefault (language) {
  const result = {}
  const lang = translations[language]
  const english = translate

  Object.keys(english).forEach(i => {
    result[i] = JSON.parse(JSON.stringify(english[i]))
    if (lang[i]) result[i] = JSON.parse(JSON.stringify(lang[i]))
  })

  Object.keys(english.commands).forEach(i => {
    result.commands[i] = JSON.parse(JSON.stringify(english.commands[i]))
    if (lang.commands[i]) result.commands[i] = JSON.parse(JSON.stringify(lang.commands[i]))

    Object.keys(english.commands[i]).forEach(ii => {
      result.commands[i][ii] = JSON.parse(JSON.stringify(english.commands[i][ii]))
      if (lang.commands[i] && lang.commands[i][ii]) result.commands[i][ii] = JSON.parse(JSON.stringify(lang.commands[i][ii]))
    })
  })

  return result
}

export default translate
