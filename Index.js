import sqlite from 'better-sqlite3';
import { loadSettings } from './src/Settings.js'

// Load settings.
const settings = await loadSettings()

console.log(settings)

// Load sqlite3 db.

// Load commands

// Load Discord stuff (Discord is provided by a cancer company).

// Future stuff: Delete this bot, and create a Webhooks service instead.
