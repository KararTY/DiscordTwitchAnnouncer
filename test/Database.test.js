import fs from 'fs/promises'

import { Database } from '../src/Database.js'
import { Streamer } from '../src/Streamer.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const expect = chai.expect

describe('Database Tests', function () {
  const db = new Database(true)

  const testDbLocation = './test/test.db'

  it('should create a Database class.', function () {
    expect(db instanceof Database).to.be.equal(true)
  })

  it("should reject on a file that doesn't exist.", async function () {
    const wrongDbLocation = './test/doesNotExist.db'
    await expect(db.loadDb(wrongDbLocation)).to.eventually.be.rejected
  })

  const existsFileLocation = './test/exists.db'

  it('should not reject on a file that does exist.', async function () {
    await expect(db.loadDb(existsFileLocation)).to.eventually.be.equal()
  })

  it('should reject when db file exists if second parameter (create) is truthy.', async function () {
    await expect(db.loadDb(existsFileLocation, true)).to.eventually.be.rejectedWith('Database at given path exists already.')
  })

  it('should create a new db file when second parameter (create) is truthy.', async function () {
    await fs.rm(new URL('../' + testDbLocation, import.meta.url)).catch(() => undefined).catch()
    const dbConn = db.loadDb(testDbLocation, true)
    await expect(dbConn).to.eventually.be.equal(true)

    describe('database functions', async function () {
      it('successfully creates streamers table', function () {
        const createStreamersTable = db.createStreamersTable()
        expect(createStreamersTable).to.be.deep.equal({ changes: 0, lastInsertRowid: 0 })
      })

      const streamerObj = {
        id: '1234567',
        username: 'test',
        last_stream: Date.now()
      }
      const streamer = new Streamer(streamerObj)

      it('should insert a new streamer', function () {
        const insertIntoStreamersTable = db.upsertStreamer(streamer.data)

        expect(insertIntoStreamersTable).to.be.deep.equal({ changes: 1, lastInsertRowid: 1 })
      })

      it('should update existing user row', function () {
        streamer.username = 'new_username'
        streamer.lastStream = Date.now()
        const upsertIntoStreamersTable = db.upsertStreamer(streamer.data)

        expect(upsertIntoStreamersTable).to.be.deep.equal({ changes: 1, lastInsertRowid: 2 })
      })

      it('should get streamer by id', function () {
        const getStreamerById = db.getStreamerById(streamer.id)

        expect(getStreamerById).to.be.deep.equal(streamer.data)
      })

      const streamer2Obj = {
        id: '7654321',
        username: 'test2',
        last_stream: Date.now()
      }

      const streamer2 = new Streamer(streamer2Obj)

      it('should be able to insert another streamer', function () {
        const upsertIntoStreamersTable = db.upsertStreamer(streamer2.data)

        expect(upsertIntoStreamersTable).to.be.deep.equal({ changes: 1, lastInsertRowid: 3 })
      })

      it('should get all streamers', function () {
        const getStreamers = db.getStreamers()

        expect(getStreamers).to.be.deep.equal([streamer.data, streamer2.data])
      })

      it('should get all streamers as an iterable when first parameter (iterate) is true.', function () {
        const getStreamersIterator = db.getStreamers(true)

        expect(Symbol.iterator in getStreamersIterator).to.be.equal(true)

        getStreamersIterator.return()
      })

        // const str = test + 'Database.'
  // // Get guild (Discord)
  // // - id
  // // - default_announcement_channel (string)
  // // - streamers
  // // - - message (string)
  // // - - announcement_channel (string id)
  // // - reactions (array of string ids)
  // // - time (object)
  // // - - locale (string)
  // // - - time_zone (string)
  // // - prefix (string)
  // // - language (string)
  // // - operators (array of string ids)

      after(function () {
        db.connection.close()
      })
    })
  })

})

