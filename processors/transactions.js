const pRetry = require('p-retry')

const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Transactions } = require('../models')

const BULK_INSERT_RETRIES = 10

const start = async () => {
  const itemQueue = queue('transaction')

  const insertBatch = async (items, done) => {
    if (!Transactions) return

    const bulk = Transactions.collection.initializeUnorderedBulkOp()

    items.forEach((item, i) => {
      bulk
        .find({ hash: item.hash })
        .upsert()
        .replaceOne(item)
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: BULK_INSERT_RETRIES })

      logger('success', 'trans', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'trans', 'processor', e.message)
    }
    await start()
  }

  itemQueue.process(async (job, done) => {
    await insertBatch(job.data, done)
  })
}

start()
