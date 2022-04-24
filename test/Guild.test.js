import { Guild } from '../src/Guild.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const expect = chai.expect

describe('Guild object', function () {
  const guildObj = {
    id: '1234567890',
    default_announcement_channel: '1234567890',
    time: {
      locale: 'en-US',
      time_zone: 'Europe/Stockholm'
    },
    prefix: '!',
    language: 'english',
    operators: ['1234567890'],
    streamers: {
      '1': {
        message: '',
        announcement_channel: '1234567890',
        reactions: ['1234567890']
      }
    }
  }

  const guild = new Guild(guildObj)

  it('data should have the same initial defined fields', function () {
    expect(guild.data).to.be.deep.equal(guildObj)
  })

  // TODO add the rest of the tests
})
