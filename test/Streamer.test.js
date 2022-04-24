import { Streamer } from '../src/Streamer.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const expect = chai.expect

describe('Streamer object', function () {
  const streamerObj = {
    id: '1234567',
    username: 'test',
    last_stream: Date.now()
  }
  
  const streamer = new Streamer(streamerObj)

  it('.data should have the same initial defined fields', function () {
    expect(streamer.data).to.be.deep.equal(streamerObj)
  })

  it('.id should be of type string', function () {
    expect(typeof streamer.id).to.be.equal('string')
  })

  it('.username should be of type string', function () {
    expect(typeof streamer.username).to.be.equal('string')
  })

  it('.lastStream should be of type number', function () {
    expect(typeof streamer.lastStream).to.be.equal('number')
  })

  it('.lastStream should have same value as the initial defined field', function () {
    expect(streamer.lastStream).to.be.equal(streamerObj.last_stream)
  })

  it('.lastStream setter should be able to change lastStream', function () {
    const time = Date.now() + 10000
    streamer.lastStream = time

    expect(streamer.lastStream).to.be.equal(time)
  })

  it('.username setter should be able to change username', function () {
    const newUsername = 'test_name'

    streamer.username = newUsername

    expect(streamer.username).to.be.equal(newUsername)
  })
})
