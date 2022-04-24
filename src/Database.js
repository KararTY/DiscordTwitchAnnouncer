/// <reference path="../types.d.ts"/>

import Sqlite from 'better-sqlite3'
import { fileExists } from './File.js'

export class Database {
  /**
   * @type {Donk.DB}
   */
  connection = null
  verbose = false

  constructor(verbose) {
    this.verbose = verbose || false
  }

  async loadDb(path, create) {
    if (create) {
      const doNotContinue = await fileExists(path)
      if (doNotContinue) throw new Error('Database at given path exists already.')
    }

    const db = new Sqlite(path, { fileMustExist: create ? false : true, verbose: this.verbose ? console.log : undefined })


    this.connection = db

    if (create) {
      return true
    }
  }

  createStreamersTable() {
    const statement = this.connection.prepare(`CREATE TABLE IF NOT EXISTS streamers (
      id TEXT PRIMARY KEY,
      username VARCHAR(32) NOT NULL,
      last_stream INTEGER
    )`)

    return statement.run()
  }

  upsertStreamer(data) {
    const statement = this.connection.prepare(`INSERT OR REPLACE INTO streamers VALUES ($id, $username, $last_stream)`)

    return statement.run(data)
  }

  getStreamerById(id) {
    const statement = this.connection.prepare(`SELECT * FROM streamers WHERE id = ?`)

    return statement.get(id)
  }

  getStreamers(iterate = false) {
    const statement = this.connection.prepare(`SELECT * FROM streamers`)

    if (iterate) {
      return statement.iterate()
    } else {
      return statement.all()
    }
  }
}
