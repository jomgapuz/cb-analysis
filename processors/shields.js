const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const multicall = require('../helpers/multicall')
const { queue } = require('../helpers/queue')

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

    items.forEach((item, i) => {
      bulk
        .find({ [idKey]: item.nftId })
        .upsert()
        .replaceOne(
          web3Helper.processNFTData(address, item.nftId, item.seller, data[i])
        )
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: BULK_INSERT_RETRIES })

      console.log(
          `[${web3Helper.getTypeName(address).toUpperCase()} PROCESSED]`,
          bulkResult.nUpserted + bulkResult.nModified
      )
      done()
    } catch (e) {
      console.log(e)
    }
    await start()
  }

  itemQueue.process(async (job, done) => {
    await insertBatch(job.data, done)
  })
}

start()
