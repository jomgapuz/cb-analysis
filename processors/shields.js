const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const multicall = require('../helpers/multicall')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Shields } = require('../models')

const MULTICALL_RETRIES = 10
const BULK_INSERT_RETRIES = 10

const start = async () => {
  const address = web3Helper.getShieldsAddress()

  const itemQueue = queue(`items-${web3Helper.getTypeName(address)}`)

  const insertBatch = async (items, done) => {
    const idKey = web3Helper.getIdKey(address)
    if (!Shields || !idKey) return

    const multicallData = web3Helper.getNFTDataCall(address, items.map((item) => item.nftId))

    const data = await pRetry(() => multicall(web3Helper.getWeb3(), multicallData.abi, multicallData.calls), { retries: MULTICALL_RETRIES })

    const bulk = Shields.collection.initializeUnorderedBulkOp()

    items.forEach(async (item, i) => {
      const block = await web3Helper.getBlock(item.blockNumber)
      let ownerAddress = web3Helper.getDefaultAddress()
      try {
        ownerAddress = await web3Helper.getNFTOwner(address, item.nftId)
      } catch (e) {}
      bulk
        .find({ [idKey]: item.nftId })
        .upsert()
        .replaceOne(
          web3Helper.processNFTData(address, item.nftId, ownerAddress, block, data[i])
        )
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: BULK_INSERT_RETRIES })

      logger('success', 'shield', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'shield', 'processor', e.message)
    }
    await start()
  }

  itemQueue.process(5, async (job, done) => {
    logger('info', 'shield', 'processor', `Doing job #${job.id}`)
    await insertBatch(job.data, done)
  })
}

start()
