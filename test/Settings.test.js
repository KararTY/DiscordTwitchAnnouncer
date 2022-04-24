import { loadSettings } from '../src/Settings.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const expect = chai.expect

const settings = await loadSettings()

describe('Settings', function () {
  it('should return type object', function () {
    expect(typeof settings).to.be.equal('object')
  })

  it('object should have property named version of type string', function () {
    expect(typeof settings.version).to.be.equal('string')
  })
})
