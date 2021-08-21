const pRetry = require('p-retry')
const md5 = require('md5')

const { queue } = require('../helpers/queue')

const { Fights } = require('../models')

const BULK_INSERT_RETRIES = 10

const start = async () => {
  const itemQueue = queue('fight')

  const insertBatch = async (fights, done) => {
    if (!Fights) return

    const bulk = Fights.collection.initializeUnorderedBulkOp()

    fights.forEach((fight, i) => {
      const hash = md5(JSON.stringify(fights))
      fight.hash = hash
      bulk
        .find({ hash })
        .upsert()
        .replaceOne(fight)
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: BULK_INSERT_RETRIES })

      console.log(
        '[FIGHT PROCESSED]',
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
