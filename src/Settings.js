import { loadJSONFile } from './File.js'

export function loadSettings () {
  return loadJSONFile(new URL('../settings.json', import.meta.url))
}
