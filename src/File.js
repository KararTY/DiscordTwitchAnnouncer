import fs from 'fs/promises'

export async function loadJSONFile (path) {
  const fileStr = await fs.readFile(path, 'utf-8')

  return JSON.parse(fileStr)
}

export async function fileExists (path) {
  try {
    await fs.readFile(path)
    return true
  } catch (_) {
    return false
  }
}

export function getMetaFileName (path) {
  return new URL(path).pathname.split('/').pop()
}
