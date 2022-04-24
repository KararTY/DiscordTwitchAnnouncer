import { fileExists, loadJSONFile, getMetaFileName } from '../src/File.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

const expect = chai.expect

// ############## JSON File Loading
describe('JSON file loading', function () {
  it("should reject on a file that doesn't exist", async function () {
    const nonExistentFileLocation = new URL('./doesNotExist.json', import.meta.url)
    await expect(loadJSONFile(nonExistentFileLocation)).to.eventually.be.rejected
  })

  const jsonFileLocation = new URL('./settings.json', import.meta.url)

  it('should not reject on a file that does exist', async function () {
    await expect(loadJSONFile(jsonFileLocation)).to.eventually.be.fulfilled
  })

  it('file should be returned as JSON', async function () {
    const jsonFile = await loadJSONFile(jsonFileLocation)
    expect(typeof jsonFile).to.be.equal('object')
  })

  it('should error on a non-JSON file', async function () {
    const strFileLocation = new URL('./test.txt', import.meta.url)

    await expect(loadJSONFile(strFileLocation)).to.eventually.be.rejectedWith({
      name: 'SyntaxError',
      message: 'Unexpected token H in JSON at position 0'
    })
  })
})

// ############## File checking
describe('File checking', function () {
  const wrongFileLocation = new URL('./doesNotExist.example', import.meta.url)
  const fileDoesNotExist = fileExists(wrongFileLocation)

  it("should not reject on a file that doesn't exist", async function () {
    await expect(fileDoesNotExist).to.eventually.be.fulfilled
  })

  it("should return false on a file that doesn't exist", async function () {
    await expect(fileDoesNotExist).to.eventually.be.equal(false)
  })

  it('should return true on a file that does exist', async function () {
    const fileLocation = new URL('./test.txt', import.meta.url)
    const fileDoesExist = fileExists(fileLocation)

    await expect(fileDoesExist).to.eventually.be.equal(true)
  })
})
