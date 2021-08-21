const pRetry = require('p-retry')

const { queue } = require('../helpers/queue')

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

      console.log(
        '[TRANSACTION PROCESSED]',
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
