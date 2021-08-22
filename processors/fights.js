const pRetry = require('p-retry')
const md5 = require('md5')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Fights } = require('../models')

const BULK_INSERT_RETRIES = 10

const start = async () => {
  const itemQueue = queue('fight')

  const insertBatch = async (fights, done) => {
    if (!Fights) return

    const bulk = Fights.collection.initializeUnorderedBulkOp()

    fights.forEach(async (fight, i) => {
      const block = await web3Helper.getBlock(fight.blockNumber)
      const { number, timestamp } = block
      const hash = md5(JSON.stringify(fights))
      fight.hash = hash
      fight.blockNumber = number
      fight.timestamp = timestamp
      bulk
        .find({ hash })
        .upsert()
        .replaceOne(fight)
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: BULK_INSERT_RETRIES })

      logger('success', 'fight', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'fight', 'processor', e.message)
    }
    await start()
  }

  itemQueue.process(5, async (job, done) => {
    logger('info', 'fight', 'processor', `Doing job #${job.jobId}`)
    await insertBatch(job.data, done)
  })
}

start()
